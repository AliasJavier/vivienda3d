/* =========================================================================
   Editor 2D del plano: muros, huecos, estancias, armarios y escala
   Coordenadas en píxeles de la imagen del plano.
   ========================================================================= */
const Ed = {src:null, img:null, imgURL:null, view:{s:1,tx:0,ty:0}, tool:'select', sel:null, draft:null,
  hist:[], fut:[], opacity:.55, showImg:true, hover:null, busy:false};
const edCanvas=$('ed'), edx=edCanvas.getContext('2d');
let edDpr=1, edPending=false;

/* ---------- vista ---------- */
function edResize(){ const r=edCanvas.parentElement.getBoundingClientRect(); edDpr=Math.min(devicePixelRatio||1,2);
  edCanvas.width=Math.max(1,Math.round(r.width*edDpr)); edCanvas.height=Math.max(1,Math.round(r.height*edDpr)); edDraw(); }
new ResizeObserver(()=>{ if(!edCanvas.hidden) edResize(); }).observe($('stage'));
function edFit(){ if(!Ed.src) return; const r=edCanvas.getBoundingClientRect(); if(!r.width) return;
  const W=Ed.src.img.w, H=Ed.src.img.h, s=Math.min((r.width-40)/W,(r.height-110)/H);
  Ed.view={s, tx:(r.width-W*s)/2, ty:Math.max(70,(r.height-H*s)/2+30)}; edDraw(); }
const toImg=(cx,cy)=>{ const r=edCanvas.getBoundingClientRect(); return [(cx-r.left-Ed.view.tx)/Ed.view.s,(cy-r.top-Ed.view.ty)/Ed.view.s]; };
function edDraw(){ if(edPending) return; edPending=true; requestAnimationFrame(()=>{ edPending=false; edPaint(); }); }

/* ---------- historial ---------- */
function edPush(){ Ed.hist.push(JSON.stringify(Ed.src)); if(Ed.hist.length>80) Ed.hist.shift(); Ed.fut=[]; edUndoState(); }
function edUndo(){ if(!Ed.hist.length) return; Ed.fut.push(JSON.stringify(Ed.src)); Ed.src=JSON.parse(Ed.hist.pop()); edAfterHistory(); }
function edRedo(){ if(!Ed.fut.length) return; Ed.hist.push(JSON.stringify(Ed.src)); Ed.src=JSON.parse(Ed.fut.pop()); edAfterHistory(); }
function edAfterHistory(){ Ed.sel=null; Ed.draft=null; if(cur&&cur.src!==Ed.src) cur.src=Ed.src; edChanged(); }
function edUndoState(){ $('edUndo').disabled=!Ed.hist.length; $('edRedo').disabled=!Ed.fut.length; }
function edChanged(){ edUndoState(); edDraw(); edPanel(); projectChanged(); }

/* ---------- utilidades ---------- */
const S_ = ()=>estScale(Ed.src);
const hasScale = ()=>!!scaleInfo(Ed.src).S;
const pxToCm = px => Math.round(px/S_()*100);
const cmToPx = cm => cm/100*S_();
function wallById(id){ return Ed.src.walls.find(w=>w.id===id); }
function wallPoly(w){ const u=P2.dir(w), n=[-u[1],u[0]], h=w.t/2, e0=w.ext?w.ext[0]:Math.min(h,cmToPx(6)), e1=w.ext?w.ext[1]:Math.min(h,cmToPx(6));
  const a=[w.a[0]-u[0]*e0,w.a[1]-u[1]*e0], b=[w.b[0]+u[0]*e1,w.b[1]+u[1]*e1];
  return [[a[0]+n[0]*h,a[1]+n[1]*h],[b[0]+n[0]*h,b[1]+n[1]*h],[b[0]-n[0]*h,b[1]-n[1]*h],[a[0]-n[0]*h,a[1]-n[1]*h]]; }
function along(w,p){ const u=P2.dir(w); return (p[0]-w.a[0])*u[0]+(p[1]-w.a[1])*u[1]; }
function atS(w,s){ const u=P2.dir(w); return [w.a[0]+u[0]*s,w.a[1]+u[1]*s]; }
function nextRoomName(){ let i=Ed.src.rooms.length+1; const names=new Set(Ed.src.rooms.map(r=>r.label)); while(names.has('Estancia '+i)) i++; return 'Estancia '+i; }
function defaultT(){ if(Ed.lastT) return Ed.lastT; const ts=Ed.src.walls.map(w=>w.t).sort((a,b)=>a-b); return ts.length?ts[ts.length>>1]:cmToPx(10); }

