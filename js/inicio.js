// ─── INICIO (CALENDARIO + AGENDA) ──────────────────────────────────
const AVISO_CFG={
  llevada:{label:'Llevada',color:'#1a3a8f'},
  cambio:{label:'Cambio',color:'#d97706'},
  carga_rapida:{label:'Carga Rápida',color:'#db2777'},
  retirada:{label:'Retirada',color:'#dc2626'},
  permiso:{label:'Llevada Permiso',color:'#7c3aed'},
  renovacion:{label:'Renovación Permiso',color:'#0891b2'},
  tarea:{label:'Tarea',color:'#16a34a'},
};
// Letra corta para los círculos de "unidad pendiente" de un aviso (ver renderAvisoCard) — en vez
// de un número, así se ve de un vistazo de qué tipo es cada una.
const AVISO_LETRA={llevada:'LL',cambio:'C',carga_rapida:'CR',retirada:'R',permiso:'P',renovacion:'REN',tarea:'T'};
const AVISO_INFO_DEFECTO='Confirmar Dirección, Indicar tipo de Residuo y Limite de hasta donde se puede Cargar el contenedor';
function renderInicio(){
  const sec=document.getElementById('sec-inicio');
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <div class="section-title">Inicio</div>
        <div id="sync-status" class="sync-status"></div>
      </div>
    </div>
    <div class="inicio-layout">
      <div class="card" style="padding:16px">
        <div class="cal-search-row${calSearchOpen?' open':''}" id="cal-search-row">
          <input id="cal-search-inp" type="search" placeholder="Buscar aviso (cliente, dirección, teléfono, nota…)" autocomplete="off" value="${escAttrCal(calSearchQ)}">
          <button class="cal-nav-btn" data-action="cal-search-toggle" title="Buscar avisos" aria-label="Buscar avisos">🔍</button>
        </div>
        <div class="cal-search-res" id="cal-search-res"></div>
        <div id="cal-wrap"></div>
      </div>
      <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:capitalize" id="agenda-title"></div>
          <button class="btn btn-primary btn-sm" data-action="nuevo-aviso">+ Aviso</button>
        </div>
        <div id="agenda-list"></div>
      </div>
    </div>`;
  setSyncStatus(lastSyncStatus);
  const inp=document.getElementById('cal-search-inp');
  if(inp) inp.addEventListener('input',e=>{calSearchQ=e.target.value;renderCalSearch();});
  renderCalSearch();
  renderCalendar();
  renderAgenda();
}
// ── Buscador de avisos (discreto: icono que despliega un campo; resultados con fecha) ──
let calSearchOpen=false, calSearchQ='';
function escAttrCal(t){return String(t||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function escHtmlCal(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function normCal(t){return String(t==null?'':t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function avisoTextoBusqueda(a){
  const cfg=AVISO_CFG[a.tipo]||{};
  const extra=(a.extra||[]).map(e=>(AVISO_CFG[e.tipo]||{}).label||e.tipo).join(' ');
  const fechas=[a.fecha,a.fechaFin].filter(Boolean).map(f=>f+' '+fmtDate(f)).join(' ');
  return normCal([cfg.label,a.tipo,a.nota,a.direccion,a.telefono,a.pago,a.infoAdicional,a.hora,extra,fechas].filter(Boolean).join(' | '));
}
function renderCalSearch(){
  const box=document.getElementById('cal-search-res'); if(!box) return;
  const q=normCal(calSearchQ).trim();
  if(!calSearchOpen||!q){ box.classList.remove('open'); box.innerHTML=''; return; }
  const palabras=q.split(/\s+/);
  const hallados=avisos.filter(a=>{const t=avisoTextoBusqueda(a);return palabras.every(w=>t.includes(w));})
    .sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  box.classList.add('open');
  if(!hallados.length){ box.innerHTML='<div class="cal-res-empty">Sin resultados</div>'; return; }
  const hoy=todayISO();
  box.innerHTML=hallados.slice(0,60).map(a=>{
    const cfg=AVISO_CFG[a.tipo]||{label:a.tipo,color:'#999'};
    const rango=a.fechaFin&&a.fechaFin!==a.fecha?`${fmtDate(a.fecha)} → ${fmtDate(a.fechaFin)}`:fmtDate(a.fecha);
    const estado=avisoPendiente(a)?(a.fecha<hoy?'⚠ pendiente':'pendiente'):'✓ hecho';
    const sub=[a.direccion&&'📍 '+a.direccion,a.telefono&&'📞 '+a.telefono,a.pago&&'💰 '+a.pago,a.infoAdicional&&'ℹ️ '+a.infoAdicional].filter(Boolean).map(escHtmlCal).join(' · ');
    return `<div class="cal-res-item" data-action="cal-search-go" data-param="${a.fecha}">
      <div class="cal-res-top"><span class="cal-res-fecha">${rango}</span>
        <span class="agenda-tipo-pill" style="background:${cfg.color}22;color:${cfg.color};margin:0">${cfg.label}</span>
        ${a.hora?`<span class="agenda-hora" style="margin:0">🕐 ${escHtmlCal(a.hora)}</span>`:''}
        <span class="agenda-hora" style="margin:0">${estado}</span></div>
      <div class="agenda-nota">${escHtmlCal(a.nota)}</div>
      ${sub?`<div class="cal-res-sub">${sub}</div>`:''}
    </div>`;
  }).join('')+(hallados.length>60?`<div class="cal-res-empty">…y ${hallados.length-60} más, afina la búsqueda</div>`:'');
}
function calSearchToggle(){
  calSearchOpen=!calSearchOpen;
  const row=document.getElementById('cal-search-row'); if(row) row.classList.toggle('open',calSearchOpen);
  const inp=document.getElementById('cal-search-inp');
  if(calSearchOpen&&inp) inp.focus();
  if(!calSearchOpen){ calSearchQ=''; if(inp) inp.value=''; }
  renderCalSearch();
}
function calSearchGo(iso){
  if(!iso) return;
  const d=new Date(iso+'T00:00:00');
  calYear=d.getFullYear(); calMonth=d.getMonth(); calSelDay=iso;
  renderCalendar(); renderAgenda();
  const ag=document.getElementById('agenda-list'); if(ag&&ag.scrollIntoView) ag.scrollIntoView({behavior:'smooth',block:'nearest'});
}
// Avisos visibles ese día: un Permiso/Renovación solo aparece el día que EMPIEZA, no todos los
// días que dura — el día que termina lo representa la Retirada enlazada, no el propio permiso.
function avisosDelDia(dateStr){
  return avisos.filter(a=>a.fecha===dateStr);
}
function renderCalendar(){
  const wrap=document.getElementById('cal-wrap'); if(!wrap) return;
  const hoy=todayISO();
  const first=new Date(calYear,calMonth,1);
  const startOffset=(first.getDay()+6)%7;
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const daysInPrevMonth=new Date(calYear,calMonth,0).getDate();
  const cells=[];
  for(let i=startOffset-1;i>=0;i--) cells.push({d:daysInPrevMonth-i,other:true,m:calMonth-1});
  for(let d=1;d<=daysInMonth;d++) cells.push({d,other:false,m:calMonth});
  while(cells.length%7!==0) cells.push({d:cells.length-startOffset-daysInMonth+1,other:true,m:calMonth+1});
  const dow=['L','M','X','J','V','S','D'];
  const monthLabel=first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  let html=`<div class="cal-head">
    <button class="cal-nav-btn" data-action="cal-prev">‹</button>
    <div class="cal-head-title">${monthLabel}</div>
    <button class="cal-nav-btn" data-action="cal-next">›</button>
  </div>
  <div class="cal-grid">${dow.map(d=>`<div class="cal-dow">${d}</div>`).join('')}`;
  cells.forEach(c=>{
    const iso=localISO(calYear,c.m,c.d);
    const dayAvisos=avisosDelDia(iso);
    const tipos=[...new Set(dayAvisos.map(a=>a.tipo))];
    const dots=tipos.slice(0,4).map(t=>`<span class="cal-dot" style="background:${(AVISO_CFG[t]||{}).color||'#999'}"></span>`).join('');
    const cls=['cal-day'];
    if(c.other) cls.push('other');
    if(iso===hoy) cls.push('today');
    if(iso===calSelDay) cls.push('selected');
    // Solo se resalta el día en que EMPIEZA o TERMINA (se retira) el permiso, no los días intermedios
    if(avisos.some(a=>(a.tipo==='permiso'||a.tipo==='renovacion')&&(a.fecha===iso||(a.fechaFin&&a.fechaFin===iso)))) cls.push('permiso-activo');
    if(dayAvisos.length){
      const pendientesDia=dayAvisos.filter(avisoPendiente);
      if(pendientesDia.length===0) cls.push('dia-completo');
      else if(iso<hoy) cls.push('dia-pendiente');
    } else if(iso<hoy){
      cls.push('dia-completo');
    }
    html+=`<div class="${cls.join(' ')}" data-action="cal-sel-day" data-param="${iso}"><span>${c.d}</span><span class="cal-dots">${dots}</span></div>`;
  });
  html+=`</div>
  <div class="cal-legend">${Object.entries(AVISO_CFG).map(([k,v])=>`<span><i style="background:${v.color}"></i>${v.label}</span>`).join('')}
    <span><i style="background:#16a34a"></i>Día completado</span>
    <span><i style="background:#dc2626"></i>Pendiente atrasado</span>
  </div>`;
  wrap.innerHTML=html;
}
function fmtHora(iso){return iso?new Date(iso).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'';}
// ¿Le queda a este aviso algo sin marcar como hecho? Cuenta tanto sus unidades "propias"
// (completados/cantidad) como las unidades de OTRO tipo añadidas con agregarUnidadParaCliente
// (a.extra) — ver más abajo. Se usa para decidir si sigue en "pendientes" o pasa a "completados".
function avisoPendiente(a){
  if((a.completados||[]).length<(a.cantidad||1)) return true;
  return (a.extra||[]).some(e=>!e.completadoEn);
}
function renderAvisoCard(a){
  const cfg=AVISO_CFG[a.tipo]||{label:a.tipo,color:'#999'};
  const rango=a.fechaFin&&a.fechaFin!==a.fecha?`${fmtDate(a.fecha)} → ${fmtDate(a.fechaFin)}`:fmtDate(a.fecha);
  const total=a.cantidad||1;
  const completados=a.completados||[];
  const hechos=completados.length;
  const letra=AVISO_LETRA[a.tipo]||(cfg.label||'?')[0].toUpperCase();
  // Unidades "propias" del aviso (su tipo original) + unidades de OTRO tipo añadidas desde los
  // botones +LL/+C/+R (a.extra) — ambas se pintan juntas, cada una con el color/letra de SU
  // propio tipo, en vez de crear una tarjeta nueva por cada tipo distinto para el mismo cliente.
  const extra=Array.isArray(a.extra)?a.extra:[];
  const totalTodo=total+extra.length;
  const hechosTodo=hechos+extra.filter(e=>e.completadoEn).length;
  const circulosPropios=Array.from({length:total},(_,i)=>
    i<hechos
      ? `<span class="agenda-unidad done" data-action="deshacer-unidad-idx" data-param="${a.id}" data-idx="${i}" title="Completado ${fmtHora(completados[i])} · clic para deshacer">✓</span>`
      : `<span class="agenda-unidad" style="color:${cfg.color};border-color:${cfg.color}" data-action="completar-unidad" data-param="${a.id}" title="Marcar este ${cfg.label.toLowerCase()} como hecho">${letra}</span>`
  ).join('');
  const circulosExtra=extra.map((e,i)=>{
    const ecfg=AVISO_CFG[e.tipo]||{label:e.tipo,color:'#999'};
    const eletra=AVISO_LETRA[e.tipo]||(ecfg.label||'?')[0].toUpperCase();
    return e.completadoEn
      ? `<span class="agenda-unidad done" data-action="deshacer-extra" data-param="${a.id}" data-idx="${i}" title="Completado ${fmtHora(e.completadoEn)} · clic para deshacer">✓</span>`
      : `<span class="agenda-unidad" style="color:${ecfg.color};border-color:${ecfg.color}" data-action="completar-extra" data-param="${a.id}" data-idx="${i}" title="Marcar este ${ecfg.label.toLowerCase()} como hecho">${eletra}</span>`;
  }).join('');
  const ticksHtml=totalTodo>1
    ? `<div class="agenda-unidades">${circulosPropios}${circulosExtra}</div>`
    : `<div class="tarea-check${hechos>0?' done':''}" data-action="${hechos>0?'deshacer-unidad-idx':'completar-unidad'}" data-param="${a.id}" data-idx="0" title="Marcar completado">${hechos>0?'✓':''}</div>`;
  // Añadir rápido, para este mismo aviso/cliente, una unidad más de Llevada/Cambio/Retirada: si
  // coincide con el tipo propio del aviso, suma una unidad ahí (+1); si es de OTRO tipo, se añade
  // como unidad "extra" dentro de esta MISMA tarjeta (no crea un aviso ni una tarjeta nueva).
  const botonesAnadir=['llevada','cambio','retirada','carga_rapida'].map(t=>{
    const c=AVISO_CFG[t];
    return `<button class="btn btn-secondary btn-sm" style="padding:2px 9px;font-size:11px;border-color:${c.color};color:${c.color}" data-action="add-unidad-cliente" data-param="${a.id}" data-tipo="${t}" title="Añadir ${c.label.toLowerCase()} a este aviso">+${AVISO_LETRA[t]}</button>`;
  }).join('');
  return `<div class="agenda-item" style="border-left-color:${cfg.color}">
      ${ticksHtml}
      <div class="agenda-body">
        <span class="agenda-tipo-pill" style="background:${cfg.color}22;color:${cfg.color}">${cfg.label}</span>
        ${totalTodo>1?`<span class="agenda-cantidad">${hechosTodo}/${totalTodo} hechos</span>`:''}
        ${a.hora?`<span class="agenda-hora">🕐 ${a.hora}</span>`:''}
        <div class="agenda-nota">${a.nota||''}</div>
        <div class="agenda-meta">${rango}${a.telefono?' · 📞 '+a.telefono:''}${a.pago?' · 💰 '+a.pago:''}</div>
        ${a.direccion?`<div class="agenda-meta">📍 ${a.direccion} <a class="agenda-copy-link" href="${mapsLinkFor(a.direccion)}" target="_blank" rel="noopener">abrir en Maps</a></div>`:''}
        ${a.infoAdicional?`<div class="agenda-meta">ℹ️ ${a.infoAdicional}</div>`:''}
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" style="padding:2px 9px;font-size:11px" data-action="copy-aviso" data-param="${a.id}">📋 Copiar aviso</button>
          <button class="btn btn-secondary btn-sm" style="padding:2px 9px;font-size:11px" data-action="editar-aviso" data-param="${a.id}">✏️ Editar</button>
          ${botonesAnadir}
        </div>
      </div>
      <button class="btn btn-danger btn-sm btn-icon" data-action="del-aviso" data-param="${a.id}">🗑</button>
    </div>`;
}
// Añade una unidad de Llevada/Cambio/Retirada al MISMO aviso 'aId' (ver botonesAnadir en
// renderAvisoCard): si el tipo coincide con el propio del aviso, suma +1 a su cantidad; si es de
// otro tipo, se guarda en a.extra (unidades de otro tipo dentro de esta misma tarjeta) en vez de
// crear un aviso/tarjeta aparte para el mismo cliente.
function agregarUnidadParaCliente(aId,tipo){
  const a=avisos.find(x=>x.id===aId); if(!a) return;
  if(tipo===a.tipo){
    a.cantidad=(a.cantidad||1)+1;
  } else {
    if(!Array.isArray(a.extra)) a.extra=[];
    a.extra.push({tipo,completadoEn:null});
  }
  saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar();
  toastMsg((AVISO_CFG[tipo]||{}).label+' añadido ✓');
}
// Quita UNA unidad "propia" del aviso (ver lista "Unidades de este aviso" en el formulario de
// Editar): si estaba hecha, se borra también su marca de completado; si no queda ninguna, no deja
// bajar de 1 (para eso está el botón 🗑 de borrar el aviso entero).
function quitarUnidadAviso(aId,idx){
  const a=avisos.find(x=>x.id===aId); if(!a) return;
  const total=a.cantidad||1;
  if(total<=1){ toastMsg('Es la única unidad de este tipo — para quitar el aviso entero usa 🗑'); return; }
  idx=+idx;
  const completados=Array.isArray(a.completados)?a.completados:[];
  if(idx<completados.length) completados.splice(idx,1);
  a.completados=completados;
  a.cantidad=total-1;
  saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar();
  toastMsg('Unidad quitada ✓');
  if(editAvisoId===aId) nuevoAvisoModal(aId);
}
// Quita una unidad "extra" (de otro tipo, añadida con +LL/+C/+R/+CR) de este mismo aviso.
function quitarUnidadExtra(aId,idx){
  const a=avisos.find(x=>x.id===aId); if(!a||!Array.isArray(a.extra)) return;
  idx=+idx;
  if(idx<0||idx>=a.extra.length) return;
  a.extra.splice(idx,1);
  saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar();
  toastMsg('Unidad quitada ✓');
  if(editAvisoId===aId) nuevoAvisoModal(aId);
}
function renderUnidadCompletada(entry){
  const {a,idx,ts,total}=entry;
  const cfg=AVISO_CFG[a.tipo]||{label:a.tipo,color:'#999'};
  return `<div class="agenda-item done" style="border-left-color:var(--success)">
      <div class="tarea-check done" data-action="deshacer-unidad-idx" data-param="${a.id}" data-idx="${idx}" title="Deshacer">✓</div>
      <div class="agenda-body">
        <span class="agenda-tipo-pill" style="background:${cfg.color}22;color:${cfg.color}">${cfg.label}</span>
        ${total>1?`<span class="agenda-cantidad">unidad ${idx+1}/${total}</span>`:''}
        <span class="agenda-hora" style="color:var(--success)">✓ Completado ${fmtHora(ts)}</span>
        <div class="agenda-nota">${a.nota||''}</div>
        ${a.direccion?`<div class="agenda-meta">📍 ${a.direccion}</div>`:''}
      </div>
    </div>`;
}
function unidadesCompletadasDelDia(dateStr){
  const entries=[];
  avisosDelDia(dateStr).forEach(a=>{
    (a.completados||[]).forEach((ts,idx)=>entries.push({a,idx,ts,total:a.cantidad||1}));
  });
  entries.sort((x,y)=>(x.ts||'').localeCompare(y.ts||''));
  return entries;
}
function renderAgenda(){
  const list=document.getElementById('agenda-list'); if(!list) return;
  renderCalSearch();
  const title=document.getElementById('agenda-title');
  const todos=avisosDelDia(calSelDay);
  const pendientes=todos.filter(avisoPendiente).sort((a,b)=>{
    if(a.hora&&b.hora) return a.hora.localeCompare(b.hora);
    if(a.hora&&!b.hora) return -1;
    if(!a.hora&&b.hora) return 1;
    return (a.creada||'').localeCompare(b.creada||'');
  });
  const completadas=unidadesCompletadasDelDia(calSelDay);
  const dt=new Date(calSelDay+'T00:00:00');
  title.textContent=dt.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  let html='';
  if(!pendientes.length&&!completadas.length){
    html='<div class="empty-state" style="padding:20px 0"><div class="icon">🗓</div>Sin avisos este día</div>';
  } else {
    html+=pendientes.map(renderAvisoCard).join('')||'<div class="empty-state" style="padding:10px 0">Sin avisos pendientes</div>';
    if(completadas.length){
      html+=`<div class="agenda-section-title">✅ Completados (${completadas.length})</div>`;
      html+=completadas.map(renderUnidadCompletada).join('');
    }
  }
  list.innerHTML=html;
}
function mapsLinkFor(direccion){
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion+', Alicante, España')}`;
}
function buildAvisoCopyText(a,cantidadCopiar){
  const cfg=AVISO_CFG[a.tipo]||{label:a.tipo};
  const n=cantidadCopiar||a.cantidad||1;
  let primera=n>1?`${cfg.label} +${n-1}`:cfg.label;
  if(a.hora) primera+=` - ${a.hora}h`;
  const parts=[primera];
  if(a.nota) parts.push(a.nota);
  if(a.direccion) parts.push(a.direccion+'\n'+mapsLinkFor(a.direccion));
  if(a.telefono) parts.push(a.telefono);
  if(a.pago) parts.push(a.pago);
  if(a.infoAdicional) parts.push(a.infoAdicional);
  return parts.join('\n\n');
}
function copyToClipboard(text,msg){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toastMsg(msg||'Copiado ✓')).catch(()=>fallbackCopy(text,msg));
  } else fallbackCopy(text,msg);
}
function fallbackCopy(text,msg){
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{document.execCommand('copy');toastMsg(msg||'Copiado ✓');}catch(e){toastMsg('No se pudo copiar');}
  document.body.removeChild(ta);
}
function iniciarCopiaAviso(id){
  const a=avisos.find(x=>x.id===id); if(!a) return;
  const total=a.cantidad||1;
  const restantes=total-(a.completados||[]).length;
  if(restantes<=1){ copyToClipboard(buildAvisoCopyText(a,1),'Aviso copiado ✓'); return; }
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Copiar aviso</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:10px">Quedan <strong>${restantes}</strong> cambios pendientes de ${a.nota||'este cliente'}. ¿Cuántos vas a copiar y enviar ahora?</p>
    <div class="form-row"><label>Cantidad a copiar</label><input id="cp-cantidad" type="number" min="1" max="${restantes}" value="1"></div>
    <button class="btn btn-primary btn-full" style="margin-top:8px" data-action="confirmar-copia-aviso" data-param="${a.id}">📋 Copiar y marcar hechos</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}
