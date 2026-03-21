import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ items: [] })

  try {
    const query = encodeURIComponent(`${name} (site:nbcsports.com/fantasy/baseball OR site:cbssports.com/fantasy/baseball)`)
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

      const title = stripTags(decodeHtml(rawTitle)).replace(/\s*-\s*[^-]{2,40}$/, '').trim()
      if (!title) continue

      const normTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 60)
      if (seenTitles.has(normTitle)) continue
      seenTitles.add(normTitle)

      items.push({ title, pubDate, source, link })
      if (items.length >= 20) break
    }

    // Filter: all significant name parts must appear in headline (diacritic-aware, suffix-optional)
    const normStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const baseName = name.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '').trim()
    const nameParts = normStr(baseName).split(' ').filter(p => p.length > 1)
    const filtered = items.filter(item => {
      const nt = normStr(item.title)
      return nameParts.every(p => nt.includes(p))
    })
    filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    return NextResponse.json({ items: filtered.slice(0, 5) })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
