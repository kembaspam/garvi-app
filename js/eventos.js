// ─── MODAL HELPERS ────────────────────────────────────────────────
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}

// ─── FOTO ─────────────────────────────────────────────────────────
function fotoInput(num){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.capture='environment';
  inp.onchange=()=>{
    const file=inp.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{const c=getContainer(num);if(!c) return;if(!c.fotos) c.fotos=[];c.fotos.push(e.target.result);saveContainers();openContainerModal(num);};
    reader.readAsDataURL(file);
  };
  inp.click();
}
function delFoto(num,idx){const c=getContainer(num);if(!c) return;c.fotos.splice(idx,1);saveContainers();openContainerModal(num);}

// ─── EVENTOS ──────────────────────────────────────────────────────
// Antes se cerraba el modal con un solo toque fuera de él (fácil de tocar sin querer y perder
// lo que se estaba editando en un contenedor). Ahora solo se cierra con el botón ✕ o al guardar.
document.addEventListener('input',e=>{
  if(e.target.dataset.action==='edit-linea'){
    const idx=+e.target.dataset.idx; const field=e.target.dataset.field;
    editLinea(idx,field,e.target.value);
    saveFacturaDraft();
  } else if(e.target.dataset.action==='pres-price'){
    presPrices[+e.target.dataset.idx]=parseFloat(e.target.value)||0;
  } else if(['f-num','f-fecha','f-venc','f-cliente','f-nif','f-dir','f-tel','f-email','f-notas'].includes(e.target.id)){
    saveFacturaDraft();
  }
});
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-action]'); if(!btn) return;
  const {action,param,idx}=btn.dataset;
  if(action==='login') handleLogin();
  else if(action==='tab') renderTab(param);
  else if(action==='open-cont') openContainerModal(param);
  else if(action==='save-cont') saveContainerModal(param);
  else if(action==='del-cont'){if(confirm('¿Eliminar contenedor '+param+'?')){containers=containers.filter(c=>c.num!==param);saveContainers();syncContenedores.borrar(param);syncClientes();closeModal();renderContenedores();updateBadge();toastMsg('Eliminado');}}
  else if(action==='nuevo-cont') nuevoContModal();
  else if(action==='crear-cont') crearContenedor();
  else if(action==='foto-cont') fotoInput(param);
  else if(action==='editar-rapido') editarRapidoModal();
  else if(action==='er-buscar') erBuscar();
  else if(action==='er-listo') erGuardar(param);
  else if(action==='er-foto-albaran') erFotoAlbaran(param);
  else if(action==='er-foto-albaran-buscar') erFotoAlbaranBuscar();
  else if(action==='gemini-key'){ if(pedirGeminiApiKey()) toastMsg('Clave de Gemini guardada ✓'); }
  else if(action==='ver-historial-cont') verHistorialContenedor(param);
  else if(action==='mandar-aviso-cont') mandarAvisoDesdeCont(param);
  else if(action==='del-foto') delFoto(param,+btn.dataset.idx);
  else if(action==='filter-estado'){filterEstado=param;applyContFilter();}
  else if(action==='cont-view'){contView=param;applyContFilter();}
  else if(action==='filter-retirar'){contView='retirar';filterEstado='todos';searchQ='';const si=document.getElementById('cont-search');if(si)si.value='';applyContFilter();}
  else if(action==='close-modal') closeModal();
  else if(action==='nuevo-albaran') nuevoAlbaranModal();
  else if(action==='nuevo-albaran-from') {closeModal();renderTab('albaranes');setTimeout(()=>nuevoAlbaranModal(param),50);}
  else if(action==='crear-albaran') crearAlbaran(param);
  else if(action==='del-albaran'){albaranes=albaranes.filter(a=>a.id!==param);saveAlbaranes();syncAlbaranesCol.borrar(param);renderAlbaranes();toastMsg('Eliminado');}
  else if(action==='pdf-albaran') pdfAlbaran(param);
  else if(action==='pdf-albaranes') pdfAlbaranes();
  else if(action==='pdf-contenedores') pdfContenedores();
  else if(action==='excel-contenedores') excelContenedores();
  else if(action==='cont-map-retry') recalcularUbicaciones();
  else if(action==='cont-map-fullscreen') toggleMapFullscreen();
  else if(action==='pdf-finanzas') pdfFinanzas();
  else if(action==='pdf-clientes') pdfClientes();
  else if(action==='pdf-tareas') pdfTareas();
  else if(action==='nueva-factura') nuevaFacturaModal();
  else if(action==='ajustar-numeracion') ajustarNumeracionModal();
  else if(action==='guardar-numeracion') guardarNumeracion();
  else if(action==='ver-factura') nuevaFacturaModal(param);
  else if(action==='hacer-factura') hacerFactura(param);
  else if(action==='del-factura'){if(confirm('¿Eliminar?')){facturas=facturas.filter(f=>f.id!==param);saveFacturas();syncFacturasCol.borrar(param);renderFacturas();updateBadge();toastMsg('Eliminado');}}
  else if(action==='pdf-factura') pdfFactura(param);
  else if(action==='pdf-facturas') pdfFacturas();
  else if(action==='pdf-cobros-pendientes') pdfCobrosPendientes();
  else if(action==='facturas-view'){facturasView=param;renderFacturas();}
  else if(action==='toggle-avisado'){
    const f=facturas.find(x=>x.id===param); if(f){ f.avisado=!f.avisado; saveFacturas();syncFacturasCol.guardar(f);renderCobrosPendientes(); }
  }
  else if(action==='toggle-cobrada'){
    const f=facturas.find(x=>x.id===param); if(f){
      f.cobrada=!f.cobrada; f.fechaCobro=f.cobrada?todayISO():'';
      saveFacturas();syncFacturasCol.guardar(f);renderCobrosPendientes();updateBadge();
      toastMsg(f.cobrada?'Marcada como cobrada ✓':'Marcada como pendiente de nuevo');
    }
  }
  else if(action==='concepto-grupo'){conceptoGrupo=param;document.querySelectorAll('.qbtn-tab').forEach(b=>b.classList.toggle('active',b.dataset.param===param));renderQBtns();}
  else if(action==='nueva-factura-cl'){closeModal();setTimeout(()=>{renderTab('facturas');setTimeout(()=>{nuevaFacturaModal();setTimeout(()=>{const el=document.getElementById('f-cliente');if(el) el.value=param;},50);},50);},50);}
  else if(action==='fact-mode'){
    factMode=param;
    document.querySelectorAll('.fact-toggle-btn').forEach(b=>b.classList.toggle('active',b.dataset.param===param));
    const vr=document.getElementById('f-venc-row');
    const fn=document.getElementById('f-num');
    if(vr) vr.style.display=param==='factura'?'grid':'none';
    if(fn&&!fn.value.startsWith('P-')&&!fn.value.startsWith('F-')){saveFacturaDraft();return;}
    if(fn) fn.value=(param==='proforma'?'P-':'F-')+String((param==='proforma'?cfg.ultimaProf||0:cfg.ultimaFact||0)+1).padStart(3,'0');
    saveFacturaDraft();
  }
  else if(action==='add-concepto') addConcepto(btn.dataset.label,btn.dataset.precio,btn.dataset.iva);
  else if(action==='add-linea') addLinea();
  else if(action==='del-linea') delLinea(+param);
  else if(action==='guardar-factura') guardarFactura();
  else if(action==='pdf-factura-preview') pdfFactura(editFactId);
  else if(action==='nueva-factura-cl') {closeModal();}
  else if(action==='nuevo-fin') nuevoFinModal();
  else if(action==='crear-fin') crearFin();
  else if(action==='del-fin'){finanzas=finanzas.filter(f=>f.id!==param);saveFinanzas();syncFinanzasCol.borrar(param);renderFinanzas();toastMsg('Eliminado');}
  else if(action==='fin-tab'){finTab=param;renderFinanzas();}
  else if(action==='fin-modal-tab'){
    document.getElementById('fin-tipo').value=param;
    document.getElementById('ft-ing').classList.toggle('active',param==='ingreso');
    document.getElementById('ft-gas').classList.toggle('active',param==='gasto');
  }
  else if(action==='ver-cliente') verClienteModal(param);
  else if(action==='nueva-tarea') nuevaTareaModal();
  else if(action==='crear-tarea') crearTarea();
  else if(action==='del-tarea'){tareas=tareas.filter(t=>t.id!==param);saveTareas();syncTareasCol.borrar(param);renderTareas();toastMsg('Eliminado');}
  else if(action==='toggle-tarea'){const t=tareas.find(x=>x.id===param);if(t){t.done=!t.done;saveTareas();syncTareasCol.guardar(t);renderTareas();}}
  else if(action==='tareas-filter'){tareasFilter=param;renderTareas();}
  // Cambiar de tipo de documento SOLO redibuja: presItems/presDireccion/presFecha son variables
  // globales aparte, nunca se tocan aquí, así que nada de lo ya introducido se pierde.
  else if(action==='pres-doctype'){presDocType=param;renderPresupuestos();}
  else if(action==='add-pres-item'){const i=+param;initPresPrices();presItems.push({name:CATALOG_PRES[i].name,price:presPrices[i]??CATALOG_PRES[i].price,iva:CATALOG_PRES[i].iva});renderPresupuestos();}
  else if(action==='del-pres-item'){presItems.splice(+param,1);renderPresupuestos();}
  else if(action==='clear-pres'){presItems=[];renderPresupuestos();}
  else if(action==='pres-scroll'){const el=document.getElementById('pres-preview-section');if(el) el.scrollIntoView({behavior:'smooth'});}
  else if(action==='pres-print') printPresupuesto();
  else if(action==='pres-pdf') pdfPresupuesto();
  else if(action==='pres-email') emailPresupuesto();
  else if(action==='guardar-cliente-extra'){const c=clientes.find(x=>x.id===param);if(c){saveClienteExtra(c.nombre,{dirFacturacion:(document.getElementById('cl-extra-dir')||{}).value||'',cif:(document.getElementById('cl-extra-cif')||{}).value||''});syncClientes();toastMsg('Datos de facturación guardados ✓');verClienteModal(param);}}
  else if(action==='add-concepto-cliente-modal') addConceptoClienteModal(param);
  else if(action==='del-concepto-cliente') delConceptoCliente(param,Number(btn.dataset.idx));
  else if(action==='add-concepto-cliente') addConceptoCliente(btn.dataset.cliente,Number(btn.dataset.idx));
  else if(action==='logout') logout();
  else if(action==='exportar-copia') exportarCopia();
  else if(action==='cal-prev') calChangeMonth(-1);
  else if(action==='cal-next') calChangeMonth(1);
  else if(action==='cal-sel-day') calSelectDay(param);
  else if(action==='cal-search-toggle') calSearchToggle();
  else if(action==='cal-search-go') calSearchGo(param);
  else if(action==='nuevo-aviso') nuevoAvisoModal();
  else if(action==='editar-aviso') nuevoAvisoModal(param);
  else if(action==='crear-aviso') crearAviso();
  else if(action==='del-aviso'){if(confirm('¿Eliminar aviso?')) delAviso(param);}
  else if(action==='completar-unidad'){
    const a=avisos.find(x=>x.id===param);
    if(a){
      if(!Array.isArray(a.completados)) a.completados=[];
      if(a.completados.length<(a.cantidad||1)){ a.completados.push(new Date().toISOString()); saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar(); }
    }
  }
  else if(action==='deshacer-unidad-idx'){
    const a=avisos.find(x=>x.id===param);
    if(a&&Array.isArray(a.completados)){ a.completados.splice(+idx,1); saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar(); }
  }
  else if(action==='add-unidad-cliente') agregarUnidadParaCliente(param,btn.dataset.tipo);
  else if(action==='quitar-unidad') quitarUnidadAviso(param,idx);
  else if(action==='quitar-extra') quitarUnidadExtra(param,idx);
  else if(action==='completar-extra'){
    const a=avisos.find(x=>x.id===param);
    if(a&&Array.isArray(a.extra)&&a.extra[+idx]&&!a.extra[+idx].completadoEn){
      a.extra[+idx].completadoEn=new Date().toISOString();
      saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar();
    }
  }
  else if(action==='deshacer-extra'){
    const a=avisos.find(x=>x.id===param);
    if(a&&Array.isArray(a.extra)&&a.extra[+idx]){
      a.extra[+idx].completadoEn=null;
      saveAvisos(); syncAviso(a); renderAgenda(); renderCalendar();
    }
  }
  else if(action==='copy-aviso') iniciarCopiaAviso(param);
  else if(action==='confirmar-copia-aviso') confirmarCopiaAviso(param);
  else if(action==='guardar-certificado') guardarCertificado();
  else if(action==='nuevo-certificado') nuevoCertificado();
  else if(action==='ver-certificado') verCertificado(param);
  else if(action==='del-certificado'){if(confirm('¿Eliminar certificado?')) delCertificado(param);}
  else if(action==='pdf-certificado') pdfCertificado(param);
  else if(action==='cert-pdf') pdfCertificado(null);
});
document.getElementById('li-pass').addEventListener('keydown',e=>{if(e.key==='Enter') handleLogin();});
document.getElementById('li-user').addEventListener('keydown',e=>{if(e.key==='Enter') document.getElementById('li-pass').focus();});

