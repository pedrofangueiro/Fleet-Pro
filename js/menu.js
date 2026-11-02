(function(){
  const _fi=fotoInfo;
  fotoInfo=function(){
    _fi();
    const n=items.length, done=items.filter(i=>i.st==="ok"||i.st==="bad").length, ok=items.filter(i=>i.st==="ok").length;
    $("fotocount").textContent=n?(ok+" de "+n+" validadas"):"0 fotos";
    $("fotocount").classList.toggle("full",n>0&&ok===n);
    $("fbarw").classList.toggle("hidden",!n);
    $("fbar").style.width=(n?Math.round(done/n*100):0)+"%";
    $("go").textContent=n?"Conferir "+n+" foto"+(n>1?"s":""):"Conferir";
  };
  function listCount(){
    const n=parse($("lista").value).filter(x=>VALID.test(x)).length, c=$("listacount");
    c.textContent=n?n+" veículo"+(n>1?"s":""):"Sem lista"; c.classList.toggle("full",n>0);
  }
  const _add=addToList;
  addToList=function(arr){ _add(arr); listCount(); };
  $("lista").addEventListener("input",listCount);
  $("lista").addEventListener("change",()=>setTimeout(listCount,0));
  $("ex").addEventListener("click",()=>{ listCount(); try{ $("out").scrollIntoView({behavior:"smooth",block:"start"}); }catch(e){} });
  $("go").addEventListener("click",()=>{ if(!parse($("lista").value).length){ $("listadet").open=true; } });
  fotoInfo(); listCount();
})();
$("sheetback").addEventListener("click",closeSheet);
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!$("sheet").classList.contains("hidden")) closeSheet(); });
$("ex").addEventListener("click",()=>{ $("impro").value="MN-78-OP"; improCount(); compare(); });
improCount();
function buildReport(){
  const pf=getProfile()||{}, imp=improMap();
  const rowOf=r=>{ const e=evid[r.read||r.p]; return {r,e}; };
  const isImp=r=>r.l==="Impro";
  const frota=lastRows.filter(r=>!isImp(r)), imprs=lastRows.filter(isImp);
  const hF=["Matrícula","Estado","Detalhe","Lido na foto","Foto nº","Observações","Justificação"].map(trText);
  const dF=frota.map(r=>{ const {e}=rowOf(r); return [fmt(r.p),trText(lab(r.l)),trText(r.n||""),r.read?fmt(r.read):"",e&&e.it?e.it.n:"",notes[r.p]||"",r.why||""]; });
  const hI=["Matrícula","Situação","Observações impro","Lido na foto","Foto nº","Observações","Justificação"].map(trText);
  const dI=imprs.map(r=>{ const {e}=rowOf(r); return [fmt(r.p),trText(r.n||""),r.obs||"",r.read?fmt(r.read):"",e&&e.it?e.it.n:"",notes[r.p]||"",r.why||""]; });
  const ws=XLSX.utils.aoa_to_sheet([hF,...dF]);
  ws["!cols"]=[{wch:12},{wch:18},{wch:40},{wch:14},{wch:8},{wch:45},{wch:45}];
  ws["!autofilter"]={ref:"A1:G"+(dF.length+1)};
  const wi=XLSX.utils.aoa_to_sheet([hI,...dI]);
  wi["!cols"]=[{wch:12},{wch:34},{wch:50},{wch:14},{wch:8},{wch:45},{wch:45}];
  wi["!autofilter"]={ref:"A1:G"+(dI.length+1)};
  const c=k=>lastRows.filter(r=>r.l===k).length;
  const counts={prev:lastRows.filter(r=>r.src==="esp").length,conf:c("Confirmada"),falta:c("Em falta"),fora:c("Fora da lista"),chk:c("Verificar leitura")+c("Carro diferente"),impro:c("Impro")};
  const now=new Date(), pad=n=>String(n).padStart(2,"0"), dia=pad(now.getDate())+"-"+pad(now.getMonth()+1)+"-"+now.getFullYear(), hora=pad(now.getHours())+":"+pad(now.getMinutes());
  const sum=XLSX.utils.aoa_to_sheet(trRows([["Fleet Pro: conferência de frota"],["Empresa",pf.empresa||""],["Estação",pf.estacao||""],["Operador",pf.nome||""],["Data",dia+" "+hora],[],["Viaturas previstas (frota)",lastRows.filter(r=>r.src==="esp"&&r.l!=="Impro").length],["Veículos em impro",counts.impro],["Confirmados",counts.conf],["Em falta",counts.falta],["Não previstos",counts.fora],["A verificar",counts.chk],["Fotos analisadas",items.length]]));
  sum["!cols"]=[{wch:22},{wch:28}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,sum,trText("Resumo")); XLSX.utils.book_append_sheet(wb,ws,trText("Frota")); XLSX.utils.book_append_sheet(wb,wi,trText("Impro"));
  return {buf:XLSX.write(wb,{bookType:"xlsx",type:"array"}),name:"fleet_"+dia,counts,empresa:pf.empresa||"",estacao:pf.estacao||""};
}
$("xl").addEventListener("click",async()=>{
  if(!lastRows.length){ setStatus("Ainda não há resultado para exportar. Carrega em Conferir primeiro.",true); return; }
  if(!window.XLSX){ setStatus("Não consegui preparar o Excel aqui.",true); return; }
  const r=buildReport(), blob=new Blob([r.buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const dl=window.claude?await claude.use("downloads"):null;
  if(!dl){ setStatus("Descarregar ficheiros não está disponível nesta vista.",true); return; }
  try{ await dl.save({filename:r.name+".xlsx",data:blob}); setStatus("Relatório Excel pronto."); }
  catch(e){ const k=e&&e.code; if(k==="declined") setStatus(""); else if(k==="rate_limited") setStatus("Já há um pedido de download aberto. Responde-lhe e tenta de novo.",true); else setStatus("Não foi possível descarregar o Excel nesta vista.",true); }
});
$("cp").addEventListener("click",async()=>{
  if(!lastRows.length){ setStatus("Ainda não há resultado para guardar. Carrega em Conferir primeiro.",true); return; }
  if(!window.XLSX){ setStatus("Não consegui preparar o relatório aqui.",true); return; }
  const r=buildReport(); let ok=false;
  try{ ok=await repPut({name:r.name,t:Date.now(),empresa:r.empresa,estacao:r.estacao,counts:r.counts,buf:r.buf}); }catch(e){}
  setStatus(ok?"Relatório guardado no Fleet Pro. Consulta-o em Menu → Relatórios.":"Não foi possível guardar o relatório.",!ok);
});
function showResults(){
  const lidas=new Set(carried); items.filter(i=>i.st==="ok").forEach(i=>i.plates.forEach(p=>lidas.add(p)));
  $("lidas").value=[...lidas].map(fmt).join("\n"); compare();
}
function applySearch(){
  const q=norm($("q").value||"");
  document.querySelectorAll("#rowsbox .rrow").forEach(r=>{ const pl=r.querySelector(".plate"); if(!pl) return; r.classList.toggle("hidden",!!q&&!norm(pl.textContent).includes(q)); });
}
$("q").addEventListener("input",applySearch);

const KEY="fleetpro.sessao.v1"; let lastSaved="", demo=false;
function snapshot(){
  const all=new Set(carried); items.filter(i=>i.st==="ok").forEach(i=>i.plates.forEach(p=>all.add(p)));
  return {t:Date.now(),lista:$("lista").value,impro:$("impro").value,listaDesc,manual,lidasInfo,lowCert:[...lowCert],carried:[...all],lidas:$("lidas").value,notes,ovr,ovrWhy,out:!$("out").classList.contains("hidden"),filtro};
}
function saveState(){
  if(demo) return;
  let st, js; try{ st=snapshot(); js=JSON.stringify(st); }catch(e){ return; }
  const key=js.replace(/"t":\d+,/,""); if(key===lastSaved) return; lastSaved=key;
  const has=st.lista.trim()||st.impro.trim()||st.carried.length;
  try{ if(has) localStorage.setItem(KEY,js); else localStorage.removeItem(KEY); }catch(e){}
}
function refreshHeader(){
  const has=!!($("lista").value.trim()||$("impro").value.trim()||items.length||carried.size);
  $("novo").classList.toggle("hidden",!has||demo); $("ex").classList.toggle("hidden",has&&!demo);
}
setInterval(()=>{ saveState(); refreshHeader(); },2000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") saveState(); });
window.addEventListener("pagehide",saveState);

function resetAll(quiet){
  items.forEach(it=>{ try{URL.revokeObjectURL(it.url);}catch(e){} });
  items=[]; nextN=1; carried=new Set(); evid={}; manual={}; second={}; looked=new Set(); notes={}; ovr={}; ovrWhy={}; doubts=[]; lowCert=new Set(); lidasInfo={}; listaDesc={}; filtro="todas"; lastRows=[]; curFalta=[]; demo=false;
  $("lista").value=""; $("impro").value=""; $("lidas").value=""; $("q").value="";
  $("lista").dispatchEvent(new Event("input")); improCount(); renderThumbs(); fotoInfo();
  $("out").classList.add("hidden"); $("res").textContent=""; $("rowsbox").textContent="";
  try{ localStorage.removeItem(KEY); }catch(e){} lastSaved="";
  refreshHeader();
  if(!quiet){ setStatus("Pronto para uma nova conferência."); window.scrollTo(0,0); }
}
let armT=null;
$("novo").addEventListener("click",()=>{
  const b=$("novo");
  if(!b.classList.contains("arm")){ b.classList.add("arm"); b.textContent="Toca de novo para apagar tudo"; armT=setTimeout(()=>{ b.classList.remove("arm"); b.textContent="Conferir novamente"; },4000); return; }
  clearTimeout(armT); b.classList.remove("arm"); b.textContent="Conferir novamente"; resetAll(false);
});
$("ex").addEventListener("click",()=>{ demo=true; refreshHeader(); });
document.addEventListener("change",ev=>{ if(demo&&ev.target&&["listafile","improfile","fotos"].includes(ev.target.id)) resetAll(true); },true);

const _fi2=fotoInfo;
fotoInfo=function(){ _fi2(); if(!items.length&&carried.size){ $("fotocount").textContent=carried.size+" lidas antes"; $("fotoinfo").textContent="As matrículas lidas antes ficaram guardadas. Podes juntar mais fotos."; } };

(function restore(){
  let st=null; try{ st=JSON.parse(localStorage.getItem(KEY)||"null"); }catch(e){}
  if(!st||typeof st!=="object") { refreshHeader(); return; }
  try{
    $("lista").value=st.lista||""; $("impro").value=st.impro||"";
    listaDesc=st.listaDesc||{}; manual=st.manual||{}; lidasInfo=st.lidasInfo||{};
    lowCert=new Set(st.lowCert||[]); carried=new Set(st.carried||[]); notes=st.notes||{}; ovr=st.ovr||{}; ovrWhy=st.ovrWhy||{}; filtro=st.filtro||"todas";
    $("lista").dispatchEvent(new Event("input")); improCount(); fotoInfo();
    if(st.out&&parse($("lista").value).length){ $("lidas").value=st.lidas||[...carried].map(fmt).join("\n"); compare(); }
    const d=new Date(st.t), pd=n=>String(n).padStart(2,"0");
    setStatus("Conferência de "+pd(d.getDate())+"-"+pd(d.getMonth()+1)+" às "+pd(d.getHours())+":"+pd(d.getMinutes())+" recuperada"+(carried.size?": "+carried.size+" matrículas lidas guardadas.":".")+" Para começar outra, toca em Conferir novamente.");
    lastSaved=JSON.stringify(snapshot()).replace(/"t":\d+,/,"");
  }catch(e){}
  refreshHeader();
})();
let looking=false;
async function secondLook(){
  if(looking) return;
  const pairs=(lastRows||[]).filter(r=>r.kind==="pair"&&!looked.has(r.exp+"|"+r.read)&&!manual[r.exp+"|"+r.read]);
  if(!pairs.length) return;
  const sample=window.claude?await claude.use("sample"):null; if(!sample) return;
  looking=true; let changed=0;
  try{
    for(const r of pairs){
      const key=r.exp+"|"+r.read; looked.add(key);
      const e=evid[r.read], img=e&&(e.blob||(e.it&&e.it.file)); if(!img) continue;
      setStatus("A confirmar "+fmt(r.read)+" com uma 2.ª leitura…");
      const opts=[fmt(r.exp),fmt(r.read)].sort();
      const prompt="Esta imagem mostra uma matrícula portuguesa no formato AA-00-AA. Lê-a carácter a carácter, com atenção. Nas matrículas portuguesas o I é só um traço vertical, sem pé; o L tem sempre um traço horizontal em baixo, virado para a direita; o O é redondo e o D tem o lado esquerdo direito; o Q tem um traço em baixo à direita. Depois diz qual destas duas está escrita na matrícula: "+opts[0]+" ou "+opts[1]+". Se não for nenhuma das duas, responde \"nenhuma\". Responde só com JSON válido, sem markdown: {\"lida\":\"AA-00-AA\",\"resposta\":\"\"}";
      let d=null; try{ d=await tryCall(sample,prompt,[img],{}); }catch(err){ if(err&&["rate_limited","not_granted","sampling_disabled"].includes(err.code)) break; continue; }
      const ans=norm(String(d&&d.resposta||""));
      if(ans===r.exp){ manual[key]="auto"; changed++; }
      else if(ans===r.read){ second[key]=1; changed++; }
    }
  } finally { looking=false; }
  if(changed){ compare(); }
  const fixedN=pairs.filter(r=>manual[r.exp+"|"+r.read]==="auto").length;
  setStatus(fixedN?fixedN+" leitura(s) corrigida(s) numa 2.ª leitura. Podes ver qual era em cada uma, a verde.":"2.ª leitura feita: as dúvidas que ficam precisam de ser vistas por ti.");
}
const _sr=showResults;
showResults=function(){ _sr(); secondLook(); };
const _ra=resetAll;
resetAll=function(q){ second={}; looked=new Set(); _ra(q); };
$("sheetback").addEventListener("click",()=>{ if(noteDirty){ noteDirty=false; compare(); } });
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&noteDirty){ noteDirty=false; compare(); } });
/* Fotos guardadas no telemóvel (IndexedDB), para não se perderem se a página recarregar */
const IDB_NAME="fleetpro", IDB_STORE="fotos"; let dbp=null, idbOK=typeof indexedDB!=="undefined";
function idb(){ if(dbp) return dbp; dbp=new Promise((res,rej)=>{ try{ const r=indexedDB.open(IDB_NAME,2); r.onupgradeneeded=()=>{ const d=r.result; if(!d.objectStoreNames.contains(IDB_STORE)) d.createObjectStore(IDB_STORE,{keyPath:"n"}); if(!d.objectStoreNames.contains("relatorios")) d.createObjectStore("relatorios",{keyPath:"id",autoIncrement:true}); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }catch(e){ rej(e); } }); return dbp; }
function idbReq(mode,fn){ return idb().then(db=>new Promise((res,rej)=>{ const tx=db.transaction(IDB_STORE,mode); const r=fn(tx.objectStore(IDB_STORE)); tx.oncomplete=()=>res(r&&r.result); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); })); }
const idbPut=rec=>idbReq("readwrite",st=>st.put(rec));
const idbDel=n=>idbReq("readwrite",st=>st.delete(n));
const idbAll=()=>idbReq("readonly",st=>st.getAll());
async function viewOf(f){
  try{ const b=await createImageBitmap(f); const sc=Math.min(1,1600/Math.max(b.width,b.height)); const c=document.createElement("canvas"); c.width=Math.round(b.width*sc); c.height=Math.round(b.height*sc); c.getContext("2d").drawImage(b,0,0,c.width,c.height); try{b.close();}catch(e){} return (await toBlobJ(c,0.85))||f; }
  catch(e){ return f; }
}
const sig=it=>JSON.stringify([it.st,[...it.plates].sort(),!!it.manual,!!it.low]);
let syncing=false, persisted=new Set();
async function syncPhotos(){
  if(syncing||demo||!idbOK) return; syncing=true;
  try{
    const live=new Set(items.map(i=>i.n));
    for(const n of [...persisted]) if(!live.has(n)){ await idbDel(n); persisted.delete(n); }
    for(const it of items.slice()){
      if(it.st!=="ok"&&it.st!=="bad") continue;
      const sg=sig(it); if(it.savedSig===sg) continue;
      if(!it.view) it.view=await viewOf(it.file);
      const crops={}; Object.keys(evid).forEach(p=>{ const e=evid[p]; if(e&&e.it===it&&e.crop&&e.blob) crops[p]=e.blob; });
      await idbPut({n:it.n,st:it.st,plates:[...it.plates],manual:!!it.manual,low:!!it.low,view:it.view,crops});
      it.savedSig=sg; persisted.add(it.n);
    }
  }catch(e){ idbOK=false; }
  finally{ syncing=false; }
}
setInterval(syncPhotos,2500);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") syncPhotos(); });

