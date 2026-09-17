# Angadi Frontend (React + Vite + TypeScript)

This is the client-side single-page application for the **Angadi E-Commerce Platform**.

## Tech Stack
- **Framework:** React 19
- **Build Tool:** Vite 8
- **Language:** TypeScript 5.9
- **State Management:** Redux Toolkit 2
- **Routing:** React Router DOM 7
- **Styling:** Tailwind CSS 4 & Lucide React icons
- **API Client:** Axios with credentialed cookies & centralized error normalization
- **Linter:** Oxlint

## Available Scripts

### `npm run dev`
Starts the development server with Hot Module Replacement (HMR) at `http://localhost:5173`.

### `npm run build`
Typechecks the TypeScript source code (`tsc`) and compiles production assets into `dist/`.

### `npm run lint`
Runs Oxlint across the project for fast JavaScript/TypeScript static analysis.

### `npm run preview`
Locally previews the production build from the `dist/` directory.

## Backend Connection
The frontend connects to the Spring Boot REST API at `http://localhost:8080/api` (configured in `src/api/client.ts`). Ensure the backend service is running before accessing authenticated or dynamic features.
