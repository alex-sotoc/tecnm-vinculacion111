// Generador PDF autocontenido: no requiere CDN ni servicios externos.
// PDF 1.4 con fuentes estándar y caracteres Windows-1252.
window.TecNMPdf = (() => {
  const W=595.28,H=841.89;
  const labels={no_elegible:'No apto',registro:'Registro',presentacion:'Carta de presentacion',aceptacion:'Carta de aceptacion',bimestre1:'Bimestre 1',bimestre2:'Bimestre 2',bimestre3:'Bimestre 3',cierre:'Cierre',constancia:'Constancia'};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const latin=s=>String(s??'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2022]/g,'-').replace(/[^\u0000-\u00ff]/g,'?');
  const bytes=s=>Uint8Array.from([...latin(s)].map(x=>x.charCodeAt(0)));
  const esc=s=>latin(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\x00-\x1f]/g,' ');
  function create(data){
    const pages=[];let cmds=[],y=0,pageNum=0;
    const primary=[.09,.33,.55],pale=[.94,.97,.99],ink=[.13,.22,.35],gray=[.46,.54,.62],green=[.13,.52,.43];
    const f=(a)=>a.map(x=>x.toFixed(3)).join(' ');
    function rect(x,top,w,h,color){cmds.push(`${f(color)} rg ${x.toFixed(2)} ${(H-top-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)}
    function txt(text,x,top,size=10,bold=false,color=ink){cmds.push(`${f(color)} rg BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${(H-top-size).toFixed(2)} Tm (${esc(text)}) Tj ET`)}
    const textWidth=(text,size=10)=>latin(text).length*size*.50;
    function wrap(text,maxWidth,size=9){const words=latin(text).split(/\s+/);const lines=[];let s='';for(const word of words){if(textWidth((s?s+' ':'')+word,size)<=maxWidth)s=(s?s+' ':'')+word;else{if(s)lines.push(s);s=word;}}if(s)lines.push(s);return lines.length?lines:[''];}
    function textWrap(text,x,top,maxWidth,size=9,lh=13,color=ink){const lines=wrap(text,maxWidth,size);for(let i=0;i<lines.length;i++)txt(lines[i],x,top+i*lh,size,false,color);return top+lines.length*lh;}
    function head(){rect(0,0,W,8,primary);txt('TecNM',43,28,21,true,primary);txt('TECNOLOGICO NACIONAL DE MEXICO',43,55,8,true,ink);txt('CAMPUS MATEHUALA  /  DEPARTAMENTO DE VINCULACION',43,69,8,false,gray);rect(43,89,W-86,1,primary);y=110;}
    function newPage(){if(cmds.length)pages.push(cmds.join('\n'));cmds=[];pageNum++;head()}
    function ensure(height){if(y+height>H-70)newPage()}
    function title(s){ensure(36);txt(s,43,y,15,true,primary);y+=31;}
    function foot(){rect(43,H-54,W-86,1,[.84,.88,.92]);txt('Reporte generado desde el portal de Vinculacion · TecNM Campus Matehuala',43,H-45,8,false,gray);txt(String(pageNum),W-58,H-45,8,false,gray)}
    function sectionRow(label,value){ensure(27);rect(43,y,W-86,26,pale);txt(label,55,y+7,9,false,gray);txt(String(value),W-150,y+7,10,true,ink);y+=31;}
    function table(cols,items,widths){const left=43,right=552;const w=widths||cols.map(()=> (right-left)/cols.length);const rowH=23;function header(){rect(left,y,right-left,29,primary);let x=left;cols.forEach((s,i)=>{txt(s,x+7,y+9,8,true,[1,1,1]);x+=w[i]});y+=31;}ensure(60);header();items.forEach((row,i)=>{if(y+rowH>H-70){newPage();header();}if(i%2===0)rect(left,y,right-left,rowH,[.97,.98,.99]);let x=left;row.forEach((cell,k)=>{let s=latin(cell);const max=Math.max(3,Math.floor((w[k]-12)/4.5));if(s.length>max)s=s.slice(0,max-2)+'..';txt(s,x+7,y+7,8,false,ink);x+=w[k]});y+=rowH;});y+=14;}
    const all=data.rows||[],ds=data.docs||[];
    const total=all.length,eligible=all.filter(r=>r.elegible).length,notEligible=total-eligible;
    const stages={};for(const r of all)stages[r.etapa]=(stages[r.etapa]||0)+1;
    const status={};for(const d of ds){const key=String(d.estado||'SIN_ESTADO').trim().toUpperCase();status[key]=(status[key]||0)+1;}
    newPage();
    txt('REPORTE ESTADISTICO',43,y+9,23,true,primary);txt('DEL SERVICIO SOCIAL',43,y+41,18,true,ink);y+=90;
    rect(43,y,W-86,78,pale);
    txt('PERIODO DE CONSULTA',57,y+14,8,true,gray);txt(data.periodo,57,y+31,13,true,ink);
    txt('FECHA DE GENERACION',350,y+14,8,true,gray);txt(data.fecha.toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}),350,y+31,10,true,ink);y+=103;
    title('1. Resumen general');
    const kpis=[['Estudiantes registrados',total],['Elegibles',eligible],['No elegibles',notEligible],['Expedientes registrados',all.filter(r=>r.expediente).length],['Expedientes activos',all.filter(r=>r.expediente&&String(r.estado).toLowerCase()==='activo').length],['Documentos vigentes',ds.length]];
    kpis.forEach(a=>sectionRow(a[0],a[1]));
    y+=18;title('2. Distribucion por etapa');
    for(const [key,value] of Object.entries(stages)) {ensure(32);const width=(W-270)*(value/(total||1));txt(labels[key]||key,43,y+6,9,false,ink);rect(228,y+7,Math.max(2,width),11,key==='no_elegible'?[.76,.43,.35]:primary);txt(String(value),W-65,y+5,9,true,ink);y+=30;}
    y+=18;title('3. Estado documental');
    const breakdown=Object.entries(status).sort((a,b)=>b[1]-a[1]);if(breakdown.length){table(['Estado','Documentos'],breakdown.map(([k,v])=>[k.replace(/_/g,' '),v]),[360,149]);}else{textWrap('No se encontraron documentos vigentes.',43,y,W-86);y+=24;}
    newPage();title('4. Relacion de expedientes');
    textWrap('Los valores de horas registrados provienen del expediente en Google Sheets. La validacion tecnica no equivale por si sola a autorizacion institucional.',43,y,W-86,9,14,gray);y+=45;
    if(all.length)table(['No. control','Nombre','Etapa','Horas'],all.map(r=>[r.control,r.nombre,labels[r.etapa]||r.etapa,`${r.horas}/500`]),[82,197,143,87]);
    else{txt('Sin expedientes para este periodo.',43,y,10,false,gray);y+=25;}
    ensure(75);y+=12;txt('NOTAS METODOLOGICAS',43,y,10,true,primary);y+=19;
    y=textWrap('1. Se utiliza la ultima version de cada documento, identificada por expediente, tipo y periodo.',43,y,W-86,8,12,gray)+6;
    y=textWrap('2. Los estados VALIDADO TECNICAMENTE y ACEPTADO se muestran por separado.',43,y,W-86,8,12,gray)+6;
    y=textWrap('3. Este reporte es de seguimiento estadistico y no constituye constancia ni aprobacion institucional.',43,y,W-86,8,12,gray)+6;
    pages.push(cmds.join('\n'));
    // Insertar pie en cada pagina, con numeracion total.
    const objects=[null];const add=o=>(objects.push(o),objects.length-1);
    const fontReg=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageRefs=[];
    const pageParent=add('PAGESPLACEHOLDER');
    for(let i=0;i<pages.length;i++){
      const footer=[`${f([.85,.89,.93])} rg 43 ${(H-54).toFixed(2)} ${W-86} 1 re f`,`${f(gray)} rg BT /F1 8 Tf 1 0 0 1 43 38 Tm (Reporte estadistico - TecNM Campus Matehuala) Tj ET`,`${f(gray)} rg BT /F1 8 Tf 1 0 0 1 ${W-72} 38 Tm (Pag. ${i+1}/${pages.length}) Tj ET`].join('\n');
      const stream=pages[i]+'\n'+footer;
      const contentBytes=bytes(stream);
      const contents=add(`<< /Length ${contentBytes.length} >>\nstream\n${stream}\nendstream`);
      const p=add(`<< /Type /Page /Parent ${pageParent} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contents} 0 R >>`);
      pageRefs.push(p);
    }
    objects[pageParent]=`<< /Type /Pages /Kids [${pageRefs.map(i=>`${i} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
    const root=add(`<< /Type /Catalog /Pages ${pageParent} 0 R >>`);
    const chunks=[];let offset=0;const offsets=[0];function push(s){const arr=bytes(s);chunks.push(arr);offset+=arr.length;}
    push('%PDF-1.4\n%\xC1\xC2\xC3\xC4\n');
    for(let i=1;i<objects.length;i++){offsets[i]=offset;push(`${i} 0 obj\n${objects[i]}\nendobj\n`);}
    const xref=offset;push(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);
    for(let i=1;i<objects.length;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
    push(`trailer\n<< /Size ${objects.length} /Root ${root} 0 R >>\nstartxref\n${xref}\n%%EOF`);
    const out=new Uint8Array(offset);let pos=0;for(const c of chunks){out.set(c,pos);pos+=c.length;}return out;
  }
  return {create};
})();
