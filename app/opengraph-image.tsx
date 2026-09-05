import { ImageResponse } from "next/og";

export const alt = "Victor Ivanov — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f2e9",
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
            color: "#303c32",
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
            color: "#657e62",
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
            color: "#6f7567",
            marginTop: "40px",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          A personal workspace. Software, projects, and a sleeping cat.
        </div>
      </div>
    ),
    { ...size }
  );
}
