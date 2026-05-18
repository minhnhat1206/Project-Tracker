export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_EXEC_URL
  if (!GAS_URL) {
    return res.status(500).json({ success: false, error: 'GAS_EXEC_URL not configured in Vercel environment variables' })
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { action, payload = {} } = body || {}
    if (!action) return res.status(400).json({ success: false, error: 'Missing action' })

    const url = new URL(GAS_URL)
    url.searchParams.set('action', action)
    if (payload && Object.keys(payload).length > 0) {
      url.searchParams.set('payload', JSON.stringify(payload))
    }

    const gasRes = await fetch(url.toString(), { redirect: 'follow' })
    const text = await gasRes.text()
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send(text)
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
