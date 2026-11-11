/* =========================================================================
   Entorno exterior: lo que se ve por las ventanas y desde las terrazas
   - lado de la urbanización: jardín, piscina, pádel, juegos, bloques alrededor
   - lado de la calle: aceras, carril bici, avenida con mediana, coches, autobús,
     peatones, bloques de enfrente, una obra con grúa (barrio nuevo)
   Es un decorado genérico de barrio nuevo de Madrid (estilo Los Berrocales),
   no una reproducción de la parcela real.
   Todo se construye en un sistema local: z = hacia fuera de la fachada, x = a lo largo.
   ========================================================================= */
const extGroup=new THREE.Group(); extGroup.visible=false; scene.add(extGroup);
const EXT={actors:[],waters:[],sig:'',mats:{},tex:{}};
const EXT_K=.6;
const EXT_DIR={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]}, EXT_OPP={n:'s',s:'n',w:'e',e:'w'};
function extCfg(){ return Object.assign({on:true,floor:2,pool:'auto',street:'auto'},state.exterior||{}); }

/* ---------- utilidades ---------- */
function extRand(seed){ let s=seed>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function extMat(color,opts){ const k=color+JSON.stringify(opts||''); if(!EXT.mats[k]){ EXT.mats[k]=new THREE.MeshLambertMaterial(Object.assign({color},opts||{})); EXT.mats[k].color.multiplyScalar(EXT_K); }   // la luz de la escena es intensa: se atenúa el color
  return EXT.mats[k]; }
function extBox(g,w,h,d,x,y,z,mat,ry){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); if(ry) m.rotation.y=ry; g.add(m); return m; }
function extPlane(g,w,d,x,y,z,mat){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); g.add(m); return m; }
function extCanvasTex(key,w,h,draw,rx,ry){ if(!EXT.tex[key]){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; EXT.tex[key]=t; }
  const t=EXT.tex[key].clone(); t.needsUpdate=true; t.repeat.set(rx||1,ry||1); return t; }

/* fachadas: una planta y un vano por repetición */
const EXT_STYLES=[
  {wall:'#ECE9E2',band:'#D8D4CA',win:'#3D4A57',acc:'#8C6E4F'},   // blanco con paneles tono madera
  {wall:'#D9D5CC',band:'#BDB8AC',win:'#34404B',acc:'#59636B'},   // gris claro
  {wall:'#C9B8A3',band:'#B09A80',win:'#3A4550',acc:'#E8E4DC'},   // ladrillo claro
  {wall:'#F2F0EB',band:'#E3DFD6',win:'#44525F',acc:'#4E6B5A'},   // blanco con verde
];
function extFacadeMat(style,len,floors){
  const st=EXT_STYLES[style%EXT_STYLES.length];
  const tex=extCanvasTex('fac'+style,256,128,(x,w,h)=>{
    x.fillStyle=st.wall; x.fillRect(0,0,w,h);
    x.fillStyle=st.band; x.fillRect(0,h-14,w,14);                       // canto de forjado
    x.fillStyle=st.acc; x.fillRect(118,10,20,h-24);                     // panel entre vanos
    [[14,92],[150,92]].forEach(([px,pw])=>{ x.fillStyle=st.win; x.fillRect(px,22,pw,h-52);
      x.fillStyle='rgba(255,255,255,.28)'; x.fillRect(px+4,26,pw/2-6,h-60);
      x.strokeStyle='#F5F5F2'; x.lineWidth=3; x.strokeRect(px,22,pw,h-52); x.beginPath(); x.moveTo(px+pw/2,22); x.lineTo(px+pw/2,h-30); x.stroke(); });
    x.fillStyle='rgba(190,215,225,.55)'; x.fillRect(8,h-44,104,28);    // barandilla de vidrio de una terraza
    x.fillStyle='#9AA3A8'; x.fillRect(8,h-46,104,3);
  },Math.max(1,Math.round(len/7)),floors);
  return new THREE.MeshLambertMaterial({map:tex,color:0xA6A6A6});
}
function extBlock(g,x,z,len,dep,floors,style,ry){
  const h=floors*3.05+.6, m=extBox(g,len,h,dep,x,h/2,z,extFacadeMat(style,len,floors),ry);
  extBox(g,len+.3,.5,dep+.3,x,h+.25,z,extMat(0xD6D2C8),ry);   // peto de cubierta
  extBox(g,len+.05,3.3,dep+.05,x,1.65,z,extMat(0x8E8A82),ry); // zócalo de planta baja
  return m;
}

