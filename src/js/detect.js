/* =========================================================================
   Detección automática sobre la imagen del plano
   - muros (rellenos en negro o dibujados con doble línea), huecos de puerta y ventanas
   - estancias: zonas cerradas por los muros
   Todo trabaja en píxeles de la imagen. No necesita la escala.
   ========================================================================= */
const Detect = (function(){

function toGray(img){
  const d=img.data, g=new Uint8Array(img.width*img.height);
  for(let i=0,j=0;i<g.length;i++,j+=4){ const a=d[j+3]/255; g[i]=Math.round((0.299*d[j]+0.587*d[j+1]+0.114*d[j+2])*a+255*(1-a)); }
  return g;
}
// umbral de "tinta negra": unos 100 si las líneas son negras (los muebles suelen ir en gris y quedan fuera)
function autoDark(g){
  const h=new Uint32Array(256); for(let i=0;i<g.length;i++) h[g[i]]++;
  let n=0, lim=g.length*0.004, v=0; for(;v<256;v++){ n+=h[v]; if(n>lim) break; }   // tono de las líneas más oscuras
  return Math.max(60, Math.min(140, v+100));
}

/* componentes conexas (4 vecinos) */
function label(mask,W,H){
  const lab=new Int32Array(W*H), stack=new Int32Array(W*H), comps=[]; let id=0;
  for(let s=0;s<mask.length;s++){
    if(!mask[s]||lab[s]) continue;
    id++; let sp=0; stack[sp++]=s; lab[s]=id;
    const c={id,area:0,x0:W,y0:H,x1:-1,y1:-1,touch:false};
    while(sp){ const p=stack[--sp], x=p%W, y=(p-x)/W; c.area++;
      if(x<c.x0)c.x0=x; if(x>c.x1)c.x1=x; if(y<c.y0)c.y0=y; if(y>c.y1)c.y1=y;
      if(x===0||y===0||x===W-1||y===H-1) c.touch=true;
      if(x>0&&mask[p-1]&&!lab[p-1]){lab[p-1]=id;stack[sp++]=p-1;}
      if(x<W-1&&mask[p+1]&&!lab[p+1]){lab[p+1]=id;stack[sp++]=p+1;}
      if(y>0&&mask[p-W]&&!lab[p-W]){lab[p-W]=id;stack[sp++]=p-W;}
      if(y<H-1&&mask[p+W]&&!lab[p+W]){lab[p+W]=id;stack[sp++]=p+W;} }
    comps.push(c);
  }
  return {lab,comps};
}
/* tramos blancos acotados por tinta a ambos lados, de longitud <= maxLen */
function boundedRuns(dark,W,H,maxLen,vertical){
  const out=new Uint8Array(W*H), n=vertical?H:W, m=vertical?W:H;
  for(let a=0;a<m;a++){ let i=0;
    const at=k=>vertical?k*W+a:a*W+k;
    while(i<n){ if(dark[at(i)]){i++;continue;} const s=i; while(i<n&&!dark[at(i)]) i++;
      if(s>0&&i<n&&i-s<=maxLen) for(let k=s;k<i;k++) out[at(k)]=1; } }
  return out;
}
/* lo mismo en diagonal (dx,dy) = (1,1) o (1,-1), para muros a 45° */
function boundedRunsDiag(dark0,W,H,maxLen,dy){
  // una línea fina a 45° solo ocupa casillas de una paridad: se engorda 1 px para no saltarla
  const dark=new Uint8Array(W*H); for(let i=0;i<dark.length;i++) dark[i]=dark0[i]||((i%W)<W-1&&dark0[i+1])?1:0;
  const out=new Uint8Array(W*H), starts=[];
  for(let x=0;x<W;x++) starts.push([x,dy>0?0:H-1]);
  for(let y=0;y<H;y++) if(dy>0?y>0:y<H-1) starts.push([0,y]);
  const line=[];
  for(const [sx,sy] of starts){ line.length=0; let x=sx,y=sy; while(x<W&&y>=0&&y<H){ line.push(y*W+x); x++; y+=dy; }
    let i=0; const n=line.length;
    while(i<n){ if(dark[line[i]]){i++;continue;} const s=i; while(i<n&&!dark[line[i]]) i++;
      if(s>0&&i<n&&i-s<=maxLen) for(let k=s;k<i;k++) out[line[k]]=1; } }
  return out;
}
function runLengths(mask,W,H,vertical){
  const out=new Uint16Array(W*H), n=vertical?H:W, m=vertical?W:H;
  for(let a=0;a<m;a++){ let i=0; const at=k=>vertical?k*W+a:a*W+k;
    while(i<n){ if(!mask[at(i)]){i++;continue;} const s=i; while(i<n&&mask[at(i)]) i++; const L=Math.min(65535,i-s); for(let k=s;k<i;k++) out[at(k)]=L; } }
  return out;
}
/* distancia (chaflán 3-4) al pixel de tinta más cercano, en píxeles */
function distT(white,W,H){
  const D=new Float32Array(W*H), INF=1e9;
  for(let i=0;i<D.length;i++) D[i]=white[i]?INF:0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(!D[i]) continue; let v=D[i];
    if(x>0) v=Math.min(v,D[i-1]+3); if(y>0){ v=Math.min(v,D[i-W]+3); if(x>0) v=Math.min(v,D[i-W-1]+4); if(x<W-1) v=Math.min(v,D[i-W+1]+4); } D[i]=v; }
  for(let y=H-1;y>=0;y--) for(let x=W-1;x>=0;x--){ const i=y*W+x; if(!D[i]) continue; let v=D[i];
    if(x<W-1) v=Math.min(v,D[i+1]+3); if(y<H-1){ v=Math.min(v,D[i+W]+3); if(x<W-1) v=Math.min(v,D[i+W+1]+4); if(x>0) v=Math.min(v,D[i+W-1]+4); } D[i]=v; }
  for(let i=0;i<D.length;i++) D[i]/=3;
  return D;
}
function morph(mask,W,H,erode){
  const t=new Uint8Array(W*H), o=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; const a=x>0?mask[i-1]:(erode?0:0), b=mask[i], c=x<W-1?mask[i+1]:0;
    t[i]=erode?(a&&b&&c?1:0):(a||b||c?1:0); }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; const a=y>0?t[i-W]:0, b=t[i], c=y<H-1?t[i+W]:0;
    o[i]=erode?(a&&b&&c?1:0):(a||b||c?1:0); }
  return o;
}