function confirmarCopiaAviso(id){
  const a=avisos.find(x=>x.id===id); if(!a) return;
  const total=a.cantidad||1;
  if(!Array.isArray(a.completados)) a.completados=[];
  const restantes=total-a.completados.length;
  let n=parseInt((document.getElementById('cp-cantidad')||{}).value,10)||1;
  n=Math.min(Math.max(n,1),restantes);
  copyToClipboard(buildAvisoCopyText(a,n),`${n} de ${restantes} copiado(s) ✓`);
  const ahora=new Date().toISOString();
  for(let i=0;i<n;i++) a.completados.push(ahora);
  saveAvisos();syncAviso(a);closeModal();renderAgenda();renderCalendar();
}
function calChangeMonth(delta){
  calMonth+=delta;
  if(calMonth<0){calMonth=11;calYear--;}
  if(calMonth>11){calMonth=0;calYear++;}
  renderCalendar();
}
function calSelectDay(iso){calSelDay=iso;renderCalendar();renderAgenda();}
let editAvisoId=null;
// 'prefill' permite abrir el modal de aviso NUEVO con campos ya rellenos (p.ej. desde el botón
// "Mandar Aviso" de un contenedor), sin que cuente como edición de un aviso ya existente.
function nuevoAvisoModal(id,prefill){
  editAvisoId=id||null;
  const a=editAvisoId?avisos.find(x=>x.id===editAvisoId):(prefill||null);
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">${editAvisoId?'Editar aviso':'Nuevo aviso'}</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div class="form-row"><label>Tipo</label>
      <select id="av-tipo">${Object.entries(AVISO_CFG).map(([k,v])=>`<option value="${k}"${a&&a.tipo===k?' selected':''}>${v.label}</option>`).join('')}</select>
    </div>
    <div id="av-fields"></div>
    <button class="btn btn-primary btn-full" style="margin-top:10px" data-action="crear-aviso">${editAvisoId?'Guardar cambios':'Guardar aviso'}</button>`;
  document.getElementById('av-tipo').addEventListener('change',()=>renderAvisoFields(snapshotAvisoForm()));
  renderAvisoFields(a);
  document.getElementById('modal-overlay').classList.add('open');
}
function avisoMemGet(nota){
  const mem=JSON.parse(localStorage.getItem('garvi_aviso_memoria')||'{}');
  return mem[(nota||'').trim().toLowerCase()];
}
// Como "SEKMAG EDF. DELFIN" o "SEKMAG TEXAS" (mismo cliente, varias ubicaciones), busca primero
// exacto y si no hay, la entrada más parecida cuyo nombre empiece por lo escrito.
function avisoMemGetAprox(nota){
  const n=(nota||'').trim().toLowerCase();
  if(!n) return null;
  const mem=JSON.parse(localStorage.getItem('garvi_aviso_memoria')||'{}');
  if(mem[n]) return mem[n];
  const key=Object.keys(mem).find(k=>k.startsWith(n+' ')||n.startsWith(k+' '));
  return key?mem[key]:null;
}
// Busca los datos (dirección/teléfono/tipo) que ya haya guardados de ese cliente en CUALQUIER
// parte de la app — contenedores, albaranes, facturas y memoria de avisos — no solo contenedores,
// porque un cliente puede tener su único dato guardado en una factura o un albarán ya hecho sin
// haber tenido nunca un contenedor con ese nombre exacto. Prioriza coincidencias exactas de
// nombre sobre las aproximadas (mismo cliente, otra ubicación tipo "SERVITRIA"/"SERVITRIA XXX"),
// y entre varias, la más reciente.
// NAVE GARVI y GRANJA TORRELLANO son ubicaciones propias de la empresa, no clientes reales.
function esClienteInterno(nombre){
  const n=normTextoHist(String(nombre||''));
  return n==='nave garvi'||n==='granja torrellano';
}
function datosClientePorNombre(nombreEscrito,excluirContainerNum){
  // Usa normTextoHist (ya probado para fusionar duplicados del historial) en vez de un simple
  // trim+lowercase: dos nombres iguales a la vista pueden diferir en espacios dobles, un espacio
  // "raro" metido por el teclado del móvil, acentos o una coma/punto final, y con trim+lowercase
  // a secas esos casos NO se consideraban coincidencia exacta y no se autocompletaba nada.
  // Todo blindado con String(...||'') antes de normTextoHist/localeCompare: un campo guardado
  // alguna vez como número u otra cosa no-texto no debe poder reventar todo el autocompletado.
  try{
    const txt=v=>String(v||'');
    const n=normTextoHist(txt(nombreEscrito));
    if(!n) return null;
    // NAVE GARVI y GRANJA TORRELLANO son ubicaciones propias de la empresa, no clientes reales
    // (igual que ya se excluyen en refreshGlobalDatalists/syncClientes/updateBadge) — cada
    // contenedor ahí puede estar en un sitio distinto dentro de la nave/granja, así que no tiene
    // sentido copiar la dirección/teléfono de "otro" con el mismo nombre.
    if(n==='nave garvi'||n==='granja torrellano') return null;
    const coincide=cn=>!!cn&&(cn===n||cn.startsWith(n+' ')||n.startsWith(cn+' '));
    const cands=[];
    containers.forEach(x=>{
      if(x.num===excluirContainerNum) return;
      const cn=normTextoHist(txt(x.cliente));
      if(coincide(cn)) cands.push({direccion:txt(x.direccion),telefono:txt(x.telefono),tipo:x.tipo,fecha:txt(x.fecha),exacto:cn===n});
    });
    albaranes.forEach(a=>{
      const cn=normTextoHist(txt(a.cliente));
      if(coincide(cn)) cands.push({direccion:txt(a.lugar),telefono:txt(a.telefono),fecha:txt(a.fecha),exacto:cn===n});
    });
    facturas.forEach(f=>{
      const cn=normTextoHist(txt(f.cliente));
      if(coincide(cn)) cands.push({direccion:txt(f.dir),telefono:txt(f.telefono),fecha:txt(f.fecha),exacto:cn===n});
    });
    const mem=avisoMemGetAprox(txt(nombreEscrito));
    if(mem) cands.push({direccion:txt(mem.direccion),telefono:txt(mem.telefono),fecha:'',exacto:true});
    if(!cands.length) return null;
    cands.sort((a,b)=>a.exacto!==b.exacto?(a.exacto?-1:1):txt(b.fecha).localeCompare(txt(a.fecha)));
    return {
      direccion:(cands.find(x=>x.direccion)||{}).direccion,
      telefono:(cands.find(x=>x.telefono)||{}).telefono,
      tipo:(cands.find(x=>x.tipo)||{}).tipo,
    };
  }catch(e){
    console.error('datosClientePorNombre:',e);
    return null;
  }
}
function avisoMemSet(nota,data){
  if(!nota||!nota.trim()) return;
  const mem=JSON.parse(localStorage.getItem('garvi_aviso_memoria')||'{}');
  mem[nota.trim().toLowerCase()]=data;
  localStorage.setItem('garvi_aviso_memoria',JSON.stringify(mem));
}
// Recoge lo que haya AHORA MISMO escrito en el formulario de aviso (antes de reconstruirlo al
// cambiar el Tipo), para no perder nada de lo que el usuario ya haya rellenado o modificado.
function snapshotAvisoForm(){
  const g=id=>{const el=document.getElementById(id); return el?el.value:undefined;};
  return {
    nota:g('av-nota'), direccion:g('av-direccion'), telefono:g('av-telefono'),
    pago:g('av-pago'), cantidad:g('av-cantidad'), fecha:g('av-fecha'),
    fechaFin:g('av-fechafin'), hora:g('av-hora'), infoAdicional:g('av-info'),
  };
}
function renderAvisoFields(editing){
  const tipo=document.getElementById('av-tipo').value;
  // Antes exigía que 'editing.tipo' coincidiera con el tipo recién seleccionado, así que al
  // cambiar el desplegable de Tipo se perdía todo lo escrito (cliente, dirección, teléfono…).
  // Cliente/dirección/teléfono/etc. no dependen del tipo de aviso, así que se conservan siempre.
  const a=editing||null;
  const box=document.getElementById('av-fields');
  const permisos=avisos.filter(x=>x.tipo==='permiso');
  if(tipo==='renovacion'){
    box.innerHTML=`
      <div class="form-row"><label>Permiso a renovar</label>
        <select id="av-permiso">${permisos.length?permisos.map(p=>`<option value="${p.id}"${a&&a.permisoId===p.id?' selected':''}>${p.nota||'Permiso'} (hasta ${fmtDate(p.fechaFin||p.fecha)})</option>`).join(''):'<option value="">Sin permisos creados</option>'}</select>
      </div>
      <div class="form-row"><label>Nueva fecha final</label><input id="av-fechafin" type="date" value="${a?a.fechaFin||calSelDay:calSelDay}"></div>`;
    return;
  }
  // Lista de unidades de este aviso (las "propias" del tipo + las "extra" añadidas desde
  // +LL/+C/+R/+CR en la tarjeta de agenda), cada una con un botón ✕ para quitarla sin tener que
  // borrar el aviso entero. Solo se muestra editando un aviso ya guardado con más de 1 unidad.
  const totalPropio=a?(a.cantidad||1):1;
  const hechosPropio=a?(a.completados||[]).length:0;
  const extraEdit=a&&Array.isArray(a.extra)?a.extra:[];
  const unidadesListHtml=(a&&(totalPropio+extraEdit.length)>1)?`
    <div class="form-row"><label>Unidades de este aviso (toca ✕ para quitar una)</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${Array.from({length:totalPropio},(_,i)=>{
          const hecho=i<hechosPropio;
          const colorP=(AVISO_CFG[tipo]||{}).color||'#999';
          const letraP=AVISO_LETRA[tipo]||'?';
          return `<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;border-color:${colorP};color:${colorP}" data-action="quitar-unidad" data-param="${a.id}" data-idx="${i}">${letraP}${hecho?' ✓':''} ✕</button>`;
        }).join('')}
        ${extraEdit.map((ex,i)=>{
          const ecfg=AVISO_CFG[ex.tipo]||{label:ex.tipo,color:'#999'};
          const eletra=AVISO_LETRA[ex.tipo]||'?';
          return `<button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;border-color:${ecfg.color};color:${ecfg.color}" data-action="quitar-extra" data-param="${a.id}" data-idx="${i}">${eletra}${ex.completadoEn?' ✓':''} ✕</button>`;
        }).join('')}
      </div>
    </div>`:'';
  box.innerHTML=`
    <div class="form-row"><label>Cliente</label><input id="av-nota" list="dl-global-clientes" placeholder="Nombre del cliente…" value="${f_esc(a?a.nota:'')}"></div>
    <div class="form-row"><label>Dirección</label><input id="av-direccion" list="dl-global-direcciones" placeholder="Dirección…" value="${f_esc(a?a.direccion:'')}"></div>
    <div class="form-row cols2">
      <div><label>Teléfono</label><input id="av-telefono" list="dl-global-telefonos" type="tel" placeholder="Teléfono de contacto…" value="${f_esc(a?a.telefono:'')}"></div>
      <div><label>Pago</label><input id="av-pago" placeholder="Ej: Pendiente, Pagado, 50€…" value="${f_esc(a?a.pago:'')}"></div>
    </div>
    <div class="form-row"><label>Cantidad (si el mismo cliente pide varios en este sitio)</label><input id="av-cantidad" type="number" min="1" step="1" placeholder="1" value="${a&&a.cantidad>1?a.cantidad:''}"></div>
    ${unidadesListHtml}
    ${tipo==='permiso'
      ?`<div class="form-row cols2"><div><label>Fecha inicio</label><input id="av-fecha" type="date" value="${a?a.fecha:calSelDay}"></div><div><label>Fecha final</label><input id="av-fechafin" type="date" value="${a?a.fechaFin||calSelDay:calSelDay}"></div></div>
        <div class="form-row"><label>Hora (opcional)</label><input id="av-hora" type="time" value="${a?a.hora||'':''}"></div>`
      :`<div class="form-row cols2"><div><label>Fecha</label><input id="av-fecha" type="date" value="${a?a.fecha:calSelDay}"></div><div><label>Hora (opcional)</label><input id="av-hora" type="time" value="${a?a.hora||'':''}"></div></div>`}
    <div class="form-row"><label>Información adicional</label><textarea id="av-info" rows="2" placeholder="Cualquier otro detalle…">${a?(a.infoAdicional||''):AVISO_INFO_DEFECTO}</textarea></div>`;
  document.getElementById('av-nota').addEventListener('input',e=>{
    const m=avisoMemGet(e.target.value);
    if(m){
      const telEl=document.getElementById('av-telefono'); if(telEl) telEl.value=m.telefono||'';
      const pagoEl=document.getElementById('av-pago'); if(pagoEl) pagoEl.value=m.pago||'';
      const dirEl=document.getElementById('av-direccion'); if(dirEl) dirEl.value=m.direccion||'';
    }
  });
}
function crearAviso(){
  const tipo=document.getElementById('av-tipo').value;
  const editando=editAvisoId?avisos.find(x=>x.id===editAvisoId):null;
  if(tipo==='renovacion'){
    const permId=(document.getElementById('av-permiso')||{}).value;
    const nuevaFin=(document.getElementById('av-fechafin')||{}).value;
    const perm=avisos.find(a=>a.id===permId);
    if(!perm){toastMsg('Selecciona un permiso válido');return;}
    if(!nuevaFin){toastMsg('Indica la nueva fecha final');return;}
    if(editando&&editando.tipo==='renovacion'){
      editando.permisoId=perm.id; editando.fechaFin=nuevaFin; editando.nota='Renovación de: '+(perm.nota||'Permiso');
      editando.direccion=perm.direccion||''; editando.telefono=perm.telefono||'';
      syncAviso(editando);
    } else {
      perm.fechaFin=nuevaFin;
      syncAviso(perm);
      const nuevaRenovacion={id:Date.now().toString(),tipo:'renovacion',fecha:todayISO(),fechaFin:nuevaFin,cantidad:1,completados:[],nota:'Renovación de: '+(perm.nota||'Permiso'),direccion:perm.direccion||'',telefono:perm.telefono||'',permisoId:perm.id,creada:new Date().toISOString()};
      avisos.push(nuevaRenovacion); syncAviso(nuevaRenovacion);
      const retiradaLigada=avisos.find(a=>a.tipo==='retirada'&&a.autoFrom===perm.id);
      if(retiradaLigada){ retiradaLigada.fecha=nuevaFin; syncAviso(retiradaLigada); }
      else{
        const nuevaRetirada={id:Date.now().toString()+'r',tipo:'retirada',fecha:nuevaFin,cantidad:1,completados:[],nota:'Retirada — fin de permiso: '+(perm.nota||''),direccion:perm.direccion||'',telefono:perm.telefono||'',pago:'',infoAdicional:'',autoFrom:perm.id,creada:new Date().toISOString()};
        avisos.push(nuevaRetirada); syncAviso(nuevaRetirada);
      }
    }
    saveAvisos();closeModal();renderCalendar();renderAgenda();toastMsg('Permiso renovado ✓');
    return;
  }
  const nota=(document.getElementById('av-nota')||{}).value||'';
  const direccion=(document.getElementById('av-direccion')||{}).value||'';
  const telefono=(document.getElementById('av-telefono')||{}).value||'';
  const pago=(document.getElementById('av-pago')||{}).value||'';
  const infoAdicional=(document.getElementById('av-info')||{}).value||'';
  const fecha=(document.getElementById('av-fecha')||{}).value||calSelDay;
  const fechaFin=(document.getElementById('av-fechafin')||{}).value||'';
  const hora=(document.getElementById('av-hora')||{}).value||'';
  const cantidad=Math.max(1,parseInt((document.getElementById('av-cantidad')||{}).value,10)||1);
  if(tipo==='permiso'&&!nota){toastMsg('Indica el cliente del permiso');return;}
  const datos={tipo,fecha,fechaFin:tipo==='permiso'?fechaFin:'',hora,cantidad,nota:nota.trim(),direccion:direccion.trim(),telefono:telefono.trim(),pago:pago.trim(),infoAdicional:infoAdicional.trim()};
  const targetId=editando?editando.id:Date.now().toString();
  if(editando){ Object.assign(editando,datos); syncAviso(editando); }
  else{
    const nuevoAv={id:targetId,...datos,completados:[],creada:new Date().toISOString()};
    avisos.push(nuevoAv); syncAviso(nuevoAv);
  }
  // Sincroniza (o crea/quita) la retirada automática ligada al permiso
  const retiradaLigada=avisos.find(x=>x.tipo==='retirada'&&x.autoFrom===targetId);
  if(tipo==='permiso'&&fechaFin){
    if(retiradaLigada){
      Object.assign(retiradaLigada,{fecha:fechaFin,nota:'Retirada — fin de permiso: '+nota.trim(),direccion:direccion.trim(),telefono:telefono.trim()});
      syncAviso(retiradaLigada);
    } else {
      const nuevaRetirada={id:targetId+'r',tipo:'retirada',fecha:fechaFin,cantidad:1,completados:[],nota:'Retirada — fin de permiso: '+nota.trim(),direccion:direccion.trim(),telefono:telefono.trim(),pago:'',infoAdicional:'',autoFrom:targetId,creada:new Date().toISOString()};
      avisos.push(nuevaRetirada); syncAviso(nuevaRetirada);
    }
  } else if(retiradaLigada){
    avisos=avisos.filter(x=>x.id!==retiradaLigada.id);
    syncBorrarAviso(retiradaLigada.id);
  }
  avisoMemSet(nota,{telefono:telefono.trim(),pago:pago.trim(),direccion:direccion.trim()});
  saveAvisos();closeModal();calSelDay=fecha;renderCalendar();renderAgenda();toastMsg(editando?'Aviso actualizado ✓':'Aviso guardado ✓');
}
function delAviso(id){
  const ligados=avisos.filter(a=>a.autoFrom===id).map(a=>a.id);
  avisos=avisos.filter(a=>a.id!==id&&a.autoFrom!==id);
  saveAvisos();
  syncBorrarAviso(id);
  ligados.forEach(syncBorrarAviso);
  renderCalendar();renderAgenda();toastMsg('Eliminado');
}