/* árboles en una sola malla por tipo */
function extTrees(g,list){ if(!list.length) return;
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.13,1,6),extMat(0x6B5138),list.length);
  const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),extMat(0x5E8C4A),list.length);
  const o=new THREE.Object3D();
  list.forEach(([x,z,s],i)=>{ s=s||1; o.rotation.set(0,i*1.7,0);
    o.position.set(x,1.1*s,z); o.scale.set(s,2.2*s,s); o.updateMatrix(); trunk.setMatrixAt(i,o.matrix);
    o.position.set(x,2.2*s+1.1*s,z); o.scale.set(1.25*s,1.45*s,1.25*s); o.updateMatrix(); crown.setMatrixAt(i,o.matrix); });
  g.add(trunk,crown); }

/* ---------- personas ---------- */
const EXT_SHIRT=[0xC0392B,0x2E86C1,0xF4D03F,0x27AE60,0xECF0F1,0x8E44AD,0xE67E22,0x34495E,0xE91E63,0x16A085];
const EXT_PANTS=[0x2C3E50,0x1B2631,0x5D6D7E,0x7B5E3B,0x34495E,0xBDC3C7];
const EXT_SKIN=[0xF1C9A5,0xE0AC86,0xC68E65,0x8D5A3B,0xF5D5BC];
let extGeo=null;
function extGeos(){ if(extGeo) return extGeo;
  const leg=new THREE.BoxGeometry(.13,.8,.15); leg.translate(0,-.4,0);
  extGeo={torso:new THREE.BoxGeometry(.38,.62,.22),head:new THREE.SphereGeometry(.115,10,8),leg,
    wheel:new THREE.CylinderGeometry(.33,.33,1.75,12)};
  extGeo.wheel.rotateX(Math.PI/2); return extGeo; }
function extPerson(g,rnd,scale){ const G=extGeos(), p=new THREE.Group(), sk=extMat(EXT_SKIN[Math.floor(rnd()*EXT_SKIN.length)]);
  const torso=new THREE.Mesh(G.torso,extMat(EXT_SHIRT[Math.floor(rnd()*EXT_SHIRT.length)])); torso.position.y=1.11; p.add(torso);
  const head=new THREE.Mesh(G.head,sk); head.position.y=1.56; p.add(head);
  const pm=extMat(EXT_PANTS[Math.floor(rnd()*EXT_PANTS.length)]), legs=[-.1,.1].map(x=>{ const l=new THREE.Mesh(G.leg,pm); l.position.set(x,.8,0); p.add(l); return l; });
  p.scale.setScalar(scale||(.94+rnd()*.12)); g.add(p); return {g:p,legs}; }
// camina por una ruta (cerrada o de ida y vuelta entre -lim y +lim en x)
function extWalker(g,rnd,pts,speed,scale,loop){ const P=extPerson(g,rnd,scale), seg=[]; let total=0;
  for(let i=0;i<pts.length-(loop?0:1);i++){ const a=pts[i], b=pts[(i+1)%pts.length], l=Math.hypot(b[0]-a[0],b[1]-a[1]); seg.push({a,b,l,s0:total}); total+=l; }
  EXT.actors.push({kind:'walk',P,seg,total,s:rnd()*total,speed,loop}); }
function extWalkStep(a,dt){ a.s+=a.speed*dt; let s=a.s%a.total; if(s<0) s+=a.total;
  let back=false; if(!a.loop){ const u=a.s%(2*a.total), uu=u<0?u+2*a.total:u; back=uu>a.total; s=back?2*a.total-uu:uu; }
  let sg=a.seg[a.seg.length-1]; for(const q of a.seg){ if(s<=q.s0+q.l){ sg=q; break; } }
  const t=sg.l?(s-sg.s0)/sg.l:0, x=sg.a[0]+(sg.b[0]-sg.a[0])*t, z=sg.a[1]+(sg.b[1]-sg.a[1])*t, k=back?-1:1;
  a.P.g.position.set(x,0,z); a.P.g.rotation.y=Math.atan2((sg.b[0]-sg.a[0])*k,(sg.b[1]-sg.a[1])*k);
  const sw=Math.sin(a.s*4.4)*.55*Math.min(1,a.speed/1.2); a.P.legs[0].rotation.x=sw; a.P.legs[1].rotation.x=-sw; }