/* ---------- geometría ---------- */
const len=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function dirOf(w){ const L=len(w.a,w.b)||1; return [(w.b[0]-w.a[0])/L,(w.b[1]-w.a[1])/L]; }
function distToSeg(p,a,b){ const dx=b[0]-a[0], dy=b[1]-a[1], L2=dx*dx+dy*dy||1; let t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2; t=Math.max(0,Math.min(1,t));
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy); }

/* ---------- análisis completo ---------- */
function analyze(img,opts={}){
  const W=img.width, H=img.height, N=W*H, g=toGray(img);
  const T=opts.dark||autoDark(g);
  const dark=new Uint8Array(N), ink=new Uint8Array(N);
  for(let i=0;i<N;i++){ dark[i]=g[i]<T?1:0; ink[i]=g[i]<215?1:0; }
  const diag=Math.hypot(W,H);
  const tmax=Math.max(6,Math.min(60,diag*0.018));      // semigrosor máximo de un muro
  const Lmin=Math.max(14,diag*0.016);                 // longitud mínima de un muro
  // 1) muros a doble línea: blanco entre dos líneas cercanas, alargado
  const keepLong=(cand,vertical)=>{ const {lab,comps}=label(cand,W,H), ok=new Uint8Array(comps.length+1);
    comps.forEach(c=>{ const h=c.y1-c.y0+1, w=c.x1-c.x0+1, L=vertical?h:w, T2=vertical?w:h; if(L>=Lmin&&L>=3*T2) ok[c.id]=1; });
    const out=new Uint8Array(N); for(let i=0;i<N;i++) if(ok[lab[i]]) out[i]=1; return out; };
  const fv=keepLong(boundedRuns(dark,W,H,2*tmax,false),true);
  const fh=keepLong(boundedRuns(dark,W,H,2*tmax,true),false);
  const keepDiag=(cand,dy)=>{ const {lab,comps}=label(cand,W,H), n=comps.length+1;
    const u0=new Float32Array(n).fill(1e9),u1=new Float32Array(n).fill(-1e9),v0=new Float32Array(n).fill(1e9),v1=new Float32Array(n).fill(-1e9);
    for(let i=0;i<N;i++){ const l=lab[i]; if(!l) continue; const x=i%W, y=(i-x)/W, u=x+dy*y, v=x-dy*y;
      if(u<u0[l])u0[l]=u; if(u>u1[l])u1[l]=u; if(v<v0[l])v0[l]=v; if(v>v1[l])v1[l]=v; }
    const ok=new Uint8Array(n); comps.forEach(c=>{ const du=u1[c.id]-u0[c.id]+1, dv=v1[c.id]-v0[c.id]+1; if(dv/Math.SQRT2>=Lmin&&dv>=3*du) ok[c.id]=1; });
    const out=new Uint8Array(N); for(let i=0;i<N;i++) if(ok[lab[i]]) out[i]=1; return out; };
  const fd1=keepDiag(boundedRunsDiag(dark,W,H,Math.round(2*tmax/Math.SQRT2),1),1);
  const fd2=keepDiag(boundedRunsDiag(dark,W,H,Math.round(2*tmax/Math.SQRT2),-1),-1);
  // 2) huecos blancos cerrados y estrechos (interior de muros dibujados en contorno, también oblicuos)
  const white=new Uint8Array(N); for(let i=0;i<N;i++) white[i]=dark[i]?0:1;
  const DT=distT(white,W,H), wl=label(white,W,H), mx=new Float32Array(wl.comps.length+1);
  for(let i=0;i<N;i++){ const l=wl.lab[i]; if(l&&DT[i]>mx[l]) mx[l]=DT[i]; }
  const narrow=new Uint8Array(wl.comps.length+1);
  wl.comps.forEach(c=>{ if(c.touch) return; const L=Math.max(c.x1-c.x0,c.y1-c.y0)+1; if(mx[c.id]<=tmax && L>=6*mx[c.id] && L>=Lmin) narrow[c.id]=1; });
  const M=new Uint8Array(N); for(let i=0;i<N;i++) M[i]=(dark[i]||fv[i]||fh[i]||fd1[i]||fd2[i]||narrow[wl.lab[i]])?1:0;
  // 3) quita líneas finas (textos, cotas, mobiliario)
  const th=morph(morph(M,W,H,true),W,H,false);
  // 4) bandas horizontales y verticales
  const RH=runLengths(th,W,H,false), RV=runLengths(th,W,H,true), maxT=2*tmax;
  const Hm=new Uint8Array(N), Vm=new Uint8Array(N);
  for(let i=0;i<N;i++) if(th[i]){ if(RH[i]>=Lmin&&RV[i]<=maxT) Hm[i]=1; if(RV[i]>=Lmin&&RH[i]<=maxT) Vm[i]=1; }
  let walls=[];
  [[Hm,true],[Vm,false]].forEach(([m,hor])=>{ const {lab,comps}=label(m,W,H), sum=new Float64Array(comps.length+1);
    for(let i=0;i<N;i++){ const l=lab[i]; if(l) sum[l]+=hor?Math.floor(i/W):i%W; }
    comps.forEach(c=>{ const L=hor?c.x1-c.x0+1:c.y1-c.y0+1, Tk=hor?c.y1-c.y0+1:c.x1-c.x0+1, t=c.area/L, fill=c.area/(L*Tk);
      if(L<Lmin||t<2||fill<0.5) return; const axis=sum[c.id]/c.area+0.5;
      walls.push(hor?{a:[c.x0,axis],b:[c.x1+1,axis],t}:{a:[axis,c.y0],b:[axis,c.y1+1],t}); }); });
  // 5) lo que sobra: muros oblicuos (eje principal de cada mancha alargada)
  const cov=new Uint8Array(N);
  walls.forEach(w=>{ const x0=Math.max(0,Math.floor(Math.min(w.a[0],w.b[0])-w.t/2-1)), x1=Math.min(W-1,Math.ceil(Math.max(w.a[0],w.b[0])+w.t/2+1));
    const y0=Math.max(0,Math.floor(Math.min(w.a[1],w.b[1])-w.t/2-1)), y1=Math.min(H-1,Math.ceil(Math.max(w.a[1],w.b[1])+w.t/2+1));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) cov[y*W+x]=1; });
  const res=new Uint8Array(N); for(let i=0;i<N;i++) res[i]=th[i]&&!cov[i]?1:0;
  { const {lab,comps}=label(res,W,H), S=comps.map(()=>({n:0,sx:0,sy:0,sxx:0,syy:0,sxy:0}));
    for(let i=0;i<N;i++){ const l=lab[i]; if(!l) continue; const s=S[l-1], x=i%W+.5, y=Math.floor(i/W)+.5; s.n++; s.sx+=x; s.sy+=y; s.sxx+=x*x; s.syy+=y*y; s.sxy+=x*y; }
    comps.forEach((c,k)=>{ const s=S[k]; if(s.n<Lmin*3) return;
      const cx=s.sx/s.n, cy=s.sy/s.n, a=s.sxx/s.n-cx*cx, b=s.sxy/s.n-cx*cy, d=s.syy/s.n-cy*cy;
      const th2=0.5*Math.atan2(2*b,a-d), ux=Math.cos(th2), uy=Math.sin(th2);
      let pmin=1e9,pmax=-1e9;
      for(let y=c.y0;y<=c.y1;y++) for(let x=c.x0;x<=c.x1;x++) if(lab[y*W+x]===c.id){ const p=(x+.5-cx)*ux+(y+.5-cy)*uy; if(p<pmin)pmin=p; if(p>pmax)pmax=p; }
      const L=pmax-pmin, t=s.n/L, ang=Math.abs(th2*180/Math.PI)%90;
      if(L>=Lmin&&L>=3*t&&t<=maxT&&ang>8&&ang<82) walls.push({a:[cx+ux*pmin,cy+uy*pmin],b:[cx+ux*pmax,cy+uy*pmax],t}); }); }
  walls=walls.filter(w=>w.t>=1.5).map(w=>({...w,o:[],ext:[0,0]}));
  // grosor típico
  const byLen=walls.map(w=>[w.t,len(w.a,w.b)]).sort((p,q)=>p[0]-q[0]); let tot=byLen.reduce((s,v)=>s+v[1],0), acc=0, tMed=6;
  for(const [t,l] of byLen){ acc+=l; if(acc>=tot/2){ tMed=t; break; } }
  const maxGap=Math.max(16*tMed, Lmin*2.5), minDoor=Math.max(3.5*tMed, Lmin*0.7);
  walls=mergeCollinear(walls,maxGap,minDoor);
  junctions(walls,maxGap*0.8,ink,W,H,tMed);
  findWindows(walls,dark,W,H,tMed,Lmin);
  walls.forEach(w=>w.o.forEach(o=>classifyGap(w,o,dark,ink,W,H)));
  walls=walls.filter(w=>len(w.a,w.b)>=Lmin*0.6);
  walls.forEach(w=>{ w.a=w.a.map(v=>+v.toFixed(1)); w.b=w.b.map(v=>+v.toFixed(1)); w.t=+w.t.toFixed(1); w.ext=w.ext.map(v=>+v.toFixed(1));
    w.o.forEach(o=>{ o.s=+o.s.toFixed(1); o.e=+o.e.toFixed(1); }); w.o.sort((p,q)=>p.s-q.s); });
  return {walls, dark:T, tMed, Lmin};
}

