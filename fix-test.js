const fs = require('fs');
const file = 'API/src/modules/delivery/__tests__/partner-lifecycle.test.ts';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace('      // Count location events',       if (currentDelivery?.status === 'arrived_pickup' && !global.handoffConfirmed) { global.handoffConfirmed = true; console.log('Simulating owner handoff confirmation...'); const { transitionOrderStatus } = require('../../orders/order.service'); await transitionOrderStatus(order1._id.toString(), 'picked_up', { id: 'sys', role: 'system' }); }
      // Count location events);
fs.writeFileSync(file, txt);
