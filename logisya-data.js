/* LogisYa · datos de ejemplo y reglas del negocio compartidas entre la vista del operador y la del trabajador.
   El estado se guarda en localStorage para que lo que hace una vista se vea en la otra. */
const LY_KEY='logisya-demo-v3';
const ROLES=['Mesero/a','Bartender','Anfitrión/a','Promotor/a BTL','Logístico de montaje','Supervisor de piso'];
const ZONAS=['Norte-Centro Histórico','Riomar','Sur Occidente','Metropolitana','Soledad','Puerto Colombia'];
const DIAS=['dom','lun','mar','mié','jue','vie','sáb'];
const DIAS_L=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const BASE=new Date(2026,9,10,18,0).getTime();
const D=(s,h=0,m=0)=>{const[y,mo,d]=s.split('-').map(Number);return new Date(y,mo-1,d,h,m)};
const T=(s,h=0,m=0)=>D(s,h,m).getTime();
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function seed(){
  const W=(id,nombre,roles,zona,disp,r,eventos,asis,ops,enBolsa,desde)=>({id,nombre,roles,zona,disp,ratings:[r],eventos,asis,ops,enBolsa,desde,presentes:0,ausentes:0});
  const P=(wid,estado,origen='propio')=>({wid,estado,origen,at:T('2026-10-08',10)});
  const A=ent=>Object.assign(nuevaAsistencia(),ent?{ent,estado:'presente'}:{});
  const V=o=>Object.assign({convocados:[],postulaciones:[],asistencia:{},reemplazo:null,bloqueada:false},o);
  return {offsetH:0,seq:100,ADMIN:{nombre:'Administración LogisYa'},
  OPS:{
    op1:{id:'op1',nombre:'Eventos Caribe BTL',compartir:true,activo:true,invite:'logisya.co/i/ECB-7Q2'},
    op2:{id:'op2',nombre:'Catering La Arenosa',compartir:true,activo:true,invite:'logisya.co/i/CLA-3M8'},
    op3:{id:'op3',nombre:'Montajes del Norte',compartir:false,activo:true,invite:'logisya.co/i/MDN-9K1'}},
  WORKERS:[
    W('w1','Andrea Pérez',['Mesero/a','Anfitrión/a'],'Norte-Centro Histórico',[0,5,6],4.8,23,96,['op1'],true,'2026-03-02'),
    W('w2','Carlos Ariza',['Logístico de montaje'],'Soledad',[1,2,3,4,5,6],4.5,41,93,['op1'],true,'2026-02-11'),
    W('w3','Daniela Charris',['Bartender','Mesero/a'],'Riomar',[4,5,6],4.9,30,100,['op2'],true,'2026-01-20'),
    W('w4','Jhon Fontalvo',['Logístico de montaje','Supervisor de piso'],'Metropolitana',[0,1,2,3,4,5,6],4.2,55,88,['op3'],true,'2025-11-03'),
    W('w5','Valentina Rojas',['Promotor/a BTL','Anfitrión/a'],'Norte-Centro Histórico',[5,6],4.7,18,94,['op1'],true,'2026-04-08'),
    W('w6','Luis Mercado',['Mesero/a'],'Sur Occidente',[0,5,6],3.9,12,83,['op2'],false,'2026-05-15'),
    W('w7','Mariana De la Hoz',['Anfitrión/a','Promotor/a BTL'],'Riomar',[3,4,5,6],4.6,9,100,['op1'],true,'2026-07-01'),
    W('w8','Kevin Barrios',['Bartender'],'Puerto Colombia',[0,5,6],4.4,27,92,['op2'],true,'2026-02-27'),
    W('w9','Yuleisy Ospino',['Mesero/a','Bartender'],'Soledad',[0,5,6],4.3,15,90,['op3'],true,'2026-03-30'),
    W('w10','Andrés Molina',['Supervisor de piso'],'Riomar',[0,1,2,3,4,5,6],4.8,62,98,['op1'],true,'2025-10-12'),
    W('w11','Sharon Cantillo',['Promotor/a BTL'],'Sur Occidente',[1,2,3,4,5],4.1,7,86,['op2'],true,'2026-08-04'),
    W('w12','Ricardo Pacheco',['Logístico de montaje'],'Metropolitana',[0,6],4.0,33,91,['op1'],true,'2026-01-09'),
    W('w13','Kelly Mendoza',['Mesero/a','Anfitrión/a'],'Riomar',[0,4,5,6],4.6,21,95,['op2'],true,'2026-02-02')],
  EVENTS:[
    {id:'e0',op:'op1',nombre:'Cena de gala aniversario corporativo',fecha:'2026-10-10',lugar:'Hotel El Prado',zona:'Norte-Centro Histórico',vacantes:[
      V({id:'v01',rol:'Mesero/a',ini:'17:00',fin:'01:00',cupos:3,tarifa:130000,fase:'general',cierre:T('2026-10-07',12),convocados:['w1'],
        postulaciones:[P('w1','confirmado'),P('w3','confirmado','bolsa'),P('w9','confirmado','bolsa')],
        asistencia:{w1:A('16:52'),w3:A('17:04'),w9:A('')}}),
      V({id:'v02',rol:'Supervisor de piso',ini:'16:00',fin:'01:00',cupos:1,tarifa:180000,fase:'propio',cierre:T('2026-10-06',12),convocados:['w10'],
        postulaciones:[P('w10','confirmado')],asistencia:{w10:A('15:48')}})]},
    {id:'e1',op:'op1',nombre:'Activación de marca · Festival Gastronómico',fecha:'2026-10-17',lugar:'Malecón del Río',zona:'Norte-Centro Histórico',vacantes:[
      V({id:'v11',rol:'Promotor/a BTL',ini:'15:00',fin:'22:00',cupos:6,tarifa:110000,fase:'propio',cierre:T('2026-10-11',0),convocados:['w5','w7'],
        postulaciones:[P('w5','confirmado'),P('w7','pendiente')]}),
      V({id:'v12',rol:'Anfitrión/a',ini:'16:00',fin:'22:00',cupos:2,tarifa:105000,fase:'propio',cierre:T('2026-10-11',0),convocados:['w1','w5','w7'],
        postulaciones:[P('w1','confirmado')]})]},
    {id:'e2',op:'op1',nombre:'Congreso Regional de Ingeniería',fecha:'2026-10-23',lugar:'Centro de Eventos Puerta de Oro',zona:'Norte-Centro Histórico',vacantes:[
      V({id:'v21',rol:'Anfitrión/a',ini:'07:00',fin:'15:00',cupos:4,tarifa:100000,fase:'general',cierre:T('2026-10-09',18),convocados:['w1','w5','w7'],
        postulaciones:[P('w7','pendiente'),P('w13','pendiente','bolsa')]}),
      V({id:'v22',rol:'Supervisor de piso',ini:'06:30',fin:'16:00',cupos:1,tarifa:170000,fase:'propio',cierre:T('2026-10-15',12),convocados:['w10'],
        postulaciones:[P('w10','confirmado')]}),
      V({id:'v23',rol:'Logístico de montaje',ini:'05:00',fin:'13:00',cupos:5,tarifa:95000,fase:'general',cierre:T('2026-10-09',12),convocados:['w2','w12'],
        postulaciones:[P('w2','confirmado'),P('w12','confirmado'),P('w4','pendiente','bolsa')]})]},
    {id:'e3',op:'op1',nombre:'Feria Inmobiliaria del Caribe',fecha:'2026-11-07',lugar:'Plaza de la Paz',zona:'Norte-Centro Histórico',vacantes:[
      V({id:'v31',rol:'Promotor/a BTL',ini:'10:00',fin:'19:00',cupos:8,tarifa:115000,fase:'propio',cierre:T('2026-10-20',12)})]},
    {id:'e4',op:'op2',nombre:'Almuerzo empresarial de fin de año',fecha:'2026-10-15',lugar:'Hotel sobre la Vía 40',zona:'Riomar',vacantes:[
      V({id:'v41',rol:'Mesero/a',ini:'11:00',fin:'16:00',cupos:4,tarifa:90000,fase:'general',cierre:T('2026-10-08',12),postulaciones:[P('w6','confirmado')]})]},
    {id:'e5',op:'op2',nombre:'Matrimonio en club social',fecha:'2026-10-24',lugar:'Country Club de Barranquilla',zona:'Riomar',vacantes:[
      V({id:'v51',rol:'Mesero/a',ini:'18:00',fin:'02:00',cupos:10,tarifa:140000,fase:'general',cierre:T('2026-10-09',12),postulaciones:[P('w13','confirmado'),P('w6','confirmado')]}),
      V({id:'v52',rol:'Bartender',ini:'18:00',fin:'02:00',cupos:3,tarifa:150000,fase:'propio',cierre:T('2026-10-12',12),convocados:['w3','w8'],postulaciones:[P('w8','confirmado')]})]},
    {id:'e6',op:'op3',nombre:'Montaje de concierto',fecha:'2026-10-30',lugar:'Estadio Metropolitano',zona:'Metropolitana',vacantes:[
      V({id:'v61',rol:'Logístico de montaje',ini:'06:00',fin:'18:00',cupos:20,tarifa:120000,fase:'propio',cierre:T('2026-10-14',12),convocados:['w4'],postulaciones:[P('w4','confirmado')]})]}
  ]};
}
function nuevaAsistencia(){return {ent:'',sal:'',estado:'pendiente',validado:false,cal:0,reporte:null}}
function newVacante(o){return Object.assign({convocados:[],postulaciones:[],asistencia:{},reemplazo:null,bloqueada:false},o)}

