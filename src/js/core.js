/* =========================================================================
   Utilidades comunes y almacenamiento (IndexedDB)
   ========================================================================= */
const SEED = __SEED_JSON__;          // proyecto de ejemplo (la vivienda Tipo 05), generado por build.py
const $ = id => document.getElementById(id);
const fmtM = v => v.toFixed(2).replace('.', ',') + ' m';
const fmtN = (v,d=2) => (+v).toFixed(d).replace('.', ',');
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const APP_ID='vivienda-tipo05';     // nombre de la base de datos (se mantiene para conservar lo guardado)
let idbP=null;
function idb(){ if(!idbP) idbP=new Promise((res,rej)=>{ const r=indexedDB.open(APP_ID,1);
  r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); return idbP; }
async function idbTx(mode,fn){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction('kv',mode), st=tx.objectStore('kv');
  const out=fn(st); tx.oncomplete=()=>res(out&&out.result); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); }); }
const idbPut=(k,v)=>idbTx('readwrite',st=>st.put(v,k));
const idbGet=k=>idbTx('readonly',st=>st.get(k));
const idbDel=k=>idbTx('readwrite',st=>st.delete(k));

function blobToDataURL(b){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(b); }); }
async function dataURLToBlob(u){ return (await fetch(u)).blob(); }
function download(blob,name){ const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(blob);
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
function slug(s){ return (s||'proyecto').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'proyecto'; }
function today(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