/* ---------- dibujo ---------- */
const KCOL={door:'#C9822B',glassdoor:'#2E8C8C',window:'#3C7FC1',glass:'#5BA7D9'};
function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function edPaint(){
  const c=edx, W=edCanvas.width, H=edCanvas.height; c.setTransform(1,0,0,1,0,0); c.fillStyle=css('--scene')||'#E1E6E3'; c.fillRect(0,0,W,H);
  if(!Ed.src) return;
  const v=Ed.view, k=edDpr; c.setTransform(v.s*k,0,0,v.s*k,v.tx*k,v.ty*k);
  const px=1/v.s;   // un píxel de pantalla en unidades de imagen
  // papel e imagen
  c.fillStyle='#fff'; c.fillRect(0,0,Ed.src.img.w,Ed.src.img.h);
  if(Ed.img&&Ed.showImg){ c.globalAlpha=Ed.opacity; c.imageSmoothingQuality='high'; c.drawImage(Ed.img,0,0,Ed.src.img.w,Ed.src.img.h); c.globalAlpha=1; }
  c.strokeStyle='rgba(0,0,0,.15)'; c.lineWidth=px; c.strokeRect(0,0,Ed.src.img.w,Ed.src.img.h);
  const sel=Ed.sel, SI=scaleInfo(Ed.src), S=SI.S;
  // estancias
  Ed.src.rooms.forEach((r,i)=>{ if(r.poly.length<3) return; const hue=(i*67+190)%360, on=sel&&sel.type==='room'&&sel.id===r.id;
    c.beginPath(); r.poly.forEach((p,j)=>j?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath();
    c.fillStyle=r.terrace?`hsla(${hue},25%,60%,${on?.35:.16})`:`hsla(${hue},60%,60%,${on?.38:.2})`; c.fill();
    c.setLineDash(r.terrace?[6*px,4*px]:[]); c.strokeStyle=on?'#2F5F8F':`hsla(${hue},55%,35%,.7)`; c.lineWidth=(on?2.5:1.2)*px; c.stroke(); c.setLineDash([]); });
  // armarios y pilares
  Ed.src.closets.forEach(cl=>{ const [x0,y0,x1,y1]=cl.r, on=sel&&sel.type==='closet'&&sel.id===cl.id;
    c.fillStyle=cl.kind==='pillar'?'rgba(60,60,60,.75)':'rgba(170,150,120,.45)'; c.fillRect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));
    c.strokeStyle=on?'#2F5F8F':'rgba(90,70,40,.9)'; c.lineWidth=(on?2.5:1)*px; c.strokeRect(Math.min(x0,x1),Math.min(y0,y1),Math.abs(x1-x0),Math.abs(y1-y0));
    if(cl.kind!=='pillar'){ c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); } });
  // muros
  Ed.src.walls.forEach(w=>{ const on=sel&&(sel.type==='wall'||sel.type==='open')&&sel.id===w.id, P=wallPoly(w);
    c.beginPath(); P.forEach((p,j)=>j?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath();
    const low=S&&wallHeight(Ed.src,w,S)<2;
    c.fillStyle=on?'rgba(47,95,143,.85)':(low?'rgba(70,120,110,.7)':'rgba(30,38,45,.78)'); c.fill();
    // huecos
    const u=P2.dir(w), n=[-u[1],u[0]], h=w.t/2;
    w.o.forEach(o=>{ const a=atS(w,o.s), b=atS(w,o.e), osel=sel&&sel.type==='open'&&sel.oid===o.id;
      c.beginPath(); c.moveTo(a[0]+n[0]*(h+px),a[1]+n[1]*(h+px)); c.lineTo(b[0]+n[0]*(h+px),b[1]+n[1]*(h+px)); c.lineTo(b[0]-n[0]*(h+px),b[1]-n[1]*(h+px)); c.lineTo(a[0]-n[0]*(h+px),a[1]-n[1]*(h+px)); c.closePath();
      c.fillStyle='#fff'; c.fill(); c.fillStyle=KCOL[o.kind]+(osel?'':'99'); c.fill();
      if(osel){ c.strokeStyle='#2F5F8F'; c.lineWidth=2.5*px; c.stroke(); }
      if(o.kind==='door'||o.kind==='glassdoor'){ const hp=o.hinge==='end'?b:a, ot=o.hinge==='end'?a:b, wd=o.e-o.s, sd=o.side||1;
        const tip=[hp[0]+n[0]*sd*wd,hp[1]+n[1]*sd*wd];
        c.strokeStyle=KCOL[o.kind]; c.lineWidth=1.6*px; c.beginPath(); c.moveTo(hp[0],hp[1]); c.lineTo(tip[0],tip[1]); c.stroke();
        const a1=Math.atan2(tip[1]-hp[1],tip[0]-hp[0]), a2=Math.atan2(ot[1]-hp[1],ot[0]-hp[0]); let d=a2-a1; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
        c.setLineDash([4*px,3*px]); c.beginPath(); c.arc(hp[0],hp[1],wd,a1,a2,d<0); c.stroke(); c.setLineDash([]); }
    });
    if(on&&sel.type==='wall'){ [w.a,w.b].forEach(p=>{ c.fillStyle='#fff'; c.strokeStyle='#2F5F8F'; c.lineWidth=2*px; c.beginPath(); c.arc(p[0],p[1],6*px,0,7); c.fill(); c.stroke(); }); }
  });
  if(sel&&sel.type==='open'){ const w=wallById(sel.id), o=w&&w.o.find(q=>q.id===sel.oid); if(o) [o.s,o.e].forEach(s=>{ const p=atS(w,s); c.fillStyle='#fff'; c.strokeStyle='#2F5F8F'; c.lineWidth=2*px; c.beginPath(); c.arc(p[0],p[1],5*px,0,7); c.fill(); c.stroke(); }); }
  // cotas de escala
  Ed.src.scale.cotas.forEach((ct,i)=>{ const on=sel&&sel.type==='cota'&&sel.i===i; drawDim(c,ct.a,ct.b,ct.m>0?fmtN(ct.m)+' m':'¿m?',on?'#C0392B':'#A8492A',px); });
  // etiquetas de estancias
  c.textAlign='center'; c.textBaseline='middle';
  Ed.src.rooms.forEach(r=>{ if(r.poly.length<3) return; const [cx,cy]=P2.centroid(r.poly), a=P2.area(r.poly);
    const wr=r.m2>0?fmtN(r.m2)+' m²':'', meas=S&&!(SI.fixed&&wr)?fmtN(a/(S*S))+' m²':'';   // con la escala fijada a mano, manda lo que pone el plano
    const l2=wr&&meas?`${wr} · medido ${meas}`:(wr||meas);
    c.font=`600 ${13*px}px Archivo, system-ui, sans-serif`; const w1=c.measureText(r.label).width; c.font=`500 ${11.5*px}px Archivo, system-ui, sans-serif`; const w2=l2?c.measureText(l2).width:0;
    const xs=r.poly.map(q=>q[0]), ys=r.poly.map(q=>q[1]), rw=Math.max(...xs)-Math.min(...xs), rh=Math.max(...ys)-Math.min(...ys);
    let show2=!!l2&&Math.max(w1,w2)+12*px<=rw*1.02&&34*px<=rh;
    if(!show2&&(w1+12*px>rw*1.1||20*px>rh)) return;      // no cabe: sin etiqueta
    const L2=show2?l2:'';
    const bw=Math.max(w1,show2?w2:0)+12*px, bh=(L2?34:20)*px;
    c.fillStyle='rgba(255,255,255,.88)'; c.beginPath(); c.roundRect?c.roundRect(cx-bw/2,cy-bh/2,bw,bh,5*px):c.rect(cx-bw/2,cy-bh/2,bw,bh); c.fill();
    c.fillStyle='#1B2220'; c.font=`600 ${13*px}px Archivo, system-ui, sans-serif`; c.fillText(r.label,cx,cy-(L2?7:0)*px);
    if(L2){ c.fillStyle='#5B6661'; c.font=`500 ${11.5*px}px Archivo, system-ui, sans-serif`; c.fillText(l2,cx,cy+9*px); } });
  // borrador
  const d=Ed.draft;
  if(d&&d.kind==='wall'&&d.a&&d.cur){ const t=defaultT(); c.strokeStyle='rgba(47,95,143,.6)'; c.lineCap='butt'; c.lineWidth=t; c.beginPath(); c.moveTo(d.a[0],d.a[1]); c.lineTo(d.cur[0],d.cur[1]); c.stroke();
    c.lineWidth=px; c.strokeStyle='#2F5F8F'; c.beginPath(); c.moveTo(d.a[0],d.a[1]); c.lineTo(d.cur[0],d.cur[1]); c.stroke();
    const L=P2.len(d.a,d.cur); tag(c,[(d.a[0]+d.cur[0])/2,(d.a[1]+d.cur[1])/2],hasScale()?fmtN(L/S_())+' m':Math.round(L)+' px',px); }
  if(d&&d.kind==='poly'){ c.strokeStyle='#2F5F8F'; c.fillStyle='rgba(47,95,143,.15)'; c.lineWidth=2*px; c.beginPath();
    d.pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); if(d.cur) c.lineTo(d.cur[0],d.cur[1]); c.fill(); c.stroke();
    d.pts.forEach((q,i)=>{ c.fillStyle=i?'#fff':'#2F5F8F'; c.beginPath(); c.arc(q[0],q[1],(i?4:6)*px,0,7); c.fill(); c.stroke(); }); }
  if(d&&d.kind==='cota'&&d.a&&d.cur) drawDim(c,d.a,d.cur,hasScale()?fmtN(P2.len(d.a,d.cur)/S_())+' m':'',  '#C0392B',px);
  if(d&&d.kind==='rect'&&d.a&&d.cur){ c.fillStyle=d.ck==='pillar'?'rgba(60,60,60,.5)':'rgba(170,150,120,.4)'; c.fillRect(Math.min(d.a[0],d.cur[0]),Math.min(d.a[1],d.cur[1]),Math.abs(d.cur[0]-d.a[0]),Math.abs(d.cur[1]-d.a[1])); }
  if(Ed.snapPt){ c.strokeStyle='#C0392B'; c.lineWidth=1.5*px; c.beginPath(); c.arc(Ed.snapPt[0],Ed.snapPt[1],7*px,0,7); c.stroke(); }
  if(Ed.hover&&Ed.tool!=='select'&&Ed.hover.type==='wallpos'){ const w=wallById(Ed.hover.id); if(w){ const wd=Ed.hover.w, s0=clamp(Ed.hover.s-wd/2,0,P2.len(w.a,w.b)-wd);
    const a=atS(w,s0), b=atS(w,s0+wd); c.strokeStyle=KCOL[Ed.hover.kind]; c.lineWidth=Math.max(w.t,3*px); c.globalAlpha=.6; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); c.globalAlpha=1; } }
}
function drawDim(c,a,b,txt,col,px){ const L=P2.len(a,b); if(L<1) return; const u=[(b[0]-a[0])/L,(b[1]-a[1])/L], n=[-u[1],u[0]];
  c.strokeStyle=col; c.lineWidth=1.6*px; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]);
  [a,b].forEach(p=>{ c.moveTo(p[0]+n[0]*6*px,p[1]+n[1]*6*px); c.lineTo(p[0]-n[0]*6*px,p[1]-n[1]*6*px); }); c.stroke();
  if(txt) tag(c,[(a[0]+b[0])/2,(a[1]+b[1])/2],txt,px,col); }
