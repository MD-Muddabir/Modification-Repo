const fs = require('fs');
const file = 'd:\\Modification\\Version 1.0.8 D\\zf-solution-App\\frontend\\src\\pages\\admin\\Expenses.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
    'ðŸ’¸': '💸',
    'ðŸ“„': '📄',
    'ðŸ“Š': '📊',
    'âž•': '➕',
    'â† ': '←',
    'ðŸšŒ': '🚌',
    'ðŸ“…': '📅',
    'ðŸ’µ': '💵',
    'â‚¹': '₹',
    'ðŸ”¥': '🔥',
    'ðŸ“ ': '📋',
    'ðŸ“ˆ': '📈',
    'ðŸ’°': '💰',
    'âœ ï¸ ': '✏️',
    'ðŸ—‘ï¸ ': '🗑️',
    'ðŸ’¾': '💾',
    'âš ï¸ ': '⚠️',
    'âœ…': '✅'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.replaceAll(bad, good);
}

fs.writeFileSync(file, content);
console.log('Fixed Expenses.jsx emoji encoding');
