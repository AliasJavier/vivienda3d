/* =========================================================================
   Proyectos: varios planos guardados en el navegador, vista Plano / 3D,
   exportar e importar, DXF y arranque
   ========================================================================= */
let cur=null;            // {id, name, src, design, view}
let projList=[];
let view='3d';
let designLoaded=false;  // el estado del 3D corresponde al proyecto abierto

/* ---------- estado del diseño 3D (materiales, muebles, fotos) ---------- */
function serialize(){ return {v:1, materials:state.materials, furniture:state.furniture, photos:state.photos, collide:state.collide, exterior:state.exterior||{}}; }
function applyState(data){
  data=data||{};
  const mats={...defaultMaterials(),...(data.materials||{})};
  state={v:1,materials:mats,furniture:Array.isArray(data.furniture)?data.furniture.map(f=>({...f})):[],photos:Array.isArray(data.photos)?data.photos.map(p=>({...p})):[], collide:data.collide!==false, exterior:{...(data.exterior||{})}};
  state.photos=state.photos.filter(p=>localPhotos[p.ref]);
  state.furniture=state.furniture.filter(f=>f.type!=='model'||modelBufs[f.model]);
  Object.keys(state.materials).forEach(k=>{ const m=state.materials[k]; if(m.kind==='photo'&&!localPhotos[m.ref]){ const d=defaultMaterials()[k]; if(d) state.materials[k]=d; else delete state.materials[k]; } });
  $('collideIn').checked=state.collide;
  if(!state.materials[selSurf]) selSurf=PLAN.rooms[0]?'floor:'+PLAN.rooms[0].id:'walls:exterior';
  applyAllSurfaces(); renderAllFurniture(); buildExterior();
  if(selFurn && !state.furniture.some(f=>f.id===selFurn)) selFurn=null; updateSelBox();
  selectSurface(selSurf); renderFurnPanel();
}
async function loadAssets(design){
  for(const p of (design.photos||[])){ if(localPhotos[p.ref]) continue; const blob=await idbGet('photo:'+p.ref); if(blob) localPhotos[p.ref]=URL.createObjectURL(blob); }
  for(const k of Object.keys(design.materials||{})){ const m=design.materials[k]; if(m.kind==='photo'&&!localPhotos[m.ref]){ const b=await idbGet('photo:'+m.ref); if(b) localPhotos[m.ref]=URL.createObjectURL(b); } }
  for(const f of (design.furniture||[])) if(f.type==='model' && !modelBufs[f.model]){ const m=await idbGet('model:'+f.model); if(m) modelBufs[f.model]=m; }
}

/* ---------- guardado ---------- */
let saveTimer=null, storageOk=true;
function setStatus(s,txt){ const e=$('status'); e.dataset.s=s; e.querySelector('span').textContent=txt||{saved:'Guardado en este navegador',saving:'Guardando…',error:'No se pudo guardar',local:'Sin guardado: exporta el proyecto'}[s]; }
/* deshacer / rehacer en el 3D (muebles y materiales) */
const hist3={stack:[],redo:[],last:null,lock:false};
function hist3Reset(){ hist3.stack=[]; hist3.redo=[]; hist3.last=JSON.stringify(serialize()); }
function hist3Track(){ if(hist3.lock||view!=='3d'||!designLoaded) return; const snap=JSON.stringify(serialize()); if(snap===hist3.last) return;
  if(hist3.last){ hist3.stack.push(hist3.last); if(hist3.stack.length>60) hist3.stack.shift(); } hist3.redo=[]; hist3.last=snap; }
function hist3Go(back){ const from=back?hist3.stack:hist3.redo, to=back?hist3.redo:hist3.stack; if(!from.length||view!=='3d'||!designLoaded) return;
  to.push(hist3.last); hist3.last=from.pop(); hist3.lock=true;
  try{ applyState(JSON.parse(hist3.last)); } finally { hist3.lock=false; }
  saveSoon(); note(back?'Deshecho.':'Rehecho.'); }
addEventListener('keydown',e=>{ if(view!=='3d'||!(e.ctrlKey||e.metaKey)) return; if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||'')) return;
  const k=e.key.toLowerCase(); if(k==='z'){ e.preventDefault(); hist3Go(!e.shiftKey); } else if(k==='y'){ e.preventDefault(); hist3Go(false); } });
