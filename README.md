# IFB Materials App - Frontend

This is the frontend component of the IFB Materials Inventory OS, a high-performance web application designed for supply chain analysts to track inventory, analyze consumption trends, and manage dead stock.

## 🚀 Tech Stack

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Data Visualization**: [Recharts](https://recharts.org/)
*   **Data Fetching**: [Axios](https://axios-http.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Export Utility**: `xlsx`

## 💻 Key Features

*   **Premium Aesthetics**: Modern, responsive design featuring glassmorphism, dynamic layouts, and smooth micro-animations. Both Dark and Light modes are fully supported.
*   **Overview Dashboard**: View high-level KPIs, total materials tracked, stock coverage, and interact with a searchable/filterable master data table.
*   **Inventory Flow**: Track and visualize stock distribution across Central (GPC) and Branch warehouses.
*   **Aging & Dead Stock**: Instantly identify materials inactive for > 120 days or marked as obsolete.
*   **Analytics**: View month-over-month material consumption and historical behaviors via interactive charts.
*   **Admin Portal**: Seamless drag-and-drop file upload interface to ingest `procurement-data.xlsx` files straight into the database.

## 🛠️ Getting Started

### Prerequisites
*   Node.js 18.0 or higher
*   npm / yarn / pnpm

### Installation & Setup

1.  Navigate into the frontend directory:
    ```bash
    cd materials-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Ensure the FastAPI backend is running on `http://localhost:8000`.

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

```text
materials-app/
├── app/                  # Next.js App Router
│   ├── admin/            # Data import portal
│   ├── aging/            # Dead stock tracking
│   ├── analytics/        # Consumption trend charts
│   ├── inventory/        # GPC vs Branch distribution
│   ├── layout.tsx        # Root layout with Sidebar
│   └── page.tsx          # Main Dashboard
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn base components
│   ├── sidebar.tsx       # App navigation
│   └── theme-toggle.tsx  # Dark/light mode switcher
├── lib/                  # Shared utilities
│   └── utils.ts          # Tailwind merge & cn utility
└── public/               # Static assets (images, icons)
```