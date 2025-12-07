# BIBLIA DEL SISTEMA: DASHBOARD CON IA

Este documento tiene un único propósito: **Transferir todo el conocimiento técnico, explícito e implícito, necesario para reemplazar al arquitecto original del proyecto.** Cubre arquitectura, código, infraestructura, seguridad, costos y secretos no documentados.

---

## 1. Arquitectura Técnica Completa

El sistema es una aplicación web **Isomórfica de Microservicios** que actúa como interfaz personalizada sobre una base de datos NoSQL (Notion).

### Diagrama de Componentes y Red

```mermaid
graph TD
    subgraph "Capa de Presentación (Cliente)"
        Browser[Navegador Usuario]
        React[React SPA (Memoria)]
        LocalStorage[Almacenamiento Local]
    end

    subgraph "Capa de Infraestructura (Docker Host)"
        subgraph "Red Interna: app-network"
            Nginx[Nginx:80 (Gateway)]
            Node[Node.js:3001 (API Gateway)]
        end
    end

    subgraph "Capa de Datos y Servicios (SaaS)"
        Notion[Notion API (Persistencia)]
        N8N[N8N Workflow (Automatización)]
    end

    Browser -- HTTPS/443 --> Nginx
    Nginx -- Proxy_Pass --> Node
    Node -- HTTPS/JSON --> Notion
    Node -- HTTPS/JSON --> N8N
```

### Flujo de Ejecución Crítico

1.  **Inicialización**: `docker-compose` levanta la red. Nginx espera en puerto 8081. Node espera en 3001.
2.  **Carga**: Usuario accede. Nginx sirve estáticos. React hidrata la vista.
3.  **Datos**: React pide `/api/leads`. Nginx redirige a Node. Node firma la petición con `NOTION_API_KEY` y consulta Notion.
4.  **Transacción**: Usuario envía cotización. Node recibe POST, valida y reenvía a N8N (Fire-and-Forget).

---

## 2. Mapa del Código y Puntos Críticos

### Estructura de Archivos (El Mapa del Tesoro)

*   `docker-compose.yml`: **[CRÍTICO]** Define la red y las variables de entorno. Si esto falla, nada arranca.
*   `nginx.conf`: **[CRÍTICO]** Configura el enrutamiento. Un error aquí causa "404 Not Found" en la API.
*   `backend/server.js`: **[NÚCLEO]** Contiene la lógica de seguridad. Es el único lugar que conoce los secretos.
    *   *Punto Caliente*: La función `getHistory` tiene lógica de "fallback" para fechas inválidas.
*   `src/components/QuotesView.tsx`: **[COMPLEJO]** Maneja el estado del formulario gigante.
    *   *Deuda Técnica*: El cálculo de totales se hace en el cliente. Debería validarse en el servidor.
*   `src/services/pdfService.ts`: **[FRÁGIL]** Genera el PDF a mano (coordenada X, Y). Si cambias el texto, debes recalcular las coordenadas.

---

## 3. Reglas de Negocio (Pseudocódigo)

### Regla 1: Validación de Envío
```pseudocode
SI (Cliente Seleccionado == NULL) O (Lista Productos == VACÍA):
    BLOQUEAR Envío
    MOSTRAR Alerta "Faltan datos"
SINO:
    PERMITIR Envío
```

### Regla 2: Sanitización de Fechas (El problema "Invalid Date")
```pseudocode
ENTRADA: fecha_string (viene de Notion)
PROCESO:
    fecha_obj = PARSEAR(fecha_string)
    SI fecha_obj ES INVÁLIDA:
        RETORNAR "--:--"  // Fallback seguro
    SINO:
        RETORNAR FORMATO_ISO(fecha_obj)
```

### Regla 3: Persistencia de Leads
Los Leads **NO** se guardan en el servidor local. El servidor es "Stateless" (sin estado). Si reinicias Docker, no se pierden datos porque viven en Notion.

---

## 4. Infraestructura: Docker y Redes

### Volúmenes y Persistencia
*   **Backend**: No usa volúmenes persistentes. Es efímero.
*   **Frontend**: No usa volúmenes. Se reconstruye en cada deploy.
*   **Base de Datos**: Externa (Notion). No gestionamos su almacenamiento.

### Redes
Docker crea una red virtual `default`.
*   `erp-dashboard` (Frontend) ve a `backend` por su nombre de host: `http://backend:3001`.
*   Desde fuera (tu PC), solo ves `localhost:8081`. El puerto 3001 está cerrado al exterior en producción (según `docker-compose` actual está abierto, lo cual es un riesgo menor en dev pero debe cerrarse en prod).

