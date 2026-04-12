from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import CurrentUser, get_current_user, require_organiser
from ..models import Membership, PointLog, Task, TaskStatusEnum
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


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: CreateTaskRequest,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task. Organiser only."""
    club_id = _require_club(current_user)

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
                detail="Assigned user is not a member of this club",
            )

    task = Task(
        club_id=club_id,
        title=body.title,
        description=body.description,
        point_value=body.point_value,
        assigned_to_user_id=body.assigned_to_user_id,
        due_at=body.due_at,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tasks in the current club."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task)
        .where(Task.club_id == club_id)
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task by ID (must belong to current club)."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.club_id == club_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


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
                detail="Assigned user is not a member of this club",
            )

    for field, value in update_data.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(require_organiser),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task. Organiser only."""
    club_id = _require_club(current_user)
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.club_id == club_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await db.delete(task)
    await db.commit()


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a task as completed. The assigned member or any organiser can call this.

    Automatically awards the task's point_value to the assigned user and logs it.
    """
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
            detail="Task already completed",
        )

    is_organiser = current_user.role == "organiser"
    is_assigned = task.assigned_to_user_id == current_user.user_id
    if not is_organiser and not is_assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned member or an organiser can complete this task",
        )

    task.status = TaskStatusEnum.completed

    # Award points to the assigned user (if one exists)
    if task.assigned_to_user_id:
        mem_result = await db.execute(
            select(Membership).where(
                Membership.club_id == club_id,
                Membership.user_id == task.assigned_to_user_id,
            )
        )
        membership = mem_result.scalar_one_or_none()
        if membership:
            membership.total_points += task.point_value
            db.add(PointLog(
                club_id=club_id,
                user_id=task.assigned_to_user_id,
                delta=task.point_value,
                reason=f"Completed task: {task.title}",
            ))

    await db.commit()
    await db.refresh(task)
    return task