/* ---------- vehículos ---------- */
const EXT_CAR=[0xE8E8E8,0x1F1F1F,0x9B9B9B,0xB0291E,0x1F4E79,0x6E7B6C,0xD9D2C0,0x33475B];
function extCar(g,color,kind){ const c=new THREE.Group(), G=extGeos();
  if(kind==='bus'){ extBox(c,11.6,2.5,2.5,0,1.75,0,extMat(0x1565C0)); extBox(c,11.3,.95,2.52,0,2.35,0,extMat(0x22303C)); extBox(c,11.6,.25,2.5,0,3.1,0,extMat(0xF2F2F2));
    [-3.9,3.6].forEach(x=>{ const w=new THREE.Mesh(G.wheel,extMat(0x161616)); w.scale.set(1.45,1.45,1.4); w.position.set(x,.48,0); c.add(w); }); }
  else { extBox(c,4.3,.72,1.78,0,.72,0,extMat(color)); extBox(c,2.3,.6,1.6,-.2,1.36,0,extMat(0x26323C)); extBox(c,2.36,.07,1.66,-.2,1.69,0,extMat(color));
    [-1.35,1.35].forEach(x=>{ const w=new THREE.Mesh(G.wheel,extMat(0x161616)); w.position.set(x,.33,0); c.add(w); }); }
  g.add(c); return c; }

