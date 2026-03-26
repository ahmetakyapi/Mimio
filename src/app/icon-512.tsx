import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
          borderRadius: 100,
        }}>
        <span style={{ fontSize: 220, fontWeight: 900, color: "#fff", letterSpacing: -6 }}>
          Mi
        </span>
      </div>
    ),
    { ...size }
  );
}
