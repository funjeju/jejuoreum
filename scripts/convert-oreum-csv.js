/**
 * 정부 오름 CSV → 관리자 bulk import CSV 변환 스크립트
 * 사용법: node scripts/convert-oreum-csv.js
 */

const fs = require("fs");
const path = require("path");

const INPUT  = "C:\\Users\\funjeju\\Desktop\\google drive_안방\\미션북\\오름현황(20220214).csv";
const OUTPUT = path.join(__dirname, "../public/oreums-import.csv");

function getRegion(city, eup, myeon, dong) {
  if (city.includes("제주시")) {
    if (eup.includes("구좌")) return "east";
    if (eup.includes("조천")) return "east";
    if (eup.includes("애월")) return "west";
    if (eup.includes("한림")) return "west";
    if (myeon.includes("한경")) return "west";
    // 도심 (동 지역)
    return "north";
  }
  if (city.includes("서귀포")) {
    if (eup.includes("성산")) return "east";
    if (eup.includes("남원")) return "south";
    if (eup.includes("대정")) return "west";
    if (myeon.includes("표선")) return "south";
    if (myeon.includes("안덕")) return "south";
    return "south";
  }
  return "central";
}

function makeSlug(name, seen) {
  // 이름의 공백 제거, 특수문자 하이픈으로
  let slug = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[*]/g, "")
    .replace(/[()（）]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (seen.has(slug)) {
    let i = 2;
    while (seen.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }
  seen.add(slug);
  return slug;
}

function parseElevation(raw) {
  if (!raw) return "";
  const n = parseFloat(raw.replace(/[,\s]/g, "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? "" : n;
}

// 파일 읽기
const raw = fs.readFileSync(INPUT, "utf8");
const lines = raw.split(/\r?\n/);

// Row 0 = 제목, Row 1 = 컬럼헤더, Row 2+ = 데이터
const dataLines = lines.slice(2).filter((l) => l.trim());

const headers = ["slug", "nameKo", "region", "elevationM", "prominenceM", "address"];
const outputRows = [headers.join(",")];
const seen = new Set();

for (const line of dataLines) {
  // CSV 파싱 (따옴표 처리)
  const cols = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  cols.push(cur.trim());

  if (cols.length < 10) continue;

  const [rank, name, city, eup, myeon, dong, ri, address, prominence, elevation] = cols;
  if (!rank || !name || isNaN(Number(rank.trim()))) continue;

  const cleanName   = name.replace(/\s+/g, " ").trim();
  const slug        = makeSlug(cleanName, seen);
  const region      = getRegion(city, eup, myeon, dong);
  const elevM       = parseElevation(elevation);
  const promM       = parseElevation(prominence);
  const addr        = address.replace(/,/g, " ").trim();

  const row = [
    `"${slug}"`,
    `"${cleanName}"`,
    region,
    elevM,
    promM,
    `"${addr}"`,
  ];
  outputRows.push(row.join(","));
}

fs.writeFileSync(OUTPUT, outputRows.join("\n"), "utf8");
console.log(`✅ ${outputRows.length - 1}개 오름 변환 완료 → ${OUTPUT}`);
