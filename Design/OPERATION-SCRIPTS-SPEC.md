# Operation Scripts Specification

**Repository:** fettbot-operation-scripts  
**Purpose:** Deterministic Node.js scripts for all repetitive agent operations  
**Version:** 1.0.0  
**Last Updated:** 2026-03-15

---

## Overview

This repository provides a centralized library of deterministic Node.js scripts for agent operations. All scripts:
- Accept configuration via command-line arguments or environment variables
- Return structured JSON to stdout
- Use standard exit codes (0 = success, 1 = error)
- Never store secrets or tokens in the repository
- Are validated by CI/CD (ESLint, tests)

---

## Repository Structure

```
fettbot-operation-scripts/
├── .github/
│   └── workflows/
│       └── qa.yml           # CI/CD: lint, test
├── scripts/
│   ├── github/              # GitHub operations
│   ├── kanban/              # Kanban board operations
│   ├── nas/                 # NAS operations
│   ├── database/            # Database operations
│   ├── deployment/          # Deployment operations
│   ├── testing/             # Testing operations
│   └── git/                 # Git operations
├── tests/                   # Test files (mirrors scripts/)
├── package.json
├── .eslintrc.js
└── README.md
```

---

## Global Conventions

### Exit Codes
- `0` - Success
- `1` - Error (validation, runtime, API failure)

### Output Format
All scripts output JSON to stdout:

**Success:**
```json
{
  "success": true,
  "data": { /* script-specific data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Authentication
- GitHub: `--token` argument or `GITHUB_TOKEN` environment variable
- NAS: `--ssh-key` argument or `NAS_SSH_KEY_PATH` environment variable
- Database: `--db-host`, `--db-user`, `--db-password` arguments or env vars
- Kanban API: `--kanban-token` argument or `KANBAN_API_TOKEN` environment variable

### Logging
Scripts should NOT log to agent_logs themselves (to avoid circular dependencies). The calling agent is responsible for logging task execution.

---

## Script Specifications

## 1. GitHub Scripts

### 1.1 `gh-pr-merge.js`
Merge a pull request using squash strategy.

**Usage:**
```bash
node scripts/github/gh-pr-merge.js --owner <owner> --repo <repo> --pr <number> [--token <token>]
```

**Required Arguments:**
- `--owner` - GitHub repository owner
- `--repo` - Repository name
- `--pr` - Pull request number

**Optional Arguments:**
- `--token` - GitHub token (or use `GITHUB_TOKEN` env var)
- `--commit-title` - Custom commit title (defaults to PR title)
- `--commit-message` - Custom commit message (defaults to PR description)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "sha": "abc123...",
    "merged": true,
    "message": "Pull request #42 merged successfully"
  }
}
```

**Exit Codes:**
- `0` - PR merged successfully
- `1` - Merge failed (conflict, auth error, not mergeable)

**Example:**
```bash
node scripts/github/gh-pr-merge.js --owner fettbot --repo fettbot-operation-scripts --pr 5 --token ghp_xxx
```

**Used By:** GitGuardian

---

### 1.2 `gh-pr-create.js`
Create a new pull request.

**Usage:**
```bash
node scripts/github/gh-pr-create.js --owner <owner> --repo <repo> --head <branch> --base <branch> --title <title> [--body <body>] [--token <token>]
```

**Required Arguments:**
- `--owner` - GitHub repository owner
- `--repo` - Repository name
- `--head` - Head branch (source of changes)
- `--base` - Base branch (target, usually `main`)
- `--title` - PR title

**Optional Arguments:**
- `--body` - PR description/body
- `--draft` - Create as draft PR (boolean flag)
- `--token` - GitHub token (or use `GITHUB_TOKEN` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "number": 42,
    "url": "https://github.com/fettbot/repo/pull/42",
    "state": "open",
    "draft": false
  }
}
```

**Exit Codes:**
- `0` - PR created successfully
- `1` - Creation failed (auth error, validation error, branch not found)

**Example:**
```bash
node scripts/github/gh-pr-create.js \
  --owner fettbot \
  --repo fettbot-operation-scripts \
  --head feature/new-script \
  --base main \
  --title "Add new deployment script" \
  --body "Implements deploy-health-check.js"
