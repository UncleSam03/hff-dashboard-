# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Google Sheets (real-time stats)

This dashboard can load the latest register from Google Sheets and auto-refresh it (every 15s), and it can also **sync an uploaded XLSX/CSV register into Google Sheets**.

### 1) Create `.env.local`

Create a file named `.env.local` in the project root (`hff-dashboard/`) with:

```bash
HFF_API_PORT=8787
HFF_SPREADSHEET_ID=PUT_YOUR_SPREADSHEET_ID_HERE
HFF_REGISTER_SHEET_NAME=Register
# Optional (defaults to auto-detect hff-dashboard-*.json in project root)
# HFF_GOOGLE_CREDENTIALS_PATH=./hff-dashboard-xxxx.json
```

### 2) Share the spreadsheet with the service account

Open your Google service-account JSON and copy the `client_email`, then share the spreadsheet with that email (Editor access).

### 3) Run

In one terminal:

```bash
npm run dev:api
```

In another terminal:

```bash
npm run dev
```

Then open the Vite URL and use **Load Live** on the dashboard.