/* ---------- lado de la urbanización ---------- */
function extCourtyard(g,x0,x1,tx,rnd){
  const D=48, W=x1-x0, cx=(x0+x1)/2;
  extPlane(g,W,D,cx,.02,D/2,extMat(0x86AD68));                                   // césped
  extPlane(g,W,2.6,cx,.04,2.3,extMat(0xD3CCBD));                                 // paseo junto a la fachada
  const px=clamp(tx,x0+13,x1-13), pz=17;                                         // piscina, centrada frente a la terraza
  extPlane(g,23,14,px,.05,pz,extMat(0xE4DDCF));                                  // playa de la piscina
  extPlane(g,2.2,pz-10,px,.045,(pz-7+3.6)/2,extMat(0xD3CCBD));                   // camino hasta el paseo
  const wt=extCanvasTex('agua',256,256,(x,w,h)=>{ x.fillStyle='#3FB6D9'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(255,255,255,.5)'; x.lineWidth=3;
    for(let i=0;i<26;i++){ const a=(i*97)%w, b=(i*53)%h; x.beginPath(); x.moveTo(a,b); x.bezierCurveTo(a+30,b+14,a+50,b-14,a+84,b+6); x.stroke(); }
    x.strokeStyle='rgba(20,110,160,.35)'; for(let i=0;i<14;i++){ const a=(i*61)%w, b=(i*131)%h; x.beginPath(); x.moveTo(a,b); x.bezierCurveTo(a+24,b-12,a+44,b+12,a+70,b-4); x.stroke(); } },3,1.5);
  const wm=new THREE.MeshBasicMaterial({map:wt,transparent:true,opacity:.93});
  const water=extPlane(g,15,7,px-1.5,.1,pz,wm); EXT.waters.push(wt);
  [[15.6,.3,px-1.5,pz-3.65],[15.6,.3,px-1.5,pz+3.65]].forEach(([w,d,x,z])=>extBox(g,w,.14,d,x,.09,z,extMat(0xF4F1EA)));
  [[.3,7.6,px-9.15,pz],[.3,7.6,px+6.15,pz]].forEach(([w,d,x,z])=>extBox(g,w,.14,d,x,.09,z,extMat(0xF4F1EA)));
  const wt2=wt.clone(); wt2.needsUpdate=true; wt2.repeat.set(.8,.8); EXT.waters.push(wt2);
  extPlane(g,3.4,3.4,px+8.8,.1,pz-1.2,new THREE.MeshBasicMaterial({map:wt2,transparent:true,opacity:.93}));      // piscina infantil
  extBox(g,3.9,.12,3.9,px+8.8,.06,pz-1.2,extMat(0xF4F1EA));
  // tumbonas y sombrillas
  for(let i=0;i<7;i++){ const x=px-9+i*3, z=pz+5.6; extBox(g,.7,.28,1.9,x,.2,z,extMat(0xFAFAF7)); extBox(g,.7,.5,.12,x,.5,z+.9,extMat(0xFAFAF7));
    if(i%2===0){ extBox(g,.07,2.2,.07,x+1.1,1.1,z,extMat(0x8A8A8A)); const u=new THREE.Mesh(new THREE.ConeGeometry(1.5,.55,10),extMat([0xE9573F,0xF6BB42,0x4A89DC][i%3])); u.position.set(x+1.1,2.35,z); g.add(u); } }
  extBox(g,.1,2.2,.1,px-10.3,1.1,pz-5.5,extMat(0xB0B5B8)); extBox(g,.5,.08,.5,px-10.3,2.2,pz-5.5,extMat(0xB0B5B8));  // ducha
  // vallado de la piscina
  [[23,px,pz-7],[23,px,pz+7]].forEach(([w,x,z])=>extBox(g,w,1.1,.05,x,.6,z,extMat(0xBFD9E0,{transparent:true,opacity:.35})));
  // pista de pádel y juegos infantiles, en el lado contrario a la calle si caben
  const side=(px-x0>x1-px)?-1:1, qx=px+side*19;
  if(qx-6>x0&&qx+6<x1){
    extPlane(g,10,20,qx,.06,pz+1,extMat(0x2F6FB0)); extBox(g,10,.9,.04,qx,.5,pz+1,extMat(0xF2F2F2));
    [[10,.08,qx,pz-9],[10,.08,qx,pz+11]].forEach(([w,d,x,z])=>extBox(g,w,3,d,x,1.5,z,extMat(0xCFE6EE,{transparent:true,opacity:.3})));
    [[-5],[5]].forEach(([dx])=>extBox(g,.08,3,20,qx+dx,1.5,pz+1,extMat(0xCFE6EE,{transparent:true,opacity:.22})));
    for(let i=0;i<4;i++){ const P=extPerson(g,rnd); const bx=qx+(i%2?2.3:-2.3), bz=pz+1+(i<2?-5:5); P.g.rotation.y=i<2?0:Math.PI;
      EXT.actors.push({kind:'shuffle',P,bx,bz,ph:rnd()*6,amp:1.6}); }
    const jx=qx, jz=pz+19; if(jz+5<D){
      extPlane(g,11,8,jx,.05,jz,extMat(0xE3C98F));                                // arenero
      [[-2.2],[2.2]].forEach(([dx])=>{ extBox(g,.1,2.4,.1,jx-3+dx*.5,1.2,jz-1.6,extMat(0xD9534F)); extBox(g,.1,2.4,.1,jx-3+dx*.5,1.2,jz+1.6,extMat(0xD9534F)); });
      extBox(g,.1,.1,3.4,jx-3,2.4,jz,extMat(0xD9534F)); extBox(g,.5,.06,.25,jx-3,.6,jz-.7,extMat(0x333333)); extBox(g,.5,.06,.25,jx-3,.6,jz+.7,extMat(0x333333));
      extBox(g,1.2,1.5,1.2,jx+2.5,.75,jz-1,extMat(0x4A89DC)); const sl=extBox(g,.7,.06,3,jx+2.5,.8,jz+1.2,extMat(0xF6BB42)); sl.rotation.x=.48;
      const loop=[[jx-5,jz-3.6],[jx+5,jz-3.6],[jx+5,jz+3.6],[jx-5,jz+3.6]];
      for(let i=0;i<3;i++) extWalker(g,rnd,loop,2.6+rnd()*.8,.62+rnd()*.08,true);
      for(let i=0;i<2;i++){ const P=extPerson(g,rnd); P.g.position.set(jx-6.6+i*.9,0,jz-1+i*.8); P.g.rotation.y=Math.PI/2+i*.5; EXT.actors.push({kind:'idle',P,ph:rnd()*6,ry:P.g.rotation.y}); }
    }
  }
  // gente: paseando alrededor de la piscina y por el paseo, nadando, tomando el sol, charlando
  const ring=[[px-10.6,pz-6],[px+10.6,pz-6],[px+10.6,pz+4.6],[px-10.6,pz+4.6]];
  for(let i=0;i<3;i++) extWalker(g,rnd,i%2?ring.slice().reverse():ring,.9+rnd()*.4,0,true);
  for(let i=0;i<3;i++) extWalker(g,rnd,[[x0+3,1.7+i*.5],[x1-3,1.7+i*.5]],1.1+rnd()*.4,0,false);
  for(let i=0;i<4;i++){ const h=new THREE.Mesh(extGeos().head,extMat(EXT_SKIN[i%EXT_SKIN.length])); g.add(h);
    EXT.actors.push({kind:'swim',m:h,x0:px-8,x1:px+5,z:pz-2.4+i*1.6,s:rnd()*20,speed:.5+rnd()*.5}); }
  for(let i=0;i<4;i++){ const P=extPerson(g,rnd); P.g.rotation.x=-Math.PI/2; P.g.position.set(px-9+(i*2+1)*3-3,.52,pz+6.5); P.legs[0].rotation.x=P.legs[1].rotation.x=0; }
  for(let i=0;i<2;i++){ const P=extPerson(g,rnd); P.g.position.set(px+8.8+(i?-.5:.5),0,pz+2.6); P.g.rotation.y=i?Math.PI/2:-Math.PI/2; EXT.actors.push({kind:'idle',P,ph:rnd()*6,ry:P.g.rotation.y}); }
  // arbolado y palmeras bajas
  const trees=[]; for(let i=0;i<34;i++){ const x=x0+2+rnd()*(W-4), z=5+rnd()*(D-8);
    if(Math.abs(x-px)<13&&Math.abs(z-pz)<9) continue; if(Math.abs(x-qx)<7&&z>pz-11&&z<pz+25) continue; trees.push([x,z,.8+rnd()*.7]); }
  extTrees(g,trees);
  // bloques de la propia urbanización cerrando el jardín
  extBlock(g,cx,D+7,W+10,14,6,0);
  const far=(px-x0>x1-px)?x0:x1;      // lado contrario a la calle: otro bloque; hacia la calle: seto y valla
  return {D,far};
}

