const STORAGE_KEY = "datsuben_records_v1";
const POINTS_KEY = "datsuben_points_v1";
const COMMENTS_KEY = "datsuben_comments_v1";

const recipes = [
  {id:"egg",name:"ふわふわ卵丼",emoji:"🍳",time:"約10分",level:"初心者向け",tags:["quick","easy","rice"],description:"卵があれば作れる、やさしい味のどんぶり。",ingredients:["ごはん 1杯","卵 2個","めんつゆ 小さじ2","水 大さじ2","お好みでねぎ"],steps:["卵をボウルに割り、めんつゆと水を混ぜる。","フライパンに卵液を入れ、弱めの中火でゆっくり混ぜる。","半熟になったら火を止め、ごはんにのせて完成！"]},
  {id:"tuna",name:"ツナマヨおにぎり",emoji:"🍙",time:"約8分",level:"初心者向け",tags:["quick","easy","rice"],description:"身近な材料で作れる定番おにぎり。",ingredients:["ごはん 1杯分","ツナ缶 1/2缶","マヨネーズ 大さじ1","塩 少々","のり"],steps:["ツナの油を軽く切り、マヨネーズと混ぜる。","ごはんの中央にツナマヨを入れる。","好きな形に握り、のりを巻いたら完成！"]},
  {id:"pasta",name:"簡単ツナパスタ",emoji:"🍝",time:"約15分",level:"かんたん",tags:["quick","easy"],description:"ツナ缶を使った、手軽なパスタ。",ingredients:["パスタ 100g","ツナ缶 1/2缶","めんつゆ 大さじ1","バター 5g","刻みのり"],steps:["パスタを袋の表示時間どおりにゆでる。","湯を切り、ツナ・めんつゆ・バターを混ぜる。","お皿に盛り、刻みのりをのせて完成！"]},
  {id:"friedrice",name:"野菜たっぷりチャーハン",emoji:"🥘",time:"約15分",level:"かんたん",tags:["quick","rice"],description:"冷蔵庫にある野菜を使って作ってみよう。",ingredients:["ごはん 1杯","卵 1個","ミックスベジタブル 適量","しょうゆ 小さじ1","油 少々"],steps:["フライパンに油を熱し、溶き卵を入れる。","ごはんと野菜を加えて炒める。","しょうゆで味を整えたら完成！"]},
  {id:"salad",name:"彩り野菜サラダ",emoji:"🥗",time:"約5分",level:"初心者向け",tags:["quick","easy"],description:"切って盛り付けるだけの簡単サラダ。",ingredients:["レタス 適量","ミニトマト 3個","きゅうり 1/3本","好きなドレッシング"],steps:["野菜をよく洗う。","食べやすい大きさに切る。","お皿に盛り付け、ドレッシングをかける。"]},
  {id:"toast",name:"チーズトースト",emoji:"🍞",time:"約7分",level:"初心者向け",tags:["quick","easy"],description:"朝ごはんにもぴったりの簡単メニュー。",ingredients:["食パン 1枚","スライスチーズ 1枚","ケチャップ 適量","コーン 適量"],steps:["食パンにケチャップを薄く塗る。","チーズとコーンをのせる。","トースターで焼き色がつくまで焼く。"]}
];

let records = load(STORAGE_KEY, []);
let points = load(POINTS_KEY, 0);
let comments = load(COMMENTS_KEY, {});
let activeFilter = "all";
let toastTimer;

