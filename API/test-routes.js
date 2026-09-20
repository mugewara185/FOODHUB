const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYWQ2MDg0ZWQwOTMwY2YyMzIwYjU5ZiIsInJvbGVzIjpbImFkbWluIiwiZGVsaXZlcnlfcGFydG5lciJdLCJlbWFpbCI6ImFkbWluMEBleGFtcGxlLmNvbSIsImlhdCI6MTc4OTg0ODE0OCwiZXhwIjoxNzg5ODUxNzQ4fQ.WzmQR8reRgOkEyLCcfUaV9wOZkyY6rY8HfyhvUmLgQ4';

async function run() {
  try {
    // 2. Test PATCH /api/delivery/partner/me/status
    console.log('Testing PATCH /api/delivery/partner/me/status');
    const patchRes = await fetch('http://localhost:5000/api/delivery/partner/me/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'available' })
    });
    
    const patchData = await patchRes.text();
    console.log(`PATCH Response (${patchRes.status}):`, patchData);

    // 3. Test GET /api/admin/delivery/fleet
    console.log('Testing GET /api/admin/delivery/fleet');
    const fleetRes = await fetch('http://localhost:5000/api/admin/delivery/fleet', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const fleetData = await fleetRes.text();
    console.log(`GET /fleet Response (${fleetRes.status}):`, fleetData.substring(0, 500) + '...');

  } catch (err) {
    console.error(err);
  }
}

run();
