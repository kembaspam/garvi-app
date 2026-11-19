// ─── COPIA DE SEGURIDAD AUTOMÁTICA (semanal, en la nube) ───────────────────
// Al abrir la app con conexión, si la última copia tiene 7 días o más, guarda una "foto" de todos
// los datos sincronizados en Firestore: backups/{AAAA-MM-DD} (+ subcolección "partes", porque un
// documento no puede pasar de 1 MB). Se conservan las 8 últimas (~2 meses) y se borran las demás.
// No toca ningún dato de la app; solo lee los arrays que ya están en memoria. Las fotos de los
// contenedores no se incluyen (no se sincronizan, solo viven en cada dispositivo).
// Para restaurar algo: Firebase Console > Firestore > backups > fecha > partes (campo "datos" = JSON).
const COPIA_AUTO_DIAS=7, COPIA_AUTO_CONSERVAR=8, COPIA_AUTO_TROZO=300000;

function datosParaCopiaAuto(){
  const sinFotos=containers.map(c=>{const {fotos,...resto}=c;return resto;});
  return {contenedores:sinFotos,albaranes,tareas,finanzas,facturas,certificados,avisos,
    config:[{id:'cfg',...(cfg||{})}],
    seguimiento:[{id:'seguimiento',...seguimiento}]};
}
function trocearCopia(nombre,items){
  const partes=[]; let actual=[], tam=0;
  items.forEach(it=>{
    const s=JSON.stringify(it);
    if(tam+s.length>COPIA_AUTO_TROZO&&actual.length){ partes.push(actual); actual=[]; tam=0; }
    actual.push(it); tam+=s.length;
  });
  if(actual.length||!partes.length) partes.push(actual);
  return partes.map((p,i)=>({id:nombre+'_'+(i+1),coleccion:nombre,parte:i+1,total:p.length,datos:JSON.stringify(p)}));
}
function diasEntreISO(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);}
function borrarCopiaAuto(fecha){
  const ref=fbDb.collection('backups').doc(fecha);
  return ref.collection('partes').get()
    .then(snap=>Promise.all(snap.docs.map(d=>d.ref.delete())))
    .then(()=>ref.delete());
}
function copiaAutomaticaSiToca(){
  if(!fbDb||!fbReady) return Promise.resolve();
  const datos=datosParaCopiaAuto();
  // Seguridad: si aún no han llegado los datos (todo vacío), no se guarda una copia vacía.
  if(!datos.facturas.length&&!datos.contenedores.length&&!datos.avisos.length) return Promise.resolve();
  const hoy=todayISO();
  return fbDb.collection('backups').get().then(snap=>{
    const fechas=snap.docs.map(d=>d.id).filter(id=>/^\d{4}-\d{2}-\d{2}$/.test(id)).sort();
    const ultima=fechas[fechas.length-1];
    if(ultima&&diasEntreISO(ultima,hoy)<COPIA_AUTO_DIAS) return null;
    const partes=[], resumen={};
    Object.entries(datos).forEach(([n,items])=>{ resumen[n]=items.length; partes.push(...trocearCopia(n,items)); });
    const ref=fbDb.collection('backups').doc(hoy);
    return Promise.all(partes.map(p=>ref.collection('partes').doc(p.id).set(p)))
      .then(()=>ref.set({fecha:hoy,creada:new Date().toISOString(),partes:partes.length,resumen,usuario:currentUser||''}))
      .then(()=>{
        const todas=[...new Set([...fechas,hoy])].sort();
        const sobrantes=todas.slice(0,Math.max(0,todas.length-COPIA_AUTO_CONSERVAR));
        return Promise.all(sobrantes.map(borrarCopiaAuto));
      })
      .then(()=>{ console.log('Copia automática guardada:',hoy,resumen); toastMsg('☁️ Copia de seguridad semanal guardada'); });
  }).catch(e=>console.error('Copia automática:',e));
}
// Se lanza un rato después de conectar, para dar tiempo a que lleguen los datos de la nube.
function programarCopiaAutomatica(){ setTimeout(copiaAutomaticaSiToca,25000); }
