const test = require('node:test');
const assert = require('node:assert/strict');
const { cargar } = require('./cargar');

test('las horas se calculan bien, incluso si el turno pasa de medianoche', () => {
  const js = cargar();
  assert.equal(js("horas('08:00','16:30')"), 8.5);
  assert.equal(js("horas('17:00','01:00')"), 8);
  assert.equal(js("horas('','16:00')"), 0);
});

test('una vacante sin llenar pasa al calendario general cuando vence el plazo', () => {
  const js = cargar();
  // v31 (Feria Inmobiliaria) es solo para el personal propio y cierra el 20 de octubre
  assert.equal(js("findV('e3','v31')[1].fase"), 'propio');
  js("DB.offsetH = 24*11; tick()");
  assert.equal(js("findV('e3','v31')[1].fase"), 'general');
});

test('si el operador no comparte su personal, la vacante vencida queda bloqueada', () => {
  const js = cargar();
  // v61 es de Montajes del Norte (no comparte) y su plazo vence el 14 de octubre
  js('DB.offsetH = 24*5; tick()');
  assert.equal(js("findV('e6','v61')[1].fase"), 'propio');
  assert.equal(js("findV('e6','v61')[1].bloqueada"), true);
});

test('un trabajador de otra empresa solo ve vacantes del calendario general si está en la bolsa', () => {
  const js = cargar();
  // w3 es de Catering La Arenosa; e2/v21 es de Eventos Caribe BTL y está en el calendario general
  assert.equal(js("visible(EV('e2'), findV('e2','v21')[1], W_('w3'))"), true);
  js("W_('w3').enBolsa = false");
  assert.equal(js("visible(EV('e2'), findV('e2','v21')[1], W_('w3'))"), false);
});

test('los eventos de un operador suspendido no se muestran a los trabajadores', () => {
  const js = cargar();
  assert.equal(js("visible(EV('e2'), findV('e2','v22')[1], W_('w10'))"), true);
  js("OP('op1').activo = false");
  assert.equal(js("visible(EV('e2'), findV('e2','v22')[1], W_('w10'))"), false);
});

test('el reemplazo solo propone personas que cumplen los requisitos obligatorios', () => {
  const js = cargar();
  const ids = js("candidatosReemplazo(EV('e1'), findV('e1','v11')[1]).map(w => w.id)");
  for (const id of ids) {
    assert.equal(js(`W_('${id}').roles.includes('Promotor/a BTL')`), true, `${id} debe tener el rol`);
    assert.equal(js(`W_('${id}').disp.includes(6)`), true, `${id} debe estar disponible el sábado`);
  }
  // w5 y w7 ya están postulados, no se vuelven a proponer
  assert.ok(!ids.includes('w5') && !ids.includes('w7'));
});

test('quien ya trabajó con el operador suma más puntaje que alguien de otra empresa', () => {
  const js = cargar();
  const propio = js("puntaje(EV('e2'), findV('e2','v21')[1], W_('w1')).puntaje");   // Eventos Caribe BTL
  const externo = js("puntaje(EV('e2'), findV('e2','v21')[1], W_('w13')).puntaje"); // Catering La Arenosa
  assert.ok(propio > externo);
});

test('el trabajador marca entrada y salida, y no puede marcar dos veces', () => {
  const js = cargar();
  js("[e,v] = findV('e0','v01')");
  // w9 está confirmada para hoy y no ha marcado
  assert.match(js("marcar(e, v, 'w9', 'ent')"), /Entrada marcada a las 18:00/);
  assert.equal(js("marcar(e, v, 'w9', 'ent')"), 'La entrada ya está marcada');
  js('DB.offsetH = 6');
  assert.match(js("marcar(e, v, 'w9', 'sal')"), /Trabajaste 6\.0 h/);
});

test('solo puede marcar quien está confirmado y el día del evento', () => {
  const js = cargar();
  // w13 está pendiente en el congreso del 23 de octubre
  assert.equal(js("marcar(EV('e2'), findV('e2','v21')[1], 'w13', 'ent')"), 'Solo puedes marcar el día del evento y si estás confirmado');
});

test('un registro validado queda bloqueado y solo entonces se puede calificar', () => {
  const js = cargar();
  js("[e,v] = findV('e0','v01'); DB.offsetH = 6");
  assert.equal(js("calificar(v, 'w1', 5)"), false, 'no se califica antes de validar');
  js("marcar(e, v, 'w1', 'sal')");
  assert.equal(js("validar(v, 'w1')"), true);
  assert.equal(js("marcar(e, v, 'w1', 'sal')"), 'El registro ya fue validado y no se puede cambiar');
  assert.equal(js("calificar(v, 'w1', 5)"), true);
});

test('un registro reportado no se puede validar hasta que el administrador lo resuelva', () => {
  const js = cargar();
  js("[e,v] = findV('e0','v01'); DB.offsetH = 6; marcar(e, v, 'w3', 'sal')");
  assert.equal(js("reportar(v, 'w3', 'La hora de salida no coincide')"), true);
  assert.equal(js("validar(v, 'w3')"), false);
  assert.equal(js("resolverReporte(v, 'w3', 'aceptar')"), true);
  assert.equal(js("v.asistencia.w3.validado"), true);
});
