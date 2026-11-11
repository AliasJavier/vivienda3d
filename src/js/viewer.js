/* =========================================================================
   Texturas de catálogo (dibujadas en canvas; tamaño real en metros)
   ========================================================================= */
function cnv(n){ const c=document.createElement('canvas'); c.width=c.height=n; return c; }
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function grain(x,s,amt,seed){ const r=rng(seed), d=x.getImageData(0,0,s,s);
  for(let i=0;i<d.data.length;i+=4){ const n=(r()-.5)*amt; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0); }
function planks(base, dark, seed, rows){ return c=>{ const x=c.getContext('2d'), s=c.width, r=rng(seed), h=s/rows;
  x.fillStyle=base; x.fillRect(0,0,s,s);
  for(let i=0;i<rows;i++){ const y=i*h, off=(i%3)*s/3;
    { const v=r()<.5?0:255; x.fillStyle=`rgba(${v},${v},${v},${.03+r()*.05})`; } x.fillRect(0,y,s,h);
    for(let g=0;g<14;g++){ x.strokeStyle=dark.replace('A',(.10+r()*.12).toFixed(2)); x.lineWidth=.8+r(); const y0=y+r()*h;
      x.beginPath(); x.moveTo(0,y0); x.bezierCurveTo(s*.3,y0+(r()-.5)*6,s*.6,y0+(r()-.5)*6,s,y0+(r()-.5)*4); x.stroke(); }
    x.fillStyle=dark.replace('A','.55'); x.fillRect(0,y,s,1.5);
    [off, off+s*.66].forEach(px=>x.fillRect(px%s,y,1.5,h)); }
  grain(x,s,10,seed); }; }
function tiles(base, joint, n, seed, vein){ return c=>{ const x=c.getContext('2d'), s=c.width, r=rng(seed), t=s/n;
  x.fillStyle=base; x.fillRect(0,0,s,s); grain(x,s,14,seed);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ x.fillStyle=`rgba(0,0,0,${r()*.05})`; x.fillRect(i*t,j*t,t,t); }
  if(vein){ for(let k=0;k<9;k++){ x.strokeStyle=`rgba(120,118,112,${.12+r()*.2})`; x.lineWidth=.6+r()*1.4; x.beginPath();
    let px=r()*s,py=0; x.moveTo(px,py); for(let q=0;q<6;q++){ px+=(r()-.5)*s*.35; py+=s/6; x.lineTo(px,py);} x.stroke(); } }
  x.strokeStyle=joint; x.lineWidth=Math.max(2,s/170);
  for(let i=0;i<=n;i++){ x.beginPath(); x.moveTo(i*t,0); x.lineTo(i*t,s); x.stroke(); x.beginPath(); x.moveTo(0,i*t); x.lineTo(s,i*t); x.stroke(); } }; }
function subway(base, joint){ return c=>{ const x=c.getContext('2d'), s=c.width, rows=8, h=s/rows, w=s/4;
  x.fillStyle=base; x.fillRect(0,0,s,s); grain(x,s,8,7); x.strokeStyle=joint; x.lineWidth=3;
  for(let r=0;r<rows;r++){ const y=r*h, off=r%2?w/2:0; x.beginPath(); x.moveTo(0,y); x.lineTo(s,y); x.stroke();
    for(let k=-1;k<=4;k++){ x.beginPath(); x.moveTo(k*w+off,y); x.lineTo(k*w+off,y+h); x.stroke(); }
    x.fillStyle='rgba(255,255,255,.18)'; for(let k=-1;k<=4;k++) x.fillRect(k*w+off+4,y+4,w-8,3); } }; }
function hydraulic(c){ const x=c.getContext('2d'), s=c.width, n=2, t=s/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const ox=i*t, oy=j*t;
    x.fillStyle='#E7E1D4'; x.fillRect(ox,oy,t,t);
    x.fillStyle='#3F5E6E'; x.beginPath(); x.moveTo(ox+t/2,oy+t*.08); x.lineTo(ox+t*.92,oy+t/2); x.lineTo(ox+t/2,oy+t*.92); x.lineTo(ox+t*.08,oy+t/2); x.closePath(); x.fill();
    x.fillStyle='#E7E1D4'; x.beginPath(); x.arc(ox+t/2,oy+t/2,t*.22,0,Math.PI*2); x.fill();
    x.fillStyle='#B06B45'; x.beginPath(); x.arc(ox+t/2,oy+t/2,t*.1,0,Math.PI*2); x.fill();
    ['#B06B45'].forEach(col=>{ x.fillStyle=col; [[0,0],[t,0],[0,t],[t,t]].forEach(([a,b])=>{ x.beginPath(); x.arc(ox+a,oy+b,t*.14,0,Math.PI*2); x.fill(); }); });
    x.strokeStyle='rgba(0,0,0,.25)'; x.lineWidth=2; x.strokeRect(ox,oy,t,t); }
  grain(x,s,10,3); }
function flat(base, amt, seed){ return c=>{ const x=c.getContext('2d'), s=c.width; x.fillStyle=base; x.fillRect(0,0,s,s); grain(x,s,amt,seed||1);
  if(amt>18){ const r=rng(seed||1); for(let k=0;k<40;k++){ x.fillStyle=`rgba(0,0,0,${r()*.06})`; x.beginPath(); x.arc(r()*s,r()*s,r()*s*.12,0,Math.PI*2); x.fill(); } } }; }
function brick(c){ const x=c.getContext('2d'), s=c.width, r=rng(9), rows=8, h=s/rows, w=s/3;
  x.fillStyle='#D9D2C5'; x.fillRect(0,0,s,s);
  for(let i=0;i<rows;i++){ const off=i%2?w/2:0; for(let k=-1;k<=3;k++){ const v=r();
    x.fillStyle=`rgb(${150+v*40|0},${78+v*25|0},${58+v*18|0})`; x.fillRect(k*w+off+3,i*h+3,w-6,h-6);} }
  grain(x,s,16,9); }
function slats(c){ const x=c.getContext('2d'), s=c.width, n=10, w=s/n, r=rng(4);
  x.fillStyle='#2E2A25'; x.fillRect(0,0,s,s);
  for(let i=0;i<n;i++){ const v=r(); x.fillStyle=`rgb(${160+v*30|0},${118+v*22|0},${80+v*15|0})`; x.fillRect(i*w+3,0,w-6,s); }
  grain(x,s,12,4); }

const PRESETS = {
  // suelos
  roble:      {n:'Roble',            size:1.2, kind:'floor', f:planks('#C39A68','rgba(90,55,25,A)',11,6)},
  nogal:      {n:'Nogal',            size:1.2, kind:'floor', f:planks('#7A5237','rgba(40,22,10,A)',12,6)},
  porcelanico:{n:'Porcelánico gris', size:1.2, kind:'floor', f:tiles('#BDBAB3','#9C998F',2,21,false)},
  blanca:     {n:'Baldosa blanca',   size:0.9, kind:'floor', f:tiles('#EDEBE6','#C8C4BB',2,22,false)},
  marmol:     {n:'Mármol',           size:1.2, kind:'floor', f:tiles('#EFEDE8','#D0CCC4',2,23,true)},
  hidraulica: {n:'Hidráulica',       size:0.4, kind:'floor', f:hydraulic},
  microcem:   {n:'Microcemento',     size:2.0, kind:'both',  f:flat('#A9A59C',22,5)},
  moqueta:    {n:'Moqueta',          size:1.0, kind:'floor', f:flat('#8C7B6C',30,6)},
  tarima_ext: {n:'Tarima exterior',  size:1.0, kind:'floor', f:planks('#8A7A66','rgba(35,25,15,A)',13,5)},
  // paredes
  blanco:     {n:'Blanco',           size:1.5, kind:'wall',  f:flat('#F0EEE8',8,31)},
  arena:      {n:'Arena',            size:1.5, kind:'wall',  f:flat('#DDCFB6',8,32)},
  salvia:     {n:'Verde salvia',     size:1.5, kind:'wall',  f:flat('#B7C3B0',8,33)},
  azul:       {n:'Azul grisáceo',    size:1.5, kind:'wall',  f:flat('#AFBFCC',8,34)},
  terracota:  {n:'Teja suave',       size:1.5, kind:'wall',  f:flat('#CFA28A',8,35)},
  metro:      {n:'Azulejo metro',    size:0.6, kind:'wall',  f:subway('#F2F1EC','#CBC7BE')},
  metro_verde:{n:'Metro verde',      size:0.6, kind:'wall',  f:subway('#6F8C7A','#DAD6CC')},
  ladrillo:   {n:'Ladrillo visto',   size:0.75,kind:'wall',  f:brick},
  listones:   {n:'Listones madera',  size:1.0, kind:'wall',  f:slats},
  fachada:    {n:'Fachada',          size:2.0, kind:'wall',  f:flat('#CFCAC0',14,36)},
};
const presetCanvas = {}, presetTex = {};
function presetBase(key){
  if(!presetTex[key]){ const c=cnv(512); PRESETS[key].f(c); presetCanvas[key]=c;
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; presetTex[key]=t; }
  return presetTex[key];
}
const thumbCache={};
function presetThumb(key){ if(!thumbCache[key]){ presetBase(key); const c=cnv(96); c.getContext('2d').drawImage(presetCanvas[key],0,0,96,96); thumbCache[key]=c.toDataURL('image/jpeg',.85); } return thumbCache[key]; }

/* =========================================================================
   Estado (lo que se guarda)
   ========================================================================= */
