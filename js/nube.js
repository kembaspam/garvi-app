// ─── ESTADO ───────────────────────────────────────────────────────
const LSKEY='garvi_v17';
let currentUser='', currentTab='contenedores', filterEstado='todos', searchQ='';
let containers=[], albaranes=[], tareas=[], finanzas=[], facturas=[], clientes=[], cfg={}, certificados=[], avisos=[];
let calMonth=new Date().getMonth(), calYear=new Date().getFullYear(), calSelDay=todayISO();
const TIPOS_RESIDUO=['MEZCLA','BASURA','LIMPIO','PODA','ÁRIDO','ESPECIAL','ESCOMBRO','CARGA RÁPIDA','MADERA'];

// ─── MODO ADMINISTRADOR (sincronización en la nube con Firebase) ──
const firebaseConfig={
  apiKey:"AIzaSyBKuwL8yzG0F_wPj9SpoKwc-M7Y0X9zpYU",
  authDomain:"garvi-app.firebaseapp.com",
  projectId:"garvi-app",
  storageBucket:"garvi-app.firebasestorage.app",
  messagingSenderId:"990238414790",
  appId:"1:990238414790:web:165471490c6edba3a504c7"
};
let fbDb=null, fbReady=false, avisosUnsub=null, lastSyncStatus='off', datosLocalesCargados=false;
function intentarMigrarYSuscribir(){ if(fbReady&&datosLocalesCargados) migrarYSuscribirTodo(); }
function setSyncStatus(estado){
  // estado: 'off' | 'conectando' | 'on' | 'error'
  lastSyncStatus=estado;
  const el=document.getElementById('sync-status'); if(!el) return;
  const cfgs={
    off:{txt:'',cls:''},
    conectando:{txt:'🔄 Conectando sincronización…',cls:'sync-conectando'},
    on:{txt:'☁️ Sincronizado en la nube',cls:'sync-on'},
    error:{txt:'⚠️ Sin conexión a la nube (usando datos locales)',cls:'sync-error'},
  };
  const c=cfgs[estado]||cfgs.off;
  el.textContent=c.txt; el.className='sync-status '+c.cls;
}
let syncIniciada=false;
function iniciarSincronizacionNube(){
  if(syncIniciada) return;
  syncIniciada=true; fbReady=true;
  setSyncStatus('on');
  migrarAvisosLocalesAFirestore().then(suscribirAvisosFirestore);
  intentarMigrarYSuscribir();
  programarCopiaAutomatica();
}
// La nube solo se usa con una CUENTA REAL de Firebase (email/contraseña, ver SEGURIDAD.md): ya no
// se entra como usuario anónimo. Si el dispositivo tenía la sesión anónima antigua, se cierra y
// se vuelve a pedir usuario y contraseña (una sola vez).
function initFirebase(){
  if(typeof firebase==='undefined'){ setSyncStatus('error'); return; }
  try{
    setSyncStatus('conectando');
    firebase.initializeApp(firebaseConfig);
    fbDb=firebase.firestore();
    fbDb.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    firebase.auth().onAuthStateChanged(user=>{
      if(user&&!user.isAnonymous){ iniciarSincronizacionNube(); return; }
      fbReady=false; syncIniciada=false;
      setSyncStatus('off');
      if(user&&user.isAnonymous) firebase.auth().signOut().catch(()=>{});
      if(localStorage.getItem('garvi_session')){   // sesión local sin cuenta de Firebase -> volver a entrar
        localStorage.removeItem('garvi_session'); sessionStorage.removeItem('garvi_session');
        location.reload();
      }
    },e=>{ console.error('Firebase auth:',e); setSyncStatus('error'); });
  }catch(e){
    console.error('Firebase init:',e);
    setSyncStatus('error');
  }
}
// Sube (una sola vez por dispositivo) los avisos que ya hubiera guardados en local ANTES de empezar a sincronizar,
// para fusionarlos con la nube en vez de que la suscripción los tape.
function migrarAvisosLocalesAFirestore(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_avisos_migrados_v1')) return Promise.resolve();
  let locales=[];
  try{ locales=JSON.parse(localStorage.getItem('garvi_avisos')||'[]'); }catch(e){}
  if(!locales.length){ localStorage.setItem('garvi_avisos_migrados_v1','1'); return Promise.resolve(); }
  locales.forEach(migrarAviso);
  const escrituras=locales.map(a=>fbDb.collection('avisos').doc(a.id).set(a).catch(e=>console.error('Error subiendo aviso local:',e)));
  return Promise.all(escrituras).then(()=>{
    localStorage.setItem('garvi_avisos_migrados_v1','1');
    toastMsg(`${locales.length} aviso(s) de este dispositivo subido(s) a la nube ✓`);
  });
}
function suscribirAvisosFirestore(){
  if(!fbDb) return;
  if(avisosUnsub) avisosUnsub();
  avisosUnsub=fbDb.collection('avisos').onSnapshot(snap=>{
    const nuevos=[];
    snap.forEach(doc=>nuevos.push(doc.data()));
    nuevos.forEach(migrarAviso);
    avisos=nuevos;
    saveAvisos();
    if(document.getElementById('sec-inicio')&&currentTab==='inicio'){ renderCalendar(); renderAgenda(); }
    setSyncStatus('on');
  },err=>{
    console.error('Firestore avisos onSnapshot:',err);
    setSyncStatus('error');
  });
}
function syncAviso(a){
  if(!fbDb||!fbReady) return;
  fbDb.collection('avisos').doc(a.id).set(a).catch(e=>console.error('Error guardando aviso en la nube:',e));
}
function syncBorrarAviso(id){
  if(!fbDb||!fbReady) return;
  fbDb.collection('avisos').doc(id).delete().catch(e=>console.error('Error borrando aviso en la nube:',e));
}

