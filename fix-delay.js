const fs = require('fs');
const file = 'API/src/modules/delivery/__tests__/partner-lifecycle.test.ts';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace('  if (currentDelivery?.status !== \'delivered\') {', '  await new Promise(r => setTimeout(r, 500));\n  if (currentDelivery?.status !== \'delivered\') {');
fs.writeFileSync(file, txt);
