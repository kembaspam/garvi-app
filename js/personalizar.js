// ─── ORDENAR EL MENÚ LATERAL ───────────────────────────────────────────────
// El botón ↕ (pie del menú en ordenador, "Ordenar" en la barra de abajo en móvil) abre una lista
// con las secciones: se reordenan con ▲ ▼ o arrastrando. El orden se guarda en el dispositivo
// y se sincroniza en la nube (config/ui → campo "menu"), así que es el mismo en todos los equipos.
// Las secciones nuevas que añada la app en el futuro aparecen al final, sin romper tu orden.
const MENU_CLAVE='garvi_menu_orden';
let menuOrdenDefecto=[];

function menuBotones(){ return [...document.querySelectorAll('.sidebar-nav .tab-btn[data-action="tab"]')]; }
function menuOrdenActual(){ return menuBotones().map(b=>b.dataset.param); }
function menuEtiqueta(p){ const b=menuBotones().find(x=>x.dataset.param===p); const l=b&&b.querySelector('.tab-label'); return l?l.textContent.trim():p; }
function menuAplicar(orden){
  const nav=document.querySelector('.sidebar-nav'); if(!nav||!Array.isArray(orden)) return;
  const por={}; menuBotones().forEach(b=>por[b.dataset.param]=b);
  const final=[...orden.filter(p=>por[p]), ...menuBotones().map(b=>b.dataset.param).filter(p=>!orden.includes(p))];
  const extras=[...nav.querySelectorAll('.tab-btn:not([data-action="tab"])')];   // 💾 Copia, ↕ Ordenar… siempre al final
  final.forEach(p=>nav.appendChild(por[p]));
  extras.forEach(b=>nav.appendChild(b));
}
function menuCargarLocal(){
  try{ const o=JSON.parse(localStorage.getItem(MENU_CLAVE)||'null'); if(Array.isArray(o)) menuAplicar(o); }catch(e){}
}
function menuGuardar(orden){
  try{ localStorage.setItem(MENU_CLAVE,JSON.stringify(orden)); }catch(e){}
  if(fbDb&&fbReady) fbDb.collection('config').doc('ui').set({menu:orden},{merge:true}).catch(e=>console.error('Error guardando el orden del menú:',e));
}
function suscribirMenu(){
  if(!fbDb) return;
  fbDb.collection('config').doc('ui').onSnapshot(doc=>{
    if(!doc.exists||doc.metadata.hasPendingWrites) return;
    const m=doc.data().menu; if(!Array.isArray(m)) return;
    if(JSON.stringify(m)===JSON.stringify(menuOrdenActual())) return;
    try{ localStorage.setItem(MENU_CLAVE,JSON.stringify(m)); }catch(e){}
    menuAplicar(m);
    if(document.getElementById('menu-orden-lista')) pintarOrdenMenu();
  },err=>console.error('ui onSnapshot:',err));
}

// ── Ventana de ordenar ──
function abrirOrdenMenu(){
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-header"><span class="modal-title">Ordenar el menú</span><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div>
    <div style="font-size:12.5px;color:var(--text2);margin-bottom:8px">Sube o baja cada sección con ▲ ▼ (o arrástrala). Se guarda solo.</div>
    <div id="menu-orden-lista"></div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-secondary btn-full" data-mact="reset">Restablecer</button>
      <button class="btn btn-primary btn-full" data-action="close-modal">Listo</button>
    </div>`;
  document.getElementById('modal-overlay').classList.add('open');
  pintarOrdenMenu();
}
function pintarOrdenMenu(){
  const el=document.getElementById('menu-orden-lista'); if(!el) return;
  const o=menuOrdenActual();
  el.innerHTML=o.map((p,i)=>`<div class="orden-item" draggable="true" data-p="${p}">
      <span class="orden-grip">⠿</span><span class="orden-nom">${segEsc(menuEtiqueta(p))}</span>
      <button data-mact="up" data-p="${p}" ${i===0?'disabled':''} title="Subir">▲</button>
      <button data-mact="down" data-p="${p}" ${i===o.length-1?'disabled':''} title="Bajar">▼</button></div>`).join('');
}
function menuMover(p,dir){
  const o=menuOrdenActual(), i=o.indexOf(p), j=dir==='up'?i-1:i+1;
  if(i<0||j<0||j>=o.length) return;
  [o[i],o[j]]=[o[j],o[i]];
  menuAplicar(o); menuGuardar(o); pintarOrdenMenu();
}
document.addEventListener('click',e=>{
  const o=e.target.closest&&e.target.closest('[data-action="ordenar-menu"]'); if(o){ abrirOrdenMenu(); return; }
  const b=e.target.closest&&e.target.closest('[data-mact]'); if(!b) return;
  if(b.dataset.mact==='reset'){ menuAplicar(menuOrdenDefecto); menuGuardar(menuOrdenDefecto.slice()); pintarOrdenMenu(); }
  else menuMover(b.dataset.p,b.dataset.mact);
});
let menuArrastrando=null;
document.addEventListener('dragstart',e=>{ const it=e.target.closest&&e.target.closest('.orden-item'); if(!it) return; menuArrastrando=it.dataset.p; try{e.dataTransfer.setData('text/plain',menuArrastrando);}catch(x){} });
document.addEventListener('dragover',e=>{ if(menuArrastrando&&e.target.closest&&e.target.closest('.orden-item')) e.preventDefault(); });
document.addEventListener('drop',e=>{
  if(!menuArrastrando) return;
  const it=e.target.closest&&e.target.closest('.orden-item'); if(!it) return;
  e.preventDefault();
  const o=menuOrdenActual(), de=o.indexOf(menuArrastrando), a=o.indexOf(it.dataset.p); menuArrastrando=null;
  if(de<0||a<0||de===a) return;
  o.splice(a,0,o.splice(de,1)[0]);
  menuAplicar(o); menuGuardar(o); pintarOrdenMenu();
});
document.addEventListener('dragend',()=>{ menuArrastrando=null; });

// Al cargar: guarda el orden de fábrica (para "Restablecer") y aplica el orden guardado.
menuOrdenDefecto=menuOrdenActual();
menuCargarLocal();
