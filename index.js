"use strict";

// ── Config ───────────────────────────────────────────────────
const POMODORO_MINUTES = 25;
const DEBUG_SECONDS = null; // set to 5 to test the timer quickly, then back to null

// ── Local Storage Helpers ────────────────────────────────────
function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Could not save ${key}:`, error);
    alert("Could not save data. Check your browser storage.");
  }
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getToday() {
  return dateKey(new Date());
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// ── Page Navigation ──────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll("#main-content .page").forEach((page) => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  document.getElementById("main-content").scrollTop = 0;
}

// ── Add Subject Toast ────────────────────────────────────────
const subBtn = document.querySelector(".add-sub");
const toast = document.querySelector(".toast");

if (subBtn && toast) {
  subBtn.addEventListener("click", () => {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  });
}

// ── Pop-up Modal ─────────────────────────────────────────────
const popUp = document.querySelector(".pop-up");
const overlay = document.createElement("div");
overlay.classList.add("overlay");
document.body.appendChild(overlay);

function openPopUp() {
  if (!popUp) return;
  popUp.classList.add("show");
  overlay.style.display = "block";
}

function closePopUp() {
  if (!popUp) return;
  popUp.classList.remove("show");
  overlay.style.display = "none";
}

document.querySelector(".add")?.addEventListener("click", openPopUp);
document.querySelector(".task button")?.addEventListener("click", openPopUp);
document.querySelector(".cancel")?.addEventListener("click", closePopUp);
overlay.addEventListener("click", closePopUp);

// ── Todo: Persistent Tasks ───────────────────────────────────
const todo = document.querySelector(".todo");
const todoAdd = document.querySelector(".todo-add");
const popPop = document.querySelector(".pop-pop");
const todoList = document.querySelector(".todo-list");

const taskInput = document.querySelector("#task-holder");
const subjectSelect = document.querySelector("#subject-select");
const prioritySelect = document.querySelector("#priority-select");
const popupAdd = document.querySelector(".pop-add");

let tasks = loadData("studyflow-tasks", []);

function saveTasks() {
  saveData("studyflow-tasks", tasks);
}

function showTaskToast() {
  if (!popPop) return;
  popPop.classList.add("show");
  setTimeout(() => popPop.classList.remove("show"), 3000);
}

function addTask(text, subject = "", priority = "medium") {
  text = text.trim();
  if (!text) return;

  tasks.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    subject,
    priority,
    completed: false,
  });

  saveTasks();
  renderTasks();
  showTaskToast();
}

function renderTasks() {
  if (!todoList) return;

  todoList.replaceChildren();

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.style.cssText =
      "color:var(--text);font-family:var(--font-primary);" +
      "padding:10px 0;border-bottom:1px solid var(--placeholder-text);" +
      "list-style:none;font-size:0.9rem;display:flex;align-items:center;" +
      "gap:8px;flex-wrap:wrap;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.text}`);

    const title = document.createElement("span");
    title.textContent = task.text;
    title.style.cssText = "flex:1;overflow-wrap:anywhere;";

    if (task.completed) {
      title.style.textDecoration = "line-through";
      title.style.opacity = "0.6";
    }

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const meta = document.createElement("small");
    meta.textContent = [
      capitalize(task.subject),
      task.priority ? `${task.priority} priority` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    meta.style.opacity = "0.7";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      const updated = prompt("Edit task:", task.text);
      if (updated === null || !updated.trim()) return;

      task.text = updated.trim();
      saveTasks();
      renderTasks();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      renderTasks();
    });

    li.append(checkbox, title, meta, editButton, deleteButton);
    todoList.appendChild(li);
  });
}

// Inline task input
function addInlineTask() {
  if (!todo) return;
  addTask(todo.value);
  todo.value = "";
}

todoAdd?.addEventListener("click", addInlineTask);

todo?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addInlineTask();
});

// Popup task input
function addPopupTask() {
  if (!taskInput) return;

  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  addTask(
    text,
    subjectSelect?.value || "",
    prioritySelect?.value || "medium"
  );

  taskInput.value = "";
  if (subjectSelect) subjectSelect.value = "";
  if (prioritySelect) prioritySelect.value = "medium";
  closePopUp();
}

