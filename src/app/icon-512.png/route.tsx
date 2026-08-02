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
          background: "linear-gradient(135deg, #2b62f5 0%, #17c2e0 100%)",
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
