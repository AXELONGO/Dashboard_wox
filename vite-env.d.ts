/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NOTION_API_KEY: string
    readonly VITE_NOTION_DATABASE_ID: string
    readonly VITE_NOTION_HISTORY_DB_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