popupAdd?.addEventListener("click", addPopupTask);

taskInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addPopupTask();
});

renderTasks();

// ── Focus Timer UI ───────────────────────────────────────────
const MODES = {
  pomodoro: DEBUG_SECONDS ?? POMODORO_MINUTES * 60,
  "short-break": 5 * 60,
  "long-break": 15 * 60,
};

const LABELS = {
  pomodoro: "POMODORO",
  "short-break": "SHORT BREAK",
  "long-break": "LONG BREAK",
};

let currentMode = "pomodoro";
let remaining = MODES[currentMode];
let running = false;
let interval = null;
let endTime = 0;

const timerDiv = document.querySelector(".timer");

if (timerDiv) {
  timerDiv.insertAdjacentHTML("beforeend", `
    <div style="display:flex;flex-direction:column;align-items:center;gap:24px;padding:30px 0;">
      <div id="pomo-display" style="font-size:3.5rem;font-family:var(--font-heading);color:var(--text);letter-spacing:2px;">25:00</div>
      <div id="pomo-label" style="font-size:0.7rem;letter-spacing:3px;color:var(--text-muted);">POMODORO</div>
      <div style="display:flex;gap:16px;align-items:center;">
        <button id="pomo-reset" type="button" aria-label="Reset timer" style="all:unset;cursor:pointer;color:var(--text-muted);font-size:1.3rem;">↺</button>
        <button id="pomo-play" type="button" aria-label="Start timer" style="all:unset;cursor:pointer;width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:var(--text);font-size:1.4rem;">▶</button>
        <button id="pomo-skip" type="button" aria-label="Skip timer" style="all:unset;cursor:pointer;color:var(--text-muted);font-size:1.3rem;">⏭</button>
      </div>
      <div style="display:flex;gap:28px;">
        <div style="text-align:center;">
          <div id="stat-today" style="font-size:1.4rem;font-family:var(--font-heading);color:var(--text);">0</div>
          <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:2px;">TODAY</div>
        </div>
        <div style="text-align:center;">
          <div id="stat-min" style="font-size:1.4rem;font-family:var(--font-heading);color:var(--text);">0</div>
          <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:2px;">MIN FOCUS</div>
        </div>
        <div style="text-align:center;">
          <div id="stat-streak" style="font-size:1.4rem;font-family:var(--font-heading);color:var(--accent);">0</div>
          <div style="font-size:0.65rem;color:var(--text-muted);letter-spacing:2px;">STREAK</div>
        </div>
      </div>
    </div>
  `);
}

function fmt(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateDisplay() {
  const display = document.getElementById("pomo-display");
  if (display) display.textContent = fmt(remaining);
}

function stopTimer() {
  clearInterval(interval);
  interval = null;
  running = false;

  const playButton = document.getElementById("pomo-play");
  if (playButton) playButton.textContent = "▶";
}

function setMode(mode) {
  if (!Object.hasOwn(MODES, mode)) return;

  stopTimer();
  currentMode = mode;
  remaining = MODES[mode];

  const label = document.getElementById("pomo-label");
  if (label) label.textContent = LABELS[mode];

  updateDisplay();
}

// ── Persistent Study Sessions ────────────────────────────────
let sessions = loadData("studyflow-sessions", []);
let lastRenderedDay = getToday();

function getTodaySessions() {
  return sessions.filter((session) => session.date === getToday());
}

function formatHM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return { h, m };
}

// Streak = consecutive days with at least one completed session.
// If you haven't studied yet today, the streak is still alive from yesterday.
function calculateStreak() {
  const days = new Set(sessions.map((session) => session.date));
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0); // noon avoids daylight-saving edge cases

  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function updateSessionStats() {
  const todaySessions = getTodaySessions();
  const todayCount = todaySessions.length;
  const totalMin = todaySessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const streak = calculateStreak();
  const { h, m } = formatHM(totalMin);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // Timer page
  setText("stat-today", todayCount);
  setText("stat-min", totalMin);
  setText("stat-streak", streak);

  // Sidebar + dashboard
  setText("sidebar-streak", streak);
  setText("dash-today", `${h}:${String(m).padStart(2, "0")}`);
  setText(
    "dash-summary",
    totalMin === 0
      ? "No focus sessions yet today. Start one!"
      : `You've studied ${h}h ${m}m today. Keep it up!`
  );
}