```

**Used By:** CodeBot

---

### 1.3 `gh-pr-status.js`
Get pull request status and information.

**Usage:**
```bash
node scripts/github/gh-pr-status.js --owner <owner> --repo <repo> --pr <number> [--token <token>]
```

**Required Arguments:**
- `--owner` - GitHub repository owner
- `--repo` - Repository name
- `--pr` - Pull request number

**Optional Arguments:**
- `--token` - GitHub token (or use `GITHUB_TOKEN` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "number": 42,
    "state": "open",
    "title": "Add new deployment script",
    "draft": false,
    "mergeable": true,
    "merged": false,
    "head": "feature/new-script",
    "base": "main",
    "checks": {
      "total": 3,
      "passing": 3,
      "failing": 0,
      "pending": 0
    }
  }
}
```

**Exit Codes:**
- `0` - Status retrieved successfully
- `1` - Failed (auth error, PR not found)

**Example:**
```bash
node scripts/github/gh-pr-status.js --owner fettbot --repo fettbot-operation-scripts --pr 42
```

**Used By:** GitGuardian, Fettbot

---

### 1.4 `gh-pr-files.js`
List files changed in a pull request.

**Usage:**
```bash
node scripts/github/gh-pr-files.js --owner <owner> --repo <repo> --pr <number> [--token <token>]
```

**Required Arguments:**
- `--owner` - GitHub repository owner
- `--repo` - Repository name
- `--pr` - Pull request number

**Optional Arguments:**
- `--token` - GitHub token (or use `GITHUB_TOKEN` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "scripts/deployment/deploy-health-check.js",
        "status": "added",
        "additions": 120,
        "deletions": 0,
        "changes": 120
      },
      {
        "filename": "README.md",
        "status": "modified",
        "additions": 5,
        "deletions": 2,
        "changes": 7
      }
    ],
    "total_files": 2
  }
}
```

**Exit Codes:**
- `0` - Files retrieved successfully
- `1` - Failed (auth error, PR not found)

**Example:**
```bash
node scripts/github/gh-pr-files.js --owner fettbot --repo fettbot-operation-scripts --pr 42
```

**Used By:** GitGuardian

---

### 1.5 `gh-pr-review.js`
Add a review comment to a pull request.

**Usage:**
```bash
node scripts/github/gh-pr-review.js --owner <owner> --repo <repo> --pr <number> --body <comment> [--event <event>] [--token <token>]
```

**Required Arguments:**
- `--owner` - GitHub repository owner
- `--repo` - Repository name
- `--pr` - Pull request number
- `--body` - Review comment body

**Optional Arguments:**
- `--event` - Review event: `APPROVE`, `REQUEST_CHANGES`, `COMMENT` (default: `COMMENT`)
- `--token` - GitHub token (or use `GITHUB_TOKEN` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "id": 123456789,
    "state": "COMMENTED",
    "body": "LGTM! All checks passed.",
    "submitted_at": "2026-03-15T14:30:00Z"
  }
}
```

**Exit Codes:**
- `0` - Review submitted successfully
- `1` - Failed (auth error, PR not found, invalid event)

**Example:**
```bash
node scripts/github/gh-pr-review.js \
  --owner fettbot \
  --repo fettbot-operation-scripts \
  --pr 42 \
  --body "LGTM! All checks passed." \
  --event APPROVE
```

**Used By:** GitGuardian

---

## 2. Kanban Scripts

### 2.1 `kanban-create.js`
Create a new Kanban card.

**Usage:**
```bash
node scripts/kanban/kanban-create.js --title <title> [--description <desc>] [--status <status>] [--assignee <assignee>] [--token <token>]
```

**Required Arguments:**
- `--title` - Card title

