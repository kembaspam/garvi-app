// ─── CONTENEDORES ─────────────────────────────────────────────────
const ESTADO_CFG=[
  {k:'todos',label:'Todos',bg:'#e2e8f0',color:'#4a6080'},
  {k:'normal',label:'Normal',bg:'#dbeafe',color:'#1e40af'},
  {k:'buenos',label:'Buenos',bg:'#dcfce7',color:'#166534'},
  {k:'aptos',label:'Aptos',bg:'#d9f99d',color:'#365314'},
  {k:'reparados',label:'Reparados',bg:'#f3e8ff',color:'#6d28d9'},
  {k:'rotos',label:'Rotos',bg:'#fee2e2',color:'#991b1b'},
  {k:'rotos_granja',label:'Granja',bg:'#fbd3da',color:'#7a1230'}, // granate, bien distinto del rojo de "Rotos"
];
let contView='todos'; // 'todos' | 'proximos' | 'retirar'
function numKeyCont(num){
  const m=String(num).match(/^(\d+)/);
  return m?parseInt(m[1],10):Infinity;
}
function computeContFilt(){
  const q=searchQ.toLowerCase();
  let filt=containers.filter(c=>{
    const matchQ=!q||c.num.toLowerCase().includes(q)||c.cliente.toLowerCase().includes(q)||(c.direccion||'').toLowerCase().includes(q)||(c.telefono||'').includes(q);
    const matchE=filterEstado==='todos'||c.estadoExcel===filterEstado;
    return matchQ&&matchE;
  });
  if(contView==='retirar') filt=filt.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO'&&daysSince(c.fecha)>=14);
  else if(contView==='proximos') filt=filt.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO'&&daysSince(c.fecha)>=7&&daysSince(c.fecha)<14);
  if(contView==='retirar'||contView==='proximos') filt=filt.slice().sort((a,b)=>daysSince(a.fecha)-daysSince(b.fecha));
  else filt=filt.slice().sort((a,b)=>numKeyCont(a.num)-numKeyCont(b.num)||String(a.num).localeCompare(String(b.num)));
  return filt;
}
function renderContenedores(){
  const sec=document.getElementById('sec-contenedores');
  const counts={};
  ESTADO_CFG.forEach(e=>counts[e.k]=0);
  counts.todos=containers.length;
  containers.forEach(c=>{ if(counts[c.estadoExcel]!==undefined) counts[c.estadoExcel]++; });
  const enCalle=containers.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO').length;
  const granjaCount=containers.filter(c=>c.cliente==='GRANJA TORRELLANO').length;
  const retirar=containers.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO'&&daysSince(c.fecha)>=14).length;
  const proximos=containers.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO'&&daysSince(c.fecha)>=7&&daysSince(c.fecha)<14).length;
  const stateCards=ESTADO_CFG.map(e=>`
    <div class="state-card ${filterEstado===e.k?'active':'inactive'}" style="background:${e.bg};color:${e.color}" data-action="filter-estado" data-param="${e.k}">
      ${e.label} <strong>${counts[e.k]}</strong>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div class="dash-wrap" style="position:relative;overflow:hidden">
        <svg style="position:absolute;right:12px;top:12px;opacity:0.12;pointer-events:none" width="56" height="56" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><rect x="5" y="10" width="34" height="4.5"/><rect x="5" y="14.5" width="4.5" height="20.5"/><rect x="9.5" y="20" width="11" height="4.5"/><rect x="5" y="30.5" width="13.5" height="4.5"/><polygon points="39,11 34.5,13.5 23,36"/><polygon points="23,23 18,22 23,36"/></g></svg>
        <div class="dash-greeting">Seguimiento de Contenedores</div>
        <div class="dash-date" style="text-transform:capitalize">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        <div class="dash-metrics">
          <div class="dash-metric" data-action="cont-view" data-param="todos"><div class="dash-metric-val">${containers.length}</div><div class="dash-metric-label">Total</div></div>
          <div class="dash-metric" data-action="cont-view" data-param="todos"><div class="dash-metric-val">${enCalle}</div><div class="dash-metric-label">En calle</div></div>
          <div class="dash-metric" data-action="cont-view" data-param="retirar"><div class="dash-metric-val" style="color:${retirar>0?'#f87171':'var(--accent)'}">${retirar}</div><div class="dash-metric-label">Retirar ≥14d</div></div>
          <div class="dash-metric" data-action="filter-estado" data-param="rotos_granja"><div class="dash-metric-val">${granjaCount}</div><div class="dash-metric-label">Granja</div></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="fact-toggle-btn ${contView==='todos'?'active':''}" style="flex:1;padding:7px" data-action="cont-view" data-param="todos">Todos (${containers.length})</button>
        <button class="fact-toggle-btn ${contView==='proximos'?'active':''}" style="flex:1;padding:7px" data-action="cont-view" data-param="proximos">Próximos (${proximos})</button>
        <button class="fact-toggle-btn ${contView==='retirar'?'active':''}" style="flex:1;padding:7px;${retirar>0?'color:#f87171':''}" data-action="cont-view" data-param="retirar">Retirar (${retirar})</button>
      </div>
      <div class="state-cards" id="cont-state-cards">${stateCards}</div>
      <div class="search-row">
        <input class="search-input" id="cont-search" type="search" placeholder="Buscar nº, cliente, dirección…" value="${searchQ}">
        <button class="btn btn-secondary btn-sm" data-action="pdf-contenedores">📄 PDF</button>
        <button class="btn btn-secondary btn-sm" data-action="excel-contenedores">📊 Excel</button>
        <button class="btn btn-secondary btn-sm" data-action="editar-rapido">✏️ Editar</button>
        <button class="btn btn-secondary btn-sm" data-action="nuevo-cont">+ Nuevo</button>
      </div>
    </div>
    <div class="cont-map-layout">
      <div class="card" id="cont-map-card" style="padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:12px;font-weight:700;color:var(--accent-blue);text-transform:uppercase;letter-spacing:.4px">📍 Mapa en tiempo real</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div id="cont-map-status" style="font-size:11px;color:var(--muted)"></div>
            <button class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px" data-action="cont-map-retry" title="Reintentar direcciones no localizadas">🔄</button>
            <button class="btn btn-secondary btn-sm" style="padding:4px 10px;font-size:20px;line-height:1" data-action="cont-map-fullscreen" title="Pantalla completa">⛶</button>
          </div>
        </div>
        <div id="cont-map"></div>
      </div>
      <div class="card" id="cont-list-card" style="padding:8px">
        <div id="cont-list"></div>
      </div>
    </div>`;
  document.getElementById('cont-search').addEventListener('input',e=>{searchQ=e.target.value;updateContList();});
  updateContList();
  initContMap();
}
function updateContList(){
  const listEl=document.getElementById('cont-list'); if(!listEl) return;
  const rows=computeContFilt().map(c=>{
    const dias=daysSince(c.fecha);
    const det=[c.direccion,c.tipo].filter(Boolean).join(' · ');
    return `<div class="cont-row" data-action="open-cont" data-param="${c.num}">
      <div class="cont-num s-${c.estadoExcel}">${c.num}</div>
      <div class="cont-info">
        <div class="cont-cliente">${c.cliente}</div>
        ${det?`<div class="cont-detail">${det}</div>`:''}
        ${c.aCuenta?`<div class="cont-acuenta">💰 A cuenta: ${c.aCuenta}</div>`:''}
      </div>
      ${daysBadge(dias,c.fecha)}
    </div>`;
  }).join('');
  listEl.innerHTML=rows||'<div class="empty-state"><div class="icon">📦</div>Sin resultados</div>';
}
function applyContFilter(){
  document.querySelectorAll('#cont-state-cards .state-card').forEach(el=>{
    const active=el.dataset.param===filterEstado;
    el.classList.toggle('active',active);
    el.classList.toggle('inactive',!active);
  });
  document.querySelectorAll('#sec-contenedores .fact-toggle-btn').forEach(el=>{
    el.classList.toggle('active',el.dataset.param===contView);
  });
  updateContList();
}
function hexToRgb(hex){
  const n=parseInt(hex.replace('#',''),16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
// Dibuja el check/cruz como vector (no como carácter ✓/✗): las fuentes base de jsPDF
// (helvetica) no traen esos glifos y saldrían en blanco o como un cuadrado en el PDF.
// Se pinta también un círculo de fondo de color suave para que la marca sea imposible de
// no ver (funciona como una "chincheta" de color, aunque el trazo saliera muy fino).
function drawCheckMark(doc,cx,cy,hex,bgHex){
  const [br,bg,bb]=hexToRgb(bgHex); doc.setFillColor(br,bg,bb); doc.circle(cx,cy,3,'F');
  const [r,g,b]=hexToRgb(hex);
  doc.setDrawColor(r,g,b); doc.setLineWidth(0.9);
  doc.line(cx-1.9,cy+0.1,cx-0.4,cy+1.6);
  doc.line(cx-0.4,cy+1.6,cx+2.2,cy-1.8);
}
function drawCrossMark(doc,cx,cy,hex,bgHex){
  const [br,bg,bb]=hexToRgb(bgHex); doc.setFillColor(br,bg,bb); doc.circle(cx,cy,3,'F');
  const [r,g,b]=hexToRgb(hex);
  doc.setDrawColor(r,g,b); doc.setLineWidth(0.9);
  doc.line(cx-1.7,cy-1.7,cx+1.7,cy+1.7);
  doc.line(cx-1.7,cy+1.7,cx+1.7,cy-1.7);
}
// PDF de contenedores con estilo propio: ordenado por número, en horizontal para que quepa
// todo (incluido el teléfono) en una sola fila, con la celda del número coloreada según el
// estado (mismos colores que las tarjetas de estado en la app) y los "Días" resaltados en
// amarillo (11-13 días) o rojo (14+ días, a retirar) — igual que el listado de referencia.
// A la derecha de "Días" se añade una marca: ✗ roja si lleva 14+ días (hay que retirarlo),
// ✓ verde si lleva menos.
function pdfContenedores(){
  const list=computeContFilt();
  if(!list.length){toastMsg('No hay datos para exportar');return;}
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4',orientation:'landscape'});
  const W=297, H=210, ML=12, MR=12, usable=W-ML-MR;
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',ML-2,8,16,16);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',ML+15,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche (Alicante) · CIF: B54970439',ML+15,21);
  doc.setTextColor(240,180,41); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('LISTADO DE CONTENEDORES',W-MR,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Fecha: '+fmtDate(todayISO()),W-MR,26,{align:'right'});
  doc.setDrawColor(200,212,227); doc.line(ML,32,W-MR,32);

  const headers=['Nº','Cliente','Dirección','Teléfono','Tipo','Fecha','Días','Retirar'];
  // numW + colsW debe sumar "usable"
  const numW=14, colsW=[55,110,24,20,18,16,15];
  const rowH=8; // fila más alta para una letra más grande y legible
  let cy=41;
  const printHeader=()=>{
    doc.setFillColor(15,32,68); doc.rect(ML,cy-5.5,usable,rowH,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
    let x=ML+2;
    doc.text(headers[0],x,cy); x+=numW;
    headers.slice(1).forEach((h,i)=>{ doc.text(h,x+2,cy); x+=colsW[i]; });
    cy+=rowH;
  };
  printHeader();
  list.forEach(c=>{
    if(cy>H-28){doc.addPage();cy=21;printHeader();}
    const est=ESTADO_CFG.find(e=>e.k===c.estadoExcel)||ESTADO_CFG[1];
    const [br,bg,bb]=hexToRgb(est.bg);
    const [tr,tg,tb]=hexToRgb(est.color);
    doc.setFillColor(br,bg,bb); doc.rect(ML,cy-5.5,numW,rowH,'F');
    doc.setFillColor(250,251,253); doc.rect(ML+numW,cy-5.5,usable-numW,rowH,'F');
    doc.setTextColor(tr,tg,tb); doc.setFontSize(9.5); doc.setFont('helvetica','bold');
    doc.text(String(c.num),ML+2,cy);
    const dias=daysSince(c.fecha);
    const vals=[c.cliente||'',c.direccion||'',c.telefono||'',c.tipo||'',fmtDate(c.fecha)];
    let x=ML+numW;
    doc.setFontSize(9);
    vals.forEach((v,i)=>{
      doc.setFont('helvetica',i===0?'bold':'normal'); // cliente en negrita para que destaque
      doc.setTextColor(15,32,68);
      doc.text(String(v),x+2,cy,{maxWidth:colsW[i]-3});
      x+=colsW[i];
    });
    // columna Días: 14+ en rojo (retirar), 11-13 en ámbar (alerta), resto normal
    if(dias>=14){ doc.setTextColor(153,27,27); doc.setFont('helvetica','bold'); }
    else if(dias>=11){ doc.setTextColor(146,64,14); doc.setFont('helvetica','bold'); }
    else { doc.setTextColor(15,32,68); doc.setFont('helvetica','normal'); }
    doc.text(dias+'d',x+2,cy);
    x+=colsW[5];
    // marca a la derecha de Días: ✗ roja (14+ días, a retirar) o ✓ verde (menos de 14)
    if(dias>=14) drawCrossMark(doc,x+colsW[6]/2,cy-1.8,'#dc2626','#fee2e2');
    else drawCheckMark(doc,x+colsW[6]/2,cy-1.8,'#16a34a','#dcfce7');
    cy+=rowH;
  });
  // leyenda de colores de estado
  cy+=7;
  if(cy>H-16){doc.addPage();cy=21;}
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(15,32,68);
  doc.text('LEYENDA',ML,cy); cy+=6.5;
  doc.setFont('helvetica','normal');
  ESTADO_CFG.filter(e=>e.k!=='todos').forEach(e=>{
    const [r,g,b]=hexToRgb(e.bg);
    doc.setFillColor(r,g,b); doc.rect(ML,cy-3.8,5.5,5.5,'F');
    doc.setTextColor(74,96,128); doc.text(e.label,ML+8,cy);
    cy+=6.5;
  });
  cy+=2;
  doc.setFillColor(254,226,226); doc.rect(ML,cy-3.8,5.5,5.5,'F');
  doc.setTextColor(74,96,128); doc.text('Días ≥14 (retirar)',ML+8,cy); cy+=6.5;
  doc.setFillColor(254,243,199); doc.rect(ML,cy-3.8,5.5,5.5,'F');
  doc.setTextColor(74,96,128); doc.text('Días 11-13 (alerta)',ML+8,cy); cy+=6.5;
  drawCrossMark(doc,ML+2.7,cy-1.8,'#dc2626','#fee2e2');
  doc.setTextColor(74,96,128); doc.text('Retirar: 14+ días',ML+8,cy); cy+=6.5;
  drawCheckMark(doc,ML+2.7,cy-1.8,'#16a34a','#dcfce7');
  doc.setTextColor(74,96,128); doc.text('Retirar: menos de 14 días',ML+8,cy);
  doc.setFillColor(240,180,41); doc.rect(0,H-5,W,5,'F');
  doc.save(nombreListado()+'.pdf');
}
// Carga perezosa de ExcelJS (exportar a Excel CON colores y negrita) solo la primera vez que se usa
let exceljsLoadPromise=null;
function loadExcelJS(){
  if(window.ExcelJS) return Promise.resolve();
  if(exceljsLoadPromise) return exceljsLoadPromise;
  exceljsLoadPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
    s.onload=()=>resolve();
    s.onerror=()=>{exceljsLoadPromise=null;reject(new Error('No se pudo cargar el exportador de Excel'));};
    document.head.appendChild(s);
  });
  return exceljsLoadPromise;
}
function hexToArgb(hex){ return 'FF'+hex.replace('#','').toUpperCase(); }
// Excel editable del listado de contenedores: mismas columnas, orden y colores que el PDF
// (celda del nº y de Estado coloreadas según el estado, cliente en negrita, Días en rojo/ámbar).
async function excelContenedores(){
  const list=computeContFilt();
  if(!list.length){toastMsg('No hay datos para exportar');return;}
  toastMsg('Generando Excel…');
  try{
    await loadExcelJS();
    const wb=new ExcelJS.Workbook();
    wb.creator='GARVI Recycling Systems';
    const ws=wb.addWorksheet('Contenedores');
    ws.columns=[
      {header:'Nº',key:'num',width:8},
      {header:'Cliente',key:'cliente',width:28},
      {header:'Dirección',key:'direccion',width:42},
      {header:'Teléfono',key:'telefono',width:14},
      {header:'Tipo',key:'tipo',width:12},
      {header:'Fecha',key:'fecha',width:11},
      {header:'Días',key:'dias',width:8},
      {header:'Retirar',key:'retirar',width:10},
      {header:'Estado',key:'estado',width:14},
    ];
    const headerRow=ws.getRow(1);
    headerRow.height=20;
    headerRow.eachCell(cell=>{
      cell.font={bold:true,size:11,color:{argb:'FFFFFFFF'}};
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F2044'}};
      cell.alignment={vertical:'middle'};
    });
    ws.views=[{state:'frozen',ySplit:1}];
    list.forEach(c=>{
      const est=ESTADO_CFG.find(e=>e.k===c.estadoExcel)||ESTADO_CFG[1];
      const dias=daysSince(c.fecha);
      const row=ws.addRow({num:c.num,cliente:c.cliente||'',direccion:c.direccion||'',telefono:c.telefono||'',tipo:c.tipo||'',fecha:fmtDate(c.fecha),dias,retirar:dias>=14?'✗':'✓',estado:est.label});
      row.height=18;
      row.eachCell(cell=>{ cell.font={size:11}; cell.alignment={vertical:'middle'}; });
      const numCell=row.getCell(1);
      numCell.font={bold:true,size:12,color:{argb:hexToArgb(est.color)}};
      numCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:hexToArgb(est.bg)}};
      numCell.alignment={vertical:'middle',horizontal:'center'};
      row.getCell(2).font={bold:true,size:11};
      const estCell=row.getCell(9);
      estCell.font={bold:true,size:11,color:{argb:hexToArgb(est.color)}};
      estCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:hexToArgb(est.bg)}};
      const diasCell=row.getCell(7);
      diasCell.alignment={horizontal:'center'};
      if(dias>=14) diasCell.font={bold:true,size:11,color:{argb:'FF991B1B'}};
      else if(dias>=11) diasCell.font={bold:true,size:11,color:{argb:'FF92400E'}};
      // marca a la derecha de Días: ✗ roja (14+ días, a retirar) o ✓ verde (menos de 14)
      const retirarCell=row.getCell(8);
      retirarCell.alignment={horizontal:'center'};
      retirarCell.font={bold:true,size:13,color:{argb:dias>=14?'FFDC2626':'FF16A34A'}};
    });
    ws.autoFilter={from:'A1',to:'I1'};
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=nombreListado()+'.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(e){
    console.error('Error exportando Excel:',e);
    toastMsg('No se pudo generar el Excel');
  }
}

