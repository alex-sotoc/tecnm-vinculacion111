import {json,configOk,verifyPassword,sameOrigin,createSession,cookieSet} from '../../_lib/vinculacion-auth.js';

export async function onRequestPost({request,env}) {
  if (!configOk(env)) return json({ok:false,error:'Faltan ADMIN_PASSWORD o ADMIN_SESSION_SECRET en Cloudflare (Production).'},503);
  if (!sameOrigin(request)) return json({ok:false,error:'Origen no permitido.'},403);
  if (!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
    return json({ok:false,error:'Se requiere JSON.'},415);
  if (Number(request.headers.get('content-length')||0)>2048) return json({ok:false,error:'Solicitud demasiado grande.'},413);
  let body;
  try { body=await request.json(); } catch { return json({ok:false,error:'Solicitud inválida.'},400); }
  if (typeof body?.usuario !== 'string' || typeof body?.password !== 'string' || body.password.length>256)
    return json({ok:false,error:'Usuario o contraseña incorrectos.'},401);
  const user=body.usuario.trim().toLowerCase();
  const valid=await verifyPassword(body.password,env.ADMIN_PASSWORD);
  if (user!=='vinculacion'||!valid) return json({ok:false,error:'Usuario o contraseña incorrectos.'},401);
  const cookie=await createSession(env.ADMIN_SESSION_SECRET);
  return json({ok:true,usuario:'vinculacion'},200,{'Set-Cookie':cookieSet(cookie)});
}
export function onRequestGet() { return json({ok:false,error:'Usa POST.'},405); }
