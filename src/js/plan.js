/* =========================================================================
   Planta: datos del editor (píxeles de la imagen) -> planta en metros para el 3D
   ========================================================================= */
const P2 = {
  len:(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]),
  dir(w){ const L=P2.len(w.a,w.b)||1; return [(w.b[0]-w.a[0])/L,(w.b[1]-w.a[1])/L]; },
  area(P){ let a=0; for(let i=0;i<P.length;i++){ const [x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length]; a+=x1*y2-x2*y1; } return Math.abs(a)/2; },
  centroid(P){ let a=0,cx=0,cy=0; for(let i=0;i<P.length;i++){ const [x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length], c=x1*y2-x2*y1; a+=c; cx+=(x1+x2)*c; cy+=(y1+y2)*c; }
    if(Math.abs(a)<1e-9){ const n=P.length||1; return [P.reduce((s,p)=>s+p[0],0)/n,P.reduce((s,p)=>s+p[1],0)/n]; } return [cx/(3*a),cy/(3*a)]; },
  inPoly(x,y,P){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,yi]=P[i],[xj,yj]=P[j];
    if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; },
  distSeg(p,a,b){ const dx=b[0]-a[0], dy=b[1]-a[1], L2=dx*dx+dy*dy||1; let t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2; t=clamp(t,0,1);
    return {d:Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy), t}; },
};

const FLOOR_KINDS = [['wood','Madera'],['tile','Baldosa'],['marble','Mármol'],['outdoor','Exterior']];
const OPEN_KINDS = [['door','Puerta'],['glassdoor','Puerta de cristal'],['window','Ventana'],['glass','Ventanal']];

function emptySrc(w,h){ return {v:2,img:{w,h},origin:[0,0],scale:{cotas:[],fixed:null},H_INT:2.6,H_DOOR:2.1,walls:[],rooms:[],closets:[]}; }

/* deja los datos con la forma actual (ids, huecos con "side", etc.) */
function normalizeSrc(src){
  src.v=2; src.origin=src.origin||[0,0]; src.scale=src.scale||{cotas:[],fixed:null}; src.scale.cotas=src.scale.cotas||[];
  src.H_INT=src.H_INT||2.6; src.H_DOOR=src.H_DOOR||2.1;
  src.walls=(src.walls||[]).map(w=>{ const n={id:w.id||uid('w'),a:w.a.slice(),b:w.b.slice(),t:w.t,hMode:w.hMode||'auto',ext:w.ext?w.ext.slice():null,o:[]};
    const u=P2.dir(n), nr=[-u[1],u[0]];
    n.o=(w.o||[]).map(o=>{ const q={id:o.id||uid('o'),s:o.s,e:o.e,kind:o.kind||'door',hinge:o.hinge||'start',side:o.side||1};
      if(o.into){ const h=o.hinge==='end'?o.e:o.s, hp=[n.a[0]+u[0]*h,n.a[1]+u[1]*h]; q.side=((o.into[0]-hp[0])*nr[0]+(o.into[1]-hp[1])*nr[1])>0?1:-1; }
      if(o.sill!=null) q.sill=o.sill; if(o.top!=null) q.top=o.top; return q; });
    return n; });
  src.rooms=(src.rooms||[]).map((r,i)=>({id:r.id||uid('r'),label:r.label||('Estancia '+(i+1)),m2:r.m2>0?+r.m2:null,floor:r.floor||'wood',terrace:!!r.terrace,poly:r.poly.map(p=>p.slice())}));
  src.closets=(src.closets||[]).map(c=>({id:c.id||uid('c'),r:c.r.slice(),h:c.h||2.2,kind:c.kind||'closet'}));
  return src;
}

/* escala (px por metro) a partir de cotas y de las estancias con m² escritos */
function scaleInfo(src){
  const refs=[];
  (src.scale.cotas||[]).forEach((c,i)=>{ if(c.m>0){ const d=P2.len(c.a,c.b); if(d>1) refs.push({type:'cota',i,S:d/c.m,label:'Cota de '+fmtN(c.m)+' m'}); } });
  src.rooms.forEach(r=>{ if(r.m2>0&&r.poly.length>=3) refs.push({type:'room',id:r.id,S:Math.sqrt(P2.area(r.poly)/r.m2),label:r.label+' · '+fmtN(r.m2)+' m²'}); });
  let S=null;
  if(src.scale.fixed>0) S=src.scale.fixed;
  else if(refs.length){ const v=refs.map(r=>r.S).sort((a,b)=>a-b), m=v.length>>1; S=v.length%2?v[m]:(v[m-1]+v[m])/2; }
  refs.forEach(r=>r.dev=S?(r.S/S-1)*100:0);
  return {S,refs,fixed:src.scale.fixed>0};
}
function estScale(src){ const s=scaleInfo(src).S; if(s) return s;
  const ts=src.walls.map(w=>w.t).sort((a,b)=>a-b); return ts.length?ts[ts.length>>1]/0.12:Math.max(src.img.w,src.img.h)/15; }