function saveSoon(){ if(!cur) return; hist3Track(); if(!storageOk){ setStatus('error','No se puede guardar aquí: usa Exportar'); return; } setStatus('saving'); clearTimeout(saveTimer); saveTimer=setTimeout(flush,600); }
function projectChanged(){ if(cur){ cur.dirtyPlan=true; saveSoon(); } }
async function flush(){
  if(!cur) return;
  if(Ed.src&&cur.src!==Ed.src&&Ed.ownerId===cur.id) cur.src=Ed.src;
  if(view==='3d'&&designLoaded) cur.design=JSON.parse(JSON.stringify(serialize()));
  try{
    await idbPut('proj:'+cur.id,{id:cur.id,name:cur.name,src:cur.src,design:cur.design,view});
    const meta=projList.find(p=>p.id===cur.id); if(meta){ Object.assign(meta,metaOf(cur)); await idbPut('projects',projList); }
    setStatus('saved');
  }catch(e){ console.error(e); storageOk=false; setStatus('error','No se puede guardar aquí: usa Exportar'); }
}
function metaOf(p){ const si=scaleInfo(p.src), S=si.S; let m2=0;
  if(S) p.src.rooms.forEach(r=>{ if(!r.terrace) m2+=r.m2>0?r.m2:P2.area(r.poly)/(S*S); });
  return {id:p.id,name:p.name,updated:Date.now(),m2:+m2.toFixed(2),walls:p.src.walls.length,rooms:p.src.rooms.length,thumb:thumbOf(p.src)}; }