/* une tramos colineales; si entre ellos queda un hueco del tamaño de una puerta, lo convierte en hueco */
function mergeCollinear(walls,maxGap,minDoor){
  const attached=(P,w)=>{ const u=dirOf(w); return walls.some(k=>{ if(k===w) return false; const v=dirOf(k); if(Math.abs(u[0]*v[0]+u[1]*v[1])>0.9) return false;
    return distToSeg(P,k.a,k.b)<=k.t/2+w.t*0.8+2; }); };
  let changed=true;
  while(changed){ changed=false;
    outer: for(let i=0;i<walls.length;i++) for(let j=0;j<walls.length;j++){ if(i===j) continue;
      const A=walls[i], B=walls[j], u=dirOf(A), v=dirOf(B);
      if(Math.abs(u[0]*v[0]+u[1]*v[1])<0.996) continue;
      const nrm=[-u[1],u[0]], off=(B.a[0]-A.a[0])*nrm[0]+(B.a[1]-A.a[1])*nrm[1];
      const tm=Math.max(A.t,B.t); if(Math.abs(off)>Math.max(2,0.6*tm)) continue;
      if(Math.abs(A.t-B.t)>Math.max(3,0.5*tm)) continue;
      const pr=p=>(p[0]-A.a[0])*u[0]+(p[1]-A.a[1])*u[1];
      const a0=0, a1=len(A.a,A.b); let b0=pr(B.a), b1=pr(B.b); const flip=b0>b1; if(flip){ const t=b0; b0=b1; b1=t; }
      if(b0<a1-1e-6 && b1>a0+1e-6 && !(b0>=a1-3)){ /* se solapan */ }
      else if(b0<a1-3) continue;           // B está antes que A: se tratará en el orden contrario
      const gap=b0-a1;
      if(gap>maxGap) continue;
      let open=null;
      if(gap>3){
        if(gap<minDoor){ /* rotura pequeña: se une macizo */ }
        else { const P1=[A.a[0]+u[0]*a1,A.a[1]+u[1]*a1], P2=[A.a[0]+u[0]*b0,A.a[1]+u[1]*b0];
          if(attached(P1,A)&&attached(P2,B)) continue;   // cruza un pasillo entre dos muros: no es hueco
          open={s:a1,e:b0,kind:'door'}; }
      }
      const lA=a1, lB=b1-b0, n0=Math.min(a0,b0), n1=Math.max(a1,b1), offN=off*lB/(lA+lB);
      const base=[A.a[0]+nrm[0]*offN, A.a[1]+nrm[1]*offN];
      const ops=[...A.o.map(o=>({...o,s:o.s-n0,e:o.e-n0})),
        ...B.o.map(o=>{ const s=flip?(b1-o.e):(b0+o.s), e=flip?(b1-o.s):(b0+o.e); return {...o,s:s-n0,e:e-n0}; })];
      if(open) ops.push({...open,s:open.s-n0,e:open.e-n0});
      walls[i]={a:[base[0]+u[0]*n0,base[1]+u[1]*n0], b:[base[0]+u[0]*n1,base[1]+u[1]*n1], t:(A.t*lA+B.t*lB)/(lA+lB), o:ops, ext:[0,0]};
      walls.splice(j,1); changed=true; break outer;
    }
  }
  return walls;
}

