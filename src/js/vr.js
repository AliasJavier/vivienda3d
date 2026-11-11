/* =========================================================================
   Modo VR (WebXR) — pensado para Meta Quest 2 y su navegador
   - escala real 1:1, altura real de los ojos (suelo de las gafas = suelo de la casa)
   - gatillo apuntando al suelo: teletransporte al soltar
   - gatillo apuntando a un mueble: lo agarras y lo arrastras por el suelo (con choques)
   - joystick izquierdo: andar · joystick derecho: girar a saltos de 30°
   - con un mueble agarrado, el joystick de ese mando lo gira
   Necesita contexto seguro: https:// o http://localhost
   ========================================================================= */
const rig=new THREE.Group(); scene.add(rig);          // "cuerpo" del jugador: se mueve el rig, las gafas mueven la cámara dentro
const vrRay=new THREE.Raycaster(); vrRay.far=12;
const VR_UP=new THREE.Vector3(0,1,0);
const vrMarker=new THREE.Mesh(new THREE.RingGeometry(.16,.21,40),new THREE.MeshBasicMaterial({color:0x4FC3F7,transparent:true,opacity:.9,depthTest:false,side:THREE.DoubleSide}));
vrMarker.rotation.x=-Math.PI/2; vrMarker.renderOrder=9; vrMarker.visible=false; scene.add(vrMarker);
const vrLineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1)]);

/* cartel en la muñeca izquierda: estancia actual y ayuda */
const vrHud={cv:document.createElement('canvas'),last:''};
vrHud.cv.width=512; vrHud.cv.height=256; vrHud.tex=new THREE.CanvasTexture(vrHud.cv);
vrHud.sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:vrHud.tex,transparent:true,depthTest:false}));
vrHud.sprite.scale.set(.2,.1,1); vrHud.sprite.position.set(0,.09,-.04); vrHud.sprite.renderOrder=10;
function vrHudDraw(title,sub){ const key=title+'|'+sub; if(key===vrHud.last) return; vrHud.last=key;
  const x=vrHud.cv.getContext('2d'); x.clearRect(0,0,512,256);
  x.fillStyle='rgba(20,26,30,.82)'; x.beginPath(); if(x.roundRect) x.roundRect(4,4,504,248,28); else x.rect(4,4,504,248); x.fill();
  x.fillStyle='#fff'; x.textAlign='center'; x.font='600 54px system-ui, sans-serif'; x.fillText(title.slice(0,18),256,82);
  x.fillStyle='#9fd3f5'; x.font='500 40px system-ui, sans-serif'; x.fillText(sub,256,138);
  x.fillStyle='#c9d1d6'; x.font='400 25px system-ui, sans-serif';
  x.fillText('Gatillo: ir allí / coger mueble',256,190); x.fillText('Izq.: andar · Dcha.: girar',256,224);
  vrHud.tex.needsUpdate=true; }

const vrCtrl=[0,1].map(i=>{
  const c=renderer.xr.getController(i); rig.add(c);
  const line=new THREE.Line(vrLineGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.7})); line.visible=false; c.add(line);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),new THREE.MeshBasicMaterial({color:0x4FC3F7})); tip.visible=false; c.add(tip);
  const st={c,line,tip,hand:'',src:null,held:false,grab:null,target:null,turned:false,spun:false};
  c.addEventListener('connected',e=>{ st.src=e.data; st.hand=e.data&&e.data.handedness||''; line.visible=tip.visible=true; if(st.hand==='left') c.add(vrHud.sprite); });
  c.addEventListener('disconnected',()=>{ st.src=null; line.visible=tip.visible=false; st.held=false; st.grab=null; });
  c.addEventListener('selectstart',()=>{ st.held=true; const h=vrAim(st);
    if(h&&h.furn){ const f=state.furniture.find(x=>x.id===h.furn);
      if(f){ const p=vrFloorPoint(); st.grab={id:f.id,ox:p?f.x-p.x:0,oz:p?f.z-p.z:0}; selectFurn(f.id); } } });
  c.addEventListener('selectend',()=>{ st.held=false;
    if(st.grab){ st.grab=null; saveSoon(); renderFurnList(); return; }
    if(st.target){ vrTeleport(st.target.x,st.target.z); st.target=null; } });
  return st;
});

