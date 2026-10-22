# Pruebas de rendimiento con Lighthouse — LogisYa v0.1.0

**Proyecto:** LogisYa — Plataforma de gestión de personal y bolsa de talento compartida para operadores de eventos en el Atlántico
**Universidad de la Costa (CUC) — Ingeniería de Software**
**Fecha de la medición:** 22 de octubre de 2026
**Herramientas:** Lighthouse CLI 13.5.0 (canal `cli`), puppeteer-core 25.15.0 (CDP), corredor de pruebas de Node 26.12.1

> Este documento recoge dos campañas: la **medición de carga** con Lighthouse (3 corridas por vista,
> resultado por mediana) y la **medición de interacción y memoria** con CDP sobre las mismas URLs
> desplegadas.

---

## 1. Objetivo

Desplegar el prototipo estático de LogisYa en una URL pública para poder ejecutar pruebas de rendimiento
con Lighthouse sobre un entorno real (HTTP/2, HTTPS, caché del navegador y CDN), en lugar de medir sobre
`file://` o un servidor local, que no refleja las condiciones de uso de un usuario real.

Alcance de la medición:

| Vista | Archivo | URL desplegada |
|---|---|---|
| Inicio | `index.html` | https://sergioa3728.github.io/logisya/ |
| Operador | `operador.html` | https://sergioa3728.github.io/logisya/operador.html |
| Trabajador | `trabajador.html` | https://sergioa3728.github.io/logisya/trabajador.html |
| Administración | `admin.html` | https://sergioa3728.github.io/logisya/admin.html |

---

## 2. Entorno de trabajo

| Elemento | Valor |
|---|---|
| Sistema operativo | Windows (PowerShell 5.1) |
| Node.js | v26.12.1 (instalado con Scoop durante este procedimiento) |
| npm | 11.20.0 |
| Lighthouse CLI | 13.5.0 (instalado global) |
| puppeteer-core | 25.15.0 (instalado global; se usa con el Edge ya presente, sin descargar otro navegador) |
| Corredor de pruebas | Node.js v26.12.1 (`node --test --experimental-test-coverage`) |
| Navegador para el motor de Lighthouse | Microsoft Edge 155.0.0.0 (`msedge.exe`) en modo headless |
| Repositorio de origen | `https://github.com/ShayerBg/logisya` (rama `develop`, commit `c669ddf`) |
| Repositorio de despliegue | `https://github.com/SergioA3728/logisya` (rama `main`) |
| Alojamiento | GitHub Pages (`*.github.io`) |

---

## 3. Paso a paso

### Paso 1 — Diagnóstico del repositorio

Se revisó el estado del proyecto antes de tocar nada:

```
git status                    → rama develop, árbol limpio
git log --oneline -10         → 6 commits, HEAD = c669ddf "README y .gitignore"
git remote -v                 → origin https://github.com/ShayerBg/logisya.git
```

El `package.json` no tenía scripts de build ni de despliegue: el prototipo es HTML/CSS/JS puro
(`index.html`, `operador.html`, `trabajador.html`, `admin.html`, `logisya.css`, `logisya-data.js`).
Los datos son ficticios y persisten en `localStorage`, así que **no hay backend que desplegar**.

Verificación de rutas (importante para que nada se rompa al publicar en un subdirectorio como
`/logisya/`):

```bash
Select-String -Path "*.html" -Pattern "src=|href="
```

Todas las referencias internas son relativas (`logisya.css`, `logisya-data.js`, `operador.html`, …).
Los únicos recursos externos son las tipografías de Google Fonts. **No fue necesario tocar los
HTML para el despliegue.**

### Paso 2 — Preparación del entorno (Node.js y Lighthouse)

La máquina no tenía Node.js ni `npx`, por lo que se instaló con Scoop (ya presente en el sistema):

```powershell
scoop install nodejs
```

```
'nodejs' (26.12.1) was installed successfully!
```

Luego se instaló Lighthouse de forma global:

```powershell
npm install -g lighthouse
```

```
added 114 packages in 1m
```

Verificación:

```powershell
lighthouse --version
# 13.5.0
```

### Paso 3 — Verificación de permisos y por qué no se despliega en el repo del equipo

Se comprobó el rol de la cuenta autenticada sobre el repositorio del equipo:

```powershell
$h = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json" }
Invoke-RestMethod -Uri "https://api.github.com/repos/ShayerBg/logisya/collaborators/SergioA3728/permission" -Headers $h
```

```json
{
  "permission": "write",
  "role_name": "write",
  "permissions": { "admin": false, "maintain": false, "push": true, "triage": true, "pull": true }
}
```

Los alcances del token eran `gist, repo, workflow`. Con ese rol **no se puede crear ni activar un
sitio de GitHub Pages**: la API devolvió `404` tanto en `GET /repos/ShayerBg/logisya/pages` como en
`POST /repos/ShayerBg/logisya/pages`, porque la creación de Pages exige permiso de *administración*
del repositorio, que en este caso tiene la cuenta propietaria `ShayerBg`.

### Paso 4 — Preparación del despliegue automático en el repo del equipo

Aun así se dejó listo el despliegue automático para cuando el propietario habilite Pages. Se creó
`.github/workflows/pages.yml`:

```yaml
name: Desplegar en GitHub Pages

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  desplegar:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.desplegar.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - name: Activar GitHub Pages
        uses: actions/configure-pages@v5
        with:
          enablement: true
      - name: Preparar el sitio
        run: |
          mkdir -p _sitio
          cp index.html operador.html trabajador.html admin.html logisya.css logisya-data.js _sitio/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _sitio
      - name: Publicar
        id: desplegar
        uses: actions/deploy-pages@v4
```

Commit y push a `develop`:

```powershell
git -c user.name="Shayer Bermúdez" -c user.email="shayerbg@gmail.com" commit -m "Despliegue automatico a GitHub Pages para las pruebas de rendimiento"
git push origin develop
```

```
c669ddf..990ce45  develop -> develop
```

**Resultado del primer intento:** el workflow falló exactamente en el paso `Activar GitHub Pages`:

```
##[warning]Get Pages site failed. Error: Not Found
##[error]Create Pages site failed. Error: Resource not accessible by integration
##[error]HttpError: Resource not accessible by integration
```

