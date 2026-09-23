(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SHAPES = {"F":[[1,0],[2,0],[0,1],[1,1],[1,2]],"I":[[0,0],[0,1],[0,2],[0,3],[0,4]],"L":[[0,0],[0,1],[0,2],[0,3],[1,3]],"P":[[0,0],[1,0],[0,1],[1,1],[0,2]],"N":[[0,0],[0,1],[1,1],[1,2],[1,3]],"T":[[0,0],[1,0],[2,0],[1,1],[1,2]],"U":[[0,0],[2,0],[0,1],[1,1],[2,1]],"V":[[0,0],[0,1],[0,2],[1,2],[2,2]],"W":[[0,0],[0,1],[1,1],[1,2],[2,2]],"X":[[1,0],[0,1],[1,1],[2,1],[1,2]],"Y":[[0,0],[0,1],[1,1],[0,2],[0,3]],"Z":[[0,0],[1,0],[1,1],[1,2],[2,2]]};
  // 6列×10行の固定完成配置。ランキング問題・初期向き・並び順は全員共通。
  const SOLUTION = {"X":[[2,0],[1,1],[2,1],[3,1],[2,2]],"L":[[0,0],[1,0],[0,1],[0,2],[0,3]],"P":[[3,0],[4,0],[5,0],[4,1],[5,1]],"F":[[1,2],[1,3],[2,3],[0,4],[1,4]],"U":[[3,2],[4,2],[5,2],[3,3],[5,3]],"N":[[4,3],[4,4],[5,4],[5,5],[5,6]],"I":[[1,9],[2,9],[3,9],[4,9],[5,9]],"Y":[[0,6],[0,7],[0,8],[1,8],[0,9]],"T":[[0,5],[1,5],[2,5],[1,6],[1,7]],"W":[[2,4],[3,4],[3,5],[4,5],[4,6]],"Z":[[3,6],[3,7],[4,7],[5,7],[5,8]],"V":[[2,6],[2,7],[2,8],[3,8],[4,8]]};
  const IDS = Object.keys(SHAPES);
  const COLORS = ["#547364","#718b9e","#bb7e67","#bb9b4e","#948099","#838b8a","#588e8b","#a78770","#82946c","#b27d8c","#69809f","#a7a078"];
  const MODES = { easy: {label:"入門", count:3}, normal:{label:"基礎",count:5}, hard:{label:"応用",count:8}, expert:{label:"本番",count:12} };
  const NAME_KEY = "atama-pentomino-name";
  let problem, pieces = [], active = false, moves = 0, penalty = 0, started = 0;
  let ticker = 0, gesture = null, pendingTap = null, cell = 28, session = 0;
  let playerName = "No Name";
  const key = (x,y) => x + "," + y;
  const copy = (cells) => cells.map(([x,y]) => [x,y]);
  function normalize(cells) {
    const x = Math.min(...cells.map(p=>p[0])), y = Math.min(...cells.map(p=>p[1]));
    return cells.map(([a,b])=>[a-x,b-y]);
  }
  function bounds(cells) { return {w:Math.max(...cells.map(p=>p[0]))+1,h:Math.max(...cells.map(p=>p[1]))+1}; }
  function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function save(key,value) { try { localStorage.setItem(key,String(value)); } catch { /* 保存不可でもプレイを継続 */ } }
  function elapsed() { return performance.now()-started+penalty; }
  function timeText(ms, precise = false) {
    const cs = Math.floor(ms/10), min = Math.floor(cs/6000), sec = Math.floor(cs/100)%60;
    return precise ? (min ? min+"分" : "")+sec+"."+String(cs%100).padStart(2,"0")+"秒"
      : String(min).padStart(2,"0")+":"+String(sec).padStart(2,"0")+"."+Math.floor(cs%100/10);
  }
  function say(text) { $("game-message").textContent = text; }
  function randomIds(count) {
    const ids = [...IDS];
    for (let i=ids.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [ids[i],ids[j]]=[ids[j],ids[i]]; }
    return IDS.filter(id=>ids.slice(0,count).includes(id));
  }
  function makeProblem(mode, previous) {
    const count=MODES[mode].count;
    let ids = mode==="expert" ? [...IDS] : randomIds(count);
    // 有限回で必ず異なる組み合わせにする。
    if (previous && ids.join()===previous.ids.join() && count<12) {
      const excluded=IDS.filter(id=>!ids.includes(id));
      ids[0]=excluded[Math.floor(Math.random()*excluded.length)];
      ids=IDS.filter(id=>ids.includes(id));
    }
    const all=ids.flatMap(id=>SOLUTION[id]);
    const ox=Math.min(...all.map(p=>p[0])), oy=Math.min(...all.map(p=>p[1]));
    const solution=Object.fromEntries(ids.map(id=>[id,SOLUTION[id].map(([x,y])=>[x-ox,y-oy])]));
    const targets=Object.values(solution).flat();
    return {mode,ids,solution,targets,mask:new Set(targets.map(([x,y])=>key(x,y))),...bounds(targets)};
  }
  function clearTap() { if(pendingTap) clearTimeout(pendingTap.timer); pendingTap=null; }
  function cancelGesture() {
    if (!gesture) return;
    const g=gesture; gesture=null;
    g.ghost?.remove();
    if(g.source.hasPointerCapture(g.pointerId)) g.source.releasePointerCapture(g.pointerId);
    g.source.classList.remove("drag-source");
    $("board").querySelectorAll(".preview").forEach(el=>el.remove());
  }
  function restart() {
    if(!problem) return;
    session++; active=false; clearInterval(ticker); clearTap(); cancelGesture();
    $("result-dialog").close();
    pieces=problem.ids.map(id=>({id,cells:copy(SHAPES[id]),pos:null}));
    moves=0; penalty=0;
    $("home-screen").hidden=true; $("play-screen").hidden=false;
    document.body.classList.add("is-playing");
    $("mode-label").textContent=MODES[problem.mode].label;
    $("game-hint").disabled=problem.mode==="expert";
    $("game-hint").title=problem.mode==="expert" ? "本番ではヒントを使えません" : "1ピースを配置・30秒加算";
    $("result-next").hidden=problem.mode==="expert";
    $("result-message").textContent="";
    playerName=$("player-name").value.trim() || "No Name";
    say(problem.mode==="expert" ? "12種類すべてで60マスを埋めよう。" : "ヒントは1回 +30秒。盤面の白いマスを埋めよう。");
    window.scrollTo(0,0);
    render(); active=true; started=performance.now();
    updateTime(); ticker=setInterval(updateTime,80);
  }
  function start(mode, previous) { problem=makeProblem(mode,previous); restart(); }
  function home() {
    active=false; session++; clearInterval(ticker); clearTap(); cancelGesture();
    $("result-dialog").close(); $("play-screen").hidden=true; $("home-screen").hidden=false;
    document.body.classList.remove("is-playing"); window.scrollTo(0,0);
  }
  function updateTime() { if(active) window.AtamaUI.setTime(timeText(elapsed())); }
  function globalCells(p,cells=p.cells,pos=p.pos) { return pos ? cells.map(([x,y])=>[x+pos.x,y+pos.y]) : []; }
  function fits(piece,cells,pos) {
    if(!pos) return false;
    const occupied=new Set(pieces.filter(p=>p!==piece).flatMap(p=>globalCells(p)).map(([x,y])=>key(x,y)));
    return globalCells(piece,cells,pos).every(([x,y])=>problem.mask.has(key(x,y))&&!occupied.has(key(x,y)));
  }
  function pieceElement(piece,size,interactive=true) {
    const b=bounds(piece.cells), el=document.createElement("div");
    el.className="piece"; el.dataset.id=piece.id;
    el.style.width=b.w*size+"px"; el.style.height=b.h*size+"px";
    el.style.setProperty("--piece-color",COLORS[IDS.indexOf(piece.id)]);
    if(interactive) {
      el.setAttribute("role","button"); el.tabIndex=0;
      el.setAttribute("aria-label","ピース"+(IDS.indexOf(piece.id)+1)+"。タップで回転、ダブルタップで反転");
    } else el.setAttribute("aria-hidden","true");
    for(const [x,y] of piece.cells) {
      const block=document.createElement("span"); block.className="piece-cell";
      Object.assign(block.style,{left:x*size+"px",top:y*size+"px",width:size+"px",height:size+"px"});
      el.appendChild(block);
    }
    el.dataset.cell=size;
    return el;
  }
  function layout() {
    if(!problem || $("play-screen").hidden) return;
    const root=$("game-root"), available=root.clientHeight, width=root.clientWidth;
    const cols=width<280 ? 3 : 4, rows=Math.ceil(pieces.length/cols);
    const trayHeight=Math.min(rows*86,available*.40);
    cell=Math.max(8,Math.min(44,(width-12)/problem.w,(available-trayHeight-12)/problem.h));
    $("board").style.width=problem.w*cell+"px";
    $("board").style.height=problem.h*cell+"px";
    $("piece-tray").style.gridTemplateColumns="repeat("+cols+",minmax(0,1fr))";
    $("piece-tray").style.height=trayHeight+"px";
    root.style.gridTemplateRows="minmax(0,1fr) "+trayHeight+"px";
    return {width:(width-(cols-1)*6)/cols-12,height:(trayHeight-(rows-1)*6)/rows-12};
  }
  function render() {
    const traySize=layout();
    const board=$("board"), tray=$("piece-tray");
    board.replaceChildren(); tray.replaceChildren();
    for(const [x,y] of problem.targets) {
      const el=document.createElement("span"); el.className="board-cell";
      Object.assign(el.style,{left:x*cell+"px",top:y*cell+"px",width:cell+"px",height:cell+"px"});
      board.appendChild(el);
    }
    for(const p of pieces) {
      const slot=document.createElement("div"); slot.className="tray-slot";
      slot.dataset.slot=p.id;
      if(p.pos) {
        slot.classList.add("is-placed");
        const mark=document.createElement("span"); mark.textContent="✓"; mark.setAttribute("aria-label","配置済み"); slot.appendChild(mark);
        const el=pieceElement(p,cell);
        el.style.left=p.pos.x*cell+"px"; el.style.top=p.pos.y*cell+"px"; board.appendChild(el);
      } else {
        const b=bounds(p.cells);
        const trayCell=Math.max(5,Math.min(22,traySize.width/b.w,traySize.height/b.h));
        slot.appendChild(pieceElement(p,trayCell));
      }
      tray.appendChild(slot);
    }
    window.AtamaUI.setScore(pieces.filter(p=>p.pos).length+" / "+pieces.length);
  }
  function finishIfComplete() {
    if(!active || pieces.some(p=>!p.pos)) return;
    const occupied=pieces.flatMap(p=>globalCells(p)).map(([x,y])=>key(x,y));
    if(occupied.length!==problem.mask.size || new Set(occupied).size!==problem.mask.size || occupied.some(k=>!problem.mask.has(k))) return;
    const ms=Math.floor(elapsed()/10)*10, run=session, isRanked=problem.mode==="expert";
    active=false; clearInterval(ticker); clearTap();
    window.AtamaUI.setTime(timeText(ms));
    const bestKey="atama-pentomino-best-v1-"+problem.mode, stored=Number(read(bestKey));
    const best=stored>0 && Number.isFinite(stored) ? Math.min(ms,stored) : ms;
    save(bestKey,best);
    window.AtamaUI.showResult({title:"クリア！",stats:[{label:"TIME",value:timeText(ms,true)},{label:"操作回数",value:moves},{label:"端末ベスト",value:timeText(best,true)}]});
    if(isRanked) {
      $("result-message").textContent="ランキング登録中…";
      window.AtamaRanking.submit({name:playerName,score:ms/1000,secondaryValue:moves}).then(()=>{
        if(session===run) $("result-message").textContent="ランキングに登録しました。";
      }).catch(()=>{
        if(session===run) $("result-message").textContent="ランキングに登録できませんでした。通信状況をご確認ください。端末ベストは保存されています。";
      });
    } else $("result-message").textContent="ヒントの加算時間："+penalty/1000+"秒（記録に含まれています）";
  }
  function transform(piece,flip) {
    if(!active) return;
    piece.cells=normalize(piece.cells.map(([x,y])=>flip?[-x,y]:[-y,x]));
    if(piece.pos&&!fits(piece,piece.cells,piece.pos)) { piece.pos=null; say("回転・反転後に収まらないため、ピースをトレーに戻しました。"); }
    moves++; render(); finishIfComplete();
  }
  function tap(piece) {
    pendingTap={id:piece.id,at:performance.now(),timer:setTimeout(()=>{pendingTap=null;transform(piece,false);},300)};
  }
  function pointerDown(e) {
    if(!active || gesture || !e.isPrimary || e.button!==0) return;
    let source=e.target.closest(".piece");
    if(!source) return;
    e.preventDefault();
    const id=source.dataset.id;
    const doubleTap=!!pendingTap && pendingTap.id===id && performance.now()-pendingTap.at<=300;
    if(pendingTap) {
      const previous=pieces.find(p=>p.id===pendingTap.id);
      clearTap();
      if(!doubleTap) transform(previous,false);
      if(!active) return;
      source=$("game-root").querySelector('.piece[data-id="'+id+'"]');
      if(!source) return;
    }
    const p=pieces.find(p=>p.id===source.dataset.id), rect=source.getBoundingClientRect(), size=Number(source.dataset.cell);
    gesture={piece:p,source,pointerId:e.pointerId,x:e.clientX,y:e.clientY,anchorX:(e.clientX-rect.left)/size,anchorY:(e.clientY-rect.top)/size,dragging:false,touch:e.pointerType==="touch",doubleTap};
    source.setPointerCapture(e.pointerId);
  }
  function preview(e) {
    const g=gesture;
    if(!g || e.pointerId!==g.pointerId) return;
    e.preventDefault();
    if(!g.dragging && Math.hypot(e.clientX-g.x,e.clientY-g.y)<8) return;
    if(!g.dragging) {
      clearTap(); g.dragging=true; g.source.classList.add("drag-source");
      g.ghost=pieceElement(g.piece,cell,false); g.ghost.classList.add("drag-ghost"); document.body.appendChild(g.ghost);
    }
    const lift=g.touch ? Math.min(48,cell*1.4) : 0;
    const left=e.clientX-g.anchorX*cell, top=e.clientY-g.anchorY*cell-lift;
    Object.assign(g.ghost.style,{left:left+"px",top:top+"px"});
    const rect=$("board").getBoundingClientRect();
    g.pos={x:Math.round((left-rect.left)/cell),y:Math.round((top-rect.top)/cell)};
    g.valid=fits(g.piece,g.piece.cells,g.pos);
    $("board").querySelectorAll(".preview").forEach(el=>el.remove());
    for(const [x,y] of globalCells(g.piece,g.piece.cells,g.pos)) {
      if(x<0||x>=problem.w||y<0||y>=problem.h) continue;
      const el=document.createElement("span"); el.className="preview "+(g.valid?"valid":"invalid");
      Object.assign(el.style,{left:x*cell+"px",top:y*cell+"px",width:cell+"px",height:cell+"px"});
      $("board").appendChild(el);
    }
  }
  function pointerUp(e) {
    const g=gesture;
    if(!g || e.pointerId!==g.pointerId) return;
    e.preventDefault();
    preview(e);
    cancelGesture();
    if(!g.dragging) { if(g.doubleTap) transform(g.piece,true); else tap(g.piece); return; }
    if(g.valid) {
      if(!g.piece.pos || g.piece.pos.x!==g.pos.x || g.piece.pos.y!==g.pos.y) { g.piece.pos=g.pos; moves++; }
      say("配置しました。");
    } else {
      const rect=$("piece-tray").getBoundingClientRect();
      if(e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom && g.piece.pos) {
        g.piece.pos=null; moves++; say("ピースをトレーに戻しました。");
      } else say("そこには置けません。空いている対象マスに合わせてください。");
    }
    render(); finishIfComplete();
  }
  function hint() {
    if(!active || problem.mode==="expert") return;
    clearTap(); cancelGesture();
    const p=pieces.find(p=>!p.pos);
    if(!p) return;
    const cells=problem.solution[p.id], target=new Set(cells.map(([x,y])=>key(x,y)));
    let returned=0;
    for(const other of pieces) {
      if(other!==p && globalCells(other).some(([x,y])=>target.has(key(x,y)))) { other.pos=null; returned++; moves++; }
    }
    p.cells=normalize(cells);
    p.pos={x:Math.min(...cells.map(c=>c[0])),y:Math.min(...cells.map(c=>c[1]))};
    penalty+=30000; moves++;
    say("ヒントで1ピース配置しました。+30秒"+(returned?"（重なったピースはトレーへ戻しました）":""));
    updateTime(); render(); finishIfComplete();
  }
  window.AtamaGame={restart};
  document.addEventListener("DOMContentLoaded",()=>{
    $("player-name").value=read(NAME_KEY)||"";
    $("player-name").addEventListener("input",e=>save(NAME_KEY,e.target.value.slice(0,12)));
    document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>start(button.dataset.mode)));
    $("game-hint").addEventListener("click",hint);
    $("game-giveup").addEventListener("click",home);
    $("result-home").addEventListener("click",home);
    $("result-next").addEventListener("click",()=>{if(problem.mode!=="expert") start(problem.mode,problem);});
    $("result-dialog").addEventListener("cancel",e=>{e.preventDefault();home();});
    const root=$("game-root");
    root.addEventListener("pointerdown",pointerDown);
    root.addEventListener("pointermove",preview);
    root.addEventListener("pointerup",pointerUp);
    root.addEventListener("pointercancel",()=>{clearTap();cancelGesture();});
    root.addEventListener("lostpointercapture",()=>cancelGesture());
    root.addEventListener("contextmenu",e=>e.preventDefault());
    root.addEventListener("keydown",e=>{
      const el=e.target.closest(".piece"); if(!el||!active) return;
      if(e.key==="Enter"||e.key===" ") { e.preventDefault();clearTap();transform(pieces.find(p=>p.id===el.dataset.id),e.shiftKey); }
    });
    const resize=()=>{if(active){clearTap();cancelGesture();render();}};
    window.addEventListener("resize",resize);
    window.visualViewport?.addEventListener("resize",resize);
    window.addEventListener("blur",()=>{clearTap();cancelGesture();});
  });
})();