(async function restorePhotos(){
  if(!idbOK) return;
  let recs=[]; try{ recs=(await idbAll())||[]; }catch(e){ idbOK=false; return; }
  if(!recs.length||items.length) return;
  recs.sort((a,b)=>a.n-b.n);
  recs.forEach(rec=>{
    if(!rec.view) return;
    const it={file:rec.view,view:rec.view,url:"",st:rec.st,plates:new Set(rec.plates||[]),manual:!!rec.manual,low:!!rec.low,n:rec.n};
    it.savedSig=sig(it); items.push(it); persisted.add(rec.n);
    it.plates.forEach(p=>{ const cb=rec.crops&&rec.crops[p]; evid[p]={crop:cb?URL.createObjectURL(cb):undefined,blob:cb||rec.view,it}; if(it.low) lowCert.add(p); });
  });
  if(!items.length) return;
  nextN=Math.max(nextN,...items.map(i=>i.n))+1;
  const inPhotos=new Set(); items.forEach(i=>i.plates.forEach(p=>inPhotos.add(p)));
  carried=new Set([...carried].filter(p=>!inPhotos.has(p)));
  renderThumbs(); fotoInfo();
  if(!$("out").classList.contains("hidden")){ compare(); secondLook(); }
  setStatus("Conferência recuperada com "+(items.length===1?"1 foto.":"as "+items.length+" fotos."));
  for(let k=0;k<items.length;k++){ items[k].url=await thumbOf(items[k].view); if(k%8===7||k===items.length-1) renderThumbs(); }
})();
/* ---------- Definições: tema e idioma ---------- */
let lang="pt", theme="auto";
try{ lang=localStorage.getItem("fleetpro.idioma")||"pt"; theme=localStorage.getItem("fleetpro.tema")||"light"; }catch(e){}
const hostTheme=document.documentElement.getAttribute("data-theme");
function applyTheme(){ const r=document.documentElement; if(theme==="light"||theme==="dark") r.setAttribute("data-theme",theme); else if(hostTheme) r.setAttribute("data-theme",hostTheme); else r.removeAttribute("data-theme"); }

