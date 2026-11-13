// ÓRBITA V3.3.48 — Consulta mensual para usuarios de negocio.
// Solo lectura; reutiliza el permiso actual de Mis solicitudes. No publica notas ni expedientes internos.
(() => {
'use strict';
const $=id=>document.getElementById(id);
const MONTHS=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const norm=v=>String(v??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PROGRESS={BACKLOG:0,ANALISIS:20,DESARROLLO:40,QA:60,UAT:80,LIBERADO:100};
let client,periods=[],systems=[],rows=[],historical=false;
const status=p=>norm(p.estatus||p.cat_estatus?.nombre||'BACKLOG');
const progress=p=>Number.isFinite(+p.avance)?Math.max(0,Math.min(100,+p.avance)):(PROGRESS[status(p)]??0);
const isUrgent=p=>['URGENTE','NO_PLANEADO'].includes(norm(p.tipo_incorporacion));
const currentId=p=>String(p.sprint_actual_id||p.sprint_id||'');
const label=p=>`${p.nombre} ${p.anio||''}`.trim();
function kind(p,id){return isUrgent(p)?'urgente':p.es_arrastre===true||(p.sprint_id&&String(p.sprint_id)!==String(id))?'arrastre':'planeado';}
function el(id,t){const node=$(id);if(node)node.textContent=t;}
function kpi(name,n){return `<div class="s-kpi"><div class="s-label">${name}</div><div class="text-2xl font-black mt-2 text-blue-700">${esc(n)}</div></div>`;}
function selected(){return periods.find(p=>String(p.id)===$('sprint-periodo').value);}
function monthKey(s){return Number(s.anio||0)*12+MONTHS.indexOf(norm(s.nombre));}
function render(){
  const sprint=selected();if(!sprint)return;
  const system=$('sprint-sistema').value;
  const scoped=rows.filter(p=>!system||String(p.sistema_id)===system);
  const filtered=scoped.filter(p=>{
    const term=norm($('sprint-buscar').value),k=$('sprint-tipo').value,et=$('sprint-etapa').value;
    return (!term||norm(`${p.id_req||p.numero_rqm||''} ${p.nombre_rqm||p.nombre||''}`).includes(term))&&(!k||kind(p,sprint.id)===k)&&(!et||status(p)===norm(et));
  });
  const {liberados,avance:avg}=window.OrbitaSummary.sprint(scoped);
  const arrastres=scoped.filter(p=>kind(p,sprint.id)==='arrastre').length;
  const extra=scoped.filter(isUrgent).length;
  $('sprint-indicadores').innerHTML=[kpi('Atendidos',scoped.length),kpi('Liberados',liberados),kpi('Pendientes',scoped.length-liberados),kpi('Arrastres',arrastres),kpi('Fuera de planeación',extra),kpi('Avance',avg+'%')].join('');
  el('sprint-visible',`${filtered.length} de ${scoped.length} requerimientos`);
  $('sprint-resultados').innerHTML=filtered.map(p=>{
    const st=status(p),av=progress(p),k=kind(p,sprint.id),nm=p.nombre_rqm||p.nombre||'Sin nombre',num=p.id_req||p.numero_rqm||'RQM sin folio';
    const sys=p.cat_sistemas?.nombre||systems.find(s=>String(s.id)===String(p.sistema_id))?.nombre||'Sistema no indicado';
    const tone=st==='LIBERADO'?'s-green':st==='UAT'||st==='QA'?'s-blue':st==='BACKLOG'?'s-gray':'s-yellow';
    const tipo=k==='arrastre'?'Arrastre':k==='urgente'?'Fuera de planeación':'Planeado';
    return `<details class="s-row" style="display:block"><summary class="cursor-pointer list-none grid items-center gap-3" style="grid-template-columns:minmax(0,1fr) 120px 110px"><div class="min-w-0"><div class="text-xs font-black text-blue-700">${esc(num)} · ${esc(sys)}</div><h3 class="font-bold mt-1 break-words">${esc(nm)}</h3><div class="flex flex-wrap gap-2 mt-2"><span class="s-pill">${esc(tipo)}</span></div></div><div><span class="s-state ${tone}">${esc(st)}</span></div><div class="text-right"><strong class="text-blue-700">${av}%</strong><div class="s-progress mt-2"><div style="width:${av}%"></div></div></div></summary><div class="s-detail"><p class="text-xs text-slate-500 font-semibold">Estatus: <strong class="text-slate-800">${esc(st)}</strong> · Avance: <strong>${av}%</strong> · Clasificación: ${esc(tipo)}</p><p class="text-xs mt-2 text-slate-500">Esta vista muestra exclusivamente información de seguimiento autorizada para consulta general. Para detalles operativos, contacta a la PMO.</p></div></details>`;
  }).join('')||'<div class="text-sm text-slate-500 p-8 text-center">No hay requerimientos para los filtros seleccionados.</div>';
  if(window.lucide)lucide.createIcons();
}
async function loadSprint(){
 const p=selected();if(!p)return;
 el('sprint-estado','Consultando');$('sprint-resultados').innerHTML='<p class="text-slate-500 text-sm">Consultando requerimientos...</p>';
 const now=new Date(),live=monthKey(p)===(now.getFullYear()*12+now.getMonth());
 historical=!live;
 try{
   if(live){
     // Un mismo RQM puede ser de arrastre, pero se muestra una sola vez por su sprint_actual.
     const data=await window.OrbitaSummary.allRows(()=>client.from('pmo_projects').select('id,id_req,nombre_rqm,estatus,sistema_id,sprint_id,sprint_actual_id,tipo_incorporacion,cat_sistemas(nombre)',{count:'exact'}).or(`sprint_actual_id.eq.${p.id},and(sprint_actual_id.is.null,sprint_id.eq.${p.id})`).order('id'));
     rows=(data||[]).filter(x=>status(x)!=='CANCELADO');
     el('sprint-nota','Sprint en curso · información actual, solo lectura. Arrastres y urgentes se contabilizan una sola vez.');
     el('sprint-estado','En curso');
   }else{
     // Sólo usar una fotografía mensual guardada; nunca reconstruir el pasado con datos actuales.
     const {data,error}=await client.from('pmo_sprint_cierres').select('sistema_id,snapshot,reabierto').eq('sprint_id',p.id).eq('reabierto',false);
     if(error)throw error;
     const all=(data||[]).find(x=>String(x.sistema_id).toUpperCase()==='ALL');
     const older=all?[all]:data||[];
     const map=new Map();
     older.forEach(c=>(c.snapshot?.items||[]).forEach(x=>{const id=String(x.id||x.id_req||'');if(id&&!map.has(id))map.set(id,{...x,nombre_rqm:x.nombre, id_req:x.id_req, sistema_id:x.sistema_id,estatus:x.estatus,es_arrastre:x.es_arrastre, tipo_incorporacion:x.tipo_incorporacion, avance:x.avance});}));
     rows=[...map.values()].filter(x=>status(x)!=='CANCELADO');
     el('sprint-nota',rows.length?'Fotografía histórica del cierre mensual · solo lectura.':'Este Sprint no tiene una fotografía de cierre disponible para consulta.');
     el('sprint-estado',rows.length?'Cerrado':'Sin cierre');
   }
   render();
 }catch(e){console.error('Consulta Sprint:',e);$('sprint-resultados').innerHTML='<p class="text-red-700 text-sm p-5">No fue posible consultar el Sprint. Verifica los permisos de lectura y vuelve a intentar.</p>';el('sprint-estado','No disponible');$('sprint-indicadores').innerHTML='';}
}
async function init(){
 const auth=await window.PMOAuth?.guardPage?.();if(!auth?.user||!window.PMOAuth?.canView?.('selfservice'))return;
 client=window.PMOAuth.client;
 try{
  const results=await Promise.all([client.from('cat_sprints').select('id,nombre,anio'),client.from('cat_sistemas').select('id,nombre').order('nombre')]);
  if(results[0].error)throw results[0].error;
  periods=(results[0].data||[]).filter(x=>MONTHS.includes(norm(x.nombre))).sort((a,b)=>monthKey(b)-monthKey(a));
  systems=results[1].data||[];
  const s=$('sprint-periodo');s.innerHTML=periods.map(p=>`<option value="${esc(p.id)}">${esc(label(p))}</option>`).join('');
  const now=new Date(),active=periods.find(x=>monthKey(x)===now.getFullYear()*12+now.getMonth());if(active)s.value=active.id;
  $('sprint-sistema').innerHTML='<option value="">Todos los sistemas</option>'+systems.map(x=>`<option value="${esc(x.id)}">${esc(x.nombre)}</option>`).join('');
  if(!periods.length){el('sprint-estado','Sin Sprint');el('sprint-nota','No hay Sprints configurados en el catálogo.');return;}
  s.addEventListener('change',loadSprint);$('sprint-recargar').addEventListener('click',loadSprint);
  ['sprint-sistema','sprint-buscar','sprint-tipo','sprint-etapa'].forEach(id=>$(id).addEventListener(id==='sprint-buscar'?'input':'change',render));
  await loadSprint();
 }catch(e){console.error('Catálogos sprint:',e);el('sprint-estado','No disponible');el('sprint-nota','No se pudieron consultar los catálogos del Sprint.');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
