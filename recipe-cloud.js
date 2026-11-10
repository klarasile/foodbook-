/* FOODBOK — wspólne przepisy w Supabase, bez zmiany obecnej synchronizacji kalorii.
 * Wymaga: sync-config.js i zalogowania do konta rodzinnego.
 */
(()=>{
'use strict';
const cfg=window.FOODBOK_SYNC_CONFIG||{};
const status=document.getElementById('recipeSyncStatus');
const url=(cfg.url||'').replace(/\/$/,'');
const valid=/^https:\/\/[^/]+\.supabase\.co$/.test(url)&&typeof cfg.key==='string'&&cfg.key.length>10;
const storageKey=valid?'sb-'+new URL(url).hostname.split('.')[0]+'-auth-token':'';
const opsKey='fb_recipe_pending_v1';
const deletedKey='fb_recipe_deleted_v1';
let busy=false,lastUser='',lastRun=0;
const note=(s,err=false)=>{if(status){status.textContent='☁️ Przepisy: '+s;status.style.color=err?'#a52f55':'#8b6478'}};
const read=(k,def)=>{try{return JSON.parse(localStorage.getItem(k))??def}catch{return def}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){note('brak miejsca na zapis lokalny.',true)}};
const safeRecipe=r=>r&&typeof r==='object'&&/^extra_[a-zA-Z0-9_-]+$/.test(r.id||'')&&typeof r.name==='string'&&r.name.length>0&&r.name.length<200&&Array.isArray(r.ing)&&Array.isArray(r.macro)&&r.macro.length===2&&r.macro.every(x=>Array.isArray(x)&&x.length===4);
function session(){
  if(!valid)return null;
  const s=read(storageKey,null);
  if(!s||typeof s.access_token!=='string'||!s.user?.id)return null;
  return {token:s.access_token,uid:s.user.id};
}
async function api(method,path,token,body){
  const h={'apikey':cfg.key,'Authorization':'Bearer '+token};
  if(body!==undefined){h['Content-Type']='application/json';h['Prefer']='resolution=merge-duplicates,return=minimal'}
  const res=await fetch(url+'/rest/v1/'+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  if(!res.ok){let m='HTTP '+res.status;try{const x=await res.json();m=x.message||x.msg||m}catch{}throw new Error(m)}
  return method==='GET'?res.json():null;
}
const table='foodbok_recipes?on_conflict=user_id,id';
async function upsert(auth,id,r,deleted){
  await api('POST',table,auth.token,[{user_id:auth.uid,id,recipe:deleted?{}:r,deleted,updated_at:new Date().toISOString()}]);
}
function merge(remote){
  const map=new Map(extras.filter(safeRecipe).map(r=>[r.id,r]));
  const tomb=new Set(read(deletedKey,[]));
  for(const row of remote){
    if(!/^extra_[a-zA-Z0-9_-]+$/.test(row.id||''))continue;
    if(row.deleted){map.delete(row.id);tomb.add(row.id)}
    else if(safeRecipe(row.recipe)){map.set(row.id,row.recipe);tomb.delete(row.id)}
  }
  const newer=[...map.values()];
  if(JSON.stringify(extras)!==JSON.stringify(newer)){
    extras=newer;
    put('fb_extra',extras);
    if(typeof render==='function')render();
  }
  put(deletedKey,[...tomb]);
}
async function sync(){
  if(busy||document.hidden)return;
  const auth=session();
  if(!auth){note(valid?'zaloguj się do konta rodzinnego.':'brak konfiguracji Supabase.',!valid);return}
  busy=true;
  try{
    let pending=read(opsKey,[]);
    if(!Array.isArray(pending))pending=[];
    for(const op of pending){
      await upsert(auth,op.id,op.recipe||{},!!op.deleted);
      const left=read(opsKey,[]).filter(x=>!(x.id===op.id&&x.stamp===op.stamp));
      put(opsKey,left);
    }
    const rows=await api('GET','foodbok_recipes?select=id,recipe,deleted&order=updated_at.asc&limit=1000',auth.token);
    const remoteIds=new Set(rows.map(x=>x.id));
    const tomb=new Set(read(deletedKey,[]));
    // Migracja przepisów już zapisanych wcześniej na telefonie.
    for(const r of extras.filter(safeRecipe)){
      if(!remoteIds.has(r.id)&&!tomb.has(r.id)){
        await upsert(auth,r.id,r,false);
        remoteIds.add(r.id);
        rows.push({id:r.id,recipe:r,deleted:false});
      }
    }
    merge(rows);
    lastUser=auth.uid;lastRun=Date.now();
    note('zsynchronizowano '+rows.filter(x=>!x.deleted).length+' własnych przepisów.');
  }catch(e){note('nie udało się połączyć: '+e.message+'. Spróbujemy ponownie.',true)}finally{busy=false}
}
function enqueue(id,recipe,deleted){
  const list=read(opsKey,[]).filter(x=>x.id!==id);
  list.push({id,recipe,deleted,stamp:Date.now()});
  put(opsKey,list);
  note('zapisuję zmiany w chmurze…');
  setTimeout(sync,200);
}
window.foodbokRecipeAdded=r=>{if(safeRecipe(r))enqueue(r.id,r,false)};
window.foodbokRecipeRemoved=id=>{
  if(!/^extra_[a-zA-Z0-9_-]+$/.test(id||''))return;
  const tomb=new Set(read(deletedKey,[]));tomb.add(id);put(deletedKey,[...tomb]);
  enqueue(id,{},true);
};
if(!valid){note('brak konfiguracji Supabase.',true);return}
setTimeout(sync,1000);
setInterval(()=>{
  const s=session();
  if(!s){if(lastUser){lastUser='';note('zaloguj się do konta rodzinnego.')}return}
  if(s.uid!==lastUser||Date.now()-lastRun>25000)sync();
},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
window.addEventListener('focus',sync);
})();