const EXACT={
 "Todas":"All","Previstas":"Expected","Confirmadas":"Confirmed","Confirmada":"Confirmed","Em falta":"Missing","Fora da lista":"Not on list","A verificar":"To check","Verificar leitura":"Check reading","Carro diferente":"Different car","Impro":"Impro",
 "Eliminar":"Delete","A ler…":"Reading…","Na fila":"Queued","Falhou, tenta de novo":"Failed, try again","✗ ilegível · toca para escrever":"✗ unreadable · tap to type",
 "Na lista":"On list","Lido na foto":"Read in photo","Matrícula":"Plate","Observações":"Notes","É esta":"This one","Conferir":"Check","Sem lista":"No list","0 fotos":"0 photos",
 "Definições":"Settings","Tema":"Theme","Automático":"Automatic","Claro":"Light","Escuro":"Dark","Idioma":"Language","F":"F","Fleet Pro":"Fleet Pro",
 "Estado":"Status","Detalhe":"Detail","Em impro":"In impro","Observações impro":"Impro notes","Foto nº":"Photo no.","Sim":"Yes","Não":"No","Data":"Date","Fotos analisadas":"Photos checked","Viaturas previstas":"Expected vehicles","Resumo":"Summary","Viaturas":"Vehicles"
};
const RX_RULES=[
 [/^(\d+) veículos?$/,(m,a)=>a+(a==="1"?" vehicle":" vehicles")],
 [/^(\d+) em impro$/,"$1 in impro"],
 [/^(\d+) de (\d+) validadas$/,"$1 of $2 checked"],
 [/^(\d+) lidas antes$/,"$1 read earlier"],
 [/^Conferir (\d+) fotos?$/,(m,a)=>"Check "+a+(a==="1"?" photo":" photos")],
 [/^(\d+) foto\(s\): (\d+) validada\(s\)(?:, (\d+) para repetir)?\. Toca no campo para juntar mais\.$/,(m,a,b,c)=>a+" photo(s): "+b+" checked"+(c?", "+c+" to retake":"")+". Tap the field to add more."],
 [/^([\d,.]+)% das viaturas previstas confirmadas$/,"$1% of expected vehicles confirmed"],
 [/^← Ver todas \((\d+)\)$/,"← See all ($1)"],
 [/^às (\d{1,2}:\d{2})$/,"at $1"],
 [/^Sim, é (.+)$/,"Yes, it's $1"],
 [/^A 2\.ª leitura confirmou (.+)\. Está certo\?$/,"The 2nd reading confirmed $1. Is that right?"],
 [/^Matrículas da lista ainda por confirmar mais parecidas com (.+):$/,"Closest unconfirmed plates on the list to $1:"],
 [/^difere em (\d+) carácter(es)?$/,(m,a)=>"differs by "+a+(a==="1"?" character":" characters")],
 [/^Matrícula recortada da foto nº (\d+)$/,"Plate cropped from photo no. $1"],
 [/^Foto nº (\d+) completa\. Toca na foto para aproximar ou afastar\.$/,"Full photo no. $1. Tap the photo to zoom in or out."],
 [/^Foto nº (\d+)$/,"Photo no. $1"],
 [/^Foto (\d+): toca para abrir$/,"Photo $1: tap to open"],
 [/^(Remover|Eliminar) foto (\d+)$/,(m,a,b)=>(a==="Remover"?"Remove":"Delete")+" photo "+b],
 [/^(.+): (.+)\. Abrir detalhe$/,"$1: $2. Open details"],
 [/^A guardar (\d+) foto\(s\)…$/,"Saving $1 photo(s)…"],
 [/^A validar fotos: (\d+) de (\d+) concluídas…$/,"Checking photos: $1 of $2 done…"],
 [/^Limite de pedidos atingido\. A esperar (\d+)s e a continuar sozinho…$/,"Request limit reached. Waiting $1s, then continuing…"],
 [/^A confirmar (.+) com uma 2\.ª leitura…$/,"Double-checking $1 with a 2nd reading…"],
 [/^(\d+) leitura\(s\) corrigida\(s\) numa 2\.ª leitura\. Podes ver qual era em cada uma, a verde\.$/,"$1 reading(s) fixed by a 2nd reading. Each one shows what it was, in green."],
 [/^(\d+) foto\(s\) validada\(s\)\.$/,"$1 photo(s) checked."],
 [/^(\d+) foto\(s\) sem matrícula lida \(a vermelho\)\.$/,"$1 photo(s) with no plate read (in red)."],
 [/^Conferência recuperada com 1 foto\.$/,"Check restored with 1 photo."],
 [/^Conferência recuperada com as (\d+) fotos\.$/,"Check restored with all $1 photos."],
 [/ Confere com o total da lista \((\d+)\)\./," Matches the list total ($1)."],
 [/ Atenção: a lista indica (\d+) veículos e li (\d+)\. Confirma se falta alguma\./," Warning: the list says $1 vehicles and I read $2. Check whether one is missing."],
 [/^(\d+) matrículas lidas /,"$1 plates read "],
 [/^Fleet Pro: conferência de (\S+) às (\S+)/,"Fleet Pro: check of $1 at $2"],
 [/^Conferência de (\S+) às (\S+) recuperada/,"Check from $1 at $2 restored"],
 [/: (\d+) matrículas lidas guardadas\./,": $1 plates read, saved."],
 [/(\d+) previstas · (\d+) confirmados · (\d+) em falta · (\d+) não previstos · (\d+) a verificar · (\d+) impro/,"$1 expected · $2 confirmed · $3 missing · $4 not on list · $5 to check · $6 impro"],
 [/: Confirmada(?= |$)/gm,": Confirmed"],[/: Em falta(?= |$)/gm,": Missing"],[/: Fora da lista(?= |$)/gm,": Not on list"],[/: Verificar leitura(?= |$)/gm,": Check reading"],[/: Carro diferente(?= |$)/gm,": Different car"]
];
const STR_RULES=[
 ["Veículos disponíveis","Available vehicles"],["Veículos em impro","Vehicles in impro"],["Fotos das matrículas","Plate photos"],["Carregar lista","Upload list"],["Foto, Excel, PDF ou texto","Photo, Excel, PDF or text"],
 ["Ver ou escrever matrículas","View or type plates"],["Adicionar fotos","Add photos"],["Escolhe várias de uma vez na galeria","Pick several at once from your gallery"],["Conferência de frota","Fleet check"],
 ["Ver exemplo","See example"],["Conferir novamente","Check again"],["Toca de novo para apagar tudo","Tap again to clear everything"],["Resultado","Result"],["Descarregar Excel","Download Excel"],["Copiar relatório","Copy report"],
 ["Corrigir leituras à mão","Fix readings by hand"],["Conferir de novo","Check again"],["Limpar fotos","Clear photos"],["← Voltar","← Back"],["Procurar matrícula","Search plate"],
 ["Uma matrícula por linha. Confirma a lista antes de conferir.","One plate per line. Check the list before running the check."],
 ["Uma viatura por linha, com as observações a seguir à matrícula. No resultado aparecem a amarelo, marcadas como impro.","One vehicle per line, with notes after the plate. In the result they show in yellow, marked as impro."],
 ["Matrículas dos veículos disponíveis, uma por linha","Plates of available vehicles, one per line"],["Matrículas das veículos em impro, uma por linha","Plates of vehicles in impro, one per line"],["Matrículas lidas nas fotos","Plates read from the photos"],
 ["Cada foto é validada logo que a adicionas: ✓ lida, ✗ tira outra.","Each photo is checked as soon as you add it: ✓ read, ✗ take another."],
 ["As matrículas lidas antes ficaram guardadas. Podes juntar mais fotos.","Plates read earlier were saved. You can add more photos."],
 [" ⚠ repetida"," ⚠ duplicate"],[" ⚠ confirma"," ⚠ check"],
 ["Nenhuma matrícula nesta categoria.","No plates in this category."],
 ["confirmada numa 2.ª leitura (lido antes como ","confirmed by a 2nd reading (first read as "],["validada por ti (lido ","validated by you (read "],["validada por ti","validated by you"],
 ["(a 2.ª leitura também leu assim)","(the 2nd reading agreed)"],["lido na foto como ","read in photo as "],["o carro da foto não corresponde ao registado","the car in the photo doesn't match the record"],
 ["leitura com pouca certeza","low-confidence reading"],["vista na foto, fora dos disponíveis","seen in a photo, not on the available list"],["vista na foto","seen in a photo"],["sem foto","no photo"],
 ["Observações da lista de impro","Impro list notes"],["Sem observações no ficheiro.","No notes in the file."],["Ex.: chave na receção, risco na porta traseira…","E.g.: key at reception, scratch on rear door…"],["Guardar observação","Save note"],
 ["É o mesmo carro?","Is it the same car?"],["Não, são diferentes","No, they're different"],["A leitura está certa?","Is the reading correct?"],["Sim, está certa","Yes, it's correct"],["Sim, está certo","Yes, it's correct"],["É este o carro da lista?","Is this the car on the list?"],
 ["Nenhuma é muito parecida: o mais provável é este carro não estar na lista.","None is very close: most likely this car isn't on the list."],
 ["Todas as matrículas da lista já estão confirmadas. Este carro não está na lista.","All plates on the list are already confirmed. This car isn't on the list."],
 ["Toca na foto para aproximar ou afastar.","Tap the photo to zoom in or out."],["Esta viatura não aparece em nenhuma foto.","This vehicle isn't in any photo."],
 ["Foto não disponível. Volta a adicionar a foto desta viatura para a veres aqui.","Photo not available. Add this vehicle's photo again to see it here."],
 ["Matrícula lida (corrige se estiver errada)","Plate read (fix it if wrong)"],["Consegues ver a matrícula? Escreve-a aqui","Can you see the plate? Type it here"],
 ["Se a foto tiver mais do que um carro, separa as matrículas com vírgulas.","If the photo has more than one car, separate the plates with commas."],["Guardar matrícula","Save plate"],["Remover foto","Remove photo"],
 ["Escreve no formato AA-00-AA (2 letras, 2 números, 2 letras).","Use the format AA-00-AA (2 letters, 2 digits, 2 letters)."],
 ["A ler a lista em partes, para ver melhor cada letra…","Reading the list in parts to see each letter better…"],["A ler a lista…","Reading the list…"],["A ler as veículos em impro…","Reading the impro vehicles…"],
 ["2.ª leitura feita: as dúvidas que ficam precisam de ser vistas por ti.","2nd reading done: the remaining doubts need your eyes."],
 ["Exemplo inventado: sem fotos reais. Repara no IJ-56-KL (a foto mostra outro carro) e no OR-90-ST (o mesmo carro que o QR-90-ST da lista).","Made-up example with no real photos. Look at IJ-56-KL (the photo shows another car) and OR-90-ST (the same car as QR-90-ST on the list)."],
 ["Pronto para uma nova conferência.","Ready for a new check."],["Relatório guardado no Fleet Pro. Consulta-o em Menu → Relatórios.","Report saved in Fleet Pro. Find it in Menu → Reports."],["Não foi possível guardar o relatório.","Couldn't save the report."],["Guardar relatório no Fleet Pro","Save report in Fleet Pro"],["Relatório Excel pronto.","Excel report ready."],
 ["Não consegui copiar. Seleciona o texto e copia à mão.","Couldn't copy. Select the text and copy it by hand."],
 ["Ainda não há resultado para exportar. Carrega em Conferir primeiro.","There's no result to export yet. Tap Check first."],
 ["Não consegui preparar o Excel aqui. Usa “Copiar relatório”.","Couldn't build the Excel file here. Use “Copy report”."],
 ["Descarregar ficheiros não está disponível nesta vista.","Downloading files isn't available in this view."],
 ["Já há um pedido de download aberto. Responde-lhe e tenta de novo.","A download prompt is already open. Answer it and try again."],
 ["Não foi possível descarregar o Excel nesta vista. Usa “Copiar relatório”.","Couldn't download the Excel file in this view. Use “Copy report”."],
 ["Cola primeiro a lista de matrículas esperadas.","Add the list of expected plates first."],["Escolhe pelo menos uma foto, ou usa o exemplo.","Pick at least one photo, or use the example."],
 ["A leitura por AI não está disponível nesta vista. Abre a página com a tua conta Claude.","AI reading isn't available in this view. Open the page with your Claude account."],
 ["Esta vista não permite enviar imagens à AI.","This view can't send images to the AI."],
 ["Precisas de autorizar o pedido à AI para usar esta página.","You need to allow the AI request to use this page."],["Precisas de autorizar o pedido à AI para ler imagens.","You need to allow the AI request to read images."],
 ["Limite de pedidos atingido. Espera cerca de um minuto e carrega em “Ler fotos e conferir”: continua nas fotos que faltam.","Request limit reached. Wait about a minute and tap Check: it continues with the remaining photos."],
 ["Houve um erro a ler. Carrega em “Ler fotos e conferir” para tentar de novo nas fotos que faltam.","There was a reading error. Tap Check to retry the remaining photos."],
 ["Não encontrei matrículas neste ficheiro. Se o PDF for uma imagem digitalizada, tira um print do ecrã e carrega-o.","No plates found in this file. If the PDF is a scanned image, take a screenshot and upload that."],
 ["Não consegui abrir PDFs aqui. Tira um print do ecrã e carrega a imagem, ou cola o texto.","Couldn't open PDFs here. Take a screenshot and upload it, or paste the text."],
 ["Não consegui abrir o Excel aqui. Guarda-o como CSV ou cola as matrículas.","Couldn't open the Excel file here. Save it as CSV or paste the plates."],
 ["A imagem não foi aceite (tipo ou tamanho). Tenta com um print mais pequeno.","The image wasn't accepted (type or size). Try a smaller screenshot."],
 ["Não consegui ler o ficheiro. Tenta uma imagem, ou cola as matrículas.","Couldn't read the file. Try an image, or paste the plates."],
 [" Corrigidas por falha de impressão: "," Fixed misprints: "],["no PDF.","from the PDF."],["no Excel.","from the Excel file."],["na imagem.","from the image."],["no ficheiro.","from the file."],
 [" Para começar outra, toca em Conferir novamente."," To start another, tap Check again."],["Segue o tema do telemóvel.","Follows your phone's theme."],
 ["Fleet Pro: conferência de frota","Fleet Pro: fleet check"]
];
STR_RULES.push(...STR_RULES.filter(([a])=>/^[a-zà-ú]/.test(a)).map(([a,b])=>[a.charAt(0).toUpperCase()+a.slice(1),b.charAt(0).toUpperCase()+b.slice(1)]));
STR_RULES.sort((a,b)=>b[0].length-a[0].length);
function trText(t){
  if(lang!=="en"||t==null) return t; const s0=String(t), k=s0.trim(); if(!k) return s0;
  if(Object.prototype.hasOwnProperty.call(EXACT,k)) return s0.replace(k,EXACT[k]);
  let out=s0; for(const [re,rp] of RX_RULES) out=out.replace(re,rp);
  for(const [a,b] of STR_RULES) if(out.includes(a)) out=out.split(a).join(b);
  return out;
}
const trRows=rows=>rows.map(r=>r.map((c,i)=>i===0&&typeof c==="string"?trText(c):c));
const SKIP="textarea,input,script,style,.obst,.plate";
function trNode(n){
  if(n.nodeType===3){
    const par=n.parentElement; if(!par||par.closest(SKIP)) return;
    if(lang!=="en"){ if(n.__pt!==undefined&&n.data===n.__en){ n.data=n.__pt; } n.__pt=undefined; n.__en=undefined; return; }
    if(n.__en!==undefined&&n.data===n.__en) return;
    const src=n.data; let out;
    if(par.closest(".unote")) out=src.replace(/^Obs\.: /,"Notes: "); else out=trText(src);
    n.__pt=src; n.__en=out; if(out!==src) n.data=out;
  } else if(n.nodeType===1){
    if(n.matches&&n.matches("script,style")) return;
    ["placeholder","aria-label","alt"].forEach(a=>trAttr(n,a));
    n.childNodes.forEach(trNode);
  }
}
function trAttr(el,a){
  if(!el.hasAttribute||!el.hasAttribute(a)) return; const v=el.getAttribute(a), K="__pt_"+a, E="__en_"+a;
  if(lang!=="en"){ if(el[K]!==undefined&&v===el[E]) el.setAttribute(a,el[K]); el[K]=undefined; el[E]=undefined; return; }
  if(el[E]!==undefined&&v===el[E]) return; const out=trText(v); el[K]=v; el[E]=out; if(out!==v) el.setAttribute(a,out);
}
const mo=new MutationObserver(ms=>{ for(const m of ms){
  if(m.type==="characterData") trNode(m.target);
  else if(m.type==="childList") m.addedNodes.forEach(trNode);
  else if(m.type==="attributes") trAttr(m.target,m.attributeName);
}});
mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","aria-label","alt"]});
function applyLang(){ document.documentElement.lang=lang==="en"?"en":"pt-PT"; trNode(document.body); if(!$("out").classList.contains("hidden")) compare(); }

