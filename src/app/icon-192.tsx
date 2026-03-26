import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
          borderRadius: 40,
        }}>
        <span style={{ fontSize: 80, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>
          Mi
        </span>
      </div>
    ),
    { ...size }
  );
}
