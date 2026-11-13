// ÓRBITA V3.3.49 — definiciones compartidas, sin operaciones de escritura.
(function(root){
'use strict';
const norm=v=>String(v??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const stages={BACKLOG:0,ANALISIS:20,DESARROLLO:40,QA:60,UAT:80,LIBERADO:100};
const status=r=>norm(r.estatus||r.cat_estatus?.nombre||'BACKLOG');
const progress=r=>Number.isFinite(+r.avance)?Math.max(0,Math.min(100,+r.avance)):(stages[status(r)]??0);
function requests(rows){return {total:rows.length,revision:rows.filter(r=>['REGISTRADO','NUEVO','ENVIADA'].includes(norm(r.estatus))).length,aprobadas:rows.filter(r=>norm(r.estatus)==='CONVERTIDO A PMO').length,ajuste:rows.filter(r=>norm(r.estatus).includes('AJUSTE')).length};}
function sprint(rows){const active=rows.filter(r=>status(r)!=='CANCELADO'),liberados=active.filter(r=>status(r)==='LIBERADO').length;return {total:active.length,liberados,pendientes:active.length-liberados,avance:active.length?Math.round(active.reduce((n,r)=>n+progress(r),0)/active.length):0};}
// Sigue paginando aunque el servidor limite una respuesta por debajo del tamaño solicitado.
async function allRows(makeQuery){const rows=[];for(let offset=0;;){const {data,error,count}=await makeQuery().range(offset,offset+499);if(error)throw error;const batch=data||[];rows.push(...batch);offset+=batch.length;if(!batch.length || (Number.isFinite(count)&&offset>=count))return rows;}}
root.OrbitaSummary={norm,months,status,progress,requests,sprint,allRows};
})(typeof window!=='undefined'?window:globalThis);
