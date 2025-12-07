# BIBLIA DEL SISTEMA: DASHBOARD CON IA (Enfoque Educativo)

> **"Dale un pez a un hombre y comerá un día; enséñale a pescar y comerá siempre."**

Este documento no es solo una lista de comandos; es un **mapa mental** diseñado para transferir el conocimiento profundo del sistema. Su objetivo es que entiendas no solo *qué* hace el código, sino *por qué* fue diseñado así y *cómo* pensar para resolver sus problemas.

---

## 1. Filosofía de Diseño: "Orden Cognitivo"

Antes de tocar una línea de código, entiende la filosofía visual que rige este proyecto. Hemos adoptado un diseño de **"Herramientas a la Izquierda, Trabajo a la Derecha"**.

*   **Zona de Herramientas (Izquierda)**: Aquí viven los menús, los filtros, el buscador de leads y el historial. Es tu "caja de herramientas".
*   **Zona de Trabajo (Derecha)**: Es el lienzo limpio. Aquí es donde el usuario *actúa* (ve la lista, hace scroll, envía cotizaciones).
*   **¿Por qué?**: Para evitar la **carga cognitiva**. Si mezclamos herramientas y contenido, el cerebro del usuario se satura. Al limpiar el lado derecho (moviendo el Chatbot y el Historial a la izquierda), liberamos espacio mental y visual para la tarea principal: **Vender**.

---

## 2. Arquitectura: La Analogía del Restaurante

Imagina que este sistema es un **Restaurante de Alta Cocina**.

### Los Actores (Componentes)

1.  **El Cliente (Navegador/React)**: Es el comensal sentado en la mesa. Ve el menú (la UI), pide platos (hace clics) y espera ser atendido.
    *   *Nota*: El cliente es impaciente. Si el plato tarda, se queja. Por eso usamos "spinners" (relojes de arena) para calmar su ansiedad.

2.  **El Mesero (Nginx)**: Es el primer punto de contacto.
    *   Recibe el pedido del cliente.
    *   Si es agua (archivos estáticos, imágenes), la sirve él mismo al instante.
    *   Si es un plato complejo (datos de la API), corre a la cocina a gritar la orden.
    *   **Función Crítica**: Actúa como "Proxy". El cliente nunca entra a la cocina; solo habla con el mesero.

3.  **El Chef (Node.js/Backend)**: Es el cerebro en la cocina.
    *   Recibe la orden del mesero (`GET /api/leads`).
    *   Verifica que la orden sea válida (Seguridad).
    *   Tiene la llave de la despensa (`NOTION_API_KEY`).

4.  **La Despensa (Notion)**: Es donde están los ingredientes crudos (los datos).
    *   Es externa y a veces lenta. El Chef debe tener paciencia.

5.  **El Repartidor (N8N)**: Es un servicio externo para envíos especiales (Webhooks).
    *   El Chef le da un paquete y el repartidor se va. El Chef no espera a que vuelva ("Fire-and-Forget").

### Diagrama Mental

```mermaid
graph LR
    Client[Cliente (React)] -- "Pide Plato" --> Mesero[Mesero (Nginx)]
    Mesero -- "Grita Orden" --> Chef[Chef (Node.js)]
    Chef -- "Busca Ingredientes" --> Despensa[Despensa (Notion)]
    Chef -- "Envía Paquete" --> Repartidor[Repartidor (N8N)]
```

---

## 3. El Arte de Reconstruir (Docker)

Docker es como un **molde de gelatina**.

*   **El Código** es la receta líquida.
*   **El Contenedor** es la gelatina ya cuajada.

### El Problema de la "Caché" (La Gelatina Vieja)
A veces, cambias la receta (el código), pero Docker dice: "Ya tengo una gelatina hecha, ¿para qué hacer otra?". Y te sirve la gelatina vieja. Esto es la **Caché**.

### La Solución: `--no-cache`
Cuando decimos "reconstruir sin caché", le estamos diciendo a Docker: **"Tira esa gelatina a la basura y haz una nueva desde cero, paso a paso"**.

*   **Comando Mágico**:
    ```bash
    docker compose build --no-cache
    ```
    *Úsalo cuando cambies algo en el código y sientas que el sistema te ignora.*

---

## 4. Troubleshooting Cognitivo: ¿Cómo Pensar el Error?

Cuando algo falla, no entres en pánico. Usa el método científico.

### Caso de Estudio: "El Botón de Enviar no hace nada"

1.  **Hipótesis 1: ¿Es el Cliente (React)?**
    *   *Prueba*: Abre la consola del navegador (F12). ¿Ves algún mensaje rojo?
    *   *Pensamiento*: "Si hay rojo aquí, el botón está roto antes de salir".

2.  **Hipótesis 2: ¿Es el Mesero (Red/Nginx)?**
    *   *Prueba*: Mira la pestaña "Network" (Red). ¿Ves la petición `webhook`? ¿Está en rojo (Error) o pendiente?
    *   *Pensamiento*: "Si dice 404, el mesero no sabe dónde está la cocina. Si dice 500, la cocina se incendió".

3.  **Hipótesis 3: ¿Es el Chef (Backend)?**
    *   *Prueba*: Mira los logs del servidor (`docker compose logs backend`).
    *   *Pensamiento*: "¿El Chef recibió la orden? ¿Se quejó de que faltaban ingredientes?".

4.  **Hipótesis 4: ¿Es el Repartidor (N8N)?**
    *   *Prueba*: Si todo lo anterior está bien (200 OK), pero no llega el mensaje...
    *   *Pensamiento*: "El repartidor se perdió en el camino o N8N está caído. Esto ya no es culpa de nuestro código".

---

## 5. Mapa de Puntos Críticos (Dónde tener cuidado)

*   **`nginx.conf`**: Las señales de tráfico. Si tocas esto mal, nadie llega a ningún lado.
*   **`QuotesView.tsx`**: El formulario gigante. Es complejo. Trátalo con respeto.
*   **`rebuild.sh`**: Tu botón de reinicio maestro. Si todo falla, ejecútalo.

---

## 6. Conclusión

Este sistema es robusto porque es modular. Cada parte tiene su trabajo. Tu trabajo como mantenedor no es solo escribir código, es **entender el flujo de la información** y asegurar que el Cliente, el Mesero y el Chef se comuniquen claramente.

> **Recuerda**: El código es para las máquinas, pero la documentación es para los humanos. Escribe siempre pensando en el humano que vendrá después de ti (que podrías ser tú mismo en 6 meses).