function thumbOf(src){ const W=320,H=200,c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  x.fillStyle='#F4F5F2'; x.fillRect(0,0,W,H);
  const pts=[]; src.walls.forEach(w=>pts.push(w.a,w.b)); src.rooms.forEach(r=>pts.push(...r.poly));
  if(!pts.length) return null;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; pts.forEach(([a,b])=>{ x0=Math.min(x0,a);y0=Math.min(y0,b);x1=Math.max(x1,a);y1=Math.max(y1,b); });
  const s=Math.min((W-24)/(x1-x0||1),(H-24)/(y1-y0||1)), ox=(W-(x1-x0)*s)/2-x0*s, oy=(H-(y1-y0)*s)/2-y0*s;
  x.setTransform(s,0,0,s,ox,oy);
  src.rooms.forEach((r,i)=>{ x.beginPath(); r.poly.forEach((p,j)=>j?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.fillStyle=r.terrace?'#DCE3DA':`hsl(${(i*67+190)%360},45%,86%)`; x.fill(); });
  x.strokeStyle='#26302C'; x.lineCap='square'; src.walls.forEach(w=>{ x.lineWidth=Math.max(w.t,1.2/s); x.beginPath(); x.moveTo(w.a[0],w.a[1]); x.lineTo(w.b[0],w.b[1]); x.stroke(); });
  return c.toDataURL('image/png'); }

/* ---------- vistas ---------- */
function setView(v,opts={}){
  if(!cur) return;
  if(Ed.src&&Ed.ownerId===cur.id) cur.src=Ed.src;
  if(v==='3d'){ const plan=planFromSrc(cur.src);
    if(!plan||!plan.walls.length){ v='edit'; if(opts.explain!==false) edMsg('Para ver el 3D hace falta al menos un muro y la escala.'); }
    else {
      if(view==='3d'&&designLoaded) cur.design=JSON.parse(JSON.stringify(serialize()));
      hist3.lock=true; loadPlan(plan); applyState(cur.design); hist3.lock=false; designLoaded=true; hist3Reset(); cur.dirtyPlan=false;
      if(!plan.rooms.length) note('No hay estancias: sin ellas no hay suelos. Créalas en Plano › Estancia.');
    } }
  if(v==='edit'&&view==='3d'&&designLoaded) cur.design=JSON.parse(JSON.stringify(serialize()));
  const was=view; view=v;
  const is3=v==='3d';
  $('app').dataset.view=v;
  $('canvasHost').hidden=!is3; $('labels').hidden=!is3; $('tb3d').hidden=!is3; $('walkpad').hidden=!is3||cam.mode!=='walk';
  $('ed').hidden=is3; $('tbEd').hidden=is3;
  $('paneSurf').hidden=!is3||$('tabSurf').getAttribute('aria-selected')!=='true'; $('paneFurn').hidden=!is3||$('tabFurn').getAttribute('aria-selected')!=='true';
  $('tabs3d').hidden=!is3; $('filebar').hidden=!is3; $('paneEd').hidden=is3;
  $('vEdit').setAttribute('aria-pressed',!is3); $('v3d').setAttribute('aria-pressed',is3);
  if(is3){ resize(); if(opts.fit!==false&&(was!=='3d'||opts.fit)) { if(cam.mode!=='orbit') setMode('orbit'); const span=Math.max(maxX-minX,maxZ-minZ); cam.target.copy(CENTER); cam.radius=span*1.3; cam.theta=.28; cam.phi=.9; applyCam(); } updateHint(); }
  else { edResize(); if(opts.fitEd||!Ed.fitted){ edFit(); Ed.fitted=true; } edSetTool(Ed.tool||'select'); }
  saveSoon();
}
$('vEdit').onclick=()=>setView('edit'); $('v3d').onclick=()=>setView('3d'); $('ed3d').onclick=()=>setView('3d');

/* ---------- abrir / crear proyectos ---------- */
async function openProject(id){
  if(cur) await flush();
  const rec=await idbGet('proj:'+id); if(!rec){ showHome(); return; }
  designLoaded=false;
  const img=await idbGet('img:'+id);
  cur={id:rec.id,name:rec.name,src:normalizeSrc(rec.src),design:rec.design||{}};
  await loadAssets(cur.design);
  $('projName').textContent=cur.name; document.title=cur.name+' · Vivienda 3D';
  { const m=metaOf(cur).m2; $('totalM2').textContent=m?fmtN(m)+' m² útiles':''; }
  Ed.fitted=false; await edOpen(cur.src,img); Ed.ownerId=cur.id;
  hideHome(); try{ await idbPut('last',id); }catch(_){}
  selFurn=null;
  const want=rec.view||'3d';
  setView(planFromSrc(cur.src)&&cur.src.walls.length?want:'edit',{explain:false,fit:true,fitEd:true});
}
async function createProject({name,src,design,imgBlob,view='edit'}){
  const id=uid('p');
  const p={id,name:name||'Nuevo plano',src:normalizeSrc(src),design:design||{}};
  if(imgBlob) await idbPut('img:'+id,imgBlob);
  await idbPut('proj:'+id,{...p,view});
  projList.unshift(metaOf(p)); await idbPut('projects',projList);
  return id;
}
async function fileToPlanImage(file){
  const isPdf=/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name);
  let canvas;
  if(isPdf){
    if(!window.pdfjsLib){ await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload=res; s.onerror=()=>rej(new Error('pdfjs')); document.head.appendChild(s); });
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise, page=await pdf.getPage(1);
    const v1=page.getViewport({scale:1}), sc=Math.min(4,2400/Math.max(v1.width,v1.height)), vp=page.getViewport({scale:sc});
    canvas=document.createElement('canvas'); canvas.width=Math.round(vp.width); canvas.height=Math.round(vp.height);
    const x=canvas.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:x,viewport:vp}).promise;
  } else {
    const url=URL.createObjectURL(file);
    try{ const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
      const s=Math.min(1,3000/Math.max(img.naturalWidth,img.naturalHeight)); canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.naturalWidth*s)); canvas.height=Math.max(1,Math.round(img.naturalHeight*s));
      const x=canvas.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,canvas.width,canvas.height); x.drawImage(img,0,0,canvas.width,canvas.height);
    } finally { URL.revokeObjectURL(url); }
  }
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
  return {blob,w:canvas.width,h:canvas.height};
}
async function newFromFile(file){
  const m=$('homeMsg'); m.textContent='Preparando el plano…'; m.classList.add('ok');
  try{
    const {blob,w,h}=await fileToPlanImage(file);
    const name=(file.name||'Plano').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,40)||'Plano';
    const id=await createProject({name,src:emptySrc(w,h),imgBlob:blob});
    m.textContent=''; await openProject(id); edSetTool('select');
    await edDetect();
  }catch(e){ console.error(e); m.classList.remove('ok');
    m.textContent=/pdfjs/.test(e&&e.message)?'Para abrir PDF hace falta conexión a internet (se usa pdf.js). Prueba con una imagen PNG o JPG.':'No se pudo abrir ese archivo. Usa una imagen (PNG, JPG) o un PDF.'; }
}

