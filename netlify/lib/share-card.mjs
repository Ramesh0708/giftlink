function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function summarize(list) {
  const who = list.recipient?.trim()
  const occasion = list.occasion?.trim()
  const titles = (list.items || []).map((item) => item.title?.trim()).filter(Boolean)
  const shown = titles.slice(0, 3).join(', ')
  const more = titles.length > 3 ? ` +${titles.length - 3} more` : ''
  const gifts = shown ? ` Gifts: ${shown}${more}.` : ''
  const lead = who
    ? occasion
      ? `${occasion} gifts for ${who}.`
      : `Gifts for ${who}.`
    : occasion
      ? `${occasion} wishlist on GiftLink.`
      : 'A GiftLink wishlist.'
  const note = list.message?.trim()
  return `${lead}${gifts}${note ? ` ${note}` : ''}`.replace(/\s+/g, ' ').trim().slice(0, 280)
}

export function shareTitle(list) {
  const who = list?.recipient?.trim()
  const occasion = list?.occasion?.trim()
  if (who && occasion) return `${occasion} gifts for ${who}`
  if (who) return `Gifts for ${who}`
  if (occasion) return `${occasion} wishlist`
  return 'A GiftLink wishlist'
}

export function shareCardHtml({ origin, id, list }) {
  if (!list) {
    const title = 'List not found'
    const description = "This GiftLink doesn't exist, or it hasn't been shared yet."
    const home = `${origin}/`
    return {
      status: 404,
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} · GiftLink</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="noindex" />
  <meta property="og:site_name" content="GiftLink" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(home)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(home)}" />
</head>
<body style="font-family:sans-serif;background:#f3eadc;color:#2b1810;padding:40px;text-align:center">
  <h1>${title}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(home)}">Go to GiftLink</a></p>
</body>
</html>`,
    }
  }

  const title = shareTitle(list)
  const description = summarize(list)
  const image = `${origin}/api/og/${encodeURIComponent(id)}`
  const pageUrl = `${origin}/s/${id}`
  const viewUrl = `${origin}/w/${id}`
  const who = list.recipient?.trim() || 'this wishlist'

  return {
    status: 200,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} · GiftLink</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />
  <meta property="og:site_name" content="GiftLink" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="image_src" href="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(viewUrl)}" />
</head>
<body style="font-family:sans-serif;background:#f3eadc;color:#2b1810;padding:40px;text-align:center">
  <p>Opening gifts for ${escapeHtml(who)}…</p>
  <p><a href="${escapeHtml(viewUrl)}">Open list</a></p>
</body>
</html>`,
  }
}
