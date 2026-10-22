/* Medición de tiempo de respuesta de las acciones y de memoria del prototipo LogisYa.
   Equivale a lo que se ve en DevTools > Performance > pista Interactions (duration de
   PerformanceEventTiming) y en DevTools > Performance monitor (JS heap size).

   Uso:
     node pruebas/medir.js
     $env:REPS = "3"; node pruebas/medir.js

   Variables de entorno opcionales:
     EDGE_PATH    ruta al navegador Chromium/Edge
     LOGISYA_URL  base del sitio medido
     LOGISYA_OUT  carpeta donde se deja interacciones.json
     REPS         repeticiones por acción (por defecto 6)                          */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.LOGISYA_URL || 'https://sergioa3728.github.io/logisya';
const OUT = process.env.LOGISYA_OUT || path.join(__dirname, '..', 'reportes');
const CPU = 4; // mismo ralentizado de CPU que usa Lighthouse en emulación móvil
const REPS = Number(process.env.REPS || 6); // repeticiones por acción; se reporta la mediana

const OBSERVADOR = () => {
  window.__ev = [];
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        window.__ev.push({ name: e.name, dur: e.duration, start: e.startTime, proc: e.processingEnd - e.processingStart });
      }
    }).observe({ type: 'event', durationThreshold: 0, buffered: true });
  } catch (e) { window.__evError = String(e); }
};

async function abrirContexto(browser, throttled) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true });
  await page.evaluateOnNewDocument(OBSERVADOR);
  const cdp = await page.createCDPSession();
  if (throttled) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  return { ctx, page, cdp };
}

async function ir(page, ruta) {
  await page.goto(`${BASE}/${ruta}`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 250))));
}

async function medirClick(page, selector) {
  // Se asegura de que el elemento esté visible y no tapado antes de hacer clic
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('no existe ' + sel);
    el.scrollIntoView({ block: 'center', inline: 'center' });
  }, selector);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 150))));
  const tapado = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const enLaPunta = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return enLaPunta ? (el.contains(enLaPunta) || enLaPunta === el ? 'ok' : 'tapado por ' + enLaPunta.className) : 'fuera de pantalla';
  }, selector);
  if (tapado !== 'ok') throw new Error(`elemento no clicable: ${tapado}`);
  await page.evaluate(() => { window.__ev = []; });
  await page.click(selector);
  // Se espera a que el observador de Event Timing entregue la entrada (hasta 2 s)
  let e = null;
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
    const evs = await page.evaluate(() => window.__ev.filter(x => x.name === 'click'));
    if (evs.length) { e = evs[evs.length - 1]; break; }
  }
  if (!e) throw new Error(`no se registró evento de clic en ${selector}`);
  return { dur: e.dur, proc: e.proc };
}

/* El trabajador w9 (Yuleisy Ospino) está confirmado para el evento de hoy y no tiene la entrada
   marcada; w1 ya la trae marcada desde la semilla, así que su botón sería "Marcar salida". */
async function verComo(page, wid) {
  await page.select('#who', wid);
  await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
}

