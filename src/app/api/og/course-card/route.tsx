import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const oreums = (searchParams.get("oreums") ?? "").split(",").filter(Boolean).slice(0, 5);
  const km = searchParams.get("km") ?? "";
  const count = oreums.length || parseInt(searchParams.get("count") ?? "0");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(145deg, #1A4D2E, #2d6a45)",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        {/* 로고 영역 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "48px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🏔
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "28px", letterSpacing: "0.1em" }}>
            JEJU OREUM
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "28px", marginBottom: "16px" }}>
          오늘의 오름 코스
        </div>
        <div style={{ color: "white", fontSize: "68px", fontWeight: 900, lineHeight: 1.1, marginBottom: "48px" }}>
          {count}개 오름<br />탐방 코스
        </div>

        {/* 오름 리스트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
          {oreums.map((name, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "20px 28px",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "24px",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ color: "white", fontSize: "36px", fontWeight: 700 }}>
                {name}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "32px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "28px" }}>
            jejuoreum.com
          </div>
          {km && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: "100px",
                padding: "10px 28px",
                color: "white",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              총 {km}km
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
