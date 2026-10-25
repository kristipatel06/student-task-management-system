const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { afterEach, beforeEach, test } = require("node:test");
const { createApp, validateTask } = require("../server");

let temporaryDirectory;
let dataFile;
let server;
let baseUrl;

async function startServer() {
  const app = createApp(dataFile);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopServer() {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    server = null;
  }
}

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
}

function sampleTask(overrides = {}) {
  return {
    title: "Read chapter 2",
    description: "Review the lecture notes",
    subject: "Biology",
    priority: "medium",
    dueDate: "2027-04-20",
    ...overrides
  };
}

beforeEach(async () => {
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "student-tasks-"));
  dataFile = path.join(temporaryDirectory, "data", "tasks.json");
  await startServer();
});

afterEach(async () => {
  await stopServer();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("adds a valid task and returns it in the task list", async () => {
  const response = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask())
  });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.title, "Read chapter 2");
  assert.equal(created.status, "pending");
  assert.ok(created.id);

  const listResponse = await request("/api/tasks");
  const result = await listResponse.json();
  assert.equal(result.tasks.length, 1);
  assert.equal(result.counts.total, 1);
});

test("validates required fields and rejects invalid values", async () => {
  const errors = validateTask(sampleTask({ title: "  ", subject: "", priority: "urgent", dueDate: "9999-99-99" }));
  assert.deepEqual(Object.keys(errors).sort(), ["dueDate", "priority", "subject", "title"]);

  const response = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask({ title: "" }))
  });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.title);
  assert.ok(validateTask(sampleTask({ dueDate: "2025-02-31" })).dueDate);
});

test("updates a task status and edits task details", async () => {
  const createResponse = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask())
  });
  const task = await createResponse.json();

  const statusResponse = await request(`/api/tasks/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" })
  });
  assert.equal((await statusResponse.json()).status, "completed");

  const editResponse = await request(`/api/tasks/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({ title: "Read chapter 3", subject: "Chemistry" })
  });
  const edited = await editResponse.json();
  assert.equal(edited.title, "Read chapter 3");
  assert.equal(edited.subject, "Chemistry");
  assert.equal(edited.status, "completed");
});

test("filters tasks by status and title while retaining overall counts", async () => {
  const firstResponse = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask({ title: "Biology notes", subject: "Biology" }))
  });
  const first = await firstResponse.json();
  await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask({ title: "Math homework", subject: "Math" }))
  });
  await request(`/api/tasks/${first.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" })
  });

  const response = await request("/api/tasks?status=completed&search=biology");
  const result = await response.json();
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].title, "Biology notes");
  assert.deepEqual(result.counts, { total: 2, pending: 1, completed: 1 });
});

test("deletes a task", async () => {
  const createResponse = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask())
  });
  const task = await createResponse.json();
  const deleteResponse = await request(`/api/tasks/${task.id}`, { method: "DELETE" });
  assert.equal(deleteResponse.status, 204);
  assert.equal((await (await request("/api/tasks")).json()).counts.total, 0);
});

test("saves tasks to disk and retrieves them after the app restarts", async () => {
  const response = await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(sampleTask())
  });
  const task = await response.json();
  assert.equal(fs.existsSync(dataFile), true);
  assert.equal(JSON.parse(fs.readFileSync(dataFile, "utf8"))[0].id, task.id);

  await stopServer();
  await startServer();
  const persisted = await (await request("/api/tasks")).json();
  assert.equal(persisted.tasks[0].title, task.title);
  assert.equal(persisted.counts.total, 1);
});
