import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ items: [] })

  // Format: "Bobby Witt Jr." -> "Bobby_Witt_Jr."
  const slug = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')

  try {
    const res = await fetch(`https://www.fantasysp.com/rss/mlb/player!${slug}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }, // cache 5 min
    })
    if (!res.ok) return NextResponse.json({ items: [] })
    const xml = await res.text()

    // Parse items from RSS
    const items: { title: string; description: string; pubDate: string; link: string }[] = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const block = match[1]
      const title       = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
                       ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
      const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
                       ?? block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
      const pubDate     = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''
      const link        = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]
                       ?? block.match(/<guid>([\s\S]*?)<\/guid>/)?.[1] ?? ''
      if (title || description) items.push({ title, description, pubDate, link })
      if (items.length >= 5) break
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
