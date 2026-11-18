// ─── EXPORT PDF GENÉRICO (listas) ──────────────────────────────────
function pdfListGenerico(titulo,headers,rows,filename){
  if(!rows.length){toastMsg('No hay datos para exportar');return;}
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210;
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',10,8,16,16);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',29,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche (Alicante) · CIF: B54970439',29,21);
  doc.setTextColor(240,180,41); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text(titulo.toUpperCase(),196,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Fecha: '+fmtDate(todayISO()),196,26,{align:'right'});
  doc.setDrawColor(200,212,227); doc.line(14,32,196,32);
  let cy=40;
  const colW=182/headers.length;
  const printHeader=()=>{
    doc.setFillColor(15,32,68); doc.rect(14,cy-5,182,7,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    headers.forEach((h,i)=>doc.text(h,16+colW*i,cy));
    cy+=7;
  };
  printHeader();
  doc.setFont('helvetica','normal');
  rows.forEach((r,idx)=>{
    if(cy>270){doc.addPage();cy=20;printHeader();}
    if(idx%2===0){doc.setFillColor(240,244,248);doc.rect(14,cy-4,182,7,'F');}
    doc.setTextColor(15,32,68); doc.setFontSize(8);
    r.forEach((v,i)=>doc.text(String(v??''),16+colW*i,cy,{maxWidth:colW-2}));
    cy+=7;
  });
  doc.setFillColor(240,180,41); doc.rect(0,292,W,5,'F');
  doc.save(filename);
}

// ─── FINANZAS ─────────────────────────────────────────────────────
let finTab='ingresos', finQ='';
function renderFinanzas(){
  const sec=document.getElementById('sec-finanzas');
  const ing=finanzas.filter(f=>f.tipo==='ingreso');
  const gas=finanzas.filter(f=>f.tipo==='gasto');
  const totalIng=ing.reduce((s,f)=>s+f.importe,0);
  const totalGas=gas.reduce((s,f)=>s+f.importe,0);
  const bal=totalIng-totalGas;
  const q=finQ.toLowerCase();
  const filtList=finanzas.filter(f=>f.tipo===finTab).filter(f=>!q||(f.concepto||'').toLowerCase().includes(q)||(f.categoria||'').toLowerCase().includes(q));
  const list=[...filtList].reverse().map(f=>`
    <div class="card" style="display:flex;align-items:center;gap:12px">
      <div style="flex:1;min-width:0;overflow-wrap:break-word">
        <div style="font-weight:600;font-size:14px">${f.concepto}</div>
        <div style="font-size:12px;color:var(--muted)">${fmtDate(f.fecha)} ${f.categoria?'· '+f.categoria:''}</div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-weight:700;color:${f.tipo==='ingreso'?'#4ade80':'#f87171'}">${f.tipo==='ingreso'?'+':'-'}${fmtMoney(f.importe)}</div>
      <button class="btn btn-danger btn-sm btn-icon" data-action="del-fin" data-param="${f.id}">🗑</button>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-title">Finanzas</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="pdf-finanzas">📄 Crear PDF</button>
          <button class="btn btn-primary btn-sm" data-action="nuevo-fin">+ Añadir</button>
        </div>
      </div>
      <div class="fin-summary">
        <div class="fin-sum-card"><div class="fin-sum-val" style="color:#4ade80">${fmtMoney(totalIng)}</div><div class="fin-sum-label">Ingresos</div></div>
        <div class="fin-sum-card"><div class="fin-sum-val" style="color:#f87171">${fmtMoney(totalGas)}</div><div class="fin-sum-label">Gastos</div></div>
        <div class="fin-sum-card"><div class="fin-sum-val" style="color:${bal>=0?'#4ade80':'#f87171'}">${fmtMoney(bal)}</div><div class="fin-sum-label">Balance</div></div>
      </div>
      <div class="fact-toggle" style="max-width:250px">
        <button class="fact-toggle-btn ${finTab==='ingreso'?'active':''}" data-action="fin-tab" data-param="ingreso">Ingresos</button>
        <button class="fact-toggle-btn ${finTab==='gasto'?'active':''}" data-action="fin-tab" data-param="gasto">Gastos</button>
      </div>
      <input id="fin-search" placeholder="Buscar por concepto o categoría…" value="${finQ}" style="margin-top:10px">
    </div>
    ${list||'<div class="empty-state"><div class="icon">💰</div>Sin registros</div>'}`;
  document.getElementById('fin-search').addEventListener('input',e=>{finQ=e.target.value;reFocusInput('fin-search',renderFinanzas);});
}
function nuevoFinModal(){
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Nuevo movimiento</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="fact-toggle" style="margin-bottom:14px">
      <button class="fact-toggle-btn active" id="ft-ing" data-action="fin-modal-tab" data-param="ingreso">Ingreso</button>
      <button class="fact-toggle-btn" id="ft-gas" data-action="fin-modal-tab" data-param="gasto">Gasto</button>
    </div>
    <input type="hidden" id="fin-tipo" value="ingreso">
    <div class="form-row"><label>Concepto</label><input id="fin-conc" placeholder="Descripción…"></div>
    <div class="form-row cols2">
      <div><label>Importe (€)</label><input id="fin-imp" type="number" step="0.01" min="0"></div>
      <div><label>Fecha</label><input id="fin-fecha" type="date" value="${todayISO()}"></div>
    </div>
    <div class="form-row"><label>Categoría</label><select id="fin-cat"><option>Servicio</option><option>Transporte</option><option>Combustible</option><option>Mantenimiento</option><option>Personal</option><option>Material</option><option>Otros</option></select></div>
    <button class="btn btn-primary btn-full" style="margin-top:8px" data-action="crear-fin">Guardar</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function crearFin(){
  const conc=(document.getElementById('fin-conc').value||'').trim();
  const imp=parseFloat(document.getElementById('fin-imp').value)||0;
  if(!conc||imp<=0){toastMsg('Rellena todos los campos');return;}
  const nuevoFin={id:Date.now().toString(),tipo:document.getElementById('fin-tipo').value,concepto:conc,importe:imp,fecha:document.getElementById('fin-fecha').value,categoria:document.getElementById('fin-cat').value};
  finanzas.push(nuevoFin);
  saveFinanzas();syncFinanzasCol.guardar(nuevoFin);closeModal();renderFinanzas();toastMsg('Guardado ✓');
}
function pdfFinanzas(){
  const q=finQ.toLowerCase();
  const rows=finanzas.filter(f=>f.tipo===finTab).filter(f=>!q||(f.concepto||'').toLowerCase().includes(q)||(f.categoria||'').toLowerCase().includes(q))
    .map(f=>[fmtDate(f.fecha),f.concepto||'',f.categoria||'',(f.tipo==='ingreso'?'+':'-')+fmtMoney(f.importe)]);
  pdfListGenerico(finTab==='ingreso'?'Ingresos':'Gastos',['Fecha','Concepto','Categoría','Importe'],rows,'finanzas-garvi.pdf');
}

// ─── CLIENTES ─────────────────────────────────────────────────────
let clienteQ='';
function renderClientes(){
  const sec=document.getElementById('sec-clientes');
  syncClientes();
  const list=clientes.filter(c=>!clienteQ||(c.nombre||'').toLowerCase().includes(clienteQ.toLowerCase())||(c.telefono||'').includes(clienteQ));
  const rows=list.map(c=>`
    <div class="cliente-item" data-action="ver-cliente" data-param="${c.id}">
      <div class="cliente-nombre">${c.nombre}</div>
      <div class="cliente-meta">
        ${c.telefono?`<span>📞 <a href="tel:${c.telefono}" style="color:var(--accent)">${c.telefono}</a></span>`:''}
        <span>📦 ${c.contenedores.length} contenedores</span>
        ${c.fechaUltimoServicio?`<span>🗓 ${fmtDate(c.fechaUltimoServicio)}</span>`:''}
      </div>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title">Clientes (${clientes.length})</div>
        <button class="btn btn-secondary btn-sm" data-action="pdf-clientes">📄 Crear PDF</button>
      </div>
      <input class="search-input" id="cl-search" type="search" placeholder="Buscar nombre o teléfono…" value="${clienteQ}">
    </div>
    ${rows||'<div class="empty-state"><div class="icon">👥</div>Sin clientes</div>'}`;
  document.getElementById('cl-search').addEventListener('input',e=>{clienteQ=e.target.value;reFocusInput('cl-search',renderClientes);});
}
function verClienteModal(id){
  const c=clientes.find(x=>x.id===id); if(!c) return;
  const conts=c.contenedores.map(num=>{const ct=getContainer(num);return ct?`<div class="cont-row" style="margin-bottom:4px" data-action="open-cont" data-param="${num}"><div class="cont-num s-${ct.estadoExcel}">${num}</div><div class="cont-info"><div class="cont-cliente">${ct.direccion||'—'}</div><div class="cont-detail">${ct.tipo||''} · ${fmtDate(ct.fecha)}</div></div>${daysBadge(daysSince(ct.fecha),ct.fecha)}</div>`:''}).join('');
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">${c.nombre}</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
      ${c.telefono?`<a href="tel:${c.telefono}" class="btn btn-secondary">📞 ${c.telefono}</a><a href="https://wa.me/34${c.telefono}" target="_blank" class="btn btn-secondary">${ICO_WA} WhatsApp</a>`:''}
      <button class="btn btn-primary" data-action="nueva-factura-cl" data-param="${c.nombre}">🧾 Factura</button>
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Datos de facturación</div>
    <div class="form-row"><label>Dirección de facturación</label><input id="cl-extra-dir" value="${c.dirFacturacion||''}" placeholder="Calle, nº, ciudad…"></div>
    <div class="form-row"><label>CIF / NIF fiscal</label><input id="cl-extra-cif" value="${c.cif||''}" placeholder="B-XXXXXXXX"></div>
    <button class="btn btn-secondary btn-sm" data-action="guardar-cliente-extra" data-param="${c.id}" style="margin-bottom:14px">Guardar datos facturación</button>
    <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Conceptos guardados (precio propio de este cliente)</div>
    <div style="margin-bottom:8px">${(c.conceptos||[]).map((co,i)=>`<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><span style="flex:1;font-size:13px">${co.desc}</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent-blue);white-space:nowrap">${fmtMoney(co.precio)}</span><button class="btn btn-danger btn-sm btn-icon" data-action="del-concepto-cliente" data-param="${c.id}" data-idx="${i}" style="width:26px;height:26px;font-size:11px">✕</button></div>`).join('')||'<div style="font-size:12px;color:var(--muted)">Sin conceptos guardados</div>'}</div>
    <div class="form-row cols2">
      <div><label>Concepto</label><input id="cl-nuevo-concepto-desc" placeholder="Nombre de obra, código…"></div>
      <div><label>Precio</label><input id="cl-nuevo-concepto-precio" type="number" step="0.01" placeholder="0,00"></div>
    </div>
    <button class="btn btn-secondary btn-sm" data-action="add-concepto-cliente-modal" data-param="${c.id}" style="margin-bottom:14px">+ Añadir concepto</button>
    <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Contenedores (${c.contenedores.length})</div>
    ${conts||'<div class="empty-state" style="padding:12px">Sin contenedores</div>'}`;
  document.getElementById('modal-overlay').classList.add('open');
}
// Conceptos guardados por cliente: línea con su propio concepto (obra, código…) y precio,
// distinto de los "Conceptos rápidos" genéricos — para clientes con facturación recurrente a un
// precio pactado aparte. Se guardan en garvi_clientes_extra (igual que NIF/dirección), así que
// funcionan también para clientes sin ningún contenedor registrado.
function addConceptoClienteModal(id){
  const c=clientes.find(x=>x.id===id); if(!c) return;
  const desc=(document.getElementById('cl-nuevo-concepto-desc').value||'').trim();
  const precio=Number(document.getElementById('cl-nuevo-concepto-precio').value)||0;
  if(!desc){toastMsg('Indica el concepto');return;}
  const conceptos=[...(getClienteExtra(c.nombre).conceptos||[]),{desc,precio,iva:21}];
  saveClienteExtra(c.nombre,{conceptos});
  syncClientes();
  toastMsg('Concepto guardado ✓');
  verClienteModal(id);
}
function delConceptoCliente(id,idx){
  const c=clientes.find(x=>x.id===id); if(!c) return;
  const conceptos=(getClienteExtra(c.nombre).conceptos||[]).filter((_,i)=>i!==idx);
  saveClienteExtra(c.nombre,{conceptos});
  syncClientes();
  verClienteModal(id);
}
// Añade a la factura/proforma en curso uno de los conceptos guardados de ese cliente (ver
// renderClienteConceptos, llamado desde nuevaFacturaModal al elegir cliente).
function addConceptoCliente(nombre,idx){
  const co=(getClienteExtraAprox(nombre).conceptos||[])[idx]; if(!co) return;
  factLineas.push({desc:co.desc,qty:1,precio:co.precio,iva:co.iva||21});
  renderLineas(); saveFacturaDraft();
}
function renderClienteConceptos(nombre){
  const wrap=document.getElementById('cliente-conceptos-wrap');
  if(!wrap) return;
  const conceptos=nombre?(getClienteExtraAprox(nombre).conceptos||[]):[];
  if(!conceptos.length){ wrap.innerHTML=''; return; }
  wrap.innerHTML=`
    <div style="font-size:11px;color:var(--muted);font-weight:700;letter-spacing:.05em;margin:10px 0 8px">CONCEPTOS GUARDADOS DE ${nombre.toUpperCase()}</div>
    <div class="quick-btns">${conceptos.map((co,i)=>`<button class="btn btn-secondary btn-sm" data-action="add-concepto-cliente" data-cliente="${nombre}" data-idx="${i}">${co.desc} · ${fmtMoney(co.precio)}</button>`).join('')}</div>`;
}
function pdfClientes(){
  const list=clientes.filter(c=>!clienteQ||(c.nombre||'').toLowerCase().includes(clienteQ.toLowerCase())||(c.telefono||'').includes(clienteQ));
  const rows=list.map(c=>[c.nombre||'',c.telefono||'',c.dirFacturacion||c.direccion||'',String(c.contenedores.length)]);
  pdfListGenerico('Clientes',['Nombre','Teléfono','Dirección','Contenedores'],rows,'clientes-garvi.pdf');
}

// ─── TAREAS ───────────────────────────────────────────────────────
let tareasFilter='pendientes', tareasQ='';
let presItems=[],presCliente='',presDireccion='',presFecha=todayISO(),presPrices=[],presQ='';
// Tipo de documento de salida del presupuesto: 'presupuesto' o 'carta' (carta de compromiso
// de suministro/colaboración — mismo texto de conceptos y precios, saludo/cuerpo distintos y
// sin destinatario concreto). Comparten los mismos datos (obra, fecha, conceptos) — cambiar de
// tipo NUNCA toca presItems/presDireccion/presFecha, solo la vista.
let presDocType='presupuesto';
function renderTareas(){
  const sec=document.getElementById('sec-tareas');
  const pend=tareas.filter(t=>!t.done).length;
  const tq=tareasQ.toLowerCase();
  const list=tareas.filter(t=>tareasFilter==='pendientes'?!t.done:tareasFilter==='done'?t.done:true)
    .filter(t=>!tq||(t.titulo||'').toLowerCase().includes(tq)||(t.contenedor||'').toLowerCase().includes(tq))
    .reverse().map(t=>`
    <div class="tarea-item">
      <div class="tarea-check ${t.done?'done':''}" data-action="toggle-tarea" data-param="${t.id}">${t.done?'✓':''}</div>
      <div class="tarea-body">
        <div class="tarea-titulo ${t.done?'done':''}">${t.titulo}</div>
        <div class="tarea-meta">${t.prioridad||'Normal'} ${t.fecha?'· '+fmtDate(t.fecha):''} ${t.contenedor?'· Cont. '+t.contenedor:''}</div>
      </div>
      <button class="btn btn-danger btn-sm btn-icon" data-action="del-tarea" data-param="${t.id}">🗑</button>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title">Tareas ${pend?`<span class="badge" style="position:static;display:inline-flex">${pend}</span>`:''}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="pdf-tareas">📄 Crear PDF</button>
          <button class="btn btn-primary btn-sm" data-action="nueva-tarea">+ Nueva</button>
        </div>
      </div>
      <div class="fact-toggle" style="max-width:280px">
        <button class="fact-toggle-btn ${tareasFilter==='pendientes'?'active':''}" data-action="tareas-filter" data-param="pendientes">Pendientes</button>
        <button class="fact-toggle-btn ${tareasFilter==='done'?'active':''}" data-action="tareas-filter" data-param="done">Hechas</button>
        <button class="fact-toggle-btn ${tareasFilter==='todas'?'active':''}" data-action="tareas-filter" data-param="todas">Todas</button>
      </div>
      <input class="search-input" id="tareas-search" type="search" placeholder="Buscar tarea o contenedor…" value="${tareasQ}" style="margin-top:8px">
    </div>
    ${list||'<div class="empty-state"><div class="icon">✅</div>Sin tareas</div>'}`;
  document.getElementById('tareas-search').addEventListener('input',e=>{tareasQ=e.target.value;reFocusInput('tareas-search',renderTareas);});
}
function nuevaTareaModal(){
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Nueva tarea</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="form-row"><label>Título</label><input id="t-titulo" placeholder="Descripción de la tarea…"></div>
    <div class="form-row cols2">
      <div><label>Prioridad</label><select id="t-prio"><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>
      <div><label>Fecha límite</label><input id="t-fecha" type="date"></div>
    </div>
    <div class="form-row"><label>Contenedor (opcional)</label><input id="t-cont" placeholder="Número de contenedor…"></div>
    <button class="btn btn-primary btn-full" style="margin-top:8px" data-action="crear-tarea">Crear tarea</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function crearTarea(){
  const titulo=(document.getElementById('t-titulo').value||'').trim();
  if(!titulo){toastMsg('Escribe el título');return;}
  const nuevaTarea={id:Date.now().toString(),titulo,prioridad:document.getElementById('t-prio').value,fecha:document.getElementById('t-fecha').value,contenedor:document.getElementById('t-cont').value.trim(),done:false,creada:new Date().toISOString()};
  tareas.push(nuevaTarea);
  saveTareas();syncTareasCol.guardar(nuevaTarea);closeModal();renderTareas();toastMsg('Tarea creada ✓');
}
function pdfTareas(){
  const tq=tareasQ.toLowerCase();
  const rows=tareas.filter(t=>tareasFilter==='pendientes'?!t.done:tareasFilter==='done'?t.done:true)
    .filter(t=>!tq||(t.titulo||'').toLowerCase().includes(tq)||(t.contenedor||'').toLowerCase().includes(tq))
    .map(t=>[t.titulo||'',t.prioridad||'Normal',t.fecha?fmtDate(t.fecha):'',t.contenedor||'',t.done?'Hecha':'Pendiente']);
  pdfListGenerico('Tareas',['Título','Prioridad','Fecha','Contenedor','Estado'],rows,'tareas-garvi.pdf');
}


// ─── PRESUPUESTOS ─────────────────────────────────────────────────
function initPresPrices(){if(!presPrices.length) presPrices=CATALOG_PRES.map(c=>c.price);}

// Despacha según el tipo de documento activo; ambos reutilizan presDireccion/presFecha/presItems.
function buildPresPreview(){
  return presDocType==='carta'?buildCartaPreview():buildPresupuestoPreview();
}
function buildPresupuestoPreview(){
  const dir=presDireccion||'________________';
  const fecha=fmtPresDate(presFecha);
  const conceptsHtml=presItems.length===0
    ?'<p style="color:#999;font-style:italic;margin:8px 0">Sin conceptos añadidos todavía.</p>'
    :`<ul class="doc-concepts-list">${presItems.map(it=>`<li>Servicio de <b>${it.name}</b>, con un importe de <b>${fmtPresPrice(it.price)} + IVA</b>.</li>`).join('')}</ul>`;
  return `<div class="doc-preview">
    <div class="doc-head">
      <div class="doc-logo-box"><img src="data:image/png;base64,${PRES_LOGO_B64}" alt="GARVI"></div>
      <div class="doc-title-right">
        <h3>PRESUPUESTO</h3>
        <p>Garvi Recycling Systems, S.L.U. · B-54970439<br>Avd. General Marvá nº 23-2 · C.P. 03005 (Alicante)</p>
      </div>
    </div>
    <div class="doc-meta-line">
      <strong>Dirección de la obra:</strong> <span id="pres-meta-dir">${dir}</span> &nbsp;&nbsp;
      <strong>Fecha:</strong> <span id="pres-meta-fecha">${fecha}</span>
    </div>
    <p style="margin:12px 0;font-size:13px;color:#333">Estimado/a cliente, en respuesta a su solicitud, desde Garvi Recycling Systems nos complace presentarle el presupuesto correspondiente a los servicios de gestión de residuos detallados a continuación para la obra indicada:</p>
    ${conceptsHtml}
    <p style="margin:12px 0;font-size:13px;color:#333">Quedamos a su entera disposición para cualquier aclaración o ampliación de este presupuesto.</p>
    <div class="doc-sign-wrap">
      <div>
        <img src="data:image/jpeg;base64,${PRES_SIGN_B64}" alt="Firma y sello">
        <div class="doc-sign-name">Jose · Garvi Recycling Systems, S.L.</div>
      </div>
    </div>
  </div>`;
}
// Carta de compromiso de suministro/colaboración: mismos datos (obra/fecha/conceptos con
// precio) que el presupuesto, pero sin destinatario concreto y con el texto fijo del encargo.
function buildCartaPreview(){
  const dir=presDireccion||'________________';
  const fecha=fmtPresDate(presFecha);
  const conceptsHtml=presItems.length===0
    ?'<p style="color:#999;font-style:italic;margin:8px 0">Sin conceptos añadidos todavía.</p>'
    :`<table class="doc-concepts-table"><thead><tr><th>Conceptos seleccionados</th><th style="text-align:right">Precio</th></tr></thead><tbody>${presItems.map((it,i)=>`<tr${i%2===1?' class="alt"':''}><td>${it.name}</td><td style="text-align:right;white-space:nowrap">${fmtPresPrice(it.price)} + IVA</td></tr>`).join('')}</tbody></table>`;
  return `<div class="doc-preview">
    <div class="doc-head">
      <div class="doc-logo-box"><img src="data:image/png;base64,${PRES_LOGO_B64}" alt="GARVI"></div>
      <div class="doc-title-right">
        <h3>CARTA DE COMPROMISO</h3>
        <p>Garvi Recycling Systems, S.L.U. · B-54970439<br>Avd. General Marvá nº 23-2 · C.P. 03005 (Alicante)</p>
      </div>
    </div>
    <div class="doc-meta-line">
      <strong>Dirección de la obra:</strong> <span id="pres-meta-dir">${dir}</span> &nbsp;&nbsp;
      <strong>Fecha:</strong> <span id="pres-meta-fecha">${fecha}</span>
    </div>
    <p style="margin:12px 0;font-size:13px;color:#333">Estimado/a cliente:</p>
    <p style="margin:12px 0;font-size:13px;color:#333">Por medio de la presente, Garvi Recycling Systems, S.L.U., con CIF B-54970439, en respuesta a su solicitud manifiesta su firme compromiso de suministrar y colaborar en la prestación de los servicios de gestión de residuos necesarios para la ejecución de la obra indicada.</p>
    <p style="margin:12px 0;font-size:13px;color:#333">En caso de resultar adjudicataria de la obra, Garvi Recycling Systems, S.L.U. se compromete a poner a disposición los medios materiales y humanos necesarios para el suministro, retirada, transporte y gestión de los residuos generados mediante contenedores, para los servicios que se detallan a continuación:</p>
    ${conceptsHtml}
    <p style="margin:12px 0;font-size:13px;color:#333">El presente compromiso queda condicionado al cumplimiento por parte del cliente de las condiciones de prestación del servicio: la correcta solicitud del mismo y el respeto de sus plazos, las condiciones de uso y llenado de los contenedores, así como la antelación mínima necesaria para su pedido y retirada.</p>
    <p style="margin:12px 0;font-size:13px;color:#333">Quedamos a su entera disposición para cualquier aclaración que precisen y les agradecemos la confianza depositada en nuestra empresa.</p>
    <p style="margin:12px 0 4px;font-size:13px;color:#333">Atentamente,</p>
    <div class="doc-sign-wrap">
      <div>
        <img src="data:image/jpeg;base64,${PRES_SIGN_B64}" alt="Firma y sello">
        <div class="doc-sign-name">Jose · Garvi Recycling Systems, S.L.U.</div>
      </div>
    </div>
    <div class="doc-footer">Garvi Recycling Systems, S.L.U. · CIF B-54970439 · www.contenedoresgarvi.com</div>
  </div>`;
}

function renderPresupuestos(){
  initPresPrices();
  const sec=document.getElementById('sec-presupuestos');
  const pq=presQ.toLowerCase();
  const catalogHtml=CATALOG_PRES.map((c,i)=>({c,i})).filter(({c})=>!pq||c.name.toLowerCase().includes(pq)).map(({c,i})=>`
    <div class="cat-row">
      <span class="cat-name">${c.name}</span>
      <input type="number" step="0.01" value="${presPrices[i]}" data-action="pres-price" data-idx="${i}" class="cat-price-inp">
      <span class="cat-iva">${c.iva}%</span>
      <button class="btn btn-sm" style="background:var(--accent-blue);color:#fff;padding:4px 9px" data-action="add-pres-item" data-param="${i}">Añadir</button>
    </div>`).join('')||'<div style="color:var(--muted);font-size:12px;padding:6px 0">Sin resultados</div>';
  const itemsHtml=presItems.length===0
    ?'<div style="color:var(--muted);font-size:12px;padding:8px 0">Sin conceptos añadidos.</div>'
    :`<ul class="pres-list">${presItems.map((it,i)=>`<li>
      <span class="pres-item-name">${it.name}</span>
      <span class="pres-item-price">${fmtPresPrice(it.price)}</span>
      <button class="btn btn-danger btn-sm" style="padding:2px 7px;font-size:11px" data-action="del-pres-item" data-param="${i}">×</button>
    </li>`).join('')}</ul>`;
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="section-title">Presupuestos</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="pres-pdf">PDF</button>
          <button class="btn btn-secondary btn-sm" data-action="pres-email">✉ Email</button>
          <button class="btn btn-secondary btn-sm" data-action="pres-print">🖨 Imprimir</button>
        </div>
      </div>
    </div>
    <div class="pres-layout">
      <div class="card" style="padding:14px">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);margin-bottom:10px;border-bottom:2px solid var(--accent-blue);padding-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Tipos de residuo / Servicio</div>
        <input class="search-input" id="pres-search" type="search" placeholder="Buscar tipo de residuo…" value="${presQ}" style="margin-bottom:8px">
        ${catalogHtml}
      </div>
      <div class="card" style="padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);border-bottom:2px solid var(--accent-blue);padding-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Datos del presupuesto</div>
        <div style="display:flex;gap:6px">
          <button class="fact-toggle-btn ${presDocType==='presupuesto'?'active':''}" data-action="pres-doctype" data-param="presupuesto">Presupuesto</button>
          <button class="fact-toggle-btn ${presDocType==='carta'?'active':''}" data-action="pres-doctype" data-param="carta">Carta de Compromiso</button>
        </div>
        <div class="form-row"><label>Cliente</label><input id="pres-cliente" list="dl-global-clientes" value="${presCliente}" placeholder="Nombre del cliente…"></div>
        <div class="form-row"><label>Dirección de la obra</label><input id="pres-dir" value="${presDireccion}" placeholder="Dirección de la obra…"></div>
        <div class="form-row"><label>Fecha</label><input id="pres-fecha" type="date" value="${presFecha}"></div>
        <hr class="divider">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);text-transform:uppercase;letter-spacing:.4px">Conceptos seleccionados</div>
        ${itemsHtml}
        <div style="display:flex;gap:8px;margin-top:auto;padding-top:8px">
          <button class="btn btn-danger btn-sm" data-action="clear-pres">Vaciar todo</button>
          <button class="btn btn-primary btn-sm" data-action="pres-scroll">Ver ${presDocType==='carta'?'carta':'presupuesto'} ↓</button>
        </div>
      </div>
    </div>
    <div id="pres-preview-section" class="pres-preview-wrap">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:var(--text2)">Vista previa de la ${presDocType==='carta'?'carta de compromiso':'presupuesto'}</div>
      </div>
      <div id="pres-doc-content">${buildPresPreview()}</div>
    </div>`;
  document.getElementById('pres-cliente').addEventListener('input',e=>{presCliente=e.target.value;});
  document.getElementById('pres-dir').addEventListener('input',e=>{
    presDireccion=e.target.value;
    const el=document.getElementById('pres-meta-dir');
    if(el) el.textContent=presDireccion||'________________';
  });
  document.getElementById('pres-fecha').addEventListener('input',e=>{
    presFecha=e.target.value;
    const el=document.getElementById('pres-meta-fecha');
    if(el) el.textContent=fmtPresDate(presFecha);
  });
  document.getElementById('pres-search').addEventListener('input',e=>{presQ=e.target.value;reFocusInput('pres-search',renderPresupuestos);});
}

// Nombre de archivo seguro para Windows (se reutiliza en presupuesto y carta).
function slugArchivoPres(s){return (s||'').toString().replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,'_').replace(/^_+|_+$/g,'');}
// Despacha al generador del tipo de documento activo; ambos comparten el mismo guard de
// "sin conceptos" (PDF/Email/Imprimir se comportan igual en los dos modos).
function pdfPresupuesto(){
  if(!presItems.length){toastMsg('Añade al menos un concepto');return;}
  if(presDocType==='carta'){ pdfCartaDoc(); return; }
  pdfPresupuestoDoc();
}
function pdfPresupuestoDoc(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210;
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',10,8,16,16);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',29,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche (Alicante) · CIF: B54970439',29,21);
  doc.text('Tel: 687759465 / 634537926 · contenedores-garvi@hotmail.com',29,26);
  doc.setTextColor(240,180,41); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text('PRESUPUESTO',196,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Fecha: '+fmtPresDate(presFecha),196,26,{align:'right'});
  doc.setDrawColor(200,212,227); doc.line(14,34,196,34);
  let cy=42;
  if(presDireccion){
    doc.setTextColor(74,96,128); doc.setFontSize(7); doc.setFont('helvetica','bold');
    doc.text('DIRECCIÓN DE LA OBRA',14,cy); cy+=6;
    doc.setTextColor(15,32,68); doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(presDireccion,14,cy); cy+=10;
  }
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=8;
  doc.setTextColor(15,32,68); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Estimado/a cliente, nos complace presentarle el presupuesto correspondiente a los siguientes servicios:',14,cy,{maxWidth:182}); cy+=12;
  presItems.forEach((it,idx)=>{
    if(idx%2===0){doc.setFillColor(240,244,248);doc.rect(14,cy-4,182,7,'F');}
    doc.setTextColor(15,32,68); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(it.name,16,cy);
    doc.setFont('helvetica','normal'); doc.text(fmtPresPrice(it.price)+' + IVA',196,cy,{align:'right'}); cy+=7;
  });
  cy+=6;
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=8;
  doc.setTextColor(74,96,128); doc.setFontSize(8.5); doc.setFont('helvetica','normal');
  doc.text('Quedamos a su entera disposición para cualquier aclaración.',14,cy); cy+=14;
  try{doc.addImage('data:image/jpeg;base64,'+PRES_SIGN_B64,'JPEG',134,cy,50,35);}catch(e){}
  doc.setTextColor(74,96,128); doc.setFontSize(7);
  doc.text('Jose · Garvi Recycling Systems, S.L.',160,cy+38,{align:'center'});
  doc.setFillColor(240,180,41); doc.rect(0,292,W,5,'F');
  doc.save(sanitizarNombreArchivo(['Presupuesto',presCliente,presDireccion].filter(Boolean).join(' - '))+'.pdf');
}
// Carta de compromiso en PDF: mismo mecanismo/pipeline que el presupuesto (jsPDF, misma
// cabecera, firma y tabla con precio+IVA), con el texto fijo del encargo y footer con CIF/web.
function pdfCartaDoc(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210;
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',10,8,16,16);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',29,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche (Alicante) · CIF: B54970439',29,21);
  doc.text('Tel: 687759465 / 634537926 · contenedores-garvi@hotmail.com',29,26);
  doc.setTextColor(240,180,41); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text('CARTA DE COMPROMISO',196,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Fecha: '+fmtPresDate(presFecha),196,26,{align:'right'});
  doc.setDrawColor(200,212,227); doc.line(14,34,196,34);
  let cy=42;
  if(presDireccion){
    doc.setTextColor(74,96,128); doc.setFontSize(7); doc.setFont('helvetica','bold');
    doc.text('DIRECCIÓN DE LA OBRA',14,cy); cy+=6;
    doc.setTextColor(15,32,68); doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(presDireccion,14,cy); cy+=10;
  }
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=8;
  doc.setTextColor(15,32,68); doc.setFontSize(9); doc.setFont('helvetica','normal');
  const parrafos=[
    'Estimado/a cliente:',
    'Por medio de la presente, Garvi Recycling Systems, S.L.U., con CIF B-54970439, en respuesta a su solicitud manifiesta su firme compromiso de suministrar y colaborar en la prestación de los servicios de gestión de residuos necesarios para la ejecución de la obra indicada.',
    'En caso de resultar adjudicataria de la obra, Garvi Recycling Systems, S.L.U. se compromete a poner a disposición los medios materiales y humanos necesarios para el suministro, retirada, transporte y gestión de los residuos generados mediante contenedores, para los servicios que se detallan a continuación:',
  ];
  parrafos.forEach(p=>{ const lines=doc.splitTextToSize(p,182); doc.text(lines,14,cy); cy+=lines.length*4.6+3; });
  cy+=1;
  doc.setFillColor(26,42,108); doc.rect(14,cy-5,182,7,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('CONCEPTOS SELECCIONADOS',17,cy); doc.text('PRECIO',193,cy,{align:'right'}); cy+=7;
  doc.setFontSize(9);
  if(!presItems.length){
    doc.setTextColor(153,153,153); doc.setFont('helvetica','italic');
    doc.text('Sin conceptos añadidos todavía.',17,cy+3); cy+=11;
  } else {
    presItems.forEach((it,idx)=>{
      if(idx%2===1){doc.setFillColor(245,247,250);doc.rect(14,cy-4,182,7,'F');}
      doc.setTextColor(15,32,68); doc.setFont('helvetica','normal');
      doc.text(it.name,17,cy); doc.text(fmtPresPrice(it.price)+' + IVA',193,cy,{align:'right'}); cy+=7;
    });
  }
  cy+=6;
  const cierre=[
    'El presente compromiso queda condicionado al cumplimiento por parte del cliente de las condiciones de prestación del servicio: la correcta solicitud del mismo y el respeto de sus plazos, las condiciones de uso y llenado de los contenedores, así como la antelación mínima necesaria para su pedido y retirada.',
    'Quedamos a su entera disposición para cualquier aclaración que precisen y les agradecemos la confianza depositada en nuestra empresa.',
  ];
  doc.setTextColor(15,32,68); doc.setFontSize(9); doc.setFont('helvetica','normal');
  cierre.forEach(p=>{ const lines=doc.splitTextToSize(p,182); doc.text(lines,14,cy); cy+=lines.length*4.6+3; });
  doc.text('Atentamente,',14,cy); cy+=8;
  try{doc.addImage('data:image/jpeg;base64,'+PRES_SIGN_B64,'JPEG',134,cy,50,35);}catch(e){}
  doc.setTextColor(74,96,128); doc.setFontSize(7);
  doc.text('Jose · Garvi Recycling Systems, S.L.U.',160,cy+38,{align:'center'});
  doc.setTextColor(130,140,155); doc.setFontSize(7); doc.setFont('helvetica','normal');
  doc.text('Garvi Recycling Systems, S.L.U. · CIF B-54970439 · www.contenedoresgarvi.com',105,288,{align:'center'});
  doc.setFillColor(240,180,41); doc.rect(0,292,W,5,'F');
  const nombre=['Carta_Compromiso',slugArchivoPres(presDireccion),slugArchivoPres(fmtPresDate(presFecha))].filter(Boolean).join('_');
  doc.save((nombre||'Carta_Compromiso')+'.pdf');
}
function emailPresupuesto(){
  if(presDocType==='carta'){ emailCarta(); return; }
  emailPresupuestoDoc();
}
function emailPresupuestoDoc(){
  const subject=encodeURIComponent('Presupuesto GARVI Recycling Systems');
  const dir=presDireccion?`Dirección: ${presDireccion}\n`:'';
  const conceptos=presItems.map(it=>`- ${it.name}: ${fmtPresPrice(it.price)} + IVA`).join('\n');
  const body=encodeURIComponent(`Estimado/a cliente,\n\nAdjuntamos presupuesto de servicios:\n\n${dir}${conceptos}\n\nQuedamos a su disposición.\n\nGarvi Recycling Systems, S.L.U.\nTel: 687759465 / 634537926\ncontenedores-garvi@hotmail.com`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}
function emailCarta(){
  const subject=encodeURIComponent(`Carta de compromiso — ${presDireccion||''}`);
  const dir=presDireccion?`Obra: ${presDireccion}\n`:'';
  const conceptos=presItems.map(it=>`- ${it.name}: ${fmtPresPrice(it.price)} + IVA`).join('\n');
  const body=encodeURIComponent(`Estimado/a cliente,\n\nAdjuntamos carta de compromiso de suministro y colaboración para los servicios de gestión de residuos de la obra indicada:\n\n${dir}Fecha: ${fmtPresDate(presFecha)}\n\n${conceptos}\n\nQuedamos a su disposición.\n\nGarvi Recycling Systems, S.L.U.\nTel: 687759465 / 634537926\ncontenedores-garvi@hotmail.com`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}
function printPresupuesto(){
  const el=document.getElementById('pres-doc-content');
  if(!el) return;
  const w=window.open('','_blank');
  if(!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#222;line-height:1.6;margin:0}
.doc-preview{border:1.5px solid #ddd;border-radius:10px;padding:26px}
.doc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;border-bottom:2px solid #1a2a6c;padding-bottom:12px}
.doc-logo-box{background:#07235c;border-radius:8px;padding:8px;width:64px;height:64px;display:flex;align-items:center;justify-content:center}
.doc-logo-box img{width:48px;height:48px;display:block}
.doc-title-right{text-align:right}
.doc-title-right h3{color:#1a2a6c;margin:0;font-size:19px;font-weight:800}
.doc-title-right p{font-size:11px;color:#555;margin:2px 0 0}
.doc-meta-line{font-size:12px;margin-bottom:14px;color:#333}
.doc-meta-line strong{color:#1a2a6c}
.doc-concepts-list{margin:8px 0 14px;padding-left:18px}
.doc-concepts-list li{margin-bottom:5px;font-size:13px}
.doc-concepts-list li b{color:#1a2a6c}
.doc-sign-wrap{display:flex;justify-content:flex-end;margin-top:24px}
.doc-sign-wrap img{width:200px;display:block;margin:0 auto 4px}
.doc-sign-name{font-size:11px;color:#333;text-align:center}
.doc-concepts-table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:13px}
.doc-concepts-table th{background:#1a2a6c;color:#fff;text-align:left;padding:7px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
.doc-concepts-table td{padding:7px 10px;color:#222;border-bottom:1px solid #eee}
.doc-concepts-table tr.alt td{background:#f5f7fa}
.doc-footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#888;text-align:center}
span[id]{display:inline}
@media print{body{padding:0}}
</style></head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  setTimeout(()=>{w.focus();w.print();},350);
}

// ─── CERTIFICADOS ─────────────────────────────────────────────────
const MESES_ES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const CERT_TIPOS={
  escombros:{label:'Escombros',residuo:'Mezclas de hormigón, ladrillos, tejas y materiales cerámicos, distintas de las especificadas en el código 170106',ler:'170107',destino:'SABOSPA S.L.',certifNombre:'escombro'},
  plastico:{label:'Plástico',residuo:'PLASTICO',ler:'200139',destino:'RECICLAJES VICTORTOLEDO S.L.',certifNombre:'plásticos'},
};
// Párrafo "CERTIFICA" fijo del certificado, igual para los dos tipos salvo la última palabra
// (el tipo de residuo del que trata). Se usa tanto en la vista previa como en el PDF.
function textoCertifica(tipo){
  const ct=CERT_TIPOS[tipo]||CERT_TIPOS.escombros;
  return {
    intro:'Dª. JOSE ANTONIO GARCIA SEBASTIAN, CON D.N.I. 21473318N, en representación de GARVI RECYCLING SYSTEMS S.L.U., con domicilio en Ptda.Torrellano alto P1, Nº76 C.P.03320 Elche (Alicante), como transportista de residuos no peligrosos (3596/T08/CV), con nº Autorización: 664/T/RNP/CV y NIMA: 0300014535',
    cuerpo:`Que GARVI RECYCLING SYSTEMS S.L.U. ha realizado el transporte de los residuos generados durante la ejecución de la obra abajo indicada, en las fechas y cantidades que se detallan, emitiéndose el correspondiente certificado de gestión de residuos de ${ct.certifNombre}:`,
  };
}
let certForm={tipo:'escombros',periodo:'',productor:'',obra:'',toneladas:'',fecha:todayISO()};
let editCertId=null;
let certQ='';
function fechaCertTexto(iso){
  const dt=iso?new Date(iso+'T00:00:00'):new Date();
  return `${dt.getDate()} de ${MESES_ES[dt.getMonth()].toUpperCase()} de ${dt.getFullYear()}`;
}
function buildCertPreview(){
  const f=certForm;
  const ct=CERT_TIPOS[f.tipo]||CERT_TIPOS.escombros;
  return `<div class="doc-preview">
    <div class="doc-head">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="doc-logo-box" style="background:#0f2044"><img src="icon-512.png" alt="GARVI" style="width:52px;height:52px"></div>
        <div style="font-size:11px;color:#333;line-height:1.5">
          <div style="font-weight:800;color:#1a2a6c;font-size:12.5px">GARVI RECYCLING SYSTEMS, S.L.U.</div>
          <div>Ptda.Torrellano alto P1, Nº76</div>
          <div>C.P.03320 Elche (Alicante)</div>
          <div>Cif.B54970439</div>
        </div>
      </div>
      <div class="doc-title-right"><h3>CERTIFICADO DE GESTIÓN DE RESIDUOS</h3></div>
    </div>
    <p style="margin:10px 0;font-size:11.5px;line-height:1.5;color:#222;text-align:justify" id="cert-meta-intro">${textoCertifica(f.tipo).intro}</p>
    <p style="margin:8px 0;font-size:12px;font-weight:800;color:#1a2a6c">CERTIFICA:</p>
    <p style="margin:8px 0 14px;font-size:11.5px;line-height:1.5;color:#222;text-align:justify" id="cert-meta-cuerpo">${textoCertifica(f.tipo).cuerpo}</p>
    <hr class="divider" style="margin:10px 0">
    <div class="doc-meta-line"><strong>PERIODO:</strong> <span id="cert-meta-periodo">${f.periodo||'________________'}</span></div>
    <div class="doc-meta-line"><strong>PRODUCTOR:</strong> <span id="cert-meta-productor">${f.productor||'________________'}</span></div>
    <div class="doc-meta-line"><strong>OBRA:</strong> <span id="cert-meta-obra">${f.obra||'________________'}</span></div>
    <table class="cert-table">
      <thead><tr><th>Tipo de residuo</th><th>Código LER</th><th>Toneladas</th><th>Destino / Gestor final</th></tr></thead>
      <tbody><tr>
        <td>${ct.residuo}</td>
        <td>${ct.ler}</td>
        <td id="cert-meta-toneladas">${f.toneladas||'—'}</td>
        <td>${ct.destino}</td>
      </tr></tbody>
    </table>
    <p style="margin-top:18px;font-size:12px;color:#333">Alicante, <span id="cert-meta-fecha">${fechaCertTexto(f.fecha)}</span></p>
    <div class="doc-sign-wrap">
      <div>
        <img src="data:image/jpeg;base64,${PRES_SIGN_B64}" alt="Firma y sello">
        <div class="doc-sign-name">D. Jose Antonio García Sebastián<br>Administrador de la empresa Garvi Recycling Systems, S.L.U.</div>
      </div>
    </div>
  </div>`;
}
function renderCertificados(){
  const sec=document.getElementById('sec-certificados');
  const q=certQ.toLowerCase();
  const listFiltered=certificados.filter(c=>!q||(c.productor||'').toLowerCase().includes(q)||(c.obra||'').toLowerCase().includes(q)||(c.periodo||'').toLowerCase().includes(q));
  const listHtml=[...listFiltered].reverse().map(c=>`
    <div class="factura-item" data-action="ver-certificado" data-param="${c.id}">
      <div style="flex:1;min-width:0;overflow-wrap:break-word">
        <div style="font-weight:700;font-size:13px">${c.productor||'—'} <span style="font-size:10px;font-weight:700;color:var(--accent-blue);background:var(--surface2);padding:1px 7px;border-radius:20px;margin-left:4px">${(CERT_TIPOS[c.tipo]||CERT_TIPOS.escombros).label}</span></div>
        <div style="font-size:11px;color:var(--muted)">${c.obra||''} ${c.periodo?'· '+c.periodo:''}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" data-action="pdf-certificado" data-param="${c.id}" style="padding:3px 8px;font-size:11px">PDF</button>
        <button class="btn btn-danger btn-sm" data-action="del-certificado" data-param="${c.id}" style="padding:3px 8px;font-size:11px">🗑</button>
      </div>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="section-title">Certificados${editCertId?' <span style="font-size:11px;font-weight:700;color:var(--accent-blue);background:var(--surface2);padding:2px 8px;border-radius:20px">editando</span>':''}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="nuevo-certificado">+ Nuevo</button>
          <button class="btn btn-secondary btn-sm" data-action="cert-pdf">📄 Crear PDF</button>
        </div>
      </div>
    </div>
    <div class="pres-layout">
      <div class="card" style="padding:14px;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);border-bottom:2px solid var(--accent-blue);padding-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Datos del certificado</div>
        <div class="form-row"><label>Tipo de certificado</label>
          <select id="cert-tipo">${Object.entries(CERT_TIPOS).map(([k,v])=>`<option value="${k}"${certForm.tipo===k?' selected':''}>${v.label}</option>`).join('')}</select>
        </div>
        <div class="form-row"><label>Periodo</label><input id="cert-periodo" value="${f_esc(certForm.periodo)}" placeholder="Ej: ABRIL 2026"></div>
        <div class="form-row"><label>Productor</label><input id="cert-productor" list="dl-global-clientes" value="${f_esc(certForm.productor)}" placeholder="Nombre del productor…"></div>
        <div class="form-row"><label>Obra</label><input id="cert-obra" list="dl-global-direcciones" value="${f_esc(certForm.obra)}" placeholder="Dirección / nombre de la obra…"></div>
        <div class="form-row cols2">
          <div><label>Toneladas</label><input id="cert-toneladas" value="${f_esc(certForm.toneladas)}" placeholder="Ej: 4,5"></div>
          <div><label>Fecha</label><input id="cert-fecha" type="date" value="${certForm.fecha}"></div>
        </div>
        <button class="btn btn-primary btn-sm" data-action="guardar-certificado" style="margin-top:6px">💾 Guardar en la app</button>
        <hr class="divider">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);text-transform:uppercase;letter-spacing:.4px">Certificados guardados (${certificados.length})</div>
        <input class="search-input" id="cert-search" type="search" placeholder="Buscar productor, obra o periodo…" value="${certQ}">
        <div>${listHtml||'<div class="empty-state" style="padding:10px 0">Sin certificados guardados</div>'}</div>
      </div>
      <div class="card" style="padding:14px">
        <div style="font-size:12px;font-weight:700;color:var(--accent-blue);margin-bottom:10px;border-bottom:2px solid var(--accent-blue);padding-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Vista previa en tiempo real</div>
        <div id="cert-doc-content">${buildCertPreview()}</div>
      </div>
    </div>`;
  document.getElementById('cert-tipo').addEventListener('change',e=>{certForm.tipo=e.target.value;renderCertificados();});
  ['periodo','productor','obra','toneladas'].forEach(field=>{
    document.getElementById('cert-'+field).addEventListener('input',e=>{
      certForm[field]=e.target.value;
      const el=document.getElementById('cert-meta-'+field);
      if(el) el.textContent=e.target.value||(field==='toneladas'?'—':'________________');
    });
  });
  document.getElementById('cert-fecha').addEventListener('input',e=>{
    certForm.fecha=e.target.value;
    const el=document.getElementById('cert-meta-fecha');
    if(el) el.textContent=fechaCertTexto(certForm.fecha);
  });
  document.getElementById('cert-search').addEventListener('input',e=>{certQ=e.target.value;reFocusInput('cert-search',renderCertificados);});
}
function f_esc(v){return (v||'').toString().replace(/"/g,'&quot;');}
// Un certificado se identifica por CLIENTE + TIPO, no por lo que haya quedado cargado en
// editCertId (de haber abierto otro para verlo/exportarlo antes). Así, el mismo cliente puede
// tener varios certificados guardados — uno por cada tipo de residuo (p.ej. NOVALIGEPRO
// Escombros Y NOVALIGEPRO Plástico, cada uno su propio documento) — sin que guardar uno
// sobrescriba al otro por tener distinto tipo aunque sea el mismo cliente. Si lo que hay cargado
// ya no coincide en cliente+tipo con lo que se va a guardar, se busca si ya existe un
// certificado con esa combinación exacta (para actualizarlo) o se crea uno nuevo aparte.
function guardarOActualizarCertificado(){
  const prodN=(certForm.productor||'').trim().toLowerCase();
  let obj=null;
  if(editCertId){
    const cargado=certificados.find(x=>x.id===editCertId);
    if(cargado&&(cargado.productor||'').trim().toLowerCase()===prodN&&cargado.tipo===certForm.tipo) obj=cargado;
  }
  if(!obj) obj=certificados.find(x=>(x.productor||'').trim().toLowerCase()===prodN&&x.tipo===certForm.tipo);
  if(obj){ Object.assign(obj,certForm); }
  else{ obj={id:Date.now().toString(),...certForm}; certificados.push(obj); }
  editCertId=obj.id;
  saveCertificados();
  syncCertificadosCol.guardar(obj);
}
function guardarCertificado(){
  if(!certForm.productor.trim()){toastMsg('Indica el productor');return;}
  guardarOActualizarCertificado();
  renderCertificados();toastMsg('Certificado guardado ✓');
}
function verCertificado(id){
  const c=certificados.find(x=>x.id===id); if(!c) return;
  editCertId=id;
  certForm={tipo:c.tipo||'escombros',periodo:c.periodo||'',productor:c.productor||'',obra:c.obra||'',toneladas:c.toneladas||'',fecha:c.fecha||todayISO()};
  renderCertificados();
  toastMsg('Certificado cargado en el formulario — se actualizará al guardar/exportar');
}
function nuevoCertificado(){
  editCertId=null;
  certForm={tipo:'escombros',periodo:'',productor:'',obra:'',toneladas:'',fecha:todayISO()};
  renderCertificados();
}
function delCertificado(id){certificados=certificados.filter(c=>c.id!==id);saveCertificados();syncCertificadosCol.borrar(id);if(editCertId===id) editCertId=null;renderCertificados();toastMsg('Eliminado');}
function pdfCertificado(idOrNull){
  const c=idOrNull?certificados.find(x=>x.id===idOrNull):certForm;
  if(!c||!c.productor||!c.productor.trim()){toastMsg('Indica al menos el productor');return;}
  if(!idOrNull){guardarOActualizarCertificado();renderCertificados();}
  const ct=CERT_TIPOS[c.tipo]||CERT_TIPOS.escombros;
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',14,8,20,20);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',40,16);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76',40,21);
  doc.text('C.P.03320 Elche (Alicante)',40,26);
  doc.text('Cif.B54970439',40,31);
  let cy=50;
  doc.setTextColor(15,32,68); doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text('CERTIFICADO DE GESTIÓN DE RESIDUOS',14,cy); cy+=14;
  const certTxt=textoCertifica(c.tipo);
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(30,30,30);
  doc.splitTextToSize(certTxt.intro,182).forEach(l=>{doc.text(l,14,cy);cy+=5;});
  cy+=4;
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(15,32,68);
  doc.text('CERTIFICA:',14,cy); cy+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(30,30,30);
  doc.splitTextToSize(certTxt.cuerpo,182).forEach(l=>{doc.text(l,14,cy);cy+=5;});
  cy+=8;
  doc.setFontSize(10.5);
  doc.text(`PERIODO: ${c.periodo||''}`,14,cy); cy+=8;
  doc.text(`PRODUCTOR: ${c.productor||''}`,14,cy); cy+=8;
  doc.text(`OBRA: ${c.obra||''}`,14,cy); cy+=14;
  // Tabla de residuos: cabecera en dos líneas (igual que el modelo) y el cuerpo con una
  // separación fija respecto a ella. Cada línea se dibuja a mano con el mismo salto de línea
  // (lineH) que se usa para calcular la altura de la caja, así nunca queda nada solapado ni
  // cortado por muy larga que sea la descripción del residuo.
  const cols=[
    {x:14,w:96,head:['TIPO DE','RESIDUO']},
    {x:110,w:26,head:['CÓDIGO','LER']},
    {x:136,w:24,head:['TONELADAS']},
    {x:160,w:36,head:['DESTINO /','GESTOR FINAL']},
  ];
  const headerTop=cy-5, headerH=13, headLineH=4.2;
  doc.setFillColor(15,32,68); doc.rect(14,headerTop,182,headerH,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
  cols.forEach(col=>col.head.forEach((line,li)=>doc.text(line,col.x+2,headerTop+5+li*headLineH)));
  const vals=[ct.residuo,ct.ler,String(c.toneladas||''),ct.destino];
  doc.setTextColor(15,32,68); doc.setFont('helvetica','normal'); doc.setFontSize(8);
  const lineH=4, padTop=5, padBottom=3;
  let maxLines=1;
  const wrapped=cols.map((col,i)=>{const ls=doc.splitTextToSize(vals[i],col.w-4);maxLines=Math.max(maxLines,ls.length);return ls;});
  const bodyTop=headerTop+headerH+2;
  cols.forEach((col,i)=>wrapped[i].forEach((line,li)=>doc.text(line,col.x+2,bodyTop+padTop+li*lineH)));
  const bodyH=padTop+(maxLines-1)*lineH+padBottom;
  doc.setDrawColor(200,200,200);
  doc.rect(14,bodyTop,182,bodyH);
  cy=bodyTop+bodyH+14;
  doc.setFontSize(10); doc.setTextColor(30,30,30);
  doc.text(`Alicante, ${fechaCertTexto(c.fecha)}`,14,cy);
  cy+=10;
  try{doc.addImage('data:image/jpeg;base64,'+PRES_SIGN_B64,'JPEG',130,cy,50,35);}catch(e){}
  doc.setFontSize(9);
  doc.text('D. Jose Antonio García Sebastián',14,cy+40);
  doc.text('Administrador de la empresa Garvi Recycling Systems, S.L.U.',14,cy+46);
  // Nombre de archivo descriptivo: "CERTIFICADO <TIPO> <PRODUCTOR> <OBRA> <PERIODO>"
  // (se limpian los caracteres que Windows no admite en nombres de archivo).
  const limpiaNombre=s=>(s||'').toString().replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').trim();
  const tipoArchivo=c.tipo==='escombros'?'ESCOMBRO':ct.label.toUpperCase();
  const nombreArchivo=['CERTIFICADO',tipoArchivo,c.productor,c.obra,c.periodo]
    .map(limpiaNombre).filter(Boolean).join(' ');
  doc.save((nombreArchivo||'certificado')+'.pdf');
}