// ─── Sincronización genérica de colecciones (contenedores, albaranes, tareas, finanzas, facturas, certificados) ──
// Crea las funciones sync*/borrar*/suscribir*/migrar* para una colección array-de-objetos con un campo id único.
function crearSyncColeccion(nombre,idField,migVersion){
  const claveMigracion='garvi_'+nombre+'_migrados_'+(migVersion||'v1');
  let unsub=null;
  function suscribir(arraySetter,migradorFn,onUpdate){
    if(!fbDb) return;
    if(unsub) unsub();
    unsub=fbDb.collection(nombre).onSnapshot(snap=>{
      const nuevos=[];
      snap.forEach(doc=>nuevos.push(doc.data()));
      if(migradorFn) nuevos.forEach(migradorFn);
      arraySetter(nuevos);
      onUpdate&&onUpdate();
    },err=>{ console.error(nombre+' onSnapshot:',err); setSyncStatus('error'); });
  }
  function guardar(item){
    if(!fbDb||!fbReady||!item||item[idField]===undefined) return;
    fbDb.collection(nombre).doc(String(item[idField])).set(item).catch(e=>console.error('Error guardando en '+nombre+':',e));
  }
  function borrar(id){
    if(!fbDb||!fbReady) return;
    fbDb.collection(nombre).doc(String(id)).delete().catch(e=>console.error('Error borrando en '+nombre+':',e));
  }
  function migrarLocales(arrayActual,migradorFn){
    if(!fbDb||!fbReady) return Promise.resolve();
    if(localStorage.getItem(claveMigracion)) return Promise.resolve();
    const locales=arrayActual||[];
    if(!locales.length){ localStorage.setItem(claveMigracion,'1'); return Promise.resolve(); }
    if(migradorFn) locales.forEach(migradorFn);
    // Solo se suben los registros que AÚN NO existan en la nube. Si el documento ya existe allí
    // nunca se sobrescribe aquí: puede tener ediciones más recientes de otro dispositivo, y esta
    // migración (pensada para el alta inicial) no debe pisarlas con una copia local desactualizada.
    return fbDb.collection(nombre).get().then(snap=>{
      const existentes=new Set(); snap.forEach(d=>existentes.add(d.id));
      const nuevos=locales.filter(it=>it&&it[idField]!==undefined&&!existentes.has(String(it[idField])));
      const escrituras=nuevos.map(it=>fbDb.collection(nombre).doc(String(it[idField])).set(it).catch(e=>console.error('Error subiendo a '+nombre+':',e)));
      return Promise.all(escrituras).then(()=>{ localStorage.setItem(claveMigracion,'1'); return nuevos.length; });
    }).catch(e=>{ console.error('Error comprobando existentes en '+nombre+':',e); return 0; });
  }
  return {suscribir,guardar,borrar,migrarLocales};
}
// migVersion 'v3': fuerza un re-envío único a la nube tras corregir el estado de Granja Torrellano
const syncContenedores=crearSyncColeccion('contenedores','num','v3');
// Las fotos (base64) no se sincronizan: pueden superar el límite de 1MB por documento de Firestore.
// Se quedan solo en el dispositivo donde se tomaron.
function guardarContenedorNube(c){ const {fotos,...resto}=c; syncContenedores.guardar(resto); }
const syncAlbaranesCol=crearSyncColeccion('albaranes','id');
const syncTareasCol=crearSyncColeccion('tareas','id');
const syncFinanzasCol=crearSyncColeccion('finanzas','id');
const syncFacturasCol=crearSyncColeccion('facturas','id');
const syncCertificadosCol=crearSyncColeccion('certificados','id');
// Documentos únicos compartidos: contadores de numeración (cfg) y datos extra de clientes (dirección fiscal/CIF)
function syncCfg(){ if(fbDb&&fbReady) fbDb.collection('config').doc('cfg').set(cfg).catch(e=>console.error('Error guardando cfg en la nube:',e)); }
function syncClienteExtra(){
  if(!fbDb||!fbReady) return;
  let m={}; try{ m=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}'); }catch(e){}
  fbDb.collection('config').doc('clientes_extra').set(m).catch(e=>console.error('Error guardando clientes_extra en la nube:',e));
}
function migrarCfg(){
  if(!fbDb||!fbReady) return Promise.resolve();
  const clave='garvi_cfg_migrado_v1';
  if(localStorage.getItem(clave)) return Promise.resolve();
  return fbDb.collection('config').doc('cfg').get().then(doc=>{
    if(!doc.exists) return fbDb.collection('config').doc('cfg').set(cfg||{});
  }).then(()=>localStorage.setItem(clave,'1')).catch(e=>console.error('Error migrando cfg:',e));
}
function migrarClientesExtra(){
  if(!fbDb||!fbReady) return Promise.resolve();
  const clave='garvi_clientes_extra_migrado_v1';
  if(localStorage.getItem(clave)) return Promise.resolve();
  let local={}; try{ local=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}'); }catch(e){}
  return fbDb.collection('config').doc('clientes_extra').get().then(doc=>{
    const nube=doc.exists?doc.data():{};
    return fbDb.collection('config').doc('clientes_extra').set({...nube,...local});
  }).then(()=>localStorage.setItem(clave,'1')).catch(e=>console.error('Error migrando clientes_extra:',e));
}
function suscribirCfgYClientesExtra(){
  if(!fbDb) return;
  fbDb.collection('config').doc('cfg').onSnapshot(doc=>{
    if(doc.exists){ cfg=doc.data(); saveCfg(); }
  },err=>console.error('cfg onSnapshot:',err));
  fbDb.collection('config').doc('clientes_extra').onSnapshot(doc=>{
    if(doc.exists){
      localStorage.setItem('garvi_clientes_extra',JSON.stringify(doc.data()));
      syncClientes();
      if(currentTab==='clientes') renderClientes();
    }
  },err=>console.error('clientes_extra onSnapshot:',err));
}
function migrarYSuscribirTodo(){
  const total=[];
  // Antes de nada: si la nube todavía tiene alguno de los 31 contenedores con el valor erróneo
  // del corte de sincronización del 17-26/08, se corrige aquí mismo. Así, con que UN dispositivo
  // abra esta versión con conexión, la nube queda bien y el resto de dispositivos lo reciben solos.
  return aplicarFix27AgoNube().then(()=>Promise.all([
    syncContenedores.migrarLocales(containers.map(c=>{const {fotos,...r}=c; return r;})).then(n=>n&&total.push(n+' contenedor(es)')),
    syncAlbaranesCol.migrarLocales(albaranes).then(n=>n&&total.push(n+' albarán(es)')),
    syncTareasCol.migrarLocales(tareas).then(n=>n&&total.push(n+' tarea(s)')),
    syncFinanzasCol.migrarLocales(finanzas).then(n=>n&&total.push(n+' movimiento(s) de finanzas')),
    syncFacturasCol.migrarLocales(facturas).then(n=>n&&total.push(n+' factura(s)/proforma(s)')),
    syncCertificadosCol.migrarLocales(certificados).then(n=>n&&total.push(n+' certificado(s)')),
    migrarCfg(),
    migrarClientesExtra(),
    migrarSeguimiento(),
    aplicarClienteFiscalLote1Nube(),
    corregirCliente550Nube(),
  ])).then(()=>{
    if(total.length) toastMsg('Subido a la nube: '+total.join(', ')+' ✓',4000);
    suscribirCfgYClientesExtra();
    suscribirSeguimiento();
    suscribirMenu();
    syncContenedores.suscribir(v=>{
      const fotosByNum={}; containers.forEach(c=>{ if(c.fotos&&c.fotos.length) fotosByNum[c.num]=c.fotos; });
      containers=v.map(c=>({...c,fotos:fotosByNum[c.num]||c.fotos||[]}));
    },null,()=>{ saveContainers(); syncClientes(); if(currentTab==='contenedores'){renderContenedores();} });
    syncAlbaranesCol.suscribir(v=>{albaranes=v;},null,()=>{ saveAlbaranes(); if(currentTab==='albaranes'){renderAlbaranes();} });
    syncTareasCol.suscribir(v=>{tareas=v;},null,()=>{ saveTareas(); if(currentTab==='tareas'){renderTareas();} });
    syncFinanzasCol.suscribir(v=>{finanzas=v;},null,()=>{ saveFinanzas(); if(currentTab==='finanzas'){renderFinanzas();} });
    syncFacturasCol.suscribir(v=>{facturas=v;},null,()=>{ saveFacturas(); updateBadge(); if(currentTab==='facturas'){renderFacturas();} });
    syncCertificadosCol.suscribir(v=>{certificados=v;},null,()=>{ saveCertificados(); if(currentTab==='certificados'){renderCertificados();} });
  });
}

