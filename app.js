(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const ESTADOS = ['registro','presentacion','aceptacion','bimestre1','bimestre2','bimestre3','cierre','constancia'];
const LABELS = {no_elegible:'No apto',registro:'Registro',presentacion:'Carta de presentación',aceptacion:'Carta de aceptación',bimestre1:'Bimestre 1',bimestre2:'Bimestre 2',bimestre3:'Bimestre 3',cierre:'Cierre',constancia:'Constancia'};
const COLORS = ['#2273b5','#3792c9','#188a79','#845cc3','#ef9e50','#6c8bca','#e36f72','#64778c','#aa763b'];
const DOC_COLORS = {VALIDADO_TECNICAMENTE:'#208f80',ACEPTADO:'#1767aa',OBSERVADO:'#de9550',EN_REVISION:'#7c91af',DESCARTADO:'#bcc5d0'};
let store={estudiantes:[],expedientes:[],documentos:[],fetched_at:null,convocatorias:[]};
let currentTab='panel';let selectedStudent='';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const norm = x=>String(x??'').trim();
const upper = x=>norm(x).toUpperCase();
const n = v=>Number.isFinite(Number(v))?Number(v):0;
function show(id,yes=true){$(id).classList.toggle('hidden',!yes);}
function note(msg,danger=true){$('notice').textContent=msg;$('notice').classList.toggle('danger',danger);show('notice',true)}
function clearNote(){show('notice',false)}
async function request(url,options={}){
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
 let data;try{data=await response.json()}catch{data={ok:false,error:'Respuesta no válida del servidor.'}};
 if(!response.ok||data.ok===false){const e=new Error(data.error||'No se pudo completar la solicitud.');e.status=response.status;throw e;}
 return data;
}
async function init(){
 try{await request('/api/vinculacion/session');show('boot',false);show('app',true);await refresh();}
 catch{show('boot',false);show('login',true);}
}
async function login(ev){ev.preventDefault();const btn=$('loginButton');btn.disabled=true;btn.textContent='Verificando acceso…';show('loginError',false);
 try{
  await request('/api/vinculacion/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:$('usuario').value,password:$('password').value})});
  $('password').value='';show('login',false);show('app',true);await refresh();
 }catch(e){$('loginError').textContent=e.message;show('loginError',true);}finally{btn.disabled=false;btn.innerHTML='Ingresar al panel <span>→</span>';}
}
async function logout(){try{await request('/api/vinculacion/logout',{method:'POST'});}catch{}store={estudiantes:[],expedientes:[],documentos:[],fetched_at:null,convocatorias:[]};show('app',false);show('login',true);$('password').value='';clearNote();}
function compareDocs(a,b){const av=n(a.version)-n(b.version);return av||n(a.row_number)-n(b.row_number);}
function latestDocs(){const map=new Map();for(const doc of store.documentos){if(!doc.documento_id||!doc.expediente_id)continue;const key=[norm(doc.expediente_id),norm(doc.tipo_id),norm(doc.periodo)].join('|');if(!map.has(key)||compareDocs(doc,map.get(key))>0)map.set(key,doc);}return [...map.values()];}
function getRows(){const byEx=new Map(store.expedientes.map(x=>[norm(x.control),x]));const doc=latestDocs();return store.estudiantes.map(s=>{
 const control=norm(s.control);const e=byEx.get(control)||{};const etapa=norm(e.etapa_portal)||(upper(s.elegible)==='NO'||n(s.porcentaje_creditos)<70?'no_elegible':'registro');
 const ds=doc.filter(d=>norm(d.expediente_id)===norm(e.expediente_id));
 const aprob=n(s.creditos_aprobados),total=n(s.creditos_totales);const pct=total>0?aprob/total*100:n(s.porcentaje_creditos);
 return {control,nombre:norm(s.nombre)||'Sin nombre',carrera:norm(s.carrera),creditos:pct,etapa,estado:norm(e.estado)||(etapa==='no_elegible'?'no_elegible':'sin_expediente'),horas:n(e.horas_acreditadas),periodo:n(e.periodo_habilitado),convocatoria:norm(e.convocatoria_id),expediente:norm(e.expediente_id),docs:ds,elegible:etapa!=='no_elegible'};
 });}
function badge(text,color='blue'){return `<span class="pill ${color}">${esc(text)}</span>`;}
function stageName(x){return LABELS[x]||'Por verificar'}
function badgeStage(stage){return badge(stageName(stage),stage==='no_elegible'?'red':stage==='constancia'?'green':'blue')}
function badgeDoc(status){const st=upper(status),c=st==='ACEPTADO'?'blue':st==='VALIDADO_TECNICAMENTE'?'green':st==='OBSERVADO'?'amber':'gray';return badge(st.replace(/_/g,' '),c)}
function summary(){let rows=getRows();const accepted=rows.filter(r=>r.elegible).length;const docs=latestDocs();const dcounts={};for(const d of docs){const k=upper(d.estado)||'SIN_ESTADO';dcounts[k]=(dcounts[k]||0)+1;}const stages={};for(const r of rows)stages[r.etapa]=(stages[r.etapa]||0)+1;return {rows,accepted,docs,dcounts,stages};}
function fillOptions(){let selected=$('reportPeriod').value;const codes=[...new Set(store.expedientes.map(e=>norm(e.convocatoria_id)).filter(Boolean))].sort();const options=['<option value="todos">Todas las convocatorias</option>',...codes.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`)].join('');$('reportPeriod').innerHTML=options;$('reportPeriod').value=codes.includes(selected)?selected:'todos';
 const stageSelected=$('stageFilter').value;$('stageFilter').innerHTML='<option value="">Todas las etapas</option>'+Object.keys(LABELS).map(k=>`<option value="${k}">${LABELS[k]}</option>`).join('');$('stageFilter').value=stageSelected;
}
function render(){clearNote();const {rows,accepted,docs,dcounts,stages}=summary();const val=n(dcounts.VALIDADO_TECNICAMENTE),obs=n(dcounts.OBSERVADO),rev=n(dcounts.EN_REVISION);
 const metrics=[['Estudiantes registrados',rows.length,'En el control académico','♙'],['Elegibles',accepted,'Cumplen condición de inicio','✓'],['Expedientes activos',rows.filter(r=>r.expediente&&r.estado.toLowerCase()==='activo').length,'En seguimiento','▤'],['Documentos observados',obs,'Últimas versiones vigentes','!']];
 $('metrics').innerHTML=metrics.map(m=>`<div class="metric"><div class="meta"><span>${esc(m[0])}</span><span class="micon">${m[3]}</span></div><strong>${m[1]}</strong><small>${esc(m[2])}</small></div>`).join('');
 const order=['no_elegible',...ESTADOS];$('stageChart').innerHTML=order.filter(x=>stages[x]).map((key,i)=>`<div><div class="chart-title"><span>${esc(stageName(key))}</span><span>${stages[key]}</span></div><div class="track"><div class="fill" style="width:${rows.length?100*stages[key]/rows.length:0}%;background:${COLORS[i%COLORS.length]}"></div></div></div>`).join('')||'<p class="muted">Sin registros para mostrar.</p>';
 const legendOrder=['VALIDADO_TECNICAMENTE','ACEPTADO','OBSERVADO','EN_REVISION','DESCARTADO','SIN_ESTADO'];const legend=legendOrder.filter(k=>dcounts[k]);const total=legend.reduce((s,k)=>s+dcounts[k],0);
 let angle=0;const colorSegments=legend.map(k=>{const next=angle+(dcounts[k]/(total||1))*100;const entry=`${DOC_COLORS[k]||'#aab7c6'} ${angle.toFixed(2)}% ${next.toFixed(2)}%`;angle=next;return entry;});
 $('donut').style.background=total?`conic-gradient(${colorSegments.join(',')})`:'#edf1f6';$('docCount').textContent=total;$('docLegend').innerHTML=legend.map(k=>`<div class="legenditem"><span class="dot" style="background:${DOC_COLORS[k]||'#aab7c6'}"></span>${esc(k.replace(/_/g,' '))}<b>${dcounts[k]}</b></div>`).join('')||'<div class="legenditem">Sin documentos</div>';
 $('summaryRows').innerHTML=rows.slice(0,7).map(r=>`<tr><td><strong>${esc(r.nombre)}</strong></td><td>${esc(r.control)}</td><td>${badgeStage(r.etapa)}</td><td>${r.horas}/500</td><td>${badge(r.etapa==='no_elegible'?'No apto':r.estado.replace(/_/g,' '),r.etapa==='no_elegible'?'red':'green')}</td></tr>`).join('')||'<tr><td colspan="5">No hay estudiantes registrados.</td></tr>';
 renderStudents();
 $('updatedAt').textContent='Consulta: '+new Date(store.fetched_at||Date.now()).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
}
function renderStudents(){const {rows}=summary();const q=norm($('search').value).toLowerCase(),etapa=$('stageFilter').value;
 const filtered=rows.filter(r=>(!q||(r.nombre+' '+r.control+' '+r.carrera).toLowerCase().includes(q))&&(!etapa||r.etapa===etapa));
 $('studentsRows').innerHTML=filtered.map(r=>`<tr><td><strong>${esc(r.nombre)}</strong><br><small>${esc(r.carrera)}</small></td><td>${esc(r.control)}</td><td>${Math.round(r.creditos)}%</td><td>${badgeStage(r.etapa)}</td><td>${r.horas}/500</td><td>${r.docs.length}</td><td><button class="tiny-link" data-detail="${esc(r.control)}">Consultar</button></td></tr>`).join('')||'<tr><td colspan="7">No hay resultados para esta búsqueda.</td></tr>';
 if(selectedStudent)renderDetail(selectedStudent);
}
function renderDetail(control){const r=getRows().find(x=>x.control===control);if(!r){show('studentDetail',false);return;}selectedStudent=control;show('studentDetail');$('detailName').textContent=r.nombre;$('detailMeta').textContent=`Control ${r.control} · ${r.expediente||'Sin expediente'} · ${r.carrera}`;
 $('detailStats').innerHTML=[['Etapa actual',stageName(r.etapa)],['Horas registradas',`${r.horas}/500 h`],['Créditos académicos',`${Math.round(r.creditos)}%`]].map(x=>`<div class="detailstat"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join('');
 $('detailDocs').innerHTML=r.docs.slice().sort((a,b)=>n(a.periodo)-n(b.periodo)||norm(a.tipo_id).localeCompare(norm(b.tipo_id))).map(d=>`<tr><td><strong>${esc(d.tipo_id)}</strong></td><td>${esc(d.periodo)}</td><td>${esc(d.version)}</td><td>${badgeDoc(d.estado)}</td><td>${n(d.horas_validadas)}</td></tr>`).join('')||'<tr><td colspan="5">Aún no hay documentos para este expediente.</td></tr>';
}
function setTab(tab){if(!['panel','expedientes','reportes'].includes(tab))return;currentTab=tab;const titles={panel:'Panel general',expedientes:'Consulta de expedientes',reportes:'Reportes estadísticos'};const desc={panel:'Información actualizada del procedimiento de Servicio Social.',expedientes:'Consulta las etapas, el avance y los documentos vigentes.',reportes:'Genera y descarga un PDF con la información de las convocatorias.'};
 for(const id of Object.keys(titles)){show('view-'+id,id===tab)}document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));$('pageTitle').textContent=titles[tab];$('pageSub').textContent=desc[tab];$('crumb').textContent=titles[tab];document.querySelector('.sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
}
async function refresh(){$('refresh').disabled=true;$('refresh').textContent='↻ Consultando…';clearNote();try{const data=await request('/api/vinculacion/data');store=data;store.fetched_at=data.fetched_at||new Date().toISOString();fillOptions();render();}catch(e){if(e.status===401){await logout();$('loginError').textContent='Tu sesión caducó. Ingresa de nuevo.';show('loginError');}else note(e.message);}finally{$('refresh').disabled=false;$('refresh').textContent='↻ Actualizar';}}
function downloadReport(){if(!store.fetched_at){note('Primero actualiza el panel para recuperar los datos.');return;}const period=$('reportPeriod').value;const all=getRows();const rows=period==='todos'?all:all.filter(x=>x.convocatoria===period);
 const docs=latestDocs().filter(d=>rows.some(r=>r.expediente===norm(d.expediente_id)));
 const data={fecha:new Date(),periodo:period==='todos'?'Todas las convocatorias':period,rows,docs};
 try{const bytes=window.TecNMPdf.create(data);const blob=new Blob([bytes],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Reporte_Servicio_Social_${period.replace(/[^a-z0-9_-]/gi,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){note('No se pudo generar el PDF: '+e.message);}
}
$('loginForm').addEventListener('submit',login);$('logout').addEventListener('click',logout);$('refresh').addEventListener('click',refresh);$('downloadPdf').addEventListener('click',downloadReport);$('search').addEventListener('input',renderStudents);$('stageFilter').addEventListener('change',renderStudents);$('closeDetail').addEventListener('click',()=>{selectedStudent='';show('studentDetail',false)});$('menuToggle').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));
$('showPassword').addEventListener('click',()=>{const el=$('password');el.type=el.type==='password'?'text':'password';$('showPassword').textContent=el.type==='password'?'Mostrar':'Ocultar';});document.addEventListener('click',ev=>{const tab=ev.target.closest('[data-tab]');if(tab){setTab(tab.dataset.tab);return;}const detail=ev.target.closest('[data-detail]');if(detail){setTab('expedientes');renderDetail(detail.dataset.detail);$('studentDetail').scrollIntoView({behavior:'smooth',block:'start'});}});
init();
})();
