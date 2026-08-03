# StackDoctor AI — Architectural Specification

This document details the complete design, data structures, and pipeline flow for the StackDoctor AI project.

## Core Pipeline (5 Words)
```
SCAN ──► INSPECT ──► COMPARE ──► DIAGNOSE ──► FIX
```

---

## 1. Phase 1: SCAN (Repository Scanner & Profile)
* **Goal**: Analyze the GitHub repository or local workspace folder to understand what technology stack and environment settings it requires.
* **Result**: Generates a **Project Requirements Profile**.

### Output JSON Schema Example
```json
{
  "node": ">=22",
  "java": "21",
  "docker": true,
  "services": [
    "postgresql",
    "redis"
  ],
  "ports": [
    8080,
    5432,
    6379
  ],
  "environmentVariables": [
    "DATABASE_URL",
    "DATABASE_PASSWORD",
    "JWT_SECRET"
  ]
}
```

---

## 2. Phase 2: INSPECT (CLI Environment Inspector)
* **Goal**: Run locally on the developer's PC via `stackdoctor diagnose`.
* **Result**: Generates an **Environment Snapshot**.

### Output JSON Schema Example
```json
{
  "os": "windows",
  "tools": {
    "node": "20.19.0",
    "java": "17",
    "python": "3.13",
    "git": "2.51",
    "docker": "29.5"
  },
  "dockerRunning": false,
  "occupiedPorts": [
    8080
  ]
}
```

---

## 3. Phase 3 & 4: COMPARE & DIAGNOSE (Diagnostic Engine)
* **Goal**: Perform a direct comparison of the **Project Requirements Profile** against the **Environment Snapshot** using structured javascript rules (no AI).
* **Result**: Produces a list of typed issues.

### Diagnostic Rules
1. **Rule 1**: Required Node vs Installed Node ──► `NODE_VERSION_MISMATCH`
2. **Rule 2**: Required Java vs Installed Java ──► `JAVA_VERSION_MISMATCH`
3. **Rule 3**: Docker required but daemon is stopped ──► `DOCKER_NOT_RUNNING`
4. **Rule 4**: Port required but bound by another local process ──► `PORT_CONFLICT`

### Output JSON Schema Example
```json
[
  {
    "code": "NODE_VERSION_MISMATCH",
    "severity": "ERROR",
    "required": ">=22",
    "actual": "20.19.0"
  },
  {
    "code": "DOCKER_NOT_RUNNING",
    "severity": "ERROR"
  },
  {
    "code": "PORT_CONFLICT",
    "severity": "WARNING",
    "port": 8080
  }
]
```

---

## 4. Phase 5: FIX (AI Integration)
* **Goal**: Query the LLM (Gemini) with the structured JSON diagnostics to generate step-by-step human explanations and terminal command suggestions.
* **Remediation Commands**: Sent back to the frontend report, and optionally executed securely via CLI upon developer confirmation.