/* encuentros en T y en L: ajusta extremos al eje del otro muro; extremos sueltos cerca de otro muro -> hueco */
function junctions(walls,maxGapEnd,ink,W,H,tMed){
  const found=[];
  walls.forEach((W0,wi)=>{ const u=dirOf(W0), L=len(W0.a,W0.b);
    [0,1].forEach(end=>{ const E=end?W0.b:W0.a, d=end?u:[-u[0],-u[1]]; let best=null;
      walls.forEach((K,ki)=>{ if(K===W0) return; const v=dirOf(K), cr=d[0]*v[1]-d[1]*v[0], sin=Math.abs(cr); if(sin<0.34) return;
        const LK=len(K.a,K.b), wx=K.a[0]-E[0], wy=K.a[1]-E[1];
        const t=(wx*v[1]-wy*v[0])/cr, s=(wx*d[1]-wy*d[0])/cr;   // E+d*t = K.a+v*s
        const half=K.t/2/sin;
        if(s<-K.t/2-W0.t||s>LK+K.t/2+W0.t) return;
        if(t<-(half+W0.t)||t>maxGapEnd) return;
        if(t>L*0.5+half && t>maxGapEnd*0.25) { /* lejos: solo si es razonable */ }
        if(!best||Math.abs(t)<Math.abs(best.t)) best={ki,t,s,sin,half,LK,P:[E[0]+d[0]*t,E[1]+d[1]*t]}; });
      if(best) found.push({wi,end,...best}); }); });
  const touch=j=>j.t<=j.half+Math.max(3,walls[j.wi].t*0.6);
  // extremos con encuentro directo
  found.forEach(j=>{ const W0=walls[j.wi], K=walls[j.ki];
    if(!touch(j)) return;
    const nearEnd = j.s<=K.t/2+W0.t+3 || j.s>=j.LK-K.t/2-W0.t-3;
    let ext=-j.half;
    if(nearEnd){ // esquina en L: el más grueso (o el primero) llega a la cara exterior; el otro para en la cara interior
      const iAmA = W0.t>K.t+0.5 || (Math.abs(W0.t-K.t)<=0.5 && j.wi<j.ki);
      ext = iAmA ? K.t/2/j.sin : -K.t/2/j.sin; }
    j.done=true; j.newP=j.P; j.ext=ext; });
  // extremos sueltos cerca de un muro: se prolongan y el tramo nuevo es un hueco (puerta)
  found.forEach(j=>{ if(j.done||j.t<=0) return; const W0=walls[j.wi];
    if(found.some(o=>o.wi===j.wi&&o.end===j.end&&o.done)) return;
    const gl=j.t-j.half; if(gl<3.5*tMed||gl>9.5*tMed) return;
    // solo si se ve el arco de la puerta dibujado
    const L0=len(W0.a,W0.b), vw=j.end===1?{a:W0.a,b:j.P,t:W0.t}:{a:j.P,b:W0.b,t:W0.t};
    const vo=j.end===1?{s:L0,e:L0+gl}:{s:j.half,e:j.half+gl};
    if(bestSwing(vw,vo,ink,W,H).score<0.3) return;
    j.gapOpen={len:gl}; j.newP=j.P; j.ext=-j.half; j.done=true; });
  // aplica (primero los finales "b" para no mover el origen de los huecos)
  found.filter(j=>j.done).sort((p,q)=>q.end-p.end).forEach(j=>{ const W0=walls[j.wi];
    if(j.end===1){ const L0=len(W0.a,W0.b); W0.b=j.newP; W0.ext[1]=j.ext;
      if(j.gapOpen&&j.gapOpen.len>4) W0.o.push({s:L0,e:L0+j.gapOpen.len,kind:'door'}); }
    else { const L0=len(W0.a,W0.b), na=j.newP; const shift=len(na,W0.a)*(j.t>=0?1:-1);
      W0.a=na; W0.ext[0]=j.ext; W0.o.forEach(o=>{ o.s+=shift; o.e+=shift; });
      if(j.gapOpen&&j.gapOpen.len>4) W0.o.push({s:j.half,e:j.half+j.gapOpen.len,kind:'door'}); }
  });
  walls.forEach(w=>{ const L=len(w.a,w.b); w.o=w.o.filter(o=>o.e-o.s>3).map(o=>({...o,s:Math.max(0,o.s),e:Math.min(L,o.e)})).filter(o=>o.e-o.s>3); });
}

