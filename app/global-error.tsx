"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hant">
      <body style={{ background: "#FAF6F1", color: "#2C2417" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>系統錯誤</h1>
            <p style={{ marginTop: "0.5rem", fontSize: "1.125rem", color: "#6B5E4F" }}>
              發生了非預期的錯誤，請稍後再試
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "#2E7D68",
                paddingLeft: "1.25rem",
                paddingRight: "1.25rem",
                paddingTop: "0.625rem",
                paddingBottom: "0.625rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              重新整理
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
