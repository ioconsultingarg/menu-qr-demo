document.addEventListener('DOMContentLoaded', function () {
  // Contacto de IO Consulting: solo el correo de la marca, ningún teléfono
  var CORREO_CONTACTO = 'contacto@ioconsulting.com.ar';

  // mismos colores que js/menu.js
  var COLORES = {
    rojo: ['#c1272d', '#8f1a1f'],
    naranja: ['#b45309', '#8a3f06'],
    verde: ['#0f7a40', '#0a5a2f'],
    azul: ['#1d4ed8', '#173ea8'],
    violeta: ['#6d28d9', '#531fa6'],
    grafito: ['#2b2320', '#15110f']
  };

  var menuData = null;
  var nombreOriginal = '';
  var qr = null;
  var relojQr = 0;
  var vistaPrevia = document.getElementById('vistaPrevia');
  var vistaLista = false;
  var inputNombre = document.getElementById('nombreNegocioInput');
  var inputVeces = document.getElementById('cuentaVeces');
  var inputCosto = document.getElementById('cuentaCosto');

  fetch('data/menu.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      menuData = data;
      nombreOriginal = data.negocio.nombre;
      menuData.negocio.color = 'rojo';
      renderCategorias();
      renderEditor();
      actualizarNegocio();
    })
    .catch(function (err) {
      document.getElementById('editorList').innerHTML =
        '<p>No se pudo cargar data/menu.json. Si estás abriendo el archivo directo (file://), levantá un servidor local (ver README).</p>';
      console.error(err);
    });

  // el menú del marco avisa cuando terminó de cargar; ahí recibe lo que ya se haya editado
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin || e.source !== vistaPrevia.contentWindow) return;
    if (!e.data || e.data.tipo !== 'menu-listo') return;
    vistaLista = true;
    enviarVistaPrevia();
  });

  /** Manda el menú tal como está al teléfono de la derecha; resaltarId marca el plato recién tocado. */
  function enviarVistaPrevia(resaltarId) {
    if (!vistaLista || !menuData) return;
    vistaPrevia.contentWindow.postMessage(
      { tipo: 'menu-vista-previa', menu: menuData, resaltar: resaltarId || null },
      window.location.origin
    );
  }

  function nombrePropio() {
    return inputNombre.value.trim();
  }

  function enlaceMenu() {
    var url = new URL('menu.html', window.location.href);
    var parametros = new URLSearchParams();
    if (nombrePropio()) parametros.set('n', nombrePropio());
    if (menuData.negocio.color !== 'rojo') parametros.set('c', menuData.negocio.color);
    // va después del #: el nombre del local no viaja al servidor
    url.hash = parametros.toString();
    return url.href;
  }

  function renderQR() {
    var destino = enlaceMenu();
    if (!window.QRCode) return;
    if (!qr) {
      qr = new QRCode(document.getElementById('qrcode'), { text: destino, width: 220, height: 220 });
    } else {
      qr.clear();
      qr.makeCode(destino);
    }
  }

  function actualizarNegocio() {
    var nombre = nombrePropio();
    var color = COLORES[menuData.negocio.color];
    menuData.negocio.nombre = nombre || nombreOriginal;
    menuData.negocio.personalizado = Boolean(nombre);

    // el panel también toma el color elegido
    document.documentElement.style.setProperty('--color-primary', color[0]);
    document.documentElement.style.setProperty('--color-primary-dark', color[1]);

    document.getElementById('cierreNombre').textContent = nombre || 'tu local';
    actualizarContacto();

    enviarVistaPrevia();
    // el QR se redibuja cuando se deja de escribir, no en cada tecla
    clearTimeout(relojQr);
    relojQr = setTimeout(renderQR, 250);
  }

  /** El correo lleva lo que el dueño ya contó: su local y cuántas veces reimprimió. */
  function actualizarContacto() {
    var nombre = nombrePropio();
    var veces = Math.floor(Number(inputVeces.value) || 0);
    var mensaje = 'Hola, vi la demo del menú digital por QR' +
      (nombre ? ' y la probé con mi local, ' + nombre : '') + '.' +
      (veces > 0 ? ' Este año reimprimí la carta ' + veces + (veces === 1 ? ' vez.' : ' veces.') : '') +
      ' Quiero coordinar la reunión inicial.';
    document.getElementById('btnContacto').setAttribute('href',
      'mailto:' + CORREO_CONTACTO +
      '?subject=' + encodeURIComponent('Menú digital por QR' + (nombre ? ' para ' + nombre : '')) +
      '&body=' + encodeURIComponent(mensaje));
  }

  // La cuenta la hace el dueño con sus números: acá no hay promedios ni estimaciones nuestras
  function actualizarCuenta() {
    var veces = Math.max(0, Math.floor(Number(inputVeces.value) || 0));
    var costo = Math.max(0, Number(inputCosto.value) || 0);
    var resultado = document.getElementById('cuentaResultado');
    var total = veces * costo;
    resultado.textContent = '';
    if (veces > 0 && costo > 0) {
      var cifra = document.createElement('strong');
      cifra.textContent = '$' + total.toLocaleString('es-AR', { maximumFractionDigits: 0 });
      resultado.appendChild(document.createTextNode('Este año se te fueron '));
      resultado.appendChild(cifra);
      resultado.appendChild(document.createTextNode(' en reimprimir la carta. Con el menú por QR, cambiarla no cuesta una reimpresión.'));
      resultado.classList.add('cuenta-lista');
    } else {
      resultado.textContent = 'Completá los dos números y te mostramos la cuenta.';
      resultado.classList.remove('cuenta-lista');
    }
    actualizarContacto();
  }

  inputVeces.addEventListener('input', actualizarCuenta);
  inputCosto.addEventListener('input', actualizarCuenta);

  inputNombre.addEventListener('input', actualizarNegocio);
  document.querySelectorAll('input[name="color"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      menuData.negocio.color = radio.value;
      actualizarNegocio();
    });
  });

  function renderCategorias() {
    var select = document.getElementById('selCategoria');
    menuData.categorias.forEach(function (cat, catIndex) {
      var option = document.createElement('option');
      option.value = catIndex;
      option.textContent = cat.nombre;
      select.appendChild(option);
    });
  }

  function renderEditor() {
    var list = document.getElementById('editorList');
    list.innerHTML = '';

    menuData.categorias.forEach(function (cat) {
      var heading = document.createElement('h3');
      heading.className = 'category-heading-edit';
      heading.textContent = cat.nombre;
      list.appendChild(heading);

      cat.items.forEach(function (item) {
        list.appendChild(buildEditRow(cat, item));
      });
    });
  }

  function buildEditRow(cat, item) {
    var row = document.createElement('div');
    row.className = 'edit-row';
    row.dataset.id = item.id;

    row.innerHTML =
      '<div>' +
        '<label>Nombre' +
          '<input type="text" data-field="nombre" value="' + escapeAttr(item.nombre) + '">' +
        '</label>' +
      '</div>' +
      '<div>' +
        '<label>Precio' +
          '<input type="number" min="0" inputmode="numeric" data-field="precio" value="' + escapeAttr(item.precio) + '">' +
        '</label>' +
      '</div>' +
      '<div class="edit-row-full">' +
        '<label>Descripción' +
          '<input type="text" data-field="descripcion" value="' + escapeAttr(item.descripcion || '') + '">' +
        '</label>' +
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
        enviarVistaPrevia(item.id);
      });
    });

    row.querySelector('.btn-danger').addEventListener('click', function () {
      if (!confirm('¿Eliminar "' + item.nombre + '" del menú?')) return;
      cat.items.splice(cat.items.indexOf(item), 1);
      row.remove();
      enviarVistaPrevia();
      avisar('Se quitó "' + item.nombre + '" del menú');
    });

    return row;
  }

  document.getElementById('btnAgregar').addEventListener('click', function () {
    if (!menuData) return;
    var cat = menuData.categorias[document.getElementById('selCategoria').value] || menuData.categorias[0];
    var item = {
      id: 'item-' + Date.now(),
      nombre: 'Plato nuevo',
      descripcion: '',
      precio: 0,
      agotado: false,
      destacado: false
    };
    cat.items.push(item);
    renderEditor();
    enviarVistaPrevia(item.id);

    // el plato nuevo queda listo para escribirle el nombre encima
    var nuevo = null;
    document.querySelectorAll('.edit-row').forEach(function (r) {
      if (r.dataset.id === item.id) nuevo = r;
    });
    if (nuevo) {
      nuevo.classList.add('edit-row-nueva');
      var nombre = nuevo.querySelector('input[data-field="nombre"]');
      nombre.focus();
      nombre.select();
    }
  });

  document.getElementById('btnDescargar').addEventListener('click', function () {
    if (!menuData) return;
    menuData.negocio.actualizado = new Date().toISOString().slice(0, 10);
    // lo que es solo de esta pantalla no va al archivo
    var copia = JSON.parse(JSON.stringify(menuData));
    delete copia.negocio.personalizado;
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'menu.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    avisar('Se descargó la carta como menu.json');
  });

  /** Aviso breve abajo de la pantalla: entra, se queda unos segundos y sale por donde vino. */
  function avisar(texto) {
    var aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.textContent = texto;
    document.getElementById('avisos').appendChild(aviso);
    setTimeout(function () {
      aviso.classList.add('aviso-sale');
      setTimeout(function () { aviso.remove(); }, 260);
    }, 3200);
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
});
