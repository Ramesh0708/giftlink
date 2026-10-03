function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function shareCardHtml({ origin, id, list }) {
  const recipient = list?.recipient?.trim() || 'someone lovely'
  const occasion = list?.occasion?.trim() || 'gifts'
  const title = `GiftLink — ${occasion} for ${recipient}`
  const description =
    list?.message?.trim() ||
    'Pick a gift so nobody has to guess — and two people don’t buy the same thing.'
  const image = `${origin}/og.jpg`
  const viewUrl = id ? `${origin}/w/${id}` : `${origin}/`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="GiftLink" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(viewUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="image_src" href="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(viewUrl)}" />
</head>
<body style="font-family:sans-serif;background:#f3eadc;color:#2b1810;padding:40px;text-align:center">
  <p>Opening the GiftLink for ${escapeHtml(recipient)}…</p>
  <p><a href="${escapeHtml(viewUrl)}">Open list</a></p>
</body>
</html>`
}
