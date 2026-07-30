import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f6e63 0%, #35b0a0 100%)",
          borderRadius: 100,
        }}>
        <span style={{ fontSize: 220, fontWeight: 900, color: "#fff", letterSpacing: -6 }}>
          Mi
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