// ─── MAPA DE CONTENEDORES (Leaflet + OSM / satélite Esri, sin API key) ──
function geoCacheGet(addr){
  const cache=JSON.parse(localStorage.getItem('garvi_geocode_cache_v4')||'{}');
  return cache[addr];
}
function geoCacheSet(addr,val){
  const cache=JSON.parse(localStorage.getItem('garvi_geocode_cache_v4')||'{}');
  cache[addr]=val;
  localStorage.setItem('garvi_geocode_cache_v4',JSON.stringify(cache));
}
const CIUDAD_OFICIAL={
  'San Vicente':'San Vicente del Raspeig',
  'San Juan':'San Juan de Alicante',
  'San Juan Pueblo':'San Juan de Alicante',
  'El Campello':'El Campello',
  'Muchamiel':'Muchamiel',
  'Busot':'Busot',
  'Torrellano':'Elche',
  'Moralet':'Alicante',
  'Gran Alacant':'Santa Pola',
  'Elche':'Elche',
  'Alicante':'Alicante',
};
function normalizeAddressForGeocode(raw){
  return (raw||'')
    .replace(/\bsu\s+nave\b/gi,'')
    .replace(/\bnave\s*\S*/gi,'')
    .replace(/\bgancho\b/gi,'')
    .replace(/\bfrente\s+/gi,'')
    .replace(/\bC\/\s*/gi,'Calle ')
    .replace(/\bAvd\.?\/\s*/gi,'Avenida ')
    .replace(/\bAv\.?\/\s*/gi,'Avenida ')
    .replace(/\bAvda\.?\s*/gi,'Avenida ')
    .replace(/\bPtda\.?\s*/gi,'Partida ')
    .replace(/\b(Plg|Polg)\.?\/?\s*/gi,'Polígono ')
    .replace(/\bUrb\.?\s*/gi,'Urbanización ')
    .replace(/\bPza\.?\s*/gi,'Plaza ')
    .replace(/,\s*,/g,',')
    .replace(/\s{2,}/g,' ')
    .trim().replace(/^,|,$/g,'').trim();
}
// Caja delimitadora aprox. de la comarca de Alicante (evita que "Calle X" encuentre una calle con el mismo nombre en un pueblo lejano de la provincia)
const ALICANTE_VIEWBOX='viewbox=-0.65,38.45,-0.35,38.15&bounded=1';
function geocodeAttempts(addr){
  const base=normalizeAddressForGeocode(addr);
  const parts=base.split(',').map(s=>s.trim()).filter(Boolean);
  const attempts=[];
  if(parts.length>=2){
    const cityRaw=parts[parts.length-1];
    const city=CIUDAD_OFICIAL[cityRaw]||cityRaw;
    const street=parts.slice(0,-1).join(', ');
    if(street) attempts.push({structured:true,street,city});
  }
  attempts.push({structured:false,q:base+', Alicante, España'});
  const parts2=parts.length>2?parts.slice(0,2).join(', '):null;
  if(parts2) attempts.push({structured:false,q:parts2+', Alicante, España'});
  if(parts.length>=3) attempts.push({structured:false,q:parts.slice(-2).join(', ')+', Alicante, España'});
  if(parts.length>0){
    const soloCalle=parts[0].replace(/\balto\s+P?\d+\w*/gi,'').replace(/\bNº?\s*\d+/gi,'').trim();
    if(soloCalle&&soloCalle!==parts[0]) attempts.push({structured:false,q:soloCalle+', Elche, Alicante, España'});
  }
  // Último recurso: si no se encuentra la calle exacta, situar al menos en el centro del municipio correcto
  if(parts.length>=2){
    const cityRaw=parts[parts.length-1];
    const city=CIUDAD_OFICIAL[cityRaw]||cityRaw;
    attempts.push({structured:false,q:city+', Alicante, España',aproximado:true});
  } else {
    attempts.push({structured:false,q:'Alicante, España',aproximado:true});
  }
  return attempts;
}
let geocodeQueueRunning=false;
async function geocodeQueueProcess(addresses,onEach){
  if(geocodeQueueRunning) return;
  geocodeQueueRunning=true;
  for(const addr of addresses){
    if(geoCacheGet(addr)!==undefined){ onEach(); continue; }
    let found=null;
    console.log('%c[GEOCODE] buscando:','color:#1a3a8f;font-weight:bold',addr);
    for(const attempt of geocodeAttempts(addr)){
      try{
        const url=attempt.structured
          ?`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=es&${ALICANTE_VIEWBOX}&country=España&city=${encodeURIComponent(attempt.city)}&street=${encodeURIComponent(attempt.street)}`
          :`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=es&${ALICANTE_VIEWBOX}&q=${encodeURIComponent(attempt.q)}`;
        console.log('  → intento:',attempt.structured?`street="${attempt.street}" city="${attempt.city}"`:`q="${attempt.q}"`);
        const res=await fetch(url);
        console.log('    status HTTP:',res.status);
        const data=await res.json();
        if(data&&data[0]){
          console.log('    ✓ encontrado:',data[0].display_name,'→',data[0].lat,data[0].lon,attempt.aproximado?'(APROXIMADO, no la calle exacta)':'');
          found={lat:+data[0].lat,lon:+data[0].lon,aproximado:!!attempt.aproximado};
          break;
        } else {
          console.log('    ✗ sin resultados');
        }
      }catch(e){ console.error('    ✗ error de red:',e); }
      await new Promise(r=>setTimeout(r,700));
    }
    if(!found) console.warn('[GEOCODE] NO localizado tras todos los intentos:',addr);
    geoCacheSet(addr,found);
    onEach();
    await new Promise(r=>setTimeout(r,700));
  }
  geocodeQueueRunning=false;
}
function recalcularUbicaciones(){
  const cache=JSON.parse(localStorage.getItem('garvi_geocode_cache_v4')||'{}');
  Object.keys(cache).forEach(k=>{if(cache[k]===null) delete cache[k];});
  localStorage.setItem('garvi_geocode_cache_v4',JSON.stringify(cache));
  toastMsg('Reintentando localizar direcciones…');
  updateContMapMarkers();
}
let mapFullscreenOrigParent=null, mapFullscreenOrigNext=null;
function toggleMapFullscreen(){
  const card=document.getElementById('cont-map-card'); if(!card) return;
  const entrando=!card.classList.contains('map-fullscreen');
  if(entrando){
    // Sacamos la tarjeta del grid de dos columnas y la colgamos directamente de <body>:
    // así "position:fixed" no puede heredar ningún tamaño/posición raro del grid/scroll padre
    // (causa de que se viera "flotando en medio" al hacer scroll, tanto en móvil como en PC).
    mapFullscreenOrigParent=card.parentNode;
    mapFullscreenOrigNext=card.nextSibling;
    document.body.appendChild(card);
    document.body.style.overflow='hidden';
  } else {
    document.body.style.overflow='';
    if(mapFullscreenOrigParent){
      if(mapFullscreenOrigNext&&mapFullscreenOrigNext.parentNode===mapFullscreenOrigParent) mapFullscreenOrigParent.insertBefore(card,mapFullscreenOrigNext);
      else mapFullscreenOrigParent.appendChild(card);
    }
    mapFullscreenOrigParent=null; mapFullscreenOrigNext=null;
  }
  card.classList.toggle('map-fullscreen');
  const btn=document.querySelector('[data-action="cont-map-fullscreen"]');
  if(btn) btn.textContent=card.classList.contains('map-fullscreen')?'✕':'⛶';
  setTimeout(()=>{ if(contMapInstance) contMapInstance.invalidateSize(); },100);
}
let contMapInstance=null, contMapMarkers=[];
const DIRECCIONES_FIJAS={
  'NAVE GARVI':'Calle Rosa de los Vientos, Alicante',
  'GRANJA TORRELLANO':'Torrellano, Elche',
};
// Direcciones confirmadas por el usuario que OpenStreetMap no tiene mapeadas en el sitio correcto:
// mejor sin pin que un pin en el lugar equivocado.
const SIN_GEOCODIFICAR=new Set(['Avd/Salamanca 9, 03005 Alicante']);
function resolveAddress(c){
  const addr=DIRECCIONES_FIJAS[c.cliente]||(c.direccion||'').trim();
  return SIN_GEOCODIFICAR.has(addr)?'':addr;
}
function initContMap(){
  const el=document.getElementById('cont-map');
  if(!el||typeof L==='undefined') return;
  if(contMapInstance){contMapInstance.remove();contMapInstance=null;}
  contMapInstance=L.map('cont-map',{scrollWheelZoom:true}).setView([38.3452,-0.4810],11);
  const calles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
  const satelite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'}).addTo(contMapInstance);
  L.control.layers({'🛰️ Satélite':satelite,'🗺️ Calles':calles}).addTo(contMapInstance);
  updateContMapMarkers();
  // El contenedor puede no tener aún su tamaño final al crear el mapa (sobre todo en móvil) → recalcular tras el layout
  setTimeout(()=>{ if(contMapInstance) contMapInstance.invalidateSize(); },150);
  setTimeout(()=>{ if(contMapInstance) contMapInstance.invalidateSize(); },600);
  if(!window._contMapResizeBound){
    window._contMapResizeBound=true;
    window.addEventListener('resize',()=>{ if(contMapInstance) contMapInstance.invalidateSize(); });
    window.addEventListener('orientationchange',()=>{ setTimeout(()=>{ if(contMapInstance) contMapInstance.invalidateSize(); },300); });
  }
}
function updateContMapMarkers(){
  if(!contMapInstance) return;
  contMapMarkers.forEach(m=>contMapInstance.removeLayer(m));
  contMapMarkers=[];
  const withDir=containers.filter(c=>resolveAddress(c));
  const groups={};
  withDir.forEach(c=>{
    const addr=resolveAddress(c);
    (groups[addr]=groups[addr]||[]).push(c);
  });
  Object.entries(groups).forEach(([addr,group])=>{
    const cached=geoCacheGet(addr);
    if(!cached||!cached.lat) return;
    const count=group.length;
    const aprox=cached.aproximado?' ⚠️':'';
    const icon=L.divIcon({className:'',html:`<div class="cont-pin${cached.aproximado?' cont-pin-aprox':''}"><span>${count>1?count:'📦'}</span></div>`,iconSize:[36,36],iconAnchor:[18,36]});
    const marker=L.marker([cached.lat,cached.lon],{icon}).addTo(contMapInstance);
    if(count===1){
      const c=group[0];
      marker.bindTooltip(`#${c.num} · ${c.cliente}${aprox?' (ubicación aproximada)':''}`);
      marker.on('click',()=>openContainerModal(c.num));
    } else {
      marker.bindTooltip(`${group[0].cliente} · ${count} contenedores${aprox?' (ubicación aproximada)':''}`);
      marker.on('click',()=>{
        searchQ=group[0].cliente;
        const si=document.getElementById('cont-search'); if(si) si.value=searchQ;
        updateContList();
        const lc=document.getElementById('cont-list-card'); if(lc) lc.scrollIntoView({behavior:'smooth',block:'nearest'});
        toastMsg(`Mostrando ${count} contenedores de ${group[0].cliente}`);
      });
    }
    contMapMarkers.push(marker);
  });
  const statusEl=document.getElementById('cont-map-status');
  const uniqAddrs=Object.keys(groups);
  const pendientes=uniqAddrs.filter(a=>geoCacheGet(a)===undefined);
  if(pendientes.length){
    if(statusEl) statusEl.textContent=`Localizando direcciones… (${uniqAddrs.length-pendientes.length}/${uniqAddrs.length})`;
    geocodeQueueProcess(pendientes,()=>{ if(currentTab==='contenedores') updateContMapMarkers(); });
  } else if(statusEl){
    statusEl.textContent=`${withDir.length} contenedor(es) en ${uniqAddrs.length} ubicaciones`;
  }
}