function tag(c,p,txt,px,col){ c.font=`600 ${12*px}px Archivo, system-ui, sans-serif`; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(txt).width+10*px;
  c.fillStyle=col||'#2F5F8F'; c.beginPath(); c.roundRect?c.roundRect(p[0]-w/2,p[1]-9*px,w,18*px,4*px):c.rect(p[0]-w/2,p[1]-9*px,w,18*px); c.fill(); c.fillStyle='#fff'; c.fillText(txt,p[0],p[1]); }

/* ---------- selección por punto ---------- */
function edHit(p){
  const px=1/Ed.view.s, sel=Ed.sel;
  if(sel&&sel.type==='wall'){ const w=wallById(sel.id); if(w) for(const [i,q] of [[0,w.a],[1,w.b]].entries()) if(P2.len(q[1],p)<9*px) return {type:'end',id:w.id,end:q[0]}; }
  if(sel&&sel.type==='open'){ const w=wallById(sel.id), o=w&&w.o.find(q=>q.id===sel.oid); if(o){ for(const [k,s] of [['s',o.s],['e',o.e]]) if(P2.len(atS(w,s),p)<8*px) return {type:'oend',id:w.id,oid:o.id,k}; } }
  for(const w of Ed.src.walls){ const s=along(w,p), u=P2.dir(w), n=[-u[1],u[0]], off=Math.abs((p[0]-w.a[0])*n[0]+(p[1]-w.a[1])*n[1]);
    if(off>w.t/2+5*px) continue; for(const o of w.o) if(s>=o.s-2*px&&s<=o.e+2*px) return {type:'open',id:w.id,oid:o.id}; }
  for(let i=0;i<Ed.src.scale.cotas.length;i++){ const ct=Ed.src.scale.cotas[i]; if(P2.distSeg(p,ct.a,ct.b).d<6*px) return {type:'cota',i}; }
  let best=null, bd=1e9;
  for(const w of Ed.src.walls){ const r=P2.distSeg(p,w.a,w.b); const lim=w.t/2+5*px; if(r.d<lim&&r.d<bd){ bd=r.d; best={type:'wall',id:w.id}; } }
  if(best) return best;
  for(const cl of Ed.src.closets){ const [x0,y0,x1,y1]=cl.r; if(p[0]>=Math.min(x0,x1)&&p[0]<=Math.max(x0,x1)&&p[1]>=Math.min(y0,y1)&&p[1]<=Math.max(y0,y1)) return {type:'closet',id:cl.id}; }
  for(const r of Ed.src.rooms) if(P2.inPoly(p[0],p[1],r.poly)) return {type:'room',id:r.id};
  return null;
}
/* imán: extremos de muro, ejes y ángulos de 45° */
function edSnap(p,from,skipWall){
  const px=1/Ed.view.s, R=10*px; let best=null, bd=R;
  Ed.src.walls.forEach(w=>{ if(w.id===skipWall) return; [w.a,w.b].forEach(q=>{ const d=P2.len(p,q); if(d<bd){ bd=d; best=q.slice(); } }); });
  if(!best) Ed.src.walls.forEach(w=>{ if(w.id===skipWall) return; const r=P2.distSeg(p,w.a,w.b); if(r.d<Math.min(R,w.t/2+4*px)&&r.d<bd){ bd=r.d; best=[w.a[0]+(w.b[0]-w.a[0])*r.t,w.a[1]+(w.b[1]-w.a[1])*r.t]; } });
  if(best){ Ed.snapPt=best; return best; }
  Ed.snapPt=null;
  if(from){ const dx=p[0]-from[0], dy=p[1]-from[1], L=Math.hypot(dx,dy), ang=Math.atan2(dy,dx), st=Math.PI/4, q=Math.round(ang/st)*st;
    if(Math.abs(ang-q)<7*Math.PI/180) return [from[0]+Math.cos(q)*L, from[1]+Math.sin(q)*L]; }
  return p;
}