/* ---------- pantalla de proyectos ---------- */
function showHome(){ renderHome(); $('home').hidden=false; }
function hideHome(){ $('home').hidden=true; }
$('homeBtn').onclick=async()=>{ await flush(); showHome(); };
$('homeClose').onclick=()=>{ if(cur) hideHome(); };
function renderHome(){
  const g=$('homeList'); g.innerHTML=''; $('homeClose').hidden=!cur;
  projList.forEach(p=>{ const card=document.createElement('article'); card.className='pcard'; if(cur&&cur.id===p.id) card.classList.add('current');
    const d=new Date(p.updated||Date.now());
    card.innerHTML=`<button class="pthumb" aria-label="Abrir ${esc(p.name)}">${p.thumb?`<img alt="" src="${p.thumb}">`:'<span>Sin muros todavía</span>'}</button>
      <div class="pinfo"><input class="pname" value="${esc(p.name)}" maxlength="50" aria-label="Nombre del proyecto">
      <small>${p.m2?fmtN(p.m2)+' m² útiles · ':''}${p.rooms||0} estancias · ${d.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</small></div>
      <div class="pact"><button class="btn primary" data-a="open">Abrir</button><button class="btn" data-a="dup">Duplicar</button><button class="btn" data-a="exp">Exportar</button><button class="btn danger" data-a="del">Eliminar</button></div>`;
    card.querySelector('.pthumb').onclick=()=>openProject(p.id);
    card.querySelector('[data-a=open]').onclick=()=>openProject(p.id);
    card.querySelector('[data-a=dup]').onclick=()=>dupProject(p.id);
    card.querySelector('[data-a=exp]').onclick=()=>exportProject(p.id);
    const del=card.querySelector('[data-a=del]');
    del.onclick=()=>{ if(!del.dataset.c){ del.dataset.c='1'; del.textContent='¿Seguro? Pulsa otra vez'; setTimeout(()=>{ if(del.isConnected){ delete del.dataset.c; del.textContent='Eliminar'; } },3500); return; } deleteProject(p.id); };
    const nm=card.querySelector('.pname');
    nm.addEventListener('change',()=>renameProject(p.id,nm.value.trim()||p.name));
    nm.addEventListener('keydown',e=>{ if(e.key==='Enter') nm.blur(); });
    g.appendChild(card); });
  $('homeEmpty').hidden=projList.length>0;
}
async function renameProject(id,name){ const meta=projList.find(p=>p.id===id); if(!meta) return; meta.name=name;
  const rec=await idbGet('proj:'+id); if(rec){ rec.name=name; await idbPut('proj:'+id,rec); }
  if(cur&&cur.id===id){ cur.name=name; $('projName').textContent=name; document.title=name+' · Vivienda 3D'; }
  await idbPut('projects',projList); }
async function dupProject(id){ if(cur&&cur.id===id) await flush(); const rec=await idbGet('proj:'+id), img=await idbGet('img:'+id); if(!rec) return;
  await createProject({name:rec.name+' (copia)',src:JSON.parse(JSON.stringify(rec.src)),design:JSON.parse(JSON.stringify(rec.design||{})),imgBlob:img}); renderHome(); }