const FLOOR_MAP = {wood:'roble', tile:'porcelanico', marble:'marmol', outdoor:'tarima_ext'};
let PLAN = {rooms:[],walls:[],closets:[],H_INT:2.6,H_DOOR:2.1};
let ROOM = {};
const isBath = r => /bañ|bano|aseo|\bwc\b/i.test((r.label||'')+' '+r.id);
function defaultMaterials(){
  const m={};
  PLAN.rooms.forEach(r=>{
    const fk=FLOOR_MAP[r.floor]||'roble'; m['floor:'+r.id]={kind:'preset',key:fk,size:PRESETS[fk].size};
    const wk=r.terrace?'fachada':(isBath(r)?'metro':'blanco'); m['walls:'+r.id]={kind:'preset',key:wk,size:PRESETS[wk].size};
  });
  m['walls:exterior']={kind:'preset',key:'fachada',size:2};
  return m;
}
const IKEA_ITEMS = [
  // sofás y sillones
  {type:'sofa', name:'KIVIK sofá 3 plazas', w:228,d:95,h:83,color:'#C9BFAE'},
  {type:'sofa', name:'SÖDERHAMN sofá 3 plazas', w:198,d:99,h:83,color:'#B9A48C'},
  {type:'sofa', name:'EKTORP sofá 3 plazas', w:218,d:88,h:88,color:'#D8D0C0'},
  {type:'chaise',name:'FRIHETEN sofá cama chaiselongue', w:230,d:151,h:86,color:'#55595E'},
  {type:'sofa', name:'POÄNG sillón', w:68,d:82,h:100,color:'#D9CDB5'},
  {type:'sofa', name:'STRANDMON sillón orejero', w:82,d:96,h:101,color:'#5C6165'},
  // mesas y TV
  {type:'table',name:'LACK mesa de centro 90×55', w:90,d:55,h:45,color:'#F2F1EC'},
  {type:'table',name:'LACK mesa de centro 118×78', w:118,d:78,h:45,color:'#F2F1EC'},
  {type:'tv',   name:'LACK mueble TV 120', w:120,d:35,h:36,color:'#F2F1EC'},
  {type:'tv',   name:'LACK mueble TV 160', w:160,d:35,h:36,color:'#F2F1EC'},
  {type:'tv',   name:'BESTÅ mueble TV 180', w:180,d:42,h:38,color:'#F2F1EC'},
  {type:'tv',   name:'HEMNES mueble TV', w:148,d:47,h:57,color:'#EDE8DF'},
  // almacenaje
  {type:'shelf', name:'BILLY librería', w:80,d:28,h:202,color:'#F2F1EC'},
  {type:'kallax',name:'KALLAX 2×2', w:77,d:39,h:77,color:'#F2F1EC'},
  {type:'kallax',name:'KALLAX 2×4', w:77,d:39,h:147,color:'#F2F1EC'},
  {type:'kallax',name:'KALLAX 3×4', w:112,d:39,h:147,color:'#F2F1EC'},
  {type:'kallax',name:'KALLAX 4×4', w:147,d:39,h:147,color:'#F2F1EC'},
  {type:'wardrobe',name:'PAX armario 100', w:100,d:60,h:236,color:'#F2F1EC'},
  {type:'wardrobe',name:'PAX armario 150', w:150,d:60,h:236,color:'#F2F1EC'},
  {type:'wardrobe',name:'PAX armario 200', w:200,d:60,h:236,color:'#F2F1EC'},
  // dormitorio
  {type:'bed',  name:'MALM cama 90×200', w:105,d:209,h:100,color:'#F2F1EC'},
  {type:'bed',  name:'MALM cama 140×200', w:156,d:209,h:100,color:'#F2F1EC'},
  {type:'bed',  name:'MALM cama 160×200', w:176,d:209,h:100,color:'#F2F1EC'},
  {type:'bed',  name:'BRIMNES cama con cajones 140×200', w:146,d:206,h:47,color:'#F2F1EC'},
  {type:'drawers',name:'MALM mesita 2 cajones', w:40,d:48,h:55,color:'#F2F1EC'},
  {type:'drawers',name:'HEMNES mesita de noche', w:46,d:35,h:70,color:'#EDE8DF'},
  {type:'drawers',name:'MALM cómoda 6 cajones', w:160,d:48,h:78,color:'#F2F1EC'},
  {type:'drawers',name:'HEMNES cómoda 8 cajones', w:160,d:50,h:96,color:'#EDE8DF'},
  // comedor y trabajo
  {type:'table',name:'EKEDALEN mesa extensible (cerrada)', w:120,d:80,h:75,color:'#F2F1EC'},
  {type:'table',name:'EKEDALEN mesa extensible (abierta)', w:180,d:80,h:75,color:'#F2F1EC'},
  {type:'chair',name:'ADDE silla', w:39,d:47,h:77,color:'#2B2B2B'},
  {type:'table',name:'MICKE escritorio', w:105,d:50,h:75,color:'#F2F1EC'},
];
const CATALOG = [
  {group:'Salón', items:[
    {type:'sofa', name:'Sofá 3 plazas', w:210,d:90,h:85,color:'#6E7B8C'},
    {type:'sofa', name:'Sofá 2 plazas', w:160,d:90,h:85,color:'#6E7B8C'},
    {type:'sofa', name:'Sillón', w:85,d:85,h:85,color:'#9A6F58'},
    {type:'table',name:'Mesa de centro', w:100,d:60,h:42,color:'#9C7A55'},
    {type:'tv',   name:'Mueble TV', w:180,d:40,h:50,color:'#D9D3C7'},
    {type:'shelf',name:'Estantería', w:80,d:30,h:190,color:'#B08A62'},
    {type:'rug',  name:'Alfombra', w:200,d:300,h:1,color:'#B3A792'},
  ]},
  {group:'Comedor', items:[
    {type:'table',name:'Mesa comedor', w:160,d:90,h:75,color:'#9C7A55'},
    {type:'table',name:'Mesa redonda Ø110', w:110,d:110,h:75,color:'#9C7A55'},
    {type:'chair',name:'Silla', w:45,d:50,h:90,color:'#4E4E4E'},
  ]},
  {group:'Dormitorio', items:[
    {type:'bed',  name:'Cama 150', w:150,d:200,h:110,color:'#8B6F55'},
    {type:'bed',  name:'Cama 135', w:135,d:190,h:110,color:'#8B6F55'},
    {type:'bed',  name:'Cama 90', w:90,d:190,h:95,color:'#8B6F55'},
    {type:'drawers',name:'Mesita de noche', w:45,d:40,h:50,color:'#C9B79C'},
    {type:'drawers',name:'Cómoda', w:100,d:50,h:80,color:'#C9B79C'},
    {type:'wardrobe',name:'Armario', w:100,d:60,h:220,color:'#E4DFD4'},
    {type:'table',name:'Escritorio', w:120,d:60,h:75,color:'#B08A62'},
  ]},
  {group:'IKEA', ikea:true, items:IKEA_ITEMS},
  {group:'Cocina y baño', items:[
    {type:'fridge', name:'Frigorífico', w:60,d:65,h:185,color:'#E6E6E3'},
    {type:'washer', name:'Lavadora', w:60,d:60,h:85,color:'#F0F0EE'},
    {type:'box',    name:'Isla / módulo', w:120,d:60,h:90,color:'#D9D3C7'},
  ]},
];
const COLORS = ['#E4DFD4','#C9B79C','#9C7A55','#6B4E37','#6E7B8C','#3F5E6E','#7C8F6E','#A8492A','#4E4E4E','#F4F4F2'];
function sampleFurniture(){
  // ejemplos colocados como en el dibujo del plano
  return [
    {id:'ej1',type:'sofa', name:'Sofá 3 plazas', w:210,d:85,h:85, x:3.39,z:3.50,rot:90,color:'#6E7B8C'},
    {id:'ej2',type:'table',name:'Mesa comedor',  w:150,d:80,h:75, x:5.12,z:1.61,rot:0, color:'#9C7A55'},
    {id:'ej3',type:'bed',  name:'Cama 135',      w:135,d:190,h:110,x:8.15,z:5.72,rot:-90,color:'#8B6F55'},
    {id:'ej4',type:'bed',  name:'Cama 150',      w:150,d:190,h:110,x:10.95,z:5.26,rot:-135,color:'#8B6F55'},
  ];
}
let state = {v:1, materials:{}, furniture:[], photos:[], collide:true};

/* =========================================================================
   Escena
   ========================================================================= */
const host=$('canvasHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
host.appendChild(renderer.domElement); renderer.domElement.tabIndex=0;
const MAX_ANISO=renderer.capabilities.getMaxAnisotropy();
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,1,.05,300);
scene.add(new THREE.HemisphereLight(0xdfe8ff,0x3b3530,.75));
const sun=new THREE.DirectionalLight(0xfff2e0,1.05); sun.position.set(3,22,14); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:60}); sun.shadow.bias=-.0012;
scene.add(sun); scene.add(sun.target);
const fillL=new THREE.DirectionalLight(0xdfe9ff,.28); fillL.position.set(-10,8,-8); scene.add(fillL);

let minX=0,maxX=10,minZ=0,maxZ=10;
const CENTER=new THREE.Vector3(5,0,5);
const SUN_OFF=sun.position.clone();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:0x8d948f,roughness:1}));
ground.rotation.x=-Math.PI/2; ground.position.set(CENTER.x,-.06,CENTER.z); ground.receiveShadow=true; scene.add(ground);
const world=new THREE.Group(); scene.add(world);
function updateBounds(){
  minX=1e9;maxX=-1e9;minZ=1e9;maxZ=-1e9;
  const pts=[]; PLAN.rooms.forEach(r=>pts.push(...r.poly)); PLAN.walls.forEach(w=>pts.push(w.a,w.b));
  pts.forEach(([x,z])=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);});
  if(!pts.length){ minX=0;maxX=10;minZ=0;maxZ=10; }
  CENTER.set((minX+maxX)/2,0,(minZ+maxZ)/2);
  const span=Math.max(maxX-minX,maxZ-minZ,4)/2+3;
  sun.position.copy(SUN_OFF).add(CENTER); sun.target.position.copy(CENTER);
  Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,far:60+span}); sun.shadow.camera.updateProjectionMatrix();
  ground.position.set(CENTER.x,-.06,CENTER.z);
}

function applyTheme(){
  const cs=getComputedStyle(document.documentElement);
  const bg=new THREE.Color(cs.getPropertyValue('--scene').trim()||'#E1E6E3');
  scene.background=bg; scene.fog=new THREE.Fog(bg,30,70);
  const dark=bg.getHSL({}).l<.3; ground.material.color.set(dark?0x2a302d:0xa9b0ab);
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* ---------- materiales por superficie ---------- */
const surfMats={};           // key -> MeshStandardMaterial
const surfTok={};            // evita carreras al cargar fotos
const photoCache={};         // ref -> Promise<Texture>
function surfMat(key){ if(!surfMats[key]) surfMats[key]=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}); return surfMats[key]; }
function photoURL(ref){ return localPhotos[ref]||''; }
const localPhotos={};
function photoBase(ref){
  if(!photoCache[ref]) photoCache[ref]=new Promise((res,rej)=>{
    new THREE.TextureLoader().load(photoURL(ref),t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;res(t);},undefined,()=>{delete photoCache[ref];rej(new Error('photo'));});
  });
  return photoCache[ref];
}
function setMap(mat,base,size){
  const t=base.clone(); t.needsUpdate=true; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/size,1/size); t.anisotropy=MAX_ANISO;
  if(mat.map) mat.map.dispose(); mat.map=t; mat.needsUpdate=true;
}
function applySurface(key){
  const spec=state.materials[key]; if(!spec) return;
  const mat=surfMat(key), tok=(surfTok[key]||0)+1; surfTok[key]=tok;
  mat.roughness = key.startsWith('floor:') ? .78 : .92;
  if(spec.kind==='photo'){
    photoBase(spec.ref).then(b=>{ if(surfTok[key]===tok) setMap(mat,b,spec.size); })
      .catch(()=>{ if(surfTok[key]===tok){ setMap(mat,presetBase(key.startsWith('floor:')?'porcelanico':'blanco'),1); } });
  } else setMap(mat,presetBase(spec.key),spec.size);
}
function applyAllSurfaces(){ Object.keys(state.materials).forEach(applySurface); }

