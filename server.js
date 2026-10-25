const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "tasks.json");
const PRIORITIES = new Set(["low", "medium", "high"]);
const STATUSES = new Set(["pending", "completed"]);

function readTasks(dataFile) {
  try {
    const contents = fs.readFileSync(dataFile, "utf8");
    const tasks = JSON.parse(contents);
    if (!Array.isArray(tasks)) {
      throw new Error("Task data must be a JSON array.");
    }
    return tasks;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function saveTasks(dataFile, tasks) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(tasks, null, 2));
  fs.renameSync(temporaryFile, dataFile);
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateTask(task) {
  const errors = {};

  if (typeof task.title !== "string" || !task.title.trim()) {
    errors.title = "Enter a task title.";
  } else if (task.title.trim().length > 100) {
    errors.title = "Title must be 100 characters or fewer.";
  }

  if (typeof task.description !== "string") {
    errors.description = "Description must be text.";
  } else if (task.description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  if (typeof task.subject !== "string" || !task.subject.trim()) {
    errors.subject = "Enter a subject.";
  } else if (task.subject.trim().length > 60) {
    errors.subject = "Subject must be 60 characters or fewer.";
  }

  if (!PRIORITIES.has(task.priority)) {
    errors.priority = "Choose low, medium or high priority.";
  }

  if (task.status !== undefined && !STATUSES.has(task.status)) {
    errors.status = "Status must be pending or completed.";
  }

  if (task.dueDate !== "" && !isValidDate(task.dueDate)) {
    errors.dueDate = "Enter a valid due date.";
  }

  return errors;
}

function createApp(dataFile = DATA_FILE) {
  const app = express();
  app.use(express.json({ limit: "20kb" }));
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/tasks", (request, response, next) => {
    try {
      const allTasks = readTasks(dataFile);
      const search = (request.query.search || "").toString().trim().toLowerCase();
      const status = (request.query.status || "all").toString();
      if (!["all", ...STATUSES].includes(status)) {
        return response.status(400).json({ error: "Status filter is not supported." });
      }

      const tasks = allTasks.filter((task) => {
        const matchesStatus = status === "all" || task.status === status;
        const matchesSearch = task.title.toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
      });

      return response.json({
        tasks,
        counts: {
          total: allTasks.length,
          pending: allTasks.filter((task) => task.status === "pending").length,
          completed: allTasks.filter((task) => task.status === "completed").length
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/tasks", (request, response, next) => {
    try {
      if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
        return response.status(400).json({ error: "Request body must be a JSON object." });
      }
      const task = {
        title: request.body.title,
        description: request.body.description ?? "",
        subject: request.body.subject,
        priority: request.body.priority,
        dueDate: request.body.dueDate ?? "",
        status: "pending"
      };
      const errors = validateTask(task);
      if (Object.keys(errors).length) {
        return response.status(400).json({ errors });
      }

      const tasks = readTasks(dataFile);
      const now = new Date().toISOString();
      const newTask = {
        id: randomUUID(),
        ...task,
        title: task.title.trim(),
        subject: task.subject.trim(),
        createdAt: now,
        updatedAt: now
      };
      tasks.unshift(newTask);
      saveTasks(dataFile, tasks);
      return response.status(201).json(newTask);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/tasks/:id", (request, response, next) => {
    try {
      if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
        return response.status(400).json({ error: "Request body must be a JSON object." });
      }
      const tasks = readTasks(dataFile);
      const index = tasks.findIndex((task) => task.id === request.params.id);
      if (index === -1) {
        return response.status(404).json({ error: "Task not found." });
      }

      const currentTask = tasks[index];
      const editableFields = ["title", "description", "subject", "priority", "dueDate", "status"];
      const changes = Object.fromEntries(
        editableFields
          .filter((field) => Object.hasOwn(request.body, field))
          .map((field) => [field, request.body[field]])
      );
      const updatedTask = { ...currentTask, ...changes };
      const errors = validateTask(updatedTask);
      if (Object.keys(errors).length) {
        return response.status(400).json({ errors });
      }

      updatedTask.title = updatedTask.title.trim();
      updatedTask.subject = updatedTask.subject.trim();
      updatedTask.updatedAt = new Date().toISOString();
      tasks[index] = updatedTask;
      saveTasks(dataFile, tasks);
      return response.json(updatedTask);
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/tasks/:id", (request, response, next) => {
    try {
      const tasks = readTasks(dataFile);
      const remainingTasks = tasks.filter((task) => task.id !== request.params.id);
      if (remainingTasks.length === tasks.length) {
        return response.status(404).json({ error: "Task not found." });
      }
      saveTasks(dataFile, remainingTasks);
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, request, response, next) => {
    console.error(error);
    if (response.headersSent) {
      return next(error);
    }
    return response.status(500).json({ error: "The server could not complete the request." });
  });

  return app;
}

if (require.main === module) {
  createApp().listen(PORT, () => {
    console.log(`Student Task Management System is running at http://localhost:${PORT}`);
  });
}

module.exports = { createApp, validateTask };
