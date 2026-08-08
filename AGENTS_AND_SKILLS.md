# Custom Agents and Skills

This repository includes custom agent configurations and skills to enhance automated development and diagnostics.

## Custom Agents

### 1. `StackDoctor Agent`
The StackDoctor Agent is a theoretical configuration of an AI coding assistant (like Claude or Gemini) when acting within this repository. 
*   **Role:** Diagnostic Assistant & Full-Stack Developer.
*   **Rules:** Documented in `.agents/AGENTS.md` (and symlinked `.clinerules`). The agent knows to never run database migrations, to respect the 5001/5174 port bindings, and to prioritize the deterministic Javascript diagnostic rules over pure AI guesses.

## Custom Skills

Custom skills are located in `.agents/skills/`.

### 1. `stackdoctor-scan`
*   **Path:** `.agents/skills/stackdoctor-scan/SKILL.md`
*   **Description:** This skill allows an AI agent to programmatically trigger the StackDoctor scanning engine via the local REST API.
*   **Usage:** An agent can invoke this skill to scan a target directory without needing to use the React frontend. It sends a `POST` request to `/api/scan` and polls the resulting project ID to wait for the analysis to complete.