// ─── CABECERA FIJA EN MÓVIL (refuerzo por JS) ──────────────────────
// En algunos navegadores/WebView de Android, position:sticky de .section-header no se
// aplica en este contexto (se queda anclado en su sitio en vez de pegarse arriba al hacer
// scroll). Esto lo fuerza a mano con position:fixed, comprobando en cada scroll si la
// cabecera de la sección visible ha llegado al borde superior; solo actúa en móvil (en
// escritorio ya funciona con el CSS). Se re-sincroniza solo tras cada repintado de la app
// (MutationObserver), para que sobreviva a los renderContenedores()/renderTab() etc.
(function(){
  const esMovil=()=>window.matchMedia('(max-width:767px)').matches;
  let activeHeader=null, activeSection=null, naturalTop=0, fixed=false;
  function soltar(){
    if(activeHeader){
      activeHeader.style.position='';activeHeader.style.top='';
      activeHeader.style.left='';activeHeader.style.width='';activeHeader.style.zIndex='';
    }
    if(activeSection) activeSection.style.paddingTop='';
    fixed=false;
  }
  function sync(){
    if(!esMovil()){ if(activeHeader) soltar(); activeHeader=null; activeSection=null; return; }
    const sec=document.querySelector('.section.active');
    const header=sec&&sec.querySelector(':scope>.section-header');
    if(header!==activeHeader){ soltar(); activeHeader=header; activeSection=sec; }
    if(!header||!sec) return;
    const appEl=document.getElementById('app');
    const appRect=appEl.getBoundingClientRect();
    if(fixed){
      if(window.scrollY<=naturalTop){ soltar(); return; }
      header.style.left=appRect.left+'px'; header.style.width=appRect.width+'px';
      return;
    }
    const rect=header.getBoundingClientRect();
    if(rect.top<=0){
      naturalTop=window.scrollY+rect.top;
      const h=rect.height;
      header.style.position='fixed'; header.style.top='0';
      header.style.left=appRect.left+'px'; header.style.width=appRect.width+'px'; header.style.zIndex='50';
      sec.style.paddingTop=h+'px';
      fixed=true;
    }
  }
  let ticking=false;
  function onScroll(){ if(ticking) return; ticking=true; requestAnimationFrame(()=>{sync();ticking=false;}); }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  document.addEventListener('DOMContentLoaded',()=>{
    const appEl=document.getElementById('app');
    if(appEl) new MutationObserver(()=>{soltar();activeHeader=null;activeSection=null;onScroll();}).observe(appEl,{childList:true,subtree:true});
  });
})();

// ─── INIT ─────────────────────────────────────────────────────────
checkSession();
initFirebase();
['garvi-logo-sidebar','garvi-logo-login'].forEach(id=>{const el=document.getElementById(id);if(el)el.src='data:image/png;base64,'+PRES_LOGO_B64;});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(()=>console.log('SW OK')).catch(e=>console.log('SW:',e));}
