# Student Task Management System

**StudyFlow** is a responsive task planner for students. It helps a student capture coursework, see due dates and priorities, and keep track of completed and pending study tasks. The project is designed to be understandable in a college viva and to demonstrate a small Agile/DevOps workflow.

## Problem statement

Students often track assignments, revision and due dates in separate notes or memory. This makes it easy to overlook work and difficult to see progress. This application puts those tasks in one place and keeps them saved between application restarts.

## Objectives

- Provide a simple interface to create, read, edit and delete study tasks.
- Make task status, subject, priority and due date easy to see.
- Help students focus with status filters and title search.
- Store task data persistently without requiring a database server.
- Demonstrate incremental delivery, automated testing, Docker and GitHub Actions.

## Features

- Add tasks with title, optional description, subject, priority and optional due date.
- View all tasks, edit details, delete tasks and change pending/completed status.
- Filter by All, Pending or Completed and search by title.
- See overall total, pending and completed counts even while filtering.
- Highlight overdue pending work.
- Validate required fields and date/length limits, with helpful feedback.
- Responsive layout for desktop and mobile.
- Persist data in `data/tasks.json`; the folder is created automatically.

## Technology stack

| Area | Technology |
| --- | --- |
| User interface | HTML, CSS and browser JavaScript |
| Backend/API | Node.js 20+ and Express |
| Persistence | JSON file on disk |
| Tests | Node.js built-in test runner and `fetch` |
| Container | Docker, Node 20 Alpine image |
| CI | GitHub Actions |
| Agile planning | Jira Scrum project (team-managed or company-managed) |

## Project structure

```text
.
├── .github/workflows/ci-cd.yml
├── data/                    # Created automatically; task file is git-ignored
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── tests/tasks.test.js
├── .dockerignore
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json        # Created by npm install
├── README.md
└── server.js
```

The API uses `GET /api/tasks?status=all|pending|completed&search=...`, `POST /api/tasks`, `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`. The list response contains both the filtered `tasks` and unfiltered task `counts`.

## Installation and local run

Prerequisites: Node.js 20 or later and npm. Git is needed for the GitHub workflow. Docker Desktop is optional for local container testing; the app can run without Docker.

From the project folder in the VS Code terminal:

```powershell
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000). Press `Ctrl+C` in the terminal to stop the server. For automatic restart during development, run `npm run dev`.

Task data is stored in `data/tasks.json`. Keep this file backed up if the tasks matter. It is intentionally excluded from Git so personal task entries are not committed.

## Docker

Install and start Docker Desktop first, then run these commands from the project folder:

```powershell
docker build -t student-task-management-system .
docker run --name student-task-manager -p 3000:3000 -v student-task-data:/app/data student-task-management-system
```

Visit [http://localhost:3000](http://localhost:3000). The named Docker volume `student-task-data` keeps tasks when the container is removed or recreated. Stop the running container with `Ctrl+C`; to start that same container again, run `docker start -ai student-task-manager`. To remove the container later, run `docker rm student-task-manager` after it has stopped. The volume is separate and remains available.

To run in the background, replace the `docker run` command with:

```powershell
docker run -d --name student-task-manager -p 3000:3000 -v student-task-data:/app/data student-task-management-system
```

Then use `docker stop student-task-manager` to stop it and `docker start student-task-manager` to restart it.

The image installs only production dependencies, runs as the non-root `node` user and declares `/app/data` as a volume.

## Tests

Run the complete test suite with:

```powershell
npm test
```

Tests use the built-in `node:test` runner, so no additional test framework is required. They cover task creation, input validation, status changes, editing, deletion, filtering/search, counts and data persistence after an app restart. Each test uses its own temporary data file and does not modify your real task list.

## Agile Scrum plan

### Proposed project and product

**Project proposal:** deliver a small web application that helps students organize academic tasks and track progress. Work in short sprints, review a usable increment at each sprint boundary, and automate checks so changes are verified before merging.

**Product goal:** a student can record study work, know what is due, and see what remains without losing tasks after a restart.

The backlog below is a planning template, not a record of work completed. Refine estimates and acceptance criteria with your teammate, and update Jira based on what actually happens.

### Prioritized product backlog

Story points below are **initial planning estimates**, not Jira records or completed work. Agree on estimates together (for example, using the Fibonacci scale 1, 2, 3, 5, 8) and revise them based on your team's capacity and actual work.

| Priority | Story | Acceptance criteria | Suggested points |
| --- | --- | --- | ---: |
| P1 | As a student, I want to add a task with a title and subject so that I can record coursework. | A valid task is saved and displayed; blank title/subject and invalid dates are rejected with helpful feedback. | 3 |
| P1 | As a student, I want to see all my tasks so that I know what needs attention. | Tasks show title, subject, priority and due date when set; an empty state appears when there are none. | 2 |
| P1 | As a student, I want to mark a task completed or pending so that my progress is accurate. | Toggling status persists and updates the total, pending and completed counts. | 2 |
| P1 | As a student, I want to edit or delete a task so that I can correct or remove outdated work. | Changes persist; deletion asks for confirmation and removes only the selected task. | 3 |
| P1 | As a student, I want my tasks to remain after restarting the app so that I do not lose my plan. | Tasks are written to persistent storage and can be read after restarting the server. | 3 |
| P2 | As a student, I want to filter by status and search by title so that I can find relevant work quickly. | All/Pending/Completed filters and title search can be combined; counts remain overall totals. | 3 |
| P2 | As a student, I want overdue tasks to stand out so that I can prioritize them. | A past due date on a pending task is clearly identified as overdue; completed work is not labeled overdue. | 2 |
| P2 | As a student, I want the interface to work on my phone so that I can check tasks anywhere. | Core controls remain usable at mobile viewport sizes without horizontal page scrolling. | 2 |
| P2 | As a team, we want automated tests and CI checks so that changes are checked consistently. | Tests run locally and on push/PR; CI also checks startup and builds the Docker image. | 3 |
| P2 | As a student team, we want container and setup documentation so that others can run and review the project. | Docker steps, setup, Agile artifacts, screenshot slots and demo checklist are documented accurately. | 2 |

These are planning items for the assignment, not a claim that the listed work was completed in a particular sprint. The project already contains working features; use the sprint templates to record what your team actually did and demonstrated.

### Two-sprint plan

Choose sprint dates and scope with your teammate. Point totals are examples, not a velocity commitment. Re-plan if your actual availability differs.

| Sprint | Goal | Suggested backlog and ownership | Review deliverable |
| --- | --- | --- | --- |
| Sprint 1 — Core task workflow (13 points) | A student can create, view and manage tasks, then see progress saved. | Teammate A: add/view (5 points) and edit/delete (3 points); Teammate B: status/counts (2 points) and JSON persistence (3 points). Validation is included in the add-task acceptance criteria. | Demonstrate valid and invalid task entry, task list, editing/deleting, status/count changes, and persistence after restarting the app. Complete the review template with actual evidence. |
| Sprint 2 — Find, verify and deliver (12 points) | Make the existing task workflow easy to find, verify and run as a team project. | Teammate A: search/filter (3 points) and responsive layout (2 points); Teammate B: overdue behavior (2 points) and automated tests/CI (3 points); Pair: Docker/documentation review (2 points). | Demonstrate search/filter and overdue behavior, run `npm test`, show a Docker build only if actually successful, and review the GitHub Actions result if a repository is connected. |

Ownership is a suggested starting split. Share reviews and integration, and adjust the backlog rather than recording unfinished tasks as done. The point totals are not a claim of Jira estimates or a completed sprint.

#### Sprint planning and review templates

Copy and complete one template per sprint **after** the activity happens:

```text
Sprint:
Dates:
Sprint goal:
Selected Jira issues:
Team capacity / assumptions:
Work completed (only verified work):
Work not completed and reason:
Increment demonstrated:
Stakeholder feedback:
Changes to backlog:
```

#### Retrospective template

```text
Sprint:
What went well?
What was difficult?
What did we learn?
One improvement to try next sprint:
Owner and follow-up issue:
```

### Team of two: suggested division

| Responsibility | Teammate A | Teammate B |
| --- | --- | --- |
| Product coordination | Facilitate backlog refinement, sprint planning and Jira updates; confirm acceptance criteria. | Review priorities and acceptance criteria; prepare demo feedback and retrospective notes. |
| Build contribution | Lead UI structure/styles and task-form interactions; review backend changes. | Lead Express API, persistence and tests; review UI changes. |
| Shared ownership | Pair on integration, test each other's work, attend stand-ups and review together. | Pair on integration, test each other's work, attend stand-ups and review together. |

This is a starting suggestion, not a strict split. Both teammates should understand the full application and swap/review work where useful.

Replace “Teammate A/B” with your actual names in Jira if you wish. This suggested division is not a record of who has completed work.

### Definition of Done

A story can be moved to **Done** only when the team has checked all applicable points:

- Acceptance criteria pass in the running app or in an automated test.
- The change is reviewed by the other teammate and does not break existing task flows.
- Relevant automated tests pass locally; the GitHub Actions check passes when a PR/push has run.
- Setup or user documentation is updated if the change affects it.
- The demonstrated result matches the story; unresolved defects are recorded and the story is not represented as complete.

### Example test cases

The current automated suite is in `tests/tasks.test.js`. Use this table as a manual demonstration checklist too; record **Pass/Fail** only after actually running each case.

| ID | Test | Steps | Expected result | Actual result |
| --- | --- | --- | --- | --- |
| TC-01 | Create valid task | Add a title, subject and priority, then save. | Task appears in the list with pending status. | Record during test/demo. |
| TC-02 | Reject invalid task | Submit with a blank title or subject; try an invalid API date in automated tests. | Form/API provides validation feedback and does not save the invalid task. | Record during test/demo. |
| TC-03 | Change task status | Mark a pending task completed, then pending again. | Status and pending/completed counts update and persist. | Record during test/demo. |
| TC-04 | Edit and delete | Change a task title/subject; delete that task and confirm. | Edited values appear; confirmed task is removed. | Record during test/demo. |
| TC-05 | Search and filter | Search part of a title; select Pending and Completed filters. | Only matching tasks appear; overall counts remain correct. | Record during test/demo. |
| TC-06 | Persistence | Create a task, restart the server, reload the page. | The task remains available from `data/tasks.json`. | Record during test/demo. |

The automated tests exercise the API and persistence using isolated temporary data files. These manual steps help demonstrate the browser experience; do not report them as run until you try them.

### Example bug report (practice template, not a confirmed defect)

Do not create this as a real Jira bug unless you reproduce the issue. Replace the unverified fields with observed evidence.

```text
Summary: [Short description of the observed problem]
Environment: [Browser/OS/app version]
Preconditions: [Required task data or app state]
Steps to reproduce:
  1. [First action]
  2. [Next action]
  3. [Final action]