/* ---------- lado de la calle ---------- */
function extStreet(g,rnd,quality){
  const LEN=300, H=LEN/2;
  extPlane(g,LEN,2.2,0,.1,-.1,extMat(0x6F9A5B));                                 // jardinera junto a la fachada
  extPlane(g,LEN,5,0,.12,3.5,extMat(0xC4C0B8));                                  // acera
  extBox(g,LEN,.14,.25,0,.07,6.1,extMat(0x9E9A93));                              // bordillo
  extPlane(g,LEN,1.6,0,.035,6.9,extMat(0xA85640));                               // carril bici
  extPlane(g,LEN,2.3,0,.03,8.85,extMat(0x4A4D52));                               // aparcamiento en línea
  const road=(z)=>extPlane(g,LEN,7,0,.03,z,new THREE.MeshLambertMaterial({map:extCanvasTex('asfalto',128,128,(x,w,h)=>{ x.fillStyle='#3F4247'; x.fillRect(0,0,w,h);
      x.fillStyle='#E8E8E8'; x.fillRect(0,h/2-2,w*.55,4); x.fillStyle='#D8D8D8'; x.fillRect(0,2,w,3); x.fillRect(0,h-5,w,3); },LEN/6,1),color:0xA6A6A6}));
  road(13.5); road(24.5);
  extPlane(g,LEN,4,0,.1,19,extMat(0x7FA466)); extBox(g,LEN,.16,.2,0,.08,17,extMat(0x9E9A93)); extBox(g,LEN,.16,.2,0,.08,21,extMat(0x9E9A93));   // mediana ajardinada
  extPlane(g,LEN,2.3,0,.03,29.15,extMat(0x4A4D52)); extBox(g,LEN,.14,.25,0,.07,30.4,extMat(0x9E9A93));
  extPlane(g,LEN,6,0,.12,33.5,extMat(0xC4C0B8));                                 // acera de enfrente
  // paso de cebra
  const zebra=new THREE.MeshLambertMaterial({map:extCanvasTex('cebra',64,64,(x,w,h)=>{ x.fillStyle='#3F4247'; x.fillRect(0,0,w,h); x.fillStyle='#F0F0F0'; x.fillRect(0,8,w,48*.6); },1,7),color:0xA6A6A6});
  [13.5,24.5].forEach(z=>extPlane(g,4,7,14,.04,z,zebra));
  // árboles de alineación (jóvenes), farolas
  const trees=[]; for(let x=-H+6;x<H;x+=9){ trees.push([x,5.2,.75+rnd()*.25]); trees.push([x+4,31.4,.75+rnd()*.25]); if(Math.abs(x-14)>5) trees.push([x+2,19,1+rnd()*.3]); }
  extTrees(g,trees);
  for(let x=-H+10;x<H;x+=27){ [[4.9,1],[31.6,-1]].forEach(([z,k])=>{ extBox(g,.12,7.5,.12,x,3.75,z,extMat(0x5A6066)); extBox(g,.12,.1,1.6,x,7.5,z+k*.75,extMat(0x5A6066)); extBox(g,.3,.08,.5,x,7.45,z+k*1.45,extMat(0xF5F1D6)); }); }
  // bancos y papeleras
  for(let x=-H+20;x<H;x+=36){ extBox(g,1.6,.08,.45,x,.52,1.9,extMat(0x8C6E4F)); extBox(g,1.6,.4,.06,x,.75,1.65,extMat(0x8C6E4F)); extBox(g,.3,.7,.3,x+2,.47,1.8,extMat(0x4E5A60)); }
  // coches aparcados
  for(let x=-H+8;x<H-6;x+=5.6){ if(rnd()<.72&&Math.abs(x-14)>6) extCar(g,EXT_CAR[Math.floor(rnd()*EXT_CAR.length)]).position.set(x,0,8.85);
    if(rnd()<.6&&Math.abs(x-14)>6){ const c=extCar(g,EXT_CAR[Math.floor(rnd()*EXT_CAR.length)]); c.position.set(x+2,0,29.15); c.rotation.y=Math.PI; } }
  // tráfico: en España se circula por la derecha -> los carriles cercanos van hacia -x
  const lanes=[{z:11.8,dir:-1,v:10.5,n:2},{z:15.2,dir:-1,v:12.8,n:2},{z:22.8,dir:1,v:12.2,n:2},{z:26.2,dir:1,v:10,n:2}];
  lanes.forEach((ln,li)=>{ for(let i=0;i<ln.n;i++){ const bus=(li===0&&i===0), c=extCar(g,EXT_CAR[Math.floor(rnd()*EXT_CAR.length)],bus?'bus':'');
      c.rotation.y=ln.dir>0?0:Math.PI; EXT.actors.push({kind:'car',m:c,z:ln.z,dir:ln.dir,v:bus?ln.v*.8:ln.v,x:-H+((i+rnd()*.5)/ln.n)*LEN,H}); if(bus) ln.v*=.8; } });
  // ciclista
  { const P=extPerson(g,rnd); const b=new THREE.Group(); extBox(b,1.5,.06,.06,0,.55,0,extMat(0x222222)); extBox(b,.06,.5,.06,-.3,.8,0,extMat(0x222222));
    [-.55,.55].forEach(x=>{ const w=new THREE.Mesh(new THREE.TorusGeometry(.32,.03,6,16),extMat(0x111111)); w.position.set(x,.33,0); b.add(w); });
    P.g.add(b); b.rotation.y=Math.PI/2; P.g.children[0].position.y=1.25; P.g.children[1].position.y=1.7; P.legs.forEach(l=>l.position.y=.95);
    EXT.actors.push({kind:'bike',P,z:6.9,x:rnd()*LEN-H,v:5.2,H}); }
  // peatones en las dos aceras (uno pasea un perro)
  const nP=quality?9:6;
  for(let i=0;i<nP;i++){ const z=i<nP*.6?2.4+rnd()*2.2:32+rnd()*2.4, span=70+rnd()*50, c=(rnd()-.5)*60;
    extWalker(g,rnd,[[c-span,z],[c+span,z]],1.05+rnd()*.5,0,false);
    if(i===1){ const a=EXT.actors[EXT.actors.length-1]; const d=extBox(a.P.g,.2,.26,.55,.5,.3,.7,extMat(0x7B5E3B)); extBox(a.P.g,.16,.2,.2,.5,.5,1,extMat(0x7B5E3B)); a.dog=d; } }
  // bloques de enfrente; uno está en obras, con su grúa
  let x=-H+4, i=0; while(x<H-20){ const len=34+Math.floor(rnd()*16), fl=5+Math.floor(rnd()*3), cxb=x+len/2;
    if(i===2) extSite(g,cxb,45,len,rnd); else extBlock(g,cxb,44,len,15,fl,(i+1)%EXT_STYLES.length);
    x+=len+9; i++; }
}
function extSite(g,x,z,len,rnd){   // estructura de hormigón a medio levantar + grúa torre
  const m=extMat(0xA9A59C); for(let f=0;f<4;f++){ extBox(g,len,.28,14,x,3.1*(f+1),z,m); for(let px=-len/2+1;px<=len/2;px+=5.5){ extBox(g,.4,3.1,.4,x+px,3.1*f+1.55,z-6.5,m); extBox(g,.4,3.1,.4,x+px,3.1*f+1.55,z+6.5,m); } }
  extBox(g,len+6,2,.08,x,1,z-9,extMat(0x3B7A57));                                 // valla de obra
  extCrane(g,x+len/2-4,z+2,38);
}
function extCrane(g,x,z,h){ const y=extMat(0xE2B93B);
  extBox(g,1.1,h,1.1,x,h/2,z,y); extBox(g,46,1,1,x+9,h+.5,z,y); extBox(g,2.6,2.2,2,x-12,h-.6,z,extMat(0x8E8A82)); extBox(g,.9,6,.9,x,h+3.5,z,y);
  extBox(g,.05,14,.05,x+22,h-7,z,extMat(0x333333)); }

