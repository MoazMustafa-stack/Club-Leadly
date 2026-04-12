from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from ..database import get_db
from ..dependencies import CurrentUser, get_current_user, require_organiser
from ..models import Membership, PointLog, Task, TaskStatusEnum, User
from ..schemas import CreateTaskRequest, TaskResponse, UpdateTaskRequest

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _require_club(current_user: CurrentUser) -> UUID:
    """Return club_id or raise 400 if user is not in a club."""
    if current_user.club_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in a club",
        )
    return current_user.club_id


def _task_to_response(task: Task, assigned_name: str | None) -> TaskResponse:
    """Convert a Task ORM object + resolved name into a TaskResponse."""
    return TaskResponse(
        id=task.id,
        club_id=task.club_id,
        title=task.title,
        description=task.description,
        assigned_to_user_id=task.assigned_to_user_id,
        assigned_to_name=assigned_name,
        point_value=task.point_value,
        status=task.status.value if isinstance(task.status, TaskStatusEnum) else task.status,
        due_at=task.due_at,
        created_at=task.created_at,
    )


AssignedUser = aliased(User)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: CreateTaskRequest,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task. Organiser only."""
    club_id = _require_club(current_user)

    assigned_name: str | None = None
    if body.assigned_to_user_id:
        mem = await db.execute(
            select(Membership).where(
                Membership.club_id == club_id,
                Membership.user_id == body.assigned_to_user_id,
            )
        )
        if mem.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a member of this club",
            )
        user_result = await db.execute(
            select(User.full_name).where(User.id == body.assigned_to_user_id)
        )
        assigned_name = user_result.scalar_one_or_none()

    due_at = body.due_at
    if due_at is not None and due_at.tzinfo is not None:
        due_at = due_at.replace(tzinfo=None)

    task = Task(
        club_id=club_id,
        title=body.title,
        description=body.description,
        point_value=body.point_value,
        assigned_to_user_id=body.assigned_to_user_id,
        due_at=due_at,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _task_to_response(task, assigned_name)


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tasks in the current club.

    Organiser: all tasks, ordered by created_at DESC.
    Member: only tasks assigned to them, ordered by due_at ASC NULLS LAST.
    """
    club_id = _require_club(current_user)

    query = (
        select(Task, AssignedUser.full_name)
        .outerjoin(AssignedUser, Task.assigned_to_user_id == AssignedUser.id)
        .where(Task.club_id == club_id)
    )

    if current_user.role == "organiser":
        query = query.order_by(Task.created_at.desc())
    else:
        query = query.where(
            Task.assigned_to_user_id == current_user.user_id
        ).order_by(Task.due_at.asc().nulls_last())

    result = await db.execute(query)
    return [_task_to_response(task, name) for task, name in result.all()]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task by ID (must belong to current club).

    Members can only view tasks assigned to them.
    """
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task, AssignedUser.full_name)
        .outerjoin(AssignedUser, Task.assigned_to_user_id == AssignedUser.id)
        .where(Task.id == task_id, Task.club_id == club_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task, assigned_name = row
    if current_user.role != "organiser" and task.assigned_to_user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this resource",
        )
    return _task_to_response(task, assigned_name)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: UpdateTaskRequest,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Update a task. Organiser only."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.club_id == club_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = body.model_dump(exclude_unset=True)
    if "assigned_to_user_id" in update_data and update_data["assigned_to_user_id"]:
        mem = await db.execute(
            select(Membership).where(
                Membership.club_id == club_id,
                Membership.user_id == update_data["assigned_to_user_id"],
            )
        )
        if mem.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a member of this club",
            )

    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    # Resolve assigned_to_name
    assigned_name: str | None = None
    if task.assigned_to_user_id:
        name_result = await db.execute(
            select(User.full_name).where(User.id == task.assigned_to_user_id)
        )
        assigned_name = name_result.scalar_one_or_none()

    return _task_to_response(task, assigned_name)


@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task. Organiser only. Cannot delete completed tasks."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.club_id == club_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.status == TaskStatusEnum.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a completed task",
        )
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}


@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a task as completed. Only the assigned member can call this.

    Atomically: sets status to completed, inserts a PointLog, and increments
    the member's total_points.
    """
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.club_id == club_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    is_assignee = task.assigned_to_user_id == current_user.user_id
    is_organiser = current_user.role == "organiser"
    if not is_assignee and not is_organiser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This task is not assigned to you",
        )

    if task.status == TaskStatusEnum.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already completed",
        )

    # Atomic: status + point log + membership points
    task.status = TaskStatusEnum.completed

    # Credit points to the assignee if present, otherwise the completer
    credit_user_id = task.assigned_to_user_id or current_user.user_id

    mem_result = await db.execute(
        select(Membership).where(
            Membership.club_id == club_id,
            Membership.user_id == credit_user_id,
        )
    )
    membership = mem_result.scalar_one_or_none()
    if membership:
        membership.total_points += task.point_value
        db.add(PointLog(
            club_id=club_id,
            user_id=credit_user_id,
            delta=task.point_value,
            reason=f"Completed task: {task.title}",
        ))

    await db.commit()
    await db.refresh(task)

    # Resolve assigned_to_name
    assigned_name: str | None = None
    if task.assigned_to_user_id:
        name_result = await db.execute(
            select(User.full_name).where(User.id == task.assigned_to_user_id)
        )
        assigned_name = name_result.scalar_one_or_none()

    return _task_to_response(task, assigned_name)
