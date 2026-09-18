import { GPSSimulator } from './gpsSimulator';

async function runTest() {
  console.log('--- STARTING GPS SIMULATOR TEST ---');

  const startLoc = { lat: 0, lng: 0 };
  const endLoc = { lat: 10, lng: 10 };
  
  const updates: any[] = [];
  
  const sim = new GPSSimulator(10, (loc) => {
    updates.push(loc);
  });

  const route = sim.generateMockRoute(startLoc, endLoc, 4); 
  // 4 steps means 5 points: 0, 2.5, 5.0, 7.5, 10.0

  sim.start(route);

  // Wait for 100ms, which is plenty of time for 5 ticks at 10ms each
  await new Promise(r => setTimeout(r, 100));

  sim.stop();

  if (updates.length === 5) {
    console.log(`✅ PASS: GPS Simulator accurately emitted 5 ticks deterministically and cleanly shut down.`);
  } else {
    console.error(`❌ FAILED: Expected 5 updates, got ${updates.length}`);
    process.exit(1);
  }

  // Ensure no further updates happen
  const countAfterStop = updates.length;
  await new Promise(r => setTimeout(r, 50));
  
  if (updates.length !== countAfterStop) {
    console.error(`❌ FAILED: Simulator continued emitting after stop()`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: No updates occurred after stop()`);
  }
}

runTest().catch(console.error);
