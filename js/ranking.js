(() => {
  "use strict";
  const config = window.GAME_CONFIG.ranking;
  let generation = 0;
  async function request(query = "", options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(config.supabaseUrl + "/rest/v1/" + encodeURIComponent(config.table) + query, {
        ...options, signal: controller.signal,
        headers: {
          apikey: config.supabaseAnonKey,
          // Publishable Key はJWTではないためBearerトークンには使わない。
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        }
      });
      if (!response.ok) throw new Error("Ranking request failed: " + response.status);
      return options.method === "POST" ? null : await response.json();
    } finally { clearTimeout(timeout); }
  }
  function orderQuery() {
    return "score." + config.sortDirection + "," + config.secondaryColumn + "." + config.secondaryDirection + ",created_at.asc";
  }
  async function load() {
    if (!config.enabled) return;
    const root = document.getElementById("ranking-list"), note = document.getElementById("ranking-note");
    if (!root || !note) return;
    const current = ++generation;
    note.textContent = "読み込み中…";
    try {
      const query = new URLSearchParams({select:"name,score,moves,created_at",order:orderQuery(),limit:String(config.limit)});
      const rows = await request("?" + query);
      if (current !== generation) return;
      root.replaceChildren();
      rows.forEach((row,index) => {
        const el = document.createElement("div");
        el.className = "ranking-row";
        const rank = document.createElement("span"); rank.className = "ranking-rank"; rank.textContent = index+1;
        const name = document.createElement("span"); name.className = "ranking-name"; name.textContent = row.name || "No Name";
        const record = document.createElement("div"); record.className = "ranking-score";
        const score = document.createElement("span"); score.textContent = Number(row.score).toFixed(2)+"秒";
        const moves = document.createElement("small"); moves.textContent = Number(row.moves)+"操作";
        record.append(score,moves); el.append(rank,name,record); root.appendChild(el);
      });
      note.textContent = rows.length ? "" : "まだ記録がありません。最初のクリアを目指そう。";
    } catch {
      if (current === generation) note.textContent = "ランキングを取得できませんでした。「更新」から再取得できます。";
    }
  }
  async function submit({name,score,secondaryValue}) {
    if (!config.enabled) return;
    if (!Number.isFinite(score) || score < 0 || !Number.isInteger(secondaryValue) || secondaryValue < 0) throw new Error("Invalid score");
    await request("", {method:"POST",body:JSON.stringify({
      name: Array.from(String(name).trim() || "No Name").slice(0,12).join(""),
      score, [config.secondaryColumn]:secondaryValue
    })});
    await load();
  }
  window.AtamaRanking = {load,submit};
})();

