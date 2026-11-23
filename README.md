# Panel de Vinculación | TecNM Campus Matehuala

Sitio estático + Cloudflare Pages Functions. Conserva panel, expedientes, filtros y PDF local. Sin dependencias ni build.

## PUBLICAR

1. Crea un **repositorio NUEVO** en GitHub, preferiblemente privado. Extrae el ZIP y sube TODOS los archivos y la carpeta `functions` a la raíz del repositorio. `index.html` debe estar en raíz, NO dentro de una carpeta adicional. **NO subas el archivo separado de secretos.**
2. Cloudflare Dashboard > **Workers & Pages** > **Create** > **Pages** > **Connect to Git** (no Workers) > selecciona el repositorio.
3. Framework **None**, build command **vacío**, build output directory **`.`**, root directory **raíz del repositorio**, production branch **main**.
4. En el proyecto de Pages, Settings > **Variables and Secrets** > **Production**, crea tres valores tipo **Secret**:
   - `ADMIN_PASSWORD`: inventa una contraseña PRIVADA de al menos 12 caracteres para el usuario fijo `vinculacion`.
   - `ADMIN_SESSION_SECRET`: copia el valor del archivo privado separado `CLAVES_PRIVADAS_NO_SUBIR_A_GITHUB.txt`.
   - `N8N_WEBHOOK_KEY`: copia el valor del mismo archivo privado.
5. Después de guardar variables, haz un despliegue NUEVO desde GitHub para que se apliquen. Verifica Production deployment = Success. Si ya existía proyecto de Pages, asegúrate de que los secretos están en ESE proyecto y no otro.

## n8n — WF-05

En el Webhook GET con path `ss-vinculacion-panel` configura Authentication = Header Auth; la credencial debe ser:

- **Name** = `X-Automation-Key` (este es el NOMBRE DEL HEADER, no un segundo secreto)
- **Value** = el valor privado de `N8N_WEBHOOK_KEY` (EXACTAMENTE igual)
- Respond = Using Respond to Webhook Node.

Nodos: Webhook → Leer estudiantes (ESTUDIANTES) → Leer expedientes (EXPEDIENTES) → Leer documentos (DOCUMENTOS) → Preparar panel (Code) → Respond to Webhook (`First Incoming Item`).

ATENCIÓN: si tu tercer nodo todavía se llama `Leer estudiantes1`, renómbralo a `Leer expedientes`, porque el código del Code node lo consulta usando ese nombre exacto. No renombres nodos sin revisar expresiones.

Código del Code node (Run Once for All Items):

```javascript
const read = name => $(name).all().map(item => item.json || {});
const clean = v => String(v ?? '').trim();
const numeric = v => v === '' || v == null ? 0 : (Number.isFinite(Number(v)) ? Number(v) : 0);
const students = read('Leer estudiantes');
const files = read('Leer expedientes');
const docs = read('Leer documentos');
return [{json:{
 ok:true, fetched_at:new Date().toISOString(),
 estudiantes:students.filter(s=>clean(s.control)).map(s=>({
  control:clean(s.control), nombre:clean(s.nombre), carrera:clean(s.carrera),
  creditos_aprobados:numeric(s.creditos_aprobados), creditos_totales:numeric(s.creditos_totales),
  porcentaje_creditos:numeric(s.porcentaje_creditos), elegible:clean(s.elegible)
 })),
 expedientes:files.filter(e=>clean(e.expediente_id)).map(e=>({
  expediente_id:clean(e.expediente_id), control:clean(e.control), convocatoria_id:clean(e.convocatoria_id),
  etapa_portal:clean(e.etapa_portal), estado:clean(e.estado),
  periodo_habilitado:numeric(e.periodo_habilitado), horas_acreditadas:numeric(e.horas_acreditadas)
 })),
 documentos:docs.filter(d=>clean(d.documento_id)).map(d=>({
  documento_id:clean(d.documento_id), expediente_id:clean(d.expediente_id), tipo_id:clean(d.tipo_id),
  periodo:numeric(d.periodo), version:numeric(d.version), row_number:numeric(d.row_number),
  estado:clean(d.estado), horas_validadas:numeric(d.horas_validadas)
 }))
}}];
```

Publica/activa el workflow y utiliza la URL de PRODUCCIÓN (sin `webhook-test`). La URL esperada que ya está en `functions/api/vinculacion/data.js` es:
`https://servicio-social.app.n8n.cloud/webhook/ss-vinculacion-panel`
Si la URL real es distinta, cambia esa constante antes de publicar.

## VERIFICAR EN ESTE ORDEN

1. Abre `https://TU-PROYECTO.pages.dev/api/vinculacion/session` SIN iniciar sesión: debe devolver JSON con HTTP 401. Si muestra HTML/404, las Functions NO se publicaron; no sigas probando contraseñas.
2. Abre la raíz del sitio, inicia con usuario `vinculacion` y el valor PRIVADO de `ADMIN_PASSWORD`. Si indica variables ausentes (503), verifica Production y redespliega.
3. Con sesión iniciada, `/api/vinculacion/session` debe devolver `{"ok":true,"usuario":"vinculacion"}`.
4. Con sesión iniciada, `/api/vinculacion/data` debe devolver `ok:true` y tres listas. 502 con 401/403 de n8n significa Header Auth mal configurado; 502 JSON inválido significa problema en el workflow; 504 significa red o timeout.
5. Verifica panel, búsquedas y PDF. Los PDF se generan en el navegador sin otro workflow.

## ADVERTENCIAS DE SEGURIDAD

NO subas secretos al repositorio ni los copies a `app.js`, `.html`, README o URL. El archivo privado se entrega fuera del ZIP. Sustituye cualquier contraseña anterior comprometida. Usa datos ficticios hasta tener controles institucionales; para estudiantes reales se requiere autorización y seguridad adicional (por ejemplo MFA, limitación de intentos, auditoría y gestión de acceso). La página consulta datos al pulsar actualizar; n8n NO hace push espontáneo.
