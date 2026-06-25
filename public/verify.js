let rawRows = [];

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

function rowLabel(row) {
  return row.sgg ? "자치구" : "서울 전체";
}

function areaName(row) {
  return row.sgg || row.sd || "서울특별시";
}

function render() {
  const day = document.getElementById("day").value;
  const [riskField, risk2Field] = fieldsFor(day);
  const rows = rawRows.filter(row => row && row.sd === "서울특별시");

  document.querySelector("#tbl tbody").innerHTML = rows.map(row => {
    const index = roundIndex(row[riskField]);
    return `<tr>
      <td>${rowLabel(row)}</td>
      <td>${areaName(row)}</td>
      <td>${row[riskField]}</td>
      <td>${row[risk2Field]}</td>
      <td>${index}</td>
      <td>${stageByIndex(index)}</td>
      <td>${row.baseDate || "-"}</td>
    </tr>`;
  }).join("");

  const districtCount = rows.filter(row => row.sgg).length;
  document.getElementById("summary").textContent = `기준: ${day} / 서울 전체 1건 + 자치구 ${districtCount}건`;
}

async function loadData() {
  document.getElementById("summary").textContent = "불러오는 중";
  const json = await fetch("/api/seoul-risk").then(res => res.json());
  rawRows = Array.isArray(json.data) ? json.data.filter(row => row && row.sd === "서울특별시") : [];
  document.getElementById("rawBox").textContent = rawRows.slice(0, 7).map(row => JSON.stringify(row, null, 2)).join("\n\n");
  render();
}

document.getElementById("loadBtn").addEventListener("click", () => loadData().catch(error => {
  document.getElementById("summary").textContent = error.message;
}));
document.getElementById("day").addEventListener("change", render);

loadData().catch(error => {
  document.getElementById("summary").textContent = error.message;
});