**Optional Arguments:**
- `--description` - Card description/body
- `--status` - Initial status (default: `backlog`)
- `--assignee` - Agent or user to assign
- `--priority` - Priority level (low, medium, high)
- `--labels` - Comma-separated labels
- `--token` - Kanban API token (or use `KANBAN_API_TOKEN` env var)
- `--api-url` - Kanban API URL (or use `KANBAN_API_URL` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "id": "CARD-123",
    "title": "Implement new deployment script",
    "status": "backlog",
    "version": 1,
    "created_at": "2026-03-15T14:30:00Z"
  }
}
```

**Exit Codes:**
- `0` - Card created successfully
- `1` - Creation failed (auth error, validation error)

**Example:**
```bash
node scripts/kanban/kanban-create.js \
  --title "Implement deploy-health-check.js" \
  --description "Create health check script for deployments" \
  --status "backlog" \
  --assignee "CodeBot" \
  --priority "high"
```

**Used By:** Fettbot

---

### 2.2 `kanban-update.js`
Update an existing Kanban card (handles optimistic locking via version).

**Usage:**
```bash
node scripts/kanban/kanban-update.js --id <id> --version <version> [--title <title>] [--description <desc>] [--token <token>]
```

**Required Arguments:**
- `--id` - Card ID
- `--version` - Current card version (for optimistic locking)

**Optional Arguments:**
- `--title` - New title
- `--description` - New description
- `--assignee` - New assignee
- `--priority` - New priority
- `--labels` - New labels (comma-separated, replaces existing)
- `--token` - Kanban API token (or use `KANBAN_API_TOKEN` env var)
- `--api-url` - Kanban API URL (or use `KANBAN_API_URL` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "id": "CARD-123",
    "version": 2,
    "updated_at": "2026-03-15T14:35:00Z"
  }
}
```

**Exit Codes:**
- `0` - Card updated successfully
- `1` - Update failed (auth error, version conflict, card not found)

**Example:**
```bash
node scripts/kanban/kanban-update.js \
  --id "CARD-123" \
  --version 1 \
  --title "Implement deploy-health-check.js (updated)" \
  --priority "medium"
```

**Used By:** Fettbot

---

### 2.3 `kanban-status.js`
Change the status of a Kanban card.

**Usage:**
```bash
node scripts/kanban/kanban-status.js --id <id> --status <status> [--token <token>]
```

**Required Arguments:**
- `--id` - Card ID
- `--status` - New status (e.g., `backlog`, `in-progress`, `review`, `done`)

**Optional Arguments:**
- `--token` - Kanban API token (or use `KANBAN_API_TOKEN` env var)
- `--api-url` - Kanban API URL (or use `KANBAN_API_URL` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "id": "CARD-123",
    "status": "in-progress",
    "updated_at": "2026-03-15T14:40:00Z"
  }
}
```

**Exit Codes:**
- `0` - Status changed successfully
- `1` - Failed (auth error, invalid status, card not found)

**Example:**
```bash
node scripts/kanban/kanban-status.js --id "CARD-123" --status "in-progress"
```

**Used By:** Fettbot

---

### 2.4 `kanban-get.js`
Get a Kanban card by ID.

**Usage:**
```bash
node scripts/kanban/kanban-get.js --id <id> [--token <token>]
```

**Required Arguments:**
- `--id` - Card ID

**Optional Arguments:**
- `--token` - Kanban API token (or use `KANBAN_API_TOKEN` env var)
- `--api-url` - Kanban API URL (or use `KANBAN_API_URL` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "id": "CARD-123",
    "title": "Implement deploy-health-check.js",
    "description": "Create health check script for deployments",
    "status": "in-progress",
    "assignee": "CodeBot",
    "priority": "high",
    "labels": ["deployment", "automation"],
    "version": 2,
    "created_at": "2026-03-15T14:30:00Z",
    "updated_at": "2026-03-15T14:40:00Z"
  }
}
```

**Exit Codes:**
- `0` - Card retrieved successfully
- `1` - Failed (auth error, card not found)

**Example:**
```bash
node scripts/kanban/kanban-get.js --id "CARD-123"
```

**Used By:** Fettbot

---

### 2.5 `kanban-query.js`
Query Kanban cards with filters.