async function deleteProject(id){
  const rec=await idbGet('proj:'+id);
  projList=projList.filter(p=>p.id!==id); await idbPut('projects',projList);
  await idbDel('proj:'+id); await idbDel('img:'+id).catch(()=>{});
  // borra fotos y modelos que ya no usa ningún proyecto
  if(rec&&rec.design){ const used=new Set(); for(const p of projList){ const r=await idbGet('proj:'+p.id); refsOf(r&&r.design).forEach(x=>used.add(x)); }
    for(const ref of refsOf(rec.design)) if(!used.has(ref)) await idbDel((ref.startsWith('m_')?'model:':'photo:')+ref).catch(()=>{}); }
  if(cur&&cur.id===id){ cur=null; designLoaded=false; $('projName').textContent=''; }
  renderHome();
}
function refsOf(d){ const s=new Set(); if(!d) return s; (d.photos||[]).forEach(p=>s.add(p.ref)); Object.values(d.materials||{}).forEach(m=>m.kind==='photo'&&s.add(m.ref)); (d.furniture||[]).forEach(f=>f.type==='model'&&s.add(f.model)); return s; }
$('homeFile').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) newFromFile(f); });
$('homeImp').addEventListener('change',async e=>{ const f=e.target.files[0]; e.target.value=''; if(f) importFile(f,true); });

/* ---------- exportar / importar ---------- */
async function exportProject(id){
  try{
    let rec;
    if(cur&&cur.id===id){ await flush(); rec={name:cur.name,src:cur.src,design:cur.design}; } else rec=await idbGet('proj:'+id);
    const design=rec.design||{}, photos={}, models={};
    for(const ref of refsOf(design)){
      if(ref.startsWith('m_')){ const m=modelBufs[ref]||await idbGet('model:'+ref); if(m) models[ref]={ext:m.ext,name:m.name,data:await blobToDataURL(new Blob([m.buf],{type:'application/octet-stream'}))}; }
      else { const b=localPhotos[ref]?await (await fetch(localPhotos[ref])).blob():await idbGet('photo:'+ref); if(b) photos[ref]=await blobToDataURL(b); } }
    const img=await idbGet('img:'+id);
    const doc={app:'vivienda3d',kind:'project',version:2,exportedAt:new Date().toISOString(),name:rec.name,src:rec.src,design,image:img?await blobToDataURL(img):null,photos,models};
    download(new Blob([JSON.stringify(doc)],{type:'application/json'}),`${slug(rec.name)}-${today()}.json`);
    fileMsg(`Exportado "${rec.name}" con ${(design.furniture||[]).length} muebles, ${Object.keys(photos).length} fotos y ${Object.keys(models).length} modelos 3D.`,true);
  }catch(e){ console.error(e); fileMsg('No se pudo exportar el proyecto.'); }
}
async function importAssets(doc){
  for(const [ref,url] of Object.entries(doc.photos||{})){ if(typeof url!=='string'||!url.startsWith('data:image/')) continue;
    const blob=await dataURLToBlob(url); if(localPhotos[ref]) URL.revokeObjectURL(localPhotos[ref]); localPhotos[ref]=URL.createObjectURL(blob); delete photoCache[ref];
    try{ await idbPut('photo:'+ref,blob); }catch(_){} }
  for(const [ref,m] of Object.entries(doc.models||{})){ if(!m||typeof m.data!=='string'||!['glb','gltf','obj'].includes(m.ext)) continue;
    const buf=await (await dataURLToBlob(m.data)).arrayBuffer(); modelBufs[ref]={buf,ext:m.ext,name:m.name||'Modelo'}; delete modelParsed[ref];
    Object.keys(modelTpl).forEach(k=>k.startsWith(ref+'|')&&delete modelTpl[k]); try{ await idbPut('model:'+ref,modelBufs[ref]); }catch(_){} }
}
async function importProjectDoc(doc){
  await importAssets(doc);
  const img=doc.image?await dataURLToBlob(doc.image):null;
  return createProject({name:doc.name||'Proyecto importado',src:doc.src,design:doc.design,imgBlob:img,view:'3d'});
}
async function importFile(f,fromHome){
  const msg=fromHome?(t,ok)=>{ const m=$('homeMsg'); m.textContent=t; m.classList.toggle('ok',!!ok); }:fileMsg;
  try{
    const doc=JSON.parse(await f.text());
    if(doc&&doc.kind==='project'&&doc.src){ const id=await importProjectDoc(doc); msg(`Importado "${doc.name}".`,true); await openProject(id); return; }
    if(doc&&doc.app===APP_ID&&doc.design){   // diseño de la versión anterior: se aplica al proyecto abierto
      if(!cur){ msg('Abre primero el proyecto al que pertenece ese diseño.'); return; }
      await importAssets(doc); cur.design=doc.design; if(view==='3d'&&designLoaded){ applyState(doc.design); } saveSoon();
      msg(`Diseño importado en "${cur.name}": ${(doc.design.furniture||[]).length} muebles.`,true); return; }
    msg('Ese archivo no es un proyecto exportado desde aquí.');
  }catch(err){ console.error(err); msg('No se pudo leer el archivo. ¿Es un .json exportado desde aquí?'); }
}
/* abre un proyecto exportado que esté servido junto a la app: index.html?p=proyectos/mi-casa.json
   (así se lleva un proyecto a las gafas sin tener que subir el archivo desde ellas) */