function load(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  localStorage.setItem(POINTS_KEY, JSON.stringify(points));
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}
function dateKey(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,"0"), d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function startOfWeek(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function countFor(list, type) { return list.filter(item => item.type === type).length; }

function renderDashboard() {
  const today = dateKey();
  const todayRecords = records.filter(item => item.date === today);
  const dailyLimitReached = todayRecords.length >= 3;

  // 朝・昼・晩の3食分として、2種類の記録ボタンを合計3回までに制限
  document.querySelectorAll(".record-option").forEach(button => {
    button.disabled = dailyLimitReached;
    button.classList.toggle("is-disabled", dailyLimitReached);
    button.setAttribute("aria-disabled", String(dailyLimitReached));
  });
  document.getElementById("recordFeedback").textContent = dailyLimitReached
    ? "今日は3食分の記録が完了しました！また明日記録できます。"
    : `今日あと${3 - todayRecords.length}回記録できます。`;
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+6);
  const weekRecords = records.filter(item => {
    const d = new Date(item.date + "T00:00:00");
    return d >= weekStart && d <= weekEnd;
  });
  const homeToday = countFor(todayRecords,"homemade");
  const bentoToday = countFor(todayRecords,"bento");
  const homeWeek = countFor(weekRecords,"homemade");
  const bentoWeek = countFor(weekRecords,"bento");
  const weekPoints = homeWeek * 10;
  const totalMeals = homeWeek + bentoWeek;
  const rate = totalMeals ? Math.round(homeWeek / totalMeals * 100) : 0;

  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("ja-JP",{month:"long",day:"numeric",weekday:"long"}).format(new Date()) + " の記録";
  document.getElementById("todayHome").textContent = homeToday;
  document.getElementById("todayBento").textContent = bentoToday;
  document.getElementById("weekHome").innerHTML = `${homeWeek}<span>回</span>`;
  document.getElementById("weekBento").innerHTML = `${bentoWeek}<span>回</span>`;
  document.getElementById("weekPoints").innerHTML = `${weekPoints}<span> pt</span>`;
  document.getElementById("homeRate").textContent = rate + "%";
  document.getElementById("homeBar").style.width = rate + "%";
  document.getElementById("totalPoints").textContent = points;
  document.getElementById("weekLabel").textContent = `${weekStart.getMonth()+1}/${weekStart.getDate()} 〜 ${weekEnd.getMonth()+1}/${weekEnd.getDate()}`;

  const encouragement = homeToday > 0 ? "今日も自炊できたね！その一歩がすばらしい！🌱" :
    bentoToday > 0 ? "記録できたね！次は簡単な一品から挑戦してみよう。" : "まずは記録するところから始めよう！";
  document.getElementById("encouragement").textContent = encouragement;
  document.getElementById("dailyMessage").textContent = homeToday ? "自炊の記録を確認したよ。今日もナイスチャレンジ！" : "今日も自分のペースでいこう！";
  document.getElementById("weeklyMessage").textContent = totalMeals === 0 ? "まずは1週間、気軽に記録してみよう！" :
    homeWeek > 0 ? `今週は自炊 ${homeWeek} 回！自炊の割合は ${rate}% だったよ。来週も無理なく続けよう！` : "今週は記録できたことが第一歩！来週は簡単なレシピから試してみよう。";
}

document.querySelectorAll(".record-option").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.meal;
    const todayCount = records.filter(item => item.date === dateKey()).length;

    // ボタンの連続クリックや、画面更新前の操作もここで防止
    if (todayCount >= 3) {
      renderDashboard();
      showToast("今日は3食分の記録が完了しています。また明日記録できます！");
      return;
    }

    records.push({date:dateKey(), type, createdAt:Date.now()});
    if (type === "homemade") points += 10;
    save();
    renderDashboard();
    const message = type === "homemade" ? "自炊を記録したよ！NayNayポイント＋10 pt 🎉" : "コンビニ弁当を記録したよ！次の一歩も応援しているよ。";
    document.getElementById("recordFeedback").textContent = message;
    showToast(message);
  });
});

function renderRecipes() {
  const query = document.getElementById("recipeSearch").value.trim().toLowerCase();
  const filtered = recipes.filter(recipe => {
    const matchesFilter = activeFilter === "all" || recipe.tags.includes(activeFilter);
    const haystack = [recipe.name, recipe.description, ...recipe.ingredients].join(" ").toLowerCase();
    return matchesFilter && haystack.includes(query);
  });
  const grid = document.getElementById("recipeGrid");
  grid.innerHTML = filtered.map(recipe => `
    <article class="recipe-card">
      <div class="recipe-visual">${recipe.emoji}<span>${recipe.time}</span></div>
      <div class="recipe-content"><h3>${recipe.name}</h3><p>${recipe.description}</p>
        <div class="recipe-meta"><span>🌱 ${recipe.level}</span><button data-recipe="${recipe.id}">作り方を見る →</button></div>
      </div>
    </article>`).join("");
  document.getElementById("recipeEmpty").hidden = filtered.length !== 0;
  grid.querySelectorAll("[data-recipe]").forEach(button => button.addEventListener("click", () => openRecipe(button.dataset.recipe)));
}
function openRecipe(id) {
  const recipe = recipes.find(item => item.id === id);
  if (!recipe) return;
  const recipeComments = comments[id] || [];
  document.getElementById("recipeDetail").innerHTML = `
    <div class="recipe-detail-emoji">${recipe.emoji}</div>
    <span class="section-kicker">${recipe.time} ・ ${recipe.level}</span>
    <h2>${recipe.name}</h2><p>${recipe.description}</p>
    <h3>材料</h3><ul>${recipe.ingredients.map(item => `<li>${item}</li>`).join("")}</ul>
    <h3>作り方</h3><ol>${recipe.steps.map(item => `<li>${item}</li>`).join("")}</ol>
    <div class="comment-area"><h3>みんなのコメント</h3>
      <ul class="comment-list">${recipeComments.length ? recipeComments.map(c => `<li>${escapeHTML(c)}</li>`).join("") : "<li>まだコメントはありません。最初の感想を投稿してみよう！</li>"}</ul>
      <input id="commentInput" maxlength="100" placeholder="作ってみた感想を書いてね（100文字まで）">
      <button id="commentSubmit" type="button">コメントを投稿</button>
    </div>`;
  document.getElementById("commentSubmit").addEventListener("click", () => {
    const input = document.getElementById("commentInput");
    const value = input.value.trim();
    if (!value) { showToast("コメントを入力してください"); return; }
    comments[id] = comments[id] || [];
    comments[id].push(value);
    save();
    openRecipe(id);
    showToast("コメントを保存しました！");
  });
  document.getElementById("recipeDialog").showModal();
}