// ─── PRESUPUESTOS DATA ────────────────────────────────────────────
const PRES_SIGN_B64="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";
const PRES_LOGO_B64="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";
const CATALOG_PRES=[
  {name:'Cont. 5m³ Esc. Selec.',price:220,iva:10},
  {name:'Cont. 5m³ Esc. No Selec.',price:280,iva:10},
  {name:'Cont. 5m³ Varios',price:340,iva:10},
  {name:'Cont. 5m³ Poda',price:260,iva:10},
  {name:'Cont. 5m³ Cartón',price:220,iva:10},
  {name:'Cont. 5m³ Madera',price:240,iva:10},
  {name:'Cont. 5m³ Metal',price:220,iva:10},
  {name:'Cont. 9m³ Varios',price:490,iva:10},
  {name:'Cont. 9m³ Poda',price:320,iva:10},
  {name:'Cont. 9m³ Madera',price:340,iva:10},
  {name:'Cont. 16m³ Varios',price:910,iva:10},
  {name:'Cont. 16m³ Poda',price:540,iva:10},
  {name:'Cont. 16m³ Madera',price:560,iva:10},
  {name:'Retirada Saca (1 unidad)',price:80,iva:10},
  {name:'Retirada Saca (2 o más unid.)',price:70,iva:10},
  {name:'Gestión Tasa Ayuntamiento',price:30,iva:21},
  {name:'Certificado Gestión Residuos',price:60,iva:21},
];


