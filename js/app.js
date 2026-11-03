const $ = id => document.getElementById(id);
const norm = s => s.toUpperCase().replace(/[^A-Z0-9]/g,"");
const LBL={"Fora da lista":"Não prevista"}; const lab=l=>LBL[l]||l;
const fmt = s => s.length===6 ? s.slice(0,2)+"-"+s.slice(2,4)+"-"+s.slice(4) : s;
const parse = t => { const out=[]; t.split(/\n/).forEach(l=>{ const f=l.toUpperCase().match(RX); if(f) f.forEach(m=>out.push(norm(m))); else l.split(/[,;\t]+/).map(norm).filter(x=>x.length>=4).forEach(x=>out.push(x)); }); return [...new Set(out)]; };
function parseDesc(t){ const m={}; t.split(/\n/).forEach(l=>{ const u=l.toUpperCase(); const f=u.match(RX); if(!f) return; const i=u.indexOf(f[0]); const rest=(l.slice(0,i)+" "+l.slice(i+f[0].length)).replace(/\s{2,}/g," ").replace(/^[\s|;,:–-]+|[\s|;,:–-]+$/g,""); const p=norm(f[0]); if(rest&&!m[p]) m[p]=rest; }); return m; }
function chk(desc,info,strict){ if(!desc||!info) return null; const dn=norm(desc); const parts=[String(info.marca||"").split(/[\s-]+/)[0],String(info.modelo||"").split(/\s+/)[0]].filter(Boolean).map(norm).filter(Boolean); if(!parts.length) return null; return strict?parts.every(p=>dn.includes(p)):parts.some(p=>dn.includes(p)); }
let lidasInfo={};
let listaDesc={};
let lowCert=new Set();
let evid={}, manual={}, carried=new Set(), second={}, looked=new Set(), notes={}, ovr={}, ovrWhy={}, noteDirty=false;
function improMap(){ const m={}; $("impro").value.split(/\n/).forEach(l=>{ const u=l.toUpperCase(), f=u.match(RXW); if(!f) return; const r=repairPlate(f[0]); if(!VALID.test(r.p)) return; const i=u.indexOf(f[0]); const rest=(l.slice(0,i)+" "+l.slice(i+f[0].length)).replace(/\s{2,}/g," ").replace(/^[\s|;,:·–-]+|[\s|;,:·–-]+$/g,""); m[r.p]=m[r.p]||rest; }); return m; }
let filtro="todas";
function setStatus(m,err){const s=$("status");s.textContent=m;s.className=err?"err":"";}
let doubts=[];

const EX_LISTA="AB-12-CD\nEF-34-GH\nIJ-56-KL\nMN-78-OP\nQR-90-ST\nUV-23-WX";
const EX_DESC={AB12CD:"Renault Clio",EF34GH:"Peugeot 208",IJ56KL:"Fiat 500",MN78OP:"Dacia Sandero",QR90ST:"Toyota Yaris",UV23WX:"Opel Corsa"};
const EX_INFO={AB12CD:{marca:"Renault",modelo:"Clio"},EF34GH:{marca:"Peugeot",modelo:"208"},IJ56KL:{marca:"Ford",modelo:"Fiesta"},OR90ST:{marca:"Toyota",modelo:"Yaris"},YZ45AB:{marca:"Skoda",modelo:"Octavia"}};
const EX_LIDAS="AB-12-CD\nEF-34-GH\nIJ-56-KL\nOR-90-ST\nYZ-45-AB";

function dist(a,b){ if(a.length!==b.length) return 99; let d=0; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) d++; return d; }

function box(cls,title,items){
  const d=document.createElement("div"); d.className="box "+cls;
  const h=document.createElement("h3"); h.textContent=title+" ("+items.length+")"; d.appendChild(h);
  if(items.length){const ul=document.createElement("ul"); items.forEach(t=>{const li=document.createElement("li"); li.textContent=t; ul.appendChild(li);}); d.appendChild(ul);}
  return d;
}

