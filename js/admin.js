document.addEventListener('DOMContentLoaded', function () {
  var menuData = null;

  fetch('data/menu.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      menuData = data;
      renderQR();
      renderEditor();
    })
    .catch(function (err) {
      document.getElementById('editorList').innerHTML =
        '<p>No se pudo cargar data/menu.json. Si estás abriendo el archivo directo (file://), levantá un servidor local (ver README).</p>';
      console.error(err);
    });

  function renderQR() {
    var menuUrl = window.location.href.replace('admin.html', 'index.html');
    document.getElementById('menuUrlText').textContent = menuUrl;
    if (window.QRCode) {
      new QRCode(document.getElementById('qrcode'), {
        text: menuUrl,
        width: 220,
        height: 220
      });
    }
  }

  function renderEditor() {
    var list = document.getElementById('editorList');
    list.innerHTML = '';

    menuData.categorias.forEach(function (cat, catIndex) {
      var heading = document.createElement('h3');
      heading.className = 'category-heading-edit';
      heading.textContent = cat.nombre;
      list.appendChild(heading);

      cat.items.forEach(function (item, itemIndex) {
        list.appendChild(buildEditRow(cat, catIndex, item, itemIndex));
      });
    });
  }

  function buildEditRow(cat, catIndex, item, itemIndex) {
    var row = document.createElement('div');
    row.className = 'edit-row';

    row.innerHTML =
      '<div>' +
        '<label>Nombre</label>' +
        '<input type="text" data-field="nombre" value="' + escapeAttr(item.nombre) + '">' +
      '</div>' +
      '<div>' +
        '<label>Precio</label>' +
        '<input type="number" data-field="precio" value="' + item.precio + '">' +
      '</div>' +
      '<div style="grid-column: 1 / -1">' +
        '<label>Descripción</label>' +
        '<input type="text" data-field="descripcion" value="' + escapeAttr(item.descripcion || '') + '">' +
      '</div>' +
      '<div class="edit-row-toggles">' +
        '<label><input type="checkbox" data-field="agotado" ' + (item.agotado ? 'checked' : '') + '> Agotado</label>' +
        '<label><input type="checkbox" data-field="destacado" ' + (item.destacado ? 'checked' : '') + '> Plato del día</label>' +
      '</div>' +
      '<div class="edit-row-footer">' +
        '<span></span>' +
        '<button class="btn btn-danger" type="button">Eliminar</button>' +
      '</div>';

    row.querySelectorAll('input[data-field]').forEach(function (input) {
      var field = input.dataset.field;
      var evt = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(evt, function () {
        if (input.type === 'checkbox') {
          item[field] = input.checked;
        } else if (field === 'precio') {
          item[field] = Number(input.value) || 0;
        } else {
          item[field] = input.value;
        }
      });
    });

    row.querySelector('.btn-danger').addEventListener('click', function () {
      cat.items.splice(itemIndex, 1);
      renderEditor();
    });

    return row;
  }

  document.getElementById('btnAgregar').addEventListener('click', function () {
    var nombre = prompt('Nombre del nuevo plato:');
    if (!nombre) return;
    var cat = menuData.categorias[0];
    cat.items.push({
      id: 'item-' + Date.now(),
      nombre: nombre,
      descripcion: '',
      precio: 0,
      agotado: false,
      destacado: false
    });
    renderEditor();
  });

  document.getElementById('btnDescargar').addEventListener('click', function () {
    menuData.negocio.actualizado = new Date().toISOString().slice(0, 10);
    var blob = new Blob([JSON.stringify(menuData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'menu.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Se descargó menu.json actualizado. Reemplazalo en la carpeta data/ del repo y subilo a GitHub para publicar los cambios.');
  });

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }
});