// ─── MODAL CONTENEDOR ─────────────────────────────────────────────
// Desde el modal de un contenedor: cierra el modal, lleva a la Agenda del día de hoy y abre
// ahí un aviso nuevo con cliente/dirección/teléfono ya rellenos (se pueden modificar antes de guardar).
function mandarAvisoDesdeCont(num){
  const c=getContainer(num); if(!c) return;
  closeModal();
  const hoy=todayISO();
  calYear=new Date().getFullYear(); calMonth=new Date().getMonth(); calSelDay=hoy;
  renderTab('inicio');
  setTimeout(()=>nuevoAvisoModal(null,{
    tipo:'llevada',
    nota:c.cliente||'',
    direccion:c.direccion||'',
    telefono:c.telefono||'',
    fecha:hoy,
    infoAdicional:AVISO_INFO_DEFECTO,
  }),50);
}
function openContainerModal(num){
  const c=getContainer(num);
  if(!c) return;
  const dias=daysSince(c.fecha);
  const photosHtml=c.fotos&&c.fotos.length?c.fotos.map((f,i)=>`<img class="photo-thumb" src="${f}" data-action="del-foto" data-param="${c.num}" data-idx="${i}" title="Borrar">`).join(''):'';
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0">
        <span class="modal-title"><span class="cont-num s-${c.estadoExcel}" style="margin-right:8px">${c.num}</span>${c.cliente}</span>
        <button class="btn btn-primary btn-sm" data-action="mandar-aviso-cont" data-param="${c.num}">📨 Mandar Aviso</button>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button>
    </div>
    <div class="form-row">
      <label>Cliente</label><input id="m-cliente" list="dl-global-clientes" value="${c.cliente}">
    </div>
    <div class="form-row cols2">
      <div><label>Dirección</label><input id="m-dir" list="dl-global-direcciones" value="${c.direccion||''}"></div>
      <div><label>Teléfono</label><input id="m-tel" list="dl-global-telefonos" value="${c.telefono||''}" type="tel">${c.telefono?`<a href="tel:${c.telefono}" style="font-size:12px;color:var(--accent);margin-top:4px;display:block">📞 Llamar</a>`:''}</div>
    </div>
    <div class="form-row cols2">
      <div><label>Tipo residuo</label>
        <select id="m-tipo">
          ${TIPOS_RESIDUO.map(t=>`<option${c.tipo===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div><label>Fecha última visita</label><input id="m-fecha" type="date" value="${c.fecha}">
        <div style="font-size:11px;color:var(--muted);margin-top:3px">${dias} días</div>
      </div>
    </div>
    <div class="form-row">
      <label>Estado</label>
      <select id="m-estado">
        ${ESTADO_CFG.filter(e=>e.k!=='todos').map(e=>`<option value="${e.k}"${c.estadoExcel===e.k?' selected':''}>${e.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <label>A cuenta (si tiene)</label><input id="m-acuenta" placeholder="ej: 50€ pendiente" value="${c.aCuenta||''}">
    </div>
    <div class="form-row">
      <label>Notas</label><textarea id="m-notas" rows="2">${c.notas||''}</textarea>
    </div>
    <div class="photos-row">${photosHtml}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-primary" data-action="save-cont" data-param="${c.num}">Guardar</button>
      <button class="btn btn-secondary" data-action="foto-cont" data-param="${c.num}">📷 Foto</button>
      <button class="btn btn-secondary" data-action="nuevo-albaran-from" data-param="${c.num}">📋 Albarán</button>
      <button class="btn btn-secondary" data-action="ver-historial-cont" data-param="${c.num}">🕘 Historial${c.historial&&c.historial.length?` (${c.historial.length})`:''}</button>
      ${c.telefono?`<a href="https://wa.me/34${c.telefono}" target="_blank" class="btn btn-secondary">${ICO_WA} WhatsApp</a>`:''}
      <button class="btn btn-danger btn-sm" style="margin-left:auto" data-action="del-cont" data-param="${c.num}">🗑</button>
    </div>`;
  // Autocompleta Dirección/Teléfono/Tipo residuo con lo que ya haya guardado de ese cliente en
  // cualquier parte de la app (contenedores, albaranes, facturas, memoria de avisos) — ver
  // datosClientePorNombre. Escucha 'input' (escribiendo) y también 'change'/'blur' porque al
  // elegir una sugerencia del datalist, algunos navegadores (sobre todo móviles) no disparan
  // 'input'.
  function autocompletarClienteCont(e){
    // NAVE GARVI/GRANJA TORRELLANO: no es un cliente real, así que al ponerlo se vacían
    // Dirección/Teléfono/A cuenta/Notas (pueden traer datos del cliente que hubiera antes en ese
    // contenedor) — se deja intacto solo Tipo residuo y Fecha, que no dependen del cliente.
    if(esClienteInterno(e.target.value)){
      ['m-dir','m-tel','m-acuenta','m-notas'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      return;
    }
    const datos=datosClientePorNombre(e.target.value,c.num);
    if(!datos) return;
    if(datos.direccion){const el=document.getElementById('m-dir');if(el)el.value=datos.direccion;}
    if(datos.telefono){const el=document.getElementById('m-tel');if(el)el.value=datos.telefono;}
    if(datos.tipo){const el=document.getElementById('m-tipo');if(el)el.value=datos.tipo;}
  }
  ['input','change','blur'].forEach(ev=>document.getElementById('m-cliente').addEventListener(ev,autocompletarClienteCont));
  // Si el contenedor ya tenía puesto el cliente pero le faltan Dirección/Teléfono (p.ej. uno
  // recién creado), rellena esos huecos nada más abrir el modal, sin esperar a que el usuario
  // vuelva a escribir el nombre. Solo toca los campos que estén vacíos, nunca pisa datos ya
  // puestos a mano en este contenedor concreto (y no toca Tipo residuo: al ser un <select>
  // siempre tiene algún valor, no hay forma de saber si está "vacío" o elegido a propósito).
  if(c.cliente){
    const datosInit=datosClientePorNombre(c.cliente,c.num);
    if(datosInit){
      const dirEl=document.getElementById('m-dir');
      if(dirEl&&!dirEl.value&&datosInit.direccion) dirEl.value=datosInit.direccion;
      const telEl=document.getElementById('m-tel');
      if(telEl&&!telEl.value&&datosInit.telefono) telEl.value=datosInit.telefono;
    }
  }
  document.getElementById('modal-overlay').classList.add('open');
}
function saveContainerModal(num){
  const c=getContainer(num);
  if(!c) return;
  const nuevoCliente=document.getElementById('m-cliente').value.trim();
  if(prevaleceEspecialHoy(c,nuevoCliente)){
    toastMsg(`Hoy ya se puso en ${c.cliente} — prevalece, no se puede reasignar a otro cliente el mismo día`,4500);
    closeModal();
    return;
  }
  const antes=snapshotContenedor(c);
  c.cliente=nuevoCliente;
  c.direccion=document.getElementById('m-dir').value.trim();
  c.telefono=document.getElementById('m-tel').value.trim();
  c.tipo=document.getElementById('m-tipo').value;
  c.fecha=document.getElementById('m-fecha').value;
  c.estadoExcel=document.getElementById('m-estado').value;
  c.aCuenta=document.getElementById('m-acuenta').value.trim();
  registrarHistorialContenedor(c,antes);
  c.notas=document.getElementById('m-notas').value.trim();
  saveContainers();guardarContenedorNube(c);syncClientes();closeModal();renderContenedores();toastMsg('Guardado ✓');updateBadge();
}
// Compara cliente/dirección ignorando acentos, mayúsculas y puntuación, y también si una es
// simplemente la otra con la ciudad añadida al final — para fusionar entradas del historial
// que en el fondo son el mismo sitio aunque el texto guardado tenga formato distinto.
function normTextoHist(s){
  return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function mismaUbicacionHist(a,b){
  if(!a||!b) return false;
  if(normTextoHist(a.cliente)!==normTextoHist(b.cliente)) return false;
  const da=normTextoHist(a.direccion), db=normTextoHist(b.direccion);
  return da===db||(!!da&&!!db&&(da.includes(db)||db.includes(da)));
}
// Fusiona entradas consecutivas del historial que sean el mismo cliente/dirección (aunque el
// texto guardado tenga pequeñas diferencias), quedándose con la más antigua de cada tramo —
// así una misma estancia no sale repetida por ediciones menores (teléfono, a cuenta...) que se
// registraron antes de que eso dejara de contar como cambio.
function fusionarHistorial(hist){
  const out=[];
  for(const h of hist){
    if(out.length&&mismaUbicacionHist(out[out.length-1],h)) out[out.length-1]=h;
    else out.push(h);
  }
  return out;
}
function verHistorialContenedor(num){
  const c=getContainer(num); if(!c) return;
  const hist=fusionarHistorial(c.historial||[]);
  const filaActual=`
    <div class="hist-entry hist-actual">
      <div class="hist-fecha">Actual</div>
      <div class="hist-datos">
        <div><strong>${c.cliente||'—'}</strong></div>
        ${c.direccion?`<div>${c.direccion}</div>`:''}
        ${c.telefono?`<div>📞 ${c.telefono}</div>`:''}
        <div>${[c.tipo,estadoLabel(c.estadoExcel)].filter(Boolean).join(' · ')}</div>
        ${c.aCuenta?`<div>💰 A cuenta: ${c.aCuenta}</div>`:''}
      </div>
    </div>`;
  const filas=hist.map(h=>`
    <div class="hist-entry">
      <div class="hist-fecha">${fmtDateHora(h.fecha)}</div>
      <div class="hist-datos">
        <div><strong>${h.cliente||'—'}</strong></div>
        ${h.direccion?`<div>${h.direccion}</div>`:''}
        ${h.telefono?`<div>📞 ${h.telefono}</div>`:''}
        <div>${[h.tipo,estadoLabel(h.estadoExcel)].filter(Boolean).join(' · ')}</div>
        ${h.aCuenta?`<div>💰 A cuenta: ${h.aCuenta}</div>`:''}
      </div>
    </div>`).join('');
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">🕘 Historial · #${c.num}</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="hist-list">${filaActual}${filas||'<div class="empty-state" style="padding:16px 0"><div class="icon">🕘</div>Todavía no hay cambios registrados</div>'}</div>
    <button class="btn btn-secondary btn-full" style="margin-top:12px" data-action="open-cont" data-param="${c.num}">← Volver</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function estadoLabel(k){const e=ESTADO_CFG.find(x=>x.k===k);return e?e.label:(k||'');}

function nuevoContModal(){
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Nuevo contenedor</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="form-row cols2">
      <div><label>Número / ID</label><input id="nc-num" placeholder="ej: 250, L200…"></div>
      <div><label>Estado</label><select id="nc-estado">${ESTADO_CFG.filter(e=>e.k!=='todos').map(e=>`<option value="${e.k}">${e.label}</option>`).join('')}</select></div>
    </div>
    <div class="form-row"><label>Cliente</label><input id="nc-cliente" list="dl-global-clientes"></div>
    <div class="form-row cols2">
      <div><label>Dirección</label><input id="nc-dir" list="dl-global-direcciones"></div>
      <div><label>Teléfono</label><input id="nc-tel" list="dl-global-telefonos" type="tel"></div>
    </div>
    <div class="form-row cols2">
      <div><label>Tipo</label><select id="nc-tipo">${TIPOS_RESIDUO.map(t=>`<option>${t}</option>`).join('')}</select></div>
      <div><label>Fecha</label><input id="nc-fecha" type="date" value="${todayISO()}"></div>
    </div>
    <button class="btn btn-primary btn-full" style="margin-top:8px" data-action="crear-cont">Crear contenedor</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function crearContenedor(){
  const num=document.getElementById('nc-num').value.trim();
  if(!num){toastMsg('Introduce un número');return;}
  if(getContainer(num)){toastMsg('Ya existe ese número');return;}
  const nuevoCont={num,cliente:document.getElementById('nc-cliente').value.trim(),direccion:document.getElementById('nc-dir').value.trim(),telefono:document.getElementById('nc-tel').value.trim(),tipo:document.getElementById('nc-tipo').value,fecha:document.getElementById('nc-fecha').value,estadoExcel:document.getElementById('nc-estado').value,notas:'',aCuenta:'',fotos:[]};
  containers.push(nuevoCont);
  saveContainers();guardarContenedorNube(nuevoCont);syncClientes();closeModal();renderContenedores();toastMsg('Contenedor creado ✓');updateBadge();
}

// ─── EDICIÓN RÁPIDA DE CONTENEDOR (+ lectura de albarán por foto) ──
let erOcrPendiente=null; // datos leídos por OCR aún sin aplicar a un nº de contenedor concreto
function editarRapidoModal(){
  erOcrPendiente=null;
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">✏️ Editar contenedor</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="form-row">
      <label>Número de contenedor</label>
      <input id="er-num" list="dl-er-cont" placeholder="Escribe o elige el número…" autocomplete="off">
      <datalist id="dl-er-cont">${containers.slice().sort((a,b)=>numKeyCont(a.num)-numKeyCont(b.num)||String(a.num).localeCompare(String(b.num))).map(c=>`<option value="${c.num}">${c.cliente||''}</option>`).join('')}</datalist>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-primary" style="flex:1" data-action="er-buscar">Continuar</button>
      <button class="btn btn-secondary" data-action="er-foto-albaran-buscar">📷 Leer albarán</button>
      <button class="btn btn-secondary btn-sm" data-action="gemini-key" title="Ver/cambiar la clave de la API de Gemini">🔑</button>
    </div>
    <div id="er-buscar-status" style="font-size:12px;color:var(--muted);margin-top:8px"></div>`;
  document.getElementById('modal-overlay').classList.add('open');
  const inp=document.getElementById('er-num');
  inp.focus();
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter') erBuscar(); });
}
function erBuscar(){
  const val=(document.getElementById('er-num')?.value||'').trim();
  if(!val){toastMsg('Escribe un número de contenedor');return;}
  let c=getContainer(val);
  if(!c){
    const cl=val.toLowerCase();
    const candidatos=containers.filter(x=>(x.cliente||'').toLowerCase().includes(cl));
    if(candidatos.length===1) c=candidatos[0];
  }
  if(!c){toastMsg('No se ha encontrado ese contenedor');return;}
  editarRapidoForm(c.num,erOcrPendiente);
  erOcrPendiente=null;
}
function editarRapidoForm(num,ocrInfo){
  const c=getContainer(num); if(!c){toastMsg('Contenedor no encontrado');return;}
  const o=ocrInfo||{};
  const cliente=o.cliente||c.cliente||'';
  const direccion=o.direccion||c.direccion||'';
  const telefono=o.telefono||c.telefono||'';
  const tipo=o.tipo||c.tipo||'MEZCLA';
  const aCuenta=o.aCuenta||c.aCuenta||'';
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">✏️ Editar #${c.num}</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    ${ocrInfo?'<div style="font-size:12px;color:var(--accent);margin-bottom:6px">✓ Datos rellenados desde el albarán leído — revísalos antes de guardar</div>':''}
    <div class="form-row"><label>Cliente</label><input id="er-cliente" list="dl-global-clientes" value="${cliente}"></div>
    <div class="form-row"><label>Calle / Ubicación</label><input id="er-dir" list="dl-global-direcciones" value="${direccion}"></div>
    <div class="form-row cols2">
      <div><label>Teléfono</label><input id="er-tel" list="dl-global-telefonos" type="tel" value="${telefono}"></div>
      <div><label>Tipo residuo</label><select id="er-tipo">${TIPOS_RESIDUO.map(t=>`<option${tipo===t?' selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="form-row"><label>A cuenta (si tiene)</label><input id="er-acuenta" placeholder="ej: 50€ pendiente" value="${aCuenta}"></div>
    <div class="form-row"><label>Notas</label><textarea id="er-notas" rows="2">${c.notas||''}</textarea></div>
    <div style="font-size:11px;color:var(--muted);margin-top:2px">Última visita: ${fmtDate(c.fecha)} · al pulsar Listo se actualizará a hoy</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" data-action="er-foto-albaran" data-param="${c.num}">📷 Leer albarán</button>
      <button class="btn btn-secondary btn-sm" data-action="gemini-key" title="Ver/cambiar la clave de la API de Gemini">🔑</button>
      <button class="btn btn-primary" style="flex:1" data-action="er-listo" data-param="${c.num}">✅ Listo</button>
    </div>
    <div id="er-ocr-status" style="font-size:12px;color:var(--muted);margin-top:8px"></div>`;
  // Autocompleta Dirección/Teléfono/Tipo residuo con lo que ya haya guardado de ese cliente en
  // cualquier parte de la app — igual que en openContainerModal(), ver datosClientePorNombre.
  // Esta es la "Edición rápida" (accesible desde el botón ✏️ Editar de la barra superior), un
  // formulario distinto del de abrir un contenedor directamente desde el listado — hay que
  // tenerlo aquí también, no basta con tenerlo solo en el otro.
  function autocompletarClienteEr(e){
    // NAVE GARVI/GRANJA TORRELLANO: ver autocompletarClienteCont en openContainerModal().
    if(esClienteInterno(e.target.value)){
      ['er-dir','er-tel','er-acuenta','er-notas'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
      return;
    }
    const datos=datosClientePorNombre(e.target.value,c.num);
    if(!datos) return;
    if(datos.direccion){const el=document.getElementById('er-dir');if(el)el.value=datos.direccion;}
    if(datos.telefono){const el=document.getElementById('er-tel');if(el)el.value=datos.telefono;}
    if(datos.tipo){const el=document.getElementById('er-tipo');if(el)el.value=datos.tipo;}
  }
  const erClienteEl=document.getElementById('er-cliente');
  if(erClienteEl) ['input','change','blur'].forEach(ev=>erClienteEl.addEventListener(ev,autocompletarClienteEr));
  if(cliente){
    const datosInit=datosClientePorNombre(cliente,c.num);
    if(datosInit){
      const dirEl=document.getElementById('er-dir');
      if(dirEl&&!dirEl.value&&datosInit.direccion) dirEl.value=datosInit.direccion;
      const telEl=document.getElementById('er-tel');
      if(telEl&&!telEl.value&&datosInit.telefono) telEl.value=datosInit.telefono;
    }
  }
  document.getElementById('modal-overlay').classList.add('open');
}
function erGuardar(num){
  const c=getContainer(num); if(!c) return;
  const cliente=document.getElementById('er-cliente').value.trim();
  if(prevaleceEspecialHoy(c,cliente)){
    toastMsg(`Hoy ya se puso en ${c.cliente} — prevalece, no se puede reasignar a otro cliente el mismo día`,4500);
    closeModal();
    return;
  }
  const antes=snapshotContenedor(c);
  if(cliente) c.cliente=cliente;
  c.direccion=document.getElementById('er-dir').value.trim();
  c.telefono=document.getElementById('er-tel').value.trim();
  c.tipo=document.getElementById('er-tipo').value;
  c.aCuenta=document.getElementById('er-acuenta').value.trim();
  c.notas=document.getElementById('er-notas').value.trim();
  c.fecha=todayISO();
  registrarHistorialContenedor(c,antes);
  saveContainers();guardarContenedorNube(c);syncClientes();closeModal();renderContenedores();toastMsg(`Contenedor #${c.num} actualizado ✓ (${fmtDate(c.fecha)})`);updateBadge();
}
// Carga perezosa de Tesseract.js (OCR) solo cuando se usa por primera vez
let tesseractLoadPromise=null;
function loadTesseract(){
  if(window.Tesseract) return Promise.resolve();
  if(tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/7.0.0/tesseract.min.js';
    s.onload=()=>resolve();
    s.onerror=()=>{tesseractLoadPromise=null;reject(new Error('No se pudo cargar el lector OCR'));};
    document.head.appendChild(s);
  });
  return tesseractLoadPromise;
}
// Interpreta el texto reconocido de un albarán y extrae los campos que nos interesan.
// Es una lectura "a mejor esfuerzo": el usuario siempre revisa/corrige los campos antes de guardar.
// Las etiquetas cubren tanto un albarán "genérico" como el formulario real de Garvi
// (CLIENTE/CARGADOR, LUGAR, POBLACIÓN, LLEVADA nº, RETIRADA nº, CONDUCTOR...).
function parseAlbaranOCR(texto){
  const norm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const lineas=(texto||'').split('\n').map(l=>l.trim()).filter(Boolean);
  const info={};
  // Separadores típicos entre una etiqueta impresa y el valor manuscrito: espacios, ":" "." "/"
  // "-" "_" (la línea de puntos/subrayado del formulario suele leerse como guiones bajos).
  const limpiarSeparadores=s=>s.replace(/^[\s:./_\-–]+/,'');
  // Otras etiquetas del formulario que pueden venir pegadas justo después de la que buscamos
  // (p.ej. "CLIENTE / CARGADOR FATUM" → al buscar "cliente" nos deja "/ CARGADOR FATUM";
  // hay que saltarse también "cargador" para quedarnos solo con "FATUM").
  const ETIQUETAS_FORM=['cliente','cargador','nombre','lugar','direccion','ubicacion','domicilio','poblacion','conductor','destinatario','observaciones','hora','dni','precio','fecha','tel','telefono'];
  // Si más adelante en la misma línea aparece OTRA etiqueta del formulario, cortamos ahí: varios
  // campos pueden venir seguidos en la misma fila (p.ej. "POBLACIÓN ALICANTE CONDUCTOR ALEJANDRO").
  // norm() no cambia la longitud de los acentos habituales, así que el índice sirve también
  // sobre la cadena original.
  const cortarEnSiguienteEtiqueta=s=>{
    const plano=norm(s);
    let corte=-1;
    for(const et of ETIQUETAS_FORM){
      const idx=plano.indexOf(et);
      if(idx>0&&(corte===-1||idx<corte)) corte=idx;
    }
    return corte===-1?s:s.slice(0,corte);
  };
  const buscarCampo=(patrones)=>{
    for(const l of lineas){
      const nl=norm(l);
      for(const p of patrones){
        const idx=nl.indexOf(p);
        if(idx===-1) continue;
        let resto=limpiarSeparadores(l.slice(idx+p.length));
        for(let i=0;i<3;i++){ // hasta 3 etiquetas pegadas seguidas, por si acaso
          const nresto=norm(resto);
          const etq=ETIQUETAS_FORM.find(et=>nresto.startsWith(et));
          if(!etq) break;
          resto=limpiarSeparadores(resto.slice(etq.length));
        }
        resto=cortarEnSiguienteEtiqueta(resto).trim();
        if(resto) return resto;
      }
    }
    return '';
  };
  info.cliente=buscarCampo(['cliente','cargador','nombre','sr.','sra.','a nombre de']);
  const lugar=buscarCampo(['lugar']);
  const direccionGenerica=buscarCampo(['direccion','direcc','calle','ubicacion','domicilio']);
  const poblacion=buscarCampo(['poblacion']);
  info.direccion=[lugar||direccionGenerica,poblacion].filter(Boolean).join(', ');
  info.aCuenta=buscarCampo(['a cuenta','pendiente','saldo','resto a pagar','deuda']);
  // Nº de contenedor: primero "Llevada nº" (el que se está dejando, el más relevante al editar),
  // si no "Retirada nº", si no el genérico "contenedor nº". Se admite cualquier cantidad de
  // espacios/puntos/guiones (incluida la raya de puntos suspensivos del formulario) entre la
  // etiqueta y el número.
  const SEP='[\\s:._\\-–]*';
  const llevadaM=(texto||'').match(new RegExp('llevada'+SEP+'n?[ºo°]?'+SEP+'(\\d+[a-z]?)','i'));
  const retiradaM=(texto||'').match(new RegExp('retirada'+SEP+'n?[ºo°]?'+SEP+'(\\d+[a-z]?)','i'));
  const numContM=(texto||'').match(new RegExp('cont(?:enedor)?'+SEP+'n?[ºo°]?'+SEP+'(\\w+)','i'));
  info.numCont=(llevadaM&&llevadaM[1])||(retiradaM&&retiradaM[1])||(numContM&&numContM[1])||'';
  const telM=(texto||'').match(/\b(6\d{2}|7[1-9]\d|9\d{2})[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{0,2}\b/);
  if(telM) info.telefono=telM[0].replace(/[\s.-]/g,'');
  const tNorm=norm(texto);
  const tipoEncontrado=TIPOS_RESIDUO.find(t=>tNorm.includes(norm(t)));
  if(tipoEncontrado) info.tipo=tipoEncontrado;
  if(!info.cliente){
    const candidata=lineas.find(l=>l.length>4 && !/\d{4,}/.test(l));
    if(candidata) info.cliente=candidata;
  }
  return info;
}
// Carga un File como <img> ya decodificado
function cargarImagenFile(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>resolve({img,url});
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo abrir la imagen'));};
    img.src=url;
  });
}
// Dibuja la imagen rotada `deg` grados (0/90/180/270) en un canvas nuevo. Si `binarizar` es
// true, además pasa la imagen a blanco/negro puro (umbral de brillo) para intentar "borrar" la
// marca de agua/logo gris de fondo — mejora la lectura en algunas fotos, pero en otras (con
// sombras o poca luz) puede empeorarla, así que se prueba como alternativa y no siempre.
function rotarImagenCanvas(img,deg,binarizar){
  const sw=img.naturalWidth||img.width, sh=img.naturalHeight||img.height;
  const swap=deg===90||deg===270;
  const cnv=document.createElement('canvas');
  cnv.width=swap?sh:sw; cnv.height=swap?sw:sh;
  const ctx=cnv.getContext('2d');
  ctx.translate(cnv.width/2,cnv.height/2);
  ctx.rotate(deg*Math.PI/180);
  ctx.drawImage(img,-sw/2,-sh/2);
  if(binarizar){
    try{
      const id=ctx.getImageData(0,0,cnv.width,cnv.height);
      const px=id.data;
      const UMBRAL=175;
      for(let i=0;i<px.length;i+=4){
        const lum=0.299*px[i]+0.587*px[i+1]+0.114*px[i+2];
        const v=lum<UMBRAL?0:255;
        px[i]=px[i+1]=px[i+2]=v;
      }
      ctx.putImageData(id,0,0);
    }catch(e){ console.error('No se pudo preprocesar la imagen para OCR:',e); }
  }
  return cnv;
}
// Un único worker de Tesseract reutilizado para todas las lecturas: la función suelta
// Tesseract.recognize(...) crea, carga y destruye un worker nuevo CADA VEZ (está además
// marcada como obsoleta por la propia librería), lo que en un albarán con varios intentos
// significaba re-descargar/re-inicializar el motor cada vez — lento y poco fiable en móvil.
// Con un worker fijo, cada intento es casi inmediato. Se configura en modo "texto disperso"
// (PSM 11), mejor que el modo automático para formularios con casillas/líneas/marca de agua,
// donde el modo automático confunde la estructura y mezcla campos entre sí.
let tesseractWorkerPromise=null;
function getTesseractWorker(){
  if(!tesseractWorkerPromise){
    tesseractWorkerPromise=Tesseract.createWorker('spa')
      .then(async w=>{ await w.setParameters({tessedit_pageseg_mode:'11'}); return w; })
      .catch(e=>{ tesseractWorkerPromise=null; throw e; });
  }
  return tesseractWorkerPromise;
}
// Lee el albarán probando varias combinaciones de giro/preprocesado y se queda con la mejor.
// Muchas fotos de móvil quedan "tumbadas" (apaisadas) y hace falta girarlas; además se prueba
// con y sin pasar a blanco/negro, porque según la luz de la foto ayuda o, a veces, estorba.
async function ocrMejorRotacion(file,onIntento){
  const {img,url}=await cargarImagenFile(file);
  try{
    const worker=await getTesseractWorker();
    const intentos=[{deg:0,bin:false},{deg:0,bin:true},{deg:90,bin:false},{deg:270,bin:false},{deg:180,bin:false}];
    let mejor=null;
    for(const {deg,bin} of intentos){
      if(onIntento) onIntento(deg);
      const fuente=rotarImagenCanvas(img,deg,bin);
      const {data}=await worker.recognize(fuente);
      const conf=data.confidence||0;
      const len=(data.text||'').replace(/\s+/g,'').length;
      console.log(`[OCR] giro ${deg}°${bin?' (b/n)':''} → confianza ${conf} · ${len} caracteres`,data.text);
      if(!mejor||conf>mejor.conf||(conf===mejor.conf&&len>mejor.len)) mejor={data,conf,len};
      if(conf>=65&&len>25) break; // ya se ha leído bien, no hace falta seguir probando
    }
    return mejor.data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── LECTURA DE ALBARANES CON GEMINI 1.5 FLASH (IA con visión, gratis) ─────
// Lee la foto directamente con un modelo de IA (Gemini, de Google), que interpreta letra
// manuscrita muchísimo mejor que un OCR clásico como Tesseract. La capa gratuita de Google AI
// Studio permite hasta 1.500 fotos al día sin coste. Hace falta una clave de API (se pide la
// primera vez con pedirGeminiApiKey) que se guarda SOLO en este dispositivo (localStorage) —
// nunca se sube al código ni a la nube.
function getGeminiApiKey(){ return (localStorage.getItem('garvi_gemini_api_key')||'').trim(); }
function setGeminiApiKey(k){ localStorage.setItem('garvi_gemini_api_key',(k||'').trim()); }
function pedirGeminiApiKey(){
  const k=window.prompt(
    'Pega aquí tu clave gratuita de la API de Gemini (se consigue en aistudio.google.com → "Get API key").\n\n'+
    'Se guarda solo en este dispositivo — no se sube a ningún sitio ni se comparte.',
    getGeminiApiKey()
  );
  if(k===null) return ''; // cancelado
  setGeminiApiKey(k);
  return getGeminiApiKey();
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');
    reader.onerror=()=>reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
const GEMINI_PROMPT_ALBARAN=`Analiza este albarán de transporte de contenedores con texto manuscrito y extrae los datos en formato JSON con la siguiente estructura:
{
  "numero_ticket": "string (ej. 7478)",
  "llevada": "string",
  "retirada": "string",
  "fecha": "string",
  "cliente": "string",
  "lugar": "string",
  "poblacion": "string",
  "conductor": "string",
  "observaciones": "string",
  "dni": "string",
  "hora": "string"
}`;
async function leerAlbaranConGemini(file){
  const apiKey=getGeminiApiKey();
  if(!apiKey) throw new Error('Sin clave de Gemini configurada');
  const base64=await fileToBase64(file);
  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body={
    contents:[{parts:[
      {text:GEMINI_PROMPT_ALBARAN},
      {inline_data:{mime_type:file.type||'image/jpeg',data:base64}}
    ]}],
    generationConfig:{response_mime_type:'application/json'}
  };
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(res.status===400||res.status===403) setGeminiApiKey(''); // clave probablemente inválida: se pedirá de nuevo
  if(!res.ok){
    const errTxt=await res.text().catch(()=>'');
    throw new Error(`Gemini respondió ${res.status}${errTxt?': '+errTxt.slice(0,180):''}`);
  }
  const data=await res.json();
  const textoJson=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0]&&data.candidates[0].content.parts[0].text;
  if(!textoJson) throw new Error('Gemini no ha devuelto datos legibles (puede que haya rechazado la imagen)');
  return JSON.parse(textoJson);
}
// Convierte el JSON de Gemini al mismo formato "info" que ya usan los formularios de edición
function mapGeminiAInfo(g){
  const limpia=v=>(v&&typeof v==='string'&&v.trim()&&!/^(no visible|no legible|desconocid|n\/a|null|undefined)/i.test(v.trim()))?v.trim():'';
  return {
    cliente:limpia(g.cliente),
    direccion:[limpia(g.lugar),limpia(g.poblacion)].filter(Boolean).join(', '),
    numCont:limpia(g.llevada)||limpia(g.retirada)||limpia(g.numero_ticket),
  };
}
// Lee el albarán con Gemini (mucho mejor con letra manuscrita); si falla por cualquier motivo
// (sin clave, sin conexión, cuota agotada...) cae automáticamente al lector local (Tesseract),
// para no dejar al usuario sin nada.
async function leerAlbaranInteligente(file,onEstado){
  let apiKey=getGeminiApiKey();
  if(!apiKey) apiKey=pedirGeminiApiKey();
  let geminiError='';
  if(apiKey){
    try{
      if(onEstado) onEstado('🔎 Leyendo albarán con IA (Gemini)…');
      const g=await leerAlbaranConGemini(file);
      return {info:mapGeminiAInfo(g),texto:JSON.stringify(g,null,2),motor:'gemini'};
    }catch(e){
      console.error('Gemini falló, se prueba con el lector local:',e);
      geminiError=e.message||String(e);
      if(onEstado) onEstado(`⚠️ Gemini falló (${geminiError}), probando con el lector local…`);
    }
  }
  await loadTesseract();
  const data=await ocrMejorRotacion(file,deg=>{ if(onEstado) onEstado('🔎 Leyendo albarán'+(deg?` (probando girada ${deg}°)`:'')+'…'); });
  const texto=(geminiError?`⚠️ Gemini falló: ${geminiError}\n\n`:'')+(data.text||'');
  return {info:parseAlbaranOCR(data.text||''),texto,motor:'tesseract',geminiError};
}

// Foto de albarán estando ya sobre un contenedor concreto: rellena sus campos
// (sin "capture" para que el móvil ofrezca elegir también desde la galería, no solo la cámara)
function erFotoAlbaran(num){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async()=>{
    const file=inp.files[0]; if(!file) return;
    const statusEl=document.getElementById('er-ocr-status');
    if(statusEl) statusEl.textContent='⏳ Leyendo…';
    try{
      const {info,texto,motor}=await leerAlbaranInteligente(file,txt=>{ if(statusEl) statusEl.textContent=txt; });
      if(info.cliente) document.getElementById('er-cliente').value=info.cliente;
      if(info.direccion) document.getElementById('er-dir').value=info.direccion;
      if(info.telefono) document.getElementById('er-tel').value=info.telefono;
      if(info.tipo) document.getElementById('er-tipo').value=info.tipo;
      if(info.aCuenta) document.getElementById('er-acuenta').value=info.aCuenta;
      if(statusEl) statusEl.innerHTML=`✓ Datos rellenados ${motor==='gemini'?'con IA (Gemini)':'con el lector local'} — revísalos antes de pulsar Listo.`
        +`<details style="margin-top:6px"><summary style="cursor:pointer">Ver lo que se ha leído</summary>`
        +`<pre style="white-space:pre-wrap;font-size:10px;background:var(--surface2);padding:6px;border-radius:6px;margin-top:4px;max-height:160px;overflow:auto">${(texto||'(nada legible)').replace(/</g,'&lt;')}</pre></details>`;
      toastMsg('Albarán leído — revisa los datos');
    }catch(e){
      console.error('Error leyendo albarán:',e);
      if(statusEl) statusEl.textContent=`✗ No se pudo leer el albarán (${e&&e.message||e}), escribe los datos a mano.`;
      toastMsg('No se pudo leer la foto');
    }
  };
  inp.click();
}
// Foto de albarán antes de elegir contenedor: intenta identificar cuál es a partir de lo leído
// (sin "capture" para que el móvil ofrezca elegir también desde la galería, no solo la cámara)
function erFotoAlbaranBuscar(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async()=>{
    const file=inp.files[0]; if(!file) return;
    const statusEl=document.getElementById('er-buscar-status');
    if(statusEl) statusEl.textContent='⏳ Leyendo…';
    try{
      const {info,texto,motor}=await leerAlbaranInteligente(file,txt=>{ if(statusEl) statusEl.textContent=txt; });
      let match=null;
      if(info.numCont) match=getContainer(info.numCont);
      if(!match&&info.cliente){
        const cl=info.cliente.toLowerCase();
        const candidatos=containers.filter(c=>(c.cliente||'').toLowerCase().includes(cl)||cl.includes((c.cliente||'').toLowerCase()));
        if(candidatos.length===1) match=candidatos[0];
      }
      if(match){
        toastMsg(`Albarán identificado: contenedor #${match.num} (${motor==='gemini'?'IA':'lector local'})`);
        editarRapidoForm(match.num,info);
      } else {
        erOcrPendiente=info;
        if(statusEl) statusEl.innerHTML=`No se ha podido identificar el contenedor automáticamente (${motor==='gemini'?'IA':'lector local'}). Escribe el número arriba y pulsa Continuar; los datos leídos se rellenarán igual.`
          +`<details style="margin-top:6px"><summary style="cursor:pointer">Ver lo que se ha leído (para depurar)</summary>`
          +`<pre style="white-space:pre-wrap;font-size:10px;background:var(--surface2);padding:6px;border-radius:6px;margin-top:4px;max-height:160px;overflow:auto">${(texto||'(nada legible)').replace(/</g,'&lt;')}</pre></details>`;
        toastMsg('No identificado — escribe el número a mano');
      }
    }catch(e){
      console.error('Error leyendo albarán:',e);
      if(statusEl) statusEl.textContent=`✗ No se pudo leer el albarán (${e&&e.message||e}), escribe los datos a mano.`;
      toastMsg('No se pudo leer la foto');
    }
  };
  inp.click();
}