function openSettings(){
  const body=$("sheetbody"); body.textContent=""; $("sheettitle").textContent="Configurações";
  const group=(title,opts,cur,on,hint)=>{ const c=document.createElement("div"); c.className="card"; const h=document.createElement("p"); h.className="q"; h.textContent=title; c.appendChild(h);
    const seg=document.createElement("div"); seg.className="seg"; seg.setAttribute("role","group"); seg.setAttribute("aria-label",title);
    opts.forEach(([v,l])=>{ const b=document.createElement("button"); b.type="button"; b.textContent=l; b.setAttribute("aria-pressed",v===cur?"true":"false"); if(v===cur) b.classList.add("sel"); b.addEventListener("click",()=>{ on(v); openSettings(); }); seg.appendChild(b); });
    c.appendChild(seg); if(hint){ const p=document.createElement("p"); p.className="hint"; p.textContent=hint; c.appendChild(p); } body.appendChild(c); };
  group("Tema",[["auto","Automático"],["light","Claro"],["dark","Escuro"]],theme,v=>{ theme=v; try{localStorage.setItem("fleetpro.tema",v);}catch(e){} applyTheme(); },theme==="auto"?"Segue o tema do telemóvel.":"");
  group("Idioma",[["pt","Português"],["en","English"]],lang,v=>{ lang=v; try{localStorage.setItem("fleetpro.idioma",v);}catch(e){} applyLang(); });
  $("sheet").classList.remove("hidden"); $("sheet").scrollTop=0; document.body.style.overflow="hidden"; $("sheetback").focus();
}