function plateEl(x){ const pl=document.createElement("span"); pl.className="plate"; const t=document.createElement("span"); t.textContent=fmt(x); pl.appendChild(t); return pl; }
let curFalta=[], lastRows=[];
function rebuildResults(){
  if($("out").classList.contains("hidden")) return;
  const lidas=new Set(carried); items.filter(i=>i.st==="ok").forEach(i=>i.plates.forEach(p=>lidas.add(p)));
  $("lidas").value=[...lidas].map(fmt).join("\n"); compare();
}
function openPhoto(it){
  const body=$("sheetbody"); body.textContent="";
  $("sheettitle").textContent="Foto nº "+it.n;
  if(!it.full){ try{ it.full=URL.createObjectURL(it.file); }catch(x){ it.full=it.url; } }
  const lab=document.createElement("p"); lab.className="hint"; lab.textContent="Toca na foto para aproximar ou afastar."; body.appendChild(lab);
  const pic=document.createElement("div"); pic.className="pic"; const im=document.createElement("img"); im.src=it.full; im.alt="Foto nº "+it.n; pic.appendChild(im); body.appendChild(pic);
  pic.addEventListener("click",()=>pic.classList.toggle("zoom"));
  const card=document.createElement("div"); card.className="card"; body.appendChild(card);
  const q=document.createElement("label"); q.className="q"; q.htmlFor="manplate"; q.textContent=it.st==="ok"?"Matrícula lida (corrige se estiver errada)":"Consegues ver a matrícula? Escreve-a aqui"; card.appendChild(q);
  const inp=document.createElement("input"); inp.id="manplate"; inp.className="manin"; inp.placeholder="AA-00-AA"; inp.autocomplete="off"; inp.setAttribute("autocapitalize","characters"); inp.spellcheck=false;
  inp.value=it.st==="ok"?[...it.plates].map(fmt).join(", "):""; card.appendChild(inp);
  const err=document.createElement("p"); err.className="hint"; err.textContent="Se a foto tiver mais do que um carro, separa as matrículas com vírgulas."; card.appendChild(err);
  const btns=document.createElement("div"); btns.className="btns"; card.appendChild(btns);
  const save=document.createElement("button"); save.type="button"; save.className="yes"; save.textContent="Guardar matrícula"; btns.appendChild(save);
  const del=document.createElement("button"); del.type="button"; del.className="no"; del.textContent="Remover foto"; btns.appendChild(del);
  const doSave=()=>{
    const parts=inp.value.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
    const vals=parts.map(x=>repairPlate(x).p);
    if(!vals.length||vals.some(v=>!VALID.test(v))){ err.textContent="Escreve no formato AA-00-AA (2 letras, 2 números, 2 letras)."; err.classList.add("bad"); inp.focus(); return; }
    it.plates=new Set(vals); it.st="ok"; it.manual=true; it.low=false;
    vals.forEach(v=>{ lowCert.delete(v); evid[v]={it}; });
    closeSheet(); renderThumbs(); fotoInfo(); rebuildResults();
    const r=statusFor(null); setStatus(r.msg,r.err);
  };
  save.addEventListener("click",doSave);
  inp.addEventListener("keydown",ev=>{ if(ev.key==="Enter"){ ev.preventDefault(); doSave(); } });
  inp.addEventListener("blur",()=>{ const v=inp.value.split(/[,;\n]+/).map(x=>{ const r=repairPlate(x.trim()); return VALID.test(r.p)?fmt(r.p):x.trim().toUpperCase(); }).filter(Boolean).join(", "); inp.value=v; });
  del.addEventListener("click",()=>{ try{URL.revokeObjectURL(it.url);}catch(e){} items=items.filter(o=>o!==it); closeSheet(); renderThumbs(); fotoInfo(); rebuildResults(); });
  $("sheet").classList.remove("hidden"); $("sheet").scrollTop=0; document.body.style.overflow="hidden";
  $("sheetback").focus();
}
function closeSheet(){ $("sheet").classList.add("hidden"); document.body.style.overflow=""; }
function openSheet(r){
  const body=$("sheetbody"); body.textContent="";
  $("sheettitle").textContent=lab(r.l);
  const e=evid[r.read||r.p];
  const sec=(cls)=>{ const d=document.createElement("div"); d.className=cls; body.appendChild(d); return d; };
  const line=(parent,lab,x)=>{ const d=document.createElement("div"); d.className="evl"; const s=document.createElement("span"); s.textContent=lab; d.appendChild(s); d.appendChild(plateEl(x)); parent.appendChild(d); };
  if(r.l==="Impro"){ const ob=sec("card obs"); const h=document.createElement("p"); h.className="q"; h.textContent="Observações da lista de impro"; const t=document.createElement("p"); t.className="obst"; t.textContent=r.obs||"Sem observações no ficheiro."; ob.appendChild(h); ob.appendChild(t); }
  const info=sec("card");
  if(r.exp) line(info,"Na lista",r.exp);
  if(r.read) line(info,"Lido na foto",r.read); else if(!r.exp) line(info,"Matrícula",r.p);
  if(r.n){ const n=document.createElement("p"); n.className="hint"; n.textContent=r.n.charAt(0).toUpperCase()+r.n.slice(1)+"."; info.appendChild(n); }
  if(e&&e.crop){ const c=sec("crop"); const lab=document.createElement("p"); lab.className="hint"; lab.textContent="Matrícula recortada da foto nº "+e.it.n; const im=document.createElement("img"); im.src=e.crop; im.alt="Recorte da matrícula"; c.appendChild(lab); c.appendChild(im); }
  if(e&&e.it){
    if(!e.full){ try{ e.full=URL.createObjectURL(e.it.file); }catch(x){ e.full=e.it.url; } }
    const lab=document.createElement("p"); lab.className="hint"; lab.textContent="Foto nº "+e.it.n+" completa. Toca na foto para aproximar ou afastar."; body.appendChild(lab);
    const pic=sec("pic"); const im=document.createElement("img"); im.src=e.full; im.alt="Foto nº "+e.it.n; pic.appendChild(im);
    pic.addEventListener("click",()=>pic.classList.toggle("zoom"));
  } else { const n=sec("card"); n.textContent=r.read?"Foto não disponível. Volta a adicionar a foto desta viatura para a veres aqui.":"Esta viatura não aparece em nenhuma foto."; n.classList.add("muted"); }
  const act=sec("card");
  const q=document.createElement("p"); q.className="q"; act.appendChild(q);
  const btns=document.createElement("div"); btns.className="btns"; act.appendChild(btns);
  const btn=(cls,txt,fn,parent)=>{ const b=document.createElement("button"); b.type="button"; b.className=cls; b.textContent=txt; b.addEventListener("click",()=>{ fn(); closeSheet(); compare(); }); (parent||btns).appendChild(b); };
  if(r.l==="Impro"){ /* viatura em impro: não se liga a nenhuma matrícula da lista */ }
  else if(r.kind==="pair"){ q.textContent="É o mesmo carro?"; btn("yes","Sim, é "+fmt(r.exp),()=>{manual[r.exp+"|"+r.read]="same";}); btn("no","Não, são diferentes",()=>{manual[r.exp+"|"+r.read]="diff";}); }
  else if(r.kind==="low"){ q.textContent="A leitura está certa?"; btn("yes","Sim, está certa",()=>{manual[r.exp+"|"+r.exp]="same";}); }
  else if(r.kind==="car"){ q.textContent="É este o carro da lista?"; btn("yes","Sim, está certo",()=>{manual[r.exp+"|car"]="ok";}); }
  else if(r.kind==="auto"){ q.textContent="A 2.ª leitura confirmou "+fmt(r.exp)+". Está certo?"; btn("yes","Sim, está certo",()=>{manual[r.exp+"|"+r.read]="same";}); btn("no","Não, são diferentes",()=>{manual[r.exp+"|"+r.read]="diff";}); }
  else if(r.kind==="fora"){
    q.textContent="Matrículas da lista ainda por confirmar mais parecidas com "+fmt(r.read)+":";
    const cands=curFalta.map(x=>({x,d:dist(x,r.read)})).sort((a,b)=>a.d-b.d).slice(0,3);
    if(!cands.length){ const n=document.createElement("p"); n.className="hint"; n.textContent="Todas as matrículas da lista já estão confirmadas. Este carro não está na lista."; act.appendChild(n); }
    cands.forEach(c=>{
      const row=document.createElement("div"); row.className="cand";
      const l=document.createElement("div"); l.appendChild(plateEl(c.x)); const sm=document.createElement("small"); sm.textContent="difere em "+c.d+" carácter"+(c.d>1?"es":""); l.appendChild(sm); row.appendChild(l);
      btn("yes","É esta",()=>{manual[c.x+"|"+r.read]="same";},row);
      act.appendChild(row);
    });
    if(cands.length&&cands[0].d>2){ const n=document.createElement("p"); n.className="hint"; n.textContent="Nenhuma é muito parecida: o mais provável é este carro não estar na lista."; act.appendChild(n); }
  }
  if(!btns.children.length) btns.remove();
  if(!q.textContent) act.remove();
  const oc=document.createElement("div"); oc.className="card";
  const ol=document.createElement("p"); ol.className="q"; oc.appendChild(ol);
  const ob2=document.createElement("div"); ob2.className="btns"; oc.appendChild(ob2);
  const impl=improMap(), inList=impl[r.p]!==undefined||(r.read&&impl[r.read]!==undefined);
  const notEsp=r.src!=="esp";
  if(r.ov){ const hn=document.createElement("p"); hn.className="hint"; hn.textContent=(r.ov==="impro"?"Alterado por ti: marcada como impro.":"Alterado por ti: marcada como disponível.")+(r.why?" Justificação: "+r.why:""); oc.insertBefore(hn,ob2); }
  ol.textContent="Estado da viatura";
  const isImp=r.l==="Impro", isDisp=r.l==="Confirmada";
  const chg=(T,txt,cls,dis)=>{ const b=document.createElement("button"); b.type="button"; b.className=cls; b.textContent=txt; if(dis){ b.disabled=true; b.classList.add("cur"); } else b.addEventListener("click",()=>askWhy(txt+": "+fmt(r.p),why=>{
      if(T==="impro"){ if(inList) delete ovr[r.p]; else ovr[r.p]="impro"; } else { if(isImp&&r.ov==="impro") delete ovr[r.p]; else ovr[r.p]="disp"; }
      if(ovr[r.p]) ovrWhy[r.p]=why; else delete ovrWhy[r.p];
      closeSheet(); compare(); })); ob2.appendChild(b); };
  chg("impro","Marcar como impro","warnb",isImp);
  chg("disp","Marcar como disponível","yes",isDisp);
  if(r.ov) btn("ghost","Repor decisão da app",()=>{ delete ovr[r.p]; delete ovrWhy[r.p]; },ob2);
  const nc=document.createElement("div"); nc.className="card";
  const nl=document.createElement("label"); nl.className="q"; nl.htmlFor="notetxt"; nl.textContent="Observações"; nc.appendChild(nl);
  const ta=document.createElement("textarea"); ta.id="notetxt"; ta.className="notein"; ta.placeholder=""; ta.value=notes[r.p]||""; nc.appendChild(ta);
  ta.addEventListener("input",()=>{ const v=ta.value.trim(); if(v) notes[r.p]=v; else delete notes[r.p]; noteDirty=true; });
  const nb=document.createElement("div"); nb.className="btns"; const sb=document.createElement("button"); sb.type="button"; sb.className="yes"; sb.textContent="Guardar observação"; sb.addEventListener("click",()=>{ noteDirty=false; closeSheet(); compare(); }); nb.appendChild(sb); nc.appendChild(nb);
  info.after(nc); info.after(oc); if(act.isConnected) info.after(act);
  $("sheet").classList.remove("hidden"); $("sheet").scrollTop=0; document.body.style.overflow="hidden";
  $("sheetback").focus();
}
let report="";
function compare(){
  const esp=parse($("lista").value).filter(x=>VALID.test(x)), lid=parse($("lidas").value).filter(x=>VALID.test(x));
  const dsc=Object.assign({},listaDesc,parseDesc($("lista").value)), inf=lidasInfo||{};
  const D=x=>"";
  const seen=x=>"";
  const manOk=new Set(), alias={};
  Object.keys(manual).forEach(k=>{ if(manual[k]!=="same"&&manual[k]!=="auto") return; const [x,y]=k.split("|"); const i=lid.indexOf(y); if(x!==y&&i>=0&&esp.includes(x)&&!lid.includes(x)){ lid[i]=x; manOk.add(x); alias[x]=y; } });
  const sE=new Set(esp), sL=new Set(lid), lidSetAll=sL;
  const both=esp.filter(x=>sL.has(x)), mism=both.filter(x=>manual[x+"|car"]!=="ok"&&chk(dsc[x],inf[x])===false), ok=both.filter(x=>chk(dsc[x],inf[x])!==false), falta=esp.filter(x=>!sL.has(x)), sobra=lid.filter(x=>!sE.has(x));
  const ml=mism.map(x=>fmt(x)+" · o carro da foto não corresponde ao registado");
  const near=(x,pool)=>pool.find(y=>dist(x,y)===1);
  const res=$("res"); res.textContent="";
  $("sum").textContent=esp.length+" na lista · "+lid.length+" lidos · "+ok.length+" conferem"+(mism.length?" · "+mism.length+" com carro diferente":"");
  const fl=falta.map(x=>{const n=near(x,sobra); const c=sobra.find(t=>chk(dsc[x],inf[t],true)===true); return fmt(x)+D(x)+(n?" – parecida com "+fmt(n)+" (pode ser leitura errada)":"")+(c?" – a foto de "+fmt(c)+" mostra um carro igual ao da lista (possível leitura errada da matrícula)":"");});
  const sl=sobra.map(x=>{const n=near(x,falta); const c=falta.find(f=>chk(dsc[f],inf[x],true)===true); return fmt(x)+seen(x)+(n?" – parecida com "+fmt(n)+" (pode ser leitura errada)":"")+(c?" – o carro corresponde a "+fmt(c)+" da lista":"");});

  const rows=[]; const mset=new Set(mism), used=new Set();
  const isDiff=(x,y)=>manual[x+"|"+y]==="diff";
  esp.forEach(x=>{
    if(!sL.has(x)){
      const y=sobra.find(t=>!used.has(t)&&!isDiff(x,t)&&(dist(x,t)===1||chk(dsc[x],inf[t],true)===true));
      if(y){ used.add(y); rows.push({p:x,t:"chk",l:"Verificar leitura",src:"esp",exp:x,read:y,kind:"pair",n:"lido na foto como "+fmt(y)+(second[x+"|"+y]?" (a 2.ª leitura também leu assim)":"")}); }
      else rows.push({p:x,t:"bad",l:"Em falta",src:"esp"});
    }
    else if(mset.has(x)) rows.push({p:x,t:"bad",l:"Carro diferente",src:"esp",exp:x,read:x,kind:"car",n:"o carro da foto não corresponde ao registado"});
    else if(manOk.has(x)) rows.push({p:x,t:"ok",l:"Confirmada",src:"esp",n:manual[x+"|"+alias[x]]==="auto"?"confirmada numa 2.ª leitura (lido antes como "+fmt(alias[x])+")":"validada por ti (lido "+fmt(alias[x])+")",kind:manual[x+"|"+alias[x]]==="auto"?"auto":undefined,exp:x,read:alias[x]});
    else if(lowCert.has(x)&&manual[x+"|"+x]!=="same") rows.push({p:x,t:"chk",l:"Verificar leitura",src:"esp",exp:x,read:x,kind:"low",n:"leitura com pouca certeza"});
    else rows.push({p:x,t:"ok",l:"Confirmada",src:"esp",n:manual[x+"|"+x]==="same"||manual[x+"|car"]==="ok"?"validada por ti":""});
  });
  sobra.forEach(x=>{ if(used.has(x)) return; rows.push({p:x,t:"bad",l:"Fora da lista",read:x,kind:"fora"}); });
  rows.forEach(r=>{ if(r.src==="esp"&&!r.exp) r.exp=r.p; if(!r.read&&sL.has(r.p)) r.read=r.p; });
  const impM=improMap(), impS=new Set(Object.keys(impM));
  rows.forEach(r=>{ let ip=impS.has(r.p)?r.p:(r.read&&impS.has(r.read)?r.read:null); const o=ovr[r.p]; if(o==="disp"||o==="normal"){ const wasImp=!!ip; ip=null; if(r.l!=="Confirmada"){ const prev=r.l; r.ov="disp"; r.l="Confirmada"; r.t="ok"; r.kind="disp"; r.n=prev==="Fora da lista"?"adicionada por ti (não estava na lista)":"marcada como disponível por ti"+(wasImp?" (estava em impro)":" (estava como "+prev.toLowerCase()+")"); } else if(wasImp){ r.ov="disp"; r.n=(r.n?r.n+" · ":"")+"tirada de impro por ti"; } } else if(o==="impro"&&!ip){ ip=r.p; r.ov="impro"; } if(ip){ const was=r.l==="Confirmada"?"vista na foto":r.l==="Em falta"?"sem foto":r.l==="Fora da lista"?"vista na foto":r.l.toLowerCase(); r.n=was+(r.n?" · "+r.n:""); r.l="Impro"; r.t="imp"; r.obs=impM[ip]||""; if(r.ov==="impro") r.n+=" · marcada como impro por ti"; r.kind=r.kind||"impro"; if(!r.read&&lidSetAll.has(r.p)) r.read=r.p; if(!r.exp&&r.src==="esp") r.exp=r.p; } });
  rows.forEach(r=>{ if(r.ov&&ovrWhy[r.p]) r.why=ovrWhy[r.p]; });
  lastRows=rows;
  const cnt=(t,l)=>rows.filter(r=>r.t===t&&(!l||r.l===l)).length;
  const nOk=rows.filter(r=>r.t==="ok").length, nFalta=falta.length, nFora=sobra.length;
  const FIL={
    todas:r=>true, previstas:r=>r.src==="esp", conf:r=>r.l==="Confirmada",
    falta:r=>r.l==="Em falta", fora:r=>r.l==="Fora da lista", impro:r=>r.l==="Impro",
    chk:r=>r.t==="chk"||r.l==="Carro diferente"
  };
  if(!FIL[filtro]) filtro="todas";
  const tile=(key,c,lab,v)=>{const d=document.createElement("button");d.type="button";d.className="tile "+c+(filtro===key?" on":"");d.setAttribute("aria-pressed",filtro===key?"true":"false");d.addEventListener("click",()=>{filtro=key;compare();});const a=document.createElement("span");a.textContent=lab;const b=document.createElement("b");b.textContent=v;d.appendChild(a);d.appendChild(b);return d;};
  const tiles=document.createElement("div"); tiles.className="tiles";
  tiles.appendChild(tile("conf","g","Confirmados",nOk));
  tiles.appendChild(tile("impro","y","Impro",cnt("imp")));
  tiles.appendChild(tile("falta","r","Em falta",cnt("bad","Em falta")));
  tiles.appendChild(tile("fora","o","Não previstos",cnt("bad","Fora da lista")));
  res.appendChild(tiles);
  const nChk=cnt("chk")+cnt("bad","Carro diferente");
  const chips=document.createElement("div"); chips.className="chips";
  const chip=(key,txt,v)=>{ const c=document.createElement("button"); c.type="button"; c.className="chip"+(filtro===key?" on":""); c.setAttribute("aria-pressed",filtro===key?"true":"false"); c.textContent=txt+" "; const n=document.createElement("b"); n.textContent=v; c.appendChild(n); c.addEventListener("click",()=>{ filtro=key; compare(); }); chips.appendChild(c); };
  chip("todas","Todas",rows.length); if(nChk) chip("chk","A verificar",nChk);
  res.appendChild(chips);
  const pc=esp.length?Math.round(rows.filter(r=>r.t==="ok"&&r.src==="esp").length/esp.length*1000)/10:0;
  const bar=document.createElement("div"); bar.className="bar"; const bi=document.createElement("i"); bi.style.width=pc+"%"; bar.appendChild(bi); res.appendChild(bar);
  const pt=document.createElement("div"); pt.className="pct"; pt.textContent=String(pc).replace(".",",")+"% das viaturas previstas confirmadas"; res.appendChild(pt);
  const wrap=document.createElement("div"); wrap.className="rows";
  const shown=rows.filter(FIL[filtro]);
  if(!shown.length){ const e=document.createElement("div"); e.className="rrow"; e.textContent="Nenhuma matrícula nesta categoria."; wrap.appendChild(e); }
  shown.forEach(r=>{
    const d=document.createElement("div"); d.className="rrow";
    const left=document.createElement("div"); const pl=document.createElement("span"); pl.className="plate"; const pt2=document.createElement("span"); pt2.textContent=fmt(r.p); pl.appendChild(pt2); left.appendChild(pl);
    if(r.n){const sm=document.createElement("small"); sm.textContent=r.n; left.appendChild(sm);}
    if(notes[r.p]){const sm2=document.createElement("small"); sm2.className="unote"; sm2.textContent="Obs.: "+notes[r.p]; left.appendChild(sm2);}
    const pill=document.createElement("span"); pill.className="pill "+r.t+(r.l==="Fora da lista"?" fora":""); pill.textContent=lab(r.l);
    d.appendChild(left); d.appendChild(pill);
    {
      d.classList.add("tap"); d.tabIndex=0; d.setAttribute("role","button"); d.setAttribute("aria-label",fmt(r.p)+": "+lab(r.l)+". Abrir detalhe");
      const ch=document.createElement("span"); ch.className="chev"; ch.setAttribute("aria-hidden","true"); ch.textContent="›"; d.appendChild(ch);
      d.addEventListener("click",()=>openSheet(r));
      d.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); openSheet(r); } });
    }
    wrap.appendChild(d);
  });
  curFalta=rows.filter(r=>r.l==="Em falta").map(r=>r.p);
  $("rowsbox").textContent=""; $("rowsbox").appendChild(wrap); if(typeof applySearch==="function") applySearch();
  const lines=rows.map(r=>"- "+fmt(r.p)+": "+lab(r.l)+(r.n?" ("+r.n+")":"")+(notes[r.p]?" · Obs.: "+notes[r.p]:""));
  const now=new Date(), pd=n=>String(n).padStart(2,"0"), hh=pd(now.getHours())+":"+pd(now.getMinutes());
  $("rtime").textContent="às "+hh;
  const nn=k=>rows.filter(r=>r.l===k).length;
  report="Fleet Pro: conferência de "+pd(now.getDate())+"-"+pd(now.getMonth()+1)+"-"+now.getFullYear()+" às "+hh+"\n"+esp.length+" previstas · "+nn("Confirmada")+" confirmados · "+nn("Em falta")+" em falta · "+nn("Fora da lista")+" não previstos · "+(nn("Verificar leitura")+nn("Carro diferente"))+" a verificar · "+nn("Impro")+" impro\n\n"+lines.join("\n");
  $("out").classList.remove("hidden");
}