/* ---------- herramientas ---------- */
const TOOL_HINT={
  select:'Toca un muro, hueco o estancia para editarlo. Arrastra el fondo para moverte y usa la rueda para acercar. Para mover algo, primero selecciónalo.',
  wall:'Toca el inicio y luego el final del muro; sigue tocando para encadenar. Doble clic o Esc para terminar. Se ajusta solo a otros muros y a ángulos de 45°.',
  door:'Toca un muro para poner una puerta.', window:'Toca un muro para poner una ventana.', glass:'Toca un muro para poner un ventanal.', glassdoor:'Toca un muro para poner una puerta de cristal.',
  room:'Toca dentro de un espacio cerrado por muros para crear la estancia.',
  roomdraw:'Toca las esquinas de la estancia una a una; toca la primera (o doble clic) para cerrarla. Útil para zonas abiertas, como salón y vestíbulo juntos.',
  closet:'Arrastra para dibujar un armario empotrado.', pillar:'Arrastra para dibujar un pilar.',
  cota:'Toca los dos extremos de una medida que conozcas (una cota del plano) y luego escribe cuántos metros son.',
};
const OPEN_W={door:82,glassdoor:160,window:120,glass:200};
function edSetTool(t){ Ed.tool=t; Ed.draft=null; Ed.snapPt=null; Ed.hover=null;
  document.querySelectorAll('#tbEd [data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t));
  $('hint').textContent=TOOL_HINT[t]||''; edCanvas.style.cursor=t==='select'?'default':'crosshair'; edDraw(); }
document.querySelectorAll('#tbEd [data-tool]').forEach(b=>b.onclick=()=>edSetTool(b.dataset.tool));
$('edUndo').onclick=edUndo; $('edRedo').onclick=edRedo; $('edFit').onclick=edFit;

function edSelect(s){ Ed.sel=s; edDraw(); edPanel(); }
function edDelete(){ const s=Ed.sel; if(!s) return; edPush();
  if(s.type==='wall') Ed.src.walls=Ed.src.walls.filter(w=>w.id!==s.id);
  else if(s.type==='open'){ const w=wallById(s.id); if(w) w.o=w.o.filter(o=>o.id!==s.oid); }
  else if(s.type==='room') Ed.src.rooms=Ed.src.rooms.filter(r=>r.id!==s.id);
  else if(s.type==='closet') Ed.src.closets=Ed.src.closets.filter(c=>c.id!==s.id);
  else if(s.type==='cota') Ed.src.scale.cotas.splice(s.i,1);
  Ed.sel=null; edChanged(); }

function addOpening(w,s,kind){ const L=P2.len(w.a,w.b); let wd=Math.min(cmToPx(OPEN_W[kind]),L-2); if(wd<4) return false;
  let s0=clamp(s-wd/2,0,L-wd);
  const clash=o=>s0<o.e&&s0+wd>o.s;
  if(w.o.some(clash)){ edMsg('Ahí ya hay un hueco. Pon este en otra parte del muro.'); return false; }
  edPush(); const o={id:uid('o'),s:+s0.toFixed(1),e:+(s0+wd).toFixed(1),kind,hinge:'start',side:1}; w.o.push(o); w.o.sort((p,q)=>p.s-q.s);
  Ed.sel={type:'open',id:w.id,oid:o.id}; edChanged(); return true; }

/* ---------- gestos ---------- */
const edPtrs=new Map(); let edG=null, edPinch=null, edLastClick=0, edLastPos=null;
edCanvas.addEventListener('contextmenu',e=>e.preventDefault());
edCanvas.addEventListener('pointerdown',e=>{
  edCanvas.setPointerCapture(e.pointerId); edPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(edPtrs.size===2){ const [a,b]=[...edPtrs.values()]; edPinch={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2}; edG=null; return; }
  const p=toImg(e.clientX,e.clientY), now=performance.now(), dbl=now-edLastClick<350&&edLastPos&&Math.hypot(e.clientX-edLastPos[0],e.clientY-edLastPos[1])<8; edLastClick=now; edLastPos=[e.clientX,e.clientY];
  edG={sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,p0:p,moved:false,type:'pan'};
  if(e.button===1||e.button===2){ if(Ed.tool==='wall'&&Ed.draft&&e.button===2){ Ed.draft=null; edDraw(); } return; }
  const t=Ed.tool;
  if(t==='select'){ const h=edHit(p);
    if(h&&h.type==='end'){ edPush(); edG.type='end'; edG.h=h; return; }
    if(h&&h.type==='oend'){ edPush(); edG.type='oend'; edG.h=h; return; }
    const same=h&&Ed.sel&&h.type===Ed.sel.type&&(h.id===Ed.sel.id)&&(h.type!=='open'||h.oid===Ed.sel.oid)&&(h.type!=='cota'||h.i===Ed.sel.i);
    if(same&&(h.type==='wall'||h.type==='open'||h.type==='closet')){ edPush(); edG.type='move'; edG.h=h; edG.orig=JSON.parse(JSON.stringify(h.type==='closet'?Ed.src.closets.find(c=>c.id===h.id):wallById(h.id))); return; }
    edG.hit=h; return; }
  if(t==='wall'){ const q=edSnap(p,Ed.draft&&Ed.draft.a);
    if(dbl&&Ed.draft){ Ed.draft=null; Ed.snapPt=null; edDraw(); return; }
    if(!Ed.draft||!Ed.draft.a){ Ed.draft={kind:'wall',a:q,cur:q}; edDraw(); return; }
    if(P2.len(Ed.draft.a,q)<3/Ed.view.s){ return; }
    edPush(); const w={id:uid('w'),a:Ed.draft.a.map(v=>+v.toFixed(1)),b:q.map(v=>+v.toFixed(1)),t:+defaultT().toFixed(1),hMode:'auto',ext:null,o:[]};
    Ed.src.walls.push(w); Ed.draft={kind:'wall',a:w.b.slice(),cur:w.b.slice()}; Ed.sel={type:'wall',id:w.id}; edChanged(); edG.type='none'; return; }
  if(t in OPEN_W){ const h=edHit(p); const w=h&&(h.type==='wall'||h.type==='open')?wallById(h.id):null;
    if(!w){ edMsg('Toca encima de un muro.'); return; } addOpening(w,along(w,p),t); edG.type='none'; return; }
  if(t==='room'){ edG.type='none'; const h=edHit(p); if(h&&h.type==='room'){ edSelect(h); return; } makeRoom(p); return; }
  if(t==='roomdraw'){ edG.type='none'; const d=Ed.draft; const q=edSnap(p,d&&d.pts.length?d.pts[d.pts.length-1]:null);
    if(!d){ Ed.draft={kind:'poly',pts:[q],cur:q}; edDraw(); return; }
    const close=d.pts.length>=3&&(P2.len(q,d.pts[0])<10/Ed.view.s||dbl);
    if(close){ const pts=d.pts.map(v=>v.map(c=>+c.toFixed(1))); Ed.draft=null; Ed.snapPt=null; edPush();
      const room={id:uid('r'),label:nextRoomName(),m2:null,floor:'wood',terrace:false,poly:pts}; Ed.src.rooms.push(room); Ed.sel={type:'room',id:room.id}; edChanged();
      setTimeout(()=>{ const i=$('roomName'); if(i){ i.focus(); i.select(); } },30); return; }
    if(P2.len(q,d.pts[d.pts.length-1])>3/Ed.view.s) d.pts.push(q); edDraw(); return; }
  if(t==='closet'||t==='pillar'){ Ed.draft={kind:'rect',ck:t,a:p,cur:p}; edG.type='rect'; return; }
  if(t==='cota'){ const q=edSnap(p,Ed.draft&&Ed.draft.a); edG.type='none';
    if(!Ed.draft){ Ed.draft={kind:'cota',a:q,cur:q}; edDraw(); return; }
    if(P2.len(Ed.draft.a,q)<5/Ed.view.s) return;
    edPush(); Ed.src.scale.cotas.push({a:Ed.draft.a.map(v=>+v.toFixed(1)),b:q.map(v=>+v.toFixed(1)),m:null}); Ed.draft=null; Ed.snapPt=null;
    Ed.sel={type:'cota',i:Ed.src.scale.cotas.length-1}; edChanged(); setTimeout(()=>{ const i=$('cotaM'); if(i) i.focus(); },30); return; }
});
edCanvas.addEventListener('pointermove',e=>{
  const pp=edPtrs.get(e.pointerId); if(pp){ pp.x=e.clientX; pp.y=e.clientY; }
  if(edPinch&&edPtrs.size===2){ const [a,b]=[...edPtrs.values()], d=Math.hypot(a.x-b.x,a.y-b.y), cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
    Ed.view.tx+=cx-edPinch.cx; Ed.view.ty+=cy-edPinch.cy; edZoom(cx,cy,d/edPinch.d); edPinch={d,cx,cy}; return; }
  const p=toImg(e.clientX,e.clientY);
  if(!edG){ // vista previa
    if(Ed.tool==='wall'&&Ed.draft){ Ed.draft.cur=edSnap(p,Ed.draft.a); edDraw(); }
    else if(Ed.tool==='roomdraw'&&Ed.draft){ Ed.draft.cur=edSnap(p,Ed.draft.pts[Ed.draft.pts.length-1]); edDraw(); }
    else if(Ed.tool==='cota'){ const q=edSnap(p,Ed.draft&&Ed.draft.a); if(Ed.draft) Ed.draft.cur=q; edDraw(); }
    else if(Ed.tool in OPEN_W){ const h=edHit(p), w=h&&(h.type==='wall'||h.type==='open')?wallById(h.id):null;
      Ed.hover=w?{type:'wallpos',id:w.id,s:along(w,p),w:cmToPx(OPEN_W[Ed.tool]),kind:Ed.tool}:null; edDraw(); }
    return; }
  const dx=e.clientX-edG.lx, dy=e.clientY-edG.ly; edG.lx=e.clientX; edG.ly=e.clientY;
  if(Math.hypot(e.clientX-edG.sx,e.clientY-edG.sy)>4) edG.moved=true; if(!edG.moved) return;
  const g=edG;
  if(g.type==='pan'){ Ed.view.tx+=dx; Ed.view.ty+=dy; edDraw(); return; }
  if(g.type==='end'){ const w=wallById(g.h.id); const other=g.h.end?w.a:w.b; const q=edSnap(p,other,w.id); if(g.h.end) w.b=q.map(v=>+v.toFixed(1)); else w.a=q.map(v=>+v.toFixed(1)); w.ext=null;
    const L=P2.len(w.a,w.b); w.o=w.o.filter(o=>o.s<L-2).map(o=>({...o,e:Math.min(o.e,L)})); g.changed=true; edDraw(); return; }
  if(g.type==='oend'){ const w=wallById(g.h.id), o=w.o.find(q=>q.id===g.h.oid), L=P2.len(w.a,w.b), s=clamp(along(w,p),0,L);
    if(g.h.k==='s') o.s=+Math.min(s,o.e-4).toFixed(1); else o.e=+Math.max(s,o.s+4).toFixed(1); g.changed=true; edDraw(); edPanelLive(); return; }
  if(g.type==='move'){ const d=[p[0]-g.p0[0],p[1]-g.p0[1]];
    if(g.h.type==='wall'){ const w=wallById(g.h.id); w.a=[+(g.orig.a[0]+d[0]).toFixed(1),+(g.orig.a[1]+d[1]).toFixed(1)]; w.b=[+(g.orig.b[0]+d[0]).toFixed(1),+(g.orig.b[1]+d[1]).toFixed(1)]; }
    else if(g.h.type==='open'){ const w=wallById(g.h.id), o=w.o.find(q=>q.id===g.h.oid), oo=g.orig.o.find(q=>q.id===g.h.oid), L=P2.len(w.a,w.b), wd=oo.e-oo.s;
      const s=clamp(oo.s+along(w,p)-along(w,g.p0),0,L-wd); o.s=+s.toFixed(1); o.e=+(s+wd).toFixed(1); }
    else if(g.h.type==='closet'){ const cl=Ed.src.closets.find(c=>c.id===g.h.id); cl.r=[g.orig.r[0]+d[0],g.orig.r[1]+d[1],g.orig.r[2]+d[0],g.orig.r[3]+d[1]].map(v=>+v.toFixed(1)); }
    g.changed=true; edDraw(); return; }
  if(g.type==='rect'){ Ed.draft.cur=p; edDraw(); return; }
});
function edEnd(e){
  const had=edPtrs.delete(e.pointerId); if(edPinch){ if(edPtrs.size<2) edPinch=null; edG=null; return; }
  if(!had||!edG) return; const g=edG; edG=null; Ed.snapPt=null;
  if(g.type==='end'||g.type==='oend'||g.type==='move'){ if(g.changed){ edChanged(); } else { Ed.hist.pop(); edUndoState(); } return; }
  if(g.type==='rect'){ const d=Ed.draft; Ed.draft=null; if(d&&P2.len(d.a,d.cur)>4/Ed.view.s){ edPush(); const cl={id:uid('c'),r:[d.a[0],d.a[1],d.cur[0],d.cur[1]].map(v=>+v.toFixed(1)),h:d.ck==='pillar'?Ed.src.H_INT:2.2,kind:d.ck}; Ed.src.closets.push(cl); Ed.sel={type:'closet',id:cl.id}; edChanged(); } else edDraw(); return; }
  if(g.type==='pan'&&!g.moved&&Ed.tool==='select'&&e.type==='pointerup') edSelect(g.hit||null);
}
edCanvas.addEventListener('pointerup',edEnd); edCanvas.addEventListener('pointercancel',edEnd);
edCanvas.addEventListener('pointerleave',()=>{ if(Ed.hover){ Ed.hover=null; edDraw(); } });
function edZoom(cx,cy,f){ const r=edCanvas.getBoundingClientRect(), x=cx-r.left, y=cy-r.top, ns=clamp(Ed.view.s*f,0.05,40); f=ns/Ed.view.s;
  Ed.view.tx=x-(x-Ed.view.tx)*f; Ed.view.ty=y-(y-Ed.view.ty)*f; Ed.view.s=ns; edDraw(); }
edCanvas.addEventListener('wheel',e=>{ e.preventDefault(); edZoom(e.clientX,e.clientY,Math.exp(-e.deltaY*0.0015)); },{passive:false});
addEventListener('keydown',e=>{
  if(edCanvas.hidden) return; const typing=/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''); if(typing) return;
  const k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&k==='z'){ e.preventDefault(); e.shiftKey?edRedo():edUndo(); return; }
  if((e.ctrlKey||e.metaKey)&&k==='y'){ e.preventDefault(); edRedo(); return; }
  if(k==='escape'){ if(Ed.draft){ Ed.draft=null; Ed.snapPt=null; edDraw(); } else if(Ed.tool!=='select') edSetTool('select'); else edSelect(null); return; }
  if(k==='delete'||k==='backspace'){ if(Ed.sel){ e.preventDefault(); edDelete(); } return; }
  const map={v:'select',m:'wall',p:'door',e:'room'}; if(map[k]&&!e.ctrlKey&&!e.metaKey) edSetTool(map[k]);
});