applyTheme(); if(lang==="en") applyLang();
new MutationObserver(()=>{ if(theme!=="auto"&&document.documentElement.getAttribute("data-theme")!==theme) applyTheme(); }).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
/* ---------- Menu, perfil, relatórios ---------- */
function getProfile(){ try{ const v=JSON.parse(localStorage.getItem("fleetpro.perfil")||"null"); return v&&v.empresa?v:null; }catch(e){ return null; } }
function setProfile(p){ try{ if(p) localStorage.setItem("fleetpro.perfil",JSON.stringify(p)); else localStorage.removeItem("fleetpro.perfil"); }catch(e){} applyProfile(); }
function initials(n){ return (n||"?").trim().split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("")||"?"; }
function applyProfile(){
  const p=getProfile();
  $("dname").textContent=p?p.nome:""; $("dcomp").textContent=p?[p.empresa,p.estacao].filter(Boolean).join(" · "):""; $("davatar").textContent=initials(p&&p.nome);
  $("bsub").textContent=p?[p.empresa,p.estacao].filter(Boolean).join(" · "):"Conferência de frota";
}
const repReq=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{ const tx=db.transaction("relatorios",mode); const r=fn(tx.objectStore("relatorios")); tx.oncomplete=()=>res(r&&r.result); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); }));
const LSR="fleetpro.relatorios";
const lsGet=()=>{ try{ return JSON.parse(localStorage.getItem(LSR)||"[]"); }catch(e){ return []; } };
const lsSet=a=>{ try{ localStorage.setItem(LSR,JSON.stringify(a)); return true; }catch(e){ return false; } };
const b64=buf=>{ let s="",u=new Uint8Array(buf); for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000)); return btoa(s); };
const unb64=t=>{ const s=atob(t), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; };
const XMIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
async function repPut(rec){
  const id=Date.now()+Math.random(); rec.id=id;
  const buf=rec.buf; const slim=Object.assign({},rec); delete slim.buf;
  try{ await repReq("readwrite",st=>st.put(Object.assign({},slim,{data:buf}))); return true; }catch(e){}
  const a=lsGet(); a.push(Object.assign({},slim,{b64:b64(buf)})); return lsSet(a);
}
async function repAll(){
  let a=[]; try{ a=(await repReq("readonly",st=>st.getAll()))||[]; }catch(e){}
  const l=lsGet().map(r=>Object.assign({},r,{data:unb64(r.b64).buffer}));
  return a.concat(l).map(r=>Object.assign({},r,{blob:r.blob||new Blob([r.data],{type:XMIME})}));
}
async function repDel(id){
  try{ await repReq("readwrite",st=>st.delete(id)); }catch(e){}
  lsSet(lsGet().filter(r=>r.id!==id));
}