/* ---------- suelos ---------- */
const floorMeshes=[], outlines={};
function buildFloor(r){
  const sh=new THREE.Shape(); r.poly.forEach(([x,z],i)=>i?sh.lineTo(x,-z):sh.moveTo(x,-z)); sh.closePath();
  const g=new THREE.ShapeGeometry(sh); const p=g.attributes.position, uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){ uv[2*i]=p.getX(i); uv[2*i+1]=p.getY(i); }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.rotateX(-Math.PI/2);
  const y=r.terrace?-.03:0;
  const mesh=new THREE.Mesh(g,surfMat('floor:'+r.id)); mesh.position.y=y; mesh.receiveShadow=true;
  mesh.userData={pick:'surface',key:'floor:'+r.id,floor:true}; world.add(mesh); floorMeshes.push(mesh);
  const pts=r.poly.map(([x,z])=>new THREE.Vector3(x,y+.012,z));
  const l=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x2F5F8F,depthTest:false,transparent:true}));
  l.renderOrder=5; l.visible=false; world.add(l); outlines[r.id]=l;
}

/* ---------- muros con puertas y ventanas ---------- */
const wallGroup=new THREE.Group(); world.add(wallGroup);
const capMat=new THREE.MeshStandardMaterial({color:0xd8d5ce,roughness:.95});
const trimMat=new THREE.MeshStandardMaterial({color:0xf2efe8,roughness:.6});
const doorMat=new THREE.MeshStandardMaterial({color:0xe6e1d6,roughness:.55});
const knobMat=new THREE.MeshStandardMaterial({color:0x9a958a,roughness:.35,metalness:.6});
const frameMat=new THREE.MeshStandardMaterial({color:0x45474a,roughness:.45,metalness:.4});
const glassMat=new THREE.MeshStandardMaterial({color:0xbcd8e6,roughness:.05,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false});
const closetMat=new THREE.MeshStandardMaterial({color:0xd9d2c4,roughness:.7});
const pickables=[];
/* ---------- colisiones (en planta, x/z) ---------- */
const obstacles=[];   // rectángulos orientados: centro, eje u, semiejes hu (a lo largo de u) y hv
function addObb(cx,cz,ux,uz,hu,hv){ obstacles.push({cx,cz,ux,uz,hu,hv}); }
function obbOverlap(A,B,eps){
  const axes=[[A.ux,A.uz],[-A.uz,A.ux],[B.ux,B.uz],[-B.uz,B.ux]], dx=B.cx-A.cx, dz=B.cz-A.cz;
  for(const [ax,az] of axes){
    const rA=A.hu*Math.abs(A.ux*ax+A.uz*az)+A.hv*Math.abs(-A.uz*ax+A.ux*az);
    const rB=B.hu*Math.abs(B.ux*ax+B.uz*az)+B.hv*Math.abs(-B.uz*ax+B.ux*az);
    if(Math.abs(dx*ax+dz*az)>=rA+rB-eps) return false; }
  return true; }
function circleHits(x,z,r,B){ const dx=x-B.cx, dz=z-B.cz; const lu=dx*B.ux+dz*B.uz, lv=-dx*B.uz+dz*B.ux;
  const cu=clamp(lu,-B.hu,B.hu), cv=clamp(lv,-B.hv,B.hv); return (lu-cu)**2+(lv-cv)**2 < r*r; }
function fObb(f){ const r=f.rot*Math.PI/180; return {cx:f.x,cz:f.z,ux:Math.cos(r),uz:-Math.sin(r),hu:f.w/200,hv:f.d/200}; }
const TABLES=new Set(['table']);
function ignorePair(a,b){ if(a.type==='rug'||b.type==='rug') return true;
  return (a.type==='chair'&&TABLES.has(b.type))||(b.type==='chair'&&TABLES.has(a.type)); }
function collides(f){
  if(f.type==='rug') return false;
  const A=fObb(f);
  for(const o of obstacles) if(obbOverlap(A,o,.006)) return true;
  for(const g of state.furniture){ if(g===f||g.id===f.id||ignorePair(f,g)) continue; if(obbOverlap(A,fObb(g),.006)) return true; }
  return false; }
function walkBlocked(x,z){ const r=.22;
  for(const o of obstacles) if(circleHits(x,z,r,o)) return true;
  for(const g of state.furniture){ if(g.type==='rug') continue; if(circleHits(x,z,r,fObb(g))) return true; }
  return false; }
function tryAt(f,x,z){ const ox=f.x,oz=f.z; f.x=x; f.z=z; if(!collides(f)) return true; f.x=ox; f.z=oz; return false; }
// avanza hacia (tx,tz) en pasos cortos, deslizando contra lo que choque
function slideTo(f,tx,tz){
  if(!state.collide||f.type==='rug'||collides(f)){ f.x=tx; f.z=tz; return true; }
  const dist=Math.hypot(tx-f.x,tz-f.z), n=Math.min(600,Math.ceil(dist/.025)); let free=true;
  for(let i=0;i<n;i++){ const k=1/(n-i), nx=f.x+(tx-f.x)*k, nz=f.z+(tz-f.z)*k;
    if(tryAt(f,nx,nz)) continue; free=false;
    if(Math.abs(nx-f.x)>1e-6 && tryAt(f,nx,f.z)) continue;
    if(Math.abs(nz-f.z)>1e-6 && tryAt(f,f.x,nz)) continue;
    break; }
  return free && Math.hypot(tx-f.x,tz-f.z)<.01; }
// busca el hueco libre más cercano
function findFree(test,x0,z0,maxR){ if(test(x0,z0)) return [x0,z0];
  for(let r=.05;r<=maxR+1e-9;r+=.05){ const n=Math.max(8,Math.round(2*Math.PI*r/.05));
    for(let i=0;i<n;i++){ const a=i/n*2*Math.PI, x=x0+Math.cos(a)*r, z=z0+Math.sin(a)*r; if(test(x,z)) return [x,z]; } }
  return null; }
function fitFurn(f,maxR){ if(!state.collide||!collides(f)) return true;
  const ox=f.x,oz=f.z; const p=findFree((x,z)=>{f.x=x;f.z=z;return !collides(f);},ox,oz,maxR);
  if(p){ f.x=+p[0].toFixed(3); f.z=+p[1].toFixed(3); return true; } f.x=ox; f.z=oz; return false; }
function walkMove(dx,dz){ const w=cam.walk;
  if(!walkBlocked(w.x+dx,w.z+dz)){ w.x+=dx; w.z+=dz; return true; }
  if(dx&&!walkBlocked(w.x+dx,w.z)){ w.x+=dx; return false; }
  if(dz&&!walkBlocked(w.x,w.z+dz)){ w.z+=dz; return false; }
  return false; }
function walkPlaceFree(){ const w=cam.walk; const p=findFree((x,z)=>!walkBlocked(x,z),w.x,w.z,3); if(p){ w.x=p[0]; w.z=p[1]; } }
function inPoly(x,z,poly){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,zi]=poly[i],[xj,zj]=poly[j];
  if(((zi>z)!==(zj>z)) && (x<(xj-xi)*(z-zi)/(zj-zi)+xi)) c=!c; } return c; }
function roomAt(x,z){ for(const r of PLAN.rooms) if(inPoly(x,z,r.poly)) return r.id; return null; }
function wallKeyAt(x,z){ const id=roomAt(x,z); return id?'walls:'+id:'walls:exterior'; }
function box(w,h,d,mat,cx,cy,cz,ry,parent,shadow=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(cx,cy,cz); m.rotation.y=ry||0;
  if(shadow){m.castShadow=true;m.receiveShadow=true;} (parent||wallGroup).add(m); return m;
}
function buildWall(w){
  const [ax,az]=w.a,[bx,bz]=w.b, L=Math.hypot(bx-ax,bz-az); if(L<.01) return;
  const ux=(bx-ax)/L, uz=(bz-az)/L, nx=-uz, nz=ux, ry=Math.atan2(-uz,ux);
  const at=d=>[ax+ux*d, az+uz*d];
  const off=w.t/2+.1;
  const keysAt=d=>{ const c=at(clamp(d,.03,L-.03)); return [wallKeyAt(c[0]+nx*off,c[1]+nz*off), wallKeyAt(c[0]-nx*off,c[1]-nz*off)]; };
  const piece=(d0,d1,y0,y1,keys)=>{
    const len=d1-d0,h=y1-y0; if(len<.005||h<.005) return;
    const g=new THREE.BoxGeometry(len,h,w.t), pos=g.attributes.position, uv=g.attributes.uv, dm=(d0+d1)/2, yc=(y0+y1)/2;
    for(let i=0;i<pos.count;i++){ const f=Math.floor(i/4), x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
      if(f===4) uv.setXY(i,dm+x,yc+y); else if(f===5) uv.setXY(i,-(dm+x),yc+y);
      else if(f<2) uv.setXY(i,z,yc+y); else uv.setXY(i,dm+x,z); }
    const c=at(dm);
    const m=new THREE.Mesh(g,[capMat,capMat,capMat,capMat,surfMat(keys[0]),surfMat(keys[1])]);
    m.position.set(c[0],yc,c[1]); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true;
    m.userData={pick:'surface',keys}; wallGroup.add(m); pickables.push(m);
    if(y0<.05) addObb(c[0],c[1],ux,uz,len/2,w.t/2);
  };
  const solid=(d0,d1,y0,y1)=>{ if(d1-d0<.005) return; let s=d0, prev=keysAt(d0+.02);
    for(let d=d0+.05; d<d1-.02; d+=.05){ const k=keysAt(d); if(k[0]!==prev[0]||k[1]!==prev[1]){ piece(s,d,y0,y1,prev); s=d; prev=k; } }
    piece(s,d1,y0,y1,prev); };
  const e0=w.ext?w.ext[0]:Math.min(w.t/2,.06), e1=w.ext?w.ext[1]:Math.min(w.t/2,.06);
  const ops=w.o.slice().sort((p,q)=>p.s-q.s);
  let cur=-e0;
  ops.forEach(o=>{
    const top=o.top!==undefined?o.top:((o.kind==='glass'||o.kind==='glassdoor')?2.30:PLAN.H_DOOR);
    const sill=o.sill!==undefined?o.sill:0;
    solid(cur,o.s,0,w.h); if(sill>0) solid(o.s,o.e,0,sill); if(top<w.h) solid(o.s,o.e,top,w.h);
    opening(w,o,at,ry,ux,uz,nx,nz,sill,top); cur=o.e;
  });
  solid(cur,L+e1,0,w.h);
}
function floorPatch(pts,key,y){
  const sh=new THREE.Shape(); pts.forEach(([x,z],i)=>i?sh.lineTo(x,-z):sh.moveTo(x,-z)); sh.closePath();
  const g=new THREE.ShapeGeometry(sh), p=g.attributes.position, uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){ uv[2*i]=p.getX(i); uv[2*i+1]=p.getY(i); }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(g,surfMat(key)); m.position.y=y; m.receiveShadow=true; m.userData={pick:'surface',key,floor:true};
  wallGroup.add(m); pickables.push(m); return m; }