const DATA_VERSION=8; // subir cuando RAW/INIT cambie y deba refrescarse en navegadores ya inicializados
function loadData(){
  const raw=localStorage.getItem(LSKEY);
  const storedVersion=parseInt(localStorage.getItem('garvi_data_version')||'1',10);
  if(raw&&storedVersion>=DATA_VERSION){
    containers=JSON.parse(raw);
  } else {
    const existing=raw?JSON.parse(raw):[];
    const existingByNum={}; existing.forEach(c=>existingByNum[c.num]=c);
    containers=INIT.map(c=>{
      const old=existingByNum[c.num];
      if(!old) return {...c};
      const antes=snapshotContenedor(old);
      // 'old' (lo que hay editado en este dispositivo/nube) manda sobre 'c' (foto estática INIT):
      // así una edición real (cliente, dirección, fecha, tipo…) nunca se pierde al subir DATA_VERSION.
      // 'c' solo aporta campos nuevos que 'old' todavía no tuviera.
      const nuevo={...c,...old};
      registrarHistorialContenedor(nuevo,antes);
      return nuevo;
    });
    saveContainers();
    localStorage.setItem('garvi_data_version',String(DATA_VERSION));
  }
  // Corrección puntual: algunos contenedores de GRANJA TORRELLANO habían quedado clasificados
  // como "Rotos" (rojo) en vez de "Granja" (granate) por un dato antiguo incorrecto.
  if(!localStorage.getItem('garvi_fix_granja_v1')){
    let cambiado=false;
    containers.forEach(c=>{
      if(c.cliente==='GRANJA TORRELLANO'&&c.estadoExcel!=='rotos_granja'){ c.estadoExcel='rotos_granja'; cambiado=true; }
    });
    if(cambiado) saveContainers();
    localStorage.setItem('garvi_fix_granja_v1','1');
  }
  if(aplicarFix27AgoLocal()) saveContainers();
  albaranes=JSON.parse(localStorage.getItem('garvi_albaranes')||'[]');
  tareas=JSON.parse(localStorage.getItem('garvi_tareas')||'[]');
  finanzas=JSON.parse(localStorage.getItem('garvi_finanzas')||'[]');
  facturas=JSON.parse(localStorage.getItem('garvi_facturas')||'[]');
  aplicarClienteFiscalLote1Local();
  if(corregirCliente550Local()) saveFacturas();
  cfg=JSON.parse(localStorage.getItem('garvi_cfg')||'{"apiKey":"","ultimaFact":0,"ultimaProf":0}');
  certificados=JSON.parse(localStorage.getItem('garvi_certificados')||'[]');
  avisos=JSON.parse(localStorage.getItem('garvi_avisos')||'[]');
  loadSeguimiento();
  avisos.forEach(migrarAviso);
  syncClientes();
  datosLocalesCargados=true;
  intentarMigrarYSuscribir();
}
// ─── Corrección puntual 27/08: el bug de sincronización (ver loadData más arriba) devolvió estos
// 31 contenedores a un dato antiguo (el de la foto fija RAW/INIT) en varios cortes entre el 17 y
// el 26/08. 'was' es el valor erróneo detectado en cada uno; 'ok' es el último valor real conocido
// antes de que el bug lo pisara. Solo se sobrescribe si el contenedor SIGUE teniendo exactamente el
// valor 'was' (así, si alguien ya lo movió a mano después, esta corrección no lo toca).
const FIX_27AGO={
  '7':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'MARIO',direccion:'Calle Montaña, 9',telefono:'641646223',tipo:'LIMPIO',fecha:'2026-08-19'}},
  '28':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '33':{was:{cliente:'BLS',fecha:'2026-08-14'},ok:{cliente:'SK',direccion:'Avd/Países Escandinavos - San Juan',telefono:'671436198',tipo:'MEZCLA',fecha:'2026-08-25'}},
  '34':{was:{cliente:'UTE CSPA',fecha:'2026-08-04'},ok:{cliente:'HOTEL JORGE PRIMERO',direccion:'C/San Francisco, 25 - El Campello',telefono:'616918334',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '35':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '47':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'AKRA',direccion:'C/San Bartolomé de Tirajana, 45 - Arenales del Sol',telefono:'671569657',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '49':{was:{cliente:'ESCLAPES',fecha:'2026-07-31'},ok:{cliente:'CYTEM',direccion:'C/Antella',telefono:'633911948',tipo:'LIMPIO',fecha:'2026-08-26'}},
  '59':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'UTE CSPA',direccion:'Plaza de España, 6',telefono:'605781726',tipo:'BASURA',fecha:'2026-08-19'}},
  '81':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'LIDIA',direccion:'C/Camafeo, 32 - Rebolledo',telefono:'667275469',tipo:'MEZCLA',fecha:'2026-08-21'}},
  '91':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'CARSAN',direccion:'Calle Tarragona, 21 - El Campello',telefono:'630197982',tipo:'MEZCLA',fecha:'2026-08-24'}},
  '95':{was:{cliente:'CHINO',fecha:'2026-08-11'},ok:{cliente:'SK',direccion:'Avd/Costablanca, 18',telefono:'661808625',tipo:'MEZCLA',fecha:'2026-08-20'}},
  '98':{was:{cliente:'CARSAN',fecha:'2026-08-14'},ok:{cliente:'NOVALIGEPRO',direccion:'Calle de Málaga, 7 - El Campello',telefono:'654983412',tipo:'MEZCLA',fecha:'2026-08-25'}},
  '99':{was:{cliente:'INSULAR',fecha:'2026-08-12'},ok:{cliente:'JOSE IVAN LONDOÑO',direccion:'Calle Diosa Tanit, 13 - Alicante',telefono:'642486024',tipo:'MEZCLA',fecha:'2026-08-24'}},
  '102':{was:{cliente:'MERCADILLO SANTA FAZ',fecha:'2026-08-12'},ok:{cliente:'JOSE',direccion:'C/Pascual Orosco, 15 - Alicante',telefono:'661948080',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '104':{was:{cliente:'SICE3',fecha:'2026-08-12'},ok:{cliente:'NOVALIGEPRO',direccion:'C/Pintor Cabrera, 2',telefono:'691136117',tipo:'MEZCLA',fecha:'2026-08-21'}},
  '105':{was:{cliente:'SK SANTA BARBARA',fecha:'2026-07-27'},ok:{cliente:'MOTACUSES SL',direccion:'Nave VGP - Alicante',telefono:'631076924',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '106':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'BLS',direccion:'C/Río Guadiana, 20 - San Vicente',telefono:'615735409',tipo:'BASURA',fecha:'2026-08-25'}},
  '110':{was:{cliente:'SK',fecha:'2026-08-13'},ok:{cliente:'SK',direccion:'Avd/Primero de Mayo, 27 - San Vicente',telefono:'623278880',tipo:'MEZCLA',fecha:'2026-08-25'}},
  '111':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'ID REFORMAS',direccion:'C/Bellavista, 4 - San Juan',telefono:'613857888',tipo:'MEZCLA',fecha:'2026-08-18'}},
  '114':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'SK',direccion:'Avd/Costablanca, 18',telefono:'661808625',tipo:'PODA',fecha:'2026-08-21'}},
  '115':{was:{cliente:'TECMOSA',fecha:'2026-07-24'},ok:{cliente:'CARSAN',direccion:'Avd/San Sebastián, 9B - El Campello',telefono:'630197982',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '131':{was:{cliente:'NOVALIGEPRO',fecha:'2026-08-12'},ok:{cliente:'ESCLAPES',direccion:'C/Fuerteventura, 2 - El Campello',telefono:'669729248',tipo:'MEZCLA',fecha:'2026-08-21'}},
  '135':{was:{cliente:'CYTEM',fecha:'2026-08-12'},ok:{cliente:'GUSTAVO',direccion:'Camino Gran Danés esquina camino Galgo, Alicante',telefono:'687079208',tipo:'MEZCLA',fecha:'2026-08-20'}},
  '137':{was:{cliente:'NOVALIGEPRO',fecha:'2026-08-10'},ok:{cliente:'TECMOSA',direccion:'Avd/L\'Estació, 16 - El Campello',telefono:'689061023',tipo:'MEZCLA',fecha:'2026-08-26'}},
  '138':{was:{cliente:'CORHOUSE',fecha:'2026-08-11'},ok:{cliente:'CYTEM',direccion:'C/Antella',telefono:'',tipo:'LIMPIO',fecha:'2026-08-19'}},
  '139':{was:{cliente:'CYTEM',fecha:'2026-08-13'},ok:{cliente:'COSME',direccion:'Camino Alcoraya - UW',telefono:'619224952',tipo:'MEZCLA',fecha:'2026-08-18'}},
  '200':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'MEZCLA',fecha:'2026-08-21'}},
  '201':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'CP COSTA HISPANIA',direccion:'Avd/Carabasí, 1 - Gran Alacant',telefono:'618729056',tipo:'PODA',fecha:'2026-08-21'}},
  '202':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'MEZCLA',fecha:'2026-08-24'}},
  '203':{was:{cliente:'CP COSTA HISPANIA',fecha:'2026-08-04'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'PODA',fecha:'2026-08-24'}},
  '300':{was:{cliente:'NAVE GARVI',fecha:'2026-08-16'},ok:{cliente:'NAVE GARVI',direccion:'',telefono:'',tipo:'MEZCLA',fecha:'2026-08-24'}},
};
function aplicarFix27AgoLocal(){
  let cambiado=false;
  Object.keys(FIX_27AGO).forEach(num=>{
    const c=getContainer(num); if(!c) return;
    const f=FIX_27AGO[num];
    if(c.cliente===f.was.cliente&&c.fecha===f.was.fecha){
      const antes=snapshotContenedor(c);
      Object.assign(c,f.ok);
      registrarHistorialContenedor(c,antes);
      guardarContenedorNube(c);
      cambiado=true;
    }
  });
  return cambiado;
}
// Repite la misma comprobación directamente contra Firestore (no solo el array local en memoria):
// así, en cuanto UN dispositivo con conexión abre la app ya actualizada, la nube queda corregida y
// todos los demás dispositivos reciben el dato bueno solos al sincronizar, sin tocar nada a mano.
function aplicarFix27AgoNube(){
  if(!fbDb||!fbReady) return Promise.resolve();
  if(localStorage.getItem('garvi_fix_27ago_v1')) return Promise.resolve();
  const tareas=Object.keys(FIX_27AGO).map(num=>{
    const f=FIX_27AGO[num];
    return fbDb.collection('contenedores').doc(num).get().then(doc=>{
      if(!doc.exists) return;
      const d=doc.data();
      if(d.cliente===f.was.cliente&&d.fecha===f.was.fecha){
        return fbDb.collection('contenedores').doc(num).set(f.ok,{merge:true});
      }
    }).catch(e=>console.error('Error aplicando fix 27/08 a contenedor '+num+':',e));
  });
  return Promise.all(tareas).then(()=>{ localStorage.setItem('garvi_fix_27ago_v1','1'); });
}
// Convierte el antiguo campo done/completadoEn (un solo tick) al nuevo array "completados" (una marca de tiempo por unidad hecha)
function migrarAviso(a){
  if(!Array.isArray(a.completados)){
    a.completados=(a.done)?[a.completadoEn||new Date().toISOString()]:[];
  }
  if(!a.cantidad) a.cantidad=1;
  return a;
}
function saveContainers(){localStorage.setItem(LSKEY,JSON.stringify(containers));}
function saveAlbaranes(){localStorage.setItem('garvi_albaranes',JSON.stringify(albaranes));refreshGlobalDatalists();}
function saveTareas(){localStorage.setItem('garvi_tareas',JSON.stringify(tareas));}
function saveFinanzas(){localStorage.setItem('garvi_finanzas',JSON.stringify(finanzas));}
function saveFacturas(){localStorage.setItem('garvi_facturas',JSON.stringify(facturas));refreshGlobalDatalists();}
function saveCfg(){localStorage.setItem('garvi_cfg',JSON.stringify(cfg));}
function saveCertificados(){localStorage.setItem('garvi_certificados',JSON.stringify(certificados));refreshGlobalDatalists();}
function saveAvisos(){localStorage.setItem('garvi_avisos',JSON.stringify(avisos));refreshGlobalDatalists();}