Expected result: [What should happen]
Actual result: [What actually happened; add screenshot or console output]
Severity / priority: [Agreed team value]
Reproducibility: [For example, 3/3 attempts]
Status: To Do (only after a real issue is created)
```

Practice scenario: after actually testing TC-05, if changing the title search leaves a task visible that does not match, record the exact query, task title, browser and reproduction rate. This is an example to investigate, **not a statement that the current app has this bug**.

### Sprint review template

Copy once per sprint and fill it in after the review:

```text
Sprint:
Dates:
Sprint goal:
Selected Jira issues:
Increment demonstrated:
Acceptance criteria demonstrated:
Stakeholder feedback:
Work not completed and reason:
Changes to product backlog:
Evidence (test output, PR, screenshot):
```

### Scrum events for this assignment

- **Daily stand-up (about 10 minutes):** each person shares what they completed since the last check-in, what they plan next and any blocker. Update Jira after the conversation; it is a coordination meeting, not a status report to a manager.
- **Sprint review:** at the end of a sprint, demonstrate the working increment against acceptance criteria, invite feedback, and adjust the product backlog. Record only what was actually demonstrated.
- **Sprint retrospective:** discuss the team's process, select one practical improvement for the next sprint, and create/assign a follow-up Jira issue if needed.
- **Sprint planning/refinement:** choose work that supports the sprint goal, clarify acceptance criteria, and agree an achievable scope together.

## Jira setup guide

1. Create a Jira Software project named **Student Task Management System**. Choose a Scrum project template and invite your teammate.
2. Create suggested epics:
   - **Task management** — add, view, edit, delete and status changes.
   - **Study planning experience** — responsive UI, search, filters, counts and overdue display.
   - **Quality and delivery** — persistence, automated tests, Docker and GitHub Actions.
   - **Project documentation** — proposal, sprint planning, demo and user/developer guidance.
3. Add backlog items from the prioritized product backlog as Jira **Story** issues. Make each acceptance criteria checklist part of its issue description. Add implementation subtasks (for example, “Create task API”, “Build task form”, and “Test validation”) only when they are useful.
4. Suggested issue fields: summary, user story, acceptance criteria, priority, epic link, assignee, estimate/story points, sprint and labels (`frontend`, `backend`, `testing`, `devops`, `docs`).
5. Suggested board statuses: **To Do → In Progress → In Review → Done**. Add **Blocked** if your team's Jira workflow permits it. Agree what “Done” means: acceptance criteria met, relevant tests pass, changes reviewed, and documentation updated when needed.
6. Create two sprints using the goals/backlogs above, set dates to your actual calendar, estimate with your team, and move only selected work into each sprint. Keep the sprint goal visible.
7. During stand-ups, move issues to reflect real progress. At review, show completed increments and gather feedback; at retrospective, record one improvement. Do not backdate or invent completion, estimates or review notes.
8. Link the GitHub repository to Jira if your Jira edition/integration supports it. Include Jira issue keys in branch names and commits (for example `STMS-12-add-task-validation`) only after Jira creates those actual issue keys.

## GitHub and CI/CD

The workflow at `.github/workflows/ci-cd.yml` runs on pushes to `main` and pull requests targeting `main`. It checks out the code, installs Node.js 20 dependencies, runs tests, starts the app and requests its API, and builds the Docker image. A failure in any step fails the job. No deployment is configured, so no deployment secrets are needed.

### Push this project to GitHub

Create an empty GitHub repository (do not initialize it with a README if you want the simplest first push), then open PowerShell and run these commands. Replace the sample path with this project's actual folder:

```powershell
Set-Location "C:\path\to\agile project"
git init
git rev-parse --show-toplevel
git status --short
git add .
git commit -m "Build student task management system"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with the repository URL shown by GitHub. Confirm that `git rev-parse --show-toplevel` prints this project folder before running `git add .`; this prevents accidentally adding files outside the project if a parent folder also contains a Git repository. Review `git status --short` before committing. Git may ask you to authenticate; use GitHub's supported browser sign-in or credential manager rather than putting a token in the repository or command history. `data/tasks.json` and `node_modules/` are excluded by `.gitignore`.