function opening(w,o,at,ry,ux,uz,nx,nz,sill,top){
  const width=o.e-o.s, cm=at((o.s+o.e)/2), hgt=top-sill;
  if(sill<.05){ // suelo en el umbral del hueco (las estancias acaban en la cara del muro)
    const d=w.t/2+.002, A=at(o.s), B=at(o.e), off=w.t/2+.15;
    const cands=[o.into, [cm[0]+nx*off,cm[1]+nz*off], [cm[0]-nx*off,cm[1]-nz*off]].filter(Boolean).map(p=>roomAt(p[0],p[1])).filter(Boolean);
    const id=cands.find(r=>!ROOM[r].terrace)||cands[0];
    if(id) floorPatch([[A[0]+nx*d,A[1]+nz*d],[B[0]+nx*d,B[1]+nz*d],[B[0]-nx*d,B[1]-nz*d],[A[0]-nx*d,A[1]-nz*d]],'floor:'+id,ROOM[id].terrace?-.03:-.001);
  }
  if(o.kind==='door'||o.kind==='glassdoor'){
    const fm=o.kind==='door'?trimMat:frameMat;
    [o.s,o.e].forEach(d=>{const p=at(d);box(.05,top,w.t+.02,fm,p[0],top/2,p[1],ry,wallGroup,false);});
    box(width,.06,w.t+.02,fm,cm[0],top-.03,cm[1],ry,wallGroup,false);
    const h=at(o.hinge==='start'?o.s+.03:o.e-.03);
    const side=((o.into[0]-h[0])*nx+(o.into[1]-h[1])*nz)>0?1:-1, along=o.hinge==='start'?1:-1, ang=85*Math.PI/180;
    const dx=ux*along*Math.cos(ang)+nx*side*Math.sin(ang), dz=uz*along*Math.cos(ang)+nz*side*Math.sin(ang);
    const lw=width-.06, lh=top-.04, lry=Math.atan2(-dz,dx), cx=h[0]+dx*lw/2, cz=h[1]+dz*lw/2;
    if(o.kind==='door'){ box(lw,lh,.04,doorMat,cx,lh/2,cz,lry);
      box(.03,.03,.12,knobMat,h[0]+dx*(lw-.08),1.0,h[1]+dz*(lw-.08),lry,wallGroup,false);
    } else { box(lw,lh,.02,glassMat,cx,lh/2,cz,lry,wallGroup,false);
      box(lw,.05,.045,frameMat,cx,.025,cz,lry,wallGroup,false); box(lw,.05,.045,frameMat,cx,lh-.025,cz,lry,wallGroup,false);
      [.025,lw-.025].forEach(d=>box(.05,lh,.045,frameMat,h[0]+dx*d,lh/2,h[1]+dz*d,lry,wallGroup,false)); }
    return;
  }
  if(sill<.05) addObb(cm[0],cm[1],ux,uz,width/2,w.t/2);
  box(width,hgt,.02,glassMat,cm[0],sill+hgt/2,cm[1],ry,wallGroup,false);
  const ft=Math.max(w.t*.7,.06);
  box(width,.05,ft,frameMat,cm[0],sill+.025,cm[1],ry,wallGroup,false);
  box(width,.05,ft,frameMat,cm[0],top-.025,cm[1],ry,wallGroup,false);
  [o.s,o.e].forEach(d=>{const p=at(d);box(.05,hgt,ft,frameMat,p[0],sill+hgt/2,p[1],ry,wallGroup,false);});
  const bays=Math.max(1,Math.round(width/.9));
  for(let i=1;i<bays;i++){const p=at(o.s+width*i/bays);box(.045,hgt,ft,frameMat,p[0],sill+hgt/2,p[1],ry,wallGroup,false);}
}
function buildCloset(c){
  const w=Math.abs(c.b[0]-c.a[0]), d=Math.abs(c.b[1]-c.a[1]), cx=(c.a[0]+c.b[0])/2, cz=(c.a[1]+c.b[1])/2;
  if(w<.01||d<.01) return;
  addObb(cx,cz,1,0,w/2,d/2);
  if(c.kind==='pillar'){ const k=wallKeyAt(cx,cz); const m=box(w,c.h,d,surfMat(k),cx,c.h/2,cz,0); m.userData={pick:'surface',keys:[k,k]}; pickables.push(m); }
  else box(w,c.h,d,closetMat,cx,c.h/2,cz,0);
}
function disposeObj(o){ o.traverse(n=>{ if(n.geometry) n.geometry.dispose(); }); }
/* Construye (o reconstruye) suelos, muros y armarios a partir de una planta en metros */
function loadPlan(plan){
  PLAN=plan; ROOM=Object.fromEntries(PLAN.rooms.map(r=>[r.id,r]));
  [...wallGroup.children].forEach(c=>{ wallGroup.remove(c); disposeObj(c); });
  floorMeshes.forEach(m=>{ world.remove(m); m.geometry.dispose(); }); floorMeshes.length=0;
  Object.keys(outlines).forEach(k=>{ world.remove(outlines[k]); outlines[k].geometry.dispose(); outlines[k].material.dispose(); delete outlines[k]; });
  obstacles.length=0; pickables.length=0;
  PLAN.rooms.forEach(buildFloor);
  PLAN.walls.forEach(buildWall);
  PLAN.closets.forEach(buildCloset);
  pickables.push(...floorMeshes);
  updateBounds();
  // selectores del panel
  goSel.length=1; PLAN.rooms.forEach(r=>{ const o=document.createElement('option'); o.value=r.id; o.textContent=r.label; goSel.appendChild(o); });
  surfSel.innerHTML='';
  const add=(key,group)=>{ const o=document.createElement('option'); o.value=key; o.textContent=surfLabel(key); group.appendChild(o); };
  const g1=document.createElement('optgroup'); g1.label='Suelos'; const g2=document.createElement('optgroup'); g2.label='Paredes';
  PLAN.rooms.forEach(r=>{ add('floor:'+r.id,g1); add('walls:'+r.id,g2); }); add('walls:exterior',g2); surfSel.append(g1,g2);
  const tot=PLAN.rooms.filter(r=>!r.terrace).reduce((a,r)=>a+(+r.m2||0),0);
  $('totalM2').textContent=tot?tot.toFixed(2).replace('.',',')+' m² útiles':'';
  if(!state.materials[selSurf]) selSurf=PLAN.rooms[0]?'floor:'+PLAN.rooms[0].id:'walls:exterior';
}
function mainRoom(){ let best=null,ba=-1; PLAN.rooms.forEach(r=>{ if(r.terrace) return; const a=polyArea(r.poly); if(a>ba){ba=a;best=r;} }); return best||PLAN.rooms[0]||null; }
function polyArea(P){ let a=0; for(let i=0;i<P.length;i++){ const [x1,z1]=P[i],[x2,z2]=P[(i+1)%P.length]; a+=x1*z2-x2*z1; } return Math.abs(a)/2; }

/* =========================================================================
   Muebles
   ========================================================================= */