/* ---------- Persistencia ---------- */
function load(){try{const r=localStorage.getItem(LY_KEY);if(r){const d=JSON.parse(r);if(d&&d.EVENTS&&d.WORKERS)return d}}catch(_){}return seed()}
let DB=load();
function save(){try{localStorage.setItem(LY_KEY,JSON.stringify(DB))}catch(_){}}
function resetDemo(){DB=seed();save()}
function pref(k,v){try{if(v===undefined)return localStorage.getItem('ly-'+k);localStorage.setItem('ly-'+k,v)}catch(_){return null}}
window.addEventListener('storage',e=>{if(e.key===LY_KEY){DB=load();if(window.LY_render)window.LY_render()}});

/* ---------- Utilidades ---------- */
const now=()=>new Date(BASE+DB.offsetH*3600e3);
const nid=p=>p+(++DB.seq);
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cop=n=>'$'+Number(n).toLocaleString('es-CO');
const fdate=s=>{const d=D(s);return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}`};
const fdt=t=>{const d=new Date(t);return `${DIAS_L[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0,3)} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const OP=id=>DB.OPS[id];
const W_=id=>DB.WORKERS.find(w=>w.id===id);
const EV=id=>DB.EVENTS.find(e=>e.id===id);
const findV=(eid,vid)=>{const e=EV(eid);return [e,e.vacantes.find(v=>v.id===vid)]};
const rating=w=>w.ratings.reduce((a,b)=>a+b,0)/w.ratings.length;
const conf=v=>v.postulaciones.filter(p=>p.estado==='confirmado').length;
const isToday=s=>s===iso(now());
const isPast=s=>D(s)<D(iso(now()));
const mins=t=>{if(!t)return null;const[h,m]=t.split(':').map(Number);return h*60+m};
const horas=(a,b)=>{const x=mins(a),y=mins(b);if(x==null||y==null)return 0;let d=y-x;if(d<0)d+=1440;return d/60};
function hrsLeft(t){const h=(t-now())/3600e3;if(h<=0)return 'vencido';if(h<24)return `${Math.round(h)} h`;return `${Math.round(h/24)} d`}
const stars=r=>`<span class="star" aria-hidden="true">★</span> <span class="num">${r.toFixed(1)}</span>`;
function toast(msg){let c=$('#toasts');if(!c){c=document.createElement('div');c.id='toasts';c.className='toasts';c.setAttribute('aria-live','polite');document.body.appendChild(c)}
  const t=document.createElement('div');t.className='toast';t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),4200)}
