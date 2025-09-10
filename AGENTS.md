# Repository Guidelines

## Project Structure & Modules
- Source: `src/` (domain models in `src/models/*.ts`, types in `src/types`, DB layer in `src/database`, server in `src/server.ts`).
- Frontend: static assets in `src/public` (HTML, JS, Tailwind via CDN).
- Data: development JSON store at `src/db.json`.
- Config: `tsconfig.json` (type-check only), `Dockerfile` for container runs.

## Build, Test, and Development
- `npm run dev` / `npm start`: start Express server with Node 22 `--experimental-strip-types` at `http://localhost:5000`.
- `npm run demo`: run console demo (`src/index.ts`).
- Docker: `docker build -t mini-his .` then `docker run -p 5000:5000 mini-his`.

## Coding Style & Conventions
- Language: TypeScript (strict). Import with explicit `.ts` extensions (see `tsconfig.json: allowImportingTsExtensions`).
- Indentation: 2 spaces; use semicolons; single quotes.
- Types: prefer tagged unions (ADT) and `Result<T>` (`success`/`failure`) over throwing errors.
- Naming: PascalCase for types/interfaces and files in `models/` (e.g., `Patient.ts`); camelCase for functions/variables; UPPER_SNAKE for constant maps’ keys when applicable.
- Module layout: keep domain transitions pure; side effects (I/O, Express) in `server.ts` and `database/`.

## Testing Guidelines
- Framework: not configured yet. Recommended: Vitest + Supertest for API.
- Placement: `src/**/*.test.ts` near modules or `src/__tests__/`.
- Coverage: target 80%+ on `models/` and `types/` logic first.
- Examples:
  - Unit: `Patient.admitPatient` happy/invalid paths.
  - API: `POST /api/patients` returns 200 and persists.

## Commit & Pull Requests
- Commits: follow Conventional Commits (e.g., `feat(ui): improve appointment table`, `docs:`). English or 中文均可，一致即可。
- PRs must include:
  - Clear summary and scope, linked issues (e.g., `Closes #123`).
  - Screenshots/GIFs for UI changes (`src/public` pages).
  - API changes listed with sample requests/responses.
  - Notes on testing performed and risks.

## Security & Configuration
- `src/db.json` is for local/dev only; do not include real data.
- Port: server listens on 5000; prefer `PORT=5000` mapping when containerized.
- Keep `.ts` import extensions to match runtime; avoid mixing transpiled JS.
