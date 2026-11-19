// ─── SEGUIMIENTO: permisos y recordatorios ─────────────────────────────────
// Sustituye al Excel online "PERMISOS Y RECORDATORIOS": contenedores a cuenta de clientes,
// permisos y renovaciones, facturación pendiente de permisos/certificados, pagarés y cheques,
// vacaciones, tarifas... Todo se edita directamente en pantalla (se guarda al salir de la casilla)
// y se sincroniza en la nube en un único documento: config/seguimiento (cada bloque es un campo).
//
// Los datos NO van en el código (el repo es público): se cargan con el botón "Importar" o se
// escriben a mano. "Exportar" baja todo a un .json (copia de seguridad / traspaso).
const SEG_BLOQUES=['acuenta','permisos','renovaciones','facturar','pagares','vacaciones','tarifas','acuentaNota','layout','colores'];
// Posición de los bloques en pantalla: 3 zonas (arriba a todo el ancho · columna izquierda · columna derecha).
// Se puede cambiar con "↕ Mover bloques" y se sincroniza entre dispositivos (campo "layout").
const SEG_LAYOUT_DEFECTO={arriba:['permisos','renovaciones'],izq:['acuenta','tarifas'],der:['facturar','pagares','vacaciones']};
const SEG_NOMBRE_BLOQUE={permisos:'Permisos',renovaciones:'Renovación de permisos',acuenta:'A cuenta de clientes',facturar:'Facturación a…',pagares:'Pagarés y cheques',tarifas:'Tarifas y notas',vacaciones:'Vacaciones'};
let seguimiento={acuenta:[],permisos:[],renovaciones:[],facturar:[],pagares:[],vacaciones:[],tarifas:[],acuentaNota:'',layout:JSON.parse(JSON.stringify(SEG_LAYOUT_DEFECTO)),colores:{}};
let segModoMover=false, segModoColor=false;
// Deja el layout siempre completo y sin repetidos (por si falta algún bloque o hay uno desconocido).
function segLayoutValido(l){
  const todos=Object.keys(SEG_NOMBRE_BLOQUE), vistos=new Set(), out={arriba:[],izq:[],der:[]};
  ['arriba','izq','der'].forEach(z=>((l&&Array.isArray(l[z]))?l[z]:[]).forEach(id=>{ if(SEG_NOMBRE_BLOQUE[id]&&!vistos.has(id)){ vistos.add(id); out[z].push(id); } }));
  todos.filter(id=>!vistos.has(id)).forEach(id=>{ const z=['arriba','izq','der'].find(z=>SEG_LAYOUT_DEFECTO[z].includes(id)); out[z].push(id); });
  return out;
}
let segRenderPendiente=false;

// Definición de las tablas sencillas. tipo: text (por defecto) | date | num | select | check
const SEG_TABLAS={
  acuenta:{titulo:'A cuenta de clientes',color:'amarillo',vacio:'Sin contenedores a cuenta',
    cols:[{k:'cliente',l:'Cliente'},{k:'cant',l:'Hecho / Total',ancho:'104px',centro:1},
          {k:'tipo',l:'Tipo',tipo:'select',ancho:'124px',lista:'tiposContenedor'}],
    nueva:()=>({cliente:'',cant:'',tipo:'MEZCLA'})},
  permisos:{titulo:'Permisos',color:'amarillo',vacio:'Sin permisos pendientes',
    cols:[{k:'fecha',l:'Fecha',ancho:'120px'},{k:'direccion',l:'Dirección'},{k:'contacto',l:'Contacto'},{k:'pago',l:'Pago',ancho:'74px'}],
    nueva:()=>({fecha:'',direccion:'',contacto:'',pago:''})},
  renovaciones:{titulo:'Renovación de permisos',color:'cian',vacio:'Sin renovaciones pendientes',
    cols:[{k:'limite',l:'Fecha límite',ancho:'196px'},{k:'fecha',l:'Fecha',ancho:'250px'},{k:'direccion',l:'Dirección'},{k:'contacto',l:'Contacto'},{k:'pago',l:'Pago',ancho:'66px'}],
    nueva:()=>({limite:'',fecha:'',direccion:'',contacto:'',pago:''})},
  facturar:{titulo:'Facturación a…',color:'amarillo',vacio:'Nada pendiente de facturar',
    cols:[{k:'cliente',l:'Cliente'},{k:'concepto',l:'Permiso o certificado',ancho:'140px'},{k:'lugar',l:'Lugar'}],
    nueva:()=>({cliente:'',concepto:'',lugar:''})},
};
const SEG_TIPOS_CONT=['MEZCLA','LIMPIO','MADERA','PODA','VARIOS 9M3','VARIOS 16M3','A CUENTA'];
const SEG_COLORES=['amarillo','verde','cian','lila'];

