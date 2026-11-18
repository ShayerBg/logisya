# LogisYa

Plataforma de gestión de personal para operadores de eventos en Barranquilla, con una bolsa de talento compartida y recíproca entre empresas. Proyecto de aula de Ingeniería de Software, Universidad de la Costa (CUC).

Equipo: Sergio Andrés Avila Velilla, Shayer Andrés Bermúdez Guerrero, Laura Vanessa Escobar Coba y Wylhem Molina Romero.

## Cómo probarlo

La app está publicada en **https://logisya.netlify.app**. Entra con una de estas cuentas de prueba:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Operador (Eventos Caribe BTL) | caribe@logisya.demo | 123456 |
| Trabajadora (Andrea Pérez) | andrea@logisya.demo | 123456 |

Recorrido sugerido:

1. Entra como operador. En **Eventos** revisa la cena de gala de hoy: confirma postulantes, registra entrada y salida, califica, o marca a alguien como ausente para ver cómo se buscan reemplazos.
2. En **Crear evento** publica uno nuevo con dos roles. El personal propio queda convocado de una vez.
3. En **Personal y bolsa** copia el enlace de invitación y activa o desactiva "Compartir mi personal".
4. En otra ventana (o en incógnito) entra como Andrea. En **Calendario** verás las vacantes que le corresponden y podrás postularte. Lo que hagas en una ventana aparece en la otra sin recargar.
5. Para registrar un trabajador nuevo usa el enlace de invitación del operador o el código `ECB7Q2`.

## Reglas del negocio

- Cada vacante se publica primero solo para el personal propio del operador. Si vence el plazo y no se llenaron los cupos, pasa sola al calendario general.
- Solo llegan al calendario general (y solo se puede ver la bolsa de otros) si el operador comparte su propio personal.
- Al marcar un ausente, el sistema notifica hasta 5 personas con ese rol, disponibles ese día y sin otro turno confirmado, ordenadas por calificación.
- La calificación, la asistencia y el número de eventos se calculan con el historial real de cada persona.
- El cobro es solo al operador. Registrarse y postularse es gratis para el trabajador.

## Tecnologías

- React 19 + Vite + React Router
- Supabase: base de datos Postgres, autenticación, Row Level Security, funciones en SQL, Realtime y pg_cron
- Netlify para el despliegue

Toda la lógica que antes estaba en `logisya-data.js` del MVP ahora vive en la base de datos (`database/schema.sql`), así los permisos no dependen del navegador.

## Estructura

```
database/schema.sql      tablas, permisos (RLS), reglas del negocio y datos de ejemplo
src/lib/                 conexión a Supabase, sesión, carga de datos y utilidades
src/components/          barra de navegación, íconos, historial y perfil
src/pages/               inicio, entrar, registros
src/pages/operador/      eventos, crear evento, personal y bolsa
src/pages/trabajador/    calendario, mis postulaciones, mi perfil
```

## Correrlo en local

1. Instala Node.js 20 o superior.
2. Copia `.env.example` como `.env.local` y pon la URL y la publishable key del proyecto de Supabase.
3. Ejecuta:

```
npm install
npm run dev
```

## Base de datos

En Supabase, abre **SQL Editor**, pega el contenido de `database/schema.sql` y dale **Run**. El script se puede correr varias veces: borra las tablas, las crea de nuevo y carga los datos de ejemplo. Las cuentas de Authentication no se borran y se vuelven a enlazar por correo.

Para refrescar las fechas de los datos de ejemplo (la cena de gala queda "hoy"), corre en el SQL Editor:

```sql
select reset_demo();
```

## Despliegue en Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`

El archivo `public/_redirects` hace que las rutas como `/operador` funcionen al recargar la página.

## Prototipo anterior

El MVP del corte pasado (HTML y JavaScript con datos en el navegador) quedó en la carpeta `mvp/`.