For later updates, create a branch, commit changes, push that branch, and open a pull request targeting `main`. GitHub Actions will run the same required checks for that PR. In **Settings → Branches**, add a branch protection rule for `main` and require the **Test and build** status check if your course workflow requires passing CI before merging.

### Deployment (optional future work)

This project verifies its image but does not publish or deploy it. To add deployment later, choose a host that supports persistent volumes, configure its deployment secrets in GitHub repository **Settings → Secrets and variables → Actions**, and add a deployment job that depends on `verify`. Do not deploy the JSON-file version to an ephemeral filesystem without durable storage.

## Limitations and future enhancements

- JSON file persistence is suitable for a small demo, not concurrent multi-user production use; a database would be appropriate for a larger deployment.
- There are no user accounts, synchronization between students, email notifications or cloud backup.
- A future increment could add subject-specific views, export/backup, optional reminders, a database, and a deployment workflow after hosting and secrets are configured.

## Team contribution

Suggested role split (agree and update this with your teammate; it is not a completed-work record):

| Area | Teammate A | Teammate B |
| --- | --- | --- |
| Main focus | Frontend layout, task form and browser interactions | Express API, JSON persistence and automated tests |
| Review focus | Review backend and test changes | Review interface and usability changes |
| Shared | Integration, acceptance checks, Jira updates and demo preparation | Integration, acceptance checks, Jira updates and demo preparation |

Record actual contributions here after agreeing together:

```text
Teammate A name:
Verified contribution(s):
Evidence (issue, PR, or commit):

Teammate B name:
Verified contribution(s):
Evidence (issue, PR, or commit):
```

## Screenshots

No screenshots are included yet. Capture your own images after running the app, save them in a `screenshots/` folder, and replace these placeholders:

- Dashboard: `screenshots/dashboard.png` — task overview and list.
- Add/edit task: `screenshots/task-form.png` — task form.
- Mobile layout: `screenshots/mobile.png` — phone-sized viewport.

## Final teacher demonstration checklist

- [ ] Explain the problem, product goal and chosen scope.
- [ ] Show the Jira backlog, acceptance criteria, two sprint goals and actual team assignments.
- [ ] Demonstrate a valid task and explain the validation for invalid input.
- [ ] Demonstrate editing, deleting, completing/reopening, searching and filtering tasks.
- [ ] Show total, pending and completed counts; show overdue styling if an overdue task is available.
- [ ] Refresh the page and, if practical, restart the server to demonstrate persistence.
- [ ] Run `npm test` and show the actual test result.
- [ ] Show Docker build/run only if Docker Desktop is running and those commands succeed.
- [ ] Show GitHub Actions results only after a push or pull request has triggered the workflow.
- [ ] Present sprint review and retrospective notes based on what the team actually did.
- [ ] Explain one limitation and a realistic future enhancement.
