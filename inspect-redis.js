const { createClient } = require('redis');

async function inspectRedis() {
  const client = createClient({ 
    url: 'redis://default:dicM659ap6hRAhxhkVvIPaA3Abgfp73a@redis-14833.c239.us-east-1-2.ec2.cloud.redislabs.com:14833'
  });
  
  await client.connect();
  console.log('✅ Connected to Redis\n');

  // Get all keys
  const keys = await client.keys('*');
  console.log(`📊 Total keys: ${keys.length}\n`);

  // Group by type
  const rooms = keys.filter(k => k.startsWith('room:'));
  const history = keys.filter(k => k.startsWith('history:'));
  const stats = keys.filter(k => k.startsWith('stats:'));

  console.log(`🏠 Rooms: ${rooms.length}`);
  console.log(`📜 History: ${history.length}`);
  console.log(`📈 Stats: ${stats.length}\n`);

  // Show sample data
  if (rooms.length > 0) {
    console.log('Sample Room:', rooms[0]);
    const room = await client.get(rooms[0]);
    console.log(JSON.parse(room), '\n');
  }

  if (stats.length > 0) {
    console.log('Sample Stats:', stats[0]);
    const stat = await client.get(stats[0]);
    console.log(JSON.parse(stat), '\n');
  }

  if (history.length > 0) {
    console.log('Sample History:', history[0]);
    const matches = await client.lRange(history[0], 0, 2);
    console.log(`${matches.length} matches (showing first 3)`);
    matches.forEach((m, i) => console.log(`${i + 1}.`, JSON.parse(m)));
  }

  await client.quit();
}

inspectRedis().catch(console.error);