function srcRoomAt(src,x,y){ for(const r of src.rooms) if(P2.inPoly(x,y,r.poly)) return r; return null; }
/* altura automática: peto si el muro solo separa terraza y exterior */
function wallHeight(src,w,S){
  if(w.hMode==='full') return src.H_INT;
  if(w.hMode==='low') return 1.05;
  const u=P2.dir(w), n=[-u[1],u[0]], m=[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2], d=w.t/2+0.25*S;
  const A=srcRoomAt(src,m[0]+n[0]*d,m[1]+n[1]*d), B=srcRoomAt(src,m[0]-n[0]*d,m[1]-n[1]*d);
  const out=r=>!r||r.terrace;
  if(out(A)&&out(B)&&((A&&A.terrace)||(B&&B.terrace))) return 1.05;
  return src.H_INT;
}
function openingDefaults(o,H_DOOR){
  const k=o.kind;
  if(k==='window') return {sill:o.sill??0.9, top:o.top??Math.max(H_DOOR,2.1)};
  if(k==='glass') return {sill:o.sill??0, top:o.top??2.3};
  if(k==='glassdoor') return {sill:0, top:o.top??2.3};
  return {sill:0, top:o.top??H_DOOR};
}

function planFromSrc(src){
  const S=scaleInfo(src).S; if(!S) return null;
  const [ox,oy]=src.origin, m=p=>[+((p[0]-ox)/S).toFixed(4), +((p[1]-oy)/S).toFixed(4)];
  const rooms=src.rooms.filter(r=>r.poly.length>=3).map(r=>({id:r.id,label:r.label,m2:r.m2>0?r.m2:+(P2.area(r.poly)/(S*S)).toFixed(2),
    measured:+(P2.area(r.poly)/(S*S)).toFixed(2),floor:r.floor,terrace:r.terrace,poly:r.poly.map(m)}));
  const walls=src.walls.filter(w=>P2.len(w.a,w.b)>1).map(w=>{ const u=P2.dir(w), n=[-u[1],u[0]];
    const o=w.o.slice().sort((p,q)=>p.s-q.s).map(o=>{ const h=o.hinge==='end'?o.e:o.s, hp=[w.a[0]+u[0]*h,w.a[1]+u[1]*h], wd=o.e-o.s;
      const into=[hp[0]+n[0]*o.side*wd*0.5+u[0]*(o.hinge==='end'?-wd/2:wd/2), hp[1]+n[1]*o.side*wd*0.5+u[1]*(o.hinge==='end'?-wd/2:wd/2)];
      const d=openingDefaults(o,src.H_DOOR); const q={s:+(o.s/S).toFixed(4),e:+(o.e/S).toFixed(4),kind:o.kind,hinge:o.hinge,into:m(into)};
      if(o.kind==='window'||o.kind==='glass'){ q.sill=d.sill; q.top=d.top; } else q.top=d.top;
      return q; });
    const q={a:m(w.a),b:m(w.b),t:+(w.t/S).toFixed(4),h:wallHeight(src,w,S),o};
    if(w.ext) q.ext=[+(w.ext[0]/S).toFixed(4),+(w.ext[1]/S).toFixed(4)];
    return q; });
  const closets=src.closets.map(c=>{ const [x0,y0,x1,y1]=c.r; return {a:m([Math.min(x0,x1),Math.min(y0,y1)]),b:m([Math.max(x0,x1),Math.max(y0,y1)]),h:c.h,kind:c.kind}; });
  return {rooms,walls,closets,H_INT:src.H_INT,H_DOOR:src.H_DOOR};
}

