# Documentación del Proyecto ERP Sales Dashboard

## 1. Introducción
Este documento detalla la estructura técnica, teórica y funcional del sistema **ERP Sales Dashboard**. El sistema está diseñado para gestionar prospectos (leads), realizar seguimiento (historial) y generar cotizaciones, integrándose con **Notion** como base de datos y **Google Gemini** para la generación de leads.

## 2. Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 19, Vite, TypeScript.
- **Estilos**: Tailwind CSS (con configuraciones personalizadas para modo oscuro/premium).
- **Base de Datos**: Notion (vía API).
- **IA**: Google Gemini (generación de leads).
- **PDF**: `jspdf` y `jspdf-autotable` (generación de reportes cliente-lado).
- **Automatización**: Webhooks a n8n (para notificaciones/procesos externos).

### Estructura de Carpetas
```
/
├── components/       # Componentes de UI (Header, Sidebar, MainContent, etc.)
├── services/         # Lógica de negocio y conexiones a APIs
│   ├── geminiService.ts  # Generación de leads con IA
│   ├── notionService.ts  # Conexión con Notion (Leads, Historial)
│   └── pdfService.ts     # Generación de PDFs
├── types.ts          # Definiciones de tipos TypeScript (Lead, HistoryItem, Quote)
├── App.tsx           # Componente principal y gestión de estado global
└── .env              # Variables de entorno (API Keys)
```

## 3. Base de Datos (Notion)

El sistema utiliza dos bases de datos principales en Notion.

### A. Base de Datos de Leads (Clientes)
Almacena la información de las empresas o prospectos.
- **ID**: `VITE_NOTION_DATABASE_ID`
- **Columnas Principales**:
    - `Name` (Title): Nombre de la empresa.
    - `Dirección` (Rich Text): Ubicación física.
    - `Teléfono` (Phone/Rich Text): Contacto telefónico.
    - `Website` (URL): Sitio web.
    - `Clase` (Select): Clasificación (A, B, C).
    - `Responsable` (Select): Asesor asignado.

### B. Base de Datos de Historial (Seguimiento)
Almacena cada interacción (llamada, correo, nota) con un cliente.
- **ID**: `VITE_NOTION_HISTORY_DB_ID`
- **Columnas Principales**:
    - `Asesor` (Title): Nombre del agente que realizó la acción.
    - `Cliente` (Relation): Relación con la DB de Leads. **Crucial para vincular notas.**
    - `Contacto` (Rich Text): Tipo de interacción (Llamada, Correo, Nota).
    - `Comentario` (Rich Text): Detalle de la nota.
    - `Fecha` (Date): Fecha y hora de la interacción.

## 4. Conexiones API y Seguridad

### Notion API
- **Backend Node.js**: Se utiliza un servidor Express (`backend/server.js`) como intermediario seguro.
- **Seguridad**: Las credenciales (`NOTION_API_KEY`, `NOTION_DATABASE_ID`) residen únicamente en el servidor, no en el cliente.
- **Endpoints**:
    - `GET /api/leads`: Obtiene empresas.
    - `GET /api/history`: Obtiene historial.
    - `POST /api/leads`: Crea nuevos prospectos.
    - `POST /api/history`: Guarda notas de seguimiento.

### Lógica del Sistema (Backend)
1.  **Lectura Inteligente**: El backend escanea las propiedades de Notion usando Expresiones Regulares (Regex) para identificar columnas (ej. "Dirección", "Address", "Ubicación") sin depender de nombres fijos.
2.  **Cruce de Datos (Join)**: El frontend descarga Leads y Historial por separado y los une en memoria mediante IDs para mostrar nombres y etiquetas en el historial.
3.  **Escritura Validada**: Al guardar una nota, el backend verifica el tipo de columna "Cliente" en Notion:
    - Si es **Relation**: Guarda el ID del lead (Enlace correcto).
    - Si es **Text**: Busca el nombre del lead y lo guarda como texto (Fallback).


### Flujo de Sincronización
1.  **Generación**: Gemini genera leads "en memoria" (IDs temporales `gen-...`).
2.  **Interacción**: Cuando el usuario guarda una nota o exporta un lead generado:
    - El sistema verifica si tiene `isSynced: true`.
    - Si no, llama a `syncLeadToNotion` para crear la página en Notion.
    - Recibe el ID real de Notion y actualiza el lead local.
    - Guarda la nota/historial vinculada a ese ID real.