function segUid(){ return 's'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function segEsc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Guardado local + nube ──
function loadSeguimiento(){
  let d={};
  try{ d=JSON.parse(localStorage.getItem('garvi_seguimiento')||'{}')||{}; }catch(e){}
  SEG_BLOQUES.forEach(b=>{ if(d[b]!==undefined) seguimiento[b]=d[b]; });
  seguimiento.layout=segLayoutValido(seguimiento.layout);
  if(!seguimiento.colores||typeof seguimiento.colores!=='object'||Array.isArray(seguimiento.colores)) seguimiento.colores={};
}
function saveSeguimiento(bloque){
  try{ localStorage.setItem('garvi_seguimiento',JSON.stringify(seguimiento)); }catch(e){}
  if(bloque) syncSeguimiento(bloque);
}
function syncSeguimiento(bloque){
  if(!fbDb||!fbReady) return;
  fbDb.collection('config').doc('seguimiento').set({[bloque]:seguimiento[bloque]},{mergeFields:[bloque]})
    .catch(e=>console.error('Error guardando seguimiento en la nube:',e));
}
function suscribirSeguimiento(){
  if(!fbDb) return;
  fbDb.collection('config').doc('seguimiento').onSnapshot(doc=>{
    if(!doc.exists||doc.metadata.hasPendingWrites) return;   // lo que escribimos nosotros no se vuelve a pintar
    const d=doc.data(); let cambio=false;
    SEG_BLOQUES.forEach(b=>{ if(d[b]!==undefined&&JSON.stringify(d[b])!==JSON.stringify(seguimiento[b])){ seguimiento[b]=d[b]; cambio=true; } });
    if(!cambio) return;
    seguimiento.layout=segLayoutValido(seguimiento.layout);
    if(!seguimiento.colores||typeof seguimiento.colores!=='object') seguimiento.colores={};
    saveSeguimiento();
    if(currentTab==='seguimiento') pedirRenderSeguimiento();
  },err=>console.error('seguimiento onSnapshot:',err));
}
// Si alguien está escribiendo en una casilla, el repintado espera a que termine (para no quitarle el foco).
function pedirRenderSeguimiento(){
  const a=document.activeElement;
  if(a&&a.closest&&a.closest('#sec-seguimiento')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){ segRenderPendiente=true; return; }
  renderSeguimiento();
}
// Sube a la nube los bloques locales que la nube aún no tenga (primer uso en este dispositivo).
function migrarSeguimiento(){
  if(!fbDb||!fbReady) return Promise.resolve();
  return fbDb.collection('config').doc('seguimiento').get().then(doc=>{
    const nube=doc.exists?doc.data():{};
    const subir={};
    SEG_BLOQUES.forEach(b=>{
      const local=seguimiento[b], vacioLocal=Array.isArray(local)?!local.length:!local;
      if(nube[b]===undefined&&!vacioLocal) subir[b]=local;
    });
    if(Object.keys(subir).length) return fbDb.collection('config').doc('seguimiento').set(subir,{merge:true});
  }).catch(e=>console.error('Error migrando seguimiento:',e));
}

// ── Utilidades de fechas ──
function segDias(desde,hasta){
  if(!desde) return 0;
  if(!hasta) return 1;
  const n=Math.round((new Date(hasta+'T00:00:00')-new Date(desde+'T00:00:00'))/864e5)+1;
  return n>0?n:0;
}
function segFmtCorta(iso){ if(!iso) return ''; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('es-ES',{day:'numeric',month:'short'}); }

// ── Pintado ──
// ── Colores personalizables (títulos de bloque y columnas de tabla) ──
const SEG_PALETA=['#fde68a','#fdba74','#fca5a5','#f9a8d4','#d8b4fe','#a5b4fc','#93c5fd','#67e8f9','#86efac','#bef264','#e5e7eb','#ffffff'];
function segCol(k){ const c=seguimiento.colores&&seguimiento.colores[k]; return /^#[0-9a-f]{6}$/i.test(c||'')?c:''; }
function segRgb(hex){ return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)); }
function segMezcla(hex,t){ return '#'+segRgb(hex).map(c=>Math.round(c+(255-c)*t).toString(16).padStart(2,'0')).join(''); }
function segTexto(hex){ const [r,g,b]=segRgb(hex); return (0.299*r+0.587*g+0.114*b)>150?'#1f2937':'#ffffff'; }
function segCk(k){ return segModoColor?` data-ckey="${k}"`:''; }
function segThAttrs(k,ancho,clase){
  const c=segCol(k), st=[]; if(ancho) st.push('width:'+ancho); if(c){ st.push('--thc:'+c,'--thx:'+segTexto(c)); }
  const cl=[clase||'',segModoColor?'seg-colorable':''].filter(Boolean).join(' ');
  return (cl?` class="${cl}"`:'')+(st.length?` style="${st.join(';')}"`:'')+segCk(k);
}
function segTdAttrs(k){ const c=segCol(k); return c?` style="--tdc:${segMezcla(c,.6)}"`:''; }
function segTitulo(texto,color,extra,k){
  const c=k&&segCol(k);
  return `<div class="seg-titulo${c?'':' seg-'+color}${segModoColor?' seg-colorable':''}"${c?` style="background:${c};color:${segTexto(c)}"`:''}${k?segCk(k):''}><span>${texto}</span>${extra||''}</div>`;
}
function segInput(bloque,id,col,valor){
  const comun=`data-seg="${bloque}" data-id="${id}" data-k="${col.k}"`;
  if(col.tipo==='select'){
    const ops=SEG_TIPOS_CONT.includes(valor)||!valor?SEG_TIPOS_CONT:[valor,...SEG_TIPOS_CONT];
    return `<select class="seg-in" ${comun}>${ops.map(o=>`<option${o===valor?' selected':''}>${segEsc(o)}</option>`).join('')}</select>`;
  }
  return `<input class="seg-in${col.centro?' seg-centro':''}" ${comun} value="${segEsc(valor)}" autocomplete="off">`;
}
function segTablaHtml(bloque){
  const def=SEG_TABLAS[bloque], filas=seguimiento[bloque]||[];
  const head=def.cols.map(c=>`<th${segThAttrs('c:'+bloque+':'+c.k,c.ancho)}>${c.l}</th>`).join('')+'<th class="seg-x"></th>';
  const body=filas.map(f=>`<tr>${def.cols.map(c=>`<td${segTdAttrs('c:'+bloque+':'+c.k)}>${segInput(bloque,f.id,c,f[c.k])}</td>`).join('')}<td class="seg-x"><button class="seg-del" data-sact="fila-del" data-b="${bloque}" data-id="${f.id}" title="Quitar fila">✕</button></td></tr>`).join('')
    ||`<tr><td colspan="${def.cols.length+1}" class="seg-vacio">${def.vacio}</td></tr>`;
  return `<div class="seg-bloque">${segTitulo(def.titulo,def.color,`<button class="seg-mas" data-sact="fila-add" data-b="${bloque}">+ Añadir</button>`,'t:'+bloque)}
    <div class="seg-scroll"><table class="seg-tabla seg-t-${bloque}${bloque==='permisos'||bloque==='renovaciones'?' seg-ancha':''}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function segAcuentaHtml(){
  return segTablaHtml('acuenta').replace(/<\/div><\/div>$/,'')+
    `<textarea class="seg-nota" data-segnota="acuentaNota" rows="2" placeholder="Anotaciones sobre clientes a cuenta (retiradas, avisos…)">${segEsc(seguimiento.acuentaNota)}</textarea></div></div>`;
}
function segPagaresHtml(){
  const hoy=todayISO(), lim=(()=>{const d=new Date(hoy+'T00:00:00');d.setDate(d.getDate()+7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
  const filas=[...seguimiento.pagares].sort((a,b)=>(a.vence||'9999').localeCompare(b.vence||'9999'));
  const pend=filas.filter(f=>!f.cobrado);
  const totalPend=pend.reduce((s,f)=>s+(parseFloat(f.importe)||0),0);
  const prox=pend.find(f=>f.vence);
  const body=filas.map(f=>{
    const est=f.cobrado?'ok':(f.vence&&f.vence<hoy)?'tarde':(f.vence&&f.vence<=lim)?'pronto':'';
    return `<tr class="seg-fila-${est}">
      <td${segTdAttrs('c:pagares:cliente')}><input class="seg-in" data-seg="pagares" data-id="${f.id}" data-k="cliente" value="${segEsc(f.cliente)}" autocomplete="off"></td>
      <td${segTdAttrs('c:pagares:tipo')}><select class="seg-in" data-seg="pagares" data-id="${f.id}" data-k="tipo">${['Pagaré','Cheque'].map(o=>`<option${o===f.tipo?' selected':''}>${o}</option>`).join('')}</select></td>
      <td${segTdAttrs('c:pagares:vence')}><input class="seg-in" type="date" data-seg="pagares" data-id="${f.id}" data-k="vence" value="${segEsc(f.vence)}"></td>
      <td${segTdAttrs('c:pagares:importe')}><input class="seg-in seg-num" type="number" step="0.01" data-seg="pagares" data-id="${f.id}" data-k="importe" value="${segEsc(f.importe)}"></td>
      <td class="seg-c"${segTdAttrs('c:pagares:cobrado')}><input type="checkbox" class="seg-chk" data-seg="pagares" data-id="${f.id}" data-k="cobrado"${f.cobrado?' checked':''} title="Cobrado / ingresado"></td>
      <td class="seg-x"><button class="seg-del" data-sact="fila-del" data-b="pagares" data-id="${f.id}" title="Quitar">✕</button></td></tr>`;
  }).join('')||`<tr><td colspan="6" class="seg-vacio">Sin pagarés ni cheques</td></tr>`;
  const resumen=`<div class="seg-resumen"><span>Pendiente: <b>${fmtMoney(totalPend)}</b></span>${prox?`<span>Próximo: <b>${segFmtCorta(prox.vence)}</b></span>`:''}</div>`;
  return `<div class="seg-bloque">${segTitulo('Pagarés y cheques','amarillo','<button class="seg-mas" data-sact="fila-add" data-b="pagares">+ Añadir</button>','t:pagares')}
    <div class="seg-scroll"><table class="seg-tabla"><thead><tr><th${segThAttrs('c:pagares:cliente')}>Cliente</th><th${segThAttrs('c:pagares:tipo','92px')}>Tipo</th><th${segThAttrs('c:pagares:vence','132px')}>Vencimiento</th><th${segThAttrs('c:pagares:importe','100px')}>Importe</th><th${segThAttrs('c:pagares:cobrado','44px','seg-c')} title="Cobrado">✓</th><th class="seg-x"></th></tr></thead><tbody>${body}</tbody></table></div>${resumen}</div>`;
}
function segVacacionesHtml(){
  const personas=seguimiento.vacaciones.map(p=>{
    const total=(p.periodos||[]).reduce((s,x)=>s+segDias(x.desde,x.hasta),0);
    const filas=(p.periodos||[]).map(x=>`<tr>
      <td${segTdAttrs('c:vac:desde')}><input class="seg-in" type="date" data-segv="${p.id}" data-pid="${x.id}" data-k="desde" value="${segEsc(x.desde)}"></td>
      <td${segTdAttrs('c:vac:hasta')}><input class="seg-in" type="date" data-segv="${p.id}" data-pid="${x.id}" data-k="hasta" value="${segEsc(x.hasta)}"></td>
      <td class="seg-dias"${segTdAttrs('c:vac:dias')}>${segDias(x.desde,x.hasta)||''}</td>
      <td${segTdAttrs('c:vac:nota')}><input class="seg-in" data-segv="${p.id}" data-pid="${x.id}" data-k="nota" value="${segEsc(x.nota)}" placeholder="nota" autocomplete="off"></td>
      <td class="seg-x"><button class="seg-del" data-sact="periodo-del" data-b="${p.id}" data-id="${x.id}" title="Quitar">✕</button></td></tr>`).join('')
      ||`<tr><td colspan="5" class="seg-vacio">Sin periodos</td></tr>`;
    return `<div class="seg-persona">
      <div class="seg-persona-cab${segModoColor?' seg-colorable':''}"${segCol('p:'+p.id)?` style="background:${segCol('p:'+p.id)};color:${segTexto(segCol('p:'+p.id))}"`:''}${segCk('p:'+p.id)}><input class="seg-in seg-nombre" data-segv="${p.id}" data-k="nombre" value="${segEsc(p.nombre)}" placeholder="Nombre" autocomplete="off">
        <button class="seg-mas seg-mas-claro" data-sact="periodo-add" data-b="${p.id}">+ Periodo</button>
        <button class="seg-del" data-sact="persona-del" data-b="${p.id}" title="Quitar a esta persona">🗑</button></div>
      <div class="seg-scroll"><table class="seg-tabla"><thead><tr><th${segThAttrs('c:vac:desde','132px')}>Desde</th><th${segThAttrs('c:vac:hasta','132px')}>Hasta</th><th${segThAttrs('c:vac:dias','48px')}>Días</th><th${segThAttrs('c:vac:nota')}>Nota</th><th class="seg-x"></th></tr></thead><tbody>${filas}</tbody></table></div>
      <div class="seg-resumen"><span>Total: <b>${total} días</b></span><input class="seg-in seg-nota-p" data-segv="${p.id}" data-k="nota" value="${segEsc(p.nota)}" placeholder="Nota (p. ej. días pendientes del año anterior)" autocomplete="off"></div></div>`;
  }).join('');
  return `<div class="seg-bloque">${segTitulo('Vacaciones','amarillo','<button class="seg-mas" data-sact="persona-add">+ Persona</button>','t:vacaciones')}
    <div class="seg-pad">${personas||'<div class="seg-vacio">Sin personas. Pulsa “+ Persona”.</div>'}</div></div>`;
}
function segTarifasHtml(){
  const grupos=seguimiento.tarifas.map(g=>{
    const filas=(g.filas||[]).map(f=>`<tr>
      <td><input class="seg-in" data-segt="${g.id}" data-fid="${f.id}" data-k="concepto" value="${segEsc(f.concepto)}" autocomplete="off"></td>
      <td><input class="seg-in seg-centro" data-segt="${g.id}" data-fid="${f.id}" data-k="valor" value="${segEsc(f.valor)}" autocomplete="off"></td>
      <td class="seg-x"><button class="seg-del" data-sact="tarifa-fila-del" data-b="${g.id}" data-id="${f.id}" title="Quitar">✕</button></td></tr>`).join('')
      ||`<tr><td colspan="3" class="seg-vacio">Sin filas</td></tr>`;
    const color=SEG_COLORES.includes(g.color)?g.color:'amarillo', cg=segCol('g:'+g.id);
    return `<div class="seg-bloque seg-mini"${cg?` style="--tdc:${segMezcla(cg,.6)}"`:''}>
      <div class="seg-titulo${cg?'':' seg-'+color}${segModoColor?' seg-colorable':''}"${cg?` style="background:${cg};color:${segTexto(cg)}"`:''}${segCk('g:'+g.id)}><input class="seg-in seg-titulo-in" data-segt="${g.id}" data-k="titulo" value="${segEsc(g.titulo)}" placeholder="Título" autocomplete="off">
        <button class="seg-mas" data-sact="tarifa-color" data-b="${g.id}" title="Elegir el color de este bloque">🎨</button>
        <button class="seg-mas" data-sact="tarifa-fila-add" data-b="${g.id}">+</button>
        <button class="seg-mas" data-sact="tarifa-del" data-b="${g.id}" title="Quitar este bloque">🗑</button></div>
      <div class="seg-scroll"><table class="seg-tabla seg-sin-cab"><tbody>${filas}</tbody></table></div></div>`;
  }).join('');
  return grupos+`<button class="seg-nuevo-bloque" data-sact="tarifa-add">+ Añadir bloque de tarifas / notas</button>`;
}
function segBloqueHtml(id){
  switch(id){
    case 'permisos': return segTablaHtml('permisos');
    case 'renovaciones': return segTablaHtml('renovaciones');
    case 'acuenta': return segAcuentaHtml();
    case 'facturar': return segTablaHtml('facturar');
    case 'pagares': return segPagaresHtml();
    case 'tarifas': return segTarifasHtml();
    case 'vacaciones': return segVacacionesHtml();
  }
  return '';
}
function segItemHtml(id,zona,i,n){
  if(!segModoMover) return `<div class="seg-item" data-bloque="${id}">${segBloqueHtml(id)}</div>`;
  const arriba=!(i===0&&zona==='arriba'), abajo=!(i===n-1&&zona!=='arriba');
  return `<div class="seg-item seg-mov" data-bloque="${id}" draggable="true">
    <div class="seg-mover-bar"><span class="seg-grip" title="Arrastra">⠿</span><span class="seg-mover-nom">${SEG_NOMBRE_BLOQUE[id]}</span>
      ${arriba?`<button data-sact="mv" data-d="up" data-b="${id}" title="Subir">▲</button>`:''}
      ${abajo?`<button data-sact="mv" data-d="down" data-b="${id}" title="Bajar">▼</button>`:''}
      ${zona==='der'?`<button data-sact="mv" data-d="izq" data-b="${id}" title="Pasar a la columna izquierda">◀</button>`:''}
      ${zona==='izq'?`<button data-sact="mv" data-d="der" data-b="${id}" title="Pasar a la columna derecha">▶</button>`:''}
    </div>${segBloqueHtml(id)}</div>`;
}
function segBotonesCabecera(){
  const b=(act,txt,primario,titulo)=>`<button class="btn ${primario?'btn-primary':'btn-secondary'} btn-sm" data-sact="${act}"${titulo?` title="${titulo}"`:''}>${txt}</button>`;
  if(segModoMover) return b('mover-modo','✓ Listo',true)+b('layout-reset','Restablecer');
  if(segModoColor) return b('color-modo','✓ Listo',true)+b('colores-reset','Quitar todos los colores');
  return b('mover-modo','↕ Mover bloques',false,'Cambiar de sitio los bloques')+b('color-modo','🎨 Colores',false,'Cambiar los colores de títulos y columnas')
    +b('importar','⬆️ Importar Excel / PDF',false,'Importa desde el Excel (.xlsx) o el PDF de Permisos y Recordatorios')+b('exportar','⬇️ Exportar');
}
function renderSeguimiento(){
  const sec=document.getElementById('sec-seguimiento'); if(!sec) return;
  segRenderPendiente=false;
  const pos=window.scrollY, L=seguimiento.layout;
  const zona=(z,extra)=>`<div class="seg-col ${extra}${segModoMover?' seg-zona-mov':''}" data-zona="${z}">${L[z].map((id,i)=>segItemHtml(id,z,i,L[z].length)).join('')}${segModoMover&&!L[z].length?'<div class="seg-zona-vacia">Suelta aquí un bloque</div>':''}</div>`;
  sec.innerHTML=`
    <div class="section-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div class="section-title">Permisos y recordatorios</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${segBotonesCabecera()}</div>
      </div>
      ${segModoMover?'<div class="seg-ayuda">Usa las flechas de cada bloque (▲ ▼ ◀ ▶) o arrástralo desde ⠿. Pulsa “Listo” al terminar.</div>':''}
      ${segModoColor?'<div class="seg-ayuda">Pulsa el <b>título</b> de un bloque o la <b>cabecera de una columna</b> (las que tienen borde punteado) para elegir su color.</div>':''}
    </div>
    <div class="seg-grid">${zona('arriba','seg-full')}${zona('izq','')}${zona('der','')}</div>`;
  window.scrollTo(0,pos);
}
// ── Mover bloques ──
function segEncuentra(id){ const L=seguimiento.layout; const z=['arriba','izq','der'].find(z=>L[z].includes(id)); return {z,i:z?L[z].indexOf(id):-1}; }
function segMover(id,dir){
  const L=seguimiento.layout, {z,i}=segEncuentra(id); if(!z) return;
  const swap=(j)=>{ [L[z][j],L[z][i]]=[L[z][i],L[z][j]]; };
  if(dir==='up'){ if(i>0) swap(i-1); else if(z!=='arriba'){ L[z].splice(i,1); L.arriba.push(id); } }
  else if(dir==='down'){ if(i<L[z].length-1) swap(i+1); else if(z==='arriba'){ L.arriba.splice(i,1); L.izq.unshift(id); } }
  else if(dir==='izq'&&z==='der'){ L.der.splice(i,1); L.izq.splice(Math.min(i,L.izq.length),0,id); }
  else if(dir==='der'&&z==='izq'){ L.izq.splice(i,1); L.der.splice(Math.min(i,L.der.length),0,id); }
  saveSeguimiento('layout'); renderSeguimiento();
}
function segColocar(id,zonaDestino,antesDe){   // arrastrar y soltar
  const L=seguimiento.layout, {z,i}=segEncuentra(id); if(!z) return;
  L[z].splice(i,1);
  let j=antesDe?L[zonaDestino].indexOf(antesDe):-1; if(j<0) j=L[zonaDestino].length;
  L[zonaDestino].splice(j,0,id);
  saveSeguimiento('layout'); renderSeguimiento();
}
let segArrastrando=null;
document.addEventListener('dragstart',e=>{
  const it=e.target.closest&&e.target.closest('#sec-seguimiento .seg-item.seg-mov'); if(!it) return;
  segArrastrando=it.dataset.bloque; it.classList.add('seg-arrastrando');
  try{ e.dataTransfer.setData('text/plain',segArrastrando); e.dataTransfer.effectAllowed='move'; }catch(x){}
});
document.addEventListener('dragend',()=>{ segArrastrando=null; document.querySelectorAll('.seg-arrastrando,.seg-sobre').forEach(x=>x.classList.remove('seg-arrastrando','seg-sobre')); });
document.addEventListener('dragover',e=>{
  if(!segArrastrando) return;
  const zona=e.target.closest&&e.target.closest('#sec-seguimiento .seg-col'); if(!zona) return;
  e.preventDefault();
  document.querySelectorAll('.seg-sobre').forEach(x=>x.classList.remove('seg-sobre'));
  const it=e.target.closest('.seg-item'); (it&&it.dataset.bloque!==segArrastrando?it:zona).classList.add('seg-sobre');
});
document.addEventListener('drop',e=>{
  if(!segArrastrando) return;
  const zona=e.target.closest&&e.target.closest('#sec-seguimiento .seg-col'); if(!zona) return;
  e.preventDefault();
  const it=e.target.closest('.seg-item'), id=segArrastrando; segArrastrando=null;
  segColocar(id,zona.dataset.zona,it&&it.dataset.bloque!==id?it.dataset.bloque:null);
});

// ── Edición ──
function segFila(bloque,id){ return (seguimiento[bloque]||[]).find(f=>f.id===id); }
function segPersona(id){ return seguimiento.vacaciones.find(p=>p.id===id); }
function segGrupo(id){ return seguimiento.tarifas.find(g=>g.id===id); }
document.addEventListener('change',e=>{
  const el=e.target; if(!el.closest||!el.closest('#sec-seguimiento')) return;
  const k=el.dataset.k;
  if(el.dataset.seg){                                    // tablas sencillas y pagarés
    const f=segFila(el.dataset.seg,el.dataset.id); if(!f) return;
    f[k]=el.type==='checkbox'?el.checked:el.value;
    saveSeguimiento(el.dataset.seg);
    if(el.dataset.seg==='pagares'&&(k==='vence'||k==='cobrado'||k==='importe')) renderSeguimiento();
  } else if(el.dataset.segnota){
    seguimiento.acuentaNota=el.value; saveSeguimiento('acuentaNota');
  } else if(el.dataset.segv){                            // vacaciones
    const p=segPersona(el.dataset.segv); if(!p) return;
    if(el.dataset.pid){ const x=(p.periodos||[]).find(z=>z.id===el.dataset.pid); if(!x) return; x[k]=el.value; }
    else p[k]=el.value;
    saveSeguimiento('vacaciones');
    if(k==='desde'||k==='hasta') renderSeguimiento();
  } else if(el.dataset.segt){                            // tarifas
    const g=segGrupo(el.dataset.segt); if(!g) return;
    if(el.dataset.fid){ const f=(g.filas||[]).find(z=>z.id===el.dataset.fid); if(!f) return; f[k]=el.value; }
    else g[k]=el.value;
    saveSeguimiento('tarifas');
  }
});
document.addEventListener('focusout',()=>{ if(segRenderPendiente) setTimeout(()=>{ if(segRenderPendiente) pedirRenderSeguimiento(); },50); });
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-sact]'); if(!b||!b.closest('#sec-seguimiento')) return;
  const a=b.dataset.sact, bl=b.dataset.b, id=b.dataset.id;
  if(a==='fila-add'){ const nueva={id:segUid(),...(bl==='pagares'?{cliente:'',tipo:'Pagaré',vence:'',importe:'',cobrado:false}:SEG_TABLAS[bl].nueva())}; seguimiento[bl].push(nueva); saveSeguimiento(bl); renderSeguimiento(); focoUltimaFila(bl); }
  else if(a==='fila-del'){ const f=segFila(bl,id); const vacia=!f||Object.entries(f).every(([k,v])=>k==='id'||v===''||v===false||k==='tipo'); if(vacia||confirm('¿Quitar esta fila?')){ seguimiento[bl]=seguimiento[bl].filter(x=>x.id!==id); saveSeguimiento(bl); renderSeguimiento(); } }
  else if(a==='persona-add'){ seguimiento.vacaciones.push({id:segUid(),nombre:'',nota:'',periodos:[{id:segUid(),desde:'',hasta:'',nota:''}]}); saveSeguimiento('vacaciones'); renderSeguimiento(); }
  else if(a==='persona-del'){ const p=segPersona(bl); if(p&&confirm('¿Quitar a '+(p.nombre||'esta persona')+' y todos sus periodos?')){ seguimiento.vacaciones=seguimiento.vacaciones.filter(x=>x.id!==bl); saveSeguimiento('vacaciones'); renderSeguimiento(); } }
  else if(a==='periodo-add'){ const p=segPersona(bl); if(p){ (p.periodos=p.periodos||[]).push({id:segUid(),desde:'',hasta:'',nota:''}); saveSeguimiento('vacaciones'); renderSeguimiento(); } }
  else if(a==='periodo-del'){ const p=segPersona(bl); if(p){ p.periodos=(p.periodos||[]).filter(x=>x.id!==id); saveSeguimiento('vacaciones'); renderSeguimiento(); } }
  else if(a==='tarifa-add'){ seguimiento.tarifas.push({id:segUid(),titulo:'',color:'amarillo',filas:[{id:segUid(),concepto:'',valor:''}]}); saveSeguimiento('tarifas'); renderSeguimiento(); }
  else if(a==='tarifa-del'){ const g=segGrupo(bl); if(g&&confirm('¿Quitar el bloque “'+(g.titulo||'sin título')+'”?')){ seguimiento.tarifas=seguimiento.tarifas.filter(x=>x.id!==bl); saveSeguimiento('tarifas'); renderSeguimiento(); } }
  else if(a==='tarifa-fila-add'){ const g=segGrupo(bl); if(g){ (g.filas=g.filas||[]).push({id:segUid(),concepto:'',valor:''}); saveSeguimiento('tarifas'); renderSeguimiento(); } }
  else if(a==='tarifa-fila-del'){ const g=segGrupo(bl); if(g){ g.filas=(g.filas||[]).filter(x=>x.id!==id); saveSeguimiento('tarifas'); renderSeguimiento(); } }
  else if(a==='tarifa-color'){ segAbrirPaleta('g:'+bl,e.clientX,e.clientY); }
  else if(a==='mover-modo'){ segModoMover=!segModoMover; renderSeguimiento(); }
  else if(a==='color-modo'){ segModoColor=!segModoColor; segCerrarPaleta(); renderSeguimiento(); }
  else if(a==='colores-reset'){ if(confirm('¿Quitar todos los colores personalizados y volver a los de fábrica?')){ seguimiento.colores={}; saveSeguimiento('colores'); renderSeguimiento(); } }
  else if(a==='mv') segMover(bl,b.dataset.d);
  else if(a==='layout-reset'){ seguimiento.layout=JSON.parse(JSON.stringify(SEG_LAYOUT_DEFECTO)); saveSeguimiento('layout'); renderSeguimiento(); }
  else if(a==='exportar') exportarSeguimiento();
  else if(a==='importar') importarSeguimiento();
});
function focoUltimaFila(bloque){
  const els=document.querySelectorAll(`#sec-seguimiento [data-seg="${bloque}"][data-k]`);
  const ultima=seguimiento[bloque][seguimiento[bloque].length-1]; if(!ultima) return;
  const primero=[...els].find(x=>x.dataset.id===ultima.id); if(primero) primero.focus();
}

