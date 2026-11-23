
import { json, isAdmin } from '../../_lib/vinculacion-auth.js';

const WF05_URL =
  'https://servicio-social.app.n8n.cloud/webhook/ss-vinculacion-panel';

export async function onRequestGet({ request, env }) {

  if (!(await isAdmin(request, env))) {
    return json({
      ok: false,
      error: 'Sesion no autorizada.'
    }, 401);
  }

  if (!env.N8N_WEBHOOK_KEY) {
    return json({
      ok: false,
      error: 'Falta N8N_WEBHOOK_KEY en Cloudflare.'
    }, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log('WF05: Iniciando consulta');

    const response = await fetch(WF05_URL, {
      method: 'GET',
      headers: {
        'X-Automation-Key': env.N8N_WEBHOOK_KEY,
        'Accept': 'application/json'
      },
      signal: controller.signal,
      redirect: 'error'
    });

    console.log('WF05: HTTP', response.status);

    if (!response.ok) {
      return json({
        ok: false,
        error: 'n8n respondio HTTP ' + response.status,
        codigo: 'WF05_HTTP'
      }, 502);
    }

    const data = await response.json();

    if (
      data?.ok !== true ||
      !Array.isArray(data.estudiantes) ||
      !Array.isArray(data.expedientes) ||
      !Array.isArray(data.documentos)
    ) {
      return json({
        ok: false,
        error: 'n8n devolvio un JSON incorrecto.',
        codigo: 'WF05_JSON'
      }, 502);
    }

    console.log('WF05: Consulta exitosa');

    return json(data);

  } catch (error) {

    console.error('WF05_ERROR', {
      name: error?.name,
      message: error?.message,
      cause: error?.cause?.message
    });

    return json({
      ok: false,
      error: 'Error al conectar Cloudflare con n8n.',
      codigo: 'WF05_FETCH_ERROR',
      tipo: error?.name || 'UnknownError'
    }, 502);

  } finally {
    clearTimeout(timeout);
  }
}
