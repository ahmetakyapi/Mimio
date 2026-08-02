import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2b62f5 0%, #17c2e0 100%)",
          borderRadius: 40,
        }}>
        <span style={{ fontSize: 80, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>
          Mi
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