// Icono de WhatsApp (SVG inline, sin depender de ningún CDN) para los botones "WA" de toda la app.
const ICO_WA='<svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" style="vertical-align:-3px;flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.888 11.888 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>';

function getClienteExtra(nombre){const m=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}');return m[nombre]||{};}
// Como con el cliente de los contenedores (ver esClienteInterno/datosClientePorNombre): si no hay
// coincidencia EXACTA (puede que se haya escrito en minúsculas, con espacios de más, sin
// mayúsculas iniciales...), busca por el nombre normalizado antes de rendirse. Se usa al
// autocompletar NIF/dirección/conceptos en Facturación.
function getClienteExtraAprox(nombre){
  const exacto=getClienteExtra(nombre);
  if(exacto.cif||exacto.dirFacturacion||(exacto.conceptos&&exacto.conceptos.length)) return exacto;
  const n=normTextoHist(String(nombre||''));
  if(!n) return exacto;
  const m=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}');
  const clave=Object.keys(m).find(k=>normTextoHist(k)===n);
  return clave?m[clave]:exacto;
}
function saveClienteExtra(nombre,data){const m=JSON.parse(localStorage.getItem('garvi_clientes_extra')||'{}');m[nombre]={...(m[nombre]||{}),...data};localStorage.setItem('garvi_clientes_extra',JSON.stringify(m));syncClienteExtra();}
function syncClientes(){
  const mapa={};
  containers.forEach(c=>{
    const nom=c.cliente;
    if(!nom||nom==='NAVE GARVI'||nom==='GRANJA TORRELLANO') return;
    const ex=getClienteExtra(nom);
    if(!mapa[nom]) mapa[nom]={id:'cl-'+nom.toLowerCase().replace(/\s+/g,'-'),nombre:nom,telefono:c.telefono||'',direccion:c.direccion||'',dirFacturacion:ex.dirFacturacion||'',cif:ex.cif||'',conceptos:ex.conceptos||[],contenedores:[],fechaUltimoServicio:'',totalServicios:0,notas:''};
    const cl=mapa[nom];
    if(c.telefono&&!cl.telefono) cl.telefono=c.telefono;
    if(!cl.contenedores.includes(c.num)) cl.contenedores.push(c.num);
    if(!cl.fechaUltimoServicio||c.fecha>cl.fechaUltimoServicio) cl.fechaUltimoServicio=c.fecha;
    cl.totalServicios=cl.contenedores.length;
  });
  clientes=Object.values(mapa).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  localStorage.setItem('garvi_clientes_v1',JSON.stringify(clientes));
  refreshGlobalDatalists();
}
// ─── AUTOCOMPLETADO GLOBAL ──────────────────────────────────────────
// Recopila cliente/dirección/teléfono ya escritos en cualquier parte de la app (contenedores,
// clientes, albaranes, facturas, avisos) para poder sugerirlos con autocompletar en cualquier
// otro formulario (proformas, avisos, albaranes...) en cuanto se empiezan a escribir letras.
function refreshGlobalDatalists(){
  const nombres=new Set(), direcciones=new Set(), telefonos=new Set();
  const add=(set,v)=>{ if(v&&String(v).trim()) set.add(String(v).trim()); };
  containers.forEach(c=>{ if(c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO') add(nombres,c.cliente); add(direcciones,c.direccion); add(telefonos,c.telefono); });
  clientes.forEach(c=>{ add(nombres,c.nombre); add(direcciones,c.direccion); add(telefonos,c.telefono); });
  albaranes.forEach(a=>{ add(nombres,a.cliente); add(direcciones,a.lugar); add(telefonos,a.telefono); });
  facturas.forEach(f=>{ add(nombres,f.cliente); add(direcciones,f.direccion); add(telefonos,f.telefono); });
  avisos.forEach(a=>{ add(nombres,a.nota); add(direcciones,a.direccion); add(telefonos,a.telefono); });
  certificados.forEach(c=>{ add(nombres,c.productor); add(direcciones,c.obra); });
  const opts=set=>[...set].sort((a,b)=>a.localeCompare(b)).map(v=>`<option value="${v.replace(/"/g,'&quot;')}">`).join('');
  const dlC=document.getElementById('dl-global-clientes'); if(dlC) dlC.innerHTML=opts(nombres);
  const dlD=document.getElementById('dl-global-direcciones'); if(dlD) dlD.innerHTML=opts(direcciones);
  const dlT=document.getElementById('dl-global-telefonos'); if(dlT) dlT.innerHTML=opts(telefonos);
}

function getContainer(num){return containers.find(c=>c.num===num);}
// ─── HISTORIAL DE CAMBIOS DE UN CONTENEDOR ─────────────────────────
const CAMPOS_HISTORIAL=['cliente','direccion','telefono','tipo','estadoExcel','aCuenta'];
// Solo cambios en estos dos campos (la empresa/ubicación) generan una entrada nueva en el
// historial — así queda como un registro de "desde cuándo está en cada sitio", no un log de
// cada edición (teléfono, a cuenta, estado...) mientras sigue en el mismo cliente/dirección.
const CAMPOS_CAMBIO_RELEVANTE=['cliente','direccion'];
function snapshotContenedor(c){
  const s={}; CAMPOS_HISTORIAL.forEach(f=>s[f]=c[f]||''); return s;
}
// Se llama ANTES de sobrescribir los campos de un contenedor con los nuevos valores.
// Si cambió la empresa/ubicación respecto al snapshot "antes", guarda una entrada en el
// historial con fecha/hora (el resto de campos del snapshot se guardan igual, como contexto).
function registrarHistorialContenedor(c,antes){
  const cambio=CAMPOS_CAMBIO_RELEVANTE.some(f=>(c[f]||'')!==antes[f]);
  if(!cambio) return;
  if(!Array.isArray(c.historial)) c.historial=[];
  c.historial.unshift({fecha:new Date().toISOString(),...antes});
  if(c.historial.length>20) c.historial.length=20;
}
const CLIENTES_ESPECIALES=['NAVE GARVI','GRANJA TORRELLANO'];
// Si un contenedor se puso HOY MISMO en Nave Garvi o Granja Torrellano (ha vuelto a base),
// ese dato prevalece: no se puede reasignar a otro cliente/dirección el mismo día (evita que
// una edición posterior —del mismo u otro dispositivo— lo "saque" de nave/granja por error).
function prevaleceEspecialHoy(c,nuevoCliente){
  const actual=(c.cliente||'').trim().toUpperCase();
  const nuevo=(nuevoCliente||'').trim().toUpperCase();
  return CLIENTES_ESPECIALES.includes(actual)&&c.fecha===todayISO()&&!!nuevo&&!CLIENTES_ESPECIALES.includes(nuevo);
}
function daysSince(fecha){
  if(!fecha) return 0;
  return Math.floor((Date.now()-new Date(fecha).getTime())/86400000);
}
function fmtFecha(f){
  if(!f) return '—';
  var p=f.split('-');
  return p[2]+'/'+p[1]+'/'+p[0].slice(2);
}
function daysBadge(dias,fecha){
  const cls=dias<11?'days-ok':dias<14?'days-warn':'days-danger';
  return `<span class="days-badge ${cls}">${fmtFecha(fecha)}</span>`;
}
function fmtDate(iso){if(!iso) return '';const d=new Date(iso);return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'});}
function fmtDateHora(iso){if(!iso) return '';const d=new Date(iso);if(isNaN(d)) return '';return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});}
// Fecha YYYY-MM-DD en hora LOCAL (toISOString() convierte a UTC y desplaza el día en husos horarios positivos como España)
function localISO(y,m,d){
  const dt=new Date(y,m,d);
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}
function todayISO(){const n=new Date();return localISO(n.getFullYear(),n.getMonth(),n.getDate());}
function addDaysISO(days){const n=new Date();n.setDate(n.getDate()+days);return localISO(n.getFullYear(),n.getMonth(),n.getDate());}
// Nombre por defecto de los listados exportados: "LISTADO DD-MM-AAAA" con la fecha de AYER,
// porque la información que se exporta refleja la actualización del día anterior.
function nombreListado(){
  const [y,m,d]=addDaysISO(-1).split('-');
  return `LISTADO ${d}-${m}-${y}`;
}
function fmtMoney(n){return Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+'€';}
function fmtPresPrice(n){const v=Number(n||0);return v.toLocaleString('es-ES',{minimumFractionDigits:v%1===0?0:2,maximumFractionDigits:2})+'€';}
function fmtPresDate(iso){if(!iso)return '—';const[y,m,d]=iso.split('-');return`${d}-${m}-${y}`;}
function toastMsg(msg,ms=2200){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),ms);}
// Vuelve a enfocar un input tras un re-render completo de sección (evita perder el foco al escribir)
function reFocusInput(id,fn){
  const prev=document.getElementById(id);
  const pos=prev?prev.selectionStart:null;
  fn();
  const el=document.getElementById(id);
  if(el){el.focus();if(pos!==null){try{el.setSelectionRange(pos,pos);}catch(e){}}}
}

