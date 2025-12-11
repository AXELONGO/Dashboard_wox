# DASHBOARD ERP - Project Documentation

## Migration to Python/FastAPI & Tortoise ORM

This project has been migrated from a Node.js backend to a Python environment using **FastAPI** and **Tortoise ORM**.

### Architecture Overview

-   **Frontend**: React + TypeScript + Vite (Port 80/8081 via Nginx)
-   **Backend**: Python 3.12 + FastAPI (Port 8000)
-   **Database**: Notion API (Primary), Tortoise ORM/SQLite (Staging/Cache)
-   **Proxy**: Nginx (Reverse Proxy for API and Static Files)
-   **Containerization**: Docker + Docker Compose

### Prerequisites

-   Docker & Docker Compose
-   Python 3.12+ (for local development)
-   Node.js 20+ (for local frontend development)

### Environment Variables (.env)

Ensure your `.env` file contains the following (Google Auth removed):

```env
VITE_NOTION_API_KEY=your_notion_key
VITE_NOTION_DATABASE_ID=your_leads_db_id
VITE_NOTION_HISTORY_DB_ID=your_history_db_id
VITE_NOTION_CLIENTS_DB_ID=your_clients_db_id
VITE_NOTION_CLIENTS_HISTORY_DB_ID=your_clients_history_db_id
# VITE_GOOGLE_CLIENT_ID (Removed/Optional)
```

### Installation & Execution (Docker - Recommended)

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:8081` (or port defined in docker-compose).

### Installation & Execution (Local Development)

#### Backend (Python)
1.  Navigate to `backend_python`:
    ```bash
    cd backend_python
    ```
2.  Create virtual environment and install dependencies:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

#### Frontend (React)
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run development server:
    ```bash
    npm run dev
    ```
    (Note: You may need to update `vite.config.ts` proxy or `notionService.ts` to point to `http://localhost:8000` locally instead of `/api` if not using Nginx locally).

### Features
-   **Leads Management**: Syncs with Notion Database.
-   **Clients Management**: Manage Clients and their history separately from Leads.
-   **History**: Logs interactions with Notion History Database.
-   **PDF Quotes**: Generates PDF quotes on the client side.
-   **N8N Integration**: Proxies webhooks to N8N.

### Structure
-   `backend_python/`: FastAPI application.
    -   `main.py`: Entry point.
    -   `api/endpoints.py`: API Routes.
    -   `services/`: Business logic (`notion_service.py`, `data_processing.py`).
    -   `models/`: Tortoise ORM models.
-   `src/` (root): Frontend application.
