import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ description: '' })

  try {
    // Google News URLs contain the real URL base64-encoded in the path
    // Pattern: /rss/articles/BASE64 — decode to get real URL
    let targetUrl = url
    const gnMatch = url.match(/news\.google\.com\/rss\/articles\/([A-Za-z0-9_-]+)/)
    if (gnMatch) {
      try {
        // The article ID can be decoded — try following the redirect directly
        const redirectRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        })
        targetUrl = redirectRes.url
      } catch {}
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return NextResponse.json({ description: '' })
    // Only read first 10KB — meta tags are always in the head
    const reader = res.body?.getReader()
    let html = ''
    if (reader) {
      let bytes = 0
      while (bytes < 10000) {
        const { done, value } = await reader.read()
        if (done) break
        html += new TextDecoder().decode(value)
        bytes += value?.length ?? 0
      }
      reader.cancel()
    }

    const desc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+name=["']description["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{10,})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{10,})["'][^>]+property=["']og:description["']/i)?.[1] ??
      ''

    return NextResponse.json({ description: desc.trim() })
  } catch {
    return NextResponse.json({ description: '' })
  }
}
