// ─── PDF LOGO HELPER ──────────────────────────────────────────────
function drawGVLogo(doc,bx,by,sz){
  const s=sz/44;
  doc.setFillColor(229,92,0);
  doc.rect(bx+5*s,by+10*s,34*s,4.5*s,'F');
  doc.rect(bx+5*s,by+14.5*s,4.5*s,20.5*s,'F');
  doc.rect(bx+9.5*s,by+20*s,11*s,4.5*s,'F');
  doc.rect(bx+5*s,by+30.5*s,13.5*s,4.5*s,'F');
  doc.triangle(bx+39*s,by+11*s,bx+34.5*s,by+13.5*s,bx+23*s,by+36*s,'F');
  doc.triangle(bx+23*s,by+23*s,bx+18*s,by+22*s,bx+23*s,by+36*s,'F');
}
// ─── ALBARANES ────────────────────────────────────────────────────
let albFilterQ='';
function renderAlbaranes(){
  const sec=document.getElementById('sec-albaranes');
  const hoy=todayISO();
  let list=[...albaranes].reverse().filter(a=>!albFilterQ||(a.cliente||'').toLowerCase().includes(albFilterQ.toLowerCase())||(a.num||'').includes(albFilterQ));
  const rows=list.map(a=>`
    <div class="albaran-ticket">
      <div class="albaran-ticket-top">
        <span class="albaran-ticket-num">${a.num||'ALB'}</span>
        <span class="albaran-ticket-date">${fmtDate(a.fecha)}</span>
      </div>
      <div class="albaran-ticket-title">${a.cliente||'Sin cliente'} ${a.contenedor?'· Cont. '+a.contenedor:''}</div>
      <div class="albaran-ticket-detail">${a.tipo||''} ${a.descripcion?'· '+a.descripcion:''}</div>
      <div class="albaran-ticket-actions">
        <button class="btn btn-secondary btn-sm" data-action="pdf-albaran" data-param="${a.id}">PDF</button>
        ${a.telefono?`<a href="https://wa.me/34${a.telefono}" target="_blank" class="btn btn-secondary btn-sm">${ICO_WA} WA</a>`:''}
        <button class="btn btn-danger btn-sm" data-action="del-albaran" data-param="${a.id}">🗑</button>
      </div>
    </div>`).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title">Albaranes</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="pdf-albaranes">📄 Crear PDF</button>
          <button class="btn btn-primary btn-sm" data-action="nuevo-albaran">+ Nuevo</button>
        </div>
      </div>
      <input class="search-input" id="alb-search" type="search" placeholder="Buscar…" value="${albFilterQ}">
    </div>
    ${rows||'<div class="empty-state"><div class="icon">📋</div>Sin albaranes</div>'}`;
  document.getElementById('alb-search').addEventListener('input',e=>{albFilterQ=e.target.value;reFocusInput('alb-search',renderAlbaranes);});
}
function nuevoAlbaranModal(contNum){
  const c=contNum?getContainer(contNum):null;
  const nextN=albaranes.length?Math.max(...albaranes.map(a=>parseInt((a.num||'0').replace(/\D/g,''))||0))+1:1;
  const siguiente='ALB-'+(nextN<10?'0'+nextN:String(nextN));
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Nuevo albarán</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="form-row cols2">
      <div><label>Número</label><input id="alb-num" value="${siguiente}"></div>
      <div><label>Fecha</label><input id="alb-fecha" type="date" value="${todayISO()}"></div>
    </div>
    <div class="form-row cols2">
      <div><label>Hora</label><input id="alb-hora" type="time" value="${new Date().toTimeString().slice(0,5)}"></div>
      <div><label>Precio</label><input id="alb-precio" type="number" step="0.01" placeholder="0.00"></div>
    </div>
    <div class="form-row"><label>Cliente / Cargador</label><input id="alb-cliente" list="dl-global-clientes" value="${c?c.cliente:''}"></div>
    <div class="form-row cols2">
      <div><label>Contenedor llevada nº</label><input id="alb-cont" value="${contNum||''}"></div>
      <div><label>Teléfono</label><input id="alb-tel" list="dl-global-telefonos" type="tel" value="${c?c.telefono||'':''}"></div>
    </div>
    <div class="form-row"><label>Lugar / Dirección obra</label><input id="alb-lugar" list="dl-global-direcciones" value="${c?c.direccion||'':''}"></div>
    <div class="form-row cols2">
      <div><label>Población</label><input id="alb-poblacion" placeholder="Alicante…"></div>
      <div><label>Conductor</label><input id="alb-conductor"></div>
    </div>
    <div class="form-row"><label>Destinatario</label><input id="alb-destinatario"></div>
    <div class="form-row cols2">
      <div><label>Tipo residuo</label><select id="alb-tipo">${TIPOS_RESIDUO.map(t=>`<option${c&&c.tipo===t?' selected':''}>${t}</option>`).join('')}</select></div>
      <div><label>Servicio</label><select id="alb-servicio"><option>Recogida</option><option>Entrega</option><option>Intercambio</option><option>Limpieza</option></select></div>
    </div>
    <div class="form-row"><label>Observaciones</label><textarea id="alb-desc" rows="2"></textarea></div>
    <button class="btn btn-primary btn-full" style="margin-top:8px" data-action="crear-albaran" data-param="${contNum||''}">Crear albarán</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function crearAlbaran(contNum){
  const alb={id:Date.now().toString(),num:document.getElementById('alb-num').value.trim(),fecha:document.getElementById('alb-fecha').value,hora:document.getElementById('alb-hora').value,precio:document.getElementById('alb-precio').value,cliente:document.getElementById('alb-cliente').value.trim(),contenedor:document.getElementById('alb-cont').value.trim(),telefono:document.getElementById('alb-tel').value.trim(),lugar:document.getElementById('alb-lugar').value.trim(),poblacion:document.getElementById('alb-poblacion').value.trim(),conductor:document.getElementById('alb-conductor').value.trim(),destinatario:document.getElementById('alb-destinatario').value.trim(),tipo:document.getElementById('alb-tipo').value,servicio:document.getElementById('alb-servicio').value,descripcion:document.getElementById('alb-desc').value.trim()};
  albaranes.push(alb);saveAlbaranes();syncAlbaranesCol.guardar(alb);closeModal();renderAlbaranes();toastMsg('Albarán creado ✓');
}
function pdfAlbaranes(){
  const list=[...albaranes].reverse().filter(a=>!albFilterQ||(a.cliente||'').toLowerCase().includes(albFilterQ.toLowerCase())||(a.num||'').includes(albFilterQ));
  const rows=list.map(a=>[a.num||'',a.cliente||'',fmtDate(a.fecha),a.tipo||'',a.contenedor||'']);
  pdfListGenerico('Albaranes',['Nº','Cliente','Fecha','Tipo','Contenedor'],rows,'albaranes-garvi.pdf');
}
function pdfAlbaran(id){
  const a=albaranes.find(x=>x.id===id); if(!a) return;
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'mm',format:'a5'});
  const W=148;
  // Barra superior
  doc.setFillColor(240,180,41); doc.rect(0,0,W,4,'F');
  // Logo PNG
  try{doc.addImage('data:image/png;base64,'+PRES_LOGO_B64,'PNG',8,6,12,12);}catch(e){}
  // Empresa
  doc.setTextColor(15,32,68); doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('GARVI RECYCLING SYSTEMS, S.L.U.',23,11);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(74,96,128);
  doc.text('Ptda.Torrellano alto P1, Nº76 · C.P.03320 Elche · CIF: B54970439',23,16);
  doc.text('Tel: 687759465 / 634537926 · contenedores-garvi@hotmail.com',23,20);
  // Título
  doc.setDrawColor(200,212,227); doc.line(8,24,140,24);
  doc.setTextColor(15,32,68); doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('ALBARÁN DE SERVICIO',W/2,31,{align:'center'});
  // Datos principales
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  const col1=8, col2=80;
  const fila=(label,val,x,y,label2,val2)=>{
    doc.setTextColor(74,96,128); doc.text(label+':',x,y);
    doc.setTextColor(15,32,68); doc.setFont('helvetica','bold'); doc.text(val||'—',x+18,y);
    doc.setFont('helvetica','normal');
    if(label2!==undefined){doc.setTextColor(74,96,128);doc.text(label2+':',col2,y);doc.setTextColor(15,32,68);doc.setFont('helvetica','bold');doc.text(val2||'—',col2+16,y);doc.setFont('helvetica','normal');}
  };
  let y=40;
  fila('Nº',a.num||'',col1,y,'Fecha',fmtDate(a.fecha)); y+=7;
  fila('Hora',a.hora||'—',col1,y,'Servicio',a.servicio||''); y+=7;
  doc.setDrawColor(200,212,227); doc.line(8,y-2,140,y-2); y+=2;
  fila('Cliente',a.cliente||'',col1,y,'Tel',a.telefono||''); y+=7;
  fila('Lugar',a.lugar||'',col1,y,'Población',a.poblacion||''); y+=7;
  fila('Conductor',a.conductor||'',col1,y,'Cont. nº',a.contenedor||''); y+=7;
  fila('Destinatario',a.destinatario||'',col1,y,'Tipo',a.tipo||''); y+=7;
  doc.setDrawColor(200,212,227); doc.line(8,y-2,140,y-2); y+=2;
  if(a.descripcion){
    doc.setTextColor(74,96,128); doc.setFontSize(7.5); doc.text('Observaciones:',col1,y); y+=5;
    doc.setTextColor(15,32,68); doc.setFontSize(8);
    const obs=doc.splitTextToSize(a.descripcion,130);
    doc.text(obs,col1,y); y+=obs.length*4+4;
  }
  // Precio
  if(a.precio){
    doc.setDrawColor(200,212,227); doc.line(8,y,140,y); y+=6;
    doc.setTextColor(74,96,128); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('PRECIO:',col1,y); doc.setTextColor(15,32,68); doc.text(fmtMoney(parseFloat(a.precio)||0)+' + IVA',col1+20,y); y+=8;
  }
  // Firma
  y=Math.max(y,155);
  doc.setDrawColor(200,212,227); doc.line(8,y,60,y); doc.line(80,y,140,y);
  y+=5;
  doc.setTextColor(74,96,128); doc.setFontSize(6.5); doc.setFont('helvetica','normal');
  doc.text('Firma / DNI',8,y); doc.text('Recibí conforme',80,y);
  // Barra inferior
  doc.setFillColor(240,180,41); doc.rect(0,204,W,4,'F');
  doc.save(`albaran-${a.num||a.id}.pdf`);
}

// ─── FACTURACIÓN ──────────────────────────────────────────────────
let factMode='proforma';
let factLineas=[];
let editFactId=null;
let conceptoGrupo='5m³';

const CONCEPTOS_GRUPOS={
  '5m³':[
    {label:'Cont. 5m³ Esc. Selec.',    precio:220, iva:10},
    {label:'Cont. 5m³ Esc. No Selec.', precio:280, iva:10},
    {label:'Cont. 5m³ Varios',          precio:340, iva:10},
    {label:'Cont. 5m³ Poda',            precio:260, iva:10},
    {label:'Cont. 5m³ Cartón',          precio:220, iva:10},
    {label:'Cont. 5m³ Madera',          precio:240, iva:10},
    {label:'Cont. 5m³ Metal',           precio:220, iva:10},
  ],
  '9m³':[
    {label:'Cont. 9m³ Varios',  precio:490, iva:10},
    {label:'Cont. 9m³ Poda',    precio:320, iva:10},
    {label:'Cont. 9m³ Madera',  precio:340, iva:10},
  ],
  '16m³':[
    {label:'Cont. 16m³ Varios', precio:910, iva:10},
    {label:'Cont. 16m³ Poda',   precio:540, iva:10},
    {label:'Cont. 16m³ Madera', precio:560, iva:10},
  ],
  'Otros':[
    {label:'Retirada Saca (1 ud.)',             precio:80,  iva:10},
    {label:'Retirada Saca (2+ ud.) / ud.',      precio:70,  iva:10},
    {label:'Gestión Tasa Ayuntamiento',         precio:30,  iva:21},
    {label:'Certificado Gestión Residuos',      precio:60,  iva:21},
  ],
};
function renderQBtns(){
  const wrap=document.getElementById('quick-btns-list');
  if(!wrap) return;
  const items=CONCEPTOS_GRUPOS[conceptoGrupo]||[];
  wrap.innerHTML=items.map(q=>
    `<button class="qbtn" data-action="add-concepto" data-label="${q.label}" data-precio="${q.precio}" data-iva="${q.iva}">
      <span class="qbtn-name">${q.label}</span>
      <span class="qbtn-price">${fmtMoney(q.precio)} + IVA</span>
    </button>`).join('');
}
let factQ='';
let facturasView='proformas'; // 'proformas' | 'facturas' — pestaña por defecto dentro de Facturación
// Una factura (no proforma) se considera "vencida" a partir de 30 días desde su fecha de
// emisión y sin cobrar — igual que el listado de deudores en papel que ya llevaba el usuario.
// A partir de 60 días sin cobrar se considera "muy vencida" (segundo nivel, más grave) — mismo
// criterio de color (rojo 60+, naranja 30-59) que el listado en papel.
function facturaVencida(f){ return f.tipo==='factura'&&!f.cobrada&&daysSince(f.fecha)>=30; }
function facturaMuyVencida(f){ return f.tipo==='factura'&&!f.cobrada&&daysSince(f.fecha)>=60; }
// Cobros pendientes (pantalla y PDF) refleja SOLO el listado de deudores (Excel): las facturas
// creadas a mano en la app que no están en ese listado no se cuelan aquí (siguen en Facturación).
function facturasPendientesList(){ return facturas.filter(f=>f.tipo==='factura'&&!f.cobrada&&esFacturaFantasma(f)); }
// Facturas "fantasma": importadas del listado de deudores en papel, solo para llevar la cuenta
// de lo pendiente (sin líneas, sin NIF...), no documentos creados de verdad en la app. Se quedan
// fuera de la lista de Facturación (ver renderFacturas) pero siguen intactas en Cobros pendientes.
function esFacturaFantasma(f){ return f.notas==='Importada del listado de deudores en papel'; }
// ─── Importación puntual del listado de deudores en papel/Excel (una sola vez) ─────
// Si una factura con ese mismo id ya existe (p.ej. ya se había dado de alta desde la app),
// no se toca ni se duplica: esto solo AÑADE las que faltan.
const IMPORT_DEUDORES=[
  {id:'ld691',tipo:'factura',num:'691',cliente:'FAHUARAN',fecha:'2025-12-31',total:1067,base:1067,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld44',tipo:'factura',num:'44',cliente:'UTE CSPA',fecha:'2026-01-31',total:231,base:231,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld59',tipo:'factura',num:'59',cliente:'UTE CSPA',fecha:'2026-02-16',total:231,base:231,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld107',tipo:'factura',num:'107',cliente:'UTE CSPA',fecha:'2026-02-28',total:462,base:462,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld130',tipo:'factura',num:'130',cliente:'FERROVIAL SERVITRIA',fecha:'2026-03-15',total:946,base:946,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld151',tipo:'factura',num:'151',cliente:'SEKMAG',fecha:'2026-03-31',total:924,base:924,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld158',tipo:'factura',num:'158',cliente:'SEKMAG',fecha:'2026-03-31',total:231,base:231,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld189',tipo:'factura',num:'189',cliente:'FERROVIAL SERVITRIA',fecha:'2026-04-15',total:4411,base:4411,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld196',tipo:'factura',num:'196',cliente:'UTE CSPA',fecha:'2026-04-15',total:407,base:407,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CONFIRMING'},
  {id:'ld226',tipo:'factura',num:'226',cliente:'NOVALIGEPRO',fecha:'2026-04-30',total:1300.2,base:1300.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:''},
  {id:'ld257',tipo:'factura',num:'257',cliente:'FERROVIAL SERVITRIA',fecha:'2026-05-15',total:3135,base:3135,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:''},
  {id:'ld279',tipo:'factura',num:'279',cliente:'SEKMAG',fecha:'2026-05-31',total:1199,base:1199,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld281',tipo:'factura',num:'281',cliente:'SEKMAG',fecha:'2026-05-31',total:1221,base:1221,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld282',tipo:'factura',num:'282',cliente:'SEKMAG',fecha:'2026-05-31',total:1133,base:1133,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld295',tipo:'factura',num:'295',cliente:'UTE CSPA',fecha:'2026-05-31',total:550,base:550,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld329',tipo:'factura',num:'329',cliente:'FERROVIAL SERVITRIA',fecha:'2026-06-15',total:3289,base:3289,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld330',tipo:'factura',num:'330',cliente:'UTE CSPA',fecha:'2026-06-15',total:1705,base:1705,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld346',tipo:'factura',num:'346',cliente:'ESCLAPES',fecha:'2026-06-30',total:600.6,base:600.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld347',tipo:'factura',num:'347',cliente:'ESCLAPES',fecha:'2026-06-30',total:248.6,base:248.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld351',tipo:'factura',num:'351',cliente:'SEKMAG',fecha:'2026-06-30',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld352',tipo:'factura',num:'352',cliente:'SEKMAG',fecha:'2026-06-30',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld353',tipo:'factura',num:'353',cliente:'SEKMAG',fecha:'2026-06-30',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld354',tipo:'factura',num:'354',cliente:'SEKMAG',fecha:'2026-06-30',total:528,base:528,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld355',tipo:'factura',num:'355',cliente:'SEKMAG',fecha:'2026-06-30',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld356',tipo:'factura',num:'356',cliente:'SEKMAG',fecha:'2026-06-30',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld357',tipo:'factura',num:'357',cliente:'SEKMAG',fecha:'2026-06-30',total:1265,base:1265,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld358',tipo:'factura',num:'358',cliente:'SEKMAG',fecha:'2026-06-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld362',tipo:'factura',num:'362',cliente:'ESCLAPES',fecha:'2026-06-30',total:325.6,base:325.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld363',tipo:'factura',num:'363',cliente:'FERROVIAL SERVITRIA',fecha:'2026-06-30',total:2739,base:2739,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CHEQUE'},
  {id:'ld369',tipo:'factura',num:'369',cliente:'NOVALIGEPRO',fecha:'2026-06-30',total:904.2,base:904.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld370',tipo:'factura',num:'370',cliente:'NOVALIGEPRO',fecha:'2026-06-30',total:651.2,base:651.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld371',tipo:'factura',num:'371',cliente:'NOVALIGEPRO',fecha:'2026-06-30',total:464.2,base:464.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld372',tipo:'factura',num:'372',cliente:'NOVALIGEPRO',fecha:'2026-06-30',total:347.6,base:347.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld373',tipo:'factura',num:'373',cliente:'NOVALIGEPRO',fecha:'2026-06-30',total:325.6,base:325.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld374',tipo:'factura',num:'374',cliente:'UTE CSPA',fecha:'2026-06-30',total:1045,base:1045,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld379',tipo:'factura',num:'379',cliente:'SERVITRIA',fecha:'2026-06-30',total:1650,base:1650,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld399',tipo:'factura',num:'399',cliente:'FERROVIAL SERVITRIA',fecha:'2026-07-15',total:2024,base:2024,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld400',tipo:'factura',num:'400',cliente:'SERVITRIA',fecha:'2026-07-15',total:1716,base:1716,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld403',tipo:'factura',num:'403',cliente:'INGENIAR',fecha:'2026-07-15',total:145.2,base:145.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld410',tipo:'factura',num:'410',cliente:'SEKMAG',fecha:'2026-07-31',total:1012,base:1012,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld411',tipo:'factura',num:'411',cliente:'SEKMAG',fecha:'2026-07-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld412',tipo:'factura',num:'412',cliente:'SEKMAG',fecha:'2026-07-31',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld413',tipo:'factura',num:'413',cliente:'SEKMAG',fecha:'2026-07-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld414',tipo:'factura',num:'414',cliente:'SEKMAG',fecha:'2026-07-31',total:781,base:781,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld415',tipo:'factura',num:'415',cliente:'SEKMAG',fecha:'2026-07-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld416',tipo:'factura',num:'416',cliente:'SEKMAG',fecha:'2026-07-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld417',tipo:'factura',num:'417',cliente:'SEKMAG',fecha:'2026-07-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld418',tipo:'factura',num:'418',cliente:'SEKMAG',fecha:'2026-07-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld419',tipo:'factura',num:'419',cliente:'ESCLAPES',fecha:'2026-07-31',total:2345.2,base:2345.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld420',tipo:'factura',num:'420',cliente:'ESCLAPES',fecha:'2026-07-31',total:651.2,base:651.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld421',tipo:'factura',num:'421',cliente:'ESCLAPES',fecha:'2026-07-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld427',tipo:'factura',num:'427',cliente:'AKRA',fecha:'2026-07-31',total:418,base:418,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld428',tipo:'factura',num:'428',cliente:'AKRA',fecha:'2026-07-31',total:550,base:550,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld429',tipo:'factura',num:'429',cliente:'AKRA',fecha:'2026-07-31',total:1375,base:1375,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'PAGARÉ'},
  {id:'ld433',tipo:'factura',num:'433',cliente:'NOVALIGEPRO',fecha:'2026-07-31',total:347.6,base:347.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld436',tipo:'factura',num:'436',cliente:'SERVITRIA',fecha:'2026-07-31',total:1738,base:1738,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld437',tipo:'factura',num:'437',cliente:'FERROVIAL SERVITRIA',fecha:'2026-07-31',total:2783,base:2783,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CHEQUE'},
  {id:'ld438',tipo:'factura',num:'438',cliente:'SEGALCA',fecha:'2026-07-31',total:1227.6,base:1227.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld439',tipo:'factura',num:'439',cliente:'CARSAN',fecha:'2026-07-31',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld449',tipo:'factura',num:'449',cliente:'ALBAMORE',fecha:'2026-07-31',total:145.2,base:145.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld453',tipo:'factura',num:'453',cliente:'CUPOLA',fecha:'2026-08-14',total:652.31,base:652.31,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld455',tipo:'factura',num:'455',cliente:'SERVITRIA',fecha:'2026-08-15',total:1644.5,base:1644.5,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld456',tipo:'factura',num:'456',cliente:'CARSAN',fecha:'2026-08-15',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld457',tipo:'factura',num:'457',cliente:'FERROVIAL SERVITRIA',fecha:'2026-08-15',total:2024,base:2024,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:true,metodoPago:'CHEQUE'},
  {id:'ld458',tipo:'factura',num:'458',cliente:'UTE CSPA',fecha:'2026-08-15',total:1034,base:1034,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld460',tipo:'factura',num:'460',cliente:'SEKMAG',fecha:'2026-08-31',total:1012,base:1012,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld461',tipo:'factura',num:'461',cliente:'SEKMAG',fecha:'2026-08-31',total:495,base:495,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld462',tipo:'factura',num:'462',cliente:'SEKMAG',fecha:'2026-08-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld463',tipo:'factura',num:'463',cliente:'SEKMAG',fecha:'2026-08-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld464',tipo:'factura',num:'464',cliente:'SEKMAG',fecha:'2026-08-31',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld465',tipo:'factura',num:'465',cliente:'SEKMAG',fecha:'2026-08-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld466',tipo:'factura',num:'466',cliente:'SEKMAG',fecha:'2026-08-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld467',tipo:'factura',num:'467',cliente:'SEKMAG',fecha:'2026-08-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld468',tipo:'factura',num:'468',cliente:'NOVALIGEPRO',fecha:'2026-08-31',total:904.2,base:904.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld469',tipo:'factura',num:'469',cliente:'NOVALIGEPRO',fecha:'2026-08-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld470',tipo:'factura',num:'470',cliente:'NOVALIGEPRO',fecha:'2026-08-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld471',tipo:'factura',num:'471',cliente:'NOVALIGEPRO',fecha:'2026-08-31',total:1707.2,base:1707.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld472',tipo:'factura',num:'472',cliente:'NOVALIGEPRO',fecha:'2026-08-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld473',tipo:'factura',num:'473',cliente:'CYTEM',fecha:'2026-08-31',total:2585,base:2585,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld474',tipo:'factura',num:'474',cliente:'ESCLAPES',fecha:'2026-08-31',total:673.2,base:673.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld475',tipo:'factura',num:'475',cliente:'ESCLAPES',fecha:'2026-08-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld476',tipo:'factura',num:'476',cliente:'ESCLAPES',fecha:'2026-08-31',total:1080.2,base:1080.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld477',tipo:'factura',num:'477',cliente:'AKRA',fecha:'2026-08-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld478',tipo:'factura',num:'478',cliente:'AKRA',fecha:'2026-08-31',total:550,base:550,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld481',tipo:'factura',num:'481',cliente:'CUPOLA',fecha:'2026-08-31',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld482',tipo:'factura',num:'482',cliente:'UTE CSPA',fecha:'2026-08-31',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld483',tipo:'factura',num:'483',cliente:'FERROVIAL SERVITRIA',fecha:'2026-08-31',total:2024,base:2024,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld484',tipo:'factura',num:'484',cliente:'CARSAN',fecha:'2026-08-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld485',tipo:'factura',num:'485',cliente:'NEW ON CT',fecha:'2026-08-31',total:528,base:528,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld489',tipo:'factura',num:'489',cliente:'SERVITRIA',fecha:'2026-08-31',total:145.2,base:145.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
];
function importarDeudoresLocal(){
  let cambiado=false;
  IMPORT_DEUDORES.forEach(r=>{
    if(facturas.some(f=>f.id===r.id)) return;
    facturas.push({...r});
    cambiado=true;
  });
  return cambiado;
}
// Repite la misma comprobación directamente contra Firestore: así, en cuanto UN dispositivo
// con conexión abra la app ya actualizada, el listado de deudores queda en la nube y todos los
// demás dispositivos lo reciben solos al sincronizar, sin tocar nada a mano.
function importarDeudoresNube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_import_deudores_v1')) return Promise.resolve();
  return fbDb.collection('facturas').get().then(snap=>{
    const existentes=new Set(); snap.forEach(d=>existentes.add(d.id));
    const nuevos=IMPORT_DEUDORES.filter(r=>!existentes.has(r.id));
    const escrituras=nuevos.map(r=>fbDb.collection('facturas').doc(r.id).set(r).catch(e=>console.error('Error importando deudor '+r.id+':',e)));
    return Promise.all(escrituras).then(()=>{ localStorage.setItem('garvi_import_deudores_v1','1'); });
  }).catch(e=>{ console.error('Error comprobando deudores existentes en la nube:',e); return 0; });
}
// ─── ACTUALIZACIÓN DEL LISTADO DE DEUDORES (revisado hasta el 10/09) ─────
// Segunda pasada del mismo listado en papel, ya con el "garvi_import_deudores_v1" puesto (así que
// importarDeudoresLocal/Nube ya no vuelven a correr) — por eso hace falta un segundo flag e igual
// mecanismo: añade las facturas nuevas que aparecen en esta revisión y marca como cobradas las que
// ya NO aparecen (el listado en papel solo recoge lo pendiente: si una factura desaparece es que
// se cobró). Para las que siguen apareciendo en ambas revisiones no se toca avisado/metodoPago,
// por si ya se han actualizado a mano desde la pantalla de Cobros pendientes.
const NUEVOS_DEUDORES_OCT=[
  {id:'ld498',tipo:'factura',num:'498',cliente:'UTE CSPA',fecha:'2026-09-03',total:3798.3,base:3798.3,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld511',tipo:'factura',num:'511',cliente:'CARSAN',fecha:'2026-09-15',total:1144,base:1144,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld512',tipo:'factura',num:'512',cliente:'FERROVIAL SERVITRIA',fecha:'2026-09-15',total:2915,base:2915,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld513',tipo:'factura',num:'513',cliente:'SERVITRIA',fecha:'2026-09-15',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld514',tipo:'factura',num:'514',cliente:'UTE CSPA',fecha:'2026-09-15',total:803,base:803,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld515',tipo:'factura',num:'515',cliente:'ARENA ALICANTE CIPRES',fecha:'2026-09-15',total:352,base:352,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld528',tipo:'factura',num:'528',cliente:'CYTEM',fecha:'2026-09-30',total:3190,base:3190,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld529',tipo:'factura',num:'529',cliente:'ESCLAPES',fecha:'2026-09-30',total:464.2,base:464.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld530',tipo:'factura',num:'530',cliente:'ESCLAPES',fecha:'2026-09-30',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld531',tipo:'factura',num:'531',cliente:'ESCLAPES',fecha:'2026-09-30',total:347.6,base:347.6,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld532',tipo:'factura',num:'532',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld533',tipo:'factura',num:'533',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld534',tipo:'factura',num:'534',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld535',tipo:'factura',num:'535',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld536',tipo:'factura',num:'536',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld537',tipo:'factura',num:'537',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld538',tipo:'factura',num:'538',cliente:'SEKMAG',fecha:'2026-09-30',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld539',tipo:'factura',num:'539',cliente:'SEKMAG',fecha:'2026-09-30',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld540',tipo:'factura',num:'540',cliente:'SEKMAG',fecha:'2026-09-30',total:1518,base:1518,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld541',tipo:'factura',num:'541',cliente:'SEKMAG',fecha:'2026-09-30',total:1012,base:1012,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld542',tipo:'factura',num:'542',cliente:'NOVALIGEPRO',fecha:'2026-09-30',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld543',tipo:'factura',num:'543',cliente:'NOVALIGEPRO',fecha:'2026-09-30',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld544',tipo:'factura',num:'544',cliente:'NOVALIGEPRO',fecha:'2026-09-30',total:904.2,base:904.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld545',tipo:'factura',num:'545',cliente:'NOVALIGEPRO',fecha:'2026-09-30',total:651.2,base:651.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld546',tipo:'factura',num:'546',cliente:'AKRA',fecha:'2026-09-30',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld547',tipo:'factura',num:'547',cliente:'AKRA',fecha:'2026-09-30',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld548',tipo:'factura',num:'548',cliente:'AKRA',fecha:'2026-09-30',total:825,base:825,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld549',tipo:'factura',num:'549',cliente:'CUPOLA',fecha:'2026-09-30',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld550',tipo:'factura',num:'550',cliente:'FERROVIAL SERVITRIA',fecha:'2026-09-30',total:2277,base:2277,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld551',tipo:'factura',num:'551',cliente:'SERVITRIA',fecha:'2026-09-30',total:550,base:550,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld552',tipo:'factura',num:'552',cliente:'CARSAN',fecha:'2026-09-30',total:1012,base:1012,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld553',tipo:'factura',num:'553',cliente:'UTE CSPA',fecha:'2026-09-30',total:528,base:528,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld556',tipo:'factura',num:'556',cliente:'NEW ON CT',fecha:'2026-09-30',total:264,base:264,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
];
// Facturas del listado anterior que ya NO aparecen en esta revisión -> se dan por cobradas.
const PAGADOS_DEUDORES_OCT=['ld279','ld281','ld282','ld346','ld347','ld351','ld352','ld353','ld354','ld355','ld356','ld357','ld362','ld400','ld419','ld420','ld421','ld427','ld428','ld429','ld436','ld458','ld468','ld469','ld470','ld471','ld472','ld473','ld481','ld483'];
function sincronizarDeudoresOctLocal(){
  let cambiado=false;
  NUEVOS_DEUDORES_OCT.forEach(r=>{
    if(facturas.some(f=>f.id===r.id)) return;
    facturas.push({...r});
    cambiado=true;
  });
  PAGADOS_DEUDORES_OCT.forEach(id=>{
    const f=facturas.find(x=>x.id===id);
    if(f&&!f.cobrada){ f.cobrada=true; f.fechaCobro=todayISO(); cambiado=true; }
  });
  return cambiado;
}
function sincronizarDeudoresOctNube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_sync_deudores_oct_v1')) return Promise.resolve();
  return fbDb.collection('facturas').get().then(snap=>{
    const existentes=new Map(); snap.forEach(d=>existentes.set(d.id,d.data()));
    const nuevos=NUEVOS_DEUDORES_OCT.filter(r=>!existentes.has(r.id));
    const escrituras=nuevos.map(r=>fbDb.collection('facturas').doc(r.id).set(r).catch(e=>console.error('Error sincronizando deudor '+r.id+':',e)));
    const hoy=todayISO();
    PAGADOS_DEUDORES_OCT.forEach(id=>{
      const data=existentes.get(id);
      if(data&&!data.cobrada){
        escrituras.push(fbDb.collection('facturas').doc(id).update({cobrada:true,fechaCobro:hoy}).catch(e=>console.error('Error marcando cobrado '+id+':',e)));
      }
    });
    return Promise.all(escrituras).then(()=>{ localStorage.setItem('garvi_sync_deudores_oct_v1','1'); });
  }).catch(e=>{ console.error('Error comprobando deudores en la nube para la actualización de octubre:',e); return 0; });
}
// ─── ACTUALIZACIÓN DEL LISTADO DE DEUDORES (revisado hasta el 04/11) ─────
// Tercera pasada del mismo listado en papel/Excel, con el mismo mecanismo que la de octubre:
// añade las facturas nuevas que aparecen en esta revisión y marca como cobradas las que ya NO
// aparecen. Para las que siguen apareciendo no se toca avisado/metodoPago (por si ya se
// actualizaron a mano desde Cobros pendientes).
const NUEVOS_DEUDORES_NOV=[
  {id:'ld581',tipo:'factura',num:'581',cliente:'CARSAN',fecha:'2026-10-15',total:1144,base:1144,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld582',tipo:'factura',num:'582',cliente:'FERROVIAL SERVITRIA',fecha:'2026-10-15',total:2530,base:2530,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld583',tipo:'factura',num:'583',cliente:'ARENA ALICANTE CIPRES',fecha:'2026-10-15',total:132,base:132,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld584',tipo:'factura',num:'584',cliente:'ARENA ALICANTE LOCUTOR',fecha:'2026-10-15',total:363,base:363,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld596',tipo:'factura',num:'596',cliente:'ESCLAPES',fecha:'2026-10-31',total:904.2,base:904.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld600',tipo:'factura',num:'600',cliente:'SEKMAG',fecha:'2026-10-31',total:759,base:759,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld601',tipo:'factura',num:'601',cliente:'SEKMAG',fecha:'2026-10-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld602',tipo:'factura',num:'602',cliente:'SEKMAG',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld603',tipo:'factura',num:'603',cliente:'SEKMAG',fecha:'2026-10-31',total:528,base:528,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld604',tipo:'factura',num:'604',cliente:'SEKMAG',fecha:'2026-10-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld605',tipo:'factura',num:'605',cliente:'SEKMAG',fecha:'2026-10-31',total:506,base:506,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld606',tipo:'factura',num:'606',cliente:'SEKMAG',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld607',tipo:'factura',num:'607',cliente:'SEKMAG',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld608',tipo:'factura',num:'608',cliente:'SEKMAG',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld609',tipo:'factura',num:'609',cliente:'SEKMAG',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld610',tipo:'factura',num:'610',cliente:'AKRA',fecha:'2026-10-31',total:1375,base:1375,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld611',tipo:'factura',num:'611',cliente:'AKRA',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld612',tipo:'factura',num:'612',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:904.2,base:904.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld613',tipo:'factura',num:'613',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:651.2,base:651.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld614',tipo:'factura',num:'614',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld615',tipo:'factura',num:'615',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:398.2,base:398.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld616',tipo:'factura',num:'616',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:6679.2,base:6679.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld617',tipo:'factura',num:'617',cliente:'NOVALIGEPRO',fecha:'2026-10-31',total:145.2,base:145.2,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld618',tipo:'factura',num:'618',cliente:'CYTEM',fecha:'2026-10-31',total:3355,base:3355,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld619',tipo:'factura',num:'619',cliente:'EDICAMP',fecha:'2026-10-31',total:36.3,base:36.3,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld620',tipo:'factura',num:'620',cliente:'CARSAN',fecha:'2026-10-31',total:253,base:253,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld621',tipo:'factura',num:'621',cliente:'ARENA ALICANTE CIPRES',fecha:'2026-10-31',total:495,base:495,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld622',tipo:'factura',num:'622',cliente:'UTE CSPA',fecha:'2026-10-31',total:550,base:550,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld623',tipo:'factura',num:'623',cliente:'SERVITRIA',fecha:'2026-10-31',total:275,base:275,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld624',tipo:'factura',num:'624',cliente:'NEW ON CT',fecha:'2026-10-31',total:4356,base:4356,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld625',tipo:'factura',num:'625',cliente:'FERROVIAL SERVITRIA',fecha:'2026-10-31',total:2530,base:2530,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
];
// Facturas del listado anterior que ya NO aparecen en esta revisión -> se dan por cobradas.
const PAGADOS_DEUDORES_NOV=['ld130','ld189','ld257','ld329','ld363','ld379','ld399','ld455','ld489','ld528','ld542','ld549'];
function sincronizarDeudoresNovLocal(){
  let cambiado=false;
  NUEVOS_DEUDORES_NOV.forEach(r=>{
    if(facturas.some(f=>f.id===r.id)) return;
    facturas.push({...r});
    cambiado=true;
  });
  PAGADOS_DEUDORES_NOV.forEach(id=>{
    const f=facturas.find(x=>x.id===id);
    if(f&&!f.cobrada){ f.cobrada=true; f.fechaCobro=todayISO(); cambiado=true; }
  });
  return cambiado;
}
function sincronizarDeudoresNovNube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_sync_deudores_nov_v1')) return Promise.resolve();
  return fbDb.collection('facturas').get().then(snap=>{
    const existentes=new Map(); snap.forEach(d=>existentes.set(d.id,d.data()));
    const nuevos=NUEVOS_DEUDORES_NOV.filter(r=>!existentes.has(r.id));
    const escrituras=nuevos.map(r=>fbDb.collection('facturas').doc(r.id).set(r).catch(e=>console.error('Error sincronizando deudor '+r.id+':',e)));
    const hoy=todayISO();
    PAGADOS_DEUDORES_NOV.forEach(id=>{
      const data=existentes.get(id);
      if(data&&!data.cobrada){
        escrituras.push(fbDb.collection('facturas').doc(id).update({cobrada:true,fechaCobro:hoy}).catch(e=>console.error('Error marcando cobrado '+id+':',e)));
      }
    });
    return Promise.all(escrituras).then(()=>{ localStorage.setItem('garvi_sync_deudores_nov_v1','1'); });
  }).catch(e=>{ console.error('Error comprobando deudores en la nube para la actualización de noviembre:',e); return 0; });
}
// ─── ACTUALIZACIÓN DEL LISTADO DE DEUDORES (revisado hasta el 16/11) ─────
// Cuarta pasada del mismo listado (LISTADO DEUDORES.xlsx), mismo mecanismo que las anteriores:
// añade las facturas nuevas, marca como cobradas las que ya NO aparecen y, para las que siguen,
// rellena PAGARÉ/CHEQUE (y 'avisado') SOLO si en la app el método estaba vacío, sin pisar lo que
// ya se hubiera puesto a mano desde Cobros pendientes.
const NUEVOS_DEUDORES_NOV16=[
  {id:'ld691',tipo:'factura',num:'691',cliente:'FAHUARAN',fecha:'2025-12-31',total:1067,base:1067,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld631',tipo:'factura',num:'631',cliente:'FERROVIAL SERVITRIA',fecha:'2026-11-15',total:2948,base:2948,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld632',tipo:'factura',num:'632',cliente:'CARSAN',fecha:'2026-11-15',total:891,base:891,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld633',tipo:'factura',num:'633',cliente:'NEW ON CT',fecha:'2026-11-15',total:9504,base:9504,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
  {id:'ld634',tipo:'factura',num:'634',cliente:'SERVITRIA',fecha:'2026-11-15',total:594,base:594,iva:0,nif:'',dir:'',telefono:'',email:'',notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:false,metodoPago:''},
];
// Facturas que el Excel sigue dando como pendientes pero que en la app figuraban cobradas (2025).
const REABIERTAS_DEUDORES_NOV16=['ld691'];
const PAGADOS_DEUDORES_NOV16=['ld44', 'ld59', 'ld107', 'ld151', 'ld158', 'ld196', 'ld295', 'ld330', 'ld358', 'ld374', 'ld410', 'ld411', 'ld412', 'ld414', 'ld416', 'ld417', 'ld437', 'ld439', 'ld456', 'ld457', 'ld474', 'ld475', 'ld476', 'ld477', 'ld478', 'ld482', 'ld484', 'ld485', 'ld498', 'ld514', 'ld556'];
const METODOS_DEUDORES_NOV16={'ld460': 'PAGARÉ', 'ld462': 'PAGARÉ', 'ld464': 'PAGARÉ', 'ld465': 'PAGARÉ', 'ld467': 'PAGARÉ', 'ld512': 'CHEQUE', 'ld529': 'PAGARÉ', 'ld530': 'PAGARÉ', 'ld531': 'PAGARÉ', 'ld535': 'PAGARÉ', 'ld537': 'PAGARÉ', 'ld538': 'PAGARÉ', 'ld539': 'PAGARÉ', 'ld540': 'PAGARÉ', 'ld546': 'PAGARÉ', 'ld547': 'PAGARÉ', 'ld548': 'PAGARÉ'};
function sincronizarDeudoresNov16Local(){
  let cambiado=false;
  NUEVOS_DEUDORES_NOV16.forEach(r=>{
    if(facturas.some(f=>f.id===r.id)) return;
    facturas.push({...r});
    cambiado=true;
  });
  REABIERTAS_DEUDORES_NOV16.forEach(id=>{
    const f=facturas.find(x=>x.id===id);
    if(f&&f.cobrada){ f.cobrada=false; f.fechaCobro=''; cambiado=true; }
  });
  PAGADOS_DEUDORES_NOV16.forEach(id=>{
    const f=facturas.find(x=>x.id===id);
    if(f&&!f.cobrada){ f.cobrada=true; f.fechaCobro=todayISO(); cambiado=true; }
  });
  Object.entries(METODOS_DEUDORES_NOV16).forEach(([id,m])=>{
    const f=facturas.find(x=>x.id===id);
    if(f&&!f.cobrada&&!f.metodoPago){ f.metodoPago=m; f.avisado=true; cambiado=true; }
  });
  return cambiado;
}
function sincronizarDeudoresNov16Nube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_sync_deudores_nov16_v1')) return Promise.resolve();
  return fbDb.collection('facturas').get().then(snap=>{
    const existentes=new Map(); snap.forEach(d=>existentes.set(d.id,d.data()));
    const nuevos=NUEVOS_DEUDORES_NOV16.filter(r=>!existentes.has(r.id));
    const escrituras=nuevos.map(r=>fbDb.collection('facturas').doc(r.id).set(r).catch(e=>console.error('Error sincronizando deudor '+r.id+':',e)));
    const hoy=todayISO();
    REABIERTAS_DEUDORES_NOV16.forEach(id=>{
      const data=existentes.get(id);
      if(data&&data.cobrada){
        escrituras.push(fbDb.collection('facturas').doc(id).update({cobrada:false,fechaCobro:''}).catch(e=>console.error('Error reabriendo '+id+':',e)));
      }
    });
    PAGADOS_DEUDORES_NOV16.forEach(id=>{
      const data=existentes.get(id);
      if(data&&!data.cobrada){
        escrituras.push(fbDb.collection('facturas').doc(id).update({cobrada:true,fechaCobro:hoy}).catch(e=>console.error('Error marcando cobrado '+id+':',e)));
      }
    });
    Object.entries(METODOS_DEUDORES_NOV16).forEach(([id,m])=>{
      const data=existentes.get(id);
      if(data&&!data.cobrada&&!data.metodoPago){
        escrituras.push(fbDb.collection('facturas').doc(id).update({metodoPago:m,avisado:true}).catch(e=>console.error('Error marcando método '+id+':',e)));
      }
    });
    return Promise.all(escrituras).then(()=>{ localStorage.setItem('garvi_sync_deudores_nov16_v1','1'); });
  }).catch(e=>{ console.error('Error comprobando deudores en la nube para la actualización del 16/11:',e); return 0; });
}
// ─── DATOS FISCALES Y CONCEPTOS DE CLIENTES, extraídos a mano de facturas en PDF (lote 1) ──
// El nombre de cada cliente es el mismo que ya se usa en contenedores/facturas de la app (p.ej.
// "SERVITRIA", "CYTEM", "CUPOLA", "ESCLAPES"...), NO el nombre fiscal largo que a veces aparece
// en la factura en PDF — si al facturar se usa normalmente el nombre largo en vez del corto,
// dímelo y se guarda también con esa clave.
const CLIENTES_FISCAL_LOTE1=[
  {nombre:'DESCON INSONORIZACION Y CONSTRUCCION, S.L',cif:'B54584081',dirFacturacion:'CALLE LOS TRANSPORTES 14. 03008 ALICANTE',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:160,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:220,iva:10},
    {desc:'Cont. 5m³ Poda',precio:220,iva:10},
  ]},
  {nombre:'NEW ON CT',alias:'NEW ON CT S.L.U.',cif:'B02603306',dirFacturacion:'C/ El Molino, 35 - Caudete - Albacete',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:190,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:240,iva:10},
  ]},
  {nombre:'UTE CSPA',alias:'UTE Centro de Salud Pública de Alicante',cif:'U70789508',dirFacturacion:'Ronda Auguste i Louis Lumiere, nº0 Portal 24 Parque Tecnológico 46980 Paterna (Valencia)',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:140,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Basura',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:220,iva:10},
    {desc:'Cont. 5m³ Plástico',precio:220,iva:10},
    {desc:'Cont. 5m³ Fibra',precio:250,iva:10},
  ]},
  {nombre:'CARSAN',alias:'Obras CARSAN 2002 SL',cif:'B30764807',dirFacturacion:'Calle la Paz 37 30366 el Algar Cartagena',conceptos:[
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
  ]},
  {nombre:'SERVITRIA',alias:'Infraestructura y Servicios Servitria, S.A.',cif:'A96367248',dirFacturacion:'C/. Jesus, 81 Entlo 46007 Valencia',conceptos:[
    {desc:'Cont. 5m³ Selecc.',precio:180,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
  ]},
  {nombre:'CIUDAD DE LA JUSTICIA DE ALICANTE - UTE',cif:'ESU72769425',dirFacturacion:'Ribera del Loira 42, 28042, MADRID',conceptos:[
    {desc:'Cont. 5m³ Selec.',precio:150,iva:10},
    {desc:'Cont. 5m³ No Selec.',precio:210,iva:10},
    {desc:'Cont. 5m³ Varios',precio:230,iva:10},
  ]},
  {nombre:'CUPOLA',alias:'Cupola construcción y restauración s.l',cif:'B54995675',dirFacturacion:'Avenida Saturno 1 03007 ALICANTE',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:160,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:170,iva:10},
  ]},
  {nombre:'AKRA',alias:'AKRA REHABILITACION, S.L.',cif:'B53967188',dirFacturacion:'Prolongación Rosa de los Vientos, 2 03007',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:150,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:170,iva:10},
    {desc:'Cont. 5m³ Poda',precio:170,iva:10},
  ]},
  {nombre:'NOVALIGEPRO',alias:'Novaligepro Sl.',cif:'B54720594',dirFacturacion:'AV. FEDERICO SOTO 20-2º PLANTA (03001 ALICANTE)',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:140,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:170,iva:10},
    {desc:'Cont. 5m³ Poda',precio:170,iva:10},
  ]},
  {nombre:'SEKMAG',alias:'SEKMAG TECNOLOGIES SL.',cif:'B54657242',dirFacturacion:'CALLE ROSA DE LOS VIENTOS 62, 03007 ALICANTE',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:140,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:220,iva:10},
    {desc:'Cont. 5m³ Poda',precio:220,iva:10},
  ]},
  {nombre:'ESCLAPES',alias:'ESCLAPÉS E HIJOS, S.L.',cif:'B03891983',dirFacturacion:'Avenida alcalde Lorenzo Carbonell, 61 03008 Alicante',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:160,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Varios',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:220,iva:10},
    {desc:'Cont. 5m³ Poda',precio:220,iva:10},
  ]},
  {nombre:'CYTEM',alias:'LABORATORIO DE CALIDAD Y TECNOLOGIA DE LOS MATERIALES S.L.',cif:'B98447063',dirFacturacion:'CALLE PEDRAPIQUERS, S/N POL.EL OLIVERAL FASE II 46190 RIBA-ROJA DE TURIA - (VALENCIA)',conceptos:[
    {desc:'Cont. 5m³ Esc. Selec.',precio:150,iva:10},
    {desc:'Cont. 5m³ Esc. No Selec.',precio:230,iva:10},
    {desc:'Cont. 5m³ Basura',precio:250,iva:10},
    {desc:'Cont. 5m³ Madera',precio:220,iva:10},
    {desc:'Cont. 5m³ Poda',precio:220,iva:10},
  ]},
];
// Solo rellena lo que esté vacío — nunca pisa un dato que el usuario ya hubiera puesto a mano
// (NIF, dirección o conceptos) desde la ficha del cliente.
function mezclaClienteFiscal(actual,c){
  const data={};
  if(!actual.dirFacturacion&&c.dirFacturacion) data.dirFacturacion=c.dirFacturacion;
  if(!actual.cif&&c.cif) data.cif=c.cif;
  if(!(actual.conceptos&&actual.conceptos.length)&&c.conceptos) data.conceptos=c.conceptos;
  return data;
}
// Cada cliente puede guardarse bajo dos claves: 'nombre' (el nombre corto, el que ya se usa para
// avisos/cobros pendientes/listado) y 'alias' (el nombre fiscal largo, el que se escribe en la
// factura definitiva) — ambos con los mismos CIF/dirección/conceptos, para que el autocompletado
// funcione se escriba cual se escriba.
function clavesClienteFiscal(c){ return c.alias?[c.nombre,c.alias]:[c.nombre]; }
function aplicarClienteFiscalLote1Local(){
  if(localStorage.getItem('garvi_cliente_fiscal_lote1_v1')) return;
  const m=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}');
  CLIENTES_FISCAL_LOTE1.forEach(c=>{
    clavesClienteFiscal(c).forEach(clave=>{
      const data=mezclaClienteFiscal(m[clave]||{},c);
      if(Object.keys(data).length) m[clave]={...(m[clave]||{}),...data};
    });
  });
  localStorage.setItem('garvi_clientes_extra',JSON.stringify(m));
  localStorage.setItem('garvi_cliente_fiscal_lote1_v1','1');
}
function aplicarClienteFiscalLote1Nube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_cliente_fiscal_lote1_nube_v1')) return Promise.resolve();
  return fbDb.collection('config').doc('clientes_extra').get().then(doc=>{
    const m=doc.exists?doc.data():{};
    CLIENTES_FISCAL_LOTE1.forEach(c=>{
      clavesClienteFiscal(c).forEach(clave=>{
        const data=mezclaClienteFiscal(m[clave]||{},c);
        if(Object.keys(data).length) m[clave]={...(m[clave]||{}),...data};
      });
    });
    return fbDb.collection('config').doc('clientes_extra').set(m);
  }).then(()=>localStorage.setItem('garvi_cliente_fiscal_lote1_nube_v1','1'))
  .catch(e=>{ console.error('Error aplicando datos fiscales de clientes en la nube:',e); });
}
// Corrección puntual: la factura 550 se importó del listado de deudores en papel a nombre de
// "FERROVIAL SERVITRIA" (así la apuntaban a mano), pero la factura real en PDF es a nombre de
// "CIUDAD DE LA JUSTICIA DE ALICANTE - UTE" — se corrige el cliente de esa factura ya importada.
function corregirCliente550Local(){
  if(localStorage.getItem('garvi_fix_ld550_v1')) return false;
  const f=facturas.find(x=>x.id==='ld550');
  if(f) f.cliente='CIUDAD DE LA JUSTICIA DE ALICANTE - UTE';
  localStorage.setItem('garvi_fix_ld550_v1','1');
  return !!f;
}
function corregirCliente550Nube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_fix_ld550_nube_v1')) return Promise.resolve();
  return fbDb.collection('facturas').doc('ld550').update({cliente:'CIUDAD DE LA JUSTICIA DE ALICANTE - UTE'})
    .then(()=>localStorage.setItem('garvi_fix_ld550_nube_v1','1'))
    .catch(e=>{ console.error('Error corrigiendo cliente de ld550:',e); });
}
// Ajuste manual del correlativo de proformas/facturas (p.ej. para que la numeración de la app
// siga a partir de donde se quedó el Excel al pasar a usar esto como definitivo).
function ajustarNumeracionModal(){
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">🔢 Numeración</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <p style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Pon el último número YA USADO (p.ej. en tu Excel) — la siguiente proforma o factura que crees en la app seguirá a partir de ahí.</p>
    <div class="form-row cols2">
      <div><label>Última proforma (P-)</label><input id="num-ultima-prof" type="number" min="0" value="${cfg.ultimaProf||0}"></div>
      <div><label>Última factura (F-)</label><input id="num-ultima-fact" type="number" min="0" value="${cfg.ultimaFact||0}"></div>
    </div>
    <div id="num-preview" style="font-size:11.5px;color:var(--muted);margin:6px 0 14px">
      Próxima proforma: <strong>P-${String((cfg.ultimaProf||0)+1).padStart(3,'0')}</strong> · Próxima factura: <strong>F-${String((cfg.ultimaFact||0)+1).padStart(3,'0')}</strong>
    </div>
    <button class="btn btn-primary btn-full" data-action="guardar-numeracion">Guardar</button>`;
  document.getElementById('modal-overlay').classList.add('open');
  const refrescar=()=>{
    const prof=Number(document.getElementById('num-ultima-prof').value)||0;
    const fact=Number(document.getElementById('num-ultima-fact').value)||0;
    const el=document.getElementById('num-preview');
    if(el) el.innerHTML=`Próxima proforma: <strong>P-${String(prof+1).padStart(3,'0')}</strong> · Próxima factura: <strong>F-${String(fact+1).padStart(3,'0')}</strong>`;
  };
  document.getElementById('num-ultima-prof').addEventListener('input',refrescar);
  document.getElementById('num-ultima-fact').addEventListener('input',refrescar);
}
function guardarNumeracion(){
  cfg.ultimaProf=Number(document.getElementById('num-ultima-prof').value)||0;
  cfg.ultimaFact=Number(document.getElementById('num-ultima-fact').value)||0;
  saveCfg(); syncCfg(); closeModal(); toastMsg('Numeración actualizada ✓');
}
function renderFacturas(){
  const sec=document.getElementById('sec-facturas');
  // La sección Facturación solo muestra lo creado de verdad en la app (con "+ Nueva"): las
  // facturas "fantasma" importadas del listado de deudores en papel (sin líneas, sin NIF, solo
  // para llevar la cuenta de lo pendiente) se quedan fuera de aquí — siguen viéndose y
  // funcionando igual en Cobros pendientes, que es su sitio.
  const facturasReales=facturas.filter(f=>!esFacturaFantasma(f));
  const profList=facturasReales.filter(f=>f.tipo==='proforma');
  const factList=facturasReales.filter(f=>f.tipo==='factura');
  const totalFacturado=facturasReales.reduce((s,f)=>s+f.total,0);
  const totalVista=(facturasView==='proformas'?profList:factList).reduce((s,f)=>s+f.total,0);
  const fq=factQ.toLowerCase();
  const filtFacturas=facturasReales.filter(f=>f.tipo===(facturasView==='proformas'?'proforma':'factura'))
    .filter(f=>!fq||(f.cliente||'').toLowerCase().includes(fq)||(f.num||'').toLowerCase().includes(fq));
  const listaHtml=[...filtFacturas].reverse().map(f=>{
    const vencida=facturaVencida(f);
    const estadoTag=f.tipo==='factura'?(f.cobrada?' · <span style="color:#166534;font-weight:700">Cobrada</span>':vencida?' · <span style="color:#991b1b;font-weight:700">Vencida</span>':''):'';
    return `
    <div class="factura-item" data-action="ver-factura" data-param="${f.id}">
      <span class="fact-badge ${f.tipo==='proforma'?'fact-badge-p':'fact-badge-f'}">${f.num}</span>
      <div class="fact-info">
        <div class="fact-cliente">${f.cliente}</div>
        <div class="fact-meta">${fmtDate(f.fecha)}${f.vencimiento?' · Vence: '+fmtDate(f.vencimiento):''}${f.tipo==='proforma'?' · Proforma':' · Factura'}${estadoTag}</div>
      </div>
      <div>
        <div class="fact-total">${fmtMoney(f.total)}</div>
        <div style="display:flex;gap:4px;margin-top:4px;justify-content:flex-end">
          <button class="btn btn-secondary btn-sm" data-action="pdf-factura" data-param="${f.id}" style="padding:3px 8px;font-size:11px">PDF</button>
          ${f.tipo==='proforma'?`<button class="btn btn-primary btn-sm" data-action="hacer-factura" data-param="${f.id}" style="padding:3px 8px;font-size:11px">🧾 Hacer factura</button>`:''}
          ${f.email?`<a href="mailto:${f.email}?subject=${encodeURIComponent('Factura '+f.num+' - Garvi Recycling Systems')}&body=${encodeURIComponent('Adjuntamos '+f.num+'.\n\nGarvi Recycling Systems, S.L.U. · Tel: 687759465')}" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px">✉</a>`:''}
          ${f.telefono?`<a href="https://wa.me/34${f.telefono.replace(/\D/g,'')}" target="_blank" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px">${ICO_WA} WA</a>`:''}
          <button class="btn btn-danger btn-sm" data-action="del-factura" data-param="${f.id}" style="padding:3px 8px;font-size:11px">🗑</button>
        </div>
      </div>
    </div>`;}).join('');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="section-title">Facturación</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" data-action="pdf-facturas">📄 Crear PDF</button>
          <button class="btn btn-secondary btn-sm" data-action="ajustar-numeracion" title="Ver/cambiar el próximo número de proforma y factura">🔢</button>
          <button class="btn btn-primary btn-sm" data-action="nueva-factura">+ Nueva</button>
        </div>
      </div>
      <div class="fact-toggle">
        <button class="fact-toggle-btn ${facturasView==='proformas'?'active':''}" data-action="facturas-view" data-param="proformas">📄 Proformas (${profList.length})</button>
        <button class="fact-toggle-btn ${facturasView==='facturas'?'active':''}" data-action="facturas-view" data-param="facturas">🧾 Facturas (${factList.length})</button>
      </div>
      <div style="display:flex;gap:12px;font-size:13px;color:var(--muted);flex-wrap:wrap;margin-bottom:10px">
        <span>${filtFacturas.length} ${facturasView==='proformas'?'proformas':'facturas'}</span>
        <span style="margin-left:auto;color:var(--accent);font-weight:700;font-family:'DM Mono',monospace">${fmtMoney(totalVista)}</span>
      </div>
      <input class="search-input" id="fact-search" type="search" placeholder="Buscar cliente o número…" value="${factQ}">
    </div>
    ${listaHtml||`<div class="empty-state"><div class="icon">🧾</div>Sin ${facturasView==='proformas'?'proformas':'facturas'} aún. Pulsa + Nueva para crear.</div>`}`;
  document.getElementById('fact-search').addEventListener('input',e=>{factQ=e.target.value;reFocusInput('fact-search',renderFacturas);});
}
