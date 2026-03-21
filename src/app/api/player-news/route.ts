import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ items: [] })

  try {
    const res = await fetch('https://www.rotowire.com/rss/news.php?sport=MLB', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ items: [] })
    const xml = await res.text()

    // Normalize name for matching — strip diacritics, lowercase
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const nameParts = norm(name).split(' ').filter(p => p.length > 2)

    const items: { title: string; description: string; pubDate: string }[] = []
    const itemRe = /<item>([\s\S]*?)<\/item>/g
    let m: RegExpExecArray | null

    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1]
      const title       = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
                       ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
      const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
                       ?? block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
      const pubDate     = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''

      // Match if the title contains the player name (all significant parts)
      const normTitle = norm(title)
      const matches = nameParts.every(part => normTitle.includes(part))
      if (matches && (title || description)) {
        items.push({ title, description, pubDate })
        if (items.length >= 5) break
      }
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