**Usage:**
```bash
node scripts/kanban/kanban-query.js [--status <status>] [--assignee <assignee>] [--labels <labels>] [--token <token>]
```

**Required Arguments:**
None (returns all cards if no filters provided)

**Optional Arguments:**
- `--status` - Filter by status
- `--assignee` - Filter by assignee
- `--labels` - Filter by labels (comma-separated, AND logic)
- `--priority` - Filter by priority
- `--limit` - Maximum results to return (default: 100)
- `--offset` - Pagination offset (default: 0)
- `--token` - Kanban API token (or use `KANBAN_API_TOKEN` env var)
- `--api-url` - Kanban API URL (or use `KANBAN_API_URL` env var)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "CARD-123",
        "title": "Implement deploy-health-check.js",
        "status": "in-progress",
        "assignee": "CodeBot",
        "priority": "high"
      }
    ],
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

**Exit Codes:**
- `0` - Query executed successfully
- `1` - Failed (auth error, invalid filter)

**Example:**
```bash
node scripts/kanban/kanban-query.js --status "in-progress" --assignee "CodeBot"
```

**Used By:** Fettbot

---

## 3. NAS Scripts

### 3.1 `nas-ssh.js`
Execute an SSH command on the NAS.

**Usage:**
```bash
node scripts/nas/nas-ssh.js --host <host> --command <command> [--user <user>] [--key <keypath>]
```

**Required Arguments:**
- `--host` - NAS hostname or IP
- `--command` - Command to execute

**Optional Arguments:**
- `--user` - SSH username (default: `root`)
- `--key` - Path to SSH private key (or use `NAS_SSH_KEY_PATH` env var)
- `--port` - SSH port (default: 22)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "stdout": "command output here",
    "stderr": "",
    "exit_code": 0
  }
}
```

**Exit Codes:**
- `0` - Command executed successfully (even if remote command failed; check `exit_code` in data)
- `1` - SSH connection or execution failed

**Example:**
```bash
node scripts/nas/nas-ssh.js \
  --host 10.0.0.149 \
  --user fettbot \
  --command "ls -la /volume1/docker"
```

**Used By:** All agents

---

### 3.2 `nas-docker.js`
Execute a Docker command on the NAS via SSH.

**Usage:**
```bash
node scripts/nas/nas-docker.js --host <host> --command <docker-command> [--user <user>] [--key <keypath>]
```

**Required Arguments:**
- `--host` - NAS hostname or IP
- `--command` - Docker command (without `docker` prefix)

**Optional Arguments:**
- `--user` - SSH username (default: `root`)
- `--key` - Path to SSH private key (or use `NAS_SSH_KEY_PATH` env var)
- `--port` - SSH port (default: 22)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "stdout": "container output here",
    "stderr": "",
    "exit_code": 0
  }
}
```

**Exit Codes:**
- `0` - Docker command executed successfully
- `1` - SSH or Docker command failed

**Example:**
```bash
node scripts/nas/nas-docker.js \
  --host 10.0.0.149 \
  --command "ps -a"
```

**Used By:** CodeBot, Fettbot

---

### 3.3 `nas-file-exists.js`
Check if a file exists on the NAS.

**Usage:**
```bash
node scripts/nas/nas-file-exists.js --host <host> --path <filepath> [--user <user>] [--key <keypath>]
```

**Required Arguments:**
- `--host` - NAS hostname or IP
- `--path` - File path to check

**Optional Arguments:**
- `--user` - SSH username (default: `root`)
- `--key` - Path to SSH private key (or use `NAS_SSH_KEY_PATH` env var)
- `--port` - SSH port (default: 22)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "path": "/volume1/docker/app/config.json"
  }
}
```

**Exit Codes:**
- `0` - Check completed successfully (regardless of existence)
- `1` - SSH connection failed

**Example:**
```bash
node scripts/nas/nas-file-exists.js \
  --host 10.0.0.149 \
  --path "/volume1/docker/app/config.json"