function makeRoom(p){
  const r=Detect.roomAt(Ed.src.walls,Ed.src.img.w,Ed.src.img.h,p[0],p[1]);
  if(r.error==='wall'){ edMsg('Has tocado un muro. Toca dentro de la estancia.'); return; }
  if(r.error==='open'||!r.poly||r.poly.length<3){ edMsg('Esa zona no está cerrada por muros. Añade el muro que falte, o dibújala con "Estancia a mano".',false,8000); return; }
  edPush(); const room={id:uid('r'),label:nextRoomName(),m2:null,floor:'wood',terrace:false,poly:r.poly};
  Ed.src.rooms.push(room); Ed.sel={type:'room',id:room.id}; edChanged(); setTimeout(()=>{ const i=$('roomName'); if(i){ i.focus(); i.select(); } },30);
}

/* ---------- detección automática ---------- */
async function imageData(maxSide){
  const W=Ed.src.img.w, H=Ed.src.img.h, f=Math.min(1,maxSide/Math.max(W,H)), w=Math.round(W*f), h=Math.round(H*f);
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(Ed.img,0,0,w,h);
  return {data:x.getImageData(0,0,w,h),f};
}
async function edDetect(opts={}){
  if(!Ed.img){ edMsg('Este proyecto no tiene imagen del plano.'); return; }
  Ed.busy=true; edPanel(); await new Promise(r=>setTimeout(r,40));
  try{
    const {data,f}=await imageData(1800);
    const res=Detect.analyze(data,{dark:Ed.src.detectDark||null});
    const k=1/f, sc=v=>+(v*k).toFixed(1);
    edPush();
    Ed.src.detectDark=res.dark;
    Ed.src.walls=res.walls.map(w=>({id:uid('w'),a:w.a.map(sc),b:w.b.map(sc),t:sc(w.t),hMode:'auto',ext:w.ext.map(sc),o:w.o.map(o=>({id:uid('o'),s:sc(o.s),e:sc(o.e),kind:o.kind,hinge:o.hinge||'start',side:o.side||1}))}));
    let nr=0;
    if(opts.rooms!==false){ const S=scaleInfo(Ed.src).S, minA=S?0.8*S*S:Ed.src.img.w*Ed.src.img.h*0.005;
      const polys=Detect.allRooms(Ed.src.walls,Ed.src.img.w,Ed.src.img.h,minA);
      Ed.src.rooms=polys.filter(p=>p.length>=3).map((poly,i)=>({id:uid('r'),label:'Estancia '+(i+1),m2:null,floor:'wood',terrace:false,poly}));
      nr=Ed.src.rooms.length; }
    const nO=Ed.src.walls.reduce((s,w)=>s+w.o.length,0);
    Ed.sel=null; Ed.busy=false; edChanged();
    edMsg(`Detectados ${Ed.src.walls.length} muros, ${nO} huecos${opts.rooms!==false?` y ${nr} estancias`:''}. Revísalos: borra lo que sobre, añade lo que falte y pon nombre y m² a las estancias.`,true,9000);
  }catch(err){ console.error(err); Ed.busy=false; edPanel(); edMsg('No se pudo analizar la imagen.'); }
}
function edDetectRooms(){
  const S=scaleInfo(Ed.src).S, minA=S?0.8*S*S:Ed.src.img.w*Ed.src.img.h*0.005;
  const polys=Detect.allRooms(Ed.src.walls,Ed.src.img.w,Ed.src.img.h,minA).filter(p=>p.length>=3);
  // conserva nombre y m² de las estancias que ya existían en el mismo sitio
  edPush(); const old=Ed.src.rooms;
  Ed.src.rooms=polys.map((poly,i)=>{ const c=P2.centroid(poly), prev=old.find(r=>P2.inPoly(c[0],c[1],r.poly));
    return prev?{...prev,poly}:{id:uid('r'),label:'Estancia '+(i+1),m2:null,floor:'wood',terrace:false,poly}; });
  Ed.sel=null; edChanged(); edMsg(`${Ed.src.rooms.length} estancias encontradas.`,true);
}