/* ---------- DXF R12 (metros, Y hacia arriba) ---------- */
function planToDXF(D){
  const out=[]; const add=(c,v)=>out.push(String(c),String(v));
  const r4=v=>Math.round(v*1e4)/1e4;
  const Y=p=>[r4(p[0]),r4(-p[1])];
  const line=(p1,p2,l)=>{ p1=Y(p1); p2=Y(p2); add(0,'LINE');add(8,l);add(10,p1[0]);add(20,p1[1]);add(30,0);add(11,p2[0]);add(21,p2[1]);add(31,0); };
  const pline=(pts,l)=>{ add(0,'POLYLINE');add(8,l);add(66,1);add(10,0);add(20,0);add(30,0);add(70,1);
    pts.forEach(p=>{ const q=Y(p); add(0,'VERTEX');add(8,l);add(10,q[0]);add(20,q[1]);add(30,0); }); add(0,'SEQEND');add(8,l); };
  const text=(p,h,s,l)=>{ const q=Y(p); add(0,'TEXT');add(8,l);add(10,q[0]);add(20,q[1]);add(30,0);add(40,h);add(1,s); };
  const arc=(c,r,a0,a1,l)=>{ const q=Y(c); add(0,'ARC');add(8,l);add(10,q[0]);add(20,q[1]);add(30,0);add(40,r4(r));add(50,Math.round(a0*1e3)/1e3);add(51,Math.round(a1*1e3)/1e3); };
  const ascii=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\x20-\x7e]/g,'');
  D.rooms.forEach(r=>{ pline(r.poly,r.terrace?'ESTANCIAS-EXT':'ESTANCIAS'); const [cx,cy]=P2.centroid(r.poly), lab=ascii(r.label).toUpperCase();
    text([cx-lab.length*0.055,cy-0.05],0.14,lab,'TEXTOS'); text([cx-0.3,cy+0.18],0.12,fmtN(r.m2)+' m2','TEXTOS'); });
  D.walls.forEach(w=>{ const [ax,ay]=w.a,[bx,by]=w.b, L=Math.hypot(bx-ax,by-ay); if(L<1e-6) return; const ux=(bx-ax)/L, uy=(by-ay)/L, nx=-uy, ny=ux, t=w.t/2;
    const at=s=>[ax+ux*s,ay+uy*s], off=(p,k)=>[p[0]+nx*t*k,p[1]+ny*t*k];
    const lay=w.h<2?'PETOS':(w.t>=0.12?'MUROS-EXT':'TABIQUES');
    const e0=w.ext?w.ext[0]:Math.min(t,.06), e1=w.ext?w.ext[1]:Math.min(t,.06);
    const slab=(s0,s1)=>{ if(s1-s0<0.005) return; const p0=at(s0),p1=at(s1); pline([off(p0,1),off(p1,1),off(p1,-1),off(p0,-1)],lay); };
    let cur=-e0;
    w.o.slice().sort((p,q)=>p.s-q.s).forEach(o=>{ slab(cur,o.s); const ps=at(o.s), pe=at(o.e);
      if(o.kind==='door'||o.kind==='glassdoor'){ const hinge=o.hinge==='start'?ps:pe, other=o.hinge==='start'?pe:ps;
        const side=((o.into[0]-hinge[0])*nx+(o.into[1]-hinge[1])*ny)>0?1:-1, wd=o.e-o.s, tip=[hinge[0]+nx*side*wd,hinge[1]+ny*side*wd];
        line(hinge,tip,'PUERTAS');
        const a1=Math.atan2(-(tip[1]-hinge[1]),tip[0]-hinge[0])*180/Math.PI, a2=Math.atan2(-(other[1]-hinge[1]),other[0]-hinge[0])*180/Math.PI;
        const d=((a2-a1)%360+360)%360; if(d<=180) arc(hinge,wd,a1,a2,'PUERTAS'); else arc(hinge,wd,a2,a1,'PUERTAS');
        line(off(ps,1),off(ps,-1),'PUERTAS'); line(off(pe,1),off(pe,-1),'PUERTAS');
        if(o.kind==='glassdoor') line(off(ps,.25),off(pe,.25),'VENTANAS');
      } else { [1,.3,-.3,-1].forEach(k=>line(off(ps,k),off(pe,k),'VENTANAS')); line(off(ps,1),off(ps,-1),'VENTANAS'); line(off(pe,1),off(pe,-1),'VENTANAS'); }
      cur=o.e; });
    slab(cur,L+e1); });
  D.closets.forEach(c=>{ const [x0,y0]=c.a,[x1,y1]=c.b, l=c.kind==='pillar'?'ESTRUCTURA':'MOBILIARIO';
    pline([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],l); line([x0,y0],[x1,y1],l); if(c.kind==='pillar') line([x1,y0],[x0,y1],l); });
  const layers=[['MUROS-EXT',7],['TABIQUES',8],['PETOS',4],['PUERTAS',3],['VENTANAS',5],['ESTANCIAS',9],['ESTANCIAS-EXT',4],['TEXTOS',2],['MOBILIARIO',251],['ESTRUCTURA',1]];
  const hdr=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$INSUNITS','70','6','0','ENDSEC','0','SECTION','2','TABLES','0','TABLE','2','LAYER','70',String(layers.length)];
  layers.forEach(([n,c])=>hdr.push('0','LAYER','2',n,'70','0','62',String(c),'6','CONTINUOUS'));
  hdr.push('0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES');
  return hdr.concat(out,['0','ENDSEC','0','EOF']).join('\n')+'\n';
}
