# 🧪 Lab Register

A lightweight, serverless laboratory inventory management system that uses **Google Sheets** as its database and **Google Apps Script** as its backend API. Built with React and Vite, this application provides a modern, fast, and highly responsive frontend for tracking lab materials, student fines, and daily stock usage without the need for complex database infrastructure.

![Smart Lab Register](public/favicon.svg) <!-- Consider replacing with a screenshot of your dashboard -->

## 🚀 Features

- **Serverless Architecture**: Your data is securely stored in your own Google Sheet. No SQL databases or backend servers to maintain.
- **Dynamic Inventory**: Organize items into customizable categories (e.g., Chemicals, Glassware). Columns dynamically adapt to track whatever properties you need.
- **Stock Tracking**: Quickly log daily stock usage by faculty or students and automatically generate receipts.
- **Low Stock Alerts**: Automatically triggers alerts and highlights items that fall below user-defined thresholds.
- **Fine Register**: A dedicated module for tracking damages, recording student fines, and logging penalties.
- **Bulk Import**: Quickly populate your inventory by uploading Excel (`.xlsx`) or CSV files directly through the UI.
- **Full Audit Logs**: A "bank statement" style audit trail that immutably logs every addition, deduction, and fine recorded in the system.
- **Data Export**: Export any filtered view of your inventory as an Excel report with a single click.

## 🛠️ Technology Stack

- **Frontend Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Responsive, Light-Mode focused interface)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Data Parsing/Export**: [SheetJS (XLSX)](https://docs.sheetjs.com/)
- **Backend / Database**: Google Apps Script & Google Sheets

## 📦 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eberjohns/lab-register.git
   cd lab-register
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## ⚙️ Google Apps Script Setup (Backend)

Because this app uses Google Sheets as a database, you must deploy the provided backend code.

1. Create a new **Google Sheet**.
2. Go to **Extensions &gt; Apps Script**.
3. Completely replace the default code with the contents of the `code.gs` file located in the root of this repository.
4. Click **Deploy &gt; New deployment**.
5. Select **Web app** as the deployment type.
6. Set "Execute as" to **Me** and "Who has access" to **Anyone**.
7. Click **Deploy** and authorize the script when prompted.
8. Copy the **Web app URL**.

## 🔗 Connecting the Frontend

Once you have your Google Apps Script Web App URL, append it to your frontend URL using the `api` query parameter:

```
http://localhost:5173/?api=YOUR_WEB_APP_URL
```

*(If you load the app without the `api` parameter, it will automatically display a setup manual.)*

## 📁 Project Structure

- `/src/views`: Contains all the main UI components (Dashboard, Inventory, BulkImport, Logs, etc.)
- `/src/api.js`: The frontend service layer that handles CORS-friendly `fetch` requests to your Google Apps Script URL.
- `code.gs`: The raw Google Apps Script backend code.
- `index.css`: The global stylesheet defining the light-mode UI, glassmorphism panels, and skeletal loaders.

---
*Designed for school, college, and university laboratories looking for a simpler way to manage inventory without replacing their familiar spreadsheets.*