/* rayo del mando: primero muebles, luego suelos */
function vrSetRay(st){ const m=st.c.matrixWorld; vrRay.ray.origin.setFromMatrixPosition(m); vrRay.ray.direction.set(0,0,-1).transformDirection(m); }
function vrFloorPoint(){ const d=vrRay.ray.direction, o=vrRay.ray.origin; if(d.y>-0.02) return null; const t=-o.y/d.y; if(t>14) return null; return {x:o.x+d.x*t,z:o.z+d.z*t,dist:t}; }
function vrAim(st){ vrSetRay(st);
  const hf=vrRay.intersectObjects(furnGroup.children,true)[0];
  const hs=vrRay.intersectObjects(floorMeshes,false)[0];
  if(hf&&(!hs||hf.distance<hs.distance)){ let o=hf.object, id=null; while(o&&!id){ id=o.userData&&o.userData.furn; o=o.parent; } if(id) return {furn:id,dist:hf.distance}; }
  if(hs) return {floor:true,x:hs.point.x,z:hs.point.z,dist:hs.distance};
  return null; }

/* posición de la cabeza en planta */
const vrTmp=new THREE.Vector3();
function vrHeadOffset(){ return vrTmp.set(camera.position.x,0,camera.position.z).applyAxisAngle(VR_UP,rig.rotation.y); }
function vrHead(){ const o=vrHeadOffset(); return {x:rig.position.x+o.x,z:rig.position.z+o.z}; }
function vrTeleport(x,z){ const o=vrHeadOffset(); rig.position.set(x-o.x,0,z-o.z); }
function vrTurn(a){ const h=vrHead(); rig.rotation.y+=a; vrTeleport(h.x,h.z); }
function vrMove(dx,dz){ const h=vrHead();
  if(walkBlocked(h.x,h.z)||!walkBlocked(h.x+dx,h.z+dz)){ rig.position.x+=dx; rig.position.z+=dz; return; }   // si ya estás dentro de un muro, deja salir
  if(dx&&!walkBlocked(h.x+dx,h.z)){ rig.position.x+=dx; return; }
  if(dz&&!walkBlocked(h.x,h.z+dz)) rig.position.z+=dz; }
function vrAxes(st){ const g=st.src&&st.src.gamepad; if(!g||!g.axes) return [0,0]; const a=g.axes;
  const x=a.length>=4?a[2]:(a[0]||0), y=a.length>=4?a[3]:(a[1]||0); return [Math.abs(x)>.15?x:0, Math.abs(y)>.15?y:0]; }

