import {json,isAdmin} from '../../_lib/vinculacion-auth.js';
export async function onRequestGet({request,env}) {
  const ok=await isAdmin(request,env);
  return json({ok,usuario:ok?'vinculacion':null},ok?200:401);
}