const ESTADO={pendiente:['warn','Pendiente'],confirmado:['ok','Confirmado'],rechazado:['bad','No seleccionado'],ausente:['bad','Ausente']};
const estadoPill=e=>`<span class="pill ${ESTADO[e][0]}">${ESTADO[e][1]}</span>`;

/* ---------- Íconos ---------- */
const I={
  check:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6.3"/><path d="M5.4 8.2l1.8 1.8 3.5-3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cal:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M2.5 7h11M5.5 2v3M10.5 2v3"/></svg>',
  users:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6" cy="5.5" r="2.3"/><path d="M1.8 13.5c.6-2.3 2.2-3.5 4.2-3.5s3.6 1.2 4.2 3.5M10.5 3.4a2.2 2.2 0 010 4.2M12 10.3c1.2.5 1.9 1.6 2.2 3.2" stroke-linecap="round"/></svg>',
  clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4" stroke-linecap="round"/></svg>',
  bolt:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.2 1.5L3.5 9h3.8l-.6 5.5L12.5 7H8.6z"/></svg>',
  star:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2l1.8 3.8 4.1.5-3 2.8.8 4.1L8 11.2l-3.7 2 .8-4.1-3-2.8 4.1-.5z" stroke-linejoin="round"/></svg>',
  globe:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14c-1.8-1.7-2.6-3.7-2.6-6S6.2 3.7 8 2z"/></svg>',
  pin:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 00-9 0C3.5 10 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.6"/></svg>',
  shield:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 1.8l5 2v3.8c0 3.2-2.2 5.6-5 6.6-2.8-1-5-3.4-5-6.6V3.8z" stroke-linejoin="round"/></svg>',
  swap:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const LOGO='<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="7" fill="#fff"/><path d="M7 12.6l3.3 3.2L17.2 8.8" stroke="#000" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- Reglas del negocio ---------- */
// Fase 1 → Fase 2: vencido el plazo con cupo incompleto, la vacante pasa sola al calendario general (si el operador comparte su personal)
function tick(){
  const msgs=[];
  DB.EVENTS.forEach(e=>e.vacantes.forEach(v=>{
    if(v.fase==='propio'&&now().getTime()>=v.cierre&&conf(v)<v.cupos){
      if(OP(e.op).compartir){v.fase='general';v.bloqueada=false;msgs.push({op:e.op,msg:`${v.rol} de “${e.nombre}” pasó al calendario general`})}
      else v.bloqueada=true;
    }}));
  if(msgs.length)save();
  return msgs;
}
function visible(e,v,w){
  if(isPast(e.fecha)||OP(e.op).activo===false)return false;
  if(v.reemplazo&&v.reemplazo.notificados.includes(w.id))return true;
  if(w.ops.includes(e.op)&&(v.fase==='general'||v.convocados.includes(w.id)))return true;
  return v.fase==='general'&&w.enBolsa&&OP(e.op).compartir;
}
function origenPara(e,v,w){
  if(v.reemplazo&&v.reemplazo.notificados.includes(w.id))return 'reemplazo';
  return w.ops.includes(e.op)?'propio':'bolsa';
}
/* Emparejamiento por reglas (sin aprendizaje automático, funciona desde el primer evento).
   Requisitos obligatorios: tener el rol, estar disponible ese día de la semana y no tener otro turno confirmado ese día.
   Si falta uno obligatorio, la persona se descarta. Requisitos deseables (suman puntaje):
   haber trabajado antes con el operador (+2), vivir en la zona del evento (+1) y la calificación (hasta +1). */
function cumpleObligatorios(e,v,w){
  const dia=D(e.fecha).getDay();
  return w.roles.includes(v.rol)&&w.disp.includes(dia)
    &&!DB.EVENTS.some(x=>x.fecha===e.fecha&&x.vacantes.some(y=>y.postulaciones.some(p=>p.wid===w.id&&p.estado==='confirmado')));
}
function puntaje(e,v,w){
  const motivos=[];let p=0;
  if(w.ops.includes(e.op)){p+=2;motivos.push('ya trabajó con este operador')}
  if(w.zona===e.zona){p+=1;motivos.push('vive en la zona')}
  p+=rating(w)/5;
  return {puntaje:Math.round(p*100)/100,motivos};
}
function candidatosReemplazo(e,v){
  return DB.WORKERS.filter(w=>!v.postulaciones.some(p=>p.wid===w.id)
    &&(w.ops.includes(e.op)||(w.enBolsa&&OP(e.op).compartir))
    &&cumpleObligatorios(e,v,w))
    .sort((a,b)=>puntaje(e,v,b).puntaje-puntaje(e,v,a).puntaje).slice(0,5);
}
function marcarAusente(e,v,wid){
  const a=v.asistencia[wid];a.estado='ausente';a.ent='';a.sal='';
  v.postulaciones.find(p=>p.wid===wid).estado='ausente';
  W_(wid).ausentes++;
  const c=candidatosReemplazo(e,v);
  v.reemplazo={inicio:now().getTime(),notificados:c.map(w=>w.id),por:wid};
  return c.length?`Se notificó a ${c.length} persona(s) disponibles con perfil de ${v.rol}`:'No hay personas disponibles con ese perfil';
}
/* ---------- Registro de horas ----------
   El trabajador marca entrada y salida desde su celular el día del evento. La hora la pone el sistema, no se escribe a mano.
   El operador no puede editar las horas: solo valida el registro o lo reporta al administrador.
   Una vez validado, el registro queda bloqueado. */
const hhmm=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
// La jornada va desde el día del evento hasta el mediodía siguiente, para turnos que terminan después de medianoche
const enJornada=e=>isToday(e.fecha)||iso(new Date(now().getTime()-12*3600e3))===e.fecha;
function puedeMarcar(e,v,wid){return enJornada(e)&&v.postulaciones.some(p=>p.wid===wid&&p.estado==='confirmado')}
function marcar(e,v,wid,tipo){
  if(!puedeMarcar(e,v,wid))return 'Solo puedes marcar el día del evento y si estás confirmado';
  const a=v.asistencia[wid]||(v.asistencia[wid]=nuevaAsistencia());
  if(a.validado)return 'El registro ya fue validado y no se puede cambiar';
  if(tipo==='ent'){if(a.ent)return 'La entrada ya está marcada';a.ent=hhmm(now());a.estado='presente';W_(wid).presentes++;return `Entrada marcada a las ${a.ent}`}
  if(!a.ent)return 'Primero marca la entrada';
  if(a.sal)return 'La salida ya está marcada';
  a.sal=hhmm(now());return `Salida marcada a las ${a.sal}. Trabajaste ${horas(a.ent,a.sal).toFixed(1)} h`;
}
function validar(v,wid){const a=v.asistencia[wid];if(!a||!a.ent||!a.sal)return false;if(a.reporte&&a.reporte.estado==='abierto')return false;a.validado=true;return true}
function calificar(v,wid,n){const a=v.asistencia[wid];if(!a||!a.validado)return false;const w=W_(wid);if(a.cal)w.ratings.pop();if(n)w.ratings.push(n);a.cal=n;return true}
function reportar(v,wid,motivo){const a=v.asistencia[wid];if(!a||a.validado)return false;a.reporte={motivo,at:now().getTime(),estado:'abierto',decision:''};return true}
function resolverReporte(v,wid,decision){const a=v.asistencia[wid];if(!a||!a.reporte||a.reporte.estado!=='abierto')return false;
  a.reporte.estado='resuelto';a.reporte.decision=decision;
  if(decision==='anular'){a.ent='';a.sal='';a.estado='pendiente'}else{a.validado=true}
  return true}
function reportesAbiertos(){const r=[];DB.EVENTS.forEach(e=>e.vacantes.forEach(v=>Object.entries(v.asistencia).forEach(([wid,a])=>{if(a.reporte)r.push({e,v,wid,a})})));return r}

const PAST=[['Expo Moda Caribe','2026-09-26'],['Feria del Libro de Barranquilla','2026-09-12'],['Lanzamiento de app bancaria','2026-08-29'],['Congreso de Odontología','2026-08-15']];
function hist(w){return PAST.slice(0,Math.min(4,1+Math.floor(w.eventos/10))).map((p,i)=>({evento:p[0],fecha:p[1],rol:w.roles[i%w.roles.length],op:OP(w.ops[0]).nombre,asistio:!(w.asis<90&&i===1)}))}
function histTable(w){
  const h=hist(w);
  if(!h.length||!w.eventos)return '<p class="note">Todavía no hay eventos registrados en LogisYa.</p>';
  return `<div class="tbl"><table><thead><tr><th>Fecha</th><th>Evento</th><th>Rol</th><th>Operador</th><th>Asistencia</th></tr></thead><tbody>
   ${h.map(x=>`<tr><td class="num" style="white-space:nowrap">${fdate(x.fecha)}</td><td>${esc(x.evento)}</td><td class="small">${esc(x.rol)}</td><td class="small">${esc(x.op)}</td><td>${x.asistio?'<span class="pill ok">Asistió</span>':'<span class="pill bad">No asistió</span>'}</td></tr>`).join('')}
   </tbody></table></div>`;
}

/* ---------- Barra de navegación de las vistas ---------- */
function appNav({tabs,active,selectHtml,otherHref,otherLabel}){
  return `<div class="nav-in">
    <a class="logo" href="index.html">${LOGO}LogisYa</a>
    <nav class="nav-links" aria-label="Secciones">${tabs.map(([k,t])=>`<button data-act="view" data-v="${k}" ${k===active?'aria-current="page"':''}>${t}</button>`).join('')}<a href="${otherHref}">${otherLabel} ↗</a>${/admin\.html$/.test(location.pathname)?'':'<a href="admin.html">Admin ↗</a>'}</nav>
    <div class="nav-right">${selectHtml}<span class="chip-clock" title="Hora simulada de la demo">${fdt(now())}</span><button class="btn btn-dark btn-sm" data-act="adv" title="Simula el paso del tiempo para ver cómo se abren las vacantes">Avanzar 6 h</button></div></div>`;
}