---

## 5. Pipeline de Despliegue y Rollback

### Despliegue (Deployment)
1.  **Local**: `git push origin main`
2.  **Servidor**:
    ```bash
    git pull origin main
    docker compose down
    docker compose up --build -d
    ```

### Rollback (Volver atrás)
Si la nueva versión rompe todo:
1.  **Identificar commit anterior**: `git log` (ej. `a1b2c3d`)
2.  **Revertir código**: `git checkout a1b2c3d`
3.  **Redesplegar**:
    ```bash
    docker compose down
    docker compose up --build -d
    ```

---

## 6. Seguridad y Vectores de Ataque

### Modelo de Seguridad
*   **Autenticación**: **INEXISTENTE**. El sistema confía en que está en una red privada o protegido por VPN.
*   **Secretos**: Gestionados vía `.env`. Nunca hardcodeados.

### Vectores de Ataque
1.  **Acceso Público**: Si despliegas esto en una IP pública sin firewall, CUALQUIERA puede ver tus clientes.
    *   *Mitigación*: Usar VPN o Basic Auth en Nginx.
2.  **DoS (Denegación de Servicio)**: Un script puede llamar `/api/leads` 1000 veces/segundo y bloquear tu cuenta de Notion.
    *   *Mitigación*: Implementar `express-rate-limit` en `server.js`.
3.  **Inyección de Datos**: Notion sanitiza inputs, pero N8N podría ser vulnerable si no valida los datos del webhook.

---

## 7. Base de Datos (Esquema Notion)

Aunque flexible, el código espera esta estructura rígida:

| Tabla | Columna (Notion) | Tipo | Uso en Código |
| :--- | :--- | :--- | :--- |
| **Leads** | `Name` | Title | Nombre del Cliente |
| | `Phone` | Phone | Teléfono para WhatsApp |
| | `Status` | Select | Estado del Lead |
| **History** | `Description` | RichText | Detalle de la acción |
| | `Date` | Date | Timestamp del evento |

**Riesgo**: Si cambias el nombre de la columna "Name" a "Nombre" en Notion, **el sistema colapsa**.

---

## 8. Costos de Infraestructura

| Concepto | Costo Estimado | Notas |
| :--- | :--- | :--- |
| **VPS (Servidor)** | $5 - $10 USD/mes | DigitalOcean Droplet o AWS EC2 t3.micro |
| **Dominio** | $10 USD/año | Opcional (si usas IP directa es gratis) |
| **Notion** | Gratis / $10 USD | Gratis hasta cierto límite de bloques/API |
| **N8N** | Gratis (Self-hosted) | Si lo alojas en el mismo VPS |
| **Total** | **~$5 - $20 USD/mes** | Muy económico |

---

## 9. Deuda Técnica y Conocimiento No Documentado

### Lo que nadie te dice (hasta ahora):
1.  **Dependencia de N8N**: El chat y el envío de correos dependen 100% de que tu servidor de N8N esté vivo. Si N8N cae, el botón de "Enviar" parecerá funcionar pero no llegará nada.
2.  **PDF Frágil**: La generación de PDF usa coordenadas absolutas. Si el nombre del cliente es muy largo (más de 50 caracteres), se sobrepondrá al precio. No hay ajuste de texto automático.
3.  **Timezones**: Las fechas se guardan en UTC pero se muestran en local. Ojo con los reportes generados a medianoche; pueden salir con la fecha del día anterior.
4.  **Límite de Notion**: La API de Notion retorna máximo 100 items por página. El código actual maneja paginación (`hasMore`), pero si tienes 10,000 leads, la carga inicial tardará más de 10 segundos.

---

## 10. Monitoreo y Respuesta a Fallos

### Cómo saber si está vivo
*   **Comando**: `docker compose ps` (Debe decir "Up").
*   **Logs Backend**: `docker compose logs -f backend` (Busca errores rojos).
*   **Logs Nginx**: `docker compose logs -f erp-dashboard`.

### Protocolo de Emergencia
1.  **El sistema no carga**: Reinicia Docker (`docker compose restart`).
2.  **Error de API**: Verifica que la `NOTION_API_KEY` no haya expirado o sido revocada en Notion.
3.  **Botón no funciona**: Revisa la consola del navegador (F12) y verifica si hay errores de red (CORS o 500).

---

**Esta es la totalidad del conocimiento técnico del proyecto.** Con este documento, tienes el control absoluto.
