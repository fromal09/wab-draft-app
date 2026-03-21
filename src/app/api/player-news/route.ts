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

    const decodeHtml = (s: string) => s
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim()

    const items: { title: string; pubDate: string; source: string; link: string }[] = []
    const seenTitles = new Set<string>()
    const itemRe = /<item>([\s\S]*?)<\/item>/g
    let m: RegExpExecArray | null

    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1]
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
      const pubDate  = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''
      const source   = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? ''

      // Google News puts the real URL in <link> after a comment node — grab it
      const link = block.match(/<link\s*\/?>([\s\S]*?)<\/link>/)?.[1]?.trim()
               ?? block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]?.trim()
               ?? ''

      const title = stripTags(decodeHtml(rawTitle)).trim()
      if (!title) continue

      const normTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 60)
      if (seenTitles.has(normTitle)) continue
      seenTitles.add(normTitle)

      items.push({ title, pubDate, source, link })
      if (items.length >= 5) break
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
