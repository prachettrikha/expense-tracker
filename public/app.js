
// ─── Data & State ────────────────────────────────────────────────
const DEFAULTS = [
  { name: "Food & Dining",   color: "#f97316", icon: "🍔" },
  { name: "Shopping",        color: "#a855f7", icon: "🛍️" },
  { name: "Subscriptions",   color: "#3b82f6", icon: "📺" },
  { name: "Transportation",  color: "#10b981", icon: "🚗" }
];

const COLORS = ["#f97316","#ef4444","#a855f7","#3b82f6","#10b981","#f59e0b","#14b8a6","#ec4899","#6366f1","#8b5cf6"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const CAT_SVG = {
  "Food & Dining": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/></svg>`,
  "Shopping": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  "Subscriptions": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>`,
  "Transportation": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 9h5l2-4h6l3 4h4v7H1z"/><circle cx="6" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>`,
  "Insurance": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>`,
  "Technology": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  "Allowance": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8,14 12,8 16,14"/><line x1="12" y1="8" x2="12" y2="18"/></svg>`,
  "Zelle to Friends": `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  "Other": `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`
};

let categories, expenses;
let curMonth = new Date().getMonth();
let curYear  = new Date().getFullYear();
let activeFilter = "all";
let pickedColor  = COLORS[0];
let searchTerm   = "";
let editingId    = null;
let categoryView = "detailed";

const SIMPLE_GROUPS = {
  "Essentials":  ["Food & Dining", "Shopping", "Transportation"],
  "Lifestyle":   ["Entertainment", "Fitness", "Pets", "Gifts", "Education", "Travel", "Games"],
  "Bills":       ["Subscriptions", "Insurance", "Technology", "Utilities", "Housing"],
  "Transfers":   ["Zelle to Friends", "Allowance"],
  "Other":       ["Other"]
};

// ─── Persistence ─────────────────────────────────────────────────
function load() {
  try {
    categories = JSON.parse(localStorage.getItem("et_categories")) || [...DEFAULTS];
    expenses   = JSON.parse(localStorage.getItem("et_expenses"))   || [];
  } catch { categories = [...DEFAULTS]; expenses = []; }
}
function persist() {
  localStorage.setItem("et_categories", JSON.stringify(categories));
  localStorage.setItem("et_expenses",   JSON.stringify(expenses));
}

// ─── Helpers ─────────────────────────────────────────────────────
function fmt(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function monthExpenses() {
  return expenses.filter(e => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });
}
function catFor(name) { return categories.find(c => c.name === name) || { color:"#9ca3af", icon:"?" }; }
function daysInMonth() { return new Date(curYear, curMonth + 1, 0).getDate(); }
function escHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

// ─── Learned Rules (category corrections) ────────────────────────
const LEARNED_RULES_KEY = 'et_learned_rules';
const GENERIC_PATTERNS = ['payment', 'purchase', 'debit', 'credit', 'transfer', 'pos', 'ach', 'check'];

function loadLearnedRules() {
  try { return JSON.parse(localStorage.getItem(LEARNED_RULES_KEY)) || {}; }
  catch { return {}; }
}

function saveLearnedRules(rules) {
  localStorage.setItem(LEARNED_RULES_KEY, JSON.stringify(rules));
}

function extractPattern(desc) {
  if (!desc || !desc.trim()) return null;
  let s = desc.toLowerCase().trim();
  // Strip bank noise
  s = s
    .replace(/(web|ppd)\s*id\s*:?\s*\S+/gi, '')
    .replace(/\s+\d{1,2}[/]\d{1,2}(?:[/]\d{2,4})?\s*/g, ' ')
    .replace(/^(dd|pos|trn|ach|chk)\s*\*?\s*/i, '')
    .replace(/\.(com|org|net|io)\b/gi, '')
    .replace(/\s*#\d+/g, '')
    .replace(/\s*\*\S+/g, '')
    .replace(/\s+[a-z]{2}\s*$/g, '')
    .replace(/\d{4,}/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = s.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return null;
  const pattern = words.length <= 2 ? words.join(' ') : words.slice(0, 2).join(' ');
  if (GENERIC_PATTERNS.includes(pattern)) return null;
  return pattern;
}

function learnCategoryRule(desc, category) {
  const pattern = extractPattern(desc);
  if (!pattern) return;
  const rules = loadLearnedRules();
  const today = new Date().toISOString().slice(0, 10);
  if (rules[pattern]) {
    rules[pattern].category = category;
    rules[pattern].count = (rules[pattern].count || 1) + 1;
    rules[pattern].lastUsed = today;
  } else {
    rules[pattern] = { category: category, count: 1, lastUsed: today };
  }
  saveLearnedRules(rules);
}

function learnedCategory(desc) {
  const pattern = extractPattern(desc);
  if (!pattern) return null;
  const rules = loadLearnedRules();
  // Exact match
  if (rules[pattern] && categories.some(c => c.name === rules[pattern].category)) {
    return rules[pattern].category;
  }
  // Partial match - check if stored pattern is in desc
  const descLower = desc.toLowerCase();
  for (const [storedPattern, data] of Object.entries(rules)) {
    if (descLower.includes(storedPattern) && categories.some(c => c.name === data.category)) {
      return data.category;
    }
  }
  return null;
}

// Combined smart categorization: learned rules first, then pattern matching
function smartCategorize(description) {
  // 1. Check learned rules (user corrections take priority)
  const learned = learnedCategory(description);
  if (learned) return learned;

  // 2. Check AI cache
  const cached = lookupAICache(description);
  if (cached && cached.category) return cached.category;

  // 3. Try pattern-based guessing (guessCategory defined below with imports)
  if (typeof guessCategory === 'function') {
    const guess = guessCategory(description);
    if (guess && categories.some(c => c.name === guess)) return guess;
  }

  // 4. Default to Other
  return "Other";
}

// ─── AI Categorization Service ────────────────────────────────────
var AI_ENABLED = true;
const AI_CACHE_KEY = 'et_ai_cache';
const AI_RATE_KEY = 'et_ai_rate';

// ─── AI Cache System ──────────────────────────────────────────────
function loadAICache() {
  try {
    const cache = JSON.parse(localStorage.getItem(AI_CACHE_KEY)) || {};
    // Prune entries older than 30 days
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    Object.keys(cache).forEach(key => {
      if (cache[key].timestamp < cutoff) delete cache[key];
    });
    return cache;
  } catch { return {}; }
}

function saveAICache(cache) {
  // Limit cache size to 1000 entries
  const entries = Object.entries(cache);
  if (entries.length > 1000) {
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    cache = Object.fromEntries(entries.slice(0, 1000));
  }
  localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
}

function getCacheKey(description) {
  // Normalize: lowercase, replace numbers with N, remove special chars, first 50 chars
  return description.toLowerCase()
    .replace(/\d+/g, 'N')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

function lookupAICache(description) {
  const cache = loadAICache();
  const key = getCacheKey(description);
  if (cache[key] && categories.some(c => c.name === cache[key].category)) {
    return cache[key];
  }
  return null;
}

function updateAICache(description, category, cleanTitle) {
  const cache = loadAICache();
  const key = getCacheKey(description);
  cache[key] = { category, cleanTitle, timestamp: Date.now() };
  saveAICache(cache);
}

// ─── Rate Limiting ────────────────────────────────────────────────
function checkRateLimit() {
  const now = Date.now();
  const data = JSON.parse(localStorage.getItem(AI_RATE_KEY) || '{}');
  const minute = Math.floor(now / 60000);
  if (data.minute !== minute) return true; // new minute, reset
  return data.count < 15; // 15 req/min client-side throttle
}

function incrementRateLimit() {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const data = JSON.parse(localStorage.getItem(AI_RATE_KEY) || '{}');
  if (data.minute !== minute) {
    localStorage.setItem(AI_RATE_KEY, JSON.stringify({ minute, count: 1 }));
  } else {
    localStorage.setItem(AI_RATE_KEY, JSON.stringify({ minute, count: (data.count || 0) + 1 }));
  }
}

// ─── Claude API Call (via serverless function) ───────────────────
async function callCategorizeAPI(categoryNames, descriptions) {
  var response = await fetch('/api/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categories: categoryNames,
      transactions: descriptions
    })
  });
  if (!response.ok) {
    var err = await response.json().catch(function () {
      return { error: 'Unknown error' };
    });
    throw new Error('API error: ' + response.status + ' - ' + (err.error || err.message));
  }
  return response.json();
}

// ─── Batch Categorization ─────────────────────────────────────────
async function aiCategorizeBatch(transactions) {
  if (!AI_ENABLED) return null;
  if (!checkRateLimit()) {
    console.warn('AI rate limit reached, skipping batch');
    return null;
  }

  var categoryNames = categories.map(function (c) { return c.name; });
  var descriptions = transactions.map(function (t) { return t.description; });

  try {
    incrementRateLimit();
    var result = await callCategorizeAPI(categoryNames, descriptions);
    console.log('AI result:', result);

    // Cache successful results
    var resultArray = Array.isArray(result) ? result : result.transactions || [];
    resultArray.forEach(function (r) {
      var idx = r.index - 1;
      if (!transactions[idx]) return;

      // Find matching category (case-insensitive, partial match)
      var matchedCat = categoryNames.find(function (c) {
        return c.toLowerCase() === (r.category || '').toLowerCase();
      });
      if (!matchedCat) {
        // Try partial match
        matchedCat = categoryNames.find(function (c) {
          return c.toLowerCase().indexOf((r.category || '').toLowerCase()) !== -1 ||
            (r.category || '').toLowerCase().indexOf(c.toLowerCase()) !== -1;
        });
      }
      if (!matchedCat) matchedCat = 'Other';

      r.category = matchedCat;
      updateAICache(transactions[idx].description, matchedCat, r.title || null);
    });

    return resultArray;
  } catch (err) {
    console.error('AI categorization failed:', err);
    alert('AI categorization error: ' + err.message);
    return null;
  }
}

// ─── Learned Rules Management ─────────────────────────────────────
function openSettingsModal() {
  // Load learned rules
  const rules = loadLearnedRules();
  const ruleList = document.getElementById("learnedRulesList");

  if (Object.keys(rules).length === 0) {
    ruleList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0;">No learned patterns yet.<br>The app learns from your category changes!</div>';
  } else {
    const sorted = Object.entries(rules).sort((a, b) => (b[1].count || 1) - (a[1].count || 1));
    ruleList.innerHTML = sorted.map(([pattern, data]) =>
      '<div class="rule-item">' +
        '<span class="rule-pattern">"' + escHtml(pattern) + '"</span>' +
        '<span class="rule-arrow">→</span>' +
        '<span class="rule-cat">' + escHtml(data.category) + '</span>' +
        '<button class="rule-delete" data-pattern="' + escHtml(pattern) + '">&times;</button>' +
      '</div>'
    ).join('');
  }

  document.getElementById("settingsOverlay").classList.add("show");
}

function closeSettingsModal() {
  document.getElementById("settingsOverlay").classList.remove("show");
}

function clearAllLearnedRules() {
  if (confirm('Delete all learned patterns? This cannot be undone.')) {
    localStorage.removeItem(LEARNED_RULES_KEY);
    openSettingsModal(); // Refresh the list
  }
}

function titleCase(s) {
  return (s || '').toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function cleanNote(raw, category) {
  if (!raw || !raw.trim()) return category;
  let s = raw.trim();

  // Check AI cache for a clean title first
  const cached = lookupAICache(s);
  if (cached && cached.cleanTitle) return cached.cleanTitle;

  // Keep hand-typed notes as-is (mixed case, no IDs, reasonable length)
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  const uppers  = (s.match(/[A-Z]/g)    || []).length;
  if (letters > 0 && uppers / letters < 0.6 && !/(WEB|PPD)\s*ID/i.test(s) && s.length < 50) return s;

  const viaPayPal = /paypal/i.test(s);
  const wrap = name => viaPayPal ? name + ' (PayPal)' : name;

  // ── Known merchants ──
  if (/doordash/i.test(s))       return wrap(/dashpass/i.test(s) ? 'DoorDash DashPass' : 'DoorDash');
  if (/uber\s*eat/i.test(s))     return wrap('Uber Eats');
  if (/\buber\b/i.test(s))       return wrap('Uber');
  if (/lyft/i.test(s))           return wrap('Lyft');
  if (/netflix/i.test(s))        return wrap('Netflix');
  if (/spotify/i.test(s))        return wrap('Spotify');
  if (/\bhulu\b/i.test(s))       return wrap('Hulu');
  if (/youtube/i.test(s))        return wrap('YouTube');
  if (/amazon\s*prime/i.test(s)) return wrap('Amazon Prime');
  if (/\bamazon\b/i.test(s))     return wrap('Amazon');
  if (/apple\s*tv/i.test(s))     return wrap('Apple TV+');
  if (/apple\s*music/i.test(s))  return wrap('Apple Music');
  if (/apple\s*(inc|icloud|one)/i.test(s)) return wrap('Apple');
  if (/google\s*play/i.test(s))  return wrap('Google Play');
  if (/starbucks/i.test(s))      return wrap('Starbucks');
  if (/mcdonald/i.test(s))       return wrap("McDonald's");
  if (/chipotle/i.test(s))       return wrap('Chipotle');
  if (/chick.?fil/i.test(s))     return wrap('Chick-fil-A');
  if (/taco\s*bell/i.test(s))    return wrap('Taco Bell');
  if (/wendy/i.test(s))          return wrap("Wendy's");
  if (/burger\s*king/i.test(s))  return wrap('Burger King');
  if (/popeye/i.test(s))         return wrap('Popeyes');
  if (/panera/i.test(s))         return wrap('Panera');
  if (/\bsubway\b/i.test(s))     return wrap('Subway');
  if (/grubhub/i.test(s))        return wrap('Grubhub');
  if (/\bwalmart\b/i.test(s))    return wrap('Walmart');
  if (/\btarget\b/i.test(s))     return wrap('Target');
  if (/\bcostco\b/i.test(s))     return wrap('Costco');
  if (/whole\s*foods/i.test(s))  return wrap('Whole Foods');
  if (/trader\s*joe/i.test(s))   return wrap("Trader Joe's");
  if (/\baldi\b/i.test(s))       return wrap('Aldi');
  if (/wegmans/i.test(s))        return wrap('Wegmans');
  if (/instacart/i.test(s))      return wrap('Instacart');
  if (/\bshell\b/i.test(s))      return wrap('Shell');
  if (/\bexxon/i.test(s))        return wrap('Exxon');
  if (/chevron/i.test(s))        return wrap('Chevron');
  if (/\bgeico\b/i.test(s))      return wrap('GEICO');
  if (/allstate/i.test(s))       return wrap('Allstate');
  if (/state\s*farm/i.test(s))   return wrap('State Farm');
  if (/progressive/i.test(s))    return wrap('Progressive');
  if (/\badobe\b/i.test(s))      return wrap('Adobe');
  if (/microsoft/i.test(s))      return wrap('Microsoft');
  if (/plaud/i.test(s))          return wrap('Plaud');

  // ── Structural patterns ──
  if (/payroll/i.test(s)) {
    const words = s.split(/\s+/);
    const idx   = words.findIndex(w => /payroll/i.test(w));
    return titleCase(words.slice(0, idx).join(' ')) + ' \u2014 Payroll';
  }
  if (/tuition/i.test(s)) {
    const company = s.split(/tuition/i)[0].replace(/(WEB|PPD)\s*ID.*/i, '').trim();
    return titleCase(company) + ' \u2014 Tuition';
  }
  if (/foreign\s*exchange|exchange\s*rate/i.test(s)) return 'Foreign Exchange Fee';
  if (/exchg\s*rte|sg\s*dollar/i.test(s)) {
    const m = s.match(/^([A-Za-z][A-Za-z\s]*?)(?:\s+(?:pte|ltd|singapore|sg\b))/i);
    return (m ? titleCase(m[1].trim()) + ' \u2014 ' : '') + 'Currency Exchange';
  }
  if (/zelle/i.test(s)) {
    const m = s.match(/zelle\s+(?:to\s+)?([A-Za-z][A-Za-z\s]*?)(?:\s+on\b|\s*$)/i);
    return m ? 'Zelle to ' + titleCase(m[1].trim()) : 'Zelle Transfer';
  }
  if (viaPayPal) {
    const inner = s.replace(/paypal\s*\w*/gi, '').replace(/INST\s+XFER/gi, '').replace(/(WEB|PPD)\s*ID.*/i, '').trim();
    return inner ? titleCase(inner) + ' (PayPal)' : 'PayPal Transfer';
  }

  // ── General cleanup fallback ──
  let result = s
    .replace(/(WEB|PPD)\s*ID\s*:?\s*\S+/gi, '')
    .replace(/\s+\d{1,2}[/]\d{1,2}(?:\d{2,4})?\s*/g, ' ')
    .replace(/^(DD|POS|TRN|ACH)\s*\*?\s*/i, '')
    .replace(/\.(com|org|net|io)\b/gi, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+[A-Z]{2}\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCase(result) || category;
}

// ─── Render ──────────────────────────────────────────────────────
function render() {
  document.getElementById("monthLabel").textContent = MONTHS[curMonth] + " " + curYear;
  renderMoneySummary();
  renderInsights();
  renderPieChart();
  renderBudgets();
  renderActions();
  renderFilters();
  renderList();
}

function prevMonthExpenses() {
  const pm = curMonth === 0 ? 11 : curMonth - 1;
  const py = curMonth === 0 ? curYear - 1 : curYear;
  return expenses.filter(e => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() === pm && d.getFullYear() === py;
  });
}

function renderMoneySummary() {
  const list   = monthExpenses();
  const income = list.filter(e => e.isIncome).reduce((s, e) => s + e.amount, 0);
  const spent  = list.filter(e => !e.isIncome).reduce((s, e) => s + e.amount, 0);
  const net    = income - spent;

  const amtClass = net >= 0 ? "positive" : "negative";
  const html =
    '<div class="sc-title">Available this month</div>' +
    '<div class="sc-amount ' + amtClass + '">' + (net < 0 ? "\u2212" : "") + fmt(Math.abs(net)) + '</div>' +
    '<div class="sc-metrics">' +
      '<div class="sc-metric">' +
        '<span class="label">Income</span>' +
        '<span class="value income">' + fmt(income) + '</span>' +
      '</div>' +
      '<div class="sc-metric">' +
        '<span class="label">Spent</span>' +
        '<span class="value expense">' + fmt(spent) + '</span>' +
      '</div>' +
      '<div class="sc-metric">' +
        '<span class="label">Savings Rate</span>' +
        '<span class="value neutral">' + (income > 0 ? Math.round(((income - spent) / income) * 100) : 0) + '%</span>' +
      '</div>' +
    '</div>';

  document.getElementById("summaryCard").innerHTML = html;
}

function renderInsights() {
  const list = monthExpenses();
  const prev = prevMonthExpenses();

  const curSpent  = list.filter(e => !e.isIncome).reduce((s, e) => s + e.amount, 0);
  const prevSpent = prev.filter(e => !e.isIncome).reduce((s, e) => s + e.amount, 0);
  const curIncome = list.filter(e => e.isIncome).reduce((s, e) => s + e.amount, 0);
  const prevIncome = prev.filter(e => e.isIncome).reduce((s, e) => s + e.amount, 0);

  const insights = [];

  // Spending comparison
  if (prevSpent > 0) {
    const diff = curSpent - prevSpent;
    const pct  = Math.round((diff / prevSpent) * 100);
    const icon = diff <= 0 ? "\u2193" : "\u2191";
    const verb = diff <= 0 ? "down" : "up";
    const color = diff <= 0 ? "color:#10b981" : "color:#ef4444";
    insights.push({
      icon: icon,
      text: 'Spending <strong style="' + color + '">' + verb + ' ' + Math.abs(pct) + '%</strong> vs last month'
    });
  } else if (curSpent > 0) {
    insights.push({ icon: "\u2022", text: "First month tracking spending" });
  }

  // Income comparison
  if (prevIncome > 0 && curIncome > 0) {
    const diff = curIncome - prevIncome;
    const pct = Math.round((diff / prevIncome) * 100);
    if (pct !== 0) {
      const icon = diff >= 0 ? "\u2191" : "\u2193";
      const verb = diff >= 0 ? "up" : "down";
      const color = diff >= 0 ? "color:#10b981" : "color:#ef4444";
      insights.push({
        icon: icon,
        text: 'Income <strong style="' + color + '">' + verb + ' ' + Math.abs(pct) + '%</strong> vs last month'
      });
    }
  }

  // Savings rate
  if (curIncome > 0) {
    const rate = Math.round(((curIncome - curSpent) / curIncome) * 100);
    const color = rate >= 20 ? "color:#10b981" : rate >= 0 ? "color:#f59e0b" : "color:#ef4444";
    insights.push({
      icon: "\u{1F4B0}",
      text: 'Saving <strong style="' + color + '">' + rate + '%</strong> of income'
    });
  }

  // Average daily spend
  const now = new Date();
  const dayOfMonth = (curYear === now.getFullYear() && curMonth === now.getMonth()) ? now.getDate() : daysInMonth();
  if (dayOfMonth > 0 && curSpent > 0) {
    const avgDaily = curSpent / dayOfMonth;
    insights.push({
      icon: "\u{1F4C5}",
      text: 'Avg <strong>' + fmt(avgDaily) + '</strong>/day (' + dayOfMonth + ' days)'
    });
  }

  // Top category
  const tally = {};
  list.filter(e => !e.isIncome).forEach(e => { tally[e.category] = (tally[e.category] || 0) + e.amount; });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const c = catFor(sorted[0][0]);
    insights.push({
      icon: c.icon,
      text: 'Top: <strong>' + escHtml(sorted[0][0]) + '</strong> (' + fmt(sorted[0][1]) + ')'
    });
  }

  if (insights.length === 0) {
    document.getElementById("insightsList").innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0;">No data yet this month</div>';
    return;
  }

  document.getElementById("insightsList").innerHTML = insights.map(i =>
    '<div class="insight-item">' +
      '<span class="icon">' + i.icon + '</span>' +
      '<span>' + i.text + '</span>' +
    '</div>'
  ).join("");
}

function renderBudgets() {
  const list = monthExpenses();
  const tally = {};
  list.filter(e => !e.isIncome).forEach(e => { tally[e.category] = (tally[e.category] || 0) + e.amount; });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (sorted.length === 0) {
    document.getElementById("budgetsList").innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px 0;">No spending yet</div>';
    return;
  }

  const maxAmt = sorted[0][1];
  const html = sorted.map(([cat, amt]) => {
    const c = catFor(cat);
    const pct = Math.round((amt / maxAmt) * 100);
    const displayName = cat === "Other" ? "Uncategorized" : cat;
    const isOther = cat === "Other";
    const isActive = activeFilter === cat;
    return '<div class="budget-item' + (isActive ? ' active' : '') + (isOther ? ' uncategorized' : '') + '" data-cat="' + escHtml(cat) + '">' +
             '<div class="budget-header">' +
               '<span class="cat-name"><span class="cat-icon">' + c.icon + '</span> ' + escHtml(displayName) + '</span>' +
               '<span class="budget-text">' + fmt(amt) + '</span>' +
             '</div>' +
             '<div class="budget-bar">' +
               '<div class="budget-fill" style="width:' + pct + '%;background:' + c.color + ';"></div>' +
             '</div>' +
           '</div>';
  }).join("");

  document.getElementById("budgetsList").innerHTML = html;
}

function renderPieChart() {
  const list = monthExpenses();
  const tally = {};
  list.filter(e => !e.isIncome).forEach(e => { tally[e.category] = (tally[e.category] || 0) + e.amount; });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, amt]) => s + amt, 0);

  const svg = document.getElementById("pieChart");
  const legend = document.getElementById("pieLegend");
  const titleEl = document.getElementById("pieTitle");

  // Update title with total
  if (titleEl) {
    titleEl.textContent = total > 0 ? "Where your " + fmt(total) + " went" : "Where your money went";
  }

  if (sorted.length === 0 || total === 0) {
    svg.innerHTML = '';
    legend.innerHTML = '<div class="pie-empty">No expenses yet</div>';
    return;
  }

  // Build pie chart paths
  const cx = 100, cy = 100, r = 80;
  let startAngle = -Math.PI / 2; // Start from top
  let paths = '';
  let legendHtml = '';

  sorted.forEach(([cat, amt]) => {
    const c = catFor(cat);
    const pct = amt / total;
    const angle = pct * 2 * Math.PI;
    const endAngle = startAngle + angle;

    // Display name (rename "Other" to "Uncategorized")
    const displayName = cat === "Other" ? "Uncategorized" : cat;

    // Calculate arc path
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const isActive = activeFilter === cat;
    // Add title for hover tooltip
    paths += '<path d="M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' Z" ' +
             'fill="' + c.color + '" data-cat="' + escHtml(cat) + '"' + (isActive ? ' class="active"' : '') + '>' +
             '<title>' + escHtml(displayName) + ': ' + fmt(amt) + ' (' + Math.round(pct * 100) + '%)</title></path>';

    // Legend item with name + amount + percentage
    const isOther = cat === "Other";
    legendHtml += '<div class="legend-item' + (isActive ? ' active' : '') + (isOther ? ' other' : '') + '" data-cat="' + escHtml(cat) + '">' +
                    '<span class="legend-dot" style="background:' + c.color + '"></span>' +
                    '<span class="legend-name">' + c.icon + ' ' + escHtml(displayName) + '</span>' +
                    '<span class="legend-amt">' + fmt(amt) + '</span>' +
                    '<span class="legend-pct">' + Math.round(pct * 100) + '%</span>' +
                  '</div>';

    startAngle = endAngle;
  });

  svg.innerHTML = paths;
  legend.innerHTML = legendHtml;
}

function renderActions() {
  const list = monthExpenses();
  const actionSection = document.getElementById("actionsSection");
  const actionCard = document.getElementById("actionCard");

  if (!actionSection || !actionCard) return;

  // Count uncategorized (Other) transactions
  const uncategorized = list.filter(e => e.category === "Other" && !e.isIncome);
  const uncatTotal = uncategorized.reduce((s, e) => s + e.amount, 0);

  if (uncategorized.length > 0) {
    actionSection.style.display = "block";
    actionCard.innerHTML =
      '<div class="action-title">' +
        '<span>\u26A0\uFE0F</span> ' + uncategorized.length + ' uncategorized transaction' + (uncategorized.length > 1 ? 's' : '') +
      '</div>' +
      '<div class="action-desc">' +
        'You have ' + fmt(uncatTotal) + ' in spending that needs categorization for better insights.' +
      '</div>' +
      '<button class="action-btn" data-action="review-uncategorized">' +
        'Review & Categorize \u2192' +
      '</button>';
  } else {
    actionSection.style.display = "none";
  }
}

function renderFilters() {
  // Category dropdown
  let html = '<select class="filter-select" id="catFilter">' +
             '<option value="all">All Categories</option>';
  html += categories.map(c =>
    '<option value="' + escHtml(c.name) + '"' + (activeFilter === c.name ? ' selected' : '') + '>' + c.icon + ' ' + escHtml(c.name) + '</option>'
  ).join("");
  html += '</select>';

  document.getElementById("filterBar").innerHTML = html;
}

// ─── Day / Flag / Inline-editor helpers ─────────────────────────
function formatDayLabel(dateStr) {
  const d   = new Date(dateStr + "T00:00:00");
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return days[d.getDay()] + " " + MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate();
}

function getTransactionFlags(e, allExps) {
  const flags = [];
  // Recurring: same note-prefix (first 3 words) appears 2+ times
  if (e.note && e.note.trim().length > 2) {
    const prefix = e.note.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase();
    if (prefix.length >= 3) {
      const count = allExps.filter(x => x.note && x.note.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase() === prefix).length;
      if (count >= 2) flags.push("recurring");
    }
  }
  // Unusual: amount > 2.5× category average (expenses only)
  const catExps = allExps.filter(x => x.category === e.category && !x.isIncome);
  if (catExps.length >= 2) {
    const avg = catExps.reduce((s, x) => s + x.amount, 0) / catExps.length;
    if (e.amount > avg * 2.5) flags.push("unusual");
  }
  return flags;
}

function renderInlineEditor(e) {
  const catOpts = categories.map(c =>
    `<option value="${escHtml(c.name)}" ${e.category === c.name ? 'selected' : ''}>${c.icon} ${escHtml(c.name)}</option>`
  ).join("");
  return `<div class="inline-editor">
    <div class="ie-row">
      <div class="ie-field note">
        <label>Note</label>
        <input type="text" class="ie-note" value="${escHtml(e.note || '')}">
      </div>
      <div class="ie-field">
        <label>Category</label>
        <select class="ie-cat">${catOpts}</select>
      </div>
      <div class="ie-field amt">
        <label>Amount</label>
        <input type="number" class="ie-amt" value="${e.amount}" step="0.01" min="0">
      </div>
    </div>
    <div class="ie-income-wrap">
      <input type="checkbox" class="ie-income" ${e.isIncome ? 'checked' : ''}> Income
    </div>
    <div class="ie-btns">
      <button class="ie-btn save"   data-action="ie-save"   data-id="${e.id}">Save</button>
      <button class="ie-btn cancel" data-action="ie-cancel" data-id="${e.id}">Cancel</button>
      <button class="ie-btn del"    data-action="ie-del"    data-id="${e.id}">Delete</button>
    </div>
  </div>`;
}

function saveInline(id) {
  const saveBtn = document.querySelector('.ie-btn.save[data-id="' + id + '"]');
  if (!saveBtn) return;
  const wrap   = saveBtn.closest(".inline-editor");
  const amount = parseFloat(wrap.querySelector(".ie-amt").value);
  if (!amount || amount <= 0 || isNaN(amount)) return;
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return;
  const oldCat = expenses[idx].category;
  const newCat = wrap.querySelector(".ie-cat").value;
  if (oldCat !== newCat) learnCategoryRule(expenses[idx].note, newCat);
  expenses[idx] = {
    ...expenses[idx],
    note:     wrap.querySelector(".ie-note").value.trim(),
    category: newCat,
    amount,
    isIncome: wrap.querySelector(".ie-income").checked
  };
  persist();
  editingId = null;
  render();
}

function renderList() {
  let list = monthExpenses();
  if (activeFilter !== "all") {
    if (activeFilter.startsWith("grp:")) {
      const grpName = activeFilter.slice(4);
      let grpCats   = SIMPLE_GROUPS[grpName] || [];
      if (grpName === "Other") {
        const covered = new Set(Object.values(SIMPLE_GROUPS).flat());
        grpCats = [...grpCats, ...categories.map(c => c.name).filter(c => !covered.has(c))];
      }
      list = list.filter(e => grpCats.includes(e.category));
    } else {
      list = list.filter(e => e.category === activeFilter);
    }
  }
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    list = list.filter(e =>
      (e.note     && e.note.toLowerCase().includes(s)) ||
      e.category.toLowerCase().includes(s) ||
      String(e.amount).includes(searchTerm)
    );
  }
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!list.length) {
    document.getElementById("expenseList").innerHTML =
      '<div class="empty-state"><div class="icon">📭</div><p>' + (searchTerm || activeFilter !== 'all' ? 'No matching transactions' : 'No expenses \u2014 tap <strong>+</strong> to add one!') + '</p></div>';
    return;
  }

  // group by day
  const groups    = {};
  list.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
  const sortedDays = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const allMonthExps = monthExpenses(); // full set for flag detection

  let html = '';
  sortedDays.forEach(day => {
    const dayExps = groups[day];
    const net = dayExps.reduce((s, e) => s + (e.isIncome ? e.amount : -e.amount), 0);
    html += '<div class="day-group">' +
              '<div class="day-header">' +
                '<span>' + formatDayLabel(day) + '</span>' +
                '<span class="day-total ' + (net >= 0 ? 'pos' : 'neg') + '">' + (net >= 0 ? '+' : '') + fmt(net) + '</span>' +
              '</div>';

    dayExps.forEach(e => {
      const c        = catFor(e.category);
      const flags    = getTransactionFlags(e, allMonthExps);
      const isEditing = editingId === e.id;
      const amtCls    = e.isIncome ? 'income' : 'expense';
      const amtPrefix = e.isIncome ? '+' : '\u2212';

      html += '<div class="txn-row' + (isEditing ? ' editing' : '') + '" data-id="' + e.id + '">' +
                '<div class="txn-info">' +
                  '<div class="txn-merchant">' +
                    escHtml(cleanNote(e.note, e.category));

      flags.forEach(f => {
        if (f === 'recurring') html += '<span class="recurring-badge">Recurring</span>';
        else if (f === 'unusual') html += '<span class="unusual-badge">Unusual</span>';
      });

      html += '</div>' +
                  '<div class="txn-meta">' +
                    '<span class="cat-pill" style="background:' + c.color + '15;color:' + c.color + '">' + c.icon + ' ' + escHtml(e.category) + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="txn-amount ' + amtCls + '">' + amtPrefix + fmt(e.amount) + '</div>' +
                '<div class="txn-actions">' +
                  '<button class="txn-action-btn" data-action="edit" data-id="' + e.id + '" title="Edit">&#9998;</button>' +
                  '<button class="txn-action-btn" data-action="delete" data-id="' + e.id + '" title="Delete">&#10005;</button>' +
                '</div>' +
              '</div>';

      if (isEditing) html += renderInlineEditor(e);
    });
    html += '</div>'; // close day-group
  });

  document.getElementById("expenseList").innerHTML = html;
}

// ─── Expense Modal ───────────────────────────────────────────────
function openExpenseModal(editId) {
  const overlay = document.getElementById("expenseOverlay");
  document.getElementById("inCategory").innerHTML =
    categories.map(c => `<option value="${escHtml(c.name)}">${c.icon} ${escHtml(c.name)}</option>`).join("");

  if (editId) {
    const e = expenses.find(x => x.id === editId);
    if (!e) return;
    document.getElementById("inAmount").value   = e.amount;
    document.getElementById("inCategory").value = e.category;
    document.getElementById("inDate").value     = e.date;
    document.getElementById("inNote").value     = e.note || "";
    document.getElementById("inIsIncome").checked = !!e.isIncome;
    document.getElementById("editId").value     = editId;
    document.getElementById("modalTitle").textContent = "Edit Expense";
    document.getElementById("saveBtn").textContent    = "Save Changes";
  } else {
    document.getElementById("inAmount").value   = "";
    document.getElementById("inCategory").value = categories[0]?.name || "";
    document.getElementById("inDate").value     = new Date().toISOString().slice(0,10);
    document.getElementById("inNote").value     = "";
    document.getElementById("inIsIncome").checked = false;
    document.getElementById("editId").value     = "";
    document.getElementById("modalTitle").textContent = "Add Expense";
    document.getElementById("saveBtn").textContent    = "Add Expense";
  }

  document.getElementById("inAmount").classList.remove("error");
  overlay.classList.add("show");
  requestAnimationFrame(() => document.getElementById("inAmount").focus());
}

function closeExpenseModal() {
  document.getElementById("expenseOverlay").classList.remove("show");
}

function saveExpense() {
  const amount   = parseFloat(document.getElementById("inAmount").value);
  const category = document.getElementById("inCategory").value;
  const date     = document.getElementById("inDate").value;
  const note     = document.getElementById("inNote").value.trim();
  const isIncome = document.getElementById("inIsIncome").checked;
  const editId   = document.getElementById("editId").value;

  if (!amount || amount <= 0 || isNaN(amount)) {
    document.getElementById("inAmount").classList.add("error");
    document.getElementById("inAmount").focus();
    return;
  }
  if (!date) return;

  document.getElementById("inAmount").classList.remove("error");

  if (editId) {
    const idx = expenses.findIndex(e => e.id === editId);
    if (idx !== -1) {
      if (expenses[idx].category !== category) learnCategoryRule(expenses[idx].note, category);
      expenses[idx] = { id: editId, amount, category, date, note, isIncome };
    }
  } else {
    expenses.push({ id: uid(), amount, category, date, note, isIncome });
  }

  persist();
  closeExpenseModal();
  render();
}

// ─── Category Modal ──────────────────────────────────────────────
function openCatModal() {
  closeExpenseModal();
  renderChips();
  renderColorPicker();
  document.getElementById("inCatName").value = "";
  document.getElementById("catOverlay").classList.add("show");
  requestAnimationFrame(() => document.getElementById("inCatName").focus());
}
function closeCatModal() {
  document.getElementById("catOverlay").classList.remove("show");
  render();
}

function renderChips() {
  document.getElementById("chips").innerHTML = categories.map(c =>
    `<div class="chip" style="background:${c.color}18;color:${c.color}">
       ${c.icon} ${escHtml(c.name)}
       <button class="chip-x" data-cat="${escHtml(c.name)}">&times;</button>
     </div>`
  ).join("");
}

function renderColorPicker() {
  pickedColor = COLORS[0];
  document.getElementById("colorPicker").innerHTML = COLORS.map(c =>
    `<div class="color-swatch ${c === pickedColor ? "sel" : ""}" style="background:${c}" data-color="${c}"></div>`
  ).join("");
}

function addCategory() {
  const name = document.getElementById("inCatName").value.trim();
  const icon = document.getElementById("inCatIcon").value;
  if (!name) return;
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('A category named "' + name + '" already exists.');
    return;
  }
  categories.push({ name, color: pickedColor, icon });
  persist();
  renderChips();
  document.getElementById("inCatName").value = "";
}

function deleteCategory(name) {
  const inUse = expenses.some(e => e.category === name);
  if (inUse && !confirm(`Some expenses use "${name}". Remove it anyway?\n(Those expenses will keep their label but won't show in the breakdown.)`)) return;
  categories = categories.filter(c => c.name !== name);
  persist();
  renderChips();
  render();
}

// ─── Event Wiring (delegation) ──────────────────────────────────
document.getElementById("fabBtn").addEventListener("click", () => openExpenseModal(null));
document.getElementById("saveBtn").addEventListener("click", saveExpense);
document.getElementById("cancelBtn").addEventListener("click", closeExpenseModal);
document.getElementById("prevBtn").addEventListener("click", () => { curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } render(); });
document.getElementById("nextBtn").addEventListener("click", () => { curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } render(); });
document.getElementById("manageBtn").addEventListener("click", openCatModal);
document.getElementById("addCatShortcut").addEventListener("click", openCatModal);
document.getElementById("addCatBtn").addEventListener("click", addCategory);
document.getElementById("doneCatBtn").addEventListener("click", closeCatModal);