const RX=/\b[A-Z]{2}-?\d{2}-?[A-Z]{2}\b/g;
const VALID=/^[A-Z]{2}\d{2}[A-Z]{2}$/;
const RXW=/\b[A-Z]{2,3}-?\d{2}-?[A-Z]{2,3}\b/g;
function repairPlate(raw){
  const t=String(raw||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(VALID.test(t)) return {p:t,fix:false};
  const m=t.match(/^([A-Z]{2,3})(\d{2})([A-Z]{2,3})$/); if(!m) return {p:t,fix:false};
  const g=x=>x.length>2?x.replace("II","H"):x, p=g(m[1])+m[2]+g(m[3]);
  return VALID.test(p)?{p,fix:true,de:t}:{p:t,fix:false};
}

const PROMPT_LISTA=`Estas imagens mostram uma lista impressa de viaturas de um programa de gestão (Rentway). Se houver várias imagens, são partes consecutivas da mesma folha, de cima para baixo, com uma pequena sobreposição: não repitas matrículas. Extrai todas as matrículas da coluna "Matrícula". Responde só com JSON válido, sem markdown: {"total":31,"matriculas":[{"matricula":"AA-00-AA","marca":"","modelo":""}]}.
Regras: todas as matrículas têm exatamente o formato AA-00-AA (2 letras, 2 dígitos, 2 letras). A impressão pode estar gasta ou falhada: se um grupo de letras parecer ter 3 caracteres, é um defeito de impressão de uma só letra (por exemplo um H com o traço do meio apagado parece "II", logo "IIJ" é "HJ"); devolve sempre a leitura com 2 letras que faz sentido. Escolhe sempre o tipo que cada grupo exige (letras, dígitos, letras). "marca" e "modelo" são os das colunas Marca e Modelo da mesma linha. "total" é o número de veículos indicado no fim da lista (null se não aparecer). A folha usa uma letra com serifas: o I tem serifas iguais em cima e em baixo, simétricas; o L tem um traço horizontal só em baixo, que se estende claramente para a direita. Na dúvida entre I e L, olha para esse traço de baixo: se não se estende para a direita, é I. Ignora datas, números de unidade e outros códigos. Não escrevas comentários.`;
const PROMPT_IMPRO=`Estas imagens mostram uma lista de veículos em impro (imobilizadas), possivelmente impressa. Se houver várias imagens, são partes consecutivas da mesma folha, de cima para baixo, com sobreposição: não repitas matrículas. Para cada viatura extrai a matrícula e as observações dessa linha (coluna de observações, ou o texto que explica o motivo). Responde só com JSON válido, sem markdown: {"matriculas":[{"matricula":"AA-00-AA","observacoes":""}]}.
Regras: todas as matrículas têm exatamente o formato AA-00-AA (2 letras, 2 dígitos, 2 letras). A impressão pode estar falhada: se um grupo de letras parecer ter 3 caracteres, é uma só letra mal impressa (um H pode parecer "II"); devolve sempre 2 letras. Numa letra com serifas, o I tem serifas iguais em cima e em baixo e o L tem um traço em baixo que vai para a direita. Copia as observações tal como estão escritas, sem inventar; deixa vazio se não houver. Não escrevas comentários.`;
async function listStrips(f){
  const b=await bmpOf(f); if(!b) return [];
  const W=b.width,H=b.height, n=Math.max(1,Math.min(4,Math.round(H/(W*0.35))));
  if(n<2){ try{b.close();}catch(e){} return []; }
  const sh=H/n, ov=sh*0.12, out=[];
  for(let k=0;k<n;k++){
    const y0=Math.max(0,k*sh-ov), y1=Math.min(H,(k+1)*sh+ov);
    const c=document.createElement("canvas"); c.width=W; c.height=Math.round(y1-y0);
    c.getContext("2d").drawImage(b,0,y0,W,y1-y0,0,0,W,c.height);
    const bl=await toBlobJ(c,0.92); if(bl) out.push(bl);
  }
  try{b.close();}catch(e){}
  return out;
}
function addToList(arr){ const have=new Set(parse($("lista").value)); const add=arr.map(a=>typeof a==="string"?{p:a,d:""}:a).filter(a=>!have.has(a.p)); const cur=$("lista").value.trim(); add.forEach(a=>{if(a.d) listaDesc[a.p]=a.d;}); $("lista").value=(cur?cur+"\n":"")+add.map(a=>fmt(a.p)).join("\n"); }
function extractItems(txt){ const U=txt.toUpperCase(), ms=[...U.matchAll(new RegExp(RXW.source,"g"))], seenP=new Set(), out=[]; ms.forEach((m,i)=>{ const r=repairPlate(m[0]); if(!VALID.test(r.p)) return; const p=r.p; if(seenP.has(p)) return; seenP.add(p); const end=m.index+m[0].length, nxt=i+1<ms.length?ms[i+1].index:txt.length; const d=txt.slice(end,Math.min(nxt,end+40)).replace(/\s+/g," ").replace(/^[\s|;,:–-]+|[\s|;,:–-]+$/g,""); out.push({p,d}); }); return out; }
function lineItems(txt){ const out=[], seen=new Set(); txt.split(/\n/).forEach(l=>{ const U=l.toUpperCase(); const ms=[...U.matchAll(new RegExp(RXW.source,"g"))]; ms.forEach(m=>{ const r=repairPlate(m[0]); if(!VALID.test(r.p)||seen.has(r.p)) return; seen.add(r.p); let rest=l.slice(0,m.index)+" "+l.slice(m.index+m[0].length); ms.forEach(o=>{ if(o!==m) rest=rest.split(o[0]).join(" "); }); rest=rest.replace(/\s{2,}/g," ").replace(/^[\s|;,:·–-]+|[\s|;,:·–-]+$/g,"").slice(0,300); out.push({p:r.p,d:"",obs:rest}); }); }); return out; }
function rowItems(wb){ const out=[], seen=new Set(); wb.SheetNames.forEach(n=>{ const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:""}); let obsCol=-1;
  rows.forEach(row=>{ const cells=row.map(c=>String(c==null?"":c).trim()); if(obsCol<0){ const k=cells.findIndex(c=>/^obs|observa/i.test(c)); if(k>=0){ obsCol=k; return; } }
    const pi=cells.findIndex(c=>VALID.test(repairPlate(c).p)); if(pi<0) return; const p=repairPlate(cells[pi]).p; if(seen.has(p)) return; seen.add(p);
    const obs=obsCol>=0?cells[obsCol]:cells.filter((c,i)=>i!==pi&&c).join(" · ");
    out.push({p,d:cells.filter((c,i)=>i!==pi&&c).slice(0,3).join(" "),obs:obs.slice(0,300)}); }); });
  return out; }
