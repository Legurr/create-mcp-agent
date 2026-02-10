

# OMN Reviewer AI (MCP)

AI-powered Merge Request code reviewer for GitLab  
built on **Model Context Protocol (MCP)** and LLMs via **OpenRouter (Claude)**.

The project consists of:
- **MCP Server** — exposes tools (`get_mr_diff`, `post_mr_discussion`, `get_jira_issue`, KB access)
- **CLI Client** — orchestrates LLM interaction and tool calls
- Integrations with **GitLab** and **Jira**
- Knowledge Base (`.claude/`, `kb`)

## Installation

### Requirements
- Node.js **18+**
- npm **9+**

### Install dependencies
```bash
 npm install
````

### Build project

```bash
 npm run build
```

After build, the MCP server entrypoint will be available at:

```
dist/index.js
```

---

## Environment variables

All configuration is provided via environment variables.
Values are environment-specific and must be defined by the user or CI system.

### Required

#### OpenRouter (LLM)

* `OPENROUTER_API_KEY`
* `OPENROUTER_MODEL`

#### GitLab

* `GITLAB_TOKEN`
* `GITLAB_URL`

### Optional

#### Jira

* `JIRA_HOST`
* `JIRA_EMAIL`
* `JIRA_TOKEN`

### Notes

* Missing **required** variables will cause a startup error
* Jira integration is skipped if Jira variables are not configured
* Environment variables can be provided via `.env` file or CI configuration

---

## Running a review (CLI)

### Command

```bash
 npm run review -- <projectId> <mrIid>
```

### Example

```bash
 npm run review -- 1234 56
```

Where:

* `projectId` — GitLab project ID
* `mrIid` — Merge Request IID

## Testing with MCP Inspector

For local testing and debugging of MCP tools, use **MCP Inspector**.

### Run Inspector

```bash
 npm run inspect
```

The Inspector allows you to:

* manually invoke MCP tools
* validate input schemas
* inspect raw responses from GitLab and Jira
* test the MCP server **without running the LLM**
