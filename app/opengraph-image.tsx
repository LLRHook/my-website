import { ImageResponse } from "next/og";

export const alt = "Victor Ivanov — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#050505",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f5f5f5",
            letterSpacing: "-2px",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          Victor Ivanov
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a3a3a3",
            marginTop: "20px",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
          }}
        >
          Software Engineer
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#737373",
            marginTop: "40px",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          Full-stack development · React · Next.js · TypeScript
        </div>
      </div>
    ),
    { ...size }
  );
}