```

**Used By:** All agents

---

### 3.4 `nas-file-read.js`
Read a file from the NAS.

**Usage:**
```bash
node scripts/nas/nas-file-read.js --host <host> --path <filepath> [--user <user>] [--key <keypath>]
```

**Required Arguments:**
- `--host` - NAS hostname or IP
- `--path` - File path to read

**Optional Arguments:**
- `--user` - SSH username (default: `root`)
- `--key` - Path to SSH private key (or use `NAS_SSH_KEY_PATH` env var)
- `--port` - SSH port (default: 22)
- `--encoding` - File encoding (default: `utf8`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "content": "file contents here...",
    "path": "/volume1/docker/app/config.json"
  }
}
```

**Exit Codes:**
- `0` - File read successfully
- `1` - SSH connection failed or file not found

**Example:**
```bash
node scripts/nas/nas-file-read.js \
  --host 10.0.0.149 \
  --path "/volume1/docker/app/config.json"
```

**Used By:** All agents

---

## 4. Database Scripts

### 4.1 `db-log-task.js`
Log a task to the `agent_logs` table.

**Usage:**
```bash
node scripts/database/db-log-task.js --agent <name> --task <description> --model <model> --status <status> [--ticket <id>] [--db-host <host>] [--db-user <user>] [--db-password <password>]
```

**Required Arguments:**
- `--agent` - Agent name (e.g., `CodeBot`, `GitGuardian`)
- `--task` - Task description
- `--model` - Model used (e.g., `claude-sonnet-4`)
- `--status` - Task status: `completed` or `failed`

**Optional Arguments:**
- `--ticket` - Kanban ticket ID (if applicable)
- `--db-host` - Database host (or use `DB_HOST` env var, default: `10.0.0.149`)
- `--db-port` - Database port (or use `DB_PORT` env var, default: `3306`)
- `--db-user` - Database user (or use `DB_USER` env var)
- `--db-password` - Database password (or use `DB_PASSWORD` env var)
- `--db-name` - Database name (or use `DB_NAME` env var, default: `fettbot_operations`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "log_id": 12345,
    "agent_name": "CodeBot",
    "logged_at": "2026-03-15T14:45:00Z"
  }
}
```

**Exit Codes:**
- `0` - Task logged successfully
- `1` - Database connection or insert failed

**Example:**
```bash
node scripts/database/db-log-task.js \
  --agent "CodeBot" \
  --task "Created deploy-health-check.js" \
  --model "claude-sonnet-4" \
  --status "completed" \
  --ticket "CARD-123"
```

**Used By:** All agents

---

### 4.2 `db-query.js`
Execute a SELECT query against the database.

**Usage:**
```bash
node scripts/database/db-query.js --query <sql> [--db-host <host>] [--db-user <user>] [--db-password <password>]
```

**Required Arguments:**
- `--query` - SQL SELECT query (must start with `SELECT`)

**Optional Arguments:**
- `--db-host` - Database host (or use `DB_HOST` env var, default: `10.0.0.149`)
- `--db-port` - Database port (or use `DB_PORT` env var, default: `3306`)
- `--db-user` - Database user (or use `DB_USER` env var)
- `--db-password` - Database password (or use `DB_PASSWORD` env var)
- `--db-name` - Database name (or use `DB_NAME` env var, default: `fettbot_operations`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "rows": [
      { "id": 1, "agent_name": "CodeBot", "status": "completed" }
    ],
    "count": 1
  }
}
```

**Exit Codes:**
- `0` - Query executed successfully
- `1` - Database connection failed, query validation failed, or non-SELECT query

**Example:**
```bash
node scripts/database/db-query.js \
  --query "SELECT * FROM agent_logs WHERE agent_name = 'CodeBot' ORDER BY created_at DESC LIMIT 10"
```

**Used By:** Fettbot

---

## 5. Deployment Scripts

### 5.1 `deploy-docker.js`
Deploy a Docker Compose stack to the NAS.

**Usage:**
```bash
node scripts/deployment/deploy-docker.js --host <host> --compose-file <path> [--project <name>] [--user <user>] [--key <keypath>]
```

**Required Arguments:**
- `--host` - NAS hostname or IP
- `--compose-file` - Path to docker-compose.yml on NAS

