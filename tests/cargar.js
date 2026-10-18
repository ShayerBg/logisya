// Carga logisya-data.js en un contexto aislado de Node, simulando lo mínimo del navegador
// (localStorage, window y document), para poder probar las reglas del negocio sin abrir la página.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function cargar() {
  const store = {};
  const ctx = {
    console,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
    window: { addEventListener() {} },
    document: { querySelector: () => null, createElement: () => ({ setAttribute() {}, appendChild() {} }), body: { appendChild() {} } },
  };
  vm.createContext(ctx);
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'logisya-data.js'), 'utf8');
  vm.runInContext(codigo, ctx);
  // Las declaraciones const/let/function del script quedan disponibles en el mismo contexto
  return expr => vm.runInContext(expr, ctx);
}

module.exports = { cargar };