async function readPlatesFile(f,mode){
  const name=(f.name||"").toLowerCase();
  if(f.type==="application/pdf"||/\.pdf$/.test(name)){
    if(!window.pdfjsLib) throw {code:"nopdf"};
    pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.js";
    const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
    let txt="";
    for(let p=1;p<=pdf.numPages;p++){const pg=await pdf.getPage(p);const c=await pg.getTextContent();txt+=c.items.map(i=>i.str+(i.hasEOL?"\n":" ")).join("")+"\n";}
    return {found:mode==="impro"?lineItems(txt):extractItems(txt),what:"no PDF"};
  }
  if(/\.(xlsx|xls|xlsm|ods)$/.test(name)||/spreadsheet|excel/.test(f.type)){
    if(!window.XLSX) throw {code:"noxlsx"};
    const wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
    if(mode==="impro") return {found:rowItems(wb),what:"no Excel"};
    const txt=wb.SheetNames.map(n=>XLSX.utils.sheet_to_csv(wb.Sheets[n],{FS:" ; "})).join("\n");
    return {found:extractItems(txt),what:"no Excel"};
  }
  if(f.type.startsWith("image/")){
    const sample=await claude.use("sample");
    if(!sample) throw {code:"nosample"};
    setStatus("A ler a lista em partes, para ver melhor cada letra…");
    const lim=await sample.limits(), strips=await listStrips(f);
    const imgs=(strips.length>1&&lim.images&&strips.length<=(lim.images.maxCount||1))?strips:[f];
    const d=await sample.json(mode==="impro"?PROMPT_IMPRO:PROMPT_LISTA,{images:imgs});
    const fixes=[];
    const found=(d.matriculas||[]).map(m=>{ const raw=typeof m==="string"?m:m.matricula; const r=repairPlate(raw); if(r.fix) fixes.push(fmt(r.de)+" → "+fmt(r.p)); return {p:r.p,d:typeof m==="string"?"":[m.marca,m.modelo].filter(Boolean).join(" "),obs:typeof m==="string"?"":String(m.observacoes||"").trim()}; }).filter(a=>VALID.test(a.p));
    return {found,fixes,tot:Number(d.total),what:"na imagem"};
  }
  const t=await f.text();
  return {found:mode==="impro"?lineItems(t):extractItems(t),what:"no ficheiro"};
}
function fileStatus(r){
  const uniq=new Set(r.found.map(a=>a.p)).size, tot=r.tot;
  const totMsg=Number.isFinite(tot)&&tot>0?(tot===uniq?" Confere com o total da lista ("+tot+").":" Atenção: a lista indica "+tot+" veículos e li "+uniq+". Confirma se falta alguma."):"";
  setStatus(uniq+" matrículas lidas "+r.what+"."+totMsg+(r.fixes&&r.fixes.length?" Corrigidas por falha de impressão: "+r.fixes.join(", ")+".":""),Number.isFinite(tot)&&tot>0&&tot!==uniq);
}
function fileError(e){
  const c=e&&e.code;
  setStatus(c==="empty"?"Não encontrei matrículas neste ficheiro. Se o PDF for uma imagem digitalizada, tira um print do ecrã e carrega-o.":c==="nopdf"?"Não consegui abrir PDFs aqui. Tira um print do ecrã e carrega a imagem, ou cola o texto.":c==="noxlsx"?"Não consegui abrir o Excel aqui. Guarda-o como CSV ou cola as matrículas.":c==="not_granted"?"Precisas de autorizar o pedido à AI para ler imagens.":c==="image_rejected"?"A imagem não foi aceite (tipo ou tamanho). Tenta com um print mais pequeno.":"Não consegui ler o ficheiro. Tenta uma imagem, ou cola as matrículas.",true);
}
function improCount(){ const n=parse($("impro").value).filter(x=>VALID.test(x)).length, c=$("improcount"); c.textContent=n?n+" em impro":"Sem lista"; c.classList.toggle("warnc",n>0); }
function addToImpro(arr){ const have=new Set(parse($("impro").value)); const add=arr.filter(a=>!have.has(a.p)); const cur=$("impro").value.trim(); $("impro").value=(cur?cur+"\n":"")+add.map(a=>fmt(a.p)+(a.obs?" · "+a.obs:"")).join("\n"); improCount(); if(!$("out").classList.contains("hidden")) compare(); }
$("listafile").addEventListener("change",async()=>{
  const f=$("listafile").files[0]; if(!f) return; $("listafile").value="";
  setStatus("A ler a lista…");
  try{ const r=await readPlatesFile(f); if(!r.found.length) throw {code:"empty"}; addToList(r.found); fileStatus(r); }
  catch(e){ fileError(e); }
});
$("improfile").addEventListener("change",async()=>{
  const f=$("improfile").files[0]; if(!f) return; $("improfile").value="";
  setStatus("A ler os veículos em impro…");
  try{ const r=await readPlatesFile(f,"impro"); if(!r.found.length) throw {code:"empty"}; addToImpro(r.found); r.tot=NaN; fileStatus(r); }
  catch(e){ fileError(e); }
});
$("impro").addEventListener("input",improCount);
$("impro").addEventListener("change",()=>{ $("impro").value=$("impro").value.split(/\n/).map(l=>{ const u=l.toUpperCase(), f=u.match(RXW); if(f){ const r=repairPlate(f[0]); if(VALID.test(r.p)){ const i=u.indexOf(f[0]); const rest=(l.slice(0,i)+" "+l.slice(i+f[0].length)).replace(/\s{2,}/g," ").replace(/^[\s|;,:·–-]+|[\s|;,:·–-]+$/g,""); return fmt(r.p)+(rest?" · "+rest:""); } } return l.trim(); }).join("\n"); improCount(); if(!$("out").classList.contains("hidden")) compare(); });
let items=[], nextN=1;
const INFO0="Cada foto é validada logo que a adicionas: ✓ lida, ✗ tira outra.";
function fotoInfo(){
  const n=items.length, ok=items.filter(i=>i.st==="ok").length, bad=items.filter(i=>i.st==="bad").length;
  $("fotoinfo").textContent=n?(n+" foto(s): "+ok+" validada(s)"+(bad?", "+bad+" para repetir":"")+". Toca no campo para juntar mais."):INFO0;
  $("limpar").classList.toggle("hidden",!n);
  const se=$("status"); if(se.classList.contains("err")&&/sem matrícula lida/.test(se.textContent)){ if(bad) setStatus(bad+" foto(s) sem matrícula lida (a vermelho).",true); else setStatus(""); }
}
let thFil=null;
const thCat=(it,seen)=>it.st==="ok"?([...it.plates].some(p=>seen[p]>1)?"dup":"ok"):(it.st==="bad"||it.st==="err")?"bad":"wait";
const thSeen=()=>{ const seen={}; items.forEach(it=>{ if(it.st==="ok") it.plates.forEach(p=>{ seen[p]=(seen[p]||0)+1; }); }); return seen; };
function thSummary(){
  const sm=$("thsum"), n=items.length; sm.textContent="";
  if(!n){ thFil=null; sm.classList.add("hidden"); $("thumbs").classList.add("hidden"); return; }
  sm.classList.remove("hidden");
  const seen=thSeen(), c={ok:0,bad:0,wait:0,dup:0};
  items.forEach(it=>{ c[thCat(it,seen)]++; if(it.st==="ok"&&thCat(it,seen)==="dup") c.ok++; });
  const part=(key,cls,t)=>{ const e=document.createElement("button"); e.type="button"; e.className="tp "+cls+(thFil===key?" on":""); e.setAttribute("aria-pressed",thFil===key?"true":"false"); e.textContent=t; e.addEventListener("click",()=>{ thFil=thFil===key?null:key; renderThumbs(); }); sm.appendChild(e); };
  if(c.ok) part("ok","g",c.ok===1?"1 lida":c.ok+" lidas");
  if(c.bad) part("bad","r",c.bad===1?"1 falhou":c.bad+" falharam");
  if(c.wait) part("wait","m",c.wait+" em fila");
  if(c.dup) part("dup","w",c.dup===1?"1 repetida":c.dup+" repetidas");
  if(thFil&&!c[thFil]) thFil=null;
  $("thumbs").classList.toggle("hidden",!thFil);
}
function renderThumbs(){
  const box=$("thumbs"); box.textContent=""; thSummary(); const seenF=thSeen();
  const seenN={}; items.forEach(it=>{ if(it.st==="ok") it.plates.forEach(p=>{ seenN[p]=(seenN[p]||0)+1; }); });
  items.forEach(it=>{
    if(thFil){ const ct=thCat(it,seenF); if(thFil==="ok"?!(ct==="ok"||ct==="dup"):ct!==thFil) return; }
    const d=document.createElement("div"); d.className="th "+it.st;
    const im=document.createElement("img"); if(it.url) im.src=it.url; im.alt="Foto "+it.n+": toca para abrir"; d.appendChild(im);
    if(it.st==="ok"||it.st==="bad"){ d.classList.add("open"); im.addEventListener("click",()=>openPhoto(it)); }
    const b=document.createElement("div"); b.className="thb";
    const dup=it.st==="ok"&&[...it.plates].some(p=>seenN[p]>1);
    b.textContent=it.st==="ok"?"✓ "+[...it.plates].map(fmt).join(", ")+(it.manual?" (manual)":"")+(dup?" ⚠ repetida":it.low?" ⚠ confirma":""):it.st==="bad"?"✗ ilegível · toca para escrever":it.st==="run"?"A ler…":it.st==="err"?"Falhou, tenta de novo":"Na fila";
    d.appendChild(b);
    if(dup){ d.classList.add("dup"); const del=document.createElement("button"); del.type="button"; del.className="thdel"; del.textContent="Eliminar"; del.setAttribute("aria-label","Eliminar foto "+it.n); del.addEventListener("click",()=>{ try{URL.revokeObjectURL(it.url);}catch(e){} items=items.filter(o=>o!==it); renderThumbs(); fotoInfo(); rebuildResults(); }); d.appendChild(del); }
    const x=document.createElement("button"); x.type="button"; x.className="thx"; x.textContent="✕"; x.setAttribute("aria-label","Remover foto "+it.n);
    x.addEventListener("click",()=>{ try{URL.revokeObjectURL(it.url);}catch(e){} items=items.filter(o=>o!==it); renderThumbs(); fotoInfo(); rebuildResults(); });
    d.appendChild(x); box.appendChild(d);
  });
}
function statusFor(err){
  if(err){ const c=err.code;
    return {err:true,msg:c==="nosample"?"A leitura por AI não está disponível nesta vista. Abre a página com a tua conta Claude.":
      c==="noimages"?"Esta vista não permite enviar imagens à AI.":
      c==="not_granted"?"Precisas de autorizar o pedido à AI para usar esta página.":
      c==="rate_limited"?"Limite de pedidos atingido. Espera cerca de um minuto e carrega em “Ler fotos e conferir”: continua nas fotos que faltam.":
      "Houve um erro a ler. Carrega em “Ler fotos e conferir” para tentar de novo nas fotos que faltam."}; }
  const ok=items.filter(i=>i.st==="ok").length, bad=items.filter(i=>i.st==="bad").length;
  if(bad) return {err:true,msg:bad+" foto(s) sem matrícula lida (a vermelho)."};
  return {err:false,msg:ok?ok+" foto(s) validada(s).":""};
}
let running=null;
function progress(){
  const t=items.length, d=items.filter(i=>i.st==="ok"||i.st==="bad").length;
  if(running&&d<t) setStatus("A validar fotos: "+d+" de "+t+" concluídas…");
}
function validateQueue(){
  if(running) return running;
  running=(async()=>{
    let err=null;
    try{
      const sample=await claude.use("sample"); if(!sample) throw {code:"nosample"};
      const lim=await sample.limits(); if(!lim.images) throw {code:"noimages"};
      const n=Math.max(1,Math.min(lim.images.maxCount||5,10));
      const tiers=lim.modelTiers, quick=!tiers||tiers.includes("quick");
      items.forEach(i=>{ if(i.st==="err") i.st="pend"; });
      let stop=false;
      const worker=async()=>{
        while(!stop){
          const g=items.filter(i=>i.st==="pend").slice(0,n); if(!g.length) return;
          g.forEach(i=>i.st="run"); renderThumbs(); progress();
          try{
            const r=await processBatch(sample,g,n,quick);
            g.forEach((it,k)=>{ it.plates=r[k]; it.low=[...r[k]].some(x=>lowCert.has(x)); it.st=r[k].size?"ok":"bad"; });
          }catch(e){
            g.forEach(it=>{ if(it.st==="run") it.st="err"; });
            if(e&&["rate_limited","not_granted","sampling_disabled","session_expired"].includes(e.code)){ err=e; stop=true; }
          }
          renderThumbs(); fotoInfo(); progress();
        }
      };
      await Promise.all([worker(),worker(),worker()]);
    }catch(e){ err=e||{}; }
    return err;
  })().finally(()=>{ running=null; renderThumbs(); fotoInfo(); });
  return running;
}
async function validateAll(){
  let e=await validateQueue();
  while(!e&&items.some(i=>i.st==="pend")) e=await validateQueue();
  return e;
}
async function thumbOf(f){
  try{
    const b=await createImageBitmap(f); const sc=Math.min(1,240/Math.max(b.width,b.height));
    const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(b.width*sc)); c.height=Math.max(1,Math.round(b.height*sc));
    c.getContext("2d").drawImage(b,0,0,c.width,c.height); try{b.close();}catch(e){}
    const bl=await toBlobJ(c,0.7); return URL.createObjectURL(bl||f);
  }catch(e){ return URL.createObjectURL(f); }
}
$("fotos").addEventListener("change",async()=>{
  const inp=$("fotos"), list=[...inp.files]; if(!list.length) return;
  setStatus("A guardar "+list.length+" foto(s)…");
  const arr=await Promise.all(list.map(async f=>{ try{ return new File([await f.arrayBuffer()],f.name||("foto-"+Date.now()+".jpg"),{type:f.type||"image/jpeg"}); }catch(e){ return f; } }));
  inp.value="";
  const fresh=arr.map(f=>({file:f,url:"",st:"pend",plates:new Set(),low:false,n:nextN++}));
  items.push(...fresh); renderThumbs(); fotoInfo();
  (async()=>{ for(let k=0;k<fresh.length;k++){ fresh[k].url=await thumbOf(fresh[k].file); if(k%5===4||k===fresh.length-1) renderThumbs(); } })();
  if(running) return;
  const e=await validateAll(); const r=statusFor(e); setStatus(r.msg,r.err);
  if(parse($("lista").value).length) showResults();
});
$("limpar").addEventListener("click",()=>{
  items.forEach(it=>{try{URL.revokeObjectURL(it.url);}catch(e){}});
  items=[]; nextN=1; evid={}; manual={}; carried=new Set(); second={}; looked=new Set(); doubts=[]; lowCert=new Set(); lidasInfo={}; skipped=0;
  renderThumbs(); fotoInfo(); setStatus("");
});
$("ex").addEventListener("click",()=>{evid={};manual={};$("lista").value=EX_LISTA;$("lidas").value=EX_LIDAS;doubts=[];lowCert=new Set();lidasInfo=JSON.parse(JSON.stringify(EX_INFO));listaDesc=JSON.parse(JSON.stringify(EX_DESC));setStatus("Exemplo inventado: sem fotos reais. Repara no IJ-56-KL (a foto mostra outro carro) e no OR-90-ST (o mesmo carro que o QR-90-ST da lista).");compare();});
["lista","lidas"].forEach(id=>$(id).addEventListener("change",()=>{$(id).value=$(id).value.split(/\n/).map(l=>{const u=l.toUpperCase(),f=u.match(RX); if(f){const i=u.indexOf(f[0]), p=norm(f[0]); if(id==="lista"){const rest=(l.slice(0,i)+" "+l.slice(i+f[0].length)).replace(/\s{2,}/g," ").replace(/^[\s|;,:–-]+|[\s|;,:–-]+$/g,""); if(rest) listaDesc[p]=rest; return fmt(p);} return (l.slice(0,i)+fmt(p)+l.slice(i+f[0].length)).trim();} const n=norm(l);return n.length===6?fmt(n):l.trim();}).join("\n");}));
$("re").addEventListener("click",compare);