**Optional Arguments:**
- `--project` - Docker Compose project name (default: directory name)
- `--user` - SSH username (default: `root`)
- `--key` - Path to SSH private key (or use `NAS_SSH_KEY_PATH` env var)
- `--port` - SSH port (default: 22)
- `--pull` - Pull latest images before deploy (boolean flag)
- `--build` - Build images before deploy (boolean flag)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "project": "fettbot-api",
    "services_started": ["api", "worker"],
    "stdout": "deployment output...",
    "deployed_at": "2026-03-15T14:50:00Z"
  }
}
```

**Exit Codes:**
- `0` - Deployment successful
- `1` - Deployment failed (SSH error, Docker Compose error)

**Example:**
```bash
node scripts/deployment/deploy-docker.js \
  --host 10.0.0.149 \
  --compose-file "/volume1/docker/fettbot-api/docker-compose.yml" \
  --project "fettbot-api" \
  --pull
```

**Used By:** CodeBot

---

### 5.2 `deploy-health-check.js`
Check the health of a deployed service.

**Usage:**
```bash
node scripts/deployment/deploy-health-check.js --url <endpoint> [--method <method>] [--expected-status <code>] [--timeout <ms>]
```

**Required Arguments:**
- `--url` - Health check endpoint URL

**Optional Arguments:**
- `--method` - HTTP method (default: `GET`)
- `--expected-status` - Expected status code (default: `200`)
- `--timeout` - Request timeout in milliseconds (default: `5000`)
- `--retries` - Number of retry attempts (default: `3`)
- `--retry-delay` - Delay between retries in ms (default: `2000`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "url": "http://10.0.0.149:3100/health",
    "status": 200,
    "response_time_ms": 45,
    "healthy": true,
    "checked_at": "2026-03-15T14:55:00Z"
  }
}
```

**Exit Codes:**
- `0` - Service is healthy
- `1` - Service is unhealthy or unreachable

**Example:**
```bash
node scripts/deployment/deploy-health-check.js \
  --url "http://10.0.0.149:3100/health" \
  --expected-status 200 \
  --retries 5
```

**Used By:** TestBot

---

## 6. Testing Scripts

### 6.1 `test-npm.js`
Run npm test in a specified directory.

**Usage:**
```bash
node scripts/testing/test-npm.js --dir <directory> [--script <script-name>]
```

**Required Arguments:**
- `--dir` - Project directory containing package.json

**Optional Arguments:**
- `--script` - npm script to run (default: `test`)
- `--coverage` - Generate coverage report (boolean flag)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "exit_code": 0,
    "tests_passed": 42,
    "tests_failed": 0,
    "coverage": {
      "lines": 85.5,
      "branches": 78.2,
      "functions": 90.1,
      "statements": 85.5
    },
    "stdout": "test output...",
    "stderr": ""
  }
}
```

**Exit Codes:**
- `0` - Tests passed
- `1` - Tests failed or npm command error

**Example:**
```bash
node scripts/testing/test-npm.js \
  --dir "/path/to/project" \
  --script "test:unit" \
  --coverage
```

**Used By:** TestBot

---

### 6.2 `test-lint.js`
Run linting checks in a specified directory.

**Usage:**
```bash
node scripts/testing/test-lint.js --dir <directory> [--fix]
```

**Required Arguments:**
- `--dir` - Project directory

**Optional Arguments:**
- `--fix` - Auto-fix linting errors (boolean flag)
- `--format` - Output format: `stylish`, `json`, `compact` (default: `stylish`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "errors": 0,
    "warnings": 3,
    "fixable_errors": 0,
    "fixable_warnings": 2,
    "files_checked": 15,
    "stdout": "linting output..."
  }
}
```

**Exit Codes:**
- `0` - Linting passed (no errors, warnings OK)
- `1` - Linting failed (errors found)

**Example:**
```bash
node scripts/testing/test-lint.js \
  --dir "/path/to/project" \
  --fix
```

**Used By:** TestBot

---

