import { ImageResponse } from "next/og";
import { MBTI_RESULTS, type MbtiType } from "@/lib/quiz/mbtiData";

export const runtime = "edge";

// Tailwind gradient → CSS gradient 매핑
const GRADIENT_MAP: Record<string, [string, string]> = {
  "from-slate-800 to-slate-600":     ["#1e293b", "#475569"],
  "from-blue-900 to-blue-700":       ["#1e3a5f", "#1d4ed8"],
  "from-red-900 to-red-700":         ["#7f1d1d", "#b91c1c"],
  "from-orange-800 to-orange-600":   ["#7c2d12", "#ea580c"],
  "from-purple-900 to-purple-700":   ["#3b0764", "#7e22ce"],
  "from-pink-800 to-pink-600":       ["#831843", "#db2777"],
  "from-emerald-800 to-emerald-600": ["#065f46", "#059669"],
  "from-yellow-700 to-yellow-500":   ["#a16207", "#eab308"],
  "from-gray-800 to-gray-600":       ["#1f2937", "#4b5563"],
  "from-teal-800 to-teal-600":       ["#134e4a", "#0d9488"],
  "from-indigo-800 to-indigo-600":   ["#312e81", "#4f46e5"],
  "from-cyan-800 to-cyan-600":       ["#164e63", "#0891b2"],
  "from-rose-800 to-rose-600":       ["#881337", "#e11d48"],
  "from-violet-800 to-violet-600":   ["#4c1d95", "#7c3aed"],
  "from-amber-700 to-amber-500":     ["#b45309", "#f59e0b"],
  "from-lime-700 to-lime-500":       ["#3f6212", "#84cc16"],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mbtiParam = (searchParams.get("mbti") ?? "ENFJ").toUpperCase() as MbtiType;
  const result = MBTI_RESULTS[mbtiParam];

  if (!result) {
    return new Response("Invalid MBTI type", { status: 400 });
  }

  const [gradFrom, gradTo] = GRADIENT_MAP[result.color] ?? ["#1A4D2E", "#2d7a4f"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        {/* 서브타이틀 */}
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          나를 닮은 오름 MBTI
        </div>

        {/* MBTI 타입 */}
        <div
          style={{
            color: "white",
            fontSize: "160px",
            fontWeight: 900,
            letterSpacing: "0.05em",
            lineHeight: 1,
            marginBottom: "24px",
          }}
        >
          {result.type}
        </div>

        {/* 타이틀 */}
        <div
          style={{
            color: "white",
            fontSize: "48px",
            fontWeight: 700,
            marginBottom: "40px",
          }}
        >
          {result.title}
        </div>

        {/* 구분선 */}
        <div
          style={{
            width: "120px",
            height: "3px",
            backgroundColor: "rgba(255,255,255,0.4)",
            marginBottom: "40px",
            borderRadius: "2px",
          }}
        />

        {/* 추천 오름 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "24px",
            padding: "24px 40px",
            marginBottom: "40px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "28px",
            }}
          >
            추천 오름
          </div>
          <div
            style={{
              color: "white",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            {result.oreumName}
          </div>
        </div>

        {/* 키워드 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "60px",
          }}
        >
          {result.keywords.slice(0, 3).map((kw) => (
            <div
              key={kw}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "100px",
                padding: "10px 24px",
                color: "rgba(255,255,255,0.9)",
                fontSize: "26px",
                fontWeight: 500,
              }}
            >
              #{kw}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "24px",
          }}
        >
          jejuoreum.com/quiz
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