const PROMPT_DIRECT=`Lê as matrículas portuguesas visíveis nestas fotos de carros (imagem 1, imagem 2, ... pela ordem). Responde só com JSON válido, sem markdown:
{"matriculas":[{"imagem":1,"letras1":"AB","numeros":"12","letras2":"CD","certeza":"alta","marca":"Renault","modelo":"Clio"}]}
Lê cada matrícula em três grupos: "letras1" são 2 letras, "numeros" são 2 dígitos, "letras2" são 2 letras. O tipo de cada grupo é obrigatório, por isso escolhe sempre o tipo que o grupo exige (nunca uma letra num grupo de dígitos, nem o contrário). "certeza" é "alta", "media" ou "baixa" ("baixa" só se hesitares entre dois caracteres do mesmo tipo). "marca" e "modelo" do carro pela aparência (null se não tiveres certeza; nunca adivinhes). Ignora matrículas cortadas, tapadas ou ilegíveis e tudo o que não seja a matrícula. Nas matrículas portuguesas o I é só um traço vertical, sem pé; o L tem sempre um traço horizontal em baixo, virado para a direita. Não confundas os dois. Se um grupo de letras parecer ter 3 caracteres, é uma letra mal visível (por exemplo um H pode parecer "II"): devolve sempre 2 letras. Não escrevas comentários nem notas, só o JSON. Nunca inventes caracteres.`;

