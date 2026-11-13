const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const base=require('node:path').resolve(__dirname,'..')+'/';
(async()=>{
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(base+'js/orbita-summary.js','utf8'),ctx);const S=ctx.OrbitaSummary;
assert.deepEqual(JSON.parse(JSON.stringify(S.requests([{estatus:'REGISTRADO'},{estatus:'CONVERTIDO A PMO'},{estatus:'REQUIERE AJUSTE'},{estatus:'RECHAZADO'}]))),{total:4,revision:1,aprobadas:1,ajuste:1});
assert.deepEqual(JSON.parse(JSON.stringify(S.sprint([{estatus:'ANÁLISIS'},{estatus:'LIBERADO'},{estatus:'CANCELADO'}]))),{total:2,liberados:1,pendientes:1,avance:60});
assert.equal(S.sprint([]).avance,0);
const all=Array.from({length:1201},(_,i)=>({id:i}));let calls=0;const result=await S.allRows(()=>({range:async(a,b)=>{calls++;return {data:all.slice(a,Math.min(a+80,b+1)),count:all.length,error:null}}}));assert.equal(result.length,1201);assert.equal(calls,16);
await assert.rejects(S.allRows(()=>({range:async()=>({error:new Error('RLS')})})),/RLS/);
const events={},cache=new Map();const authctx={window:{},location:{pathname:'/inicio.html'},document:{addEventListener(){}},localStorage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)}};authctx.window=authctx;vm.createContext(authctx);vm.runInContext(fs.readFileSync(base+'js/pmo-auth.js','utf8'),authctx);const A=authctx.PMOAuth;
for(const role of ['usuario','pmo','direccion','administrador'])assert.equal(A.homeForPermissions(A.defaultsForRole(role)),'inicio.html');
assert.equal(A.homeForPermissions({}),'login.html');A.cachePermissions({selfservice:'read'});assert.equal(A.canAccess('inicio.html'),true);assert.equal(A.canManage('selfservice'),false);assert.equal(A.canAccess('usuarios.html'),false);A.cachePermissions({});assert.equal(A.canAccess('inicio.html'),false);
console.log('PASS: KPIs, cancelados, vacíos, paginación 1201 filas, error de lectura, inicio por 4 roles y permisos de consulta.');
})();