/* ---- Las seis acciones ---- */
const acciones = [
  {
    id: 'A1', rol: 'Operador', nombre: 'Confirmar postulante',
    async prep(page) {
      await ir(page, 'operador.html');
      await page.click('[data-act="ev"][data-v="e1"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 150)));
    },
    sel: '[data-act="confirm"]'
  },
  {
    id: 'A2', rol: 'Operador', nombre: 'Convocar a mi personal',
    async prep(page) {
      await ir(page, 'operador.html');
      await page.click('[data-act="ev"][data-v="e3"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 150)));
    },
    sel: '[data-act="convocar"]'
  },
  {
    id: 'A3', rol: 'Operador', nombre: 'Abrir vacante al calendario general',
    async prep(page) {
      await ir(page, 'operador.html');
      await page.click('[data-act="ev"][data-v="e3"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 150)));
    },
    sel: '[data-act="abrir"]'
  },
  {
    id: 'A4', rol: 'Operador', nombre: 'Validar registro de horas',
    async prep(page) {
      // El trabajador marca entrada y salida; el operador valida ese registro
      await ir(page, 'trabajador.html');
      await verComo(page, 'w9');
      await page.click('[data-act="view"][data-v="mis"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
      await page.click('[data-act="marcar"][data-t="ent"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
      await page.click('[data-act="adv"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
      await page.click('[data-act="marcar"][data-t="sal"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
      await ir(page, 'operador.html');
    },
    sel: '[data-act="validar"]'
  },
  {
    id: 'A5', rol: 'Trabajador', nombre: 'Postularse a una vacante',
    async prep(page) { await ir(page, 'trabajador.html'); },
    sel: '[data-act="postular"]'
  },
  {
    id: 'A6', rol: 'Trabajador', nombre: 'Marcar entrada del turno',
    async prep(page) {
      await ir(page, 'trabajador.html');
      await verComo(page, 'w9');
      await page.click('[data-act="view"][data-v="mis"]');
      await page.evaluate(() => new Promise(r => setTimeout(r, 200)));
    },
    sel: '[data-act="marcar"][data-t="ent"]'
  }
];

const VISTAS = ['index.html', 'operador.html', 'trabajador.html', 'admin.html'];

/* ---- Memoria: JS heap por vista ---- */
async function memoria(browser, throttled) {
  const filas = [];
  for (const vista of VISTAS) {
    for (let r = 1; r <= REPS; r++) {
      const { ctx, page, cdp } = await abrirContexto(browser, throttled);
      await cdp.send('Performance.enable');
      await cdp.send('HeapProfiler.enable');
      await ir(page, vista);
      await page.evaluate(() => new Promise(res => setTimeout(res, 600)));
      // Sin forzar la recolección, JSHeapUsedSize depende de cuándo corrió el GC y la cifra
      // varía entre muestras de la misma vista
      await cdp.send('HeapProfiler.collectGarbage');
      await page.evaluate(() => new Promise(res => setTimeout(res, 200)));
      const { metrics } = await cdp.send('Performance.getMetrics');
      const heap = metrics.find(m => m.name === 'JSHeapUsedSize').value;
      const total = metrics.find(m => m.name === 'JSHeapTotalSize').value;
      const nodos = await page.evaluate(() => document.getElementsByTagName('*').length);
      filas.push({
        vista: vista.replace('.html', ''), rep: r,
        heapMB: +(heap / 1048576).toFixed(2), totalMB: +(total / 1048576).toFixed(2), nodos
      });
      await ctx.close();
    }
  }
  return filas;
}

function mediana(vals) {
  const s = [...vals].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  return n % 2 ? s[Math.floor(n / 2)] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

async function main() {
  console.log(`Medición sobre ${BASE}`);
  console.log(`Navegador : ${EDGE}`);
  console.log(`CPU       : ${CPU}x | Repeticiones por acción: ${REPS}\n`);

  const browser = await puppeteer.launch({
    executablePath: EDGE, headless: 'shell',
    args: ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars']
  });
  const salida = { fecha: new Date().toISOString(), url: BASE, cpu: CPU, reps: REPS, acciones: {}, memoria: {} };

  for (const throttled of [true, false]) {
    const etiqueta = throttled ? 'conCPU4x' : 'sinCPU';
    const res = {};
    for (const a of acciones) {
      const muestras = [];
      for (let r = 1; r <= REPS; r++) {
        const { ctx, page } = await abrirContexto(browser, throttled);
        try {
          await a.prep(page);
          const m = await medirClick(page, a.sel);
          muestras.push({ r, dur: +m.dur.toFixed(1), proc: +m.proc.toFixed(1) });
        } catch (e) {
          muestras.push({ r, error: e.message });
        }
        await ctx.close();
      }
      res[a.id] = { rol: a.rol, nombre: a.nombre, muestras };
      const durs = muestras.filter(m => m.dur !== undefined).map(m => m.dur);
      const procs = muestras.filter(m => m.proc !== undefined).map(m => m.proc);
      const med = durs.length ? mediana(durs) : 'n/d';
      console.log(
        `${etiqueta.padEnd(8)} ${a.id} ${a.nombre.padEnd(40)} mediana=${String(med).padEnd(5)}` +
        ` manejador=${procs.length ? mediana(procs).toFixed(1) + ' ms' : 'n/d'}  [${durs.join(', ')}]`
      );
    }
    salida.acciones[etiqueta] = res;

    console.log(`\nMemoria (${etiqueta}):`);
    const mem = await memoria(browser, throttled);
    salida.memoria[etiqueta] = mem;
    for (const vista of VISTAS.map(v => v.replace('.html', ''))) {
      const grupo = mem.filter(m => m.vista === vista);
      const h = grupo.map(m => m.heapMB);
      const t = grupo.map(m => m.totalMB);
      console.log(
        `  ${vista.padEnd(12)} retenido=${mediana(h).toFixed(2)} MB  asignado=${mediana(t).toFixed(2)} MB  nodos=${grupo[0].nodos}`
      );
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  const destino = path.join(OUT, 'interacciones.json');
  fs.writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8');
  await browser.close();
  console.log(`\nOK -> ${destino}`);
}

main().catch(e => {
  console.error('\nERROR en la medición:', e && e.stack ? e.stack : e);
  process.exitCode = 1;
});
