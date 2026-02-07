export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid name parameter' });
    }

    const systemPrompt = `You are a research assistant for Lx.health, a precision supplement streaming platform. Research the given person as a potential Key Opinion Leader (KOL) for biohacking, longevity, health optimization, or health-tech. Return ONLY a JSON object with these fields: name, region (US/Europe/Israel/ROW), tier (S/A/B based on influence), kol_type (Biohacker & Nootropics / Longevity & Healthspan / Health-Tech Founder / Quantified-Self Advocate), country, primary_platform, est_followers (format: "1.2M (YouTube, IG)" — number first, then sources in parentheses, use K for thousands M for millions), content_focus, website, twitter_handle (their X/Twitter handle without @), photo_url (direct URL to a public portrait/headshot image from their official website, Wikipedia, or company page — must be a direct image URL), fit_score (1-10 for Lx.health relevance), why_fit, outreach_hook, notes`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Research this person: ${name}` }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(response.status).json({ error: `API request failed: ${errBody.slice(0, 200)}` });
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