/* ventanas: tramos de muro con 3 o más líneas a lo ancho */
function findWindows(walls,dark,W,H,tMed,Lmin){
  const px=(x,y)=>{ x=Math.round(x); y=Math.round(y); return x>=0&&y>=0&&x<W&&y<H?dark[y*W+x]:0; };
  walls.forEach(w=>{ const u=dirOf(w), n=[-u[1],u[0]], L=len(w.a,w.b), flags=new Uint8Array(Math.ceil(L)+1);
    const half=w.t/2+2;
    for(let s=0;s<=L;s++){ if(w.o.some(o=>s>=o.s-2&&s<=o.e+2)) continue; let runs=0, prev=0;
      for(let k=-half;k<=half;k+=1){ const v=px(w.a[0]+u[0]*s+n[0]*k, w.a[1]+u[1]*s+n[1]*k); if(v&&!prev) runs++; prev=v; }
      flags[s]=runs>=3?1:0; }
    const cnt=flags.reduce((a,b)=>a+b,0); if(cnt>0.7*L) return;    // muro rayado: no son ventanas
    let s=0; const minL=Math.max(Lmin*0.8,4*tMed);
    while(s<=L){ if(!flags[s]){s++;continue;} let e=s; let gap=0;
      while(e<=L&&(flags[e]||gap<4)){ if(flags[e]) gap=0; else gap++; e++; }
      e-=gap; if(e-s>=minL) w.o.push({s,e,kind:'window'}); s=e+1; }
  });
}

