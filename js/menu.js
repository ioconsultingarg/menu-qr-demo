document.addEventListener('DOMContentLoaded', function () {
  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fetch('data/menu.json')
    .then(function (res) {
      if (!res.ok) throw new Error('No se pudo cargar el menú');
      return res.json();
    })
    .then(renderMenu)
    .catch(function (err) {
      document.getElementById('menuContent').innerHTML =
        '<p class="loading">No se pudo cargar el menú. Si estás abriendo el archivo directo (file://), levantá un servidor local (ver README).</p>';
      console.error(err);
    });

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

  function renderMenu(data) {
    document.getElementById('nombreNegocio').textContent = data.negocio.nombre;
    document.getElementById('fechaActualizado').textContent = fechaLegible(data.negocio.actualizado);

    var datos = [data.negocio.direccion, data.negocio.horario].filter(Boolean);
    if (datos.length) {
      var datosNegocio = document.getElementById('datosNegocio');
      datosNegocio.textContent = '';
      datos.forEach(function (dato) {
        var linea = document.createElement('span');
        linea.textContent = dato;
        datosNegocio.appendChild(linea);
      });
      datosNegocio.hidden = false;
    }

    var waLink = 'https://wa.me/' + data.negocio.whatsapp + '?text=' +
      encodeURIComponent('Hola ' + data.negocio.nombre + ', quiero hacer un pedido');
    document.getElementById('whatsappFloat').setAttribute('href', waLink);

    var nav = document.getElementById('categoryNav');
    var content = document.getElementById('menuContent');
    nav.innerHTML = '';
    content.innerHTML = '';

    // la pastilla que marca la categoría activa: una sola, que se desliza de una a otra
    var indicador = document.createElement('span');
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

    var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
    var sections = Array.prototype.slice.call(content.querySelectorAll('.category-block'));
    if (!links.length) return;

    var activa = -1;
    var bloqueoHasta = 0; // mientras dura el desplazamiento de un toque, manda la categoría tocada

    function moverIndicador() {
      var link = links[activa];
      if (!link) return;
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
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return sections.length - 1;
      var linea = nav.offsetHeight + window.innerHeight * 0.25;
      var index = 0;
      sections.forEach(function (s, i) {
        if (s.getBoundingClientRect().top <= linea) index = i;
      });
      return index;
    }

    function alDesplazar() {
      if (Date.now() < bloqueoHasta) return;
      activar(categoriaALaVista());
    }

    links.forEach(function (link, index) {
      link.addEventListener('click', function () {
        bloqueoHasta = Date.now() + 900;
        activar(index);
      });
    });

    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('scrollend', function () {
      bloqueoHasta = 0;
    });
    window.addEventListener('resize', moverIndicador);
    // el ancho de cada categoría cambia cuando termina de cargar la tipografía
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);

    activar(categoriaALaVista(), true);
    // la primera posición se fija sin animar; recién después la pastilla se desliza
    requestAnimationFrame(function () {
      nav.classList.add('lista');
    });

    // cada categoría entra cuando aparece en pantalla, con sus platos en escalera
    if (!sinMovimiento && 'IntersectionObserver' in window) {
      sections.forEach(function (s) { s.classList.add('espera'); });
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
      sections.forEach(function (s) { observer.observe(s); });
      // red de seguridad: si el navegador no avisa, el menú no puede quedar invisible
      setTimeout(function () {
        sections.forEach(function (s) {
          if (s.classList.contains('espera')) revelar(s);
        });
      }, 2500);
    }
  }
});
