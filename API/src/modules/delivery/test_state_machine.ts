import { assertValidTransition, DeliveryStatus, InvalidStateTransitionError } from './delivery.state';

const ALL_STATES: DeliveryStatus[] = [
  'partner_assigned',
  'arrived_pickup',
  'picked_up',
  'out_for_delivery',
  'nearby',
  'delivered',
];

let passCount = 0;
let failCount = 0;

console.log('--- RUNNING EXHAUSTIVE STATE MACHINE TEST ---');

for (const from of ALL_STATES) {
  for (const to of ALL_STATES) {
    let shouldPass = false;
    // same state is always allowed in assertion
    if (from === to) shouldPass = true;
    else {
      const allowed: Record<string, string[]> = {
        partner_assigned: ['arrived_pickup'],
        arrived_pickup: ['picked_up'],
        picked_up: ['out_for_delivery'],
        out_for_delivery: ['nearby', 'delivered'],
        nearby: ['delivered'],
        delivered: [],
      };
      shouldPass = allowed[from]?.includes(to);
    }

    try {
      assertValidTransition(from, to);
      if (!shouldPass) {
        console.error(`❌ FAILED: ${from} -> ${to} should have been rejected!`);
        failCount++;
      } else {
        passCount++;
      }
    } catch (err: any) {
      if (shouldPass) {
        console.error(`❌ FAILED: ${from} -> ${to} should have passed!`);
        failCount++;
      } else if (err instanceof InvalidStateTransitionError && err.message.includes(from) && err.message.includes(to)) {
        passCount++;
      } else {
        console.error(`❌ FAILED: ${from} -> ${to} rejected but wrong error format: ${err.message}`);
        failCount++;
      }
    }
  }
}

if (failCount === 0) {
  console.log(`✅ SUCCESS: All ${passCount} transition pairs tested successfully.`);
  process.exit(0);
} else {
  console.error(`❌ FAILURE: ${failCount} transition tests failed.`);
  process.exit(1);
}
