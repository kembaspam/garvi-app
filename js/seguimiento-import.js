// ─── SEGUIMIENTO: importar desde el Excel o el PDF de "PERMISOS Y RECORDATORIOS" ─────────────
// Lee la hoja tal como la tienes (Google Sheets → Descargar → .xlsx o .pdf) y rellena todos los
// bloques de la sección. Antes de aplicar nada muestra un resumen "ahora → nuevo" y pide confirmar.
//
// Cómo reconoce la hoja: busca los TÍTULOS de cada bloque (PERMISOS, RENOVACIÓN PERMISOS,
// A CUENTA CLIENTES, MERCADILLO, VACACIONES, VERTEDERO UTE ALICANTE, FACTURACIÓN a, PAGARÉ de…),
// así que sigue funcionando aunque cambien las filas o añadas más líneas. Si cambias de sitio o
// renombras un título, ese bloque no se reconocerá y el resumen lo mostrará a 0.
//   · Excel: exacto (también lee el verde/rojo de los pagarés: verde = cobrado).
//   · PDF: se reconstruye por posición del texto; no trae colores, así que el estado "cobrado" de
//     un pagaré se conserva de lo que ya hubiera en la app (mismo cliente + fecha + importe).

const SEG_MESES={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
function segNorm(t){ return String(t==null?'':t).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/\s+/g,' ').trim(); }
function segIsoYMD(y,m,d){ return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'); }
function segIsoDeSerial(n){ return new Date(Date.UTC(1899,11,30)+Math.round(n)*864e5).toISOString().slice(0,10); }
// "31 octubre" -> ISO, eligiendo el año más cercano a hoy (la hoja no trae año).
function segFechaTexto(txt,hoy){
  const m=String(txt||'').trim().match(/^(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)(?:\s+(?:de\s+)?(\d{4}))?$/i);
  if(!m) return '';
  const mes=SEG_MESES[m[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')]; if(!mes) return '';
  if(m[3]) return segIsoYMD(+m[3],mes,+m[1]);
  const ref=new Date(hoy+'T00:00:00'); let mejor='',dist=1e15;
  [ref.getFullYear()-1,ref.getFullYear(),ref.getFullYear()+1].forEach(y=>{
    const iso=segIsoYMD(y,mes,+m[1]), d=Math.abs(new Date(iso+'T00:00:00')-ref); if(d<dist){dist=d;mejor=iso;}
  });
  return mejor;
}
function segImporteDe(c){
  if(c&&typeof c.v==='number') return Math.round(c.v*100)/100;
  const t=String((c&&c.t)||'').replace(/[€\s]/g,''); if(!t) return '';
  const n=parseFloat(t.includes(',')?t.replace(/\./g,'').replace(',','.'):t);
  return isFinite(n)?Math.round(n*100)/100:'';
}
function segColorFill(rgb){
  if(!rgb) return '';
  const h=String(rgb).replace(/^FF(?=[0-9A-F]{6}$)/i,''); if(!/^[0-9A-F]{6}$/i.test(h)) return '';
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  if(g>180&&r<110&&b<110) return 'verde';
  if(r>180&&g<110&&b<110) return 'rojo';
  return '';
}

// ── Parser común: recibe dos regiones de celdas {t,v?,f?,fill?} y devuelve los bloques ──
// L = columnas A-C(-D) de la izquierda (filas en orden)  ·  R = columnas E..J de la derecha (6 por fila)
function segParseGrid(L,R,op){
  const hoy=op.hoy, existente=op.existente||{}, anio=op.anio||new Date(hoy+'T00:00:00').getFullYear();
  const avisos=[];
  const out={acuenta:[],acuentaNota:'',permisos:[],renovaciones:[],facturar:[],pagares:[],vacaciones:[],tarifas:[]};
  const C=(row,i)=>{ const c=row&&row[i]; return c&&c.t!=null?String(c.t).trim():''; };
  const uid=segUid;

  // Izquierda
  const iFact=L.findIndex(r=>segNorm(C(r,0)).startsWith('FACTURACION'));
  const iPag=L.findIndex(r=>segNorm(C(r,0)).startsWith('PAGARE'));
  for(let i=0;i<(iFact>=0?iFact:L.length);i++){
    const r=L[i]; if(!C(r,0)) continue;
    out.acuenta.push({id:uid(),cliente:C(r,0),cant:C(r,1),tipo:C(r,2)||'MEZCLA'});
  }
  if(iFact>=0) for(let i=iFact+1;i<(iPag>=0?iPag:L.length);i++){
    const r=L[i]; if(!C(r,0)&&!C(r,1)&&!C(r,2)) continue;
    out.facturar.push({id:uid(),cliente:C(r,0),concepto:C(r,1),lugar:C(r,2)});
  }
  if(iPag>=0) for(let i=iPag+1;i<L.length;i++){
    const r=L[i], cli=C(r,0); if(!cli) continue;
    const cv=r[1]; const vence=(cv&&cv.f==='date'&&typeof cv.v==='number')?segIsoDeSerial(cv.v):segFechaTexto(C(r,1),hoy);
    const importe=segImporteDe(r[2]);
    if(!vence) avisos.push('Pagaré de '+cli+': no entiendo la fecha "'+C(r,1)+'"');
    const previo=(existente.pagares||[]).find(p=>p.cliente===cli&&p.vence===vence&&Number(p.importe)===Number(importe));
    const color=r[3]&&r[3].fill;
    out.pagares.push({id:uid(),cliente:cli,tipo:(previo&&previo.tipo)||'Pagaré',vence,importe,
      cobrado:color==='verde'?true:color==='rojo'?false:!!(previo&&previo.cobrado)});
  }

  // Derecha
  // Los títulos están centrados sobre varias columnas (en el PDF caen en una columna u otra), así que
  // se buscan en cualquier celda de la fila.
  const titulo=(pred)=>R.findIndex(r=>r.some(c=>pred(segNorm(c&&c.t))));
  const iPerm=titulo(t=>t==='PERMISOS');
  const iRen=titulo(t=>t.startsWith('RENOVACION'));
  const iCuenta=titulo(t=>t==='A CUENTA CLIENTES');
  const iMerc=titulo(t=>t==='MERCADILLO');
  const iVac=titulo(t=>t==='VACACIONES');
  const iVert=titulo(t=>t.startsWith('VERTEDERO'));
  const iViajes=R.findIndex(r=>segNorm(C(r,2)).startsWith('VIAJES'));
  const iSab=R.findIndex(r=>segNorm(C(r,3))==='SABOSPA');
  const pago=(r)=>C(r,5)||C(r,4);
  if(iPerm>=0) for(let i=iPerm+2;i<(iRen>=0?iRen:R.length);i++){
    const r=R[i]; if(![0,1,2,3].some(k=>C(r,k))) continue;
    out.permisos.push({id:uid(),fecha:C(r,0),direccion:C(r,1),contacto:C(r,2),pago:C(r,3)||pago(r)});
  }
  if(iRen>=0) for(let i=iRen+2;i<(iCuenta>=0?iCuenta:R.length);i++){
    const r=R[i]; if(![0,1,2,3].some(k=>C(r,k))) continue;
    out.renovaciones.push({id:uid(),limite:C(r,0),fecha:C(r,1),direccion:C(r,2),contacto:C(r,3),pago:pago(r)});
  }
  if(iCuenta>=0){
    const lineas=[];
    for(let i=iCuenta+1;i<(iMerc>=0?iMerc:Math.min(R.length,iCuenta+8));i++){
      const t=[C(R[i],0),C(R[i],1)].filter(Boolean).join(' '); if(t) lineas.push(t);
    }
    out.acuentaNota=lineas.join('\n');
  }
  const partir=(txt)=>{ const t=String(txt).replace(/^[-–]\s*/,''); const k=t.indexOf('='); return k<0?{concepto:t.trim(),valor:''}:{concepto:t.slice(0,k).trim(),valor:t.slice(k+1).trim()}; };
  const grupo=(titulo,color,filas)=>({id:uid(),titulo,color,filas:filas.map(f=>({id:uid(),concepto:f.concepto,valor:f.valor}))});
  if(iMerc>=0){ const f=[0,1,2,3].map(k=>C(R[iMerc+1],k)).filter(Boolean).map(partir); out.tarifas.push(grupo(R[iMerc].map(c=>c.t).find(t=>segNorm(t)==='MERCADILLO'),'amarillo',f)); }
  if(iViajes>=0){ const f=[]; for(let i=iViajes+1;i<R.length&&C(R[i],2);i++) f.push(partir(C(R[i],2))); out.tarifas.push(grupo(C(R[iViajes],2),'verde',f)); }
  if(iSab>=0){ const f=[]; for(let i=iSab+1;i<R.length&&C(R[i],3);i++) f.push(partir(C(R[i],3))); out.tarifas.push(grupo(C(R[iSab],3),'verde',f)); }
  if(iVert>=0){ const f=[]; for(let i=iVert+1;i<R.length&&C(R[i],0);i++) f.push({concepto:C(R[i],0),valor:C(R[i],1)}); out.tarifas.push(grupo(R[iVert].map(c=>String(c.t).trim()).find(t=>segNorm(t).startsWith('VERTEDERO')),'amarillo',f)); }

  if(iVac>=0){
    let p=null;
    const reP=/^(.*?)\b(?:del|el)\s+(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)(?:\s+(?:al|a)\s+(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+))?/i;
    const mesDe=(s)=>SEG_MESES[String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')];
    for(let i=iVac+1;i<(iVert>=0?iVert:R.length);i++){
      const t0=C(R[i],0), t1=C(R[i],1);
      if(!t0){ continue; }                                            // fila de total ("28 dias") o vacía
      const m=t0.match(reP);
      if(m&&mesDe(m[3])){
        if(!p){ p={id:uid(),nombre:'',nota:'',periodos:[]}; out.vacaciones.push(p); }
        const d1=+m[2], m1=mesDe(m[3]), d2=m[4]?+m[4]:d1, m2=m[5]?mesDe(m[5]):m1;
        const desde=segIsoYMD(anio,m1,d1); let hasta=segIsoYMD(anio,m2||m1,d2); if(hasta<desde) hasta=segIsoYMD(anio+1,m2||m1,d2);
        p.periodos.push({id:uid(),desde,hasta,nota:(m[1]||'').trim()});
      } else if(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ .'-]{1,24}$/.test(t0)&&!/\d/.test(t0)&&(!t1||/^d[ií]as?$/i.test(t1))){
        p={id:uid(),nombre:t0,nota:'',periodos:[]}; out.vacaciones.push(p);
      } else if(p){
        p.nota=segNorm(t0).startsWith(segNorm(p.nombre))?t0.slice(p.nombre.length).trim():t0;
      }
    }
  }
  return {datos:out,avisos};
}

// ── Excel → regiones ──
function segGridDesdeHoja(ws){
  const rango=XLSX.utils.decode_range(ws['!ref']); let ult=0;
  Object.keys(ws).forEach(k=>{ if(k[0]==='!') return; const a=XLSX.utils.decode_cell(k); const c=ws[k]; if((c.v!==undefined&&String(c.v).trim()!=='')||c.w) ult=Math.max(ult,a.r); });
  ult=Math.min(ult,rango.e.r);
  const celda=(r,c)=>{
    const x=ws[XLSX.utils.encode_cell({r,c})]; if(!x) return {t:''};
    const esFecha=x.t==='n'&&x.z&&XLSX.SSF.is_date(x.z);
    const fill=x.s&&x.s.patternType==='solid'&&x.s.fgColor&&x.s.fgColor.rgb?segColorFill(x.s.fgColor.rgb):'';
    return {t:x.w!=null?String(x.w):(x.v!=null?String(x.v):''),v:typeof x.v==='number'?x.v:undefined,f:esFecha?'date':undefined,fill};
  };
  const L=[],R=[];
  for(let r=0;r<=ult;r++){ L.push([0,1,2,3].map(c=>celda(r,c))); R.push([4,5,6,7,8,9].map(c=>celda(r,c))); }
  return {L,R};
}

// ── PDF → regiones (por posición del texto) ──
// items: [{x,y,s}] con y creciente hacia arriba (como en pdf.js). La página se divide en la tabla
// de la izquierda (x<200) y el resto; cada región en filas por altura y en columnas por franjas de x.
function segGridDesdePdf(items){
  const limpios=items.filter(i=>String(i.s).trim());
  const filas=(its,franja,nCols)=>{
    const o=[...its].sort((a,b)=>b.y-a.y), rows=[]; let ref=null,act=null;
    o.forEach(i=>{ if(act===null||Math.abs(i.y-ref)>2.5){ act=[]; rows.push(act); ref=i.y; } act.push(i); });
    return rows.map(row=>{
      const celdas=Array.from({length:nCols},()=>[]);
      row.sort((a,b)=>a.x-b.x).forEach(i=>celdas[franja(i.x)].push(String(i.s).trim()));
      return celdas.map(t=>({t:t.join(' ').replace(/(\d)\s+€/g,'$1€').replace(/\s{2,}/g,' ').trim()}));
    });
  };
  const L=filas(limpios.filter(i=>i.x<200),x=>x<100?0:x<138?1:2,4);
  const R=filas(limpios.filter(i=>i.x>=200),x=>x<280?0:x<360?1:x<440?2:x<505?3:5,6);
  return {L,R};
}

// ── Carga de librerías bajo demanda ──
function cargarPdfJs(){
  return new Promise((ok,ko)=>{
    if(window.pdfjsLib) return ok();
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(); };
    s.onerror=()=>ko(new Error('No se pudo cargar el lector de PDF (¿sin conexión?)'));
    document.head.appendChild(s);
  });
}
function leerArchivoSeguimiento(file){
  const nombre=file.name.toLowerCase(), op={hoy:todayISO(),existente:seguimiento};
  if(/\.xlsx?$/.test(nombre)){
    return cargarSheetJS().then(()=>file.arrayBuffer()).then(buf=>{
      const wb=XLSX.read(buf,{type:'array',cellStyles:true});
      const {L,R}=segGridDesdeHoja(wb.Sheets[wb.SheetNames[0]]);
      return segParseGrid(L,R,op);
    });
  }
  if(/\.pdf$/.test(nombre)){
    return cargarPdfJs().then(()=>file.arrayBuffer()).then(buf=>pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise).then(doc=>{
      return doc.getPage(1).then(pg=>pg.getTextContent()).then(tc=>{
        const items=tc.items.map(i=>({x:i.transform[4],y:i.transform[5],s:i.str}));
        const {L,R}=segGridDesdePdf(items);
        const res=segParseGrid(L,R,op);
        if(doc.numPages>1) res.avisos.push('El PDF tiene '+doc.numPages+' páginas: solo se ha leído la primera.');
        return res;
      });
    });
  }
  return Promise.reject(new Error('Formato no válido (usa .xlsx, .pdf o .json)'));
}

// ── Resumen + aplicar ──
let segImportPendiente=null;
const SEG_NOMBRES={acuenta:'A cuenta de clientes',permisos:'Permisos',renovaciones:'Renovación de permisos',facturar:'Facturación a…',pagares:'Pagarés y cheques',vacaciones:'Vacaciones (personas)',tarifas:'Tarifas / notas (bloques)'};
function mostrarResumenImportSeguimiento(res,nombreArchivo){
  segImportPendiente=res;
  const d=res.datos, esc=segEsc;
  const filas=Object.keys(SEG_NOMBRES).map(k=>{
    const ahora=(seguimiento[k]||[]).length, nuevo=d[k].length;
    return `<tr><td>${SEG_NOMBRES[k]}</td><td style="text-align:center">${ahora}</td><td style="text-align:center">→</td><td style="text-align:center;font-weight:800">${nuevo}</td></tr>`;
  }).join('');
  const pagNuevos=d.pagares.filter(p=>!p.cobrado), totalPend=pagNuevos.reduce((s,p)=>s+(Number(p.importe)||0),0);
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Importar Seguimiento</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div style="font-size:12px;color:var(--muted)">${esc(nombreArchivo)}</div>
    <table style="width:100%;font-size:13px;margin-top:10px;border-collapse:collapse"><thead><tr style="color:var(--muted);font-size:11px;text-transform:uppercase"><th style="text-align:left">Bloque</th><th>Ahora</th><th></th><th>Nuevo</th></tr></thead><tbody>${filas}</tbody></table>
    ${d.acuentaNota?`<div style="font-size:12px;margin-top:10px;color:#b91c1c;white-space:pre-line">📝 ${esc(d.acuentaNota)}</div>`:''}
    <div style="font-size:12.5px;margin-top:10px">Pagarés pendientes: <b>${pagNuevos.length}</b> por <b>${fmtMoney(totalPend)}</b></div>
    ${res.avisos.length?`<div style="font-size:12px;margin-top:10px;color:#92400e;background:#fffbe6;border-radius:8px;padding:8px">${res.avisos.map(esc).join('<br>')}</div>`:''}
    <div style="font-size:12px;margin-top:10px;color:var(--muted)">Al aplicar se <b>reemplaza</b> todo el contenido actual de Seguimiento por esto.</div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-secondary btn-full" data-action="close-modal">Cancelar</button>
      <button class="btn btn-primary btn-full" data-action="aplicar-import-seguimiento">Aplicar</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function aplicarImportSeguimiento(){
  const res=segImportPendiente; if(!res) return;
  SEG_BLOQUES.forEach(b=>{ if(res.datos[b]!==undefined) seguimiento[b]=res.datos[b]; });
  saveSeguimiento(); SEG_BLOQUES.forEach(b=>syncSeguimiento(b));
  segImportPendiente=null; closeModal(); renderSeguimiento(); toastMsg('Seguimiento importado ✓');
}
