# menu-qr-demo

![Licencia: todos los derechos reservados](https://img.shields.io/badge/licencia-todos%20los%20derechos%20reservados-b91c1c) ![No es open source](https://img.shields.io/badge/open%20source-no-b91c1c)

> [!CAUTION]
> **© 2026 Gonzalo Nicolás Bravo — IO Consulting. Todos los derechos reservados.**
>
> Este repositorio es público **solo** para publicar la demo con GitHub Pages. **No es software libre ni de código abierto.** No tenés permiso para copiar, clonar, modificar, redistribuir ni reutilizar este código o sus partes en otros proyectos, personales o comerciales, ni para usarlo en el entrenamiento de modelos de IA. El uso no autorizado infringe la Ley 11.723 de Propiedad Intelectual (Argentina). Condiciones completas en [`LICENSE`](LICENSE). Para pedir permisos: contacto@ioconsulting.com.ar.
>
> **All rights reserved.** This repository is public **only** to serve a GitHub Pages demo. **It is not free or open source software.** You may not copy, clone, modify, redistribute or reuse this code or any part of it in other projects, personal or commercial, or use it to train AI models. Unauthorized use infringes copyright. Full terms in [`LICENSE`](LICENSE). To request permission: contacto@ioconsulting.com.ar.


Menú digital para escanear por QR en la mesa, demo de portfolio de **IO Consulting**. Mismo caso de uso que `landing-comercio-demo` ("Pizzería IO Consulting"), para mostrar dos soluciones distintas sobre el mismo cliente ficticio.

## Problema que resuelve

El dueño de un restaurante cambia precios o se le agota un plato varias veces por semana, y reimprimir el menú en papel cada vez es caro y lento. Con este menú digital, el QR de la mesa siempre apunta a la misma página; lo que cambia es el contenido, editable sin tocar código ni depender de una imprenta.

## Demo

- Entrada: `https://ioconsultingarg.github.io/menu-qr-demo/`
- Menú público: `https://ioconsultingarg.github.io/menu-qr-demo/menu.html`
- Panel del dueño, con vista previa en vivo (de acceso libre: no publica nada): `https://ioconsultingarg.github.io/menu-qr-demo/admin.html`

![Demo del panel admin: edición de precio y disponibilidad en vivo, con generación de QR](assets/menu-qr-admin-demo.gif)

## Stack

- HTML/CSS/JS puro, sin build step
- Los datos del menú viven en `data/menu.json` — el "motor" de esta demo es justamente que el contenido está separado del código
- Generación de QR en el cliente con [qrcodejs](https://github.com/davidshimjs/qrcodejs) (CDN)
- Google Fonts (Poppins + Inter)

## Cómo correrlo local

El menú usa `fetch()` para cargar `data/menu.json`, así que no funciona abriendo `menu.html` directo desde el explorador de archivos (protocolo `file://` bloquea el fetch). Levantá un servidor local simple:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Cómo se usa la demo

La puerta para quien evalúa el producto es `admin.html`:

1. **Probalo con tu negocio:** se escribe el nombre del local y se elige un color. El menú y el QR toman esa identidad.
2. **Cambiá la carta:** al tocar un precio, marcar "agotado" o "plato del día", el teléfono de la derecha muestra el cambio al instante y resalta el plato.
3. **Escaneá tu QR de prueba:** el QR abre el menú con el nombre y el color elegidos (viajan en el enlace, después del `#`).
4. **Lo quiero en mi local:** abre un correo a IO Consulting con el mensaje ya escrito.

La demo no tiene servidor: los cambios viven en la pantalla y se pierden al recargar. En una implementación real el panel se conecta a una base de datos y lo que se cambia queda guardado para todas las mesas. La carta armada se puede descargar como `menu.json` desde "Cómo funciona esta demo por dentro".

## Estructura

```
menu-qr-demo/
├── index.html       (entrada: el problema y las dos puertas, dueño o cliente)
├── menu.html         (menú público — esto abre el QR)
├── admin.html        (panel del dueño: vista previa en vivo, personalización y QR)
├── 404.html          (página de enlace no encontrado)
├── assets/           (favicon, imagen para compartir el link, GIF del README)
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