// overlay click → close
document.getElementById("expenseOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeExpenseModal(); });
document.getElementById("catOverlay").addEventListener("click",  e => { if (e.target === e.currentTarget) closeCatModal(); });

// ESC → close
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeExpenseModal(); closeCatModal(); closeImportModal(); if (editingId) { editingId = null; renderList(); } }
});

// Enter in amount field → save
document.getElementById("inAmount").addEventListener("keydown", e => { if (e.key === "Enter") saveExpense(); });

// Filter bar (event delegation)
document.getElementById("filterBar").addEventListener("change", e => {
  if (e.target.id === "catFilter") {
    activeFilter = e.target.value;
    render();
  }
});

// Pie chart interactivity (click slice or legend to filter)
document.getElementById("pieChart").addEventListener("click", e => {
  const path = e.target.closest("path");
  if (!path) return;
  const cat = path.dataset.cat;
  activeFilter = activeFilter === cat ? "all" : cat;
  render();
});
document.getElementById("pieLegend").addEventListener("click", e => {
  const item = e.target.closest(".legend-item");
  if (!item) return;
  const cat = item.dataset.cat;
  activeFilter = activeFilter === cat ? "all" : cat;
  render();
});

// Action card - Review uncategorized
document.getElementById("actionCard").addEventListener("click", e => {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;
  if (btn.dataset.action === "review-uncategorized") {
    activeFilter = "Other";
    render();
    // Scroll to transactions
    document.querySelector(".main-content").scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Budget items (click to filter)
document.getElementById("budgetsList").addEventListener("click", e => {
  const item = e.target.closest(".budget-item");
  if (!item) return;
  const cat = item.dataset.cat;
  activeFilter = activeFilter === cat ? "all" : cat;
  render();
});

// Search
document.getElementById("searchInput").addEventListener("input", e => {
  searchTerm = e.target.value;
  document.getElementById("searchClear").classList.toggle("show", searchTerm.length > 0);
  renderList();
});
document.getElementById("searchClear").addEventListener("click", () => {
  searchTerm = "";
  document.getElementById("searchInput").value = "";
  document.getElementById("searchClear").classList.remove("show");
  renderList();
});

// Expense list (delegation — rows + inline editor)
document.getElementById("expenseList").addEventListener("click", e => {
  // inline-editor action buttons
  const ieBtn = e.target.closest(".ie-btn");
  if (ieBtn) {
    const id = ieBtn.dataset.id;
    if (ieBtn.dataset.action === "ie-save")   { saveInline(id); return; }
    if (ieBtn.dataset.action === "ie-cancel") { editingId = null; renderList(); return; }
    if (ieBtn.dataset.action === "ie-del")    { expenses = expenses.filter(x => x.id !== id); persist(); editingId = null; render(); return; }
    return;
  }
  // action buttons (edit/delete on hover)
  const actionBtn = e.target.closest(".txn-action-btn");
  if (actionBtn) {
    const id = actionBtn.dataset.id;
    if (actionBtn.dataset.action === "edit") { editingId = editingId === id ? null : id; renderList(); }
    if (actionBtn.dataset.action === "delete") {
      if (confirm("Delete this transaction?")) { expenses = expenses.filter(x => x.id !== id); persist(); render(); }
    }
    return;
  }
  // row click → toggle inline editor
  const row = e.target.closest(".txn-row");
  if (!row) return;
  editingId = editingId === row.dataset.id ? null : row.dataset.id;
  renderList();
});

// Enter in inline editor → save
document.getElementById("expenseList").addEventListener("keydown", e => {
  if (e.key === "Enter" && editingId) { e.preventDefault(); saveInline(editingId); }
});

// Category chips delete (delegation)
document.getElementById("chips").addEventListener("click", e => {
  const btn = e.target.closest(".chip-x");
  if (btn) deleteCategory(btn.dataset.cat);
});

// Color picker (delegation)
document.getElementById("colorPicker").addEventListener("click", e => {
  const swatch = e.target.closest(".color-swatch");
  if (!swatch) return;
  pickedColor = swatch.dataset.color;
  document.querySelectorAll(".color-swatch").forEach(s => s.classList.toggle("sel", s.dataset.color === pickedColor));
});

// ─── CSV Import ──────────────────────────────────────────────────
let parsedRows  = [];
let categoryMap = {};

const CHASE_MAP = {
  "restaurants":"Food & Dining", "grocery stores":"Food & Dining",
  "supermarkets & grocery":"Food & Dining", "fast food":"Food & Dining",
  "coffee shops":"Food & Dining", "dining":"Food & Dining",
  "online shopping":"Shopping", "shopping":"Shopping",
  "department stores":"Shopping", "clothing stores":"Shopping",
  "gas & gas stations":"Transportation", "gas stations":"Transportation",
  "parking":"Transportation", "ride share":"Transportation",
  "auto":"Transportation", "uber":"Transportation",
  "streaming":"Subscriptions", "cable tv & phone":"Subscriptions",
  "subscription boxes":"Subscriptions", "online services":"Subscriptions",
  "zelle":"Zelle to Friends",
};

// Guess category from the transaction description when no Category column exists
function guessCategory(desc) {
  const d = desc.toLowerCase();
  // Zelle — first, very specific
  if (d.includes("zelle"))                                            return "Zelle to Friends";
  // Transfers / Allowance
  if (d.includes("transfer"))                                         return "Allowance";
  // Insurance
  if (d.includes("geico") || d.includes("allstate") || d.includes("state farm") ||
      d.includes("progressive") || d.includes("nationwide") || d.includes("farmers") ||
      d.includes("liberty mutual") || d.includes("travelers") || d.includes("insurance"))
    return "Insurance";
  // Food & Dining — uber eat* before uber so ride shares don't get caught here
  if (d.includes("doordash") || d.includes("uber eat") || d.includes("ubereats") ||
      d.includes("grubhub") || d.includes("starbucks") || d.includes("dunkin") ||
      d.includes("chipotle") || d.includes("mcdonald") || d.includes("chick-fil-a") ||
      d.includes("chick fil a") || d.includes("taco bell") || d.includes("wendy") ||
      d.includes("burger king") || d.includes("panera") || d.includes("pizza") ||
      d.includes("subway") || d.includes("popeye") || d.includes("restaurant"))
    return "Food & Dining";
  // Subscriptions — amazon prime before amazon so it doesn't fall to Shopping
  if (d.includes("netflix") || d.includes("spotify") || d.includes("hulu") ||
      d.includes("youtube") || d.includes("disney") || d.includes("apple tv") ||
      d.includes("amazon prime") || d.includes("subscription") || d.includes("membership"))
    return "Subscriptions";
  // Technology
  if (d.includes("plaud") || d.includes("adobe") || d.includes("microsoft") ||
      d.includes("apple inc") || d.includes("google store") || d.includes("dell "))
    return "Technology";
  // Transportation — uber/lyft safe here because uber eats already returned above
  if (d.includes("uber") || d.includes("lyft") || d.includes("shell") ||
      d.includes("exxon") || d.includes("chevron") || d.includes("mobil") ||
      d.includes("bp ") || d.includes("gas station") || d.includes("parking") ||
      d.includes("transit") || d.includes("toll") ||
      d.includes("united.com") || d.includes("united air") || d.includes("american air") ||
      d.includes("delta air") || d.includes("southwest") || d.includes("jetblue") ||
      d.includes("alaska air"))
    return "Transportation";
  // Shopping & Groceries
  if (d.includes("amazon") || d.includes("walmart") || d.includes("target") ||
      d.includes("ebay") || d.includes("etsy") || d.includes("costco") ||
      d.includes("best buy") || d.includes("home depot") || d.includes("lowes") ||
      d.includes("kroger") || d.includes("whole foods") || d.includes("grocery") ||
      d.includes("safeway") || d.includes("publix") || d.includes("trader joe") ||
      d.includes("aldi") || d.includes("wegmans") || d.includes("h-e-b") ||
      d.includes("instacart"))
    return "Shopping";
  return null; // unknown — will fall back to "Other"
}

function openImportModal() {
  showImportScreen("upload");
  document.getElementById("importOverlay").classList.add("show");
}
function closeImportModal() {
  document.getElementById("importOverlay").classList.remove("show");
}
function showImportScreen(name) {
  document.getElementById("importScreenUpload").style.display  = name === "upload"  ? "block" : "none";
  document.getElementById("importScreenPreview").style.display = name === "preview" ? "block" : "none";
  document.getElementById("importScreenSuccess").style.display = name === "success" ? "block" : "none";
}

// Parses the entire file at once — correctly handles quoted fields that span multiple lines
function parseCSV(text, sep) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i+1] === '"') { cur += '"'; i++; } // escaped quote
      else inQ = !inQ;
    } else if (ch === sep && !inQ) {
      row.push(cur.trim()); cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && text[i+1] === '\n') i++; // skip \r in \r\n
      row.push(cur.trim()); cur = '';
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }
  row.push(cur.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

function parseAmt(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(n) ? null : n;
}

function toISODate(str, dateFormat) {
  if (!str || !str.trim()) return null;
  var s = str.trim();
  var m, d, y;

  // Default to MM/DD/YYYY if no format specified
  var fmt = (dateFormat || 'MM/DD/YYYY').toUpperCase();

  if (fmt === 'YYYY-MM-DD') {
    var parts = s.split('-');
    y = parts[0]; m = parts[1]; d = parts[2];
  } else if (fmt === 'DD/MM/YYYY' || fmt === 'D/M/YYYY') {
    var parts = s.split(/[/\-.]/);
    d = parts[0]; m = parts[1]; y = parts[2];
  } else if (fmt === 'DD-MM-YYYY') {
    var parts = s.split('-');
    d = parts[0]; m = parts[1]; y = parts[2];
  } else if (fmt === 'MM-DD-YYYY') {
    var parts = s.split('-');
    m = parts[0]; d = parts[1]; y = parts[2];
  } else {
    // MM/DD/YYYY or M/D/YYYY (default)
    var parts = s.split(/[/\-.]/);
    m = parts[0]; d = parts[1]; y = parts[2];
  }

  if (!m || !d || !y) return null;
  // Handle 2-digit years
  if (y.length === 2) y = '20' + y;
  return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

// Call AI to detect CSV column structure
async function detectCSVFormat(sampleRows) {
  try {
    var response = await fetch('/api/parse-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: sampleRows })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('AI CSV detection failed, using fallback:', err);
    return null;
  }
}

// Fallback: detect columns from headers the old way
function detectColumnsFromHeaders(headers) {
  return {
    columns: {
      date:        headers.findIndex(function (h) { return h.includes("date"); }),
      description: headers.findIndex(function (h) { return h.includes("description"); }),
      category:    headers.findIndex(function (h) { return h === "category"; }),
      amount:      headers.findIndex(function (h) { return h === "amount"; }),
      debit:       headers.findIndex(function (h) { return h === "debit"; }),
      credit:      headers.findIndex(function (h) { return h === "credit"; }),
      type:        headers.findIndex(function (h) { return h === "type"; })
    },
    dateFormat: 'MM/DD/YYYY',
    amountSign: 'negative_is_expense'
  };
}

async function handleFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.csv')) return alert("Please select a .csv file.");
  const reader = new FileReader();
  reader.onload = async (e) => {
    const text    = e.target.result.replace(/^\uFEFF/, ''); // strip BOM
    const sep     = text.split(/\r?\n/)[0].includes('\t') ? '\t' : ',';
    const allRows = parseCSV(text, sep);
    if (allRows.length < 2) return alert("CSV appears empty.");

    // Show loading while AI detects the format
    showImportScreen('preview');
    document.getElementById('previewList').innerHTML =
      '<div class="ai-loading">' +
      '<div class="ai-spinner"></div>' +
      '<div class="ai-loading-text">Detecting CSV format...</div>' +
      '</div>';

    // Try AI detection first, fallback to header-based detection
    var sampleRows = allRows.slice(0, 6);
    var detected = await detectCSVFormat(sampleRows);
    var headers = allRows[0].map(function (h) { return h.toLowerCase(); });

    if (!detected || !detected.columns) {
      detected = detectColumnsFromHeaders(headers);
    }

    var col = {
      date:    detected.columns.date != null ? detected.columns.date : -1,
      desc:    detected.columns.description != null ? detected.columns.description : -1,
      cat:     detected.columns.category != null ? detected.columns.category : -1,
      amt:     detected.columns.amount != null ? detected.columns.amount : -1,
      debit:   detected.columns.debit != null ? detected.columns.debit : -1,
      credit:  detected.columns.credit != null ? detected.columns.credit : -1,
      type:    detected.columns.type != null ? detected.columns.type : -1,
    };
    var dateFormat = detected.dateFormat || 'MM/DD/YYYY';
    var amountSign = detected.amountSign || 'negative_is_expense';

    if (col.date === -1) return alert("Can't find a date column.\n\nDetected headers: " + headers.join(", "));

    const isChecking = amountSign === 'separate_columns' && col.debit !== -1 && col.credit !== -1;
    const rows = [];

    for (let i = 1; i < allRows.length; i++) {
      const c    = allRows[i];
      const date = toISODate((c[col.date] || '').trim(), dateFormat);
      if (!date) continue;

      const desc = col.desc !== -1 ? (c[col.desc] || 'Unknown').trim() : 'Unknown';
      const cat  = col.cat !== -1 ? (c[col.cat] || 'Other').trim() : smartCategorize(desc);
      let amount, isPayment;

      if (isChecking) {
        const deb = parseAmt(c[col.debit]);
        const cre = parseAmt(c[col.credit]);
        if (deb  && deb > 0)  { amount = deb;  isPayment = false; }
        else if (cre && cre > 0) { amount = cre;  isPayment = true;  }
        else continue;
      } else {
        if (col.amt === -1) continue;
        const raw = parseAmt(c[col.amt]);
        if (raw === null) continue;
        amount = Math.abs(raw);

        if (amountSign === 'positive_is_expense') {
          isPayment = raw < 0;
        } else {
          // negative_is_expense (default): negative = expense, positive = income
          // Also check type column if available
          var typeVal = col.type !== -1 ? (c[col.type] || '').trim().toLowerCase() : '';
          if (typeVal.includes("credit") || typeVal.includes("deposit")) {
            isPayment = true;
          } else if (typeVal.includes("debit")) {
            isPayment = false;
          } else {
            isPayment = raw > 0;
          }
        }
      }

      rows.push({ date, description: desc, amount, category: cat, isPayment, isIncome: isPayment, checked: true });
    }

    if (!rows.length) return alert("No transactions found in this CSV.");

    // If all amounts were positive we can't auto-detect payments — treat all as charges
    if (!rows.some(r => !r.isPayment)) rows.forEach(r => { r.isPayment = false; r.isIncome = false; r.checked = true; });

    // Auto-create "Other" category if needed
    if (rows.some(r => r.category === "Other") && !categories.some(c => c.name === "Other")) {
      categories.push({ name: "Other", color: "#9ca3af", icon: "💰" });
    }

    parsedRows = rows;

    // Build category map — keep categories already guessed from descriptions as-is
    categoryMap = {};
    [...new Set(rows.map(r => r.category))].forEach(cat => {
      categoryMap[cat] = categories.some(c => c.name === cat)
        ? cat
        : CHASE_MAP[cat.toLowerCase()] || "Other";
    });

    // Run local pattern matching on anything still labeled "Other"
    rows.forEach(function (r) {
      if (r.category === 'Other') {
        var guess = smartCategorize(r.description);
        if (guess && guess !== 'Other') {
          r.category = guess;
          categoryMap[guess] = guess;
        }
      }
    });

    // Auto-create categories from pattern matching that don't exist yet
    var patternCats = {
      'Zelle to Friends': { color: '#14b8a6', icon: '💸' },
      'Allowance':        { color: '#f59e0b', icon: '💵' },
      'Insurance':        { color: '#ef4444', icon: '🛡️' },
      'Technology':       { color: '#6366f1', icon: '📱' }
    };
    Object.keys(patternCats).forEach(function (name) {
      if (rows.some(function (r) { return r.category === name; }) &&
          !categories.some(function (c) { return c.name === name; })) {
        categories.push({ name: name, color: patternCats[name].color, icon: patternCats[name].icon });
      }
    });
    persist();

    // AI batch categorization for remaining uncategorized transactions
    const uncategorized = rows.filter(r => r.category === 'Other');

    if (uncategorized.length > 0 && AI_ENABLED) {
      // Deduplicate: extract unique descriptions that aren't already cached
      var seen = {};
      var uniqueDescs = [];
      uncategorized.forEach(function (r) {
        var key = getCacheKey(r.description);
        if (!seen[key] && !lookupAICache(r.description)) {
          seen[key] = true;
          uniqueDescs.push(r.description);
        }
      });

      if (uniqueDescs.length > 0) {
        showImportScreen('preview');
        var importBtn = document.getElementById('importConfirmBtn');
        var backBtn = document.getElementById('importBackBtn');
        importBtn.disabled = true;
        importBtn.textContent = 'Please wait...';
        backBtn.disabled = true;

        var batchSize = 25;
        var totalBatches = Math.ceil(uniqueDescs.length / batchSize);

        // Show progress
        function updateProgress(current) {
          var pct = Math.round((current / totalBatches) * 100);
          document.getElementById('previewList').innerHTML =
            '<div class="ai-loading">' +
            '<div class="ai-spinner"></div>' +
            '<div class="ai-loading-text">Categorizing ' + uniqueDescs.length + ' merchants (batch ' + current + ' of ' + totalBatches + ')</div>' +
            '<div class="ai-progress-bar"><div class="ai-progress-fill" style="width:' + pct + '%"></div></div>' +
            '</div>';
        }

        for (var i = 0; i < uniqueDescs.length; i += batchSize) {
          var batchNum = Math.floor(i / batchSize) + 1;
          updateProgress(batchNum);
          var batch = uniqueDescs.slice(i, i + batchSize);
          try {
            var categoryNames = categories.map(function (c) { return c.name; });
            var descriptions = batch;
            var result = await callCategorizeAPI(categoryNames, descriptions);
            var resultArray = Array.isArray(result) ? result : [];
            resultArray.forEach(function (r) {
              var desc = batch[r.index - 1];
              if (desc && r.category) {
                // Match category name (case-insensitive)
                var matched = categoryNames.find(function (c) {
                  return c.toLowerCase() === (r.category || '').toLowerCase();
                }) || r.category;
                updateAICache(desc, matched, r.title || null);
              }
            });
          } catch (err) {
            console.warn('Batch ' + batchNum + ' failed, skipping:', err.message);
          }
        }

        backBtn.disabled = false;
      }

      // Apply cached results to all uncategorized rows
      uncategorized.forEach(function (r) {
        var cached = lookupAICache(r.description);
        if (cached && cached.category && cached.category !== 'Other') {
          r.category = cached.category;
          r.aiSuggested = true;
          categoryMap[cached.category] = cached.category;
        }
      });
    }

    showImportScreen("preview");
    renderCatMap();
    renderPreview();
  };
  reader.readAsText(file);
}

function renderCatMap() {
  const uniqueCats = [...new Set(parsedRows.map(r => r.category))].sort();
  const opts = categories.map(c => `<option value="${escHtml(c.name)}">${c.icon} ${escHtml(c.name)}</option>`).join("");

  document.getElementById("mapSection").innerHTML =
    '<div class="map-title">Map categories to yours</div>' +
    uniqueCats.map(cat =>
      `<div class="map-row">
         <span class="chase-cat">${escHtml(cat)}</span>
         <span class="arrow">→</span>
         <select data-chase="${escHtml(cat)}">${opts}</select>
       </div>`
    ).join("");

  // Set current mappings
  document.querySelectorAll("#mapSection select").forEach(sel => {
    if (categoryMap[sel.dataset.chase]) sel.value = categoryMap[sel.dataset.chase];
  });
}

function renderPreview() {
  const selCount = parsedRows.filter(r => r.checked).length;
  document.getElementById("selCount").textContent = selCount + " selected";
  document.getElementById("importConfirmBtn").textContent = selCount ? `Import ${selCount}` : "Nothing selected";
  document.getElementById("importConfirmBtn").disabled = selCount === 0;

  document.getElementById("selectAllCheck").checked = parsedRows.length > 0 && parsedRows.every(r => r.checked);

  document.getElementById("previewList").innerHTML = parsedRows.map((r, i) => {
    const mapped = categoryMap[r.category] || r.category;
    const d = new Date(r.date + "T00:00:00");
    const aiClass = r.aiSuggested ? ' ai-suggested' : '';
    return '<div class="preview-row ' + (r.isIncome ? 'income' : '') + '">' +
              '<input type="checkbox" data-idx="' + i + '"' + (r.checked ? ' checked' : '') + '>' +
              '<span class="pr-date">' + (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear() + '</span>' +
              '<span class="pr-desc">' + escHtml(r.description) + '</span>' +
              '<span class="pr-cat' + aiClass + '">' + (r.aiSuggested ? '<span class="ai-badge">AI</span> ' : '') + escHtml(mapped) + '</span>' +
              '<span class="pr-amt">' + (r.isIncome ? '+' : '') + fmt(r.amount) + '</span>' +
            '</div>';
  }).join("");
}

function doImport() {
  if (document.getElementById("clearBeforeImport").checked) expenses = [];
  const toImport = parsedRows.filter(r => r.checked);
  let added = 0, skipped = 0;

  toImport.forEach(r => {
    const cat = categoryMap[r.category] || categories[0]?.name;
    // Duplicate check: same date + amount + first 20 chars of description
    const dup = expenses.some(e =>
      e.date === r.date &&
      Math.abs(e.amount - r.amount) < 0.01 &&
      (e.note || "").slice(0,20).toLowerCase() === r.description.slice(0,20).toLowerCase()
    );
    if (dup) { skipped++; return; }
    expenses.push({ id: uid(), amount: r.amount, category: cat, date: r.date, note: r.description, isIncome: r.isIncome || false });
    added++;
  });

  persist();

  // Jump to the month of the most recent imported transaction
  if (added) {
    const dates = toImport.map(r => new Date(r.date + "T00:00:00")).sort((a,b) => b - a);
    curMonth = dates[0].getMonth();
    curYear  = dates[0].getFullYear();
  }
  render();

  document.getElementById("successCount").textContent = added;
  document.getElementById("successMsg").textContent = skipped
    ? `expenses imported. ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped.`
    : "expenses imported successfully.";
  showImportScreen("success");
}

// ─── Settings Event Wiring ────────────────────────────────────────
document.getElementById("settingsBtn").addEventListener("click", openSettingsModal);
document.getElementById("closeSettingsBtn").addEventListener("click", closeSettingsModal);
document.getElementById("clearRulesBtn").addEventListener("click", clearAllLearnedRules);
document.getElementById("settingsOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeSettingsModal(); });
document.getElementById("learnedRulesList").addEventListener("click", e => {
  if (e.target.classList.contains("rule-delete")) {
    const pattern = e.target.dataset.pattern;
    const rules = loadLearnedRules();
    delete rules[pattern];
    saveLearnedRules(rules);
    openSettingsModal(); // Refresh
  }
});
document.getElementById("clearTransactionsBtn").addEventListener("click", () => {
  if (confirm('Delete ALL transactions? This cannot be undone.')) {
    expenses = [];
    persist();
    render();
    closeSettingsModal();
  }
});
document.getElementById("clearAICacheBtn").addEventListener("click", () => {
  if (confirm('Clear the AI cache? Future imports will need to re-categorize merchants.')) {
    localStorage.removeItem(AI_CACHE_KEY);
    alert('AI cache cleared.');
  }
});

// ─── Import Event Wiring ─────────────────────────────────────────
document.getElementById("importBtn").addEventListener("click", openImportModal);
document.getElementById("importCancelUpload").addEventListener("click", closeImportModal);
document.getElementById("importBackBtn").addEventListener("click", () => showImportScreen("upload"));
document.getElementById("importConfirmBtn").addEventListener("click", doImport);
document.getElementById("importDoneBtn").addEventListener("click", closeImportModal);
document.getElementById("importOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeImportModal(); });

const dz = document.getElementById("dropZone");
dz.addEventListener("dragover",  e => { e.preventDefault(); dz.classList.add("over"); });
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop",      e => { e.preventDefault(); dz.classList.remove("over"); handleFile(e.dataTransfer.files[0]); });
document.getElementById("csvFileInput").addEventListener("change", e => handleFile(e.target.files[0]));

document.getElementById("selectAllCheck").addEventListener("change", e => {
  parsedRows.forEach(r => { r.checked = e.target.checked; });
  renderPreview();
});
document.getElementById("mapSection").addEventListener("change", e => {
  if (e.target.tagName === "SELECT") { categoryMap[e.target.dataset.chase] = e.target.value; renderPreview(); }
});
document.getElementById("previewList").addEventListener("change", e => {
  if (e.target.type === "checkbox") { parsedRows[+e.target.dataset.idx].checked = e.target.checked; renderPreview(); }
});

// ─── Init ────────────────────────────────────────────────────────
load();
render();