// ── Exportar / importar ──
function exportarSeguimiento(){
  const datos={app:'GARVI',tipo:'seguimiento',fecha:new Date().toISOString(),datos:{}};
  SEG_BLOQUES.forEach(b=>datos.datos[b]=seguimiento[b]);
  const blob=new Blob([JSON.stringify(datos,null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='garvi-seguimiento-'+todayISO()+'.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toastMsg('Seguimiento exportado ✓');
}
function importarSeguimiento(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.xlsx,.xls,.pdf,.json,application/json,application/pdf';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    if(/\.json$/i.test(f.name)) return importarSeguimientoJson(f);
    toastMsg('Leyendo '+f.name+'…');
    leerArchivoSeguimiento(f).then(res=>mostrarResumenImportSeguimiento(res,f.name))
      .catch(e=>{ console.error(e); toastMsg('No se pudo leer el archivo: '+(e.message||e)); });
  };
  inp.click();
}
function importarSeguimientoJson(f){
  f.text().then(t=>{
    const j=JSON.parse(t); const d=j.datos||j;
    if(!SEG_BLOQUES.some(b=>d[b]!==undefined)) throw new Error('El archivo no parece de Seguimiento');
    if(!confirm('Se reemplazarán los datos actuales de esta sección por los del archivo. ¿Seguir?')) return;
    SEG_BLOQUES.forEach(b=>{ if(d[b]!==undefined){ seguimiento[b]=d[b]; } });
    saveSeguimiento(); SEG_BLOQUES.forEach(b=>{ if(d[b]!==undefined) syncSeguimiento(b); });
    renderSeguimiento(); toastMsg('Datos importados ✓');
  }).catch(e=>{ console.error(e); toastMsg('No se pudo importar: '+(e.message||e)); });
}

// ── Selector de color (ventanita junto a lo pulsado) ──
function segCerrarPaleta(){ const p=document.getElementById('seg-paleta'); if(p) p.remove(); }
function segSetColor(k,hex){
  if(!hex) delete seguimiento.colores[k]; else seguimiento.colores[k]=hex;
  saveSeguimiento('colores'); segCerrarPaleta(); renderSeguimiento();
}
function segAbrirPaleta(k,x,y){
  segCerrarPaleta();
  const actual=segCol(k)||'#fde68a';
  const p=document.createElement('div'); p.id='seg-paleta'; p.className='seg-paleta'; p.dataset.k=k;
  p.innerHTML=`<div class="seg-paleta-grid">${SEG_PALETA.map(c=>`<button class="seg-sw${actual.toLowerCase()===c?' on':''}" style="background:${c}" data-pc="${c}" title="${c}"></button>`).join('')}</div>
    <label class="seg-paleta-otro">Otro color <input type="color" value="${actual}"></label>
    <button class="seg-paleta-quitar" data-pc="">Quitar color</button>`;
  document.body.appendChild(p);
  const w=p.offsetWidth, h=p.offsetHeight;
  p.style.left=Math.max(8,Math.min(x,window.innerWidth-w-8))+'px';
  p.style.top=Math.max(8,Math.min(y+8,window.innerHeight-h-8))+'px';
  p.querySelector('input[type=color]').addEventListener('change',e=>segSetColor(k,e.target.value));
}
document.addEventListener('click',e=>{
  const sw=e.target.closest&&e.target.closest('#seg-paleta [data-pc]');
  if(sw){ segSetColor(document.getElementById('seg-paleta').dataset.k,sw.dataset.pc); return; }
  if(e.target.closest&&e.target.closest('#seg-paleta')) return;
  // clic en un título o cabecera "coloreable" (solo en modo Colores)
  const t=e.target.closest&&e.target.closest('#sec-seguimiento [data-ckey]');
  if(t&&segModoColor&&!e.target.closest('button,input,select,textarea,a')){ e.stopPropagation(); segAbrirPaleta(t.dataset.ckey,e.clientX,e.clientY); return; }
  if(!(e.target.closest&&e.target.closest('[data-sact="tarifa-color"]'))) segCerrarPaleta();
},true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') segCerrarPaleta(); });
