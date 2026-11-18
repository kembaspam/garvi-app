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
// (Las listas de deudores ya no van incrustadas en el código: se importan desde el Excel con
// el botón 📥 Importar Excel de Cobros pendientes — ver js/importar-deudores.js)
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