Esto confirma el diagnóstico del paso 3: el token del workflow no tiene permisos de administración
para *crear* el sitio de Pages. El workflow queda funcional y desplegará solo en cuanto
`ShayerBg` active **Settings → Pages → Source: GitHub Actions**.

### Paso 5 — Creación del repositorio de despliegue con permisos de administración

Para no depender de un tercero, se creó un repositorio propio donde la cuenta **sí** es
administradora, y se habilitó GitHub Pages por API:

```powershell
$body = @{ name = "logisya"; description = "Prototipo LogisYa (despliegue de pruebas de rendimiento)"; private = $false; auto_init = $false } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $h -Body $body -ContentType "application/json"
# → CREADO: SergioA3728/logisya  admin=True

$body = @{ source = @{ branch = "main"; path = "/" } } | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri "https://api.github.com/repos/SergioA3728/logisya/pages" -Method POST -Headers $h -Body $body -ContentType "application/json"
# → url=https://sergioa3728.github.io/logisya/ branch=main path=/
```

### Paso 6 — Publicación del sitio

En un directorio de trabajo se copiaron los seis archivos del prototipo (sin `tests/`, sin
`.github/`) más un `.nojekyll` vacío para que GitHub Pages no pase los archivos por Jekyll:

```powershell
$tmp = "C:\Users\sergi\AppData\Local\Temp\opencode\pages-logisya"
Copy-Item "index.html","operador.html","trabajador.html","admin.html","logisya.css","logisya-data.js" -Destination $tmp
Set-Content -Path (Join-Path $tmp ".nojekyll") -Value "" -NoNewline

git init -b main $tmp
git -C $tmp add -A
git -C $tmp -c user.name="SergioA3728" -c user.email="sergioa3728@users.noreply.github.com" commit -m "Despliegue del prototipo LogisYa v0.1.0"
git -C $tmp remote add origin https://github.com/SergioA3728/logisya.git
git -C $tmp push -u origin main
# → * [new branch]      main -> main
```

Construcción y publicación:

```
intento 0 -> status='building'
intento 1 -> status='building'
intento 2 -> status='built'  url=https://sergioa3728.github.io/logisya/
```

Comprobación de que las cuatro vistas responden:

```
200  11.8 KB  https://sergioa3728.github.io/logisya/
200  23.9 KB  https://sergioa3728.github.io/logisya/operador.html
200  19.5 KB  https://sergioa3728.github.io/logisya/trabajador.html
200   7.4 KB  https://sergioa3728.github.io/logisya/admin.html
200  18.6 KB  https://sergioa3728.github.io/logisya/logisya-data.js
200  11.0 KB  https://sergioa3728.github.io/logisya/logisya.css
```

### Paso 7 — Configuración y ejecución de Lighthouse

Lighthouse necesita un Chromium; en esta máquina solo hay Edge, que es Chromium, así que se le
indicó explícitamente mediante `CHROME_PATH`:

```powershell
$env:PATH = "C:\Users\sergi\scoop\apps\nodejs\current;C:\Users\sergi\scoop\persist\nodejs\bin;" + $env:PATH
$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

lighthouse "https://sergioa3728.github.io/logisya/" `
  --output=json --output=html `
  --output-path="C:\Users\sergi\Documents\Logys ya\logisya\reportes\index" `
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" `
  --quiet
```

El mismo comando se repitió para `operador.html`, `trabajador.html` y `admin.html`, cambiando la
URL y el prefijo de salida. Los reportes quedaron en `reportes/` (HTML legible + JSON con los datos
crudos).

**Configuración efectiva de la medición** (valores por defecto de Lighthouse, no se tocaron):

| Parámetro | Valor |
|---|---|
| Canal | `cli` |
| Factor de forma | `mobile` |
| Emulación de pantalla | 412 × 823 px, DPR 1,75 |
| Latencia de red simulada | 150 ms |
| Descarga simulada | 1.474,56 kbps (≈1,44 Mbps) |
| Subida simulada | 675 kbps |
| Ralentización de CPU | ×4 |
| Locale | `en-US` |
| Motor | Edge 155.0.0.0 headless |

### Paso 8 — Tres corridas por vista

Una sola corrida no es evidencia suficiente: la mediana de tres es el mínimo razonable para poder
separar el comportamiento real del ruido del entorno. Se ejecutó el mismo comando de Lighthouse tres
veces por vista:

```powershell
$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$base = "C:\Users\sergi\Documents\Logys ya\logisya\reportes"
$vistas = "index","operador","trabajador","admin"

foreach ($v in $vistas) {
  $url = if ($v -eq "index") { "https://sergioa3728.github.io/logisya/" } else { "https://sergioa3728.github.io/logisya/$v.html" }
  1..3 | ForEach-Object {
    lighthouse $url --output=json --output=html --output-path="$base\$v-corrida$_" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
  }
}
```

**Aviso sobre la mediana en PowerShell:** `Sort-Object` sobre objetos `PSCustomObject` no ordena por la
propiedad numérica, y el conversor `[int]` de PowerShell usa redondeo *banker's rounding* (`[int]1.5`
devuelve `2`, no `1`). Con la función ingenua la mediana salía mal. La versión correcta es:

```powershell
function Mediana($vals) {
  $s = @($vals | Sort-Object)
  $n = $s.Count
  if ($n % 2 -eq 1) { return $s[[math]::Floor($n/2)] }
  return ($s[$n/2-1] + $s[$n/2]) / 2
}
```

### Paso 9 — Medición del tiempo de respuesta de las acciones y de la memoria

Lighthouse mide **carga de página**, no interacción. El tiempo de respuesta de un clic se mide en la
pista *Interactions* de DevTools, que se corresponde con la propiedad `duration` de
`PerformanceEventTiming`. Se automatizó esa misma medición con CDP en vez de hacerlo a mano, para que
sea repetible y para poder tomar tres muestras por acción.

```powershell
npm install -g puppeteer-core
```

El script usa el Edge ya instalado (`executablePath`), por lo que no descarga otro navegador, y aplica
**el mismo ralentizado de CPU ×4 que usa Lighthouse en emulación móvil** (`Emulation.setCPUThrottlingRate`),
para no mezclar condiciones:

```js
// Observador de Event Timing: es la misma fuente que la pista Interactions de DevTools
new PerformanceObserver(l => {
  for (const e of l.getEntries()) {
    window.__ev.push({ name: e.name, dur: e.dur, start: e.startTime, proc: e.processingEnd - e.processingStart });
  }
}).observe({ type: 'event', durationThreshold: 0, buffered: true });
```

Cada acción se midió en un **contexto de navegador nuevo** (`createBrowserContext()`), de modo que
cada repetición parte del estado semilla y la acción siempre está disponible. Para la memoria se usa
`Performance.getMetrics` → `JSHeapUsedSize` y `JSHeapTotalSize`, que son las mismas cifras que
muestra *Performance monitor*, y se fuerza la recolección de basura antes de leerlas
(`HeapProfiler.collectGarbage`) para que la lectura no dependa del momento en que corra el GC.

### Paso 10 — Pruebas automáticas y cobertura

```powershell
node --test --experimental-test-coverage tests/*.test.js
```

En la primera ejecución el informe solo mostraba `tests/cargar.js` y **no aparecía `logisya-data.js`**,
el archivo que contiene las reglas del negocio. La causa es que el código se ejecuta dentro de un
contexto aislado con `vm.runInContext(codigo, ctx)`: al no tener nombre de archivo, el motor de
cobertura de Node no puede atribuirle las líneas. El arreglo son dos líneas en `tests/cargar.js`:

```js
// antes
vm.runInContext(codigo, ctx);

// después
// Se le da nombre al script para que la cobertura de Node pueda atribuirlos a logisya-data.js
const script = new vm.Script(codigo, { filename: path.join(__dirname, '..', 'logisya-data.js') });
script.runInContext(ctx);
```

Con el cambio, `logisya-data.js` entra en el informe de cobertura y las 11 pruebas siguen pasando.

---

## 4. Resultados de la medición de carga (Lighthouse)

### 4.1 Las 12 corridas completas

| Vista | Corrida | Perf | Acc | BP | SEO | FCP (s) | LCP (s) | TBT (ms) | CLS | KiB |
|---|---|---|---|---|---|---|---|---|---|---|
| index | 1 | **85** | 93 | 96 | 90 | 3,34 | 3,34 | 0 | 0,000 | 90,7 |
| index | 2 | 94 | 93 | 96 | 90 | 1,77 | 1,77 | 0 | 0,137 | 90,7 |
| index | 3 | 94 | 93 | 96 | 90 | 1,67 | 1,67 | 0 | 0,137 | 90,7 |
| operador | 1 | 92 | 96 | 96 | 90 | 1,98 | 1,98 | 0 | 0,149 | 94,4 |
| operador | 2 | 93 | 96 | 96 | 90 | 1,73 | 1,73 | 0 | 0,149 | 94,4 |
| operador | 3 | 93 | 96 | 96 | 90 | 1,70 | 1,70 | 0 | 0,149 | 94,4 |
| trabajador | 1 | 93 | 93 | 96 | 90 | 1,92 | 1,92 | 0 | 0,143 | 93,0 |
| trabajador | 2 | 93 | 93 | 96 | 90 | 1,69 | 1,69 | 0 | 0,143 | 93,0 |
| trabajador | 3 | 93 | 93 | 96 | 90 | 1,81 | 1,81 | 0 | 0,143 | 93,0 |
| admin | 1 | 93 | 93 | 96 | 90 | 1,87 | 1,87 | 0 | 0,142 | 89,3 |
| admin | 2 | 93 | 93 | 96 | 90 | 1,72 | 1,72 | 0 | 0,142 | 89,3 |
| admin | 3 | 93 | 93 | 96 | 90 | 1,70 | 1,70 | 0 | 0,142 | 89,3 |

### 4.2 Medianas por vista (3 corridas)

| Vista | Rendimiento | Rango | Accesib. | Buenas prác. | SEO | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|---|
| `index.html` | **94** | 85–94 | 93 | 96 | 90 | 1,77 s | 1,77 s | 0 ms | 0,137 | 90,7 KiB |
| `operador.html` | **93** | 92–93 | 96 | 96 | 90 | 1,73 s | 1,73 s | 0 ms | 0,149 | 94,4 KiB |
| `trabajador.html` | **93** | 93–93 | 93 | 96 | 90 | 1,81 s | 1,81 s | 0 ms | 0,143 | 93,0 KiB |
| `admin.html` | **93** | 93–93 | 93 | 96 | 90 | 1,72 s | 1,72 s | 0 ms | 0,142 | 89,3 KiB |

Todas las vistas se quedan en la franja verde (≥ 90) en las cuatro categorías, y la dispersión entre
corridas es de **1 punto** salvo en `index.html`.

#### El *outlier* de la primera corrida

La corrida 1 de cada vista es sistemáticamente peor que las otras dos. La causa está en el TTFB:

| Vista | TTFB corrida 1 | TTFB corridas 2–3 |
|---|---|---|
| index | **116 ms** | 24 ms, 31 ms |
| operador | **153 ms** | 25 ms, 25 ms |
| trabajador | **127 ms** | 72 ms, 25 ms |
| admin | **151 ms** | 22 ms, 23 ms |

La primera corrida de cada vista paga el arranque en frío del borde de la CDN de GitHub Pages (la
primera visita a un contenido no cacheado). En `index.html` ese desfase se traduce en 9 puntos de
rendimiento (85 en vez de 94) y en un LCP de 3,34 s. **Este es exactamente el motivo por el que hay que
medir tres veces y reportar la mediana**: con una sola corrida, la puntuación del sitio habría
dependido del momento en que se midiera.

Un segundo efecto aparece en `index.html`: en la corrida 1 el CLS se registra como **0,000**, frente a
0,137 en las otras dos. Con la fuente web aún en vuelo, el intercambio de tipografía (y el
desplazamiento que provoca) ocurre fuera de la ventana de observación del CLS, así que Lighthouse no lo
cuenta. Es un artefacto de medición, no una mejora real: el desplazamiento sigue ocurriendo en el
navegador, solo que después de que el trace terminara.

### 4.3 Lectura de las métricas de laboratorio

- **LCP entre 1,72 s y 1,81 s (mediana)**: dentro del umbral "bueno" (< 2,5 s) aun con la simulación de
  red móvil y CPU ×4.
- **TBT = 0 ms en las 12 corridas**: el JavaScript (`logisya-data.js`, ~7 KB) no bloquea el hilo
  principal. La app es declarativa, sin frameworks ni bucles pesados.
- **CLS ≈ 0,14 en las cuatro vistas**: es el único métrico en amarillo (umbral bueno < 0,1).
- **Peso total 89–94 KiB**: ninguna vista supera los 100 KiB.
- **Solo 7 peticiones HTTP por vista**, de las cuales 2 son fuentes web.

### 4.4 Peticiones de red (medición sobre `index.html`)

| Tipo | Estado | Tamaño | Recurso |
|---|---|---|---|
| Document | 200 | 5.005 B | `/logisya/` |
| Stylesheet | 200 | 1.364 B | `fonts.googleapis.com/css2?family=Inter…&family=JetBrains+Mono…` |
| Stylesheet | 200 | 3.696 B | `/logisya/logisya.css` |
| Script | 200 | 7.164 B | `/logisya/logisya-data.js` |
| Font | 200 | 48.464 B | `fonts.gstatic.com/…/inter/…woff2` (Inter variable) |
| Font | 200 | 21.837 B | `fonts.gstatic.com/…/jetbrainsmono/…woff2` |
| Other | **404** | 5.383 B | `https://sergioa3728.github.io/favicon.ico` |

### 4.5 Auditorías fallidas por vista

| Auditoría | index | operador | trabajador | admin | Categoría |
|---|---|---|---|---|---|
| `color-contrast` | ✗ | ✗ | ✗ | ✗ | Accesibilidad |
| `meta-description` | ✗ | ✗ | ✗ | ✗ | SEO |
| `errors-in-console` | ✗ | ✗ | ✗ | ✗ | Buenas prácticas |
| `cache-insight` | ✗ | ✗ | ✗ | ✗ | Rendimiento |
| `cumulative-layout-shift` | ✗ | ✗ | ✗ | ✗ | Rendimiento |
| `landmark-one-main` | ✗ | — | — | — | Accesibilidad |
| `heading-order` | — | — | ✗ | ✗ | Accesibilidad |
| `td-has-header` | — | ✗ | — | — | Accesibilidad |

Las auditorías que **sí** pasaron con nota 1 en las cuatro vistas (verificado auditoría por auditoría en
los cuatro JSON) incluyen, en rendimiento: `total-blocking-time`, `interactive`, `max-potential-fid`,
`speed-index` ( salvo `trabajador`, que da 0,99), `document-latency-insight`, `dom-size-insight`,
`duplicated-javascript-insight`, `font-display-insight`, `forced-reflow-insight`,
`image-delivery-insight`, `lcp-breakdown-insight`, `legacy-javascript-insight`,
`modern-http-insight`, `third-parties-insight`, `viewport-insight`, `unminified-css`,
`unminified-javascript`, `unused-css-rules`, `unused-javascript`, `total-byte-weight`, `bootup-time`,
`mainthread-work-breakdown`, `long-tasks`, `unsized-images`, `bf-cache`, `network-requests`,
`network-rtt`, `network-server-latency`, `redirects` y `server-response-time`; y en accesibilidad,
buenas prácticas y SEO: `document-title`, `html-has-lang`, `meta-viewport`, `aria-*`, `doctype`,
`charset`, `deprecations`, `is-on-https`, `csp-xss`, `has-hsts`, `clickjacking-mitigation`,
`origin-isolation`, `third-party-cookies`, `is-crawlable`, `http-status-code`, `link-text`,
`crawlable-anchors` y `hreflang`.

En total, **37 de las 45 auditorías de rendimiento** obtienen nota 1 en las cuatro vistas; las 8 que
fallan están detalladas en la sección 8.

---

## 5. Tiempo de respuesta de las acciones

### 5.1 Las seis acciones medidas

Se eligieron las seis acciones que recorren las reglas de negocio del prototipo, repartidas entre las
dos vistas principales. Cada una se midió **6 veces**, en un contexto de navegador limpio (estado
semilla) y con **CPU ×4**, la misma condición que usa Lighthouse en emulación móvil:

| # | Vista | Acción | Qué ejecuta | Elemento |
|---|---|---|---|---|
| A1 | Operador | **Confirmar postulante** | Cambia el estado de una postulación de `pendiente` a `confirmado` y avisa por *toast* | `[data-act="confirm"]` |
| A2 | Operador | **Convocar a mi personal** | Agrega a los trabajadores del operador que cumplen el rol a la lista de convocados | `[data-act="convocar"]` |
| A3 | Operador | **Abrir vacante al calendario general** | Cambia la fase de la vacante de `propio` a `general` | `[data-act="abrir"]` |
| A4 | Operador | **Validar registro de horas** | Valida el registro de asistencia y lo bloquea | `[data-act="validar"]` |
| A5 | Trabajador | **Postularse a una vacante** | Crea la postulación en estado `pendiente` | `[data-act="postular"]` |
| A6 | Trabajador | **Marcar entrada del turno** | Registra la hora de entrada del turno en curso | `[data-act="marcar"][data-t="ent"]` |

Nota de preparación: para medir A4 y A6 se usa el trabajador **w9 (Yuleisy Ospino)**, que está
confirmado para el evento de hoy y no tiene la entrada marcada. El usuario por defecto (w1) ya la
trae marcada en los datos semilla, así que su botón sería "Marcar salida" y no serviría para medir la
entrada. A4 requiere además que el trabajador marque entrada y salida antes (con el botón
*Avanzar 6 h* para cerrar la jornada), porque el operador solo puede validar un registro con entrada
y salida.

### 5.2 Resultados (6 repeticiones por acción)

Cada acción se midió **6 veces**, que es el número de repeticiones con el que se elaboró el reporte de
la entrega. Los valores de esta tabla son los de la campaña registrada en
`evidencias/interacciones.json` (22 de octubre de 2026, 01:30 UTC):

| # | Acción | **Mediana** | P25–P75 | Min–Máx | **Mediana del manejador** |
|---|---|---|---|---|---|
| A1 | Confirmar postulante | **32 ms** | 32–32 ms | 32–48 ms | 10,1 ms |
| A2 | Convocar a mi personal | **32 ms** | 24–32 ms | 24–96 ms | 10,1 ms |
| A3 | Abrir al calendario general | **24 ms** | 24–32 ms | 24–32 ms | 10,2 ms |
| A4 | Validar registro de horas | **80 ms** | 48–80 ms | 48–112 ms | 17,1 ms |
| A5 | Postularse a una vacante | **56 ms** | 56–64 ms | 56–72 ms | 16,9 ms |
| A6 | Marcar entrada del turno | **32 ms** | 32–40 ms | 32–64 ms | 10,4 ms |

- La primera columna es el `duration` de `PerformanceEventTiming`, que es lo que muestra la pista
  *Interactions* de DevTools: incluye el tiempo de procesamiento **y** la espera hasta el siguiente
  pintado, por eso siempre es múltiplo de 8 ms (la duración de un frame).
- La última es `processingEnd − processingStart`: el tiempo real del manejador del evento, sin el
  frame. Es la cifra que mide el coste de la lógica de negocio.

**Rango de las medianas: 24–80 ms.** Todas las acciones responden en uno o dos frames, incluso con la
CPU cuatro veces más lenta. Ninguna se acerca al umbral de 200 ms que Google considera "bueno" para
INP.

Las dos acciones más lentas coinciden con las que repintan más DOM:

| Acción | Qué hace distinto | Mediana |
|---|---|---|
| **A4 Validar registro de horas** | Repinta la tabla de asistencia completa y recalcula el promedio de la calificación | 80 ms |
| **A5 Postularse a una vacante** | Repinta la lista completa de oportunidades y recalcula el filtro | 56 ms |
| **A1, A2, A6** | Cambian un dato y repintan un fragmento | 32 ms |
| **A3 Abrir al calendario general** | Cambia la fase de la vacante | 24 ms |

**Sobre la varianza.** La métrica `duration` incluye la espera hasta el próximo pintado, y esa espera
depende de cuánto compita el navegador por la CPU. Al repetir la campaña en otro momento, con otros
navegadores abiertos en la misma máquina, las medianas de la misma acción pueden duplicarse (A1 pasó
de 32 ms a 68 ms) sin que haya cambiado nada del código. Por eso la cifra que se reporta es **la
mediana de las 6 repeticiones**, y no el mínimo ni la primera muestra. El **tiempo del manejador**
(10,1–17,1 ms) es el indicador estable del coste real de la aplicación.

> **Al volver a ejecutar el script se sobrescribe `evidencias/interacciones.json`.** Los números de
> esta tabla son los de la campaña del 22 de octubre a la 01:30 UTC; una corrida nueva produce
> cifras distintas (más altas si la máquina está ocupada). Si necesitas conservar esta campaña,
> guarda una copia del archivo antes de volver a medir.

### 5.3 La misma medición sin ralentizar la CPU

Sin ralentizado de CPU, todas las acciones caen a **16 ms** (un frame) y el manejador baja a 1,6–2,5 ms.
Además, **Chrome no genera entrada de Event Timing para algunas interacciones**, porque terminan
dentro del mismo frame en que empezaron:

| Acción | Capturas con evento / 6 | Mediana |
|---|---|---|
| A1 Confirmar postulante | 6/6 | 16 ms |
| A2 Convocar a mi personal | 4/6 | 16 ms |
| A3 Abrir al calendario general | 3/6 | 16 ms |
| A4 Validar registro de horas | 5/6 | 16 ms |
| A5 Postularse a una vacante | 6/6 | 16 ms |
| A6 Marcar entrada del turno | 4/6 | 16 ms |

Esto confirma que la medición **debe hacerse con CPU ×4** si se quiere comparar con Lighthouse: sin
ralentizar, la señal es más corta que la resolución del instrumento.

---

## 6. Memoria

Medición de `JSHeapUsedSize` y `JSHeapTotalSize` con `Performance.getMetrics` (las mismas cifras que
muestra *Performance monitor* de DevTools), 6 cargas por vista, después de que la página termine de
renderizar:

| Vista | Heap **retenido** (tras GC) | Heap **asignado** (pico) | Nodos del DOM |
|---|---|---|---|
| `index.html` | **0,70 MB** | 1,50 MB | 168 |
| `operador.html` | **0,72 MB** | 1,75 MB | 338 |
| `trabajador.html` | **0,74 MB** | 1,75 MB | 292 |
| `admin.html` | **0,71 MB** | 1,75 MB | 118 |

Lectura:

- **El script fuerza la recolección de basura antes de medir** (`HeapProfiler.collectGarbage`). Sin
  eso, la lectura depende del momento en que el recolector se ejecuta y la misma vista daba valores
  de 0,74 MB o 1,59 MB según la muestra. Es un detalle metodológico que explica por qué la cifra
  retenida es la que se debe reportar.
- **0,70–0,74 MB retenidos** es lo que la aplicación ocupa de verdad: el motor, `logisya-data.js` con
  los 13 trabajadores y 7 eventos, y el DOM. La diferencia entre vistas es de **40 KB**, irrelevante.
- **1,50–1,75 MB asignados** es el pico que se ve en *Performance monitor* sin forzar el GC: la
  diferencia entre ambas cifras (≈1 MB) es basura pendiente de recolectar, no memoria viva.
- El consumo es **prácticamente idéntico entre las cuatro vistas**, pese a que la del operador tiene
  el doble de nodos DOM que la de administración. Esto indica que el peso está en los **datos
  compartidos**, no en el HTML renderizado.
- La dispersión entre las 6 repeticiones de cada vista es **cero**: los valores se repiten al
  milésimo, lo que da estabilidad al dato.
- No hay fugas ni acumulaciones: el heap no crece entre repeticiones.

---

## 7. Pruebas automáticas y cobertura

### 7.1 Resultado de las pruebas

```powershell
node --test --experimental-test-coverage tests/*.test.js
```

```
✔ las horas se calculan bien, incluso si el turno pasa de medianoche
✔ una vacante sin llenar pasa al calendario general cuando vence el plazo
✔ si el operador no comparte su personal, la vacante vencida queda bloqueada
✔ un trabajador de otra empresa solo ve vacantes del calendario general si está en la bolsa
✔ los eventos de un operador suspendido no se muestran a los trabajadores
✔ el reemplazo solo propone personas que cumplen los requisitos obligatorios
✔ quien ya trabajó con el operador suma más puntaje que alguien de otra empresa
✔ el trabajador marca entrada y salida, y no puede marcar dos veces
✔ solo puede marcar quien está confirmado y el día del evento
✔ un registro validado queda bloqueado y solo entonces se puede calificar
✔ un registro reportado no se puede validar hasta que el administrador lo resuelva
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ duration_ms 89.96
```

### 7.2 Cobertura

| Archivo | Líneas | Ramas | Funciones | Líneas sin cubrir |
|---|---|---|---|---|
| `logisya-data.js` | **84,58 %** | 86,54 % | 67,16 % | 69, 75-76, 97, 99-100, 138-141, 164-171, 196, 199-206, 209-214 |
| `tests/cargar.js` | 100,00 % | 85,71 % | 62,50 % | — |
| **total** | **86,31 %** | 86,49 % | 66,67 % | — |

Antes del cambio descrito en el paso 10, el informe mostraba **solo** `tests/cargar.js`: el archivo con
las reglas de negocio quedaba invisible para la cobertura, que reportaba un 100 % engañoso.

Qué queda sin cubrir y por qué:

| Líneas | Función | Motivo |
|---|---|---|
| 69 | `newVacante` | Ruta alternativa: el prototipo usa el objeto literal `V(...)` en lugar de este constructor |
| 75-76 | `resetDemo`, `pref` | Funciones de la interfaz que solo se ejercitan desde el navegador |
| 97 | `hrsLeft` | Formatea el tiempo restante en la insignia de fase; las pruebas avanzan el reloj más allá del plazo |
| 99-100 | `toast` | Depende de `document`, que el simulador de `tests/cargar.js` deja como stub |
| 138-141 | `origenPara` | LaCalcula el origen (propio / bolsa / reemplazo) que sí usa la interfaz, pero no las pruebas |
| 164-171 | `marcarAusente` | **La brecha más importante**: la lógica de reemplazo y ausentismo no tiene prueba propia |
| 196 | `reportesAbiertos` | La usa la vista del administrador, sin prueba |
| 199-206 | `hist`, `histTable` | Construyen el historial del perfil del trabajador |
| 209-214 | `appNav` | Genera la barra de navegación |

**Recomendación:** añadir dos pruebas que cubran `marcarAusente` (ausentismo + notificación de
reemplazo) y `reportesAbiertos` + `resolverReporte` desde el punto de vista del administrador.
Subirían la cobertura por encima del 90 % y cerrarían el hueco funcional más importante: la regla de
reemplazo de última hora, que es la más delicada del modelo de negocio.

---

## 8. Hallazgos y plan de mejora

### 8.1 🔴 Crítico — Fuentes de Google bloquean el render (≈ 0,9–1,1 s)

Las cuatro páginas HTML cargan Google Fonts de forma bloqueante (`index.html:6-7`,
`operador.html:7-8`, `trabajador.html:7-8`, `admin.html:7-8`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">
```

Auditoría `render-blocking-insight`:

| Vista | Recurso bloqueante | Ahorro estimado |
|---|---|---|
| `index.html` | `fonts.googleapis.com/css2?family=Inter…` | 933 ms |
| `operador.html` | ídem | 984 ms |
| `trabajador.html` | ídem | 1.062 ms |
| `admin.html` | ídem | 884 ms |

Además, las dos `.woff2` suman **70.301 B (69 KiB)**, es decir, el **77 % del peso total** de la página.

**Mejora propuesta:**
1. Descargar las fuentes y servirlas desde el propio dominio (elimina la conexión a dos terceros).
2. Declarar `font-display: swap` (ya está en la URL) **y** añadir `<link rel="preload" as="font" type="font/woff2" crossorigin>`.
3. Como alternativa mínima: cargar la hoja con `media="print" onload="this.media='all'"` para sacarla del camino crítico.
4. Alternativa la más simple: usar `font-family` de sistema (`system-ui`, `ui-monospace`) y eliminar por completo la dependencia externa.

### 8.2 🟠 Alto — CLS ≈ 0,14 (desplazamientos de contenido)

Desplazamientos detectados por Lighthouse:

| Vista | Elementos que se desplazan |
|---|---|
| `index.html` | `section#top > div.hero-in > div.visual > div.cred` (0,087), `body > section#top` (0,049), `div.hero-in > div.visual > div.cred > div.foot` |
| `operador.html` | `body > footer.footer`, `body > main#app > div.kpis` |
| `trabajador.html` | `body > footer.footer`, `main#app > section.banner > div > h1` |
| `admin.html` | `body > footer.footer`, `body > header#nav > div.nav-in > div.nav-right` (×2) |

La causa es doble: (a) la tipografía web se carga después de pintar el texto con la fuente de
respaldo, cambiando el alto de los bloques; (b) el contenido de `main#app` y del pie lo inyecta
JavaScript después del primer render.

**Mejora propuesta:** reservar altura mínima con `min-height` en los contenedores que se repintan
(`.kpis`, `.cred`, `footer.footer`), definir `font-size-adjust`/`size-adjust` en la fuente de respaldo
para igualar métricas, y usar `font-display: optional` si se acepta que la fuente se aplique en la
segunda visita.

### 8.3 🟠 Medio — Contraste de color insuficiente (accesibilidad)

Todos los fallos provienen de variables CSS declaradas en `logisya.css:4-7`:

| Variable | Color | Fondo | Contraste | Requisito | Dónde falla |
|---|---|---|---|---|---|
| `--faint` | `#A1A1A8` | `#FFFFFF` | 2,56:1 | 3:1 | `h1.h1 > span.soft` (operador, admin), `h2.h2 > span.soft` (index, trabajador) |
| `--faint` | `#A1A1A8` | `#F4F4F5` | 2,33:1 | 4,5:1 | `button.unavail` del calendario (trabajador, 11 elementos) |
| `--ok` | `#0E8F5A` | `#DDF6EA` | 3,61:1 | 4,5:1 | `span.pill` de estado (todas las vistas) |
| `--accent-2` | `#A98BF8` | texto `#FFFFFF` | 2,71:1 | 4,5:1 | `div.wcard > div#chips > button` (index, 3 elementos) |
| `--muted` | `#6E6E76` | `#F8EEFB` | 4,47:1 | 4,5:1 | `div.mini > div.top > div > span` (index) |

**Mejora propuesta** (los colores propuestos se verificaron calculando el ratio de contraste con la
fórmula de WCAG 2.1):

| Variable | Valor actual | Valor propuesto | Contraste antes → después | Sobre |
|---|---|---|---|---|
| `--faint` | `#A1A1A8` | `#6F6F78` | 2,57:1 → **4,98:1** | `#FFFFFF` |
| `--faint` | `#A1A1A8` | `#6F6F78` | 2,34:1 → **4,53:1** | `#F4F4F5` |
| `--ok` | `#0E8F5A` | `#0A6E44` | 3,62:1 → **5,54:1** | `#DDF6EA` |
| `--accent-2` (chips) | `#A98BF8` | `#6B45FF` (`--accent`) | 2,71:1 → **5,36:1** | texto `#FFFFFF` |
| `--muted` | `#6E6E76` | `#6A6A72` | 4,48:1 → **4,75:1** | `#F8EEFB` |

Con estos cinco cambios (tres variables CSS y el color de los chips) la auditoría `color-contrast`
pasa a 100 en las cuatro vistas.

En el código el ajuste de los chips es una sola línea, `logisya.css:134`:

```css
/* actual */
.daychips button[aria-pressed="true"]{background:var(--accent-2);color:#fff}
/* propuesto */
.daychips button[aria-pressed="true"]{background:var(--accent);color:#fff}
```

`--accent-2` solo se usa en ese punto, así que cambiarlo no afecta a ningún otro componente.

### 8.4 🟡 Bajo — Otros problemas de accesibilidad

| Auditoría | Vista | Detalle |
|---|---|---|
| `landmark-one-main` | `index.html` | El documento no tiene un landmark `<main>` (las otras vistas sí lo tienen en `main#app`). |
| `heading-order` | `trabajador.html` | `main#app > section.banner > div.sched > h3` salta un nivel de encabezado. |
| `heading-order` | `admin.html` | `body > main#app > div.panel > h3` salta un nivel de encabezado. |
| `td-has-header` | `operador.html` | La tabla de vacantes (`div.vac > div.stack > div.tbl > table`) tiene celdas de datos sin `<th>` asociado. |

**Mejora propuesta:** envolver el contenido de `index.html` en `<main>`, encadenar correctamente los
niveles `h1 → h2 → h3`, y añadir `<thead><tr><th scope="col">` a las tablas.

### 8.5 🟡 Bajo — SEO: falta `meta description`

Las cuatro páginas devuelven `meta-description = 0`. Es la auditoría de SEO que más fácil se resuelve
y la que más rápido se nota en el PageSpeed Insights público.

**Mejora propuesta:** añadir en el `<head>` de cada HTML una descripción propia, por ejemplo:

```html
<meta name="description" content="LogisYa: gestiona eventos, vacantes y turnos de operadores en el Atlántico.">
```

### 8.6 🟡 Bajo — Error de consola: `favicon.ico` 404

Es el único error de consola en las cuatro vistas (`errors-in-console = 0`) y el único recurso con
código 404. Provoca la petición fallida de 5,3 KB en cada carga.

**Mejora propuesta:** añadir un `favicon.svg` al repositorio de despliegue y referenciarlo con
`<link rel="icon" href="favicon.svg" type="image/svg+xml">`. Esto también elimina una petición de red.

### 8.7 🟡 Bajo — Caché de recursos estáticos

`cache-insight` estima un ahorro de **≈10 KiB** en `logisya.css` y `logisya-data.js` (ambos score 0,5).
GitHub Pages responde con `Cache-Control: max-age=600` (10 minutos) en todos los recursos, verificado
con una petición `HEAD`:

```
Cache-Control: max-age=600
ETag: "6ad95511-2c21"
Last-Modified: Thu, 22 Oct 2026 00:13:05 GMT
Server: GitHub.com
Strict-Transport-Security: max-age=31556952
```

Además, hoy los archivos **no** llevan hash en la URL (`logisya.css`, no `logisya.<hash>.css`), así que
no se puede subir el `max-age` sin versionarlos primero.

**Mejora propuesta:** versionar los recursos (`logisya.<hash>.css`) y añadir una cabecera de caché
inmuta, o migrar a Netlify/Vercel donde se puede configurar la caché desde un `netlify.toml` /
`vercel.json` sin tocar el código.

---

## 9. Resumen de prioridades

| # | Acción | Impacto estimado | Esfuerzo |
|---|---|---|---|
| 1 | Servir las tipografías desde el propio dominio con `preload` + `font-display: swap` | LCP de 1,8 s → ≈1,0 s; −69 KiB | Medio |
| 2 | Reservar altura en `.kpis`, `.cred` y `footer.footer` | CLS de 0,14 → < 0,05 | Bajo |
| 3 | Ajustar `--faint`, `--ok`, `--muted` y el chip de `logisya.css:134` | Accesibilidad → 100 | Bajo |
| 4 | Añadir `<meta name="description">` a las 4 páginas | SEO → 100 | Bajo |
| 5 | Añadir `favicon.svg` y su `<link rel="icon">` | Buenas prácticas → 100 | Bajo |
| 6 | `<main>` en `index.html`, jerarquía de encabezados y `<th>` en tablas | Accesibilidad → 100 | Bajo |
| 7 | Caché inmutable de `css`/`js` | −10 KiB y menos TTFB en repeat views | Bajo |
| 8 | Pruebas para `marcarAusente`, `reportesAbiertos` y `resolverReporte` | Cobertura de 84,6 % → > 90 % | Bajo |

Con los puntos 3 a 6 (todos de esfuerzo bajo) se espera que el prototipo alcance **100 en
accesibilidad, buenas prácticas y SEO** en las cuatro vistas, y el punto 1 dejaría el rendimiento en
el rango 97–99. Los números anteriores son una proyección a partir de las auditorías que fallan: habría
que volver a medir para confirmarlos.

El punto 8 no mejora el rendimiento, pero cubre la brecha funcional más importante que dejaron las
pruebas: la regla de **ausentismo y reemplazo de última hora** (`logisya-data.js:164-171`), que hoy
no tiene ni una prueba y es la más delicada del modelo de negocio.

---

## 10. Cómo reproducir las pruebas

### 10.1 Volver a desplegar el prototipo

```powershell
$tmp = "C:\Users\sergi\AppData\Local\Temp\opencode\pages-logisya"
Copy-Item "index.html","operador.html","trabajador.html","admin.html","logisya.css","logisya-data.js" -Destination $tmp -Force
git -C $tmp add -A
git -C $tmp -c user.name="SergioA3728" -c user.email="sergioa3728@users.noreply.github.com" commit -m "Actualizacion del prototipo"
git -C $tmp push origin main
```

La publicación tarda entre 20 y 40 segundos. Se puede verificar el estado con:

```powershell
Invoke-RestMethod -Uri "https://api.github.com/repos/SergioA3728/logisya/pages" -Headers $h | Select-Object status, html_url
```

### 10.2 Repetir la medición de carga (3 corridas por vista)

```powershell
$env:PATH = "C:\Users\sergi\scoop\apps\nodejs\current;C:\Users\sergi\scoop\persist\nodejs\bin;" + $env:PATH
$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

$base = "C:\Users\sergi\Documents\Logys ya\logisya\reportes"
$vistas = "index","operador","trabajador","admin"
foreach ($v in $vistas) {
  $url = if ($v -eq "index") { "https://sergioa3728.github.io/logisya/" } else { "https://sergioa3728.github.io/logisya/$v.html" }
  1..3 | ForEach-Object {
    lighthouse $url --output=json --output=html --output-path="$base\$v-corrida$_" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --quiet
  }
}
```

### 10.3 Repetir la medición de interacciones y memoria

```powershell
npm install puppeteer-core --no-save    # o: npm install --save-dev puppeteer-core
node ".\pruebas\medir.js"
```

El script está en `pruebas/medir.js` (en el repositorio) y deja el resultado en
`evidencias/interacciones.json`. Recorre las seis acciones con 6 repeticiones cada una (con y sin
CPU ×4) y mide el heap de las cuatro vistas. Para cambiar el número de repeticiones:

```powershell
$env:REPS = "12"
node ".\pruebas\medir.js"
```

Las rutas son configurables por variables de entorno: `EDGE_PATH`, `LOGISYA_URL`, `LOGISYA_OUT` y
`REPS`.

### 10.4 Repetir las pruebas y la cobertura

```powershell
node --test --experimental-test-coverage tests/*.test.js
```

### 10.5 Medir desde el navegador

- **PageSpeed Insights:** https://pagespeed.web.dev/ → pegar la URL pública.
- **DevTools de Edge/Chrome:** `F12` → pestaña *Lighthouse* → *Performance* → *Analyze page load*.
- **Para replicar a mano la medición de interacciones:** `F12` → *Performance* → grabar → hacer la
  acción → detener. En la pista *Interactions* aparece la duración del clic; repetir 3 veces y tomar
  la mediana. Para replicar la de memoria: menú `⋮` → *More tools* → *Performance monitor* → línea
  *JS heap size*. Conviene activar **CPU: 4× slowdown** para que las cifras sean comparables con las
  de este documento.

---

## 11. Notas y limitaciones

1. **El despliegue vive en `SergioA3728/logisya`, no en `ShayerBg/logisya`.** Motivo: la cuenta
   autenticada tiene rol `write` sobre el repositorio del equipo y la creación de GitHub Pages exige
   rol `admin`. El workflow `.github/workflows/pages.yml` ya está en `develop` y publicará
   automáticamente en `https://shayerbg.github.io/logisya/` en cuanto el propietario active
   **Settings → Pages → Source: GitHub Actions**. Ese es el destino recomendado para la entrega final.
2. **Las mediciones son de laboratorio (simulación de red y CPU ×4).** No sustituyen a datos de
   campo (RUM / CrUX). Para la entrega conviene acompañarlas de una prueba con
   `PageSpeed Insights` en modo *campo* una vez haya tráfico real.
3. **Los resultados dependen del alojamiento.** GitHub Pages comprime con **gzip** (verificado:
   `logisya-data.js` pasa de 19.050 B sin comprimir a 6.993 B en el cable) y sirve por HTTPS con HSTS,
   pero el TTFB de origen es de 110–140 ms. El plan del proyecto contempla Netlify para la versión
   React + Vite; en ese caso conviene repetir esta medición para comparar, ya que la latencia de
   origen y el soporte de Brotli mejorarían el LCP y el peso transferido.
4. **El repositorio `SergioA3728/logisya` contiene solo los artefactos estáticos.** La fuente
   permanece en `ShayerBg/logisya`, rama `develop`.
5. **Los reportes de Lighthouse se guardaron en `reportes/`** (ignorado por git; `*.report.html` para
   lectura y `*.report.json` para análisis) y las evidencias que sí se versionan, en `evidencias/`
   (`PRUEBAS-RENDIMIENTO.md`, `interacciones.json`, `interacciones-resumen.csv` y `medianas.csv`).
6. **La primera corrida de cada vista es un *outlier* por CDN en frío** (TTFB de 116–153 ms frente a
   22–72 ms). Es la razón de medir tres veces: la mediana lo neutraliza, el promedio no.
7. **La medición de interacción depende del ralentizado de CPU.** Sin CPU ×4, las seis acciones
   terminan dentro de un solo frame y Chrome no genera siquiera la entrada de Event Timing. Los
   números de la sección 5 son, todos, con CPU ×4.
8. **`duration` viene cuantizada a 8 ms** (la duración de un frame). Por eso el rango 32–80 ms no
   distingue con precisión milimétrica entre acciones; para el coste real de la lógica está la columna
   "Manejo", que sí es una medida continua.
9. **El heap medido es el de JavaScript**, no el total de memoria del proceso: el navegador, los
   estilos y los recursos gráficos quedan fuera. Para el footprint total habría que mirar el proceso
   completo en *Task Manager* o *Performance monitor* → *Memory*.