// ─── AUTH ─────────────────────────────────────────────────────────
// El inicio de sesión lo comprueba Firebase (cuentas usuario@garvi.app, ver SEGURIDAD.md). En el
// código ya no hay contraseñas ni huellas de contraseñas: solo el nombre que se muestra.
const USERS={ivan:{label:'Iván'},halem:{label:'Halem'}};
const EMAIL_DOMINIO='@garvi.app';
function setSidebarUser(label){
  const el=document.getElementById('sidebar-username');
  const av=document.getElementById('sidebar-avatar');
  if(el) el.textContent=label;
  if(av) av.textContent=label?label[0].toUpperCase():'?';
}
function handleLogin(){
  const u=(document.getElementById('li-user').value||'').toLowerCase().trim();
  const p=document.getElementById('li-pass').value||'';
  const usr=USERS[u];
  const err=document.getElementById('li-err');
  if(!usr||!p){err.textContent='Usuario o contraseña incorrectos';return;}
  if(typeof firebase==='undefined'||!firebase.apps.length){err.textContent='Sin conexión con el servidor: no se puede iniciar sesión';return;}
  err.textContent='Entrando…';
  firebase.auth().signInWithEmailAndPassword(u+EMAIL_DOMINIO,p).then(()=>{
    err.textContent='';
    entrarTrasLogin(u,usr);
  }).catch(e=>{
    const c=(e&&e.code)||'';
    err.textContent=['auth/invalid-credential','auth/wrong-password','auth/user-not-found','auth/invalid-login-credentials','auth/invalid-email'].includes(c)?'Usuario o contraseña incorrectos'
      :c==='auth/network-request-failed'?'Sin conexión: comprueba internet e inténtalo de nuevo'
      :c==='auth/too-many-requests'?'Demasiados intentos: espera unos minutos'
      :c==='auth/operation-not-allowed'?'El acceso con email no está activado en Firebase'
      :'No se pudo iniciar sesión ('+(c||'error')+')';
  });
}
function entrarTrasLogin(u,usr){
  // La sesión siempre se guarda de forma permanente (localStorage, sin caducidad): una vez que
  // entras, este dispositivo queda con la sesión iniciada indefinidamente, como en apps tipo YouTube.
  localStorage.setItem('garvi_session',JSON.stringify({user:u,label:usr.label}));
  sessionStorage.removeItem('garvi_session');
  currentUser=usr.label;
  setSidebarUser(currentUser);
  document.getElementById('login-screen').style.animation='fadeIn .3s ease reverse';
  setTimeout(()=>{document.getElementById('login-screen').style.display='none';},300);
  loadData();
  renderTab('inicio');
  updateBadge();
}
function checkSession(){
  // Compatibilidad: si en este dispositivo quedaba una sesión antigua solo en sessionStorage
  // (versión anterior con la casilla "Recordar sesión" desmarcada), se pasa a permanente aquí.
  const sessTemp=sessionStorage.getItem('garvi_session');
  if(sessTemp&&!localStorage.getItem('garvi_session')){ localStorage.setItem('garvi_session',sessTemp); sessionStorage.removeItem('garvi_session'); }
  const s=JSON.parse(localStorage.getItem('garvi_session')||'null');
  if(s){
    currentUser=s.label;
    setSidebarUser(currentUser);
    // BUG histórico: aquí nunca se ocultaba la pantalla de login. Aunque la sesión sí se
    // recordaba (localStorage), esta capa a pantalla completa se quedaba encima tapándolo todo,
    // así que siempre parecía pedir usuario/contraseña de nuevo aunque la app ya estuviera dentro.
    const loginScreen=document.getElementById('login-screen');
    if(loginScreen) loginScreen.style.display='none';
    loadData();
    renderTab('inicio');
    updateBadge();
  }
}
// Copia de seguridad: todas las claves garvi_* del móvil en un .json. Solo lee; no modifica nada.
// Se dejan fuera: clave de Gemini, sesión (usuario logueado) y caché de geolocalización (pesa y se regenera sola).
// En garvi_cfg se quita el campo apiKey por si alguna vez guardara una clave.
function exportarCopia(){
  const EXCLUIR=['garvi_gemini_api_key','garvi_session'];
  const datos={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k.startsWith('garvi_')||EXCLUIR.includes(k)||k.startsWith('garvi_geocode_cache')) continue;
    datos[k]=localStorage.getItem(k);
  }
  try{ const c=JSON.parse(datos.garvi_cfg||'null'); if(c&&c.apiKey!==undefined){ delete c.apiKey; datos.garvi_cfg=JSON.stringify(c); } }catch(e){}
  const fecha=new Date().toISOString().slice(0,10);
  const blob=new Blob([JSON.stringify({app:'GARVI',fecha:new Date().toISOString(),datos},null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='garvi-copia-'+fecha+'.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toastMsg('Copia exportada ('+Object.keys(datos).length+' apartados)');
}
function logout(){
  localStorage.removeItem('garvi_session');sessionStorage.removeItem('garvi_session');
  const recargar=()=>location.reload();
  try{ firebase.auth().signOut().then(recargar,recargar); }catch(e){ recargar(); }
}

function updateBadge(){
  const today=todayISO();
  const cnt=containers.filter(c=>c.cliente!=='NAVE GARVI'&&c.cliente!=='GRANJA TORRELLANO'&&daysSince(c.fecha)>=14).length;
  const b=document.getElementById('badge-ret');
  if(cnt>0){b.textContent=cnt;b.style.display='flex';}
  else b.style.display='none';
  const cntFact=facturas.filter(facturaVencida).length;
  const bf=document.getElementById('badge-fact');
  if(bf){ if(cntFact>0){bf.textContent=cntFact;bf.style.display='flex';} else bf.style.display='none'; }
}

// ─── NAV ──────────────────────────────────────────────────────────
function renderTab(tab){
  currentTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>{b.classList.toggle('active',b.dataset.param===tab);});
  document.querySelectorAll('.section').forEach(s=>{s.classList.remove('active');});
  document.getElementById('sec-'+tab).classList.add('active');
  const renders={inicio:renderInicio,contenedores:renderContenedores,albaranes:renderAlbaranes,facturas:renderFacturas,cobros:renderCobrosPendientes,seguimiento:renderSeguimiento,finanzas:renderFinanzas,clientes:renderClientes,tareas:renderTareas,presupuestos:renderPresupuestos,certificados:renderCertificados};
  if(renders[tab]) renders[tab]();
}