### Webhooks y Automatización (n8n)
El sistema envía datos a flujos de trabajo en n8n para procesamiento externo:
- **Búsqueda de Leads**: `https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/Leads`
- **Registro de Notas**: `https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/CARGAR NOTAS`

## 5. Funcionalidades Clave

### Generación de PDF
- **Librería**: Se migró de scripts CDN a paquetes npm (`jspdf`, `jspdf-autotable`) para mayor estabilidad.
- **Uso**:
    - **Reporte de Cliente**: Genera un resumen del lead y todo su historial de seguimiento.
    - **Cotización**: Genera un documento formal con desglose de productos, IVA y totales.

### Edición de Precios
- En el módulo de Cotizaciones, el campo "Precio Unitario" permite edición manual precisa, aceptando decimales y recalculando totales en tiempo real.

### Historial y Persistencia
- El historial se carga al inicio desde Notion.
- Las nuevas notas se guardan optimísticamente en la UI y asíncronamente en Notion.
- Si un lead es nuevo, se crea automáticamente en Notion antes de guardarle notas.

### Visualizador de Datos Notion
Nueva funcionalidad que permite ver los datos crudos de Notion directamente en la aplicación.
- **Acceso**: Botón "📊 Datos Notion" en la barra superior.
- **Funciones**:
    - Tablas de Leads e Historial.
    - Búsqueda en tiempo real.
    - Exportación a CSV.
    - Indicadores de estado visuales.

## 6. Guía de Usuario Rápida

1.  **Buscar Leads**: Use la barra lateral izquierda para buscar por ubicación.
2.  **Guardar Nota**: Seleccione un lead, escriba en el área de texto y presione Enter o el botón de enviar.
3.  **Generar PDF**:
    - Para reporte de seguimiento: Botón "Exportar" en la tarjeta del lead.
    - Para cotización: Pestaña "Cotizaciones" -> Llenar datos -> "Generar PDF".
4.  **Clasificar**: Cambie la clase (A/B/C) desde los botones en la tarjeta del lead.

## 7. Mantenimiento y Buenas Prácticas

- **Variables de Entorno**: Nunca suba el archivo `.env` al repositorio público.
- **Tipado**: Mantenga `types.ts` actualizado si agrega nuevas columnas a Notion.

## 8. Guía de Docker

### Prerrequisitos
- Docker y Docker Compose instalados en su sistema.

### Estructura Docker
- **Dockerfile**: Construcción en dos etapas.
    1.  `build`: Usa Node.js para compilar el proyecto (`npm run build`).
    2.  `production`: Usa Nginx Alpine para servir los archivos estáticos optimizados.
- **nginx.conf**: Configuración personalizada para manejar el enrutamiento de la SPA (Single Page Application), redirigiendo todas las rutas a `index.html`.
- **docker-compose.yml**: Orquestación para levantar el servicio fácilmente, mapeando el puerto 8080 local al 80 del contenedor.


### Cómo Ejecutar (Opción Recomendada)

Debido a posibles conflictos de puertos y versiones de Docker Compose, recomendamos ejecutar el contenedor manualmente:

1.  **Construir la Imagen**:
    ```bash
    docker build -t erp-dashboard .
    ```

2.  **Ejecutar el Contenedor**:
    Usaremos el puerto **8081** para evitar conflictos con otros servicios.
    ```bash
    docker run -d -p 8081:80 --env-file .env --name erp-dashboard-manual erp-dashboard
    ```

3.  **Acceder**:
    Abra su navegador en `http://localhost:8081`.

4.  **Detener y Eliminar**:
    ```bash
    docker rm -f erp-dashboard-manual
    ```

### Solución de Problemas Comunes

#### 1. "command not found: docker"
Si recibe este error, Docker no está en su PATH. Ejecute este comando antes de los anteriores:
```bash
export PATH=$PATH:/Applications/Docker.app/Contents/Resources/bin
```

#### 2. Puerto ocupado
Si el puerto 8081 también está ocupado, cambie `-p 8081:80` por otro puerto, ej. `-p 8082:80`.