function renderSessions() {
  const sessionsList = document.querySelector(".today-sessions");
  if (sessionsList) {
    // Keep the heading; remove the hard-coded sample sessions.
    Array.from(sessionsList.children).forEach((child) => {
      if (child.tagName.toLowerCase() !== "h4") child.remove();
    });

    getTodaySessions()
      .slice()
      .reverse()
      .forEach((session) => {
        const li = document.createElement("li");
        li.classList.add("sub");
        li.textContent = capitalize(session.subject);
        if (session.note) li.title = session.note;

        const details = document.createElement("div");
        details.classList.add("details");

        const duration = document.createElement("p");
        duration.textContent = `${session.duration} min`;

        const time = document.createElement("p");
        time.textContent = session.time;

        details.append(duration, time);
        sessionsList.append(li, details);
      });
  }

  updateSessionStats();
  renderHeatmap();
}

function completeSession() {
  const subjectEl = document.getElementById("browse");
  const noteEl = document.getElementById("notes");
  const now = new Date();

  const session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject: subjectEl?.value || "General",
    note: noteEl?.value.trim() || "",
    duration: POMODORO_MINUTES, // always records real minutes, even in debug mode
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: getToday(),
    completedAt: now.toISOString(),
  };

  sessions.push(session);
  saveData("studyflow-sessions", sessions);

  if (noteEl) noteEl.value = "";
  renderSessions();
}

// ── Heatmap (built from real sessions) ───────────────────────
const heatColors = ["#252a3d", "#3d3570", "#5b4db2", "#7c6df0"];
const heatGrid = document.querySelector(".heatmap-grid");
const HEATMAP_DAYS = 200;

function renderHeatmap() {
  if (!heatGrid) return;

  const countByDay = {};
  sessions.forEach((session) => {
    countByDay[session.date] = (countByDay[session.date] || 0) + 1;
  });

  heatGrid.replaceChildren();

  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (HEATMAP_DAYS - 1));

  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const key = dateKey(cursor);
    const count = countByDay[key] || 0;

    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.style.backgroundColor = heatColors[Math.min(count, heatColors.length - 1)];
    cell.title = `${key}: ${count} session${count === 1 ? "" : "s"}`;
    heatGrid.appendChild(cell);

    cursor.setDate(cursor.getDate() + 1);
  }
}

// ── Timer logic ──────────────────────────────────────────────
function tick() {
  remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  updateDisplay();

  if (remaining <= 0) finishTimer();
}

function finishTimer() {
  const finishedMode = currentMode;
  stopTimer();

  // Only a naturally completed Pomodoro is recorded.
  if (finishedMode === "pomodoro") completeSession();

  // Reset so pressing play again starts a fresh round (no fake 0-second sessions).
  remaining = MODES[currentMode];
  updateDisplay();
}

// Mode buttons
document.querySelectorAll(".time-btn").forEach((button) => {
  button.addEventListener("click", () => setMode(button.id));
});

// Play / Pause
document.getElementById("pomo-play")?.addEventListener("click", () => {
  if (running) {
    remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    stopTimer();
    updateDisplay();
    return;
  }

  if (remaining <= 0) remaining = MODES[currentMode];

  running = true;
  endTime = Date.now() + remaining * 1000;
  document.getElementById("pomo-play").textContent = "⏸";
  interval = setInterval(tick, 250);
});

// Reset
document.getElementById("pomo-reset")?.addEventListener("click", () => {
  stopTimer();
  remaining = MODES[currentMode];
  updateDisplay();
});

// Skip: go to the next mode WITHOUT recording a session.
document.getElementById("pomo-skip")?.addEventListener("click", () => {
  setMode(currentMode === "pomodoro" ? "short-break" : "pomodoro");
});

// If the page stays open past midnight, refresh "today" automatically.
setInterval(() => {
  const today = getToday();
  if (today !== lastRenderedDay) {
    lastRenderedDay = today;
    renderSessions();
  }
}, 60 * 1000);

// Restore saved data on page load.
renderSessions();
updateDisplay();
