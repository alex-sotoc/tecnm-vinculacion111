import {json,isAdmin} from '../../_lib/vinculacion-auth.js';

// Cambia esta URL solo si cambia la ruta de producción de WF-05.
const WF05_URL = 'https://servicio-social.app.n8n.cloud/webhook/ss-vinculacion-panel';

export async function onRequestGet({request,env}) {
  if (!(await isAdmin(request,env))) return json({ok:false,error:'Inicia sesión para consultar las estadísticas.'},401);
  if (!env.N8N_WEBHOOK_KEY || String(env.N8N_WEBHOOK_KEY).length<20)
    return json({ok:false,error:'Falta N8N_WEBHOOK_KEY en Cloudflare Production.'},503);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try {
    const upstream=await fetch(WF05_URL, {
      method:'GET',
      headers:{'X-Automation-Key':env.N8N_WEBHOOK_KEY,'Accept':'application/json'},
      signal:controller.signal,
      redirect:'error'
    });
    if (!upstream.ok) {
      const status=upstream.status;
      return json({ok:false,error:status===401||status===403 ?
        `n8n rechazó la clave Header Auth (HTTP ${status}). Revisa X-Automation-Key.` :
        `n8n respondió HTTP ${status}. Verifica workflow activo, URL de producción y ejecución.`,codigo:'WF05_HTTP'},502);
    }
    const contentType=upstream.headers.get('content-type')||'';
    if (!contentType.toLowerCase().includes('json')) return json({ok:false,error:'n8n no devolvió JSON. Revisa Respond to Webhook.'},502);
    const raw=await upstream.text();
    if (raw.length>8_000_000) return json({ok:false,error:'La respuesta de n8n es demasiado grande.'},502);
    const payload=JSON.parse(raw);
    if (payload?.ok!==true || !Array.isArray(payload.estudiantes) || !Array.isArray(payload.expedientes) || !Array.isArray(payload.documentos))
      return json({ok:false,error:'El JSON de n8n no contiene ok:true, estudiantes, expedientes y documentos como listas.'},502);
    return json({ok:true,fetched_at:payload.fetched_at||new Date().toISOString(),estudiantes:payload.estudiantes,expedientes:payload.expedientes,documentos:payload.documentos});
  } catch(error) {
    return json({ok:false,error:error?.name==='AbortError'?'n8n tardó demasiado en responder (25 segundos).':'No fue posible conectar con n8n o leer su JSON.'},504);
  } finally { clearTimeout(timeout); }
}
