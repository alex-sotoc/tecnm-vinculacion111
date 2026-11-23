import {json,cookieClear,sameOrigin} from '../../_lib/vinculacion-auth.js';
export function onRequestPost({request}) {
  if (!sameOrigin(request)) return json({ok:false,error:'Origen no permitido.'},403);
  return json({ok:true},200,{'Set-Cookie':cookieClear()});
}
