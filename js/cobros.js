// ─── COBROS PENDIENTES (sección propia) ────────────────────────────
let cobrosQ='';
// Clase de color para el desplegable de método de pago, según el valor elegido.
function claseMetodoPago(mp){
  if(mp==='CONFIRMING') return 'mp-confirming';
  if(mp==='PAGARÉ') return 'mp-pagare';
  if(mp==='CHEQUE') return 'mp-cheque';
  return '';
}
function renderCobrosPendientes(){
  const sec=document.getElementById('sec-cobros');
  const cq=cobrosQ.toLowerCase();
  const pendientes=facturasPendientesList().filter(f=>!cq||(f.cliente||'').toLowerCase().includes(cq)||(f.num||'').toLowerCase().includes(cq));
  const totalPendiente=pendientes.reduce((s,f)=>s+(f.total||0),0);
  const numMuyVencidas=pendientes.filter(facturaMuyVencida).length;
  const numVencidas=pendientes.filter(f=>facturaVencida(f)&&!facturaMuyVencida(f)).length;
  const porCliente=Object.entries(pendientes.reduce((m,f)=>{m[f.cliente]=(m[f.cliente]||0)+(f.total||0);return m;},{})).sort((a,b)=>b[1]-a[1]);
  const maxCliente=porCliente.length?porCliente[0][1]:0;
  const resumenHtml=porCliente.length?`<div class="card" style="padding:10px 14px;margin-top:12px">
    <div style="font-size:11px;font-weight:700;color:var(--accent-blue);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">💼 Debe cada cliente</div>
    <div class="cobros-table-wrap"><table class="cobros-table cobros-table-resumen">
      <thead><tr><th>Cliente</th><th style="text-align:right">Importe</th></tr></thead>
      <tbody>${porCliente.map(([cli,tot])=>{
        const pct=maxCliente?Math.max((tot/maxCliente)*100,4):0;
        return `<tr class="cobros-bar-row"><td class="cobros-bar-cliente"><span class="cobros-bar-fill" style="width:${pct}%"></span><span style="position:relative">${cli}</span></td><td class="cobros-bar-importe">${fmtMoney(tot)}</td></tr>`;
      }).join('')}</tbody>
    </table></div>
  </div>`:'';
  const filasHtml=[...pendientes].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(f=>{
    const muyVencida=facturaMuyVencida(f);
    const vencida=facturaVencida(f);
    const filaClase=muyVencida?'cobros-row-muyvencida':vencida?'cobros-row-vencida':(f.avisado?'cobros-row-avisada':'');
    const estadoPill=muyVencida?`<span class="cobros-status-pill cobros-status-muyvencida">${daysSince(f.fecha)} días</span>`
      :vencida?`<span class="cobros-status-pill cobros-status-vencida">${daysSince(f.fecha)} días</span>`
      :f.avisado?`<span class="cobros-status-pill cobros-status-avisada">Avisado</span>`
      :`<span class="cobros-status-pill cobros-status-plazo">En plazo</span>`;
    return `<tr class="${filaClase}">
      <td>
        <div style="display:flex;gap:3px;align-items:center">
          <select class="metodo-pago-sel ${claseMetodoPago(f.metodoPago)}" data-id="${f.id}">
            <option value=""${!f.metodoPago?' selected':''}>—</option>
            <option value="CONFIRMING"${f.metodoPago==='CONFIRMING'?' selected':''}>🏦 Confirm.</option>
            <option value="PAGARÉ"${f.metodoPago==='PAGARÉ'?' selected':''}>📝 Pagaré</option>
            <option value="CHEQUE"${f.metodoPago==='CHEQUE'?' selected':''}>💳 Cheque</option>
          </select>
          <button class="avisado-toggle${f.avisado?' on':''}" data-action="toggle-avisado" data-param="${f.id}" title="${f.avisado?'Avisado — pulsa para quitar':'Marcar como avisado'}">${f.avisado?'✓':'🔔'}</button>
        </div>
      </td>
      <td class="cobros-cli" data-action="ver-factura" data-param="${f.id}">${f.cliente}</td>
      <td class="cobros-num" data-action="ver-factura" data-param="${f.id}">${f.num}</td>
      <td class="cobros-fecha" data-action="ver-factura" data-param="${f.id}">${fmtDate(f.fecha)}</td>
      <td style="white-space:nowrap">${estadoPill}</td>
      <td class="cobros-importe">${fmtMoney(f.total)}</td>
      <td class="cobros-accion">
        <button class="cobros-btn-cobrada" data-action="toggle-cobrada" data-param="${f.id}" title="Marcar como cobrada">✓ Cobrada</button>
        ${f.telefono?`<a href="https://wa.me/34${f.telefono.replace(/\D/g,'')}" target="_blank" class="btn btn-secondary btn-sm" style="padding:2px 7px;font-size:10px;margin-left:4px">${ICO_WA}</a>`:''}
      </td>
    </tr>`;
  }).join('');
  const tablaHtml=filasHtml?`<div class="card" style="padding:0;overflow:hidden;border-radius:16px"><div class="cobros-table-wrap"><table class="cobros-table">
    <thead><tr><th>Avisado</th><th>Cliente</th><th>Nº Fac</th><th>Fecha</th><th>Estado</th><th style="text-align:right">Importe</th><th></th></tr></thead>
    <tbody>${filasHtml}</tbody>
  </table></div></div>`:'';
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title">Cobros pendientes</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" data-action="importar-deudores">📥 Importar Excel</button>
          <button class="btn btn-secondary btn-sm" data-action="pdf-cobros-pendientes">📄 Crear PDF</button>
        </div>
      </div>
      <div class="cobros-stats">
        <div class="cobros-stat"><div class="cobros-stat-num">${pendientes.length}</div><div class="cobros-stat-label">Sin cobrar</div></div>
        <div class="cobros-stat vencidas"><div class="cobros-stat-num">${numMuyVencidas}</div><div class="cobros-stat-label">🔴 Muy vencidas (60+ días)</div></div>
        <div class="cobros-stat vencidas-leve"><div class="cobros-stat-num">${numVencidas}</div><div class="cobros-stat-label">🟠 Vencidas (30-59 días)</div></div>
        <div class="cobros-stat total"><div class="cobros-stat-num">${fmtMoney(totalPendiente)}</div><div class="cobros-stat-label">Total pendiente</div></div>
      </div>
      <input class="search-input" id="cobros-search" type="search" placeholder="Buscar cliente o número…" value="${cobrosQ}">
    </div>
    ${tablaHtml||'<div class="empty-state"><div class="icon">🎉</div>Sin facturas pendientes de cobro.</div>'}
    ${resumenHtml}`;
  document.getElementById('cobros-search').addEventListener('input',e=>{cobrosQ=e.target.value;reFocusInput('cobros-search',renderCobrosPendientes);});
  document.querySelectorAll('.metodo-pago-sel').forEach(el=>{
    el.addEventListener('change',e=>{
      const f=facturas.find(x=>x.id===e.target.dataset.id); if(!f) return;
      f.metodoPago=e.target.value;
      e.target.className='metodo-pago-sel '+claseMetodoPago(f.metodoPago);
      saveFacturas();syncFacturasCol.guardar(f);
    });
  });
}
// El PDF del listado respeta la pestaña activa (Proformas/Facturas). Para proformas se pide
// expresamente cliente + tipo de contenedor (sacado de las líneas) SIN precio; las facturas
// mantienen el formato de siempre (con total).
function pdfFacturas(){
  const fq=factQ.toLowerCase();
  const esProforma=facturasView==='proformas';
  const list=facturas.filter(f=>!esFacturaFantasma(f)&&f.tipo===(esProforma?'proforma':'factura'))
    .filter(f=>!fq||(f.cliente||'').toLowerCase().includes(fq)||(f.num||'').toLowerCase().includes(fq));
  if(esProforma){
    const rows=list.map(f=>[f.num||'',f.cliente||'',(f.lineas||[]).map(l=>l.desc).filter(Boolean).join(', ')||'—',fmtDate(f.fecha)]);
    pdfListGenerico('Proformas',['Nº','Cliente','Tipo de contenedor','Fecha'],rows,'proformas-garvi.pdf');
  } else {
    const rows=list.map(f=>[f.num||'',f.cliente||'',fmtDate(f.fecha),fmtMoney(f.total)]);
    pdfListGenerico('Facturas',['Nº','Cliente','Fecha','Total'],rows,'facturas-garvi.pdf');
  }
}
// PDF del listado de cobros pendientes, calcado al Excel en papel que ya llevaba el usuario:
// mismas columnas (Avisado/Cliente/Nº Fac/Fecha/Importe) y mismos colores de fila
// (rojo = muy vencida 60+ días, naranja = vencida 30-59 días, amarillo = avisado,
// blanco = aún en plazo), con el total al final.
function pdfCobrosPendientes(){
  const fq=factQ.toLowerCase();
  const list=facturasPendientesList().filter(f=>!fq||(f.cliente||'').toLowerCase().includes(fq)||(f.num||'').toLowerCase().includes(fq))
    .slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!list.length){toastMsg('No hay facturas pendientes de cobro');return;}
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210;
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',10,8,16,16);}catch(e){}
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',29,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche (Alicante) · CIF: B54970439',29,21);
  doc.setTextColor(240,180,41); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('LISTADO DEUDORES',196,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Fecha: '+fmtDate(todayISO()),196,26,{align:'right'});
  doc.setDrawColor(200,212,227); doc.line(14,32,196,32);
  const cols=[{x:14,w:34,label:'AVISADO'},{x:48,w:56,label:'CLIENTE'},{x:104,w:22,label:'Nº FAC'},{x:126,w:30,label:'FECHA'},{x:156,w:40,label:'IMPORTE'}];
  const rowH=7;
  let cy=40;
  const printHeader=()=>{
    doc.setFillColor(15,32,68); doc.rect(14,cy-5,182,rowH,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
    cols.forEach(c=>doc.text(c.label,c.x+2,cy));
    cy+=rowH;
  };
  printHeader();
  doc.setFont('helvetica','normal');
  let total=0;
  list.forEach(f=>{
    if(cy>270){doc.addPage();cy=20;printHeader();}
    const muyVencida=facturaMuyVencida(f);
    const vencida=facturaVencida(f);
    if(muyVencida) doc.setFillColor(254,226,226);
    else if(vencida) doc.setFillColor(255,237,213);
    else if(f.avisado) doc.setFillColor(254,243,199);
    else doc.setFillColor(255,255,255);
    doc.rect(14,cy-4.5,182,rowH,'F');
    doc.setTextColor(15,32,68); doc.setFontSize(8.5);
    doc.text(f.metodoPago||'',cols[0].x+2,cy,{maxWidth:cols[0].w-3});
    doc.text(f.cliente||'',cols[1].x+2,cy,{maxWidth:cols[1].w-3});
    doc.text(String(f.num||''),cols[2].x+2,cy,{maxWidth:cols[2].w-3});
    doc.text(fmtDate(f.fecha),cols[3].x+2,cy,{maxWidth:cols[3].w-3});
    doc.text(fmtMoney(f.total),cols[4].x+2,cy,{maxWidth:cols[4].w-3});
    total+=f.total||0;
    cy+=rowH;
  });
  cy+=5;
  doc.setDrawColor(200,212,227); doc.line(14,cy-5,196,cy-5);
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(15,32,68);
  doc.text('TOTAL PENDIENTE: '+fmtMoney(total),196,cy,{align:'right'});
  doc.save('cobros-pendientes-garvi.pdf');
}
function nuevaFacturaModal(idEditar){
  editFactId=idEditar||null;
  let f=idEditar?facturas.find(x=>x.id===idEditar):null;
  const draft=loadFacturaDraft();
  const useDraft=!!(draft&&draft.editId===(idEditar||null));
  if(useDraft){factMode=draft.tipo;factLineas=(draft.lineas||[]).map(l=>({...l}));}
  else if(f){factMode=f.tipo;factLineas=f.lineas.map(l=>({...l}));}
  else{factLineas=[];factMode='proforma';}
  const hoy=todayISO();
  const vencDef=addDaysISO(30);
  const isProf=factMode==='proforma';
  const nextNum=isProf?'P-'+String((cfg.ultimaProf||0)+1).padStart(3,'0'):'F-'+String((cfg.ultimaFact||0)+1).padStart(3,'0');
  const clientesList=clientes.map(c=>`<option value="${c.nombre}">`).join('');
  // Pre-fill from borrador (si existe) o del registro guardado
  const fCliente=useDraft?draft.cliente:(f?f.cliente:'');
  const fNif=useDraft?draft.nif:(f?f.nif||'':'');
  const fDir=useDraft?draft.dir:(f?f.dir||'':'');
  const fTel=useDraft?draft.tel:(f?f.telefono||'':'');
  const fEmail=useDraft?draft.email:(f?f.email||'':'');
  const fVenc=useDraft?(draft.venc||vencDef):(f?f.vencimiento||vencDef:vencDef);
  const fNotas=useDraft?draft.notas:(f?f.notas||'':'');
  const fNum=useDraft&&draft.num?draft.num:(f?f.num:nextNum);
  const fFecha=useDraft&&draft.fecha?draft.fecha:(f?f.fecha:hoy);
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header">
      <span class="modal-title">${idEditar?'Editar':'Nueva'} Proforma / Factura</span>
      <button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button>
    </div>
    <div class="fact-toggle">
      <button class="fact-toggle-btn ${factMode==='proforma'?'active':''}" data-action="fact-mode" data-param="proforma">📄 PROFORMA</button>
      <button class="fact-toggle-btn ${factMode==='factura'?'active':''}" data-action="fact-mode" data-param="factura">🧾 FACTURA</button>
    </div>
    <div class="form-row cols2">
      <div><label>Número</label><input id="f-num" value="${fNum}"></div>
      <div><label>Fecha emisión</label><input id="f-fecha" type="date" value="${fFecha}"></div>
    </div>
    <div class="form-row" id="f-venc-row" style="display:${factMode==='factura'?'grid':'none'}">
      <label>Fecha vencimiento</label><input id="f-venc" type="date" value="${fVenc}">
    </div>
    <hr class="divider" style="margin:10px 0 12px">
    <div style="font-size:11px;color:var(--muted);font-weight:700;letter-spacing:.05em;margin-bottom:8px">DATOS DEL CLIENTE</div>
    <datalist id="dl-clientes">${clientesList}</datalist>
    <div class="form-row cols2">
      <div><label>Nombre / Razón social</label><input id="f-cliente" list="dl-clientes" placeholder="Cliente…" value="${fCliente}" autocomplete="off"></div>
      <div><label>NIF / CIF</label><input id="f-nif" placeholder="B-XXXXXXXX" value="${fNif}"></div>
    </div>
    <div class="form-row cols2">
      <div><label>Dirección</label><input id="f-dir" list="dl-global-direcciones" placeholder="Calle, número, ciudad…" value="${fDir}"></div>
      <div><label>Teléfono</label><input id="f-tel" list="dl-global-telefonos" type="tel" inputmode="tel" value="${fTel}">${fTel?`<a href="tel:${fTel}" style="font-size:11px;color:var(--accent);margin-top:3px;display:block">📞 ${fTel}</a>`:''}</div>
    </div>
    <div class="form-row"><label>Email</label><input id="f-email" type="email" inputmode="email" placeholder="cliente@email.com" value="${fEmail}"></div>
    <div id="cliente-conceptos-wrap"></div>
    <hr class="divider" style="margin:10px 0 12px">
    <div style="font-size:11px;color:var(--muted);font-weight:700;letter-spacing:.05em;margin-bottom:8px">CONCEPTOS RÁPIDOS</div>
    <div class="qbtn-tabs">
      ${Object.keys(CONCEPTOS_GRUPOS).map(g=>`<button class="qbtn-tab${conceptoGrupo===g?' active':''}" data-action="concepto-grupo" data-param="${g}">${g}</button>`).join('')}
    </div>
    <div class="quick-btns" id="quick-btns-list"></div>
    <hr class="divider" style="margin:8px 0 10px">
    <div class="lineas-table-wrap">
    <table class="lineas-table" id="lineas-table">
      <thead><tr><th style="width:40%">Concepto</th><th style="width:10%">Cant.</th><th style="width:16%">Precio</th><th style="width:10%">IVA%</th><th style="width:16%;text-align:right">Subtotal</th><th style="width:8%"></th></tr></thead>
      <tbody id="lineas-body"></tbody>
    </table>
    </div>
    <button class="btn btn-secondary btn-sm" style="margin-bottom:8px" data-action="add-linea">+ Línea vacía</button>
    <div class="totales-box" id="totales-box"></div>
    <div class="form-row" style="margin-top:12px">
      <label>Notas / Condiciones de pago</label>
      <textarea id="f-notas" rows="3" style="font-size:13px">${fNotas}</textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="btn btn-primary" data-action="guardar-factura">${idEditar?'Actualizar':'Crear'}</button>
      <button class="btn btn-secondary" data-action="pdf-factura-preview">📄 Crear PDF</button>
    </div>`;
  renderQBtns();
  renderLineas();
  renderClienteConceptos(fCliente);
  // Autocomplete: when client selected, prefill phone/dir/NIF y conceptos guardados. Se consulta
  // getClienteExtraAprox() directamente (no solo el array 'clientes', que solo incluye clientes
  // con algún contenedor) para que funcione también con clientes que solo existen en facturación,
  // y tolera mayúsculas/espacios distintos a como se guardó (igual que en contenedores). Escucha
  // 'input'/'blur' además de 'change' porque elegir una sugerencia del datalist no siempre
  // dispara 'change' en todos los navegadores/móviles.
  const autocompletarClienteFactura=e=>{
    const nom=e.target.value.trim();
    const cl=clientes.find(c=>c.nombre===nom);
    const ex=getClienteExtraAprox(nom);
    if(cl){
      if(!document.getElementById('f-tel').value&&cl.telefono) document.getElementById('f-tel').value=cl.telefono;
      if(!document.getElementById('f-dir').value&&cl.direccion) document.getElementById('f-dir').value=cl.direccion;
    }
    if(ex.dirFacturacion) document.getElementById('f-dir').value=ex.dirFacturacion;
    if(ex.cif) document.getElementById('f-nif').value=ex.cif;
    renderClienteConceptos(nom);
  };
  ['input','change','blur'].forEach(ev=>document.getElementById('f-cliente').addEventListener(ev,autocompletarClienteFactura));
  document.getElementById('modal-overlay').classList.add('open');
  if(useDraft) toastMsg('Borrador restaurado ✎');
}
function renderLineas(){
  const tbody=document.getElementById('lineas-body');
  if(!tbody) return;
  tbody.innerHTML=factLineas.map((l,i)=>{
    const sub=(l.qty||0)*(l.precio||0)*(1+(l.iva||21)/100);
    return `<tr data-idx="${i}">
      <td><input value="${l.desc||''}" data-action="edit-linea" data-field="desc" data-idx="${i}" style="min-width:90px;font-size:12px"></td>
      <td><input type="number" inputmode="decimal" value="${l.qty||1}" data-action="edit-linea" data-field="qty" data-idx="${i}" style="width:46px;font-size:12px"></td>
      <td><input type="number" inputmode="decimal" value="${l.precio||0}" data-action="edit-linea" data-field="precio" data-idx="${i}" style="width:65px;font-size:12px"></td>
      <td><input type="number" inputmode="decimal" value="${l.iva||21}" data-action="edit-linea" data-field="iva" data-idx="${i}" style="width:42px;font-size:12px"></td>
      <td class="linea-sub" style="text-align:right;font-family:'DM Mono',monospace;font-size:12px;color:var(--accent);white-space:nowrap">${fmtMoney(sub)}</td>
      <td><button class="btn btn-danger btn-sm btn-icon" data-action="del-linea" data-idx="${i}" style="width:28px;height:28px;font-size:12px">✕</button></td>
    </tr>`;}).join('');
  renderTotales();
}
function renderTotales(){
  const box=document.getElementById('totales-box');
  if(!box) return;
  let base=0,ivaTotal=0;
  factLineas.forEach(l=>{
    const b=(l.qty||0)*(l.precio||0);
    base+=b;
    ivaTotal+=b*(l.iva||21)/100;
  });
  const total=base+ivaTotal;
  box.innerHTML=`
    <div class="total-row"><span>Base imponible</span><span style="font-family:'DM Mono',monospace">${fmtMoney(base)}</span></div>
    <div class="total-row"><span>IVA</span><span style="font-family:'DM Mono',monospace">${fmtMoney(ivaTotal)}</span></div>
    <div class="total-row grand"><span>TOTAL</span><span>${fmtMoney(total)}</span></div>`;
}
function addConcepto(label,precio,iva){
  factLineas.push({desc:label,qty:1,precio:Number(precio),iva:Number(iva)});
  renderLineas();
  saveFacturaDraft();
}
function addLinea(){factLineas.push({desc:'',qty:1,precio:0,iva:10});renderLineas();saveFacturaDraft();}
function saveFacturaDraft(){
  if(!document.getElementById('f-cliente')) return;
  const draft={
    editId:editFactId||null,
    tipo:factMode,
    num:(document.getElementById('f-num')||{}).value||'',
    fecha:(document.getElementById('f-fecha')||{}).value||'',
    venc:(document.getElementById('f-venc')||{}).value||'',
    cliente:(document.getElementById('f-cliente')||{}).value||'',
    nif:(document.getElementById('f-nif')||{}).value||'',
    dir:(document.getElementById('f-dir')||{}).value||'',
    tel:(document.getElementById('f-tel')||{}).value||'',
    email:(document.getElementById('f-email')||{}).value||'',
    notas:(document.getElementById('f-notas')||{}).value||'',
    lineas:factLineas,
  };
  localStorage.setItem('garvi_factura_draft',JSON.stringify(draft));
}
function loadFacturaDraft(){
  try{
    const d=JSON.parse(localStorage.getItem('garvi_factura_draft')||'null');
    if(d&&d.notas==='Pago a 30 días desde la fecha de emisión.') d.notas='';
    return d;
  }catch(e){return null;}
}
function clearFacturaDraft(){localStorage.removeItem('garvi_factura_draft');}
function editLinea(idx,field,val){
  if(field==='qty'||field==='precio'||field==='iva') factLineas[idx][field]=Number(val);
  else factLineas[idx][field]=val;
  const l=factLineas[idx];
  const row=document.querySelector(`#lineas-body tr[data-idx="${idx}"]`);
  if(row){
    const sub=(l.qty||0)*(l.precio||0)*(1+(l.iva||21)/100);
    const cell=row.querySelector('.linea-sub');
    if(cell) cell.textContent=fmtMoney(sub);
  }
  renderTotales();
}
function delLinea(idx){factLineas.splice(idx,1);renderLineas();saveFacturaDraft();}
function guardarFactura(){
  if(!factLineas.length){toastMsg('Añade al menos una línea');return;}
  const cliente=(document.getElementById('f-cliente').value||'').trim();
  if(!cliente){toastMsg('Indica el cliente');return;}
  let base=0,ivaTotal=0;
  factLineas.forEach(l=>{const b=(l.qty||0)*(l.precio||0);base+=b;ivaTotal+=b*(l.iva||21)/100;});
  const total=base+ivaTotal;
  const isProf=factMode==='proforma';
  const datos={
    tipo:factMode,cliente,
    num:document.getElementById('f-num').value.trim(),
    fecha:document.getElementById('f-fecha').value,
    vencimiento:factMode==='factura'?(document.getElementById('f-venc')||{}).value||'':'',
    nif:document.getElementById('f-nif').value.trim(),
    dir:document.getElementById('f-dir').value.trim(),
    telefono:document.getElementById('f-tel').value.trim(),
    email:document.getElementById('f-email').value.trim(),
    notas:document.getElementById('f-notas').value.trim(),
    lineas:factLineas.map(l=>({...l})),
    base,iva:ivaTotal,total,
  };
  if(editFactId){
    const f=facturas.find(x=>x.id===editFactId);
    if(f){ Object.assign(f,datos); syncFacturasCol.guardar(f); }
  } else {
    if(isProf) cfg.ultimaProf=(cfg.ultimaProf||0)+1;
    else cfg.ultimaFact=(cfg.ultimaFact||0)+1;
    saveCfg(); syncCfg();
    const nuevaFact={id:Date.now().toString(),...datos};
    facturas.push(nuevaFact); syncFacturasCol.guardar(nuevaFact);
  }
  saveFacturas();clearFacturaDraft();closeModal();renderFacturas();updateBadge();toastMsg('Factura guardada ✓');
}
// Genera una factura NUEVA a partir de una proforma ya hecha (mismo cliente/datos/líneas, nuevo
// número de factura correlativo). La proforma original se queda tal cual, no se borra ni se
// convierte — quedan como dos documentos distintos, igual que en la operativa real de la empresa.
function hacerFactura(id){
  const p=facturas.find(x=>x.id===id);
  if(!p||p.tipo!=='proforma') return;
  cfg.ultimaFact=(cfg.ultimaFact||0)+1;
  saveCfg(); syncCfg();
  const nuevaFact={
    id:Date.now().toString(),
    tipo:'factura',
    cliente:p.cliente, nif:p.nif||'', dir:p.dir||'', telefono:p.telefono||'', email:p.email||'',
    num:'F-'+String(cfg.ultimaFact).padStart(3,'0'),
    fecha:todayISO(),
    vencimiento:addDaysISO(30),
    notas:p.notas||'',
    lineas:(p.lineas||[]).map(l=>({...l})),
    base:p.base,iva:p.iva,total:p.total,
    cobrada:false,fechaCobro:'',avisado:false,metodoPago:'',
  };
  facturas.push(nuevaFact); syncFacturasCol.guardar(nuevaFact);
  saveFacturas(); facturasView='facturas'; renderFacturas(); updateBadge();
  toastMsg(`Factura ${nuevaFact.num} creada a partir de ${p.num} ✓`);
}
function buildTmpFactura(){
  let base=0,ivaTotal=0;
  factLineas.forEach(l=>{const b=(l.qty||0)*(l.precio||0);base+=b;ivaTotal+=b*(l.iva||21)/100;});
  return {
    num:(document.getElementById('f-num')||{}).value||'BORRADOR',
    tipo:factMode,
    cliente:(document.getElementById('f-cliente')||{}).value||'',
    nif:(document.getElementById('f-nif')||{}).value||'',
    dir:(document.getElementById('f-dir')||{}).value||'',
    telefono:(document.getElementById('f-tel')||{}).value||'',
    email:(document.getElementById('f-email')||{}).value||'',
    fecha:(document.getElementById('f-fecha')||{}).value||todayISO(),
    vencimiento:(document.getElementById('f-venc')||{}).value||'',
    notas:(document.getElementById('f-notas')||{}).value||'',
    lineas:factLineas,base,iva:ivaTotal,total:base+ivaTotal,
  };
}
function pdfFactura(id){
  if(id){const f=facturas.find(x=>x.id===id);if(f) _doPdfFactura(f);}
  else _doPdfFactura(buildTmpFactura());
}
// Quita del texto los caracteres no válidos en un nombre de archivo de Windows, conservando
// espacios y acentos para que el nombre siga siendo legible (reutilizado por proformas y
// presupuestos).
function sanitizarNombreArchivo(s){return (s||'').toString().replace(/[\\/:*?"<>|]/g,'-').trim();}
// Nombre de archivo de una proforma: "Nº - CLIENTE - CANTIDAD SERVICIO[ + CANTIDAD SERVICIO...]"
function nombrePdfProforma(f){
  const lineas=(f.lineas||[]).filter(l=>l&&l.desc);
  const partes=[f.num||'',f.cliente||''];
  if(lineas.length) partes.push(lineas.map(l=>`${l.qty||1} ${l.desc}`).join(' + '));
  return sanitizarNombreArchivo(partes.filter(Boolean).join(' - '))||f.num||'documento';
}
function _doPdfFactura(f){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,H=297;
  // Barra superior dorada
  doc.setFillColor(240,180,41); doc.rect(0,0,W,5,'F');
  // Logo PNG real
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',10,8,16,16);}catch(e){}
  // Datos empresa
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',29,15);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76  ·  C.P.03320 Elche (Alicante)',29,21);
  doc.text('CIF: B54970439  ·  Tel: 687759465 / 634537926',29,26);
  doc.text('contenedores-garvi@hotmail.com  ·  www.contenedoresalicante.es',29,31);
  // Tipo doc (derecha arriba)
  const tipoLabel=f.tipo==='proforma'?'PROFORMA':'FACTURA';
  doc.setTextColor(240,180,41); doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.text(tipoLabel,196,18,{align:'right'});
  doc.setTextColor(74,96,128); doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text(`Nº: ${f.num||''}`,196,26,{align:'right'});
  doc.text(`Emisión: ${fmtDate(f.fecha)}`,196,32,{align:'right'});
  // Línea divisoria
  doc.setDrawColor(200,212,227); doc.line(14,40,196,40);
  // Bloque CLIENTE
  let cy=46;
  doc.setTextColor(74,96,128); doc.setFontSize(7); doc.setFont('helvetica','bold');
  doc.text('FACTURAR A',14,cy); cy+=6;
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text(f.cliente||'',14,cy); cy+=6;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  if(f.nif){doc.setTextColor(74,96,128);doc.text('NIF/CIF: ',14,cy);doc.setTextColor(15,32,68);doc.text(f.nif,35,cy);cy+=5;}
  if(f.dir){doc.setTextColor(15,32,68);doc.text(f.dir,14,cy);cy+=5;}
  const contactLine=[f.telefono?`Tel: ${f.telefono}`:'',f.email||''].filter(Boolean).join('  ·  ');
  if(contactLine){doc.setTextColor(15,32,68);doc.text(contactLine,14,cy);cy+=5;}
  cy=Math.max(cy,70);
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=6;
  // Cabecera tabla
  doc.setFillColor(15,32,68); doc.rect(14,cy-4,182,8,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('DESCRIPCIÓN',16,cy);
  doc.text('CANT.',116,cy,{align:'right'});
  doc.text('P.UNIT.',140,cy,{align:'right'});
  doc.text('IVA',155,cy,{align:'right'});
  doc.text('IMPORTE',196,cy,{align:'right'});
  cy+=8;
  // Líneas. Las facturas importadas del listado de deudores en papel (importadas desde el Excel de deudores) no
  // tienen desglose de líneas (el papel original nunca recogía qué tipo de contenedor era cada
  // deuda) — en vez de dejar la tabla vacía, se muestra una línea genérica con el total.
  doc.setFont('helvetica','normal'); doc.setTextColor(15,32,68);
  const lineasParaPdf=f.lineas.length?f.lineas:[{
    desc:f.notas||'Servicio de gestión de residuos',
    qty:1, precio:f.total||0,
    iva:f.base?Math.round((f.iva||0)/f.base*100):0,
  }];
  lineasParaPdf.forEach((l,idx)=>{
    if(cy>248){doc.addPage();cy=20;}
    if(idx%2===0){doc.setFillColor(240,244,248);doc.rect(14,cy-4,182,7,'F');}
    const imp=(l.qty||0)*(l.precio||0);
    const desc=String(l.desc||'');
    const lines=doc.splitTextToSize(desc,90);
    doc.setFontSize(8); doc.setTextColor(15,32,68);
    doc.text(lines[0],16,cy);
    doc.text(String(l.qty||0),116,cy,{align:'right'});
    doc.text(fmtMoney(l.precio||0),140,cy,{align:'right'});
    doc.text((l.iva??21)+'%',155,cy,{align:'right'});
    doc.text(fmtMoney(imp),196,cy,{align:'right'});
    cy+=7;
  });
  // Divisor totales
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=8;
  // Totales
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(74,96,128);
  doc.text('Base imponible:',128,cy); doc.setTextColor(15,32,68); doc.text(fmtMoney(f.base),196,cy,{align:'right'}); cy+=6;
  doc.setTextColor(74,96,128); doc.text('IVA:',128,cy); doc.setTextColor(15,32,68); doc.text(fmtMoney(f.iva),196,cy,{align:'right'}); cy+=2;
  doc.setDrawColor(200,212,227); doc.line(128,cy,196,cy); cy+=6;
  doc.setTextColor(15,32,68); doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text('TOTAL:',128,cy); doc.text(fmtMoney(f.total),196,cy,{align:'right'}); cy+=12;
  // Datos de pago (justo después de totales)
  cy+=4;
  doc.setDrawColor(200,212,227); doc.line(14,cy,196,cy); cy+=6;
  doc.setTextColor(74,96,128); doc.setFontSize(7.5); doc.setFont('helvetica','normal');
  doc.text('R.M. Alicante, tomo 3996, folio 28, Insc. 1ª, hoja A -152854.',14,cy); cy+=5;
  doc.text('Para transferencia o ingreso en cuenta, Nº/ ES9100811357620001220430 SABADELL',14,cy); cy+=5;
  doc.text('Indicando: Empresa y nº/factura.',14,cy);
  // Barra inferior dorada
  doc.setFillColor(240,180,41); doc.rect(0,292,W,5,'F');
  doc.save((f.tipo==='proforma'?nombrePdfProforma(f):(f.num||'documento'))+'.pdf');
}