const furnGroup=new THREE.Group(); scene.add(furnGroup);
const furnObj={};  // id -> Group
const white=new THREE.MeshStandardMaterial({color:0xf3f1ec,roughness:.9});
const darkM=new THREE.MeshStandardMaterial({color:0x1d1f22,roughness:.4});
function fBuild(f){
  const g=new THREE.Group(), w=f.w/100, d=f.d/100, h=Math.max(.01,f.h/100);
  const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(f.color),roughness:.8});
  const shade=new THREE.MeshStandardMaterial({color:new THREE.Color(f.color).multiplyScalar(.72),roughness:.8});
  const add=(bw,bh,bd,x,y,z,m)=>{ const b=box(Math.max(bw,.005),Math.max(bh,.005),Math.max(bd,.005),m||mat,x,y,z,0,g); b.userData={furn:f.id}; return b; };
  switch(f.type){
    case 'sofa':{ const a=Math.min(.2,w*.12), seat=.44, bk=Math.min(.22,d*.3);
      add(w,.2,d,0,.1,0,shade); add(w-2*a,seat-.2,d-bk,0,.2+(seat-.2)/2,bk/2);
      add(w-2*a,Math.max(h-.2,.1),bk,0,.2+Math.max(h-.2,.1)/2,-d/2+bk/2);
      add(a,Math.min(.64,h),d,-w/2+a/2,Math.min(.64,h)/2,0,shade); add(a,Math.min(.64,h),d,w/2-a/2,Math.min(.64,h)/2,0,shade); break; }
    case 'bed':{ const low=h<.6, base=low?Math.max(h-.2,.15):.3;
      add(w,base,d,0,base/2,0); add(w-.04,.2,d-.08,0,base+.1,.02,white);
      if(!low) add(w+.04,h,.07,0,h/2,-d/2-.02); const n=w<1.1?1:2;
      for(let i=0;i<n;i++) add(n===1?w-.2:w/2-.14,.1,.34,n===1?0:(i?w/4:-w/4),base+.25,-d/2+.3,white);
      add(w-.02,.05,d*.55,0,base+.225,d*.2,shade); break; }
    case 'chaise':{ const a=.16, sd=Math.min(.95,d), cw=Math.min(.9,w*.4), bk=.2, seat=.44, zb=-d/2+sd/2;
      add(w,.2,sd,0,.1,zb,shade); add(cw,.2,d-sd,w/2-cw/2,.1,-d/2+sd+(d-sd)/2,shade);
      add(w-2*a,seat-.2,sd-bk,0,.2+(seat-.2)/2,zb+bk/2); add(cw-a,seat-.2,d-sd,w/2-cw/2-a/2,.2+(seat-.2)/2,-d/2+sd+(d-sd)/2);
      add(w-2*a,h-.2,bk,0,.2+(h-.2)/2,-d/2+bk/2);
      add(a,.62,sd,-w/2+a/2,.31,zb,shade); add(a,.62,d,w/2-a/2,.31,0,shade); break; }
    case 'kallax':{ const t=.035, nx=Math.max(1,Math.round((w-t)/.37)), ny=Math.max(1,Math.round((h-t)/.37));
      add(w,t,d,0,t/2,0); add(w,t,d,0,h-t/2,0); add(t,h,d,-w/2+t/2,h/2,0); add(t,h,d,w/2-t/2,h/2,0);
      for(let i=1;i<nx;i++) add(.016,h-2*t,d,-w/2+w*i/nx,h/2,0);
      for(let j=1;j<ny;j++) add(w-2*t,.016,d,0,h*j/ny,0); break; }
    case 'model':{ buildModel(f,g,w,d,h); break; }
    case 'table':{ const round=Math.abs(w-d)<.01 && /redonda/i.test(f.name);
      if(round){ const t=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,.04,40),mat); t.position.set(0,h-.02,0); t.castShadow=t.receiveShadow=true; t.userData={furn:f.id}; g.add(t);
        add(.08,h-.04,.08,0,(h-.04)/2,0,shade); add(w*.5,.03,w*.5,0,.015,0,shade); }
      else { add(w,.04,d,0,h-.02,0); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>add(.05,h-.04,.05,sx*(w/2-.06),(h-.04)/2,sz*(d/2-.06),shade)); }
      break; }
    case 'chair':{ add(w,.04,d,0,.45,0); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>add(.035,.43,.035,sx*(w/2-.03),.215,sz*(d/2-.03),shade));
      add(w,Math.max(h-.47,.05),.03,0,.47+Math.max(h-.47,.05)/2,-d/2+.015); break; }
    case 'wardrobe':{ add(w,h,d,0,h/2,0); const n=Math.max(1,Math.round(w/.5));
      for(let i=1;i<n;i++) add(.006,h-.06,.006,-w/2+w*i/n,h/2,d/2+.003,shade);
      for(let i=0;i<n;i++) add(.02,.3,.02,-w/2+w*(i+.5)/n+(i%2?-.08:.08)*(w/n),h*.55,d/2+.012,knobMat); break; }
    case 'drawers':{ add(w,h,d,0,h/2,0); const n=Math.max(1,Math.round(h/.25));
      for(let i=1;i<n;i++) add(w-.04,.006,.006,0,h*i/n,d/2+.003,shade);
      for(let i=0;i<n;i++) add(Math.min(.14,w*.3),.018,.02,0,h*(i+.5)/n,d/2+.012,knobMat); break; }
    case 'tv':{ add(w,h,d,0,h/2,0); add(w-.04,.006,.006,0,h/2,d/2+.003,shade);
      const sw=Math.min(w*.75,1.45); add(sw,sw*.57,.04,0,h+.12+sw*.285,-d/4,darkM); add(.25,.12,.18,0,h+.06,-d/4,darkM); break; }
    case 'shelf':{ const t=.025; add(t,h,d,-w/2+t/2,h/2,0); add(t,h,d,w/2-t/2,h/2,0); add(w,h,.01,0,h/2,-d/2+.005,shade);
      const n=Math.max(2,Math.round(h/.36)); for(let i=0;i<=n;i++) add(w-2*t,t,d,0,t/2+(h-t)*i/n,0); break; }
    case 'rug': add(w,.012,d,0,.006,0); break;
    case 'fridge':{ add(w,h,d,0,h/2,0); add(w-.02,.006,.006,0,h*.62,d/2+.003,shade); add(.02,.35,.03,w/2-.06,h*.78,d/2+.02,knobMat); add(.02,.3,.03,w/2-.06,h*.4,d/2+.02,knobMat); break; }
    case 'washer':{ add(w,h,d,0,h/2,0); const c=new THREE.Mesh(new THREE.CylinderGeometry(w*.3,w*.3,.02,32),darkM);
      c.rotation.x=Math.PI/2; c.position.set(0,h*.45,d/2+.01); c.userData={furn:f.id}; g.add(c); add(w-.04,.1,.006,0,h-.07,d/2+.003,shade); break; }
    default: add(w,h,d,0,h/2,0);
  }
  g.position.set(f.x,0,f.z); g.rotation.y=f.rot*Math.PI/180; g.userData={furn:f.id};
  return g;
}
/* ---------- modelos 3D importados (GLB/glTF/OBJ) ---------- */
const modelBufs={};      // ref -> {buf:ArrayBuffer, ext, name}
const modelParsed={};    // ref -> Promise<{obj, hasMaterials}>
const modelTpl={};       // ref|upq -> {obj, size:Vector3}
function parseModel(ref){
  if(!modelParsed[ref]) modelParsed[ref]=new Promise((res,rej)=>{
    const m=modelBufs[ref]; if(!m) return rej(new Error('missing'));
    try{
      if(m.ext==='obj'){ if(!THREE.OBJLoader) throw new Error('loader');
        const o=new THREE.OBJLoader().parse(new TextDecoder().decode(m.buf)); res({obj:o,hasMaterials:false}); }
      else { if(!THREE.GLTFLoader) throw new Error('loader');
        const data=m.ext==='gltf'?new TextDecoder().decode(m.buf):m.buf;
        new THREE.GLTFLoader().parse(data,'',g=>res({obj:g.scene,hasMaterials:true}),e=>rej(e)); }
    }catch(e){ rej(e); }
  });
  return modelParsed[ref];
}
function modelTemplate(ref,upq,parsed){
  const k=ref+'|'+(upq||0); if(modelTpl[k]) return modelTpl[k];
  const root=new THREE.Group(), inner=parsed.obj.clone(true); inner.rotation.x=-(upq||0)*Math.PI/2; root.add(inner);
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x,-box.min.y,-c.z);
  root.traverse(n=>{ n.userData.shared=true; if(n.isMesh){ n.castShadow=true; n.receiveShadow=true; } });
  size.x=Math.max(size.x,1e-6); size.y=Math.max(size.y,1e-6); size.z=Math.max(size.z,1e-6);
  return modelTpl[k]={obj:root,size,hasMaterials:parsed.hasMaterials};
}
function buildModel(f,g,w,d,h){
  const ph=box(w,h,d,new THREE.MeshStandardMaterial({color:0x9aa7b2,transparent:true,opacity:.35}),0,h/2,0,0,g,false); ph.userData={furn:f.id};
  parseModel(f.model).then(p=>{
    if(!furnObj[f.id]||furnObj[f.id]!==g) return;
    const t=modelTemplate(f.model,f.upq,p), c=t.obj.clone(true);
    c.scale.set(w/t.size.x,h/t.size.y,d/t.size.z);
    const tint=(!t.hasMaterials)?new THREE.MeshStandardMaterial({color:new THREE.Color(f.color||'#B8B2A7'),roughness:.8}):null;
    c.traverse(n=>{ n.userData.furn=f.id; if(tint&&n.isMesh) n.material=tint; });
    if(tint) tint.userData={}; // se libera con el grupo
    g.remove(ph); ph.geometry.dispose(); ph.material.dispose(); g.add(c); if(selFurn===f.id) updateSelBox();
  }).catch(()=>{ ph.material.color.set(0xC0392B); modelMsg('No se pudo abrir el modelo "'+f.name+'". Usa .glb sin compresión Draco, o .obj.'); });
}
function modelMsg(t){ const m=$('modelMsg'); if(!m) return; m.textContent=t; clearTimeout(modelMsg.t); modelMsg.t=setTimeout(()=>m.textContent='',6000); }
function fRender(f){ if(furnObj[f.id]){ furnGroup.remove(furnObj[f.id]); disposeTree(furnObj[f.id]); }
  const g=fBuild(f); furnGroup.add(g); furnObj[f.id]=g; if(selFurn===f.id) updateSelBox(); }
function fPlace(f){ const g=furnObj[f.id]; if(!g) return; g.position.set(f.x,0,f.z); g.rotation.y=f.rot*Math.PI/180; if(selFurn===f.id) updateSelBox(); }
function disposeTree(o){ o.traverse(n=>{ if(n.userData&&n.userData.shared) return; if(n.geometry) n.geometry.dispose(); if(n.material && !Array.isArray(n.material) && ![white,darkM,knobMat].includes(n.material)) n.material.dispose(); }); }
function renderAllFurniture(){ Object.keys(furnObj).forEach(id=>{ furnGroup.remove(furnObj[id]); disposeTree(furnObj[id]); delete furnObj[id]; });
  state.furniture.forEach(fRender); }
let blockedT=0;
function setBlocked(b){ if(b) blockedT=performance.now(); selBox.material.color.set(b?0xC0392B:0x2F5F8F); }
const selBox=new THREE.BoxHelper(undefined,0x2F5F8F); selBox.visible=false; selBox.material.depthTest=false; selBox.renderOrder=6; scene.add(selBox);
function updateSelBox(){ const g=selFurn&&furnObj[selFurn]; if(!g){selBox.visible=false;return;} selBox.setFromObject(g); selBox.visible=true; }

/* =========================================================================
   Cámara: órbita libre, planta y paseo
   ========================================================================= */
const cam={mode:'orbit', target:CENTER.clone(), radius:18, theta:.28, phi:.9, walk:{x:0,z:0,yaw:0,pitch:0}};
let tween=null;
function applyCam(){
  if(cam.mode==='walk'){ camera.fov=70; camera.rotation.order='YXZ';
    camera.position.set(cam.walk.x,1.6,cam.walk.z); camera.rotation.set(cam.walk.pitch,cam.walk.yaw,0); }
  else { camera.fov=45; const phi=cam.mode==='plan'?.0008:cam.phi, th=cam.mode==='plan'?0:cam.theta;
    camera.position.set(cam.target.x+cam.radius*Math.sin(phi)*Math.sin(th), cam.target.y+cam.radius*Math.cos(phi), cam.target.z+cam.radius*Math.sin(phi)*Math.cos(th));
    camera.up.set(0,1,0); camera.lookAt(cam.target); }
  camera.updateProjectionMatrix();
}
function tweenTo(to,ms=450){
  if(reduceMotion){ Object.assign(cam,{radius:to.radius??cam.radius,theta:to.theta??cam.theta,phi:to.phi??cam.phi}); if(to.target) cam.target.copy(to.target); applyCam(); return; }
  tween={t0:performance.now(),ms,from:{t:cam.target.clone(),r:cam.radius,th:cam.theta,ph:cam.phi},
    to:{t:to.target?to.target.clone():cam.target.clone(),r:to.radius??cam.radius,th:to.theta??cam.theta,ph:to.phi??cam.phi}};
}
function stepTween(now){ if(!tween) return; const k=clamp((now-tween.t0)/tween.ms,0,1), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  cam.target.lerpVectors(tween.from.t,tween.to.t,e); cam.radius=tween.from.r+(tween.to.r-tween.from.r)*e;
  let dth=tween.to.th-tween.from.th; dth=Math.atan2(Math.sin(dth),Math.cos(dth)); cam.theta=tween.from.th+dth*e;
  cam.phi=tween.from.ph+(tween.to.ph-tween.from.ph)*e; if(k>=1) tween=null; }
function viewAll(){ const span=Math.max(maxX-minX,maxZ-minZ);
  if(cam.mode==='walk') setMode('orbit');
  tweenTo({target:CENTER.clone(),radius:span*(cam.mode==='plan'?1.25:1.3),theta:.28,phi:.9}); }
function roomCenter(r){ let a=0,cx=0,cz=0; const P=r.poly;
  for(let i=0;i<P.length;i++){ const [x1,z1]=P[i],[x2,z2]=P[(i+1)%P.length], c=x1*z2-x2*z1; a+=c; cx+=(x1+x2)*c; cz+=(z1+z2)*c; }
  a/=2; return [cx/(6*a), cz/(6*a)]; }
function goRoom(id){ const r=ROOM[id]; if(!r) return; const [cx,cz]=roomCenter(r);
  const xs=r.poly.map(p=>p[0]), zs=r.poly.map(p=>p[1]), span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs));
  if(cam.mode==='walk'){ cam.walk.x=cx; cam.walk.z=cz; walkPlaceFree(); walkTarget=null; return; }
  tweenTo({target:new THREE.Vector3(cx,0,cz),radius:clamp(span*1.5+2.5,3.5,14),phi:cam.mode==='plan'?cam.phi:.78}); }

/* ---------- picking ---------- */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
function setNdc(e){ const r=renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc,camera); }
function planeHit(y){ const p=new THREE.Vector3(); return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),p)?p:null; }
function pickFurn(){ const h=ray.intersectObjects(furnGroup.children,true)[0]; return h?{id:h.object.userData.furn,point:h.point}:null; }
function pickSurf(){ const h=ray.intersectObjects(pickables,false)[0]; if(!h) return null;
  const u=h.object.userData; let key=u.key; if(u.keys){ const mi=h.face?h.face.materialIndex:4; key=mi===5?u.keys[1]:u.keys[0]; }
  return {key,point:h.point,object:h.object}; }