/* una vez por fotograma mientras se está en VR */
const vrFwd=new THREE.Vector3();
function vrUpdate(dt){
  vrMarker.visible=false;
  for(const st of vrCtrl){ if(!st.src) continue;
    const [ax,ay]=vrAxes(st);
    // mueble agarrado: sigue al punto del suelo al que apuntas
    if(st.grab){ const f=state.furniture.find(x=>x.id===st.grab.id); vrSetRay(st); const p=vrFloorPoint();
      if(f&&p){ const free=slideTo(f,+(p.x+st.grab.ox).toFixed(3),+(p.z+st.grab.oz).toFixed(3)); setBlocked(!free&&state.collide); fPlace(f); st.line.scale.z=p.dist; st.tip.position.z=-p.dist; }
      if(f&&Math.abs(ax)>.6){ if(!st.spun){ st.spun=true; rotFurn(ax>0?-15:15); } } else st.spun=false;
      continue; }
    const h=vrAim(st); const d=h?h.dist:5; st.line.scale.z=d; st.tip.position.z=-d;
    st.line.material.color.set(h&&h.furn?0xFFD54F:0xffffff);
    st.target=null;
    if(st.held&&h&&h.floor&&roomAt(h.x,h.z)&&!walkBlocked(h.x,h.z)){ st.target={x:h.x,z:h.z}; vrMarker.position.set(h.x,.02,h.z); vrMarker.visible=true; }
    if(st.hand==='left'){ // andar, relativo a donde miras
      if(ax||ay){ camera.getWorldDirection(vrFwd); vrFwd.y=0; if(vrFwd.lengthSq()>1e-6){ vrFwd.normalize(); const sp=1.6*dt, fx=vrFwd.x, fz=vrFwd.z;
        vrMove((fx*-ay + -fz*ax)*sp,(fz*-ay + fx*ax)*sp); } } }
    else { // girar a saltos
      if(Math.abs(ax)>.6){ if(!st.turned){ st.turned=true; vrTurn(ax>0?-Math.PI/6:Math.PI/6); } } else if(Math.abs(ax)<.3) st.turned=false; }
  }
  if(selBox.visible && blockedT && performance.now()-blockedT>600){ blockedT=0; selBox.material.color.set(0x2F5F8F); }
  const h=vrHead(), id=roomAt(h.x,h.z), r=id&&ROOM[id];
  vrHudDraw(r?r.label:'Exterior', r&&r.m2?fmtN(r.m2)+' m²':'');
}

/* entrar y salir */
let vrPrev=null;
function vrStart(session){
  VR.on=true; VR.session=session; vrPrev={low,shadow:sun.castShadow};
  if(low) setLow(false);
  sun.castShadow=false;                      // sin sombras dinámicas: las Quest 2 van justas
  lblSel.hidden=lblM.hidden=true; tween=null; walkTarget=null;
  // punto de partida: donde estabas paseando, o el centro de la estancia principal
  let x=cam.target.x, z=cam.target.z, yaw=cam.theta;
  if(cam.mode==='walk'){ x=cam.walk.x; z=cam.walk.z; yaw=cam.walk.yaw; }
  if(cam.mode!=='walk'||!roomAt(x,z)){ const r=mainRoom(); if(r){ const c=roomCenter(r); x=c[0]; z=c[1]; } }
  const p=findFree((a,b)=>!walkBlocked(a,b),x,z,3); if(p){ x=p[0]; z=p[1]; }
  camera.position.set(0,1.6,0); camera.rotation.set(0,0,0); rig.add(camera);
  rig.position.set(x,0,z); rig.rotation.set(0,yaw,0);
  vrHud.last=''; $('tVR').textContent='Salir de VR';
}
function vrEnd(){
  const h=vrHead(), yaw=rig.rotation.y;
  VR.on=false; VR.session=null; vrMarker.visible=false;
  rig.remove(camera); vrCtrl.forEach(st=>{ st.held=false; st.grab=null; st.target=null; });
  if(vrPrev){ sun.castShadow=vrPrev.shadow; if(vrPrev.low) setLow(true); vrPrev=null; }
  // al volver al escritorio, sigue en modo paseo donde lo dejaste
  if(cam.mode!=='walk') setMode('walk'); cam.walk.x=h.x; cam.walk.z=h.z; cam.walk.yaw=yaw; cam.walk.pitch=0;
  $('tVR').textContent='Entrar en VR'; resize(); applyCam();
}
async function vrToggle(){
  if(VR.session){ VR.session.end(); return; }
  try{
    const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
    session.addEventListener('end',vrEnd);
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session);
    vrStart(session);
  }catch(e){ console.error(e); $('hint').textContent='No se pudo iniciar la realidad virtual en este dispositivo.'; }
}
$('tVR').onclick=vrToggle;
if(navigator.xr&&navigator.xr.isSessionSupported){
  navigator.xr.isSessionSupported('immersive-vr').then(ok=>{ VR.supported=!!ok; $('tVR').hidden=!ok; }).catch(()=>{});
}
