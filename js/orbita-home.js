// Inicio A · Original, integrado con las fuentes y permisos existentes.
(()=>{'use strict';
const $=id=>document.getElementById(id),S=window.OrbitaSummary;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const requestLabels=['Registradas','En revisión','Aprobadas','Requieren ajuste'], sprintLabels=['Requerimientos','Liberados','Pendientes','Avance'];
function metrics(id,labels,values=[]){$(id).innerHTML=labels.map((n,i)=>`<div class="oh-metric"><strong>${esc(values[i]??'—')}</strong><span>${esc(n)}</span></div>`).join('');}
let busy=false;
async function requests(auth){metrics('oh-requests-metrics',requestLabels);$('oh-latest').textContent='Consultando solicitudes…';try{
 const rows=await S.allRows(()=>auth.client.from('rqm_control_requerimientos').select('id,numero_rqm,proyecto,estatus,created_at,fecha_asignacion',{count:'exact'}).eq('creado_por',auth.user.id).eq('origen_registro','SELF_SERVICE').order('created_at',{ascending:false}).order('fecha_asignacion',{ascending:false}).order('id'));
 const k=S.requests(rows);metrics('oh-requests-metrics',requestLabels,[k.total,k.revision,k.aprobadas,k.ajuste]);
 $('oh-latest').textContent=rows.length?`Solicitud más reciente · ${rows[0].numero_rqm||'Sin folio'} · ${rows[0].proyecto||'Sin nombre'}`:'Aún no tienes solicitudes registradas.';
 return true;
 }catch(e){$('oh-latest').textContent='No fue posible consultar tus solicitudes. Vuelve a intentar con Actualizar resumen.';return false;}}
async function sprint(auth){metrics('oh-sprint-metrics',sprintLabels);$('oh-sprint-note').textContent='Consultando Sprint…';try{
 const {data,error}=await auth.client.from('cat_sprints').select('id,nombre,anio');if(error)throw error;
 const now=new Date(),matches=(data||[]).filter(p=>Number(p.anio)===now.getFullYear()&&S.norm(p.nombre)===S.months[now.getMonth()]);
 if(matches.length!==1){$('oh-sprint-note').textContent=matches.length?'Hay más de un Sprint para este mes. Revisa el catálogo.':'No hay un Sprint configurado para el mes actual.';return true;}
 const p=matches[0];$('oh-period').textContent=`${p.nombre} ${p.anio} · Compromisos de Tecnología`;
 const rows=await S.allRows(()=>auth.client.from('pmo_projects').select('id,estatus,sprint_id,sprint_actual_id',{count:'exact'}).or(`sprint_actual_id.eq.${p.id},and(sprint_actual_id.is.null,sprint_id.eq.${p.id})`).order('id'));
 const k=S.sprint(rows);metrics('oh-sprint-metrics',sprintLabels,[k.total,k.liberados,k.pendientes,k.avance+'%']);
 $('oh-sprint-note').textContent=k.total?'Avance general según las etapas del Sprint. Cancelados excluidos.':'No hay requerimientos visibles en el Sprint de este mes.';return true;
 }catch(e){$('oh-sprint-note').textContent='No fue posible consultar el Sprint. Vuelve a intentar con Actualizar resumen.';return false;}}
function notices(event){if(!window.PMOAuth?.canView('avisos'))return;const d=event.detail||{};if(d.error){$('oh-notice-title').textContent='Centro de Avisos';$('oh-notice-text').textContent='No fue posible actualizar los avisos. Consulta el módulo o vuelve a intentar.';$('oh-notice-link').href='centro_avisos_mockup.html';return;}if(!d.loaded)return;const items=d.items||[];
 $('oh-notice-title').textContent=items.length?'Avisos pendientes':'Estás al día';
 $('oh-notice-text').textContent=items.length?`${items.length} sin leer · ${items[0].titulo}`:'No tienes avisos pendientes de lectura.';
 $('oh-notice-link').href=items.length?`centro_avisos_mockup.html?aviso=${encodeURIComponent(items[0].id)}`:'centro_avisos_mockup.html';}
window.addEventListener('orbita:inicio-avisos',notices);
async function refresh(){if(busy)return;const auth=window.PMOAuth;if(!auth.user)return;busy=true;$('oh-refresh').disabled=true;try{const tasks=[];if(auth.canView('selfservice'))tasks.push(requests(auth),sprint(auth));const results=await Promise.all(tasks);$('oh-updated').textContent=results.includes(false)?'Algunos datos no están disponibles. Puedes volver a intentar.':'';await window.PMOLayout?.refreshNotices();}finally{busy=false;$('oh-refresh').disabled=false;}}
let sprintFocusReturn=null;
function openSprintModal(ev){
 ev?.preventDefault();
 if(!window.PMOAuth?.canView?.('selfservice'))return;
 const modal=$('oh-sprint-modal'),frame=$('oh-sprint-frame');if(!modal||!frame)return;
 sprintFocusReturn=document.activeElement;
 const label=$('oh-period')?.textContent||'';
 // Título determinado por el periodo vigente del resumen, con fallback al mes actual.
 const match=label.match(/(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+20\d{2}/i);
 const monthName=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'][new Date().getMonth()];
 $('oh-sprint-modal-title').textContent=match?match[0].toUpperCase():monthName+' '+new Date().getFullYear();
 modal.hidden=false;document.body.classList.add('oh-dialog-open');
 if(!frame.getAttribute('src'))frame.src='sprint_preview.html';
 $('oh-close-sprint').focus();
}
function closeSprintModal(){const modal=$('oh-sprint-modal');if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove('oh-dialog-open');sprintFocusReturn?.focus?.();}
function setupSprintModal(){
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('oh-sprint-frame')?.contentWindow||e.data?.type!=='orbita-sprint-preview-title')return;const title=String(e.data.title||'');if(/^(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+20\d{2}$/.test(title))$('oh-sprint-modal-title').textContent=title;});
 $('oh-open-sprint')?.addEventListener('click',openSprintModal);
 $('oh-close-sprint')?.addEventListener('click',closeSprintModal);
 $('oh-sprint-modal')?.querySelector('[data-close-sprint]')?.addEventListener('click',closeSprintModal);
 document.addEventListener('keydown',e=>{if($('oh-sprint-modal')?.hidden)return;if(e.key==='Escape')closeSprintModal();else if(e.key==='Tab'){const close=$('oh-close-sprint');if(e.shiftKey&&document.activeElement===close){e.preventDefault();close.focus();}}});
}
async function init(){const session=await window.PMOAuth?.guardPage();if(!session?.user)return;const auth=window.PMOAuth,view=auth.canView('selfservice');$('oh-requests-card').hidden=!view;$('oh-sprint-card').hidden=!view;$('oh-new').hidden=!auth.canManage('selfservice');$('oh-read-only').hidden=!(view&&!auth.canManage('selfservice'));$('oh-notice-card').hidden=!auth.canView('avisos');$('oh-limited').hidden=view||auth.canView('avisos');$('oh-refresh').addEventListener('click',refresh);setupSprintModal();await refresh();}
document.addEventListener('DOMContentLoaded',init);
})();
