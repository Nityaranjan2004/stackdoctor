# StackDoctor

StackDoctor is a local repository and stack scanning, analysis, requirement extraction, and diagnostic system.

## How It Works (Real-World Scenario)

Imagine you are a software developer downloading a new project from GitHub. You want to run it on your computer, but you don't know what database, programming language, or tools it requires to work. 

Here is how **StackDoctor** helps you:

1. **Paste the URL**: You open StackDoctor's website and paste the project's GitHub URL.
2. **Scan the Project**: StackDoctor downloads the project files and automatically figures out what it needs (e.g., *"This project requires Node.js version 22 and a PostgreSQL database"*).
3. **Inspect Your Computer**: You run a simple command (`stackdoctor diagnose`) on your computer. StackDoctor checks what tools are actually installed on your machine.
4. **Compare**: StackDoctor compares what the **project needs** with what **your computer has** (e.g., *"The project needs Node 22, but you only have Node 20"*).
5. **Diagnose & Fix (AI)**: It displays a checklist showing any problems (mismatched versions, missing databases, occupied network ports) and uses AI to give you a simple, one-click button to fix the issues automatically.

In short: **Scan ──► Inspect ──► Compare ──► Diagnose ──► Fix**


## Project Structure

```
stackdoctor/
├── frontend/         # React + Vite + Javascript Frontend
├── backend/          # Node.js + Express + Javascript Backend
├── cli/              # Node.js + Javascript CLI
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Running the Application

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose

### Step 1: Start Database

```bash
docker compose up -d
```

### Step 2: Set up Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