let skipped=0;
const PROMPT_LOC=`Estas fotos mostram carros com matrícula portuguesa. Para cada foto (pela ordem: imagem 1, imagem 2, ...), localiza as matrículas legíveis. Responde só com JSON válido, sem markdown:
{"fotos":[{"imagem":1,"carros":[{"caixa":[0.4,0.6,0.1,0.03],"marca":"Renault","modelo":"Clio"}]}]}
"caixa" é o retângulo que envolve só a chapa da matrícula, em frações da largura e da altura da foto (valores entre 0 e 1): x e y são o canto superior esquerdo, depois a largura e a altura. "marca" e "modelo" são do carro a que a matrícula pertence, pela aparência (null se não tiveres certeza; nunca adivinhes). Ignora carros sem matrícula visível e tudo o que não seja carro. Não escrevas comentários.`;
const PROMPT_READ=`Cada imagem é o recorte de uma matrícula portuguesa. Responde só com JSON válido, sem markdown:
{"leituras":[{"imagem":1,"letras1":"AB","numeros":"12","letras2":"CD","certeza":"alta"}]}
Lê os caracteres da matrícula em três grupos: "letras1" são 2 letras, "numeros" são 2 dígitos, "letras2" são 2 letras. O tipo de cada grupo é obrigatório, por isso escolhe sempre o tipo que o grupo exige (nunca uma letra num grupo de dígitos, nem o contrário). Ignora tudo o que não sejam os caracteres da matrícula. Nas matrículas portuguesas o I é só um traço vertical, sem pé; o L tem sempre um traço horizontal em baixo, virado para a direita. Não confundas os dois. "certeza" é "alta", "media" ou "baixa" ("baixa" só se hesitares entre dois caracteres do mesmo tipo). Se uma imagem não tiver uma matrícula legível, omite-a. Se um grupo de letras parecer ter 3 caracteres, é uma letra mal visível (por exemplo um H pode parecer "II"): devolve sempre 2 letras. Não escrevas comentários nem notas.`;
async function bmpOf(f){ try{ return await createImageBitmap(f); }catch(e){ return null; } }
const toBlobJ=(c,q)=>new Promise(r=>c.toBlob(b=>r(b),"image/jpeg",q));
async function overview(bmp,maxSide){
  const sc=Math.min(1,maxSide/Math.max(bmp.width,bmp.height));
  const c=document.createElement("canvas"); c.width=Math.round(bmp.width*sc); c.height=Math.round(bmp.height*sc);
  c.getContext("2d").drawImage(bmp,0,0,c.width,c.height); return toBlobJ(c,0.85);
}
async function cropPlate(bmp,box){
  if(!Array.isArray(box)||box.length!==4) return null;
  const [x,y,w,h]=box.map(Number);
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||x<0||y<0||x>1||y>1||w>1.02||h>1.02) return null;
  const W=bmp.width,H=bmp.height, px=x*W, py=y*H, pw=w*W, ph=h*H, mx=pw*0.25, my=Math.max(ph*0.5,pw*0.12);
  const sx=Math.max(0,px-mx), sy=Math.max(0,py-my), ex=Math.min(W,px+pw+mx), ey=Math.min(H,py+ph+my);
  const cw=Math.round(ex-sx), ch=Math.round(ey-sy); if(cw<8||ch<8) return null;
  const c=document.createElement("canvas"); c.width=cw; c.height=ch;
  c.getContext("2d").drawImage(bmp,sx,sy,cw,ch,0,0,cw,ch); return toBlobJ(c,0.95);
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let lastCall=0;
async function tryCall(sample,prompt,imgs,extra){
  const waits=[8,15,25,40];
  for(let a=0;;a++){
    const gap=Date.now()-lastCall; if(gap<250) await sleep(250-gap);
    try{ lastCall=Date.now(); return await sample.json(prompt,Object.assign({images:imgs},extra||{})); }
    catch(e){
      if(e&&e.code==="rate_limited"&&a<waits.length){
        for(let t=waits[a];t>0;t--){ setStatus("Limite de pedidos atingido. A esperar "+t+"s e a continuar sozinho…"); await sleep(1000); }
        continue;
      }
      throw e;
    }
  }
}
function addRead(m,info,lidas){
  const r=repairPlate(typeof m==="string"?m:String(m.letras1||"")+String(m.numeros||"")+String(m.letras2||"")), x=r.p;
  if(!VALID.test(x)) return;
  if(r.fix) lowCert.add(x);
  if(info&&(info.marca||info.modelo)) lidasInfo[x]={marca:String(info.marca||""),modelo:String(info.modelo||"")};
  if(m&&m.certeza==="baixa"){ lowCert.add(x); const t="Leitura incerta: "+fmt(x)+" (confirma à vista)"; if(!doubts.includes(t)) doubts.push(t); }
  lidas.add(x);
  return x;
}
async function processBatch(sample,its,n,quick){
  const res=its.map(()=>new Set());
  const bmps=[]; for(const it of its) bmps.push(await bmpOf(it.file));
  const ovs=[], idx=[], direct=[];
  for(let i=0;i<its.length;i++){
    if(!bmps[i]){direct.push(i);continue;}
    const ov=await overview(bmps[i],1280);
    if(!ov){direct.push(i);continue;}
    ovs.push(ov); idx.push(i);
  }
  const located={};
  for(let s0=0;s0<ovs.length;s0+=n){
    const part=ovs.slice(s0,s0+n);
    try{
      const d=await tryCall(sample,PROMPT_LOC,part,quick?{modelTier:"quick"}:{});
      ((d&&d.fotos)||[]).forEach(ft=>{const k=Number(ft.imagem)-1; if(k>=0&&k<part.length) located[s0+k]=Array.isArray(ft.carros)?ft.carros:[];});
    }catch(e){ if(!(e&&(e.code==="image_rejected"||e.code==="invalid_json"))) throw e; }
  }
  const crops=[], meta=[], hadCrop=new Set();
  for(let k=0;k<ovs.length;k++){
    for(const c of (located[k]||[])){
      const b=await cropPlate(bmps[idx[k]],c&&c.caixa);
      if(b){crops.push(b);meta.push({i:idx[k],marca:c.marca,modelo:c.modelo});hadCrop.add(idx[k]);}
    }
    if(!hadCrop.has(idx[k])) direct.push(idx[k]);
  }
  bmps.forEach(b=>{try{if(b) b.close();}catch(e){}});
  for(let s0=0;s0<crops.length;s0+=n){
    const batch=crops.slice(s0,s0+n);
    try{
      const d=await tryCall(sample,PROMPT_READ,batch,{});
      ((d&&d.leituras)||[]).forEach(l=>{const k=Number(l.imagem)-1; if(k>=0&&k<batch.length){const m=meta[s0+k]; const x=addRead(l,m,res[m.i]); if(x&&!evid[x]) evid[x]={crop:URL.createObjectURL(batch[k]),blob:batch[k],it:its[m.i]};}});
    }catch(e){ if(!(e&&(e.code==="image_rejected"||e.code==="invalid_json"))) throw e; }
  }
  hadCrop.forEach(i=>{ if(!res[i].size) direct.push(i); });
  for(let s0=0;s0<direct.length;s0+=n){
    const ids=direct.slice(s0,s0+n);
    try{
      const d=await tryCall(sample,PROMPT_DIRECT,ids.map(i=>its[i].file),{});
      ((d&&d.matriculas)||[]).forEach(m=>{const k=Number(m.imagem)-1; if(k>=0&&k<ids.length){ const x=addRead(m,m,res[ids[k]]); if(x&&!evid[x]) evid[x]={blob:its[ids[k]].file,it:its[ids[k]]}; }});
    }catch(e){ if(!(e&&(e.code==="image_rejected"||e.code==="invalid_json"))) throw e; }
  }
  return res;
}
$("go").addEventListener("click",async()=>{
  const lista=parse($("lista").value);
  if(!lista.length){setStatus("Cola primeiro a lista de matrículas esperadas.",true);return;}
  if(!items.length&&!carried.size){setStatus("Escolhe pelo menos uma foto, ou usa o exemplo.",true);return;}
  const btn=$("go"); btn.disabled=true;
  const e=await validateAll();
  btn.disabled=false;
  const lidas=new Set(carried); items.filter(i=>i.st==="ok").forEach(i=>i.plates.forEach(p=>lidas.add(p)));
  $("lidas").value=[...lidas].map(fmt).join("\n");
  compare();
  const r=statusFor(e); setStatus(r.msg,r.err);
  secondLook();
});