function openDrawer(){ $("drawer").classList.remove("hidden"); document.body.style.overflow="hidden"; const b=$("logout"); b.classList.remove("arm"); b.querySelector("span").textContent="Terminar sessão"; $("dclose").focus(); }
function closeDrawer(){ $("drawer").classList.add("hidden"); if($("sheet").classList.contains("hidden")) document.body.style.overflow=""; }
$("menu").addEventListener("click",openDrawer);
$("dclose").addEventListener("click",closeDrawer);
$("dback").addEventListener("click",closeDrawer);
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!$("drawer").classList.contains("hidden")) closeDrawer(); });
document.querySelectorAll(".ditem[data-go]").forEach(b=>b.addEventListener("click",()=>{ closeDrawer(); const g=b.dataset.go; if(g==="perfil") openProfile(false); else if(g==="relatorios") openReports(); else openSettings(); }));

let loginMode=false;
document.addEventListener("keydown",ev=>{ if(loginMode&&ev.key==="Escape"){ ev.stopImmediatePropagation(); ev.preventDefault(); } },true);
function sheetOpen(title){ const body=$("sheetbody"); body.textContent=""; $("sheettitle").textContent=title; $("sheetback").classList.toggle("hidden",loginMode); $("sheet").classList.remove("hidden"); $("sheet").scrollTop=0; document.body.style.overflow="hidden"; return body; }
function openProfile(login){
  loginMode=!!login;
  const body=sheetOpen(login?"Entrar":"Perfil"), p=getProfile()||{};
  const card=document.createElement("div"); card.className="card"; body.appendChild(card);
  if(login){ const h=document.createElement("p"); h.className="q"; h.textContent="Bem-vindo ao Fleet Pro"; card.appendChild(h); }
  const fld=(id,lab,val,ph)=>{ const l=document.createElement("label"); l.className="fld"; const sp=document.createElement("span"); sp.textContent=lab; const i=document.createElement("input"); i.id=id; i.value=val||""; i.placeholder=ph; i.autocomplete="off"; l.appendChild(sp); l.appendChild(i); card.appendChild(l); return i; };
  const e=fld("pfemp","Empresa",p.empresa,""), st=fld("pfest","Estação",p.estacao,""), n=fld("pfnome","Login colaborador",p.nome,"");
  const err=document.createElement("p"); err.className="hint"; card.appendChild(err);
  const go=document.createElement("button"); go.type="button"; go.className="primary"; go.textContent=login?"Entrar":"Guardar"; card.appendChild(go);
  const submit=()=>{ const v={empresa:e.value.trim(),estacao:st.value.trim(),nome:n.value.trim()}; if(!v.empresa||!v.nome){ err.textContent="Preenche a empresa e o teu nome."; err.classList.add("bad"); (v.empresa?n:e).focus(); return; }
    setProfile(v); loginMode=false; $("sheetback").classList.remove("hidden"); closeSheet(); setStatus(login?"":"Perfil guardado."); };
  go.addEventListener("click",submit);
  [e,st,n].forEach(i=>i.addEventListener("keydown",ev=>{ if(ev.key==="Enter"){ ev.preventDefault(); submit(); } }));
  setTimeout(()=>{ try{ (e.value?n:e).focus(); }catch(x){} },50);
}
async function openReports(){
  loginMode=false;
  const body=sheetOpen("Relatórios"), p=getProfile()||{};
  const card=document.createElement("div"); card.className="card"; body.appendChild(card);
  let recs=[]; try{ recs=(await repAll())||[]; }catch(e){}
  recs=recs.filter(r=>!p.empresa||(r.empresa||"")===(p.empresa||"")).sort((a,b)=>b.t-a.t);
  if(!recs.length){ const h=document.createElement("p"); h.className="hint"; h.textContent="Ainda não há relatórios guardados. Carrega em Guardar relatório no Fleet Pro, no resultado, para criar o primeiro."; card.appendChild(h); return; }
  const pd=x=>String(x).padStart(2,"0");
  recs.forEach(r=>{
    const d=new Date(r.t), row=document.createElement("div"); row.className="rep";
    const b=document.createElement("b"); b.textContent=r.name; row.appendChild(b);
    const m1=document.createElement("span"); m1.className="meta"; m1.textContent=pd(d.getDate())+"-"+pd(d.getMonth()+1)+"-"+d.getFullYear()+" às "+pd(d.getHours())+":"+pd(d.getMinutes())+(r.estacao?" · "+r.estacao:""); row.appendChild(m1);
    const c=r.counts||{}; const m2=document.createElement("span"); m2.className="meta"; m2.textContent=(c.prev||0)+" previstas · "+(c.conf||0)+" confirmados · "+(c.falta||0)+" em falta · "+(c.fora||0)+" não previstos · "+(c.chk||0)+" a verificar · "+(c.impro||0)+" impro"; row.appendChild(m2);
    const btns=document.createElement("div"); btns.className="btns";
    const dlb=document.createElement("button"); dlb.type="button"; dlb.className="yes"; dlb.textContent="Descarregar";
    dlb.addEventListener("click",async()=>{ const dl=window.claude?await claude.use("downloads"):null; if(!dl){ setStatus("Descarregar ficheiros não está disponível nesta vista.",true); return; } try{ await dl.save({filename:r.name+".xlsx",data:r.blob}); }catch(e){ if(e&&e.code==="rate_limited") setStatus("Já há um pedido de download aberto. Responde-lhe e tenta de novo.",true); } });
    const del=document.createElement("button"); del.type="button"; del.className="no del"; del.textContent="Apagar";
    let t=null; del.addEventListener("click",async()=>{ if(!del.classList.contains("arm")){ del.classList.add("arm"); del.textContent="Toca de novo para apagar"; t=setTimeout(()=>{ del.classList.remove("arm"); del.textContent="Apagar"; },4000); return; } clearTimeout(t); try{ await repDel(r.id); }catch(e){} openReports(); });
    btns.appendChild(dlb); btns.appendChild(del); row.appendChild(btns); card.appendChild(row);
  });
}
let loT=null;
$("logout").addEventListener("click",()=>{
  const b=$("logout"), sp=b.querySelector("span");
  if(!b.classList.contains("arm")){ b.classList.add("arm"); sp.textContent="Toca de novo para sair"; loT=setTimeout(()=>{ b.classList.remove("arm"); sp.textContent="Terminar sessão"; },4000); return; }
  clearTimeout(loT); b.classList.remove("arm"); sp.textContent="Terminar sessão";
  closeDrawer(); resetAll(true); setProfile(null); setStatus(""); openProfile(true);
});
Object.assign(EXACT,{"Perfil":"Profile","Relatórios":"Reports","Configurações":"Settings","Terminar sessão":"Log out","Toca de novo para sair":"Tap again to log out","Entrar":"Sign in","Empresa":"Company","Estação ou loja":"Station or branch","Estação":"Station","Operador":"Operator","O teu nome":"Your name","Guardar":"Save","Descarregar":"Download","Apagar":"Delete","Toca de novo para apagar":"Tap again to delete","Menu":"Menu","Fechar menu":"Close menu","Bem-vindo ao Fleet Pro":"Welcome to Fleet Pro"});
RX_RULES.push([/^(\d+) lidas?$/,"$1 read"],[/^(\d+) (?:falhou|falharam)$/,"$1 failed"],[/^(\d+) em fila$/,"$1 in queue"],[/^(\d+) repetidas?$/,"$1 duplicate"],[/ · marcada como impro por ti$/," · marked as impro by you"],[/(^| · )tirada de impro por ti$/,"$1removed from impro by you"],[/^(\d{2}-\d{2}-\d{4}) às (\d{2}:\d{2})/,"$1 at $2"],[/^Olá, (.+)\.$/,"Hi, $1."],[/(\d+) previstas · (\d+) confirmados · (\d+) em falta · (\d+) não previstos · (\d+) a verificar · (\d+) impro/,"$1 expected · $2 confirmed · $3 missing · $4 not on list · $5 to check · $6 impro"]);
[["Cada empresa entra com o seu perfil. Os dados ficam só neste telemóvel.","Each company signs in with its own profile. Data stays on this phone only."],["Preenche a empresa e o teu nome.","Fill in the company and your name."],["Perfil guardado.","Profile saved."],
 ["Ainda não há relatórios guardados. Carrega em Guardar relatório no Fleet Pro, no resultado, para criar o primeiro.","No saved reports yet. Tap Save report in Fleet Pro, in the result, to create the first one."],
 ["Relatório guardado em Relatórios e descarregado.","Report saved in Reports and downloaded."],["Relatório guardado em Relatórios.","Report saved in Reports."],["Ex.: ","E.g.: "]].forEach(r=>STR_RULES.push(r));