function pickPoint(){ const a=ray.intersectObjects([...pickables,...furnGroup.children],true)[0]; return a?a.point:(planeHit(0)); }

/* ---------- gestos ---------- */
const el=renderer.domElement, ptrs=new Map();
let gesture=null, tool=null, lastTap=0, lastTapPos=null;
const walkKeys={f:0,b:0,l:0,r:0,sl:0,sr:0};
el.addEventListener('contextmenu',e=>e.preventDefault());
el.addEventListener('pointerdown',e=>{
  el.focus({preventScroll:true}); el.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); tween=null;
  if(ptrs.size===2){ startPinch(); return; } if(ptrs.size>2) return;
  gesture={sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,t0:performance.now(),moved:false,type:null};
  setNdc(e);
  if(cam.mode==='walk'){ gesture.type='look'; return; }
  const panBtn=e.button===2||e.button===1||e.shiftKey||e.ctrlKey||e.metaKey;
  if(!panBtn && tool!=='measure'){ const f=pickFurn();
    if(f){ selectFurn(f.id); const p=planeHit(0), o=state.furniture.find(x=>x.id===f.id);
      if(p&&o){ gesture.type='drag'; gesture.id=f.id; gesture.off={x:o.x-p.x,z:o.z-p.z}; return; } } }
  if(panBtn || cam.mode==='plan'){ gesture.type='pan'; gesture.grab=planeHit(cam.target.y)||cam.target.clone(); }
  else gesture.type='rotate';
});
el.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId); if(!p) return; p.x=e.clientX; p.y=e.clientY;
  if(ptrs.size===2){ movePinch(); return; }
  if(!gesture) return;
  const dx=e.clientX-gesture.lx, dy=e.clientY-gesture.ly; gesture.lx=e.clientX; gesture.ly=e.clientY;
  if(Math.hypot(e.clientX-gesture.sx,e.clientY-gesture.sy)>5) gesture.moved=true;
  if(!gesture.moved) return;
  if(gesture.type==='rotate'){ cam.theta-=dx*.0055; cam.phi=clamp(cam.phi-dy*.0055,.06,1.5); }
  else if(gesture.type==='look'){ cam.walk.yaw-=dx*.004; cam.walk.pitch=clamp(cam.walk.pitch-dy*.004,-1.2,1.2); }
  else if(gesture.type==='pan'){ applyCam(); setNdc(e); const q=planeHit(gesture.grab.y); if(q){ cam.target.x+=gesture.grab.x-q.x; cam.target.z+=gesture.grab.z-q.z; } }
  else if(gesture.type==='drag'){ setNdc(e); const q=planeHit(0), f=state.furniture.find(x=>x.id===gesture.id);
    if(q&&f){ const snap=v=>Math.round(v/.05)*.05; const ok=slideTo(f,snap(q.x+gesture.off.x),snap(q.z+gesture.off.z));
      f.x=+f.x.toFixed(3); f.z=+f.z.toFixed(3); fPlace(f); gesture.changed=true; setBlocked(!ok); } }
});
function endPtr(e){
  const was=ptrs.has(e.pointerId); ptrs.delete(e.pointerId);
  if(pinch){ if(ptrs.size<2) pinch=null; gesture=null; return; }
  if(!was||!gesture) return;
  const g=gesture; gesture=null;
  if(g.type==='drag'){ setBlocked(false); if(g.changed){ saveSoon(); renderFurnPanel(); } }
  if(!g.moved && e.type==='pointerup' && performance.now()-g.t0<500) onTap(e);
}
el.addEventListener('pointerup',endPtr); el.addEventListener('pointercancel',endPtr);
let pinch=null;
function pinchInfo(){ const [a,b]=[...ptrs.values()]; return {cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)}; }
function startPinch(){ gesture=null; const i=pinchInfo(); setNdc({clientX:i.cx,clientY:i.cy}); pinch={...i,grab:planeHit(cam.target.y)||cam.target.clone()}; }
function movePinch(){ if(!pinch) return; const i=pinchInfo();
  if(cam.mode==='walk'){ const fw=(i.d-pinch.d)*.01; walkMove(-Math.sin(cam.walk.yaw)*fw,-Math.cos(cam.walk.yaw)*fw); pinch={...pinch,...i}; return; }
  applyCam(); setNdc({clientX:i.cx,clientY:i.cy}); const q=planeHit(pinch.grab.y);
  if(q){ cam.target.x+=pinch.grab.x-q.x; cam.target.z+=pinch.grab.z-q.z; }
  if(i.d>10 && pinch.d>10) zoomAround(pinch.grab, pinch.d/i.d);
  pinch.d=i.d; pinch.cx=i.cx; pinch.cy=i.cy; }
function zoomAround(P,f){ const nr=clamp(cam.radius*f,1.2,45); f=nr/cam.radius; cam.radius=nr;
  cam.target.x=P.x+(cam.target.x-P.x)*f; cam.target.z=P.z+(cam.target.z-P.z)*f; cam.target.y=clamp(P.y+(cam.target.y-P.y)*f,0,1.2); }
el.addEventListener('wheel',e=>{ e.preventDefault(); tween=null;
  if(cam.mode==='walk'){ const s=clamp(-e.deltaY*.004,-.3,.3); walkMove(-Math.sin(cam.walk.yaw)*s,-Math.cos(cam.walk.yaw)*s); return; }
  setNdc(e); const P=pickPoint(); if(!P) return; zoomAround(P,Math.exp(e.deltaY*.0014)); },{passive:false});
function onTap(e){
  setNdc(e); const now=performance.now();
  const dbl=lastTapPos && now-lastTap<320 && Math.hypot(e.clientX-lastTapPos.x,e.clientY-lastTapPos.y)<24;
  lastTap=now; lastTapPos={x:e.clientX,y:e.clientY};
  if(tool==='measure'){ const p=pickPoint(); if(p) addMeasure(p); return; }
  if(cam.mode==='walk'){ const h=ray.intersectObjects(floorMeshes,false)[0]; if(h) walkTo(h.point); return; }
  if(dbl){ const P=pickPoint(); if(P) tweenTo({target:new THREE.Vector3(P.x,clamp(P.y,0,1.2),P.z),radius:Math.min(cam.radius,6)}); return; }
  const f=pickFurn(); if(f){ selectFurn(f.id); showTab('furn'); return; }
  const s=pickSurf(); if(s){ selectFurn(null); selectSurface(s.key); showTab('surf'); return; }
  selectFurn(null);
}
let walkTarget=null;
function walkTo(p){ walkTarget={x:p.x,z:p.z}; }
addEventListener('keydown',e=>{
  const typing=/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(typing) return;
  const k=e.key.toLowerCase();
  const map={w:'f',arrowup:'f',s:'b',arrowdown:'b',a:'sl',d:'sr',arrowleft:'l',arrowright:'r'};
  if(cam.mode==='walk' && map[k]){ walkKeys[map[k]]=1; e.preventDefault(); return; }
  if(cam.mode!=='walk' && map[k]){ const step=cam.radius*.05, fx=-Math.sin(cam.theta), fz=-Math.cos(cam.theta);
    const mv={f:[fx,fz],b:[-fx,-fz],sl:[fz,-fx],l:[fz,-fx],sr:[-fz,fx],r:[-fz,fx]}[map[k]];
    if(cam.mode==='plan'){ const pm={f:[0,-1],b:[0,1],sl:[-1,0],l:[-1,0],sr:[1,0],r:[1,0]}[map[k]]; cam.target.x+=pm[0]*step; cam.target.z+=pm[1]*step; }
    else { cam.target.x+=mv[0]*step; cam.target.z+=mv[1]*step; } e.preventDefault(); return; }
  if(k==='escape'){ if(tool==='measure') setTool(null); else selectFurn(null); }
  if(selFurn && (k==='delete'||k==='backspace')){ e.preventDefault(); delFurn(selFurn); }
  if(selFurn && k==='r'){ rotFurn(e.shiftKey?-90:90); }
});
addEventListener('keyup',e=>{ const map={w:'f',arrowup:'f',s:'b',arrowdown:'b',a:'sl',d:'sr',arrowleft:'l',arrowright:'r'}; const m=map[e.key.toLowerCase()]; if(m) walkKeys[m]=0; });
document.querySelectorAll('#walkpad button').forEach(b=>{
  const k=b.dataset.k; const on=e=>{e.preventDefault();walkKeys[k]=1;}, off=()=>walkKeys[k]=0;
  b.addEventListener('pointerdown',on); ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,off));
});

/* ---------- modos ---------- */
function setMode(m){
  const prev=cam.mode; if(m===prev) return;
  if(m==='walk'){ const t=cam.target; cam.walk={x:t.x,z:t.z,yaw:cam.theta,pitch:-.05};
    if(!roomAt(t.x,t.z)){ const r=mainRoom(); if(r){ const [cx,cz]=roomCenter(r); cam.walk.x=cx; cam.walk.z=cz; } } walkPlaceFree(); }
  if(prev==='walk'){ const fx=-Math.sin(cam.walk.yaw), fz=-Math.cos(cam.walk.yaw);
    cam.target.set(cam.walk.x+fx*2,0,cam.walk.z+fz*2); cam.theta=cam.walk.yaw; cam.radius=Math.max(cam.radius,7); cam.phi=.85; }
  cam.mode=m; tween=null;
  $('vOrbit').setAttribute('aria-pressed',m==='orbit'); $('vPlan').setAttribute('aria-pressed',m==='plan'); $('vWalk').setAttribute('aria-pressed',m==='walk');
  $('walkpad').hidden=m!=='walk'; walkTarget=null; updateHint();
}
$('vOrbit').onclick=()=>setMode('orbit'); $('vPlan').onclick=()=>setMode('plan'); $('vWalk').onclick=()=>setMode('walk');
$('tReset').onclick=viewAll;
function setTool(t){ tool=t; $('tMeasure').setAttribute('aria-pressed',t==='measure'); if(t!=='measure') clearMeasure(); updateHint(); }
$('tMeasure').onclick=()=>setTool(tool==='measure'?null:'measure');
let low=false; $('tLow').onclick=()=>{ low=!low; $('tLow').setAttribute('aria-pressed',low); wallGroup.scale.y=low?.42:1; };
const goSel=$('goRoom');
goSel.onchange=()=>{ if(goSel.value) goRoom(goSel.value); goSel.value=''; };
function updateHint(){
  const h=$('hint');
  if(tool==='measure') h.textContent='Medir: toca un punto y luego otro. Esc para salir.';
  else if(cam.mode==='walk') h.textContent=coarse?'Arrastra para mirar · flechas para andar · toca el suelo para ir allí':'Arrastra para mirar · W A S D o flechas para andar · clic en el suelo para ir allí';
  else if(cam.mode==='plan') h.textContent='Arrastra para desplazar · rueda para acercar donde apuntas · doble clic centra';
  else h.textContent='Arrastra para girar · botón derecho o Mayús para desplazar · rueda acerca hacia el cursor · doble clic centra ahí';
}

