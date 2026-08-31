# menu-qr-demo

Menú digital para escanear por QR en la mesa, demo de portfolio de **IO Consulting**. Mismo caso de uso que `landing-comercio-demo` ("Pizzería Don Mario"), para mostrar dos soluciones distintas sobre el mismo cliente ficticio.

## Problema que resuelve

El dueño de un restaurante cambia precios o se le agota un plato varias veces por semana, y reimprimir el menú en papel cada vez es caro y lento. Con este menú digital, el QR de la mesa siempre apunta a la misma página; lo que cambia es el contenido, editable sin tocar código ni depender de una imprenta.

## Demo

- Menú público: `https://ioconsultingarg.github.io/menu-qr-demo/`
- Panel del dueño (privado, no lincear públicamente): `https://ioconsultingarg.github.io/menu-qr-demo/admin.html`

## Stack

- HTML/CSS/JS puro, sin build step
- Los datos del menú viven en `data/menu.json` — el "motor" de esta demo es justamente que el contenido está separado del código
- Generación de QR en el cliente con [qrcodejs](https://github.com/davidshimjs/qrcodejs) (CDN)
- Google Fonts (Poppins + Inter)

## Cómo correrlo local

El menú usa `fetch()` para cargar `data/menu.json`, así que no funciona abriendo `index.html` directo desde el explorador de archivos (protocolo `file://` bloquea el fetch). Levantá un servidor local simple:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Cómo editar el menú (versión demo)

1. Abrí `admin.html`, cambiá precios, marcá "agotado" o "plato del día", agregá o eliminá platos.
2. Tocá **"Descargar menu.json"** — se descarga el archivo actualizado.
3. Reemplazá `data/menu.json` en el repo por el descargado.
4. Commit + push (o `git push` desde VS Code) — GitHub Pages se actualiza solo en 1-2 minutos.

Es un paso manual a propósito: esta es la versión demo sin backend. En una implementación real para un cliente, el panel se conecta a Supabase o Google Sheets y los cambios se ven al instante, sin descargar ni subir nada.

## Cómo generar e imprimir el QR

`admin.html` genera automáticamente un QR que apunta a `index.html` en la URL donde esté publicado el sitio. Al abrir esa página, hacé clic derecho sobre el QR → "Guardar imagen como" para imprimirlo y pegarlo en las mesas.

## Cómo adaptarlo a otro rubro

1. Reemplazar `data/menu.json` por las categorías/productos del nuevo negocio (funciona igual para una carta de bar, una lista de servicios de peluquería, etc.).
2. Cambiar las variables de color en `css/styles.css` (bloque `:root`).
3. Actualizar el número de WhatsApp en `negocio.whatsapp` dentro de `menu.json`.

## Estructura

```
menu-qr-demo/
├── index.html       (menú público — esto abre el QR)
├── admin.html        (panel del dueño + generador de QR)
├── css/styles.css
├── js/menu.js         (lógica del menú público)
├── js/admin.js         (lógica del editor y el QR)
├── data/menu.json       (contenido del menú)
├── README.md
└── LICENSE
```

## Próximas mejoras posibles

- Reemplazar el flujo de descarga/reemplazo manual por conexión real a Supabase o Google Sheets
- Autenticación simple para `admin.html` (hoy es solo "oculta", no protegida)
- Multi-idioma para zonas turísticas

---
Parte del portfolio de demos de transformación digital de IO Consulting.
