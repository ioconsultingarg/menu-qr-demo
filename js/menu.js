document.addEventListener('DOMContentLoaded', function () {
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

  function renderMenu(data) {
    document.getElementById('nombreNegocio').textContent = data.negocio.nombre;
    document.getElementById('fechaActualizado').textContent = data.negocio.actualizado;

    var waLink = 'https://wa.me/' + data.negocio.whatsapp + '?text=' +
      encodeURIComponent('Hola ' + data.negocio.nombre + ', quiero hacer un pedido');
    document.getElementById('whatsappFloat').setAttribute('href', waLink);

    var nav = document.getElementById('categoryNav');
    var content = document.getElementById('menuContent');
    nav.innerHTML = '';
    content.innerHTML = '';

    data.categorias.forEach(function (cat, index) {
      var navLink = document.createElement('a');
      navLink.href = '#cat-' + cat.id;
      navLink.textContent = cat.nombre;
      if (index === 0) navLink.classList.add('active');
      nav.appendChild(navLink);

      var block = document.createElement('section');
      block.className = 'category-block';
      block.id = 'cat-' + cat.id;

      var title = document.createElement('h2');
      title.className = 'category-title';
      title.textContent = cat.nombre;
      block.appendChild(title);

      cat.items.forEach(function (item) {
        var card = document.createElement('article');
        card.className = 'item-card' + (item.agotado ? ' agotado' : '');

        var badges = '';
        if (item.destacado && !item.agotado) badges += '<span class="badge badge-destacado">Plato del día</span>';
        if (item.agotado) badges += '<span class="badge badge-agotado">Agotado</span>';

        card.innerHTML =
          '<div class="item-info">' +
            '<h3>' + item.nombre + ' ' + badges + '</h3>' +
            (item.descripcion ? '<p>' + item.descripcion + '</p>' : '') +
          '</div>' +
          '<div class="item-price">$' + Number(item.precio).toLocaleString('es-AR') + '</div>';

        block.appendChild(card);
      });

      content.appendChild(block);
    });

    // resaltar categoría activa al hacer scroll
    var links = nav.querySelectorAll('a');
    var sections = content.querySelectorAll('.category-block');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.classList.remove('active'); });
            var active = nav.querySelector('a[href="#' + entry.target.id + '"]');
            if (active) active.classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      sections.forEach(function (s) { observer.observe(s); });
    }
  }
});
