/**
 * OG Image — /api/og?title=...&subtitle=...
 * meta: <meta property="og:image" content="/api/og?title=..." />
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title    = searchParams.get('title')    ?? 'Mimio'
  const subtitle = searchParams.get('subtitle') ?? 'Ergoterapistler için interaktif terapi platformu'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#04070d',
          fontFamily: 'sans-serif',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Radial gradients */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(79,70,229,0.12) 0%, transparent 50%)',
        }} />

        {/* M logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          marginBottom: 40,
          fontSize: 36,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-1px',
        }}>
          M
        </div>

        {/* Title */}
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#f1f5f9',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: '-2px',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 28,
          color: 'rgba(148,163,184,0.85)',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          fontSize: 20,
          color: 'rgba(99,102,241,0.7)',
        }}>
          mimio.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
