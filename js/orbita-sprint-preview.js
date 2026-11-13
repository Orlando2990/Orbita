/* ÓRBITA V3.3.53 — Vista del Sprint con la misma composición visual del modal de Dashboard.
   Solo lectura: ninguna escritura en Supabase. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const norm=window.OrbitaSummary.norm;
const PROGRESS={BACKLOG:0,ANALISIS:20,DESARROLLO:40,QA:60,UAT:80,LIBERADO:100};
const STAGES=['LIBERADO','UAT','QA','DESARROLLO','ANALISIS','BACKLOG'];
const LABELS={LIBERADO:'Liberados',UAT:'UAT',QA:'QA',DESARROLLO:'Desarrollo',ANALISIS:'Análisis',BACKLOG:'Backlog'};
const TONES={
 LIBERADO:{base:'bg-emerald-50 text-emerald-800',active:'ring-2 ring-emerald-300 bg-emerald-100'},
 UAT:{base:'bg-blue-50 text-blue-800',active:'ring-2 ring-blue-300 bg-blue-100'},
 QA:{base:'bg-amber-50 text-amber-800',active:'ring-2 ring-amber-300 bg-amber-100'},
 DESARROLLO:{base:'bg-violet-50 text-violet-800',active:'ring-2 ring-violet-300 bg-violet-100'},
 ANALISIS:{base:'bg-cyan-50 text-cyan-800',active:'ring-2 ring-cyan-300 bg-cyan-100'},
 BACKLOG:{base:'bg-slate-100 text-slate-700',active:'ring-2 ring-slate-300 bg-slate-200'}
};
const status=r=>norm(r.estatus||'BACKLOG');
const advance=r=>Number.isFinite(Number(r.avance))&&r.avance!=null ? Math.min(100,Math.max(0,Number(r.avance))) : PROGRESS[status(r)]??0;
const urgent=r=>['URGENTE','NO_PLANEADO'].includes(norm(r.tipo_incorporacion));
const monthKey=p=>Number(p.anio)*12+months.indexOf(norm(p.nombre));
const isCarry=(r,p)=>r.es_arrastre===true || Boolean(r.sprint_id && String(r.sprint_id)!==String(p.id));
let allRows=[],activeStatus='TODOS',sprint=null,historical=false;
function parentTitle(text,subtitle){try{window.parent.postMessage({type:'orbita-sprint-preview-title',title:text,subtitle},location.origin)}catch{}}
function kpi(name,value,colors,note){return `<div class="preview-kpi ${colors}"><div class="preview-kpi-label">${esc(name)}</div><div class="preview-kpi-value">${esc(value)}</div><div class="preview-kpi-note">${esc(note)}</div></div>`}
function showError(message){$('sprint-preview-loading').textContent=message;$('sprint-preview-loading').hidden=false;$('sprint-preview-content').hidden=true;}
function render(){
 const total=allRows.length,lib=allRows.filter(r=>status(r)==='LIBERADO').length,carry=allRows.filter(r=>isCarry(r,sprint)).length,out=allRows.filter(urgent).length;
 const avg=total?Math.round(allRows.reduce((sum,r)=>sum+advance(r),0)/total):0;
 $('sprint-preview-kpis').innerHTML=[
  kpi('Atendidos',total,'bg-slate-50 border-slate-100 text-slate-900','Durante el periodo'),
  kpi('Liberados',lib,'bg-emerald-50 border-emerald-100 text-emerald-800','Concluidos'),
  kpi('Pendientes',total-lib,'bg-amber-50 border-amber-100 text-amber-800',historical?'Al cierre':'En curso'),
  kpi('Arrastres recibidos',carry,'bg-violet-50 border-violet-100 text-violet-800','De periodos previos'),
  kpi('Fuera de planeación',out,'bg-orange-50 border-orange-100 text-orange-800','Incorporados'),
  kpi('Avance',avg+'%','bg-indigo-50 border-indigo-100 text-indigo-800',historical?'Al cierre':'Actual')
 ].join('');
 $('sprint-preview-result-subtitle').textContent=historical?'Estatus al momento del cierre.':'Estatus actual del Sprint.';
 const counts=Object.fromEntries(STAGES.map(s=>[s,allRows.filter(r=>status(r)===s).length]));
 $('sprint-preview-stages').innerHTML=`<button type="button" data-status="TODOS" aria-pressed="${activeStatus==='TODOS'}" class="preview-stage ${activeStatus==='TODOS'?'active bg-slate-200 text-slate-800':'bg-slate-50 text-slate-700'}"><span>Todos</span><span class="text-lg font-black">${total}</span></button>`+
 STAGES.filter(s=>counts[s]>0).map(s=>`<button type="button" data-status="${s}" aria-pressed="${activeStatus===s}" class="preview-stage ${TONES[s].base} ${activeStatus===s?TONES[s].active:''}"><span>${LABELS[s]}</span><span class="text-lg font-black">${counts[s]}</span></button>`).join('');
 $('sprint-preview-stages').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeStatus=b.dataset.status;render()}));
 const filtered=activeStatus==='TODOS'?allRows:allRows.filter(r=>status(r)===activeStatus);
 $('sprint-preview-list-title').textContent=activeStatus==='TODOS'?'Todos los requerimientos':LABELS[activeStatus]||activeStatus;
 $('sprint-preview-list-subtitle').textContent=activeStatus==='TODOS'?(historical?'Requerimientos del Sprint al momento del cierre.':'Requerimientos del Sprint en curso.'):`Requerimientos con estatus ${LABELS[activeStatus]||activeStatus}.`;
 $('sprint-preview-count').textContent=`${filtered.length} RQM`;
 $('sprint-preview-list').innerHTML=filtered.map(r=>{
  const st=status(r),av=advance(r),esUrgente=urgent(r),esArrastre=isCarry(r,sprint)&&!esUrgente;
  const tags=`${esArrastre?'<span class="preview-flag bg-violet-50 text-violet-700">↪ Arrastre</span>':''}${esUrgente?'<span class="preview-flag bg-orange-50 text-orange-700">♨ Fuera de planeación</span>':''}`;
  const num=r.id_req||r.numero_rqm||'RQM',name=r.nombre_rqm||r.nombre||'Sin nombre';
  const outcome=st==='LIBERADO'?'Liberado':historical?'Pendiente al cierre':'En proceso';
  return `<article class="preview-row"><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="preview-id">${esc(num)}</span>${tags}</div><p class="preview-name">${esc(name)}</p><p class="preview-sub">${esc(st==='ANALISIS'?'ANÁLISIS':st)} · ${av}% de avance</p></div><span class="preview-pill">${outcome}</span></article>`;
 }).join('')||'<div class="preview-message">No hay requerimientos para este estatus.</div>';
 $('sprint-preview-loading').hidden=true;$('sprint-preview-content').hidden=false;
}
async function init(){
 try{
  const session=await window.PMOAuth?.guardPage?.();if(!session?.user)return;
  if(!window.PMOAuth.canView('selfservice')){showError('No tienes acceso a la consulta del Sprint.');return;}
  const client=window.PMOAuth.client;
  const now=new Date(),period=now.getFullYear()*12+now.getMonth();
  const {data,error}=await client.from('cat_sprints').select('id,nombre,anio');if(error)throw error;
  sprint=(data||[]).find(p=>monthKey(p)===period);
  if(!sprint){showError('No se encontró un Sprint configurado para el mes actual.');return;}
  parentTitle(`${norm(sprint.nombre)} ${sprint.anio}`,'Todos los sistemas · vista previa');
  historical=false;
  const dataRows=await window.OrbitaSummary.allRows(()=>client.from('pmo_projects').select('id,id_req,nombre_rqm,estatus,sistema_id,sprint_id,sprint_actual_id,tipo_incorporacion',{count:'exact'}).or(`sprint_actual_id.eq.${sprint.id},and(sprint_actual_id.is.null,sprint_id.eq.${sprint.id})`).order('id'));
  allRows=dataRows.filter(r=>status(r)!=='CANCELADO');
  render();
 }catch(e){console.error('Sprint vista previa:',e);showError('No fue posible consultar el Sprint. Verifica la conexión y los permisos de lectura.');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
