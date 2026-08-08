---
name: stackdoctor-scan
description: Triggers the StackDoctor backend scanner via the local API to analyze a specified repository or folder path.
---

# `stackdoctor-scan` Skill

This skill allows an AI agent to programmatically trigger the StackDoctor scanning engine.

## Prerequisites
1. The backend server must be running (usually on `http://localhost:5001`).
2. MongoDB must be connected and the `.env` configured.

## Usage Instructions
To trigger a scan, use the `run_command` tool to execute a `curl` or `Invoke-WebRequest` command pointing to the backend API.

### Windows (PowerShell) Example:
```powershell
Invoke-WebRequest -Uri http://localhost:5001/api/scan `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"name":"Local Test", "path":"C:/path/to/project/to/scan"}'
```

### Response Handling
The API will return the newly created `Project` object with a status of `idle` or `scanning`. The backend will continue to process the scan asynchronously. 

You can then poll the `GET /api/scan/:id` endpoint to monitor the `status` field until it changes to `completed` or `failed`.

### Example Polling Command (PowerShell):
```powershell
$response = Invoke-RestMethod -Uri http://localhost:5001/api/scan/<PROJECT_ID>
Write-Output $response.status
```
