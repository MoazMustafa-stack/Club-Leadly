/* ── globals ───────────────────────────────────────────── */
const API = "http://127.0.0.1:8000";
let token = localStorage.getItem("token");
let decoded = null; // parsed JWT payload

/* ── helpers ──────────────────────────────────────────── */
function parseJwt(t) {
  try {
    const base64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch { return null; }
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const body = res.headers.get("content-type")?.includes("json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const msg = typeof body === "object" ? body.detail || JSON.stringify(body) : body;
    throw new Error(msg);
  }
  return body;
}

function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = isError ? "error" : "success";
  setTimeout(() => el.className = "hidden", 3000);
}

function $(id) { return document.getElementById(id); }
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : "—"; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString() : "—"; }

/* ── auth state ───────────────────────────────────────── */
function setToken(t) {
  token = t;
  localStorage.setItem("token", t);
  decoded = parseJwt(t);
  renderApp();
}

function logout() {
  token = null;
  decoded = null;
  localStorage.removeItem("token");
  renderApp();
}

function renderApp() {
  decoded = token ? parseJwt(token) : null;

  if (!decoded) {
    show($("auth-section"));
    hide($("club-setup-section"));
    hide($("dashboard-section"));
    hide($("user-info"));
    return;
  }

  show($("user-info"));
  $("user-email").textContent = decoded.email;
  hide($("auth-section"));

  if (!decoded.club_id || decoded.club_id === "None") {
    show($("club-setup-section"));
    hide($("dashboard-section"));
    $("user-role").textContent = "No club";
  } else {
    hide($("club-setup-section"));
    show($("dashboard-section"));
    $("user-role").textContent = decoded.role;

    // Show organiser-only sections
    const isOrg = decoded.role === "organiser";
    const orgSections = [$("create-task-section"), $("award-points-section")];
    orgSections.forEach(s => isOrg ? show(s) : hide(s));

    // Load initial data
    loadClubDetails();
    loadMembers();
    loadTasks();
    loadPointHistory();
    loadLeaderboard();
  }
}

/* ── auth handlers ────────────────────────────────────── */
$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        full_name: $("reg-name").value,
        email: $("reg-email").value,
        password: $("reg-password").value,
      }),
    });
    setToken(data.access_token);
    toast("Registered successfully!");
    e.target.reset();
  } catch (err) { toast(err.message, true); }
});

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("login-email").value,
        password: $("login-password").value,
      }),
    });
    setToken(data.access_token);
    toast("Logged in!");
    e.target.reset();
  } catch (err) { toast(err.message, true); }
});

$("btn-logout").addEventListener("click", logout);

/* ── club handlers ────────────────────────────────────── */
$("create-club-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/clubs", {
      method: "POST",
      body: JSON.stringify({ name: $("club-name").value }),
    });
    setToken(data.access_token);
    toast("Club created!");
    e.target.reset();
  } catch (err) { toast(err.message, true); }
});

$("join-club-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/clubs/join", {
      method: "POST",
      body: JSON.stringify({ join_code: $("join-code").value }),
    });
    setToken(data.access_token);
    toast("Joined club!");
    e.target.reset();
  } catch (err) { toast(err.message, true); }
});

/* ── club details ─────────────────────────────────────── */
async function loadClubDetails() {
  try {
    const data = await api("/clubs/me");
    $("club-details").innerHTML = `
      <p><strong>Name:</strong> ${escapeHtml(data.club.name)}</p>
      <p><strong>Join Code:</strong> <code>${escapeHtml(data.club.join_code)}</code></p>
      <p><strong>Members:</strong> ${data.total_members}</p>
      <p><strong>Created:</strong> ${fmtDate(data.club.created_at)}</p>
    `;
    const tbody = $("members-table").querySelector("tbody");
    tbody.innerHTML = data.members.map(m => `
      <tr>
        <td>${escapeHtml(m.full_name)}</td>
        <td><span class="badge">${m.role}</span></td>
        <td>${m.total_points}</td>
        <td>${fmtDate(m.joined_at)}</td>
      </tr>
    `).join("");
  } catch (err) { toast(err.message, true); }
}

let membersCache = [];

async function loadMembers() {
  try {
    membersCache = await api("/clubs/members");
    populateMemberDropdowns();
  } catch (err) { toast(err.message, true); }
}

function populateMemberDropdowns() {
  const selectors = [$("task-assignee"), $("points-user")];
  selectors.forEach(sel => {
    const first = sel.options[0];
    sel.innerHTML = "";
    sel.appendChild(first);
    membersCache.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.user_id;
      opt.textContent = `${m.full_name} (${m.role})`;
      sel.appendChild(opt);
    });
  });
}

/* ── tasks ────────────────────────────────────────────── */
$("create-task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const body = {
      title: $("task-title").value,
      point_value: parseInt($("task-points").value) || 10,
    };
    const desc = $("task-description").value.trim();
    if (desc) body.description = desc;
    const assignee = $("task-assignee").value;
    if (assignee) body.assigned_to_user_id = assignee;
    const due = $("task-due").value;
    if (due) body.due_at = new Date(due).toISOString();

    await api("/tasks", { method: "POST", body: JSON.stringify(body) });
    toast("Task created!");
    e.target.reset();
    loadTasks();
  } catch (err) { toast(err.message, true); }
});