/* ---------- medir ---------- */
let measure={pts:[],line:null,dots:[]};
const mDotGeo=new THREE.SphereGeometry(.035,16,12), mMat=new THREE.MeshBasicMaterial({color:0x2F5F8F,depthTest:false});
const mLineMat=new THREE.LineBasicMaterial({color:0x2F5F8F,depthTest:false});
function clearMeasure(){ measure.dots.forEach(d=>scene.remove(d)); if(measure.line) scene.remove(measure.line); measure={pts:[],line:null,dots:[]}; }
function addMeasure(p){ if(measure.pts.length>=2) clearMeasure(); const q=p.clone(); q.y+=.01; measure.pts.push(q);
  const d=new THREE.Mesh(mDotGeo,mMat); d.renderOrder=7; d.position.copy(q); scene.add(d); measure.dots.push(d);
  if(measure.pts.length===2){ measure.line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(measure.pts),mLineMat); measure.line.renderOrder=7; scene.add(measure.line); } }

/* ---------- etiquetas ---------- */
const labels=$('labels'); const lblSel=document.createElement('div'), lblM=document.createElement('div');
lblSel.className='lbl'; lblM.className='lbl measure'; labels.append(lblSel,lblM); lblSel.hidden=lblM.hidden=true;
function place(elm,v){ const p=v.clone().project(camera); if(p.z>1||p.z<-1){elm.hidden=true;return;} const r=renderer.domElement;
  elm.style.left=((p.x+1)/2*r.clientWidth)+'px'; elm.style.top=((1-p.y)/2*r.clientHeight)+'px'; elm.hidden=false; }
function updateLabels(){
  const f=selFurn&&state.furniture.find(x=>x.id===selFurn);
  if(f){ lblSel.innerHTML=`${f.w} × ${f.d}<small>× ${f.h} cm</small>`; place(lblSel,new THREE.Vector3(f.x,Math.max(f.h/100,.1)+.25,f.z)); } else lblSel.hidden=true;
  if(measure.pts.length===2){ const [a,b]=measure.pts; lblM.textContent=fmtM(a.distanceTo(b)); place(lblM,a.clone().add(b).multiplyScalar(.5)); } else lblM.hidden=true;
}

/* ---------- bucle ---------- */
function resize(){ const w=host.clientWidth, h=host.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(host); resize();
let lastT=performance.now();
function loop(now){ requestAnimationFrame(loop); const dt=Math.min(.05,(now-lastT)/1000); lastT=now;
  stepTween(now);
  if(cam.mode==='walk'){ const w=cam.walk, sp=1.7*dt, fx=-Math.sin(w.yaw), fz=-Math.cos(w.yaw);
    w.yaw+=(walkKeys.l-walkKeys.r)*1.8*dt;
    const mv=(walkKeys.f-walkKeys.b), st=(walkKeys.sr-walkKeys.sl);
    if(mv||st){ walkMove((fx*mv - fz*st)*sp,(fz*mv + fx*st)*sp); walkTarget=null; }
    if(walkTarget){ const dx=walkTarget.x-w.x, dz=walkTarget.z-w.z, d=Math.hypot(dx,dz);
      if(d<.05) walkTarget=null; else { const s=Math.min(d,2.2*dt), bx=w.x, bz=w.z; walkMove(dx/d*s,dz/d*s);
        if(Math.hypot(w.x-bx,w.z-bz)<s*.2) walkTarget=null; } } }
  if(selBox.visible && blockedT && performance.now()-blockedT>600){ blockedT=0; selBox.material.color.set(0x2F5F8F); }
  applyCam(); updateLabels(); renderer.render(scene,camera); }

/* =========================================================================
   Panel: superficies
   ========================================================================= */
let selSurf='walls:exterior';
function surfLabel(key){ if(key==='walls:exterior') return 'Fachada exterior'; const [t,id]=key.split(':'); return (t==='floor'?'Suelo':'Paredes')+' · '+(ROOM[id]?.label||id); }
const surfSel=$('surfSel');
surfSel.onchange=()=>selectSurface(surfSel.value);
function highlight(key,on){ const m=surfMats[key]; if(m){ m.emissive=new THREE.Color(on?0x2F5F8F:0x000000); m.emissiveIntensity=on?.18:0; }
  const id=key.split(':')[1]; if(key.startsWith('floor:') && outlines[id]) outlines[id].visible=on; }
function selectSurface(key){ highlight(selSurf,false); selSurf=key; highlight(key,true); surfSel.value=key; renderSurfPanel(); }
function renderSurfPanel(){
  const spec=state.materials[selSurf]; const isFloor=selSurf.startsWith('floor:');
  if(!spec) return;
  $('surfTitle').textContent=surfLabel(selSurf);
  $('presetTitle').textContent=isFloor?'Materiales de suelo':'Materiales de pared';
  const pres=$('presets'); pres.innerHTML='';
  Object.entries(PRESETS).filter(([,p])=>p.kind==='both'||p.kind===(isFloor?'floor':'wall')).forEach(([k,p])=>{
    const b=document.createElement('button'); b.className='sw'; b.setAttribute('aria-pressed',spec.kind==='preset'&&spec.key===k);
    b.innerHTML=`<span class="img" style="background-image:url(${presetThumb(k)})"></span><span class="name"></span>`; b.querySelector('.name').textContent=p.n;
    b.onclick=()=>setSpec(selSurf,{kind:'preset',key:k,size:p.size}); pres.appendChild(b); });
  const lib=$('photoLib'); lib.innerHTML='';
  state.photos.forEach(ph=>{ const b=document.createElement('button'); b.className='sw';
    b.setAttribute('aria-pressed',spec.kind==='photo'&&spec.ref===ph.ref);
    b.innerHTML=`<span class="img"></span><span class="name"></span>`; b.querySelector('.img').style.backgroundImage=`url("${photoURL(ph.ref)}")`;
    b.querySelector('.name').textContent=ph.name; b.title=ph.name;
    b.onclick=()=>setSpec(selSurf,{kind:'photo',ref:ph.ref,size:spec.kind==='photo'?spec.size:1}); lib.appendChild(b); });
  $('photoEmpty').hidden=state.photos.length>0;
  $('sizeIn').value=spec.size; $('sizeOut').textContent=fmtM(+spec.size);
  $('copyAll').textContent=selSurf==='walls:exterior'?'Usar en todas las paredes':(isFloor?'Usar en todos los suelos interiores':'Usar en todas las paredes interiores');
}
function setSpec(key,spec){ state.materials[key]=spec; applySurface(key); highlight(key,true); renderSurfPanel(); saveSoon(); }
$('sizeIn').addEventListener('input',()=>{ const v=+$('sizeIn').value; $('sizeOut').textContent=fmtM(v);
  const s=state.materials[selSurf]; s.size=v; const m=surfMats[selSurf]; if(m&&m.map) m.map.repeat.set(1/v,1/v); });
$('sizeIn').addEventListener('change',()=>saveSoon());
$('copyAll').onclick=()=>{ const spec=state.materials[selSurf], isFloor=selSurf.startsWith('floor:');
  Object.keys(state.materials).forEach(k=>{ if(k===selSurf) return;
    const id=k.split(':')[1], r=ROOM[id], interior=r&&!r.terrace;
    const ok = selSurf==='walls:exterior' ? k.startsWith('walls:') : (isFloor ? (k.startsWith('floor:')&&interior) : (k.startsWith('walls:')&&interior));
    if(ok){ state.materials[k]={...spec}; applySurface(k); } });
  saveSoon(); flash('copyAll','Aplicado'); };
function flash(id,txt){ const b=$(id), o=b.textContent; b.textContent=txt; b.disabled=true; setTimeout(()=>{b.disabled=false;renderSurfPanel();},900); }

/* ---------- fotos ---------- */
async function prepPhoto(file){
  const url=URL.createObjectURL(file);
  try{ const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const s=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.naturalWidth*s)); c.height=Math.max(1,Math.round(img.naturalHeight*s));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return await new Promise(r=>c.toBlob(r,'image/jpeg',.86));
  } finally { URL.revokeObjectURL(url); }
}
async function addPhoto(file){
  const msg=$('photoMsg'); msg.textContent='';
  if(!file || !/^image\//.test(file.type||'image/')){ msg.textContent='Ese archivo no es una imagen. Usa una foto JPG o PNG.'; return; }
  let blob; try{ blob=await prepPhoto(file); }catch(e){ msg.textContent='No se pudo leer la foto. Prueba con JPG o PNG (las fotos HEIC del iPhone a veces no se abren en el navegador).'; return; }
  if(!blob){ msg.textContent='No se pudo preparar la foto.'; return; }
  const ref='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  localPhotos[ref]=URL.createObjectURL(blob);
  try{ await idbPut('photo:'+ref,blob); }catch(e){ msg.textContent='No se pudo guardar la foto en este navegador; exporta el diseño para no perderla.'; }
  const name=(file.name||'Foto').replace(/\.[^.]+$/,'').slice(0,28)||'Foto';
  state.photos.unshift({ref,name});
  setSpec(selSurf,{kind:'photo',ref,size:1});
}
$('photoIn').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) addPhoto(f); });
const stage=$('stage');
stage.addEventListener('dragover',e=>{ if([...e.dataTransfer.types].includes('Files')){ e.preventDefault(); stage.classList.add('drop-on'); } });
stage.addEventListener('dragleave',e=>{ if(e.target===stage||!stage.contains(e.relatedTarget)) stage.classList.remove('drop-on'); });
stage.addEventListener('drop',e=>{ e.preventDefault(); stage.classList.remove('drop-on'); const f=e.dataTransfer.files[0]; if(!f) return;
  setNdc(e); const s=pickSurf(); if(s){ selectFurn(null); selectSurface(s.key); } showTab('surf'); addPhoto(f); });

/* =========================================================================
   Panel: muebles
   ========================================================================= */
let selFurn=null;
function newId(){ return 'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function spawnPoint(){ let x=cam.mode==='walk'?cam.walk.x-Math.sin(cam.walk.yaw)*1.5:cam.target.x, z=cam.mode==='walk'?cam.walk.z-Math.cos(cam.walk.yaw)*1.5:cam.target.z;
  if(!roomAt(x,z)){ const r=mainRoom(); if(r){ const [cx,cz]=roomCenter(r); x=cx; z=cz; } } return {x:+x.toFixed(2),z:+z.toFixed(2)}; }
function addFurn(t){ const p=spawnPoint(); const f={id:newId(),type:t.type,name:t.name,w:t.w,d:t.d,h:t.h,x:p.x,z:p.z,rot:0,color:t.color};
  if(!fitFurn(f,3)) note('No hay hueco libre cerca: colócalo tú arrastrándolo.');
  state.furniture.push(f); fRender(f); selectFurn(f.id); saveSoon(); }