/* tipo de hueco y sentido de apertura de las puertas */
function classifyGap(w,o,dark,ink,W,H){
  const u=dirOf(w), n=[-u[1],u[0]], at=s=>[w.a[0]+u[0]*s,w.a[1]+u[1]*s];
  const get=(m,x,y)=>{ x=Math.round(x); y=Math.round(y); return x>=0&&y>=0&&x<W&&y<H?m[y*W+x]:0; };
  const near=(x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(get(ink,x+dx,y+dy)) return 1; return 0; };
  if(o.kind==='window'){ o.hinge='start'; o.side=1; return; }
  const g=o.e-o.s;
  // tinta dentro del hueco: carpintería de corredera o ventanal
  let c=0,t=0; for(let s=o.s+2;s<=o.e-2;s++) for(let k=-w.t/2+1;k<=w.t/2-1;k++){ const p=at(s); t++; c+=get(dark,p[0]+n[0]*k,p[1]+n[1]*k); }
  if(t&&c/t>0.15){ o.kind='glassdoor'; }
  const best=bestSwing(w,o,ink,W,H);
  o.hinge=best.hinge; o.side=best.side;
}
/* busca el arco y la hoja dibujados: devuelve bisagra, lado y lo bien que encaja (0..1) */
function bestSwing(w,o,ink,W,H){
  const u=dirOf(w), n=[-u[1],u[0]], at=s=>[w.a[0]+u[0]*s,w.a[1]+u[1]*s], g=o.e-o.s;
  const get=(x,y)=>{ x=Math.round(x); y=Math.round(y); return x>=0&&y>=0&&x<W&&y<H?ink[y*W+x]:0; };
  const near=(x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(get(x+dx,y+dy)) return 1; return 0; };
  let best={score:0,hinge:'start',side:1};
  ['start','end'].forEach(hinge=>[1,-1].forEach(side=>{ const h=at(hinge==='start'?o.s:o.e), al=hinge==='start'?u:[-u[0],-u[1]];
    let hit=0,tot=0;
    for(let k=0;k<=24;k++){ const f=(5+k*80/24)*Math.PI/180; const x=h[0]+g*(Math.cos(f)*al[0]+Math.sin(f)*n[0]*side), y=h[1]+g*(Math.cos(f)*al[1]+Math.sin(f)*n[1]*side); tot++; hit+=near(x,y); }
    for(let k=0;k<=12;k++){ const r=g*(0.25+0.7*k/12); tot++; hit+=near(h[0]+n[0]*side*(w.t/2+r*0.98),h[1]+n[1]*side*(w.t/2+r*0.98)); }
    const sc=hit/tot; if(sc>best.score) best={score:sc,hinge,side}; }));
  return best;
}