async function loadTasks() {
  try {
    const tasks = await api("/tasks");
    const container = $("tasks-list");
    if (!tasks.length) {
      container.innerHTML = "<p>No tasks yet.</p>";
      return;
    }
    container.innerHTML = tasks.map(t => `
      <div class="task-card" data-id="${t.id}">
        <div class="task-header">
          <strong>${escapeHtml(t.title)}</strong>
          <span class="badge ${t.status}">${t.status}</span>
        </div>
        <div class="task-meta">
          ${t.assigned_to_name ? `Assigned: ${escapeHtml(t.assigned_to_name)}` : "Unassigned"}
          · ${t.point_value} pts
          · Due: ${fmtDate(t.due_at)}
        </div>
        <div class="task-actions">
          ${t.status === "pending" && t.assigned_to_user_id === decoded.sub
            ? `<button onclick="completeTask('${t.id}')">✓ Complete</button>` : ""}
          ${decoded.role === "organiser" && t.status !== "completed"
            ? `<button onclick="deleteTask('${t.id}')">🗑 Delete</button>` : ""}
          ${decoded.role === "organiser"
            ? `<button onclick="showEditTask('${t.id}')">✎ Edit</button>` : ""}
        </div>
      </div>
    `).join("");
  } catch (err) { toast(err.message, true); }
}

async function completeTask(taskId) {
  try {
    await api(`/tasks/${taskId}/complete`, { method: "PATCH" });
    toast("Task completed! Points awarded.");
    loadTasks();
    loadLeaderboard();
    loadPointHistory();
  } catch (err) { toast(err.message, true); }
}

async function deleteTask(taskId) {
  if (!confirm("Delete this task?")) return;
  try {
    await api(`/tasks/${taskId}`, { method: "DELETE" });
    toast("Task deleted.");
    loadTasks();
  } catch (err) { toast(err.message, true); }
}

async function showEditTask(taskId) {
  try {
    const task = await api(`/tasks/${taskId}`);
    const modal = $("task-modal");
    show(modal);
    $("task-detail").innerHTML = `
      <h3>Edit Task</h3>
      <form id="edit-task-form">
        <input type="text" id="edit-title" value="${escapeAttr(task.title)}" required minlength="2" />
        <textarea id="edit-description">${escapeHtml(task.description || "")}</textarea>
        <input type="number" id="edit-points" value="${task.point_value}" min="1" />
        <select id="edit-assignee">
          <option value="">Unassigned</option>
          ${membersCache.map(m => `
            <option value="${m.user_id}" ${m.user_id === task.assigned_to_user_id ? "selected" : ""}>
              ${escapeHtml(m.full_name)}
            </option>
          `).join("")}
        </select>
        <input type="datetime-local" id="edit-due" value="${task.due_at ? task.due_at.slice(0, 16) : ""}" />
        <button type="submit">Save</button>
      </form>
    `;
    $("edit-task-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const body = {
          title: $("edit-title").value,
          point_value: parseInt($("edit-points").value),
        };
        const desc = $("edit-description").value.trim();
        body.description = desc || null;
        const assignee = $("edit-assignee").value;
        body.assigned_to_user_id = assignee || null;
        const due = $("edit-due").value;
        body.due_at = due ? new Date(due).toISOString() : null;

        await api(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) });
        toast("Task updated!");
        hide(modal);
        loadTasks();
      } catch (err) { toast(err.message, true); }
    });
  } catch (err) { toast(err.message, true); }
}

document.querySelector(".modal-close").addEventListener("click", () => {
  hide($("task-modal"));
});

/* ── points ───────────────────────────────────────────── */
$("award-points-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/points/award", {
      method: "POST",
      body: JSON.stringify({
        user_id: $("points-user").value,
        delta: parseInt($("points-delta").value),
        reason: $("points-reason").value,
      }),
    });
    toast("Points awarded!");
    e.target.reset();
    loadPointHistory();
    loadLeaderboard();
    loadClubDetails();
  } catch (err) { toast(err.message, true); }
});

async function loadPointHistory() {
  try {
    const logs = await api("/points/history");
    const tbody = $("points-table").querySelector("tbody");
    if (!logs.length) {
      tbody.innerHTML = "<tr><td colspan='3'>No history yet.</td></tr>";
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${fmtDateTime(l.created_at)}</td>
        <td class="${l.delta > 0 ? "positive" : "negative"}">${l.delta > 0 ? "+" : ""}${l.delta}</td>
        <td>${escapeHtml(l.reason)}</td>
      </tr>
    `).join("");
  } catch (err) { toast(err.message, true); }
}

/* ── leaderboard ──────────────────────────────────────── */
async function loadLeaderboard() {
  try {
    const data = await api("/points/leaderboard");
    const tbody = $("leaderboard-table").querySelector("tbody");
    if (!data.entries.length) {
      tbody.innerHTML = "<tr><td colspan='4'>No data yet.</td></tr>";
      return;
    }
    tbody.innerHTML = data.entries.map(e => `
      <tr>
        <td>${e.rank}</td>
        <td>
          <span class="avatar">${escapeHtml(e.avatar_initials)}</span>
          ${escapeHtml(e.full_name)}
        </td>
        <td>${e.total_points}</td>
        <td>${e.tasks_completed}</td>
      </tr>
    `).join("");
  } catch (err) { toast(err.message, true); }
}

/* ── tabs ─────────────────────────────────────────────── */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => { c.classList.add("hidden"); c.classList.remove("active"); });
    btn.classList.add("active");
    const target = $(btn.dataset.tab);
    show(target);
    target.classList.add("active");
  });
});

/* ── XSS prevention ──────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ── init ─────────────────────────────────────────────── */
renderApp();