### 6.3 `test-api-health.js`
Test API endpoint health and response validation.

**Usage:**
```bash
node scripts/testing/test-api-health.js --url <endpoint> [--method <method>] [--body <json>] [--headers <json>] [--expect <json-schema>]
```

**Required Arguments:**
- `--url` - API endpoint URL

**Optional Arguments:**
- `--method` - HTTP method (default: `GET`)
- `--body` - Request body (JSON string)
- `--headers` - Request headers (JSON string)
- `--expect` - Expected response schema (JSON Schema string)
- `--timeout` - Request timeout in ms (default: `5000`)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "url": "http://10.0.0.149:3100/api/agent-logs",
    "status": 200,
    "response_time_ms": 78,
    "schema_valid": true,
    "response_body": { /* API response */ }
  }
}
```

**Exit Codes:**
- `0` - API health check passed
- `1` - API health check failed (unreachable, unexpected status, schema mismatch)

**Example:**
```bash
node scripts/testing/test-api-health.js \
  --url "http://10.0.0.149:3100/api/agent-logs" \
  --method POST \
  --body '{"agent_name":"TestBot","task_description":"Test","model_used":"claude","status":"completed"}' \
  --headers '{"Content-Type":"application/json"}'
```

**Used By:** TestBot

---

## 7. Git Scripts

### 7.1 `git-branch-create.js`
Create a new Git branch.

**Usage:**
```bash
node scripts/git/git-branch-create.js --dir <directory> --branch <name> [--from <base-branch>]
```

**Required Arguments:**
- `--dir` - Git repository directory
- `--branch` - New branch name

**Optional Arguments:**
- `--from` - Base branch to create from (default: current branch)
- `--checkout` - Checkout the new branch after creation (boolean flag, default: true)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "branch": "feature/new-script",
    "from": "main",
    "checked_out": true,
    "created_at": "2026-03-15T15:00:00Z"
  }
}
```

**Exit Codes:**
- `0` - Branch created successfully
- `1` - Git command failed (branch exists, not a git repo)

**Example:**
```bash
node scripts/git/git-branch-create.js \
  --dir "/path/to/repo" \
  --branch "feature/deploy-health-check" \
  --from "main"
```

**Used By:** CodeBot

---

### 7.2 `git-commit-push.js`
Commit changes and push to remote.

**Usage:**
```bash
node scripts/git/git-commit-push.js --dir <directory> --message <msg> [--files <pattern>] [--push]
```

**Required Arguments:**
- `--dir` - Git repository directory
- `--message` - Commit message

**Optional Arguments:**
- `--files` - File pattern to stage (default: `.` for all changes)
- `--push` - Push to remote after commit (boolean flag, default: false)
- `--remote` - Remote name (default: `origin`)
- `--branch` - Branch to push (default: current branch)

**Return Format:**
```json
{
  "success": true,
  "data": {
    "commit_sha": "abc123...",
    "files_committed": 3,
    "pushed": true,
    "remote": "origin",
    "branch": "feature/new-script"
  }
}
```

**Exit Codes:**
- `0` - Commit (and push if requested) successful
- `1` - Git command failed (nothing to commit, push rejected)

**Example:**
```bash
node scripts/git/git-commit-push.js \
  --dir "/path/to/repo" \
  --message "Add deploy-health-check.js script" \
  --files "scripts/deployment/*" \
  --push
```

**Used By:** CodeBot

---

### 7.3 `git-status.js`
Check Git repository status.

**Usage:**
```bash
node scripts/git/git-status.js --dir <directory>
```

**Required Arguments:**
- `--dir` - Git repository directory

**Optional Arguments:**
None

**Return Format:**
```json
{
  "success": true,
  "data": {
    "branch": "feature/new-script",
    "clean": false,
    "ahead": 2,
    "behind": 0,
    "staged": 1,
    "modified": 2,
    "untracked": 1,
    "files": {
      "staged": ["scripts/deployment/deploy-health-check.js"],
      "modified": ["README.md", "package.json"],
      "untracked": ["temp.txt"]
    }
  }
}
```

