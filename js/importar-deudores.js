// ─── IMPORTAR LISTADO DE DEUDORES DESDE EXCEL ─────────────────────────────
// Botón "📥 Importar Excel" de Cobros pendientes. Lee el LISTADO DEUDORES.xlsx (columnas:
// AVISADO · CLIENTE · NºFAC · FECHA · IMPORTE), lo compara con lo que la app tiene pendiente y
// enseña un RESUMEN antes de tocar nada:
//   · Nuevas        -> facturas del Excel que la app no tiene (se añaden como pendientes)
//   · Cobradas      -> pendientes en la app que YA NO están en el Excel (se dan por cobradas)
//   · Reabiertas    -> figuran cobradas en la app pero siguen en el Excel (vuelven a pendiente)
//   · Importe       -> mismo nº de factura con importe distinto (se actualiza)
//   · Método        -> PAGARÉ/CHEQUE/CONFIRMING del Excel donde la app lo tenía vacío
// Solo se aplica al pulsar "Aplicar". Las facturas creadas a mano en la app no se tocan.
let importDeudoresPlan=null;

function cargarSheetJS(){
  return new Promise((ok,ko)=>{
    if(window.XLSX) return ok();
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=()=>ok();
    s.onerror=()=>ko(new Error('No se pudo cargar el lector de Excel (¿sin conexión?)'));
    document.head.appendChild(s);
  });
}
function normCab(t){return String(t==null?'':t).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function fechaExcelAISO(v){
  if(v instanceof Date&&!isNaN(v)) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
  if(typeof v==='number'&&v>20000) return new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5).toISOString().slice(0,10);
  const t=String(v||'').trim();
  let m=t.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[1]+'-'+m[2]+'-'+m[3];
  m=t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(m){ const y=m[3].length===2?'20'+m[3]:m[3]; return y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'); }
  return '';
}
function metodoExcel(v){
  const t=normCab(v);
  if(!t) return '';
  if(t.startsWith('PAGAR')) return 'PAGARÉ';
  if(t.startsWith('CHEQUE')) return 'CHEQUE';
  if(t.startsWith('CONFIRM')) return 'CONFIRMING';
  return '';
}
// rows: matriz de celdas (como sale de sheet_to_json con header:1). Devuelve {filas, avisos}.
function leerListadoDeudores(rows){
  let hi=rows.findIndex(r=>Array.isArray(r)&&r.some(c=>normCab(c)==='CLIENTE'));
  if(hi<0) throw new Error('No encuentro la fila de cabecera (CLIENTE · NºFAC · FECHA · IMPORTE)');
  const cab=rows[hi].map(normCab);
  const col=fn=>cab.findIndex(fn);
  const cCli=col(c=>c==='CLIENTE');
  const cNum=col(c=>['NFAC','NUMFAC','NFACTURA','NUMFACTURA','NUMERO','NUM','FACTURA'].includes(c));
  const cFec=col(c=>c==='FECHA');
  const cImp=col(c=>c.startsWith('IMPORTE')||c==='TOTAL');
  const cMet=col(c=>c==='AVISADO');
  if(cNum<0||cFec<0||cImp<0) throw new Error('Faltan columnas: se esperan NºFAC, FECHA e IMPORTE');
  const filas=[], avisos=[], vistos=new Set();
  for(let i=hi+1;i<rows.length;i++){
    const r=rows[i]||[];
    const cliente=String(r[cCli]==null?'':r[cCli]).trim();
    const rawNum=r[cNum];
    if(!cliente&&(rawNum===undefined||rawNum==='')) continue;
    const num=String(rawNum==null?'':rawNum).trim().replace(/\.0+$/,'');
    const total=Math.round(Number(String(r[cImp]).replace(',','.'))*100)/100;
    const fecha=fechaExcelAISO(r[cFec]);
    if(!cliente||!num||!isFinite(total)||!fecha){ avisos.push('Fila '+(i+1)+' ignorada (datos incompletos)'); continue; }
    if(vistos.has(num)){ avisos.push('Factura '+num+' repetida en el Excel: se usa la primera'); continue; }
    vistos.add(num);
    filas.push({num,cliente,fecha,total,metodo:cMet>=0?metodoExcel(r[cMet]):''});
  }
  if(!filas.length) throw new Error('El Excel no tiene ninguna factura reconocible');
  return {filas,avisos};
}
function planImportDeudores(filas){
  const existentes=new Map(facturas.filter(f=>f.tipo==='factura'&&esFacturaFantasma(f)).map(f=>[f.id,f]));
  const enExcel=new Set(filas.map(r=>'ld'+r.num));
  const plan={filas,nuevas:[],reabrir:[],importe:[],metodo:[],cobradas:[]};
  filas.forEach(r=>{
    const f=existentes.get('ld'+r.num);
    if(!f){ plan.nuevas.push(r); return; }
    if(f.cobrada){ plan.reabrir.push({r,f}); return; }
    if(Math.abs((f.total||0)-r.total)>0.005) plan.importe.push({r,f});
    if(r.metodo&&!f.metodoPago) plan.metodo.push({r,f});
  });
  plan.cobradas=[...existentes.values()].filter(f=>!f.cobrada&&!enExcel.has(f.id));
  plan.pendientesAntes=[...existentes.values()].filter(f=>!f.cobrada).length;
  return plan;
}
function elegirExcelDeudores(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='.xlsx,.xls';
  inp.onchange=()=>{ if(inp.files&&inp.files[0]) procesarExcelDeudores(inp.files[0]); };
  inp.click();
}
function procesarExcelDeudores(file){
  toastMsg('Leyendo Excel…');
  cargarSheetJS().then(()=>file.arrayBuffer()).then(buf=>{
    const wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});
    const {filas,avisos}=leerListadoDeudores(rows);
    importDeudoresPlan=planImportDeudores(filas);
    importDeudoresPlan.avisos=avisos;
    importDeudoresPlan.archivo=file.name;
    mostrarResumenImportDeudores();
  }).catch(e=>{ console.error(e); toastMsg('No se pudo leer el Excel: '+(e.message||e)); });
}
function mostrarResumenImportDeudores(){
  const p=importDeudoresPlan; if(!p) return;
  const h=escHtmlCal;
  const suma=a=>fmtMoney(a.reduce((s,x)=>s+(x.total||0),0));
  const bloque=(titulo,color,items,fmt)=>items.length?`
    <div style="margin-top:12px">
      <div style="font-size:12px;font-weight:800;color:${color}">${titulo} (${items.length})</div>
      <div style="max-height:130px;overflow:auto;border:1px solid var(--border2);border-radius:8px;margin-top:4px">
        ${items.map(x=>`<div style="font-size:12px;padding:4px 8px;border-bottom:1px solid var(--border2)">${fmt(x)}</div>`).join('')}
      </div></div>`:'';
  const fila=(num,cli,imp)=>`<b>${h(num)}</b> · ${h(cli)} · ${fmtMoney(imp)}`;
  const totalExcel=p.filas.reduce((s,r)=>s+r.total,0);
  const hayCambios=p.nuevas.length||p.reabrir.length||p.importe.length||p.metodo.length||p.cobradas.length;
  const aviso=p.cobradas.length>10&&p.cobradas.length>p.pendientesAntes*0.5
    ?`<div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:8px 10px;font-size:12px;margin-top:10px">⚠️ Se darían por cobradas <b>${p.cobradas.length}</b> de ${p.pendientesAntes} facturas pendientes. Comprueba que es el Excel correcto y está completo.</div>`:'';
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Importar listado de deudores</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div style="font-size:12px;color:var(--muted)">${h(p.archivo)} · ${p.filas.length} facturas · ${fmtMoney(totalExcel)}</div>
    ${aviso}
    ${hayCambios?'':'<div class="empty-state" style="padding:16px 0">La app ya coincide con este Excel. No hay nada que cambiar ✓</div>'}
    ${bloque('➕ Facturas nuevas','#15803d',p.nuevas,r=>fila(r.num,r.cliente,r.total)+' · '+fmtDate(r.fecha)+(r.metodo?' · '+h(r.metodo):''))}
    ${bloque('✅ Pasan a cobradas (ya no están en el Excel)','#1d4ed8',p.cobradas,f=>fila(f.num,f.cliente,f.total))}
    ${bloque('↩️ Se reabren (estaban cobradas pero siguen en el Excel)','#c2410c',p.reabrir,x=>fila(x.f.num,x.f.cliente,x.r.total))}
    ${bloque('✏️ Importe distinto','#a16207',p.importe,x=>fila(x.f.num,x.f.cliente,x.r.total)+' <span style="color:var(--muted)">(antes '+fmtMoney(x.f.total)+')</span>')}
    ${bloque('📝 Método de pago a rellenar','#6d28d9',p.metodo,x=>fila(x.f.num,x.f.cliente,x.r.total)+' → '+h(x.r.metodo))}
    ${p.avisos.length?`<div style="font-size:11px;color:var(--muted);margin-top:10px">${p.avisos.map(h).join('<br>')}</div>`:''}
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-secondary btn-full" data-action="close-modal">Cancelar</button>
      ${hayCambios?'<button class="btn btn-primary btn-full" data-action="aplicar-import-deudores">Aplicar cambios</button>':''}
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function aplicarImportDeudores(){
  const p=importDeudoresPlan; if(!p) return;
  const hoy=todayISO(), tocadas=[];
  p.nuevas.forEach(r=>{
    const f={id:'ld'+r.num,tipo:'factura',num:r.num,cliente:r.cliente,fecha:r.fecha,total:r.total,base:r.total,iva:0,nif:'',dir:'',telefono:'',email:'',
      notas:'Importada del listado de deudores en papel',lineas:[],vencimiento:'',cobrada:false,fechaCobro:'',avisado:!!r.metodo,metodoPago:r.metodo||''};
    facturas.push(f); tocadas.push(f);
  });
  p.cobradas.forEach(f=>{ f.cobrada=true; f.fechaCobro=hoy; tocadas.push(f); });
  p.reabrir.forEach(({f})=>{ f.cobrada=false; f.fechaCobro=''; tocadas.push(f); });
  p.importe.forEach(({r,f})=>{ f.total=r.total; f.base=r.total; tocadas.push(f); });
  p.metodo.forEach(({r,f})=>{ f.metodoPago=r.metodo; f.avisado=true; tocadas.push(f); });
  saveFacturas();
  [...new Set(tocadas)].forEach(f=>syncFacturasCol.guardar(f));
  importDeudoresPlan=null;
  closeModal(); renderCobrosPendientes(); updateBadge();
  toastMsg('Listado importado ✓ ('+new Set(tocadas).size+' facturas actualizadas)');
}