// 冷蔵庫の食材からレシピを検索する
function searchRecipesByIngredients() {
  const input = document.getElementById("ingredientInput").value;

  // 入力された食材を分割して整理する
  const userIngredients = input
    .split(/[、,，\s]+/)
    .map(item => item.trim())
    .filter(item => item !== "");

  const message = document.getElementById("ingredientSearchMessage");
  const results = document.getElementById("ingredientResults");

  results.innerHTML = "";

  if (userIngredients.length === 0) {
    message.textContent = "食材を入力してください。";
    return;
  }

  // レシピごとに一致する食材を数える
  const matchedRecipes = recipes.map(recipe => {
    const recipeIngredients = recipe.ingredients.map(item => {
      // 「卵 2個」などから材料名だけを取り出す
      return item
        .replace(/[0-9０-９]+([./／][0-9０-９]+)?/g, "")
        .replace(/(大さじ|小さじ|適量|少々|杯分|杯|個|缶|枚|本|g|ｇ|ml|ｍｌ)/g, "")
        .trim();
    });

    const matched = userIngredients.filter(userItem =>
      recipeIngredients.some(recipeItem =>
        recipeItem.includes(userItem) ||
        userItem.includes(recipeItem)
      )
    );

    const missing = recipe.ingredients.filter(item => {
      const ingredientName = item
        .replace(/[0-9０-９]+([./／][0-9０-９]+)?/g, "")
        .replace(/(大さじ|小さじ|適量|少々|杯分|杯|個|缶|枚|本|g|ｇ|ml|ｍｌ)/g, "")
        .trim();

      return !userIngredients.some(userItem =>
        ingredientName.includes(userItem) ||
        userItem.includes(ingredientName)
      );
    });

    return {
      ...recipe,
      matched,
      missing,
      matchCount: matched.length
    };
  });

  // 一致した食材が多い順に並べる
  const sortedRecipes = matchedRecipes
    .filter(recipe => recipe.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  if (sortedRecipes.length === 0) {
    message.textContent = "入力した食材に合うレシピが見つかりませんでした。";
    return;
  }

  message.textContent = `${sortedRecipes.length}件のレシピが見つかりました！`;

  results.innerHTML = sortedRecipes.map(recipe => `
    <div class="ingredient-result-card">
      <h4>${recipe.emoji} ${recipe.name}</h4>

      <p class="ingredient-match">
        一致した食材：${recipe.matched.join("、")}
      </p>

      <p>
        不足している材料：
        ${recipe.missing.length > 0
          ? recipe.missing.join("、")
          : "なし！"}
      </p>

      <p>調理時間：${recipe.time}</p>

      <button
        type="button"
        data-ingredient-recipe="${recipe.id}"
      >
        作り方を見る
      </button>
    </div>
  `).join("");

  // ボタンを押すと既存のレシピ詳細を開く
  results.querySelectorAll("[data-ingredient-recipe]").forEach(button => {
    button.addEventListener("click", () => {
      openRecipe(button.dataset.ingredientRecipe);
    });
  });
}

// 検索ボタンを押したときに実行
document
  .getElementById("ingredientSearchButton")
  .addEventListener("click", searchRecipesByIngredients);

// Enterキーでも検索できるようにする
document
  .getElementById("ingredientInput")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      searchRecipesByIngredients();
    }
  });

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

document.getElementById("recipeSearch").addEventListener("input", renderRecipes);
document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll(".filter-button").forEach(item => item.classList.toggle("active", item === button));
  renderRecipes();
}));
document.getElementById("dialogClose").addEventListener("click", () => document.getElementById("recipeDialog").close());
document.getElementById("recipeDialog").addEventListener("click", event => {
  if (event.target.id === "recipeDialog") event.currentTarget.close();
});

document.querySelectorAll(".exchange-button").forEach(button => button.addEventListener("click", () => {
  const cost = Number(button.dataset.cost);
  const reward = button.dataset.reward;
  if (points < cost) { showToast(`ポイントが足りません。あと${cost-points} pt必要です。`); return; }
  points -= cost;
  save();
  renderDashboard();
  showToast(`「${reward}」と交換しました！（デモ）`);
}));

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded","false");
}));

renderDashboard();
renderRecipes();