/* ---------- panel ---------- */
let edMsgT=null;
function edMsg(t,ok,ms){ const m=$('edMsg'); if(!m) return; m.textContent=t; m.classList.toggle('ok',!!ok); clearTimeout(edMsgT); edMsgT=setTimeout(()=>m.textContent='',ms||6000); }
function selObj(){ const s=Ed.sel; if(!s) return null;
  if(s.type==='wall') return wallById(s.id); if(s.type==='open'){ const w=wallById(s.id); return w&&w.o.find(o=>o.id===s.oid); }
  if(s.type==='room') return Ed.src.rooms.find(r=>r.id===s.id); if(s.type==='closet') return Ed.src.closets.find(c=>c.id===s.id);
  if(s.type==='cota') return Ed.src.scale.cotas[s.i]; return null; }
function edPanel(){
  if(!Ed.src) return; const src=Ed.src, si=scaleInfo(src), S=si.S;
  const nO=src.walls.reduce((s,w)=>s+w.o.length,0);
  const step=(ok,txt)=>`<li class="${ok?'ok':''}"><i aria-hidden="true">${ok?'✓':''}</i><span>${txt}</span></li>`;
  $('edSteps').innerHTML=step(!!Ed.img,'Plano cargado')+step(src.walls.length>0,`Muros: ${src.walls.length} · huecos: ${nO}`)
    +step(!!S,S?`Escala: 1 m = ${fmtN(S,1)} px`:'Escala sin fijar')+step(src.rooms.length>0,`Estancias: ${src.rooms.length}`);
  $('ed3d').disabled=!(S&&src.walls.length);
  $('edDetect').disabled=Ed.busy||!Ed.img; $('edDetect').textContent=Ed.busy?'Analizando…':(src.walls.length?'Volver a detectar':'Detectar muros y estancias');
  $('edRooms').disabled=!src.walls.length;
  $('edDark').value=src.detectDark||100; $('edDarkOut').textContent=src.detectDark||100;
  // escala
  let h='';
  if(si.refs.length){ h+='<ul class="refs">'+si.refs.map(r=>`<li><span>${esc(r.label)}</span><b>${fmtN(r.S,1)} px/m</b><small class="${Math.abs(r.dev)>4&&!si.fixed?'bad':''}">${r.dev>=0?'+':''}${fmtN(r.dev,1)} %</small></li>`).join('')+'</ul>';
    const spread=si.refs.length>1?Math.max(...si.refs.map(r=>Math.abs(r.dev))):0;
    h+=si.fixed?'<p class="note">Escala fijada a mano; las referencias solo se comparan.</p>':
      (spread>4?`<p class="note warn">Alguna referencia se aleja más de un 4 %: revisa ese m² o esa cota, o el contorno de esa estancia.</p>`:'');
  } else h+='<p class="note">Escribe los m² de dos o tres estancias (selecciónalas en el plano) o mide una cota conocida.</p>';
  $('edScaleInfo').innerHTML=h;
  $('edFixed').checked=si.fixed; $('edFixedS').disabled=!si.fixed; if(document.activeElement!==$('edFixedS')) $('edFixedS').value=si.fixed?fmtN(src.scale.fixed,2).replace(',','.'):(S?(+S.toFixed(2)):'');
  if(document.activeElement!==$('edHInt')) $('edHInt').value=Math.round(src.H_INT*100);
  if(document.activeElement!==$('edHDoor')) $('edHDoor').value=Math.round(src.H_DOOR*100);
  $('edOpacity').value=Ed.opacity; $('edShowImg').checked=Ed.showImg;
  edSelPanel();
}
function edSelPanel(){
  const box=$('edSel'), s=Ed.sel, o=selObj(); if(!s||!o){ box.hidden=true; box.innerHTML=''; return; } box.hidden=false;
  const S=scaleInfo(Ed.src).S, unit=S?'cm':'px', toU=px=>S?Math.round(px/S*100):Math.round(px), fromU=v=>S?v/100*S:v;
  let h='';
  if(s.type==='wall'){ const L=P2.len(o.a,o.b);
    h=`<div class="title">Muro</div><div class="grid2 num">
      <div class="field"><label for="sT">Grosor (${unit})</label><input id="sT" type="number" min="1" step="1" value="${toU(o.t)}"></div>
      <div class="field"><label for="sL">Largo (${unit})</label><input id="sL" type="number" min="1" step="1" value="${toU(L)}"></div></div>
      <div class="field"><label for="sH">Altura</label><select id="sH"><option value="auto">Automática (peto si da a terraza y exterior)</option><option value="full">Hasta el techo</option><option value="low">Peto de 1,05 m</option></select></div>
      <p class="note">Arrastra los puntos de los extremos para alargarlo o moverlo. Con el muro seleccionado, arrástralo para desplazarlo.</p>
      <div class="row"><button class="btn danger" id="sDel">Borrar muro</button></div>`; }
  else if(s.type==='open'){ const wd=o.e-o.s, isDoor=o.kind==='door'||o.kind==='glassdoor', d=openingDefaults(o,Ed.src.H_DOOR);
    h=`<div class="title">${esc(OPEN_KINDS.find(k=>k[0]===o.kind)[1])}</div>
      <div class="field"><label for="sK">Tipo</label><select id="sK">${OPEN_KINDS.map(([k,n])=>`<option value="${k}" ${k===o.kind?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="grid2 num"><div class="field"><label for="sW">Ancho (${unit})</label><input id="sW" type="number" min="1" step="1" value="${toU(wd)}"></div>
      ${(o.kind==='window'||o.kind==='glass')?`<div class="field"><label for="sSill">Antepecho (cm)</label><input id="sSill" type="number" min="0" max="250" step="1" value="${Math.round(d.sill*100)}"></div>`:''}
      <div class="field"><label for="sTop">Altura del hueco (cm)</label><input id="sTop" type="number" min="50" max="300" step="1" value="${Math.round(d.top*100)}"></div></div>
      ${isDoor?`<div class="row"><button class="btn" id="sHinge">Cambiar bisagra</button><button class="btn" id="sSide">Abrir hacia el otro lado</button></div>`:''}
      <p class="note">Arrástralo a lo largo del muro; arrastra sus extremos para cambiar el ancho.</p>
      <div class="row"><button class="btn danger" id="sDel">Borrar hueco</button></div>`; }
  else if(s.type==='room'){ const a=P2.area(o.poly);
    h=`<div class="title">Estancia</div>
      <div class="field"><label for="roomName">Nombre</label><input id="roomName" type="text" maxlength="40" value="${esc(o.label)}"></div>
      <div class="grid2 num"><div class="field"><label for="sM2">m² que pone el plano</label><input id="sM2" type="number" min="0" step="0.01" value="${o.m2||''}" placeholder="opcional"></div>
      <div class="field"><label>Medido</label><output class="measured">${S?fmtN(a/(S*S))+' m²':'sin escala'}</output></div></div>
      <div class="field"><label for="sF">Suelo</label><select id="sF">${FLOOR_KINDS.map(([k,n])=>`<option value="${k}" ${k===o.floor?'selected':''}>${n}</option>`).join('')}</select></div>
      <label class="toggle"><input type="checkbox" id="sTer" ${o.terrace?'checked':''}> Es exterior (terraza, tendedero…)</label>
      <p class="note">Los m² escritos sirven para fijar la escala y se muestran en el 3D.</p>
      <div class="row"><button class="btn" id="sRedo">Recalcular contorno</button><button class="btn danger" id="sDel">Borrar estancia</button></div>`; }
  else if(s.type==='closet'){ const [x0,y0,x1,y1]=o.r;
    h=`<div class="title">${o.kind==='pillar'?'Pilar':'Armario empotrado'}</div>
      <div class="field"><label for="sCK">Tipo</label><select id="sCK"><option value="closet" ${o.kind!=='pillar'?'selected':''}>Armario empotrado</option><option value="pillar" ${o.kind==='pillar'?'selected':''}>Pilar</option></select></div>
      <div class="grid3 num"><div class="field"><label for="sCW">Ancho (${unit})</label><input id="sCW" type="number" min="1" value="${toU(Math.abs(x1-x0))}"></div>
      <div class="field"><label for="sCD">Fondo (${unit})</label><input id="sCD" type="number" min="1" value="${toU(Math.abs(y1-y0))}"></div>
      <div class="field"><label for="sCH">Alto (cm)</label><input id="sCH" type="number" min="10" max="300" value="${Math.round(o.h*100)}"></div></div>
      <div class="row"><button class="btn danger" id="sDel">Borrar</button></div>`; }
  else if(s.type==='cota'){ const L=P2.len(o.a,o.b);
    h=`<div class="title">Cota para la escala</div>
      <div class="field num"><label for="cotaM">¿Cuántos metros mide en el plano?</label><input id="cotaM" type="number" min="0.1" step="0.01" value="${o.m||''}" placeholder="por ejemplo 3,40"></div>
      <p class="note">${Math.round(L)} px en la imagen.</p><div class="row"><button class="btn danger" id="sDel">Borrar cota</button></div>`; }
  box.innerHTML=h;
  const on=(id,ev,fn)=>{ const e=$(id); if(e) e.addEventListener(ev,fn); };
  const commit=()=>{ projectChanged(); edDraw(); };
  let pushed=false; const once=()=>{ if(!pushed){ edPush(); pushed=true; } };
  on('sDel','click',edDelete);
  if(s.type==='wall'){ $('sH').value=o.hMode||'auto';
    on('sT','input',e=>{ const v=+e.target.value; if(v>0){ once(); o.t=+fromU(v).toFixed(2); Ed.lastT=o.t; commit(); } });
    on('sL','input',e=>{ const v=+e.target.value; if(v>0){ once(); const u=P2.dir(o), L=fromU(v); o.b=[+(o.a[0]+u[0]*L).toFixed(1),+(o.a[1]+u[1]*L).toFixed(1)]; o.o=o.o.filter(q=>q.s<L).map(q=>({...q,e:Math.min(q.e,L)})); commit(); } });
    on('sH','change',e=>{ edPush(); o.hMode=e.target.value; edChanged(); }); }
  if(s.type==='open'){ const w=wallById(s.id);
    on('sK','change',e=>{ edPush(); o.kind=e.target.value; delete o.sill; delete o.top; edChanged(); });
    on('sW','input',e=>{ const v=+e.target.value; if(v>0){ once(); const L=P2.len(w.a,w.b), wd=Math.min(fromU(v),L), c=(o.s+o.e)/2; let s0=clamp(c-wd/2,0,L-wd); o.s=+s0.toFixed(1); o.e=+(s0+wd).toFixed(1); commit(); } });
    on('sSill','input',e=>{ const v=+e.target.value; if(v>=0){ once(); o.sill=v/100; commit(); } });
    on('sTop','input',e=>{ const v=+e.target.value; if(v>=50){ once(); o.top=v/100; commit(); } });
    on('sHinge','click',()=>{ edPush(); o.hinge=o.hinge==='end'?'start':'end'; edChanged(); });
    on('sSide','click',()=>{ edPush(); o.side=-(o.side||1); edChanged(); }); }
  if(s.type==='room'){
    on('roomName','input',e=>{ once(); o.label=e.target.value.slice(0,40)||'Estancia'; commit(); });
    on('sM2','input',e=>{ once(); const v=parseFloat(String(e.target.value).replace(',','.')); o.m2=v>0?v:null; commit(); edPanelLive(); });
    on('sF','change',e=>{ edPush(); o.floor=e.target.value; edChanged(); });
    on('sTer','change',e=>{ edPush(); o.terrace=e.target.checked; if(o.terrace&&o.floor==='wood') o.floor='outdoor'; edChanged(); });
    on('sRedo','click',()=>{ const c=P2.centroid(o.poly), r=Detect.roomAt(Ed.src.walls,Ed.src.img.w,Ed.src.img.h,c[0],c[1]);
      if(r.poly&&r.poly.length>=3){ edPush(); o.poly=r.poly; edChanged(); } else edMsg('No se encontró un contorno cerrado desde el centro de esta estancia.'); }); }
  if(s.type==='closet'){
    on('sCK','change',e=>{ edPush(); o.kind=e.target.value; edChanged(); });
    const dim=(i,e)=>{ const v=+e.target.value; if(!(v>0)) return; once(); const [x0,y0,x1,y1]=o.r, X0=Math.min(x0,x1), Y0=Math.min(y0,y1);
      if(i===0) o.r=[X0,Y0,X0+fromU(v),Math.max(y0,y1)]; else o.r=[X0,Y0,Math.max(x0,x1),Y0+fromU(v)]; o.r=o.r.map(q=>+q.toFixed(1)); commit(); };
    on('sCW','input',e=>dim(0,e)); on('sCD','input',e=>dim(1,e));
    on('sCH','input',e=>{ const v=+e.target.value; if(v>=10){ once(); o.h=v/100; commit(); } }); }
  if(s.type==='cota'){ on('cotaM','input',e=>{ once(); const v=parseFloat(String(e.target.value).replace(',','.')); o.m=v>0?v:null; commit(); edPanelLive(); }); }
}
// refresca lo que depende de la escala sin reconstruir el formulario que se está escribiendo
function edPanelLive(){ clearTimeout(edPanelLive.t); edPanelLive.t=setTimeout(()=>{ const a=document.activeElement, id=a&&a.id, pos=a&&a.selectionStart;
  edPanel(); if(id&&$(id)){ $(id).focus(); try{ if(pos!=null) $(id).setSelectionRange(pos,pos); }catch(_){} } },350); }

$('edDetect').onclick=()=>{ const b=$('edDetect');
  if(Ed.src.walls.length&&!b.dataset.confirm){ b.dataset.confirm='1'; b.textContent='¿Reemplazar los muros actuales? Pulsa otra vez'; setTimeout(()=>{ delete b.dataset.confirm; edPanel(); },4000); return; }
  delete b.dataset.confirm; edDetect(); };
$('edRooms').onclick=edDetectRooms;
$('edDark').addEventListener('input',e=>{ $('edDarkOut').textContent=e.target.value; });
$('edDark').addEventListener('change',e=>{ Ed.src.detectDark=+e.target.value; projectChanged(); });
$('edFixed').addEventListener('change',e=>{ edPush(); if(e.target.checked){ const S=scaleInfo(Ed.src).S||estScale(Ed.src); Ed.src.scale.fixed=+S.toFixed(3); } else Ed.src.scale.fixed=null; edChanged(); });
$('edFixedS').addEventListener('input',e=>{ const v=parseFloat(String(e.target.value).replace(',','.')); if(v>0&&Ed.src.scale.fixed){ Ed.src.scale.fixed=v; projectChanged(); edDraw(); edPanelLive(); } });
$('edHInt').addEventListener('input',e=>{ const v=+e.target.value; if(v>=180&&v<=500){ Ed.src.H_INT=v/100; projectChanged(); } });
$('edHDoor').addEventListener('input',e=>{ const v=+e.target.value; if(v>=150&&v<=300){ Ed.src.H_DOOR=v/100; projectChanged(); } });
$('edOpacity').addEventListener('input',e=>{ Ed.opacity=+e.target.value; edDraw(); });
$('edShowImg').addEventListener('change',e=>{ Ed.showImg=e.target.checked; edDraw(); });
$('edCota').onclick=()=>edSetTool('cota');

/* abre un proyecto en el editor */
async function edOpen(src,imgBlob){
  Ed.src=src; Ed.sel=null; Ed.draft=null; Ed.hist=[]; Ed.fut=[]; Ed.lastT=null;
  if(Ed.imgURL){ URL.revokeObjectURL(Ed.imgURL); Ed.imgURL=null; } Ed.img=null;
  if(imgBlob){ Ed.imgURL=URL.createObjectURL(imgBlob);
    Ed.img=await new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=Ed.imgURL; }); }
  edUndoState(); edPanel(); edDraw();
}