/* ---------- lejos: campo, barrio en construcción y cerros ---------- */
function extFar(g,rnd){
  const base=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),extMat(0xB9AF8E)); base.rotation.x=-Math.PI/2; base.position.y=-.02; g.add(base);
  for(let i=0;i<34;i++){ const a=rnd()*Math.PI*2, r=150+rnd()*230, w=22+rnd()*34, h=12+rnd()*16;
    extBox(g,w,h,14,Math.cos(a)*r,h/2,Math.sin(a)*r,extMat([0xE4E0D8,0xD3CEC4,0xC7B9A6,0xEDEBE6][i%4]),a); }
  for(let i=0;i<3;i++){ const a=rnd()*Math.PI*2, r=170+rnd()*120; extCrane(g,Math.cos(a)*r,Math.sin(a)*r,34+rnd()*14); }
  [[430,.4,150,34],[470,2.2,220,26],[450,4.1,180,30]].forEach(([r,a,w,h])=>{ const c=new THREE.Mesh(new THREE.ConeGeometry(w,h,14),extMat(0x9FA688)); c.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r); g.add(c); });
}

/* cielo: bóveda con degradado */
let extSky=null;
function extSkyDome(){ if(extSky) return extSky;
  const c=document.createElement('canvas'); c.width=8; c.height=256; const x=c.getContext('2d'), gr=x.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#4E8FD0'); gr.addColorStop(.42,'#9CC4E6'); gr.addColorStop(.5,'#DDE9F0'); gr.addColorStop(1,'#DDE9F0'); x.fillStyle=gr; x.fillRect(0,0,8,256);
  extSky=new THREE.Mesh(new THREE.SphereGeometry(900,24,16),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.BackSide,fog:false,depthWrite:false}));
  extSky.renderOrder=-1; scene.add(extSky); return extSky; }

/* ---------- montaje ---------- */
function extHull(pts){ pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]); const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[],up=[]; for(const p of pts){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); }
  for(const p of pts.slice().reverse()){ while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); }
  return lo.slice(0,-1).concat(up.slice(0,-1)); }
function extSides(cfg){
  const side=c=>{ const d={n:c[1]-minZ,s:maxZ-c[1],w:c[0]-minX,e:maxX-c[0]}; return Object.keys(d).sort((a,b)=>d[a]-d[b])[0]; };
  const ter=PLAN.rooms.filter(r=>r.terrace&&r.poly.length>=3).map(r=>({r,a:polyArea(r.poly),s:side(roomCenter(r))})).sort((a,b)=>b.a-a.a);
  let pool=cfg.pool!=='auto'&&EXT_DIR[cfg.pool]?cfg.pool:(ter[0]?ter[0].s:'s');
  let street=cfg.street!=='auto'&&EXT_DIR[cfg.street]?cfg.street:null;
  if(!street){ const o=ter.find(t=>t.s!==pool&&!/tend|lavad|galer/i.test(t.r.label+' '+t.r.id)); street=o?o.s:EXT_OPP[pool]; }
  if(street===pool) street=EXT_OPP[pool];
  return {pool,street,terrace:ter[0]?roomCenter(ter[0].r):[CENTER.x,CENTER.z]};
}
function extFrame(side,E){ const d=EXT_DIR[side], g=new THREE.Group();
  g.position.set(side==='w'?minX:side==='e'?maxX:CENTER.x,-E,side==='n'?minZ:side==='s'?maxZ:CENTER.z); g.rotation.y=Math.atan2(d[0],d[1]);
  const lx=[Math.cos(g.rotation.y),-Math.sin(g.rotation.y)];                     // eje x local en planta
  return {g,d,lx,hw:(side==='n'||side==='s'?maxX-minX:maxZ-minZ)/2}; }
function extClear(){ const keep=Object.values(extGeo||{});
  [...extGroup.children].forEach(c=>{ extGroup.remove(c); c.traverse(n=>{ if(n.geometry&&!keep.includes(n.geometry)) n.geometry.dispose();
    if(n.material&&n.material.map){ n.material.map.dispose(); n.material.dispose(); } }); });
  EXT.actors=[]; EXT.waters=[]; }
