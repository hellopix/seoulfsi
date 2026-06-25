const districtNames = ["종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구","노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구","영등포구","동작구","관악구","서초구","강남구","송파구","강동구"];
const aliases = Object.fromEntries(districtNames.flatMap(name => [[name, name], [name.replace("구", ""), name]]));
const colors = { "관심": "#79c7e8", "주의": "#99c43a", "경고": "#f59e0b", "심각": "#ef4444", "없음": "#cbd5e1" };
const messages = {
  "관심": "식중독 발생가능성은 낮지만 예방에 지속적인 관심이 필요합니다.",
  "주의": "식중독 발생가능성이 중간 단계입니다. 조리와 보관에 주의가 필요합니다.",
  "경고": "식중독 발생가능성이 높습니다. 식재료 보관과 조리 위생을 각별히 확인하세요.",
  "심각": "식중독 발생가능성이 매우 높습니다. 의심 증상이 있으면 의료기관 안내를 따르세요.",
  "없음": "표시할 위험도 데이터가 없습니다."
};

let rawRows = [];

const mapLayout = {
  "도봉구": [1, 3],
  "노원구": [1, 5],
  "강북구": [2, 3],
  "성북구": [2, 4],
  "중랑구": [2, 5],
  "은평구": [3, 1],
  "서대문구": [3, 2],
  "종로구": [3, 3],
  "동대문구": [3, 4],
  "마포구": [4, 1],
  "중구": [4, 3],
  "성동구": [4, 4],
  "광진구": [4, 5],
  "강서구": [5, 1],
  "양천구": [5, 2],
  "영등포구": [5, 3],
  "용산구": [5, 4],
  "강동구": [5, 6],
  "구로구": [6, 2],
  "동작구": [6, 3],
  "강남구": [6, 5],
  "송파구": [6, 6],
  "금천구": [7, 2],
  "관악구": [7, 3],
  "서초구": [7, 4]
};

function fieldsFor(day) {
  if (day === "tomorrow") return ["tomorrowRisk", "tomorrowRisk2"];
  if (day === "afterTomorrow") return ["afterTomorrowRisk", "afterTomorrowRisk2"];
  return ["todayRisk", "todayRisk2"];
}

function roundIndex(value) {
  return Math.round(Number(value) * 1000) / 10;
}

function stageByIndex(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "없음";
  if (n < 19.9) return "관심";
  if (n < 42.6) return "주의";
  if (n < 79.3) return "경고";
  return "심각";
}

function selectedDayLabel() {
  return document.getElementById("day").selectedOptions[0].textContent;
}

function itemFromRow(row, district = "서울특별시") {
  const [riskField, risk2Field] = fieldsFor(document.getElementById("day").value);
  const rawValue = row ? row[riskField] : null;
  const index = rawValue == null ? null : roundIndex(rawValue);
  return {
    district,
    rawValue,
    subValue: row ? row[risk2Field] : null,
    index,
    stage: stageByIndex(index),
    row
  };
}

function normalize(rows) {
  return districtNames.map(district => {
    const row = rows.find(item => item.sgg === district || aliases[item.sgg] === district);
    return itemFromRow(row, district);
  });
}

function cityItem(rows) {
  const row = rows.find(item => item && item.sd === "서울특별시" && !item.sgg);
  return itemFromRow(row, "서울특별시");
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} 응답 오류: ${res.status}`);
  return res.json();
}

function setStatus(text) {
  document.getElementById("statusText").textContent = text;
}

function renderCity(item) {
  const card = document.getElementById("cityRisk");
  card.style.borderColor = colors[item.stage] || colors["없음"];
  document.getElementById("cityStage").textContent = `${item.stage} 단계`;
  document.getElementById("cityMessage").textContent = messages[item.stage] || messages["없음"];
  document.getElementById("cityIndex").textContent = item.index ?? "-";
  document.getElementById("cityRaw").textContent = item.rawValue ?? "-";
  document.getElementById("cityDate").textContent = item.row?.baseDate || "-";
}

function renderList(items) {
  document.getElementById("districtList").innerHTML = items.map(item => `
    <div class="district">
      <div>
        <div class="name">${item.district}</div>
        <div class="meta">위험값 ${item.rawValue ?? "-"} · 지수 ${item.index ?? "-"}</div>
      </div>
      <span class="pill" style="background:${colors[item.stage] || colors["없음"]}">${item.stage}</span>
    </div>
  `).join("");
}

function renderMap(items) {
  const mapEl = document.getElementById("map");
  const byDistrict = new Map(items.map(item => [item.district, item]));
  mapEl.innerHTML = "";

  for (const district of districtNames) {
    const item = byDistrict.get(district);
    const [row, col] = mapLayout[district] || [1, 1];
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "mapTile";
    tile.style.gridRow = String(row);
    tile.style.gridColumn = String(col);
    tile.style.background = colors[item?.stage || "없음"];
    tile.innerHTML = `<span class="tileName">${district}</span><span class="tileIndex">${item?.index ?? "-"}</span>`;
    tile.addEventListener("mouseenter", () => showTooltip(item));
    tile.addEventListener("focus", () => showTooltip(item));
    tile.addEventListener("mouseleave", clearTooltip);
    tile.addEventListener("blur", clearTooltip);
    mapEl.appendChild(tile);
  }
}

function showTooltip(item) {
  clearTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = "mapTooltip";
  tooltip.innerHTML = `<strong>${item.district}</strong>단계 ${item.stage} · 지수 ${item.index ?? "-"} · 위험값 ${item.rawValue ?? "-"}`;
  document.getElementById("map").appendChild(tooltip);
}

function clearTooltip() {
  document.querySelector(".mapTooltip")?.remove();
}

function updateSummary(items) {
  const mapped = items.filter(item => item.index != null);
  const avg = mapped.length ? mapped.reduce((sum, item) => sum + item.index, 0) / mapped.length : 0;
  const top = mapped.slice().sort((a, b) => b.index - a.index)[0];
  document.getElementById("countText").textContent = `${mapped.length}개 구`;
  document.getElementById("avgText").textContent = mapped.length ? avg.toFixed(1) : "-";
  document.getElementById("topText").textContent = top ? `${top.district} ${top.index}` : "-";
  document.getElementById("baseText").textContent = `${selectedDayLabel()} 기준`;
}

function renderFromRows() {
  const city = cityItem(rawRows);
  const items = normalize(rawRows);
  renderCity(city);
  renderList(items);
  renderMap(items);
  updateSummary(items);
}

async function render() {
  setStatus("불러오는 중");
  const riskJson = await fetchJson("/api/seoul-risk");
  rawRows = Array.isArray(riskJson.data) ? riskJson.data : [];
  renderFromRows();
  setStatus("완료");
}

document.getElementById("refreshBtn").addEventListener("click", () => render().catch(error => setStatus(error.message)));
document.getElementById("day").addEventListener("change", () => {
  renderFromRows();
  if (rawRows.length) render().catch(error => setStatus(error.message));
});

render().catch(error => setStatus(error.message));
