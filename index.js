// ── Page Navigation ──────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll("#main-content .page").forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");
  document.getElementById("main-content").scrollTop = 0;
}

// ── Heatmap ───────────────────────────────────────────────────
const colors = ["#252a3d", "#3d3570", "#5b4db2", "#7c6df0"];
const grid = document.querySelector(".heatmap-grid");
for (let i = 0; i < 200; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  grid.appendChild(cell);
}

// ── Add Subject Toast ─────────────────────────────────────────
const subBtn = document.querySelector(".add-sub");
const toast = document.querySelector(".toast");
subBtn.addEventListener("click", () => {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
});

// ── Pop-up Modal (+ add task button) ─────────────────────────
const popUp = document.querySelector(".pop-up");
const overlay = document.createElement("div");
overlay.classList.add("overlay");
document.body.appendChild(overlay);

function openPopUp() {
  popUp.classList.add("show");
  overlay.style.display = "block";
}
function closePopUp() {
  popUp.classList.remove("show");
  overlay.style.display = "none";
}

document.querySelector(".add").addEventListener("click", openPopUp);
document.querySelector(".task button").addEventListener("click", openPopUp);
document.querySelector(".cancel").addEventListener("click", closePopUp);
overlay.addEventListener("click", closePopUp);

// ── Todo (inline ADD button) ──────────────────────────────────
const todo = document.querySelector(".todo");
const todoAdd = document.querySelector(".todo-add");
const popPop = document.querySelector(".pop-pop");
const workDoneBody = document.querySelector(".work-done-body");
const todoList = document.querySelector(".todo-list");
function addTask(text) {
  if (!text) return;

  const li = document.createElement("li");
  li.textContent = text;
  li.style.color = "var(--text)";
  li.style.fontFamily = "var(--font-primary)";
  li.style.padding = "10px 0";
  li.style.borderBottom = "1px solid var(--placeholder-text)";
  li.style.listStyle = "none";
  li.style.fontSize = "0.9rem";
   todoList.appendChild(li);
  // insert above the input row
  
document.querySelector(".todo-list").appendChild(li);
  // show toast
  popPop.classList.add("show");
  setTimeout(() => popPop.classList.remove("show"), 3000);
}

todoAdd.addEventListener("click", () => {
  const text = todo.value.trim();
  addTask(text);
  todo.value = "";
});

// pressing Enter also adds the task
todo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const text = todo.value.trim();
    addTask(text);
    todo.value = "";
  }
});
// ── Focus Timer ───────────────────────────────────────────────

const MODES = {
  'pomodoro':    25 * 60,
  'short-break':  5 * 60,
  'long-break':  15 * 60,
};

let currentMode = 'pomodoro';
let remaining   = MODES[currentMode];
let running     = false;
let interval    = null;

// -- Build the clock HTML inside .timer (after the .time tabs) --
const timerDiv = document.querySelector('.timer');
timerDiv.insertAdjacentHTML('beforeend', `
  <div style="display:flex;flex-direction:column;align-items:center;gap:24px;padding:30px 0;">
    <div id="pomo-display" style="font-size:3.5rem;font-family:var(--font-heading);color:var(--text);letter-spacing:2px;">25:00</div>
    <div id="pomo-label" style="font-size:0.7rem;letter-spacing:3px;color:var(--text-muted);">POMODORO</div>
    <div style="display:flex;gap:16px;align-items:center;">
      <button id="pomo-reset" style="all:unset;cursor:pointer;color:var(--text-muted);font-size:1.3rem;">↺</button>
      <button id="pomo-play"  style="all:unset;cursor:pointer;width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:var(--text);font-size:1.4rem;">▶</button>
      <button id="pomo-skip"  style="all:unset;cursor:pointer;color:var(--text-muted);font-size:1.3rem;">⏭</button>
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

// -- Helpers --
function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function updateDisplay() {
  document.getElementById('pomo-display').textContent = fmt(remaining);
}

// -- Mode switching (your existing buttons) --
const LABELS = {
  'pomodoro':    'POMODORO',
  'short-break': 'SHORT BREAK',
  'long-break':  'LONG BREAK',
};

document.querySelectorAll('.time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    clearInterval(interval);
    running = false;
    document.getElementById('pomo-play').textContent = '▶';

    currentMode = btn.id;           // your buttons already have id="pomodoro" etc.
    remaining   = MODES[currentMode];
    document.getElementById('pomo-label').textContent = LABELS[currentMode];
    updateDisplay();
  });
});

// -- Play / Pause --
let todayCount = 0;
let totalMin   = 0;

document.getElementById('pomo-play').addEventListener('click', () => {
  if (running) {
    clearInterval(interval);
    running = false;
    document.getElementById('pomo-play').textContent = '▶';
  } else {
    running = true;
    document.getElementById('pomo-play').textContent = '⏸';
    interval = setInterval(() => {
      remaining--;
      updateDisplay();
      if (remaining <= 0) {
        clearInterval(interval);
        running = false;
        document.getElementById('pomo-play').textContent = '▶';
        if (currentMode === 'pomodoro') completeSession();
      }
    }, 1000);
  }
});

// -- Reset --
document.getElementById('pomo-reset').addEventListener('click', () => {
  clearInterval(interval);
  running  = false;
  remaining = MODES[currentMode];
  document.getElementById('pomo-play').textContent = '▶';
  updateDisplay();
});

// -- Skip --
document.getElementById('pomo-skip').addEventListener('click', () => {
  clearInterval(interval);
  running = false;
  document.getElementById('pomo-play').textContent = '▶';
  if (currentMode === 'pomodoro') completeSession();
  remaining = MODES[currentMode];
  updateDisplay();
});

// -- Session complete: log to Today's Sessions --
function completeSession() {
  const elapsed = Math.round((MODES[currentMode] - remaining) / 60) || 25;
  todayCount++;
  totalMin += elapsed;
  document.getElementById('stat-today').textContent = todayCount;
  document.getElementById('stat-min').textContent   = totalMin;

  const subject = document.getElementById('browse').value || 'General';
  const now     = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sessionsList = document.querySelector('.today-sessions');
  const li = document.createElement('li');
  li.classList.add('sub');
  li.textContent = subject;

  const details = document.createElement('div');
  details.classList.add('details');
  details.innerHTML = `<p id="span">${elapsed}min</p><p id="span-2">${timeStr}</p>`;

  sessionsList.appendChild(li);
  sessionsList.appendChild(details);
}