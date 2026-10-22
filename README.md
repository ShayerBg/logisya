# LogisYa

Plataforma web de gestión de personal y bolsa de talento compartida para operadores de eventos en el Atlántico.
Proyecto de Ingeniería de Software, Universidad de la Costa (CUC).

**Equipo:** Sergio Andrés Avila Velilla, Shayer Andrés Bermúdez Guerrero, Laura Vanessa Escobar Coba y Wylhem Molina Romero.

## Estado actual: prototipo (v0.1.0)

Esta versión es un **prototipo para validar el flujo y las reglas del negocio**. Está hecho en HTML, CSS y JavaScript,
sin backend: los datos son ficticios y se guardan en el navegador (localStorage). No tiene inicio de sesión real;
el usuario se cambia con un selector.

La siguiente versión pasa a **React + Vite + Supabase** con autenticación, roles y base de datos PostgreSQL,
y se despliega en Netlify según el plan de despliegue.

| Vista | Archivo | Qué permite |
|---|---|---|
| Inicio | `index.html` | Presentación y acceso a las vistas |
| Operador | `operador.html` | Crear eventos y vacantes, convocar, confirmar postulantes, validar horas, calificar, reemplazos, bolsa |
| Trabajador | `trabajador.html` | Calendario con filtros, postulación, marcar entrada y salida, perfil e historial |
| Administrador | `admin.html` | Resumen de la bolsa, reportes de horas, operadores y reglas de la plataforma |

## Cómo abrirlo

Abrir `index.html` en el navegador, o servir la carpeta:

```bash
python3 -m http.server 8000
```

El botón **Avanzar 6 h** simula el paso del tiempo para ver cómo cambian las vacantes y los turnos.

## Pruebas

Las reglas del negocio (`logisya-data.js`) tienen pruebas automáticas con el corredor de pruebas de Node:

```bash
npm test
```

Corren solas en GitHub Actions en cada push y pull request a `main` y `develop`.

## Ramas

- `main`: versión entregable.
- `develop`: integración del trabajo en curso. Los cambios llegan a `main` por pull request revisado por otro integrante.
