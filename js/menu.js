document.addEventListener('DOMContentLoaded', function () {
  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // el panel del dueño muestra este mismo menú adentro de un marco de teléfono
  var enVistaPrevia = window.parent !== window;
  if (enVistaPrevia) document.documentElement.classList.add('en-vista-previa');

  // colores que el dueño puede elegir: todos dan contraste AA con texto blanco
  var COLORES = {
    rojo: ['#c1272d', '#8f1a1f'],
    naranja: ['#b45309', '#8a3f06'],
    verde: ['#0f7a40', '#0a5a2f'],
    azul: ['#1d4ed8', '#173ea8'],
    violeta: ['#6d28d9', '#531fa6'],
    grafito: ['#2b2320', '#15110f']
  };

  var nav = document.getElementById('categoryNav');
  var content = document.getElementById('menuContent');
  var indicador = null;
  var links = [];
  var sections = [];
  var activa = -1;
  var bloqueoHasta = 0; // mientras dura el desplazamiento de un toque, manda la categoría tocada
  var escuchando = false;
  var primeraVez = true;

  fetch('data/menu.json')
    .then(function (res) {
      if (!res.ok) throw new Error('No se pudo cargar el menú');
      return res.json();
    })
    .then(function (data) {
      aplicarEnlace(data);
      renderMenu(data);
      if (enVistaPrevia) window.parent.postMessage({ tipo: 'menu-listo' }, window.location.origin);
    })
    .catch(function (err) {
      content.innerHTML =
        '<p class="loading">No se pudo cargar el menú. Si estás abriendo el archivo directo (file://), levantá un servidor local (ver README).</p>';
      console.error(err);
    });

  // el panel manda el menú editado; solo se acepta del mismo sitio y de la ventana que lo contiene
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin || e.source !== window.parent) return;
    if (!e.data || e.data.tipo !== 'menu-vista-previa' || !e.data.menu) return;
    renderMenu(e.data.menu, e.data.resaltar);
  });

  // el QR de prueba lleva el nombre y el color del negocio en el enlace (#n=...&c=...)
  function aplicarEnlace(data) {
    var parametros = new URLSearchParams(window.location.hash.slice(1));
    var nombre = (parametros.get('n') || '').trim().slice(0, 40);
    var color = parametros.get('c');
    if (nombre) {
      data.negocio.nombre = nombre;
      data.negocio.personalizado = true;
    }
    if (COLORES[color]) data.negocio.color = color;
  }

  function iniciales(nombre) {
    var palabras = String(nombre).trim().split(/\s+/).filter(function (p) { return /[a-záéíóúñü0-9]/i.test(p.charAt(0)); });
    var letras = palabras.length > 1 ? palabras[0].charAt(0) + palabras[1].charAt(0) : (palabras[0] || '').slice(0, 2);
    return letras.toUpperCase();
  }

  function buildBadge(className, text) {
    var badge = document.createElement('span');
    badge.className = 'badge ' + className;
    badge.textContent = text;
    return badge;
  }

  // "2026-08-31" → "31 de agosto". Se arma a mano para que no corra un día por el huso horario.
  function fechaLegible(iso) {
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!partes) return iso || '—';
    var fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  }

  function renderEncabezado(negocio) {
    var color = COLORES[negocio.color] || COLORES.rojo;
    document.documentElement.style.setProperty('--color-primary', color[0]);
    document.documentElement.style.setProperty('--color-primary-dark', color[1]);
    var tema = document.querySelector('meta[name="theme-color"]');
    if (tema) tema.setAttribute('content', color[0]);

    document.title = 'Menú — ' + negocio.nombre;
    document.getElementById('nombreNegocio').textContent = negocio.nombre;
    document.getElementById('fechaActualizado').textContent = fechaLegible(negocio.actualizado);

    // un negocio con nombre propio lleva su monograma en lugar del logo de la pizzería de ejemplo
    var logo = document.getElementById('logoNegocio');
    var monograma = document.getElementById('monogramaNegocio');
    monograma.textContent = iniciales(negocio.nombre);
    logo.hidden = Boolean(negocio.personalizado);
    monograma.hidden = !negocio.personalizado;

    var datosNegocio = document.getElementById('datosNegocio');
    var datos = [negocio.direccion, negocio.horario].filter(Boolean);
    datosNegocio.textContent = '';
    datos.forEach(function (dato) {
      var linea = document.createElement('span');
      linea.textContent = dato;
      datosNegocio.appendChild(linea);
    });
    datosNegocio.hidden = !datos.length;

    var waLink = 'https://wa.me/' + negocio.whatsapp + '?text=' +
      encodeURIComponent('Hola ' + negocio.nombre + ', quiero hacer un pedido');
    document.getElementById('whatsappFloat').setAttribute('href', waLink);
  }

  function renderMenu(data, resaltarId) {
    var desplazado = window.scrollY;
    renderEncabezado(data.negocio);

    nav.innerHTML = '';
    content.innerHTML = '';

    // la pastilla que marca la categoría activa: una sola, que se desliza de una a otra
    indicador = document.createElement('span');
    indicador.className = 'category-indicator';
    indicador.setAttribute('aria-hidden', 'true');
    nav.appendChild(indicador);

    data.categorias.forEach(function (cat) {
      var navLink = document.createElement('a');
      navLink.href = '#cat-' + cat.id;
      navLink.textContent = cat.nombre;
      nav.appendChild(navLink);

      var block = document.createElement('section');
      block.className = 'category-block';
      block.id = 'cat-' + cat.id;

      var title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = cat.nombre;
      block.appendChild(title);

      cat.items.forEach(function (item, itemIndex) {
        var card = document.createElement('article');
        card.className = 'item-card' + (item.agotado ? ' agotado' : '');
        card.dataset.id = item.id;
        card.style.setProperty('--orden', Math.min(itemIndex, 8));

        // textContent en vez de innerHTML: el contenido del menú nunca se interpreta como HTML
        var info = document.createElement('div');
        info.className = 'item-info';

        var name = document.createElement('h3');
        name.textContent = item.nombre + ' ';
        if (item.destacado && !item.agotado) name.appendChild(buildBadge('badge-destacado', 'Plato del día'));
        if (item.agotado) name.appendChild(buildBadge('badge-agotado', 'Agotado'));
        info.appendChild(name);

        if (item.descripcion) {
          var desc = document.createElement('p');
          desc.textContent = item.descripcion;
          info.appendChild(desc);
        }

        var price = document.createElement('div');
        price.className = 'item-price';
        price.textContent = '$' + Number(item.precio).toLocaleString('es-AR');

        card.appendChild(info);
        card.appendChild(price);
        block.appendChild(card);
      });

      content.appendChild(block);
    });

    links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    sections = Array.prototype.slice.call(content.querySelectorAll('.category-block'));
    activa = -1;
    nav.classList.remove('lista');
    if (!links.length) return;

    links.forEach(function (link, index) {
      link.addEventListener('click', function (e) {
        // se desplaza a mano: el enlace no cambia, así el QR de prueba no pierde el nombre del negocio
        e.preventDefault();
        bloqueoHasta = Date.now() + 900;
        activar(index);
        irA(sections[index].offsetTop - nav.offsetHeight - 12, false);
      });
    });

    if (!escuchando) {
      escuchando = true;
      window.addEventListener('scroll', alDesplazar, { passive: true });
      window.addEventListener('scrollend', function () { bloqueoHasta = 0; });
      window.addEventListener('resize', moverIndicador);
      // el ancho de cada categoría cambia cuando termina de cargar la tipografía
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);
    }

    // al redibujar por un cambio del panel, el menú se queda donde estaba
    if (!primeraVez) window.scrollTo({ top: desplazado, behavior: 'instant' });
    activar(categoriaALaVista(), true);
    // la primera posición se fija sin animar; recién después la pastilla se desliza
    requestAnimationFrame(function () { nav.classList.add('lista'); });

    if (primeraVez) entradaEscalonada();
    primeraVez = false;

    if (resaltarId) resaltar(resaltarId);
  }

  function irA(top, inmediato) {
    // 'instant' y no 'auto': 'auto' obedece al scroll-behavior: smooth del CSS
    window.scrollTo({ top: Math.max(0, top), behavior: inmediato || sinMovimiento ? 'instant' : 'smooth' });
  }

  function moverIndicador() {
    var link = links[activa];
    if (!link || !indicador) return;
    indicador.style.width = link.offsetWidth + 'px';
    indicador.style.height = link.offsetHeight + 'px';
    indicador.style.transform = 'translate(' + link.offsetLeft + 'px, ' + link.offsetTop + 'px)';
  }

  function activar(index, inmediato) {
    if (index === activa) return;
    activa = index;
    links.forEach(function (l, i) {
      l.classList.toggle('active', i === index);
      if (i === index) l.setAttribute('aria-current', 'location');
      else l.removeAttribute('aria-current');
    });
    moverIndicador();

    // la barra acompaña: la categoría activa siempre queda a la vista
    var link = links[index];
    var destino = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    if (nav.scrollTo) nav.scrollTo({ left: destino, behavior: inmediato || sinMovimiento ? 'auto' : 'smooth' });
    else nav.scrollLeft = destino;
  }

  function categoriaALaVista() {
    // al final de la página manda la última, aunque sea corta y no llegue arriba
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return sections.length - 1;
    var linea = nav.offsetHeight + window.innerHeight * 0.25;
    var index = 0;
    sections.forEach(function (s, i) {
      if (s.getBoundingClientRect().top <= linea) index = i;
    });
    return index;
  }

  function alDesplazar() {
    if (Date.now() < bloqueoHasta || !links.length) return;
    activar(categoriaALaVista());
  }

  // cada categoría entra cuando aparece en pantalla, con sus platos en escalera
  function entradaEscalonada() {
    if (sinMovimiento || !('IntersectionObserver' in window)) return;
    var pendientes = sections.slice();
    pendientes.forEach(function (s) { s.classList.add('espera'); });
    var revelar = function (s) {
      s.classList.remove('espera');
      s.classList.add('entra');
    };
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revelar(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    pendientes.forEach(function (s) { observer.observe(s); });
    // red de seguridad: si el navegador no avisa, el menú no puede quedar invisible
    setTimeout(function () {
      pendientes.forEach(function (s) {
        if (s.classList.contains('espera')) revelar(s);
      });
    }, 2500);
  }

  // el plato que el dueño acaba de tocar en el panel: se lleva al centro y se marca un instante
  function resaltar(id) {
    var card = null;
    Array.prototype.forEach.call(content.querySelectorAll('.item-card'), function (c) {
      if (c.dataset.id === String(id)) card = c;
    });
    if (!card) return;
    var caja = card.getBoundingClientRect();
    var fueraDeVista = caja.top < nav.offsetHeight + 8 || caja.bottom > window.innerHeight - 8;
    // scrollTo y no scrollIntoView: este último también movería la página del panel
    // sin animar: mientras se escribe un precio el menú se redibuja en cada tecla
    if (fueraDeVista) irA(window.scrollY + caja.top - (window.innerHeight - caja.height) / 2, true);
    activar(categoriaALaVista());
    card.classList.add('cambio');
  }
});