**Exit Codes:**
- `0` - Status retrieved successfully
- `1` - Git command failed (not a git repo)

**Example:**
```bash
node scripts/git/git-status.js --dir "/path/to/repo"
```

**Used By:** CodeBot

---

## Implementation Plan

### PR Grouping

**PR1: CI/CD Setup**
- `.github/workflows/qa.yml` - ESLint + test runner
- `.eslintrc.js` - ESLint configuration
- `package.json` - Dependencies, scripts
- `.gitignore`
- `README.md` - Repository overview

**PR2: GitHub Scripts** (5 scripts)
1. `gh-pr-merge.js`
2. `gh-pr-create.js`
3. `gh-pr-status.js`
4. `gh-pr-files.js`
5. `gh-pr-review.js`

**PR3: Kanban Scripts** (5 scripts)
1. `kanban-create.js`
2. `kanban-update.js`
3. `kanban-status.js`
4. `kanban-get.js`
5. `kanban-query.js`

**PR4: NAS Scripts** (4 scripts)
1. `nas-ssh.js`
2. `nas-docker.js`
3. `nas-file-exists.js`
4. `nas-file-read.js`

**PR5: Database Scripts** (2 scripts)
1. `db-log-task.js`
2. `db-query.js`

**PR6: Deployment Scripts** (2 scripts)
1. `deploy-docker.js`
2. `deploy-health-check.js`

**PR7: Testing Scripts** (3 scripts)
1. `test-npm.js`
2. `test-lint.js`
3. `test-api-health.js`

**PR8: Git Scripts** (3 scripts)
1. `git-branch-create.js`
2. `git-commit-push.js`
3. `git-status.js`

**Total:** 8 PRs, 24 scripts + CI/CD setup

---

## Dependencies

### Core Dependencies
- `node` >= 18.0.0
- `@octokit/rest` - GitHub API
- `axios` - HTTP requests
- `ssh2` - SSH connections
- `mysql2` - MySQL/MariaDB client
- `yargs` - CLI argument parsing

### Dev Dependencies
- `eslint` - Code quality
- `jest` - Testing framework
- `@types/node` - TypeScript types (if using TS)

---

## Testing Requirements

Each script must have:
1. Unit tests for argument parsing
2. Mock tests for external API calls
3. Integration tests (optional, for CI/CD)

Test structure:
```
tests/
├── github/
│   ├── gh-pr-merge.test.js
│   ├── gh-pr-create.test.js
│   └── ...
├── kanban/
├── nas/
├── database/
├── deployment/
├── testing/
└── git/
```

---

## CI/CD Workflow

`.github/workflows/qa.yml`:
- Run on: Push, Pull Request
- Jobs:
  - Lint (ESLint)
  - Test (Jest with coverage)
  - Validate (no secrets in code)

---

## Security Considerations

1. **No Secrets in Repo:** All tokens/keys via arguments or env vars
2. **Input Validation:** Sanitize all user inputs
3. **SSH Key Management:** Keys stored outside repo, path passed as arg
4. **Database Credentials:** Never hardcoded
5. **Command Injection:** Properly escape all shell commands
6. **API Rate Limiting:** Implement retry logic with backoff

---

## Open Questions

1. **Kanban API Specification:** What is the actual Kanban API endpoint and authentication method?
2. **Database Schema:** Confirm `agent_logs` table schema (columns, types)
3. **SSH Key Location:** Where should agents store SSH keys? Shared location or agent-specific?
4. **Error Handling Strategy:** Should scripts retry on transient failures automatically or let caller handle retries?
5. **Logging Level:** Should scripts support verbose/debug output modes?

---

## Future Enhancements

- **Retry Logic:** Automatic retry with exponential backoff for transient failures
- **Dry-Run Mode:** Preview mode for destructive operations
- **Webhook Support:** Scripts to register/manage webhooks
- **Monitoring:** Script execution metrics and alerting
- **Caching:** Cache GitHub/Kanban API responses to reduce rate limit impact
- **Batch Operations:** Batch variants for bulk operations (e.g., close multiple PRs)

---

**End of Specification**
