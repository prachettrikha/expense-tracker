var Anthropic = require('@anthropic-ai/sdk');

var client = new Anthropic();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var categories = req.body && req.body.categories;
  var transactions = req.body && req.body.transactions;

  if (!Array.isArray(categories) || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (transactions.length === 0 || transactions.length > 10) {
    return res.status(400).json({ error: 'Batch size must be 1-10' });
  }

  var prompt = 'You are a financial transaction categorizer. ' +
    'For each bank transaction description, provide:\n' +
    '1. The best category from the list\n' +
    '2. A clean, human-readable title (e.g., "DOORDASH*DASHPASS 800-555" becomes "DoorDash DashPass")\n\n' +
    'Available categories: ' + categories.join(', ') + '\n\n' +
    'Transactions:\n' +
    transactions.map(function (t, i) { return (i + 1) + '. ' + t; }).join('\n') + '\n\n' +
    'Respond with ONLY a JSON array, no markdown formatting:\n' +
    '[{"index": 1, "category": "Food & Dining", "title": "DoorDash"}, ...]\n' +
    'Use ONLY categories from the list. If unsure, use "Other".';

  try {
    var message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    var text = message.content[0].text;

    // Strip markdown code fences if present
    var fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    }

    var result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(500).json({
      error: 'AI categorization failed',
      message: err.message || 'Unknown error'
    });
  }
};
