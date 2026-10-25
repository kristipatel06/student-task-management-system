const taskList = document.querySelector("#task-list");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const messageBox = document.querySelector("#message");
const searchInput = document.querySelector("#search-input");
let activeStatus = "all";
let messageTimer;

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric"
}).format(new Date());

document.querySelector("#add-task-button").addEventListener("click", () => openTaskDialog());
document.querySelectorAll(".close-dialog").forEach((button) => {
  button.addEventListener("click", () => taskDialog.close());
});
document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    loadTasks();
  });
});
searchInput.addEventListener("input", loadTasks);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});
taskForm.addEventListener("submit", saveTask);

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || "Please check the highlighted fields.");
    error.details = body.errors;
    throw error;
  }
  return body;
}

async function loadTasks() {
  try {
    const query = new URLSearchParams({ status: activeStatus, search: searchInput.value });
    const result = await apiRequest(`/api/tasks?${query}`);
    document.querySelector("#total-count").textContent = result.counts.total;
    document.querySelector("#pending-count").textContent = result.counts.pending;
    document.querySelector("#completed-count").textContent = result.counts.completed;
    document.querySelector("#task-total-label").textContent = result.tasks.length;
    renderTasks(result.tasks);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderTasks(tasks) {
  taskList.replaceChildren();
  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("div");
    icon.className = "empty-illustration";
    icon.textContent = "✦";
    const heading = document.createElement("strong");
    const description = document.createElement("p");
    if (searchInput.value.trim()) {
      heading.textContent = "No tasks match your search";
      description.textContent = "Try a different title or clear your search.";
    } else if (activeStatus !== "all") {
      heading.textContent = `No ${activeStatus} tasks yet`;
      description.textContent = "Choose another filter or add a new task.";
    } else {
      heading.textContent = "Your study plan starts here";
      description.textContent = "Add your first task and make today count.";
    }
    empty.append(icon, heading, description);
    taskList.append(empty);
    return;
  }

  tasks.forEach((task) => taskList.append(createTaskCard(task)));
}

function createTaskCard(task) {
  const card = document.createElement("article");
  const overdue = task.status === "pending" && task.dueDate && task.dueDate < localToday();
  card.className = `task-card${task.status === "completed" ? " completed" : ""}${overdue ? " overdue" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.className = "task-check";
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "completed";
  checkbox.setAttribute("aria-label", `Mark "${task.title}" ${checkbox.checked ? "pending" : "completed"}`);
  checkbox.addEventListener("change", () => updateTask(task.id, { status: checkbox.checked ? "completed" : "pending" }));

  const details = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  details.append(title);
  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    details.append(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";
  const subject = document.createElement("span");
  subject.className = "subject-tag";
  subject.textContent = task.subject;
  const priority = document.createElement("span");
  priority.className = `priority priority-${task.priority}`;
  priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`;
  meta.append(subject, priority);
  if (task.dueDate) {
    const dueDate = document.createElement("span");
    dueDate.className = `due-date${overdue ? " overdue-text" : ""}`;
    dueDate.textContent = `${overdue ? "Overdue · " : "Due · "}${formatDate(task.dueDate)}`;
    meta.append(dueDate);
  }
  details.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editButton = makeIconButton("✎", `Edit ${task.title}`);
  editButton.addEventListener("click", () => openTaskDialog(task));
  const deleteButton = makeIconButton("⌫", `Delete ${task.title}`);
  deleteButton.addEventListener("click", () => deleteTask(task));
  actions.append(editButton, deleteButton);
  card.append(checkbox, details, actions);
  return card;
}

function makeIconButton(text, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  return button;
}

function openTaskDialog(task = null) {
  clearErrors();
  taskForm.reset();
  document.querySelector("#task-id").value = task?.id || "";
  document.querySelector("#dialog-title").textContent = task ? "Edit task" : "Add a task";
  document.querySelector("#save-task-button").innerHTML = task ? "Save changes <span aria-hidden=\"true\">→</span>" : "Save task <span aria-hidden=\"true\">→</span>";
  if (task) {
    document.querySelector("#title-input").value = task.title;
    document.querySelector("#description-input").value = task.description;
    document.querySelector("#subject-input").value = task.subject;
    document.querySelector("#priority-input").value = task.priority;
    document.querySelector("#due-date-input").value = task.dueDate;
  }
  taskDialog.showModal();
  document.querySelector("#title-input").focus();
}

async function saveTask(event) {
  event.preventDefault();
  clearErrors();
  const id = document.querySelector("#task-id").value;
  const payload = {
    title: document.querySelector("#title-input").value,
    description: document.querySelector("#description-input").value,
    subject: document.querySelector("#subject-input").value,
    priority: document.querySelector("#priority-input").value,
    dueDate: document.querySelector("#due-date-input").value
  };
  try {
    await apiRequest(id ? `/api/tasks/${id}` : "/api/tasks", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(payload)
    });
    taskDialog.close();
    showMessage(id ? "Task updated. Nice work!" : "Task added. You’ve got this!");
    await loadTasks();
  } catch (error) {
    if (error.details) {
      Object.entries(error.details).forEach(([field, text]) => showFieldError(field, text));
    } else {
      showMessage(error.message, true);
    }
  }
}

async function updateTask(id, changes) {
  try {
    await apiRequest(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
    showMessage(changes.status === "completed" ? "Task completed. Celebrate the progress!" : "Task moved back to pending.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
    await loadTasks();
  }
}

async function deleteTask(task) {
  if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
  try {
    await apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });
    showMessage("Task deleted.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function showFieldError(field, text) {
  const error = document.querySelector(`[data-error-for="${field}"]`);
  if (error) error.textContent = text;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((element) => { element.textContent = ""; });
}

function showMessage(text, isError = false) {
  window.clearTimeout(messageTimer);
  messageBox.textContent = text;
  messageBox.classList.toggle("error", isError);
  if (text) {
    messageTimer = window.setTimeout(() => {
      messageBox.textContent = "";
      messageBox.classList.remove("error");
    }, 4000);
  }
}

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

loadTasks();