function selectFurn(id){ selFurn=id; updateSelBox(); renderFurnPanel(); }
function delFurn(id){ const i=state.furniture.findIndex(x=>x.id===id); if(i<0) return; const wasModel=state.furniture[i].type==='model'; state.furniture.splice(i,1); if(wasModel) setTimeout(pruneModels,0);
  if(furnObj[id]){ furnGroup.remove(furnObj[id]); disposeTree(furnObj[id]); delete furnObj[id]; } if(selFurn===id) selectFurn(null); else renderFurnPanel(); saveSoon(); }
function rotFurn(deg){ const f=state.furniture.find(x=>x.id===selFurn); if(!f) return; const o={rot:f.rot,x:f.x,z:f.z}, was=state.collide&&collides(f);
  f.rot=((f.rot+deg)%360+540)%360-180;
  if(!was && !fitFurn(f,.6)){ Object.assign(f,o); setBlocked(true); note('Girado no cabe aquí. Sepáralo de la pared o de otros muebles.'); return; }
  fPlace(f); saveSoon(); renderFurnPanel(); }
const catEl=$('catalog');
const norm=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
CATALOG.forEach(c=>{ const d=document.createElement('div'); d.className='cat'; const h=document.createElement('h3'); h.textContent=c.group; const it=document.createElement('div'); it.className='items';
  d.append(h);
  if(c.ikea){ const p=document.createElement('p'); p.className='src'; p.innerHTML='Medidas de <a href="https://www.ikea.com/es/es/" target="_blank" rel="noopener">ikea.com/es</a> (sept. 2026). Compruébalas en la ficha antes de comprar.'; d.append(p); }
  c.items.forEach(t=>{ const b=document.createElement('button'); b.className='item'; b.dataset.q=norm(t.name+' '+c.group+' '+t.type);
    b.innerHTML='<b></b><small></small>'; b.querySelector('b').textContent=t.name; b.querySelector('small').textContent=t.type==='rug'?`${t.w} × ${t.d} cm`:`${t.w} × ${t.d} × ${t.h} cm`;
    b.onclick=()=>addFurn(t); it.appendChild(b); });
  d.append(it); catEl.appendChild(d); });
$('catQ').addEventListener('input',()=>{ const q=norm($('catQ').value.trim()); let any=false;
  catEl.querySelectorAll('.cat').forEach(c=>{ let n=0; c.querySelectorAll('.item').forEach(b=>{ const ok=!q||q.split(/\s+/).every(w=>b.dataset.q.includes(w)); b.hidden=!ok; if(ok) n++; }); c.hidden=!n; if(n) any=true; });
  $('catEmpty').hidden=any; });
$('cAdd').onclick=()=>{ const n=v=>clamp(Math.round(+v||0),1,600);
  const color={box:'#9DB0A3',table:'#9C7A55',sofa:'#6E7B8C',bed:'#8B6F55',wardrobe:'#E4DFD4',drawers:'#C9B79C',shelf:'#B08A62',rug:'#B3A792'}[$('cType').value];
  addFurn({type:$('cType').value,name:$('cName').value.trim()||'Mi mueble',w:n($('cW').value),d:n($('cD').value),h:n($('cH').value),color}); };
function renderFurnPanel(){
  const f=state.furniture.find(x=>x.id===selFurn);
  $('editBlock').hidden=!f;
  if(f){ if(document.activeElement!==$('fName')) $('fName').value=f.name;
    [['fW','w'],['fD','d'],['fH','h']].forEach(([i,k])=>{ if(document.activeElement!==$(i)) $(i).value=f[k]; });
    const isModel=f.type==='model'; $('modelRow').hidden=!isModel;
    const tpl=isModel&&modelTpl[f.model+'|'+(f.upq||0)];
    const ce=$('fColors'); ce.innerHTML=''; ce.hidden=!!(tpl&&tpl.hasMaterials);
    COLORS.forEach(c=>{ const b=document.createElement('button'); b.style.background=c; b.setAttribute('aria-label','Color '+c); b.setAttribute('aria-pressed',f.color.toLowerCase()===c.toLowerCase());
      b.onclick=()=>{ f.color=c; fRender(f); renderFurnPanel(); saveSoon(); }; ce.appendChild(b); });
    const ci=document.createElement('input'); ci.type='color'; ci.value=f.color; ci.setAttribute('aria-label','Otro color');
    ci.oninput=()=>{ f.color=ci.value; fRender(f); }; ci.onchange=()=>{ renderFurnPanel(); saveSoon(); }; ce.appendChild(ci); }
  const list=$('placedList'); list.innerHTML='';
  state.furniture.forEach(x=>{ const b=document.createElement('button'); b.setAttribute('aria-current',x.id===selFurn);
    const r=roomAt(x.x,x.z); b.innerHTML='<span></span><small></small>'; b.querySelector('span').textContent=x.name;
    b.querySelector('small').textContent=(r?ROOM[r].label+' · ':'')+`${x.w}×${x.d}`;
    b.onclick=()=>{ selectFurn(x.id); if(cam.mode!=='walk') tweenTo({target:new THREE.Vector3(x.x,0,x.z),radius:Math.min(cam.radius,7)}); };
    list.appendChild(b); });
  list.hidden=!state.furniture.length; $('placedEmpty').hidden=!!state.furniture.length;
}
let dimTimer=null;
[['fW','w'],['fD','d'],['fH','h']].forEach(([i,k])=>$(i).addEventListener('input',()=>{ const f=state.furniture.find(x=>x.id===selFurn); if(!f) return;
  const v=Math.round(+$(i).value); if(!(v>=1&&v<=600)) return; f[k]=v;
  const tpl=f.type==='model'&&$('fLock').checked&&modelTpl[f.model+'|'+(f.upq||0)];
  if(tpl){ const s=tpl.size, r=v/({w:s.x,d:s.z,h:s.y}[k]);
    ['w','d','h'].forEach(q=>{ if(q!==k){ f[q]=clamp(Math.round(({w:s.x,d:s.z,h:s.y}[q])*r),1,600); if(document.activeElement!==$({w:'fW',d:'fD',h:'fH'}[q])) $({w:'fW',d:'fD',h:'fH'}[q]).value=f[q]; } }); }
  clearTimeout(dimTimer); dimTimer=setTimeout(()=>{ if(!fitFurn(f,.8)) note('Con esas medidas choca con algo: muévelo a un sitio más amplio.'); fRender(f); renderFurnPanel(); saveSoon(); },120); }));
$('fName').addEventListener('input',()=>{ const f=state.furniture.find(x=>x.id===selFurn); if(!f) return; f.name=$('fName').value.slice(0,40); saveSoon(); renderFurnList(); });
function renderFurnList(){ clearTimeout(renderFurnList.t); renderFurnList.t=setTimeout(renderFurnPanel,300); }
$('rotL').onclick=()=>rotFurn(90); $('rotR').onclick=()=>rotFurn(-90); $('rotL15').onclick=()=>rotFurn(15); $('rotR15').onclick=()=>rotFurn(-15);
$('fDup').onclick=()=>{ const f=state.furniture.find(x=>x.id===selFurn); if(!f) return; const n={...f,id:newId(),x:+(f.x+.3).toFixed(2),z:+(f.z+.3).toFixed(2)}; fitFurn(n,3);
  state.furniture.push(n); fRender(n); selectFurn(n.id); saveSoon(); };
$('fDel').onclick=()=>selFurn&&delFurn(selFurn);
$('fUp').onclick=async()=>{ const f=state.furniture.find(x=>x.id===selFurn); if(!f||f.type!=='model') return;
  try{ const p=await parseModel(f.model); const old=modelTemplate(f.model,f.upq,p); f.upq=((f.upq||0)+1)%4; const t=modelTemplate(f.model,f.upq,p);
    const k=f.w/(old.size.x*100); f.w=clamp(Math.round(t.size.x*100*k),1,600); f.d=clamp(Math.round(t.size.z*100*k),1,600); f.h=clamp(Math.round(t.size.y*100*k),1,300);
    fitFurn(f,1); fRender(f); renderFurnPanel(); saveSoon(); }catch(e){} };
async function importModel(file){
  const name=(file.name||'Modelo').replace(/\.[^.]+$/,'').slice(0,40)||'Modelo', ext=(file.name.split('.').pop()||'').toLowerCase();
  if(!['glb','gltf','obj'].includes(ext)){ modelMsg('Formato no admitido. Usa .glb, .gltf (un solo archivo) u .obj.'); return; }
  if(file.size>60*1024*1024){ modelMsg('El modelo pesa más de 60 MB; busca una versión más ligera.'); return; }
  const ref='m_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  modelBufs[ref]={buf:await file.arrayBuffer(),ext,name};
  let p; try{ p=await parseModel(ref); }catch(e){ delete modelBufs[ref]; delete modelParsed[ref];
    modelMsg(ext==='gltf'?'Ese .gltf usa archivos aparte. Expórtalo como .glb (un solo archivo).':'No se pudo abrir el modelo. Si es .glb con compresión Draco, expórtalo sin ella.'); return; }
  const t=modelTemplate(ref,0,p), M=Math.max(t.size.x,t.size.y,t.size.z);
  const unit= M>1000?0.001 : M>20?0.01 : 1;         // mm, cm o m
  const cm=v=>clamp(Math.round(v*unit*100),1,600);
  try{ await idbPut('model:'+ref,{buf:modelBufs[ref].buf,ext,name}); }catch(e){ modelMsg('No se pudo guardar el modelo en este navegador; exporta el diseño para no perderlo.'); }
  const sp=spawnPoint();
  const f={id:newId(),type:'model',model:ref,upq:0,name,w:cm(t.size.x),d:cm(t.size.z),h:clamp(Math.round(t.size.y*unit*100),1,300),x:sp.x,z:sp.z,rot:0,color:'#B8B2A7'};
  if(!fitFurn(f,3)) note('No hay hueco libre cerca: colócalo tú arrastrándolo.');
  state.furniture.push(f); fRender(f); selectFurn(f.id); saveSoon();
  modelMsg(`Importado con ${f.w} × ${f.d} × ${f.h} cm. Si no es su tamaño real, escribe el ancho correcto.`);
}
$('modelIn').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) importModel(f); });
function pruneModels(){ const used=new Set(state.furniture.filter(f=>f.type==='model').map(f=>f.model));
  Object.keys(modelBufs).forEach(r=>{ if(!used.has(r)){ delete modelBufs[r]; delete modelParsed[r]; Object.keys(modelTpl).forEach(k=>k.startsWith(r+'|')&&delete modelTpl[k]); idbDel('model:'+r).catch(()=>{}); } }); }
$('fDone').onclick=()=>selectFurn(null);
let noteT=null; function note(t){ const m=$('furnMsg'); m.textContent=t; clearTimeout(noteT); noteT=setTimeout(()=>m.textContent='',4500); }
$('collideIn').addEventListener('change',()=>{ state.collide=$('collideIn').checked; saveSoon(); });

/* ---------- pestañas ---------- */
function showTab(t){ const s=t==='surf'; $('tabSurf').setAttribute('aria-selected',s); $('tabFurn').setAttribute('aria-selected',!s); $('paneSurf').hidden=!s; $('paneFurn').hidden=s; }
$('tabSurf').onclick=()=>showTab('surf'); $('tabFurn').onclick=()=>showTab('furn');