async function openFromURL(){
  const p=new URLSearchParams(location.search).get('p'); if(!p) return false;
  try{
    const r=await fetch(p,{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status);
    const doc=await r.json(); if(!(doc&&doc.kind==='project'&&doc.src)) throw new Error('formato');
    const key='url:'+p+'|'+(doc.exportedAt||''), known=await idbGet(key);
    if(known&&projList.some(x=>x.id===known)){ await openProject(known); return true; }
    const id=await importProjectDoc(doc); await idbPut(key,id); await openProject(id); return true;
  }catch(e){ console.error(e); showHome(); const m=$('homeMsg'); m.classList.remove('ok'); m.textContent=`No se pudo abrir el proyecto "${p}". Comprueba que el archivo está en esa ruta.`; return true; }
}
function fileMsg(t,ok){ const m=$('fileMsg'); m.textContent=t; m.classList.toggle('ok',!!ok); clearTimeout(fileMsg.t); fileMsg.t=setTimeout(()=>m.textContent='',5000); }
$('expBtn').onclick=()=>cur&&exportProject(cur.id);
$('impIn').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) importFile(f,false); });
$('dxfBtn').onclick=()=>{ if(!cur) return; const plan=planFromSrc(cur.src); if(!plan){ fileMsg('Falta la escala para generar el DXF.'); return; }
  download(new Blob([planToDXF(plan)],{type:'application/dxf'}),`${slug(cur.name)}.dxf`); fileMsg('DXF descargado (metros, capas por elemento).',true); };

/* ---------- arranque ---------- */
async function boot(){
  updateHint();
  applyCam(); renderer.setAnimationLoop(loop);
  try{
    projList=(await idbGet('projects'))||null;
    if(!projList){   // primera vez: crea el proyecto de ejemplo y recupera lo guardado por la versión anterior
      projList=[];
      const old=await idbGet('state');
      let img=null; if(SEED.image){ try{ const r=await fetch(SEED.image); if(r.ok) img=await r.blob(); }catch(_){} }
      const src=JSON.parse(JSON.stringify(SEED.src));
      const id=await createProject({name:SEED.name,src,design:old||{furniture:sampleFurniture()},imgBlob:img});
      const rec=await idbGet('proj:'+id); rec.view='3d'; await idbPut('proj:'+id,rec);
    }
    const last=await idbGet('last');
    if(await openFromURL()){ /* proyecto indicado en la dirección */ }
    else if(last&&projList.some(p=>p.id===last)) await openProject(last);
    else if(projList.length) await openProject(projList[0].id);
    else showHome();
  }catch(e){ console.error(e); storageOk=false; setStatus('local');
    // sin almacenamiento: trabaja en memoria con el ejemplo
    cur={id:'mem',name:SEED.name,src:normalizeSrc(JSON.parse(JSON.stringify(SEED.src))),design:{furniture:sampleFurniture()}};
    $('projName').textContent=cur.name; await edOpen(cur.src,null); setView('3d',{fit:true}); }
}
boot();
// acceso para depurar desde la consola del navegador
window.__vivienda={Ed,get project(){return cur;},planFromSrc,scaleInfo,floorMeshes,get plan(){return PLAN;},get state(){return state;}};
Object.assign(window.__vivienda,{VR,vr:{head:()=>vrHead(),yaw:()=>rig.rotation.y,room:()=>{ const h=vrHead(); return roomAt(h.x,h.z); },blocked:()=>{ const h=vrHead(); return walkBlocked(h.x,h.z); },marker:()=>vrMarker.visible,camFree:()=>camera.parent===null}});
Object.assign(window.__vivienda,{cam,applyCam,setMode,EXT,renderer});
