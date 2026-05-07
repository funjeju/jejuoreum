/**
 * 카카오 Local Search API로 오름 GPS 좌표 채우기
 * 사용법: node scripts/geocode-oreums.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

const KAKAO_KEY = "d5a11678c53a090ce4203d0cf5ce8b5f";
const INPUT     = path.join(__dirname, "../public/oreums-import.csv");
const OUTPUT    = path.join(__dirname, "../public/oreums-import.csv");

function kakaoSearch(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: "dapi.kakao.com",
      path:     `/v2/local/search/keyword.json?query=${encoded}&size=1`,
      method:   "GET",
      headers:  { Authorization: `KakaoAK ${KAKAO_KEY}` },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseCSV(text) {
  const lines  = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const rows   = lines.slice(1).map((line) => {
    const cols = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += c;
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
  return { header, rows };
}

function toCSVLine(row, header) {
  return header
    .map((h) => {
      const v = row[h] ?? "";
      return String(v).includes(",") || String(v).includes('"') ? `"${v}"` : v;
    })
    .join(",");
}

async function main() {
  const text         = fs.readFileSync(INPUT, "utf8");
  let { header, rows } = parseCSV(text);

  // lat/lng 컬럼 추가 (없으면)
  if (!header.includes("lat"))  header.push("lat");
  if (!header.includes("lng"))  header.push("lng");

  let found = 0, notFound = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // 이미 좌표 있으면 스킵
    if (row.lat && row.lng && row.lat !== "" && row.lng !== "") {
      found++;
      continue;
    }

    const name = row.nameKo;
    process.stdout.write(`[${i + 1}/${rows.length}] ${name} ... `);

    try {
      // 1차: "제주 <오름명>" 으로 검색 후 오름 카테고리 우선 선택
      let result = await kakaoSearch(`제주 ${name}`);
      let place  = result.documents?.find(
        (d) => d.category_name?.includes("오름") || d.place_name === name
      ) || result.documents?.[0];

      // 2차: 이름만으로 검색
      if (!place?.x) {
        result = await kakaoSearch(name);
        place  = result.documents?.find(
          (d) => d.category_name?.includes("오름") || d.place_name === name
        ) || result.documents?.[0];
      }

      if (place && place.x && place.y) {
        row.lat = Number(place.y).toFixed(6);
        row.lng = Number(place.x).toFixed(6);
        process.stdout.write(`✓ (${row.lat}, ${row.lng})\n`);
        found++;
      } else {
        process.stdout.write(`✗ 못 찾음\n`);
        row.lat = "";
        row.lng = "";
        notFound++;
      }
    } catch (e) {
      process.stdout.write(`에러: ${e.message}\n`);
      row.lat = "";
      row.lng = "";
      notFound++;
    }

    // API 호출 간격 (rate limit 방지)
    await sleep(120);
  }

  // CSV 저장
  const newHeader = header.filter((h) => h !== "lat" && h !== "lng");
  newHeader.push("lat", "lng");

  const lines = [
    newHeader.join(","),
    ...rows.map((r) => toCSVLine(r, newHeader)),
  ];
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");

  console.log(`\n✅ 완료: 좌표 찾음 ${found}개, 못 찾음 ${notFound}개`);
  console.log(`📄 저장: ${OUTPUT}`);
}

main().catch(console.error);