Object.assign(EXACT,{"Confirmados":"Confirmed","Não previstos":"Not expected","Não prevista":"Not expected","opcional":"optional","Estado da viatura":"Vehicle status","O que queres fazer com esta viatura?":"What do you want to do with this vehicle?","Marcar como disponível":"Mark as available","Alterado por ti: marcada como disponível (não estava na lista).":"Changed by you: marked as available (it wasn't on the list).","adicionada por ti (não estava na lista)":"added by you (wasn't on the list)","Esta viatura não devia estar em impro?":"Shouldn't this vehicle be in impro?","Esta viatura está em impro?":"Is this vehicle in impro?","Tirar de impro":"Remove from impro","Marcar como impro":"Mark as impro","Repor decisão da app":"Restore the app's decision","Alterado por ti: marcada como impro (a app não a tinha em impro).":"Changed by you: marked as impro (the app didn't have it in impro).","Alterado por ti: tirada de impro (a app tinha-a em impro).":"Changed by you: removed from impro (the app had it in impro).","Nome":"Name","Login colaborador":"Employee login","Frota":"Fleet","Situação":"Status","Viaturas previstas (frota)":"Expected vehicles (fleet)","Veículos em impro":"Vehicles in impro"});
STR_RULES.sort((a,b)=>b[0].length-a[0].length);
applyProfile();
if(!getProfile()) openProfile(true);
if(lang==="en") trNode(document.body);
function askWhy(title,onOk){
  const m=document.createElement("div"); m.className="jmask";
  const bx=document.createElement("div"); bx.className="jbox"; m.appendChild(bx);
  const h=document.createElement("p"); h.className="q"; h.textContent=title; bx.appendChild(h);
  const l=document.createElement("label"); l.className="hint"; l.htmlFor="whytxt"; l.textContent="Justificação da alteração"; bx.appendChild(l);
  const ta=document.createElement("textarea"); ta.id="whytxt"; bx.appendChild(ta);
  const bt=document.createElement("div"); bt.className="btns"; bx.appendChild(bt);
  const ok=document.createElement("button"); ok.type="button"; ok.className="yes"; ok.textContent="Confirmar"; ok.disabled=true;
  const cc=document.createElement("button"); cc.type="button"; cc.className="ghost"; cc.textContent="Cancelar";
  bt.appendChild(ok); bt.appendChild(cc);
  const close=()=>m.remove();
  ta.addEventListener("input",()=>{ ok.disabled=!ta.value.trim(); });
  cc.addEventListener("click",close); m.addEventListener("click",e=>{ if(e.target===m) close(); });
  ok.addEventListener("click",()=>{ const v=ta.value.trim(); if(!v) return; close(); onOk(v); });
  document.body.appendChild(m); setTimeout(()=>{ try{ ta.focus(); }catch(e){} },50);
}
Object.assign(EXACT,{"Justificação da alteração":"Reason for the change","Confirmar":"Confirm","Cancelar":"Cancel","Justificação":"Reason"});
setTimeout(()=>{ const sp=$("splash"); if(!sp) return; sp.classList.add("out"); setTimeout(()=>sp.remove(),500); },1500);
