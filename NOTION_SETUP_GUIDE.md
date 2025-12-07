# Guía de Conexión con Notion

Para que el Dashboard muestre tus datos de Notion en la pestaña "Ventas", sigue estos pasos exactos:

## Paso 1: Crear la Integración (API Key)
1. Ve a [My Integrations](https://www.notion.so/my-integrations) en Notion.
2. Haz clic en **"New integration"**.
3. Ponle un nombre (ej: "ERP Dashboard").
4. Selecciona el espacio de trabajo donde están tus bases de datos.
5. Haz clic en **"Submit"**.
6. **Copia el "Internal Integration Secret"**. (Empieza con `secret_...`).

## Paso 2: Conectar las Bases de Datos
1. Abre tu base de datos de **Leads (Clientes)** en Notion (como página completa).
2. Haz clic en los **tres puntos (...)** arriba a la derecha.
3. Baja hasta **"Connections"** (o "Conexiones").
4. Busca y selecciona la integración que creaste en el Paso 1 ("ERP Dashboard").
5. Confirma el acceso.
6. **Repite esto para tu base de datos de Historial/Interacciones.**

## Paso 3: Obtener los IDs de las Bases de Datos
1. En la base de datos de Notion, haz clic en **"Share"** -> **"Copy link"**.
2. El enlace se ve así: `https://www.notion.so/myworkspace/a8aec43384f447ed84390e8e42c2e089?v=...`
3. El **ID** es la parte de 32 caracteres entre la barra `/` y el signo de interrogación `?`.
   - Ejemplo ID: `a8aec43384f447ed84390e8e42c2e089`

## Paso 4: Configurar el Dashboard
1. Abre el archivo `.env` en la carpeta del proyecto.
2. Pega tus credenciales:

```env
VITE_NOTION_API_KEY=secret_TU_CLAVE_AQUI
VITE_NOTION_DATABASE_ID=TU_ID_DE_LEADS_AQUI
VITE_NOTION_HISTORY_DB_ID=TU_ID_DE_HISTORIAL_AQUI
```

## Paso 5: Verificar Columnas
Para que los datos se vean correctamente, asegúrate de que tus bases de datos tengan estas propiedades (o edita `services/notionService.ts` para que coincidan):

**Base de Datos de Leads:**
- `Name` (Title) -> Nombre de la empresa/cliente
- `Address` (Text) -> Dirección
- `Phone` (Phone/Text) -> Teléfono
- `Website` (URL/Text) -> Sitio Web
- `Clase` (Select/Text) -> A, B, o C
- `Responsable` (Select/Text) -> Agente asignado

**Base de Datos de Historial:**
- `Name` (Title) -> Título de la interacción
- `Type` (Select) -> Tipo (Call, Email, Note)
- `Description` (Text) -> Detalle
- `ClientId` (Relation/Text) -> ID del cliente (para relacionarlo)

---
**Nota:** Una vez configurado esto, reinicia el contenedor Docker para aplicar los cambios del archivo `.env`.
