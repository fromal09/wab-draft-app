import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ items: [] })

  try {
    const query = encodeURIComponent(`${name} MLB baseball`)
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ items: [] })
    const xml = await res.text()

    const items: { title: string; description: string; pubDate: string; source: string }[] = []
    const itemRe = /<item>([\s\S]*?)<\/item>/g
    let m: RegExpExecArray | null

    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1]
      const title   = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<[^>]+>/g, '') ?? ''
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''
      const source  = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? ''
      const desc    = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''

      if (title) items.push({ title, description: desc, pubDate, source })
      if (items.length >= 5) break
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