/* ---------- estancias: zonas cerradas por los muros ---------- */
// raster de muros (sin huecos) sobre una cuadrícula reducida
function wallRaster(walls,W,H,maxSide){
  const f=Math.min(1,maxSide/Math.max(W,H)), w=Math.max(1,Math.round(W*f)), h=Math.max(1,Math.round(H*f));
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.strokeStyle='#000'; x.lineCap='butt';
  walls.forEach(wl=>{ const u=dirOf(wl), e0=(wl.ext?wl.ext[0]:wl.t/2), e1=(wl.ext?wl.ext[1]:wl.t/2);
    const ea=Math.max(e0,0)+1.5, eb=Math.max(e1,0)+1.5;
    x.lineWidth=Math.max(1.5,wl.t*f);
    x.beginPath(); x.moveTo((wl.a[0]-u[0]*ea)*f,(wl.a[1]-u[1]*ea)*f); x.lineTo((wl.b[0]+u[0]*eb)*f,(wl.b[1]+u[1]*eb)*f); x.stroke(); });
  const d=x.getImageData(0,0,w,h).data, free=new Uint8Array(w*h);
  for(let i=0;i<free.length;i++) free[i]=d[i*4]>128?1:0;
  return {free,w,h,f};
}
function flood(free,w,h,sx,sy){
  const m=new Uint8Array(w*h); if(sx<0||sy<0||sx>=w||sy>=h||!free[sy*w+sx]) return null;
  const st=[sy*w+sx]; m[sy*w+sx]=1; let n=0, touch=false;
  while(st.length){ const p=st.pop(), x=p%w, y=(p-x)/w; n++; if(x===0||y===0||x===w-1||y===h-1) touch=true;
    const nb=[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1];
    for(const q of nb) if(q>=0&&free[q]&&!m[q]){ m[q]=1; st.push(q); } }
  return {m,n,touch};
}
// contorno exterior de una región (cuadrados en marcha) y simplificación
function trace(m,w,h){
  const at=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&m[y*w+x];
  let s=-1; for(let i=0;i<m.length;i++) if(m[i]){ s=i; break; } if(s<0) return [];
  const sx=s%w, sy=(s-sx)/w; let x=sx, y=sy, dir=0; const pts=[]; const DX=[1,0,-1,0], DY=[0,1,0,-1];
  let guard=0;
  do{ pts.push([x,y]);
    const TL=at(x-1,y-1),TR=at(x,y-1),BL=at(x-1,y),BR=at(x,y);
    const ok=[BR&&!TR, BL&&!BR, TL&&!BL, TR&&!TL];
    const right=(dir+1)%4; let nd;
    if(ok[right]) nd=right; else if(ok[dir]) nd=dir; else if(ok[(dir+3)%4]) nd=(dir+3)%4; else nd=(dir+2)%4;
    dir=nd; x+=DX[dir]; y+=DY[dir];
  } while((x!==sx||y!==sy)&&++guard<w*h*4);
  return simplify(pts,1.1);
}
function simplify(pts,eps){
  if(pts.length<4) return pts;
  // Douglas-Peucker sobre polígono cerrado: parte por el punto más lejano al primero
  let far=0,fd=-1; pts.forEach((p,i)=>{ const d=len(p,pts[0]); if(d>fd){fd=d;far=i;} });
  const dp=(arr)=>{ if(arr.length<3) return arr; let id=0,dm=0; const a=arr[0],b=arr[arr.length-1];
    for(let i=1;i<arr.length-1;i++){ const d=distToSeg(arr[i],a,b); if(d>dm){dm=d;id=i;} }
    if(dm>eps){ const l=dp(arr.slice(0,id+1)), r=dp(arr.slice(id)); return l.slice(0,-1).concat(r); } return [a,b]; };
  const A=dp(pts.slice(0,far+1)), B=dp(pts.slice(far).concat([pts[0]]));
  const out=A.slice(0,-1).concat(B.slice(0,-1));
  // quita puntos casi alineados
  return out.filter((p,i)=>{ const a=out[(i-1+out.length)%out.length], b=out[(i+1)%out.length]; return distToSeg(p,a,b)>0.6; });
}
function roomAt(walls,W,H,px,py){
  const R=wallRaster(walls,W,H,1600), sx=Math.floor(px*R.f), sy=Math.floor(py*R.f);
  const r=flood(R.free,R.w,R.h,sx,sy); if(!r) return {error:'wall'}; if(r.touch) return {error:'open'};
  const poly=trace(r.m,R.w,R.h).map(([x,y])=>[+(x/R.f).toFixed(1),+(y/R.f).toFixed(1)]);
  return {poly};
}
function allRooms(walls,W,H,minAreaPx){
  const R=wallRaster(walls,W,H,1400), done=new Uint8Array(R.w*R.h), out=[];
  for(let y=1;y<R.h-1;y+=2) for(let x=1;x<R.w-1;x+=2){ const i=y*R.w+x; if(!R.free[i]||done[i]) continue;
    const r=flood(R.free,R.w,R.h,x,y); for(let k=0;k<r.m.length;k++) if(r.m[k]) done[k]=1;
    if(r.touch) continue; if(r.n/(R.f*R.f)<minAreaPx) continue;
    out.push(trace(r.m,R.w,R.h).map(([a,b])=>[+(a/R.f).toFixed(1),+(b/R.f).toFixed(1)])); }
  return out;
}

return {analyze, roomAt, allRooms, autoDark, toGray};
})();
