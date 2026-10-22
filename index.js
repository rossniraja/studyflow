
"use strict";

// ── Local Storage Helpers ────────────────────────────────────
function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
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

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

// ── Heatmap ──────────────────────────────────────────────────
const colors = ["#252a3d", "#3d3570", "#5b4db2", "#7c6df0"];
const grid = document.querySelector(".heatmap-grid");

if (grid) {
  for (let i = 0; i < 200; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    grid.appendChild(cell);
  }
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
      task.subject,
      task.priority ? `${task.priority} priority` : "",
    ].filter(Boolean).join(" · ");
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
popupAdd?.addEventListener("click", () => {
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
});

renderTasks();

// ── Focus Timer ──────────────────────────────────────────────
const MODES = {
  pomodoro: 25 * 60,
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
          <div style="font-size:1.4rem;font-family:var(--font-heading);color:var(--accent);">7</div>
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

// ── Persistent Study Sessions ────────────────────────────────
let sessions = loadData("studyflow-sessions", []);

function getTodaySessions() {
  return sessions.filter((session) => session.date === getToday());
}

function updateSessionStats() {
  const todaySessions = getTodaySessions();
  const todayCount = todaySessions.length;
  const totalMin = todaySessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );

  const todayDisplay = document.getElementById("stat-today");
  const minutesDisplay = document.getElementById("stat-min");

  if (todayDisplay) todayDisplay.textContent = todayCount;
  if (minutesDisplay) minutesDisplay.textContent = totalMin;
}

function renderSessions() {
  const sessionsList = document.querySelector(".today-sessions");
  if (!sessionsList) return;

  // Keep the heading; remove the hard-coded sample sessions.
  Array.from(sessionsList.children).forEach((child) => {
    if (child.tagName.toLowerCase() !== "h4") child.remove();
  });

  getTodaySessions().slice().reverse().forEach((session) => {
    const li = document.createElement("li");
    li.classList.add("sub");
    li.textContent = session.subject;

    const details = document.createElement("div");
    details.classList.add("details");

    const duration = document.createElement("p");
    duration.textContent = `${session.duration} min`;

    const time = document.createElement("p");
    time.textContent = session.time;

    details.append(duration, time);
    sessionsList.append(li, details);
  });

  updateSessionStats();
}

function completeSession() {
  // Only completed Pomodoro sessions are recorded.
  if (currentMode !== "pomodoro") return;

  const subjectSelect = document.getElementById("browse");
  const subject = subjectSelect?.value || "General";
  const now = new Date();

  const session = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject,
    duration: MODES.pomodoro / 60,
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: getToday(),
    completedAt: now.toISOString(),
  };

  sessions.push(session);
  saveData("studyflow-sessions", sessions);
  renderSessions();
}

// Mode switching
document.querySelectorAll(".time-btn").forEach((button) => {
  button.addEventListener("click", () => {
    stopTimer();

    if (!Object.hasOwn(MODES, button.id)) return;

    currentMode = button.id;
    remaining = MODES[currentMode];

    const label = document.getElementById("pomo-label");
    if (label) label.textContent = LABELS[currentMode];

    updateDisplay();
  });
});

// Play / Pause
document.getElementById("pomo-play")?.addEventListener("click", () => {
  if (running) {
    stopTimer();
    return;
  }

  running = true;
  document.getElementById("pomo-play").textContent = "⏸";

  interval = setInterval(() => {
    remaining--;
    updateDisplay();

    if (remaining <= 0) {
      remaining = 0;
      updateDisplay();
      stopTimer();

      if (currentMode === "pomodoro") {
        completeSession();
      }
    }
  }, 1000);
});

// Reset
document.getElementById("pomo-reset")?.addEventListener("click", () => {
  stopTimer();
  remaining = MODES[currentMode];
  updateDisplay();
});

// Skip: skip the timer without recording a completed session.
document.getElementById("pomo-skip")?.addEventListener("click", () => {
  stopTimer();
  remaining = MODES[currentMode];
  updateDisplay();
});

// Restore saved sessions on page load.
renderSessions();
updateDisplay();