let planRev=0;
function buildExterior(force){
  const cfg=extCfg(), sig=JSON.stringify(cfg)+'|'+planRev;
  if(!force&&sig===EXT.sig) return; EXT.sig=sig;
  extClear();
  const on=!!cfg.on&&PLAN.walls.length>0;
  extGroup.visible=on; ground.visible=!on; extOn=on; extSkyDome().visible=on; applyTheme();
  camera.far=on?1100:300; camera.updateProjectionMatrix();
  extSyncUI(cfg);
  if(!on) return;
  const E=cfg.floor>0?cfg.floor*3.05+.5:.35, rnd=extRand(691), S=extSides(cfg);
  extSky.position.set(CENTER.x,0,CENTER.z);
  // edificio propio: plantas inferiores bajo la vivienda y vecinos en los lados que no dan a nada
  const pts=[]; PLAN.walls.forEach(w=>pts.push(w.a,w.b)); PLAN.rooms.forEach(r=>pts.push(...r.poly));
  const hull=extHull(pts), sh=new THREE.Shape(); hull.forEach(([x,z],i)=>i?sh.lineTo(x,-z):sh.moveTo(x,-z)); sh.closePath();
  const bg=new THREE.ExtrudeGeometry(sh,{depth:E-.09,bevelEnabled:false}); bg.rotateX(-Math.PI/2);
  const body=new THREE.Mesh(bg,extMat(0xE7E3DB)); body.position.y=-E; extGroup.add(body);
  const open=s=>s===S.pool||s===S.street, sideOf=v=>Object.keys(EXT_DIR).find(k=>EXT_DIR[k][0]*v[0]+EXT_DIR[k][1]*v[1]>.5);
  ['n','s','w','e'].forEach(s=>{ if(open(s)) return; const f=extFrame(s,E); extGroup.add(f.g);
    const eR=open(sideOf(f.lx))?0:14, eL=open(sideOf([-f.lx[0],-f.lx[1]]))?0:14;      // no invade la calle ni el jardín
    extBox(f.g,f.hw*2+eL+eR,E-.09,14,(eR-eL)/2,(E-.09)/2,7,extMat(0xE7E3DB)); });
  // urbanización
  const fp=extFrame(S.pool,E); extGroup.add(fp.g);
  let x0=-46,x1=46; const sd=EXT_DIR[S.street], dot=fp.lx[0]*sd[0]+fp.lx[1]*sd[1];
  if(dot>.5) x1=fp.hw+1; else if(dot<-.5) x0=-(fp.hw+1);
  const tl=(S.terrace[0]-fp.g.position.x)*fp.lx[0]+(S.terrace[1]-fp.g.position.z)*fp.lx[1];
  const cy=extCourtyard(fp.g,x0,x1,tl,rnd);
  if(dot>.5||dot<-.5){ const xs=dot>.5?x1:x0; extBox(fp.g,.5,1.5,cy.D,xs,.75,cy.D/2,extMat(0x4F7F45)); extBlock(fp.g,dot>.5?x0-7:x1+7,cy.D/2+7,cy.D+14,14,6,3,Math.PI/2); }
  else { extBlock(fp.g,x0-7,cy.D/2+7,cy.D+14,14,6,3,Math.PI/2); extBlock(fp.g,x1+7,cy.D/2+7,cy.D+14,14,5,1,Math.PI/2); }
  // calle
  const fs=extFrame(S.street,E); fs.g.position.x+=fs.d[0]*1; fs.g.position.z+=fs.d[1]*1; extGroup.add(fs.g);
  extStreet(fs.g,rnd,true);
  // horizonte
  const far=new THREE.Group(); far.position.set(CENTER.x,-E-.03,CENTER.z); extGroup.add(far); extFar(far,rnd);
}

/* animación: una vez por fotograma */
function extUpdate(dt){
  if(!extGroup.visible) return;
  EXT.t+=dt; const t=EXT.t;
  EXT.waters.forEach((w,i)=>{ w.offset.x=(t*.02*(i+1))%1; w.offset.y=Math.sin(t*.3+i)*.04; });
  for(const a of EXT.actors){
    if(a.kind==='walk'){ extWalkStep(a,dt); }
    else if(a.kind==='car'){ a.x+=a.dir*a.v*dt; if(a.x>a.H) a.x-=2*a.H; else if(a.x<-a.H) a.x+=2*a.H; a.m.position.set(a.x,0,a.z); }
    else if(a.kind==='bike'){ a.x+=a.v*dt; if(a.x>a.H) a.x-=2*a.H; a.P.g.position.set(a.x,0,a.z); a.P.g.rotation.y=Math.PI/2; const s=Math.sin(t*7); a.P.legs[0].rotation.x=.9+s*.5; a.P.legs[1].rotation.x=.9-s*.5; }
    else if(a.kind==='swim'){ a.s+=a.speed*dt; const L=a.x1-a.x0, u=a.s%(2*L), x=u<L?a.x0+u:a.x1-(u-L); a.m.position.set(x,.14+Math.sin(t*3+a.z)*.03,a.z); }
    else if(a.kind==='idle'){ a.P.g.rotation.y=a.ry+Math.sin(t*.7+a.ph)*.25; }
    else if(a.kind==='shuffle'){ const dx=Math.sin(t*1.3+a.ph)*a.amp, dz=Math.sin(t*.9+a.ph*2)*a.amp*.6; a.P.g.position.set(a.bx+dx,0,a.bz+dz); const s=Math.sin(t*9+a.ph)*.5; a.P.legs[0].rotation.x=s; a.P.legs[1].rotation.x=-s; }
  }
}
EXT.t=0;

/* ---------- controles del panel ---------- */
function extSyncUI(cfg){ $('extOn').checked=!!cfg.on; $('extFloor').value=String(cfg.floor); $('extPool').value=cfg.pool; $('extStreet').value=cfg.street;
  $('tExt').setAttribute('aria-pressed',!!cfg.on); $('extOpts').hidden=!cfg.on; }
function extSet(patch){ state.exterior=Object.assign(extCfg(),patch); buildExterior(); saveSoon(); }
$('extOn').addEventListener('change',e=>extSet({on:e.target.checked}));
$('tExt').onclick=()=>extSet({on:!extCfg().on});
$('extFloor').addEventListener('change',e=>extSet({floor:+e.target.value}));
$('extPool').addEventListener('change',e=>extSet({pool:e.target.value}));
$('extStreet').addEventListener('change',e=>extSet({street:e.target.value}));
