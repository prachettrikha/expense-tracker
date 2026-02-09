var Anthropic = require('@anthropic-ai/sdk');

var client = new Anthropic();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var rows = req.body && req.body.rows;
  if (!Array.isArray(rows) || rows.length < 2) {
    return res.status(400).json({ error: 'Need at least a header row and one data row' });
  }

  // Limit to first 6 rows (header + 5 data rows) to save tokens
  var sample = rows.slice(0, 6);

  var prompt = 'You are a bank CSV format detector. Analyze these CSV rows from a bank statement and identify the column structure.\n\n' +
    'CSV rows (first row is usually headers):\n' +
    sample.map(function (row, i) { return 'Row ' + i + ': ' + JSON.stringify(row); }).join('\n') + '\n\n' +
    'Determine:\n' +
    '1. Which column index (0-based) contains: date, description/merchant name, amount, debit, credit, category, type/details\n' +
    '2. The date format used (e.g. MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, M/D/YYYY, MM-DD-YYYY)\n' +
    '3. How amounts work: "negative_is_expense" (negative = money spent, positive = income), "positive_is_expense" (positive = money spent), or "separate_columns" (debit and credit are separate columns)\n\n' +
    'Respond with ONLY this JSON, no markdown:\n' +
    '{\n' +
    '  "columns": {\n' +
    '    "date": <index or -1>,\n' +
    '    "description": <index or -1>,\n' +
    '    "amount": <index or -1>,\n' +
    '    "debit": <index or -1>,\n' +
    '    "credit": <index or -1>,\n' +
    '    "category": <index or -1>,\n' +
    '    "type": <index or -1>\n' +
    '  },\n' +
    '  "dateFormat": "<format string>",\n' +
    '  "amountSign": "<negative_is_expense|positive_is_expense|separate_columns>"\n' +
    '}\n\n' +
    'Use -1 for columns that do not exist. "description" is the merchant/payee name column. ' +
    'If there is no single amount column but separate debit/credit columns, set amount to -1 and use debit/credit indices.';

  try {
    var message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
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
    console.error('CSV parse API error:', err);
    return res.status(500).json({
      error: 'CSV format detection failed',
      message: err.message || 'Unknown error'
    });
  }
};
