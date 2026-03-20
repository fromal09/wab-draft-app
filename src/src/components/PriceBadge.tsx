import { CSSProperties } from 'react'

interface Props { price: number; size?: 'sm' | 'md' | 'lg' }

export function PriceBadge({ price, size = 'md' }: Props) {
  const rounded = Math.round(price)
  const label = price >= 0 ? `$${rounded}` : `-$${Math.abs(rounded)}`

  const sizes = {
    sm: { width: 38, height: 28, fontSize: 11 },
    md: { width: 46, height: 36, fontSize: 13 },
    lg: { width: 64, height: 48, fontSize: 18 },
  }[size]

  let style: CSSProperties
  if (price >= 50) {
    style = {
      background: 'linear-gradient(90deg,#b7791f 0%,#f5a623 40%,#fcd34d 60%,#b7791f 100%)',
      backgroundSize: '200% auto',
      animation: 'shimmer 3s linear infinite',
      color: '#1c1408',
      border: 'none',
      fontWeight: 800,
    }
  } else if (price >= 35) {
    style = { background: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)', color: '#1e293b', border: 'none', fontWeight: 800 }
  } else if (price >= 25) {
    style = { background: 'linear-gradient(135deg,#064e3b,#065f46)', color: '#34d399', border: '1px solid #059669', fontWeight: 700 }
  } else if (price >= 15) {
    style = { background: '#0f172a', color: '#60a5fa', border: '1px solid #1e3a5f', fontWeight: 600 }
  } else if (price >= 5) {
    style = { background: '#0a0f1a', color: '#64748b', border: '1px solid #1e293b', fontWeight: 500 }
  } else if (price >= 1) {
    style = { background: '#080d14', color: '#475569', border: '1px solid #1a2438', fontWeight: 400 }
  } else {
    style = { background: '#120a0a', color: '#7f1d1d', border: '1px solid #450a0a44', fontWeight: 400 }
  }

  return (
    <div style={{
      ...sizes, ...style,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6, flexShrink: 0,
      fontFamily: "'Space Mono', monospace",
    }}>
      {label}
    </div>
  )
}
