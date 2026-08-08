# StackDoctor AI Agent Rules

These rules define the behavior and constraints for AI agents interacting with the StackDoctor repository.

## 1. Project Overview
StackDoctor is an automated environment diagnostic tool. It scans repositories, inspects the local developer environment, and uses AI (Gemini) to propose fixes for environment mismatches.

## 2. Tech Stack and Constraints
*   **Frontend:** React + Vite. Do not introduce Next.js or other meta-frameworks. Use standard React components.
*   **Backend:** Node.js + Express.
*   **Database:** MongoDB via Prisma ORM.

## 3. Database Rules (CRITICAL)
*   **No Migrations:** Because we use MongoDB, do **NOT** run `prisma migrate`. 
*   **Generate Client:** Always use `npm run build` (which triggers `prisma generate`) when the `schema.prisma` file changes.
*   **Transactions:** The backend uses `$transaction` to ensure atomic updates when a scan completes. Do not break this transaction logic in `scan.service.js`.

## 4. Agentic Behavior Guidelines
*   **Focus on Diagnostics:** When adding new features, prioritize adding new deterministic rules to the diagnostic engine before relying on AI.
*   **Testing:** If modifying the frontend, test the interaction flow from the dashboard down to the backend `POST /api/scan` route.
*   **Port Management:** Be aware that the backend runs on port `5001` (to avoid postgres conflicts) and the frontend on port `5174`.
