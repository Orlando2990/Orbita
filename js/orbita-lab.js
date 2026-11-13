/* ORBITA V3.3.52 — experiencia homologada, sin modificar cálculos ni permisos. */
(function(){'use strict';
 const titles={inicio:'Inicio',matriz:'Matriz de requerimientos',rqm:'Control de números de requerimiento',selfservice:'Alta de requerimientos',proyectos:'Portafolio de Proyectos',dashboard:'Dashboard ejecutivo',seguimiento:'Seguimiento ejecutivo',avisos:'Centro de Avisos',usuarios:'Usuarios, roles y permisos',importar:'Importador de Matriz',catalogos:'Administración de catálogos',sprintmes:'Sprint del mes'};
 const module=document.getElementById('pmo-app-header')?.dataset.pmoModule||'matriz';
 if(new URLSearchParams(location.search).get('modal')==='1' && module==='selfservice' && location.pathname.endsWith('sprint_mes.html'))return;
 function moveControls(hero,area){
   // Remove only presentation wrappers; retain the original buttons and listeners.
   const candidates=Array.from(hero.querySelectorAll('button,select,a[href]')).filter(el=>!el.closest('[hidden]'));
   for(const el of candidates){if(el.closest('.orbita-lab-actions'))continue;area.appendChild(el);}
 }
 function normalize(){
   if(module==='inicio'||document.documentElement.classList.contains('sprint-embed'))return;
   const main=document.querySelector('body > main');if(!main)return;
   let heading=main.querySelector(':scope > .orbita-lab-page-heading');
   if(!heading){heading=document.createElement('div');heading.className='orbita-lab-page-heading';heading.innerHTML='<div class="orbita-lab-heading-title"><h1></h1></div><div class="orbita-lab-actions"></div>';main.insertBefore(heading,main.firstChild);}
   heading.querySelector('h1').textContent=titles[module]||document.title.split('|')[0];
   const area=heading.querySelector('.orbita-lab-actions');
   // Named main banners only; do not touch dashboard summary or other content cards.
   const selectors={matriz:'#pmo-panel-requerimientos > .pmo-exec-hero',rqm:'main > section:first-of-type',selfservice:'main > .portal-hero',proyectos:'main > section:first-of-type',dashboard:'main > .pmo-exec-hero',seguimiento:'main > section:first-of-type',avisos:'main > section:first-of-type',importar:'main > .pmo-exec-hero',catalogos:'#panel-admin > .pmo-exec-hero',usuarios:'#hero-usuarios > .pmo-exec-hero'};
   const hero=document.querySelector(selectors[module]||'.no-orbita-hero');
   if(hero && !hero.dataset.orbitaLabMoved){
      moveControls(hero,area);
      hero.dataset.orbitaLabMoved='true';hero.classList.add('orbita-lab-deprecated-hero');
   }
   // Users hero arrives asynchronously after profile guard.
   if(module==='usuarios' && !hero){const target=document.getElementById('hero-usuarios');if(target&&!target.dataset.orbitaObserved){target.dataset.orbitaObserved='1';new MutationObserver(()=>normalize()).observe(target,{childList:true});}}
   // In matrix the hero is rendered by PMO panel JavaScript asynchronously.
   if(module==='matriz' && !hero){const target=document.getElementById('pmo-panel-requerimientos');if(target&&!target.dataset.orbitaObserved){target.dataset.orbitaObserved='1';new MutationObserver(()=>normalize()).observe(target,{childList:true});}}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',normalize);else normalize();
})();
