/**
 * Quick test: two users connect via socket, verify online status events.
 * Run: node scripts/test-online-status.js
 * Requires server on http://localhost:8000
 */
const { io } = require('socket.io-client');

const USER_A = '6723b73ce3bc2fcb385cdd1c'; // Kiran
const USER_B = '6723a5a5e3bc2fcb385cdca7'; // Sooraj
const URL = process.env.SOCKET_URL || 'http://localhost:8000';

function connectUser(userId, label) {
  return new Promise((resolve) => {
    const socket = io(URL, { transports: ['websocket'], reconnection: false });
    const events = [];

    socket.on('connect', () => {
      console.log(`[${label}] connected, registering...`);
      socket.emit('register', userId);
    });

    socket.on('online_users', (data) => {
      events.push({ type: 'online_users', data });
      console.log(`[${label}] online_users snapshot:`, data.userIds);
    });

    socket.on('user_status_change', (data) => {
      events.push({ type: 'user_status_change', data });
      console.log(`[${label}] status change:`, data.userId, '->', data.status);
    });

    setTimeout(() => resolve({ socket, events, label }), 1500);
  });
}

async function main() {
  console.log('Testing online status on', URL);

  const a = await connectUser(USER_A, 'UserA');
  const b = await connectUser(USER_B, 'UserB');

  const passASeesB = a.events.some(
    e => (e.type === 'online_users' && e.data.userIds.includes(USER_B))
      || (e.type === 'user_status_change' && e.data.userId === USER_B && e.data.status === 'online')
  );
  const passBSeesA = b.events.some(
    e => (e.type === 'online_users' && e.data.userIds.includes(USER_A))
      || (e.type === 'user_status_change' && e.data.userId === USER_A && e.data.status === 'online')
  );

  console.log('\n--- Results ---');
  console.log('UserA sees UserB online:', passASeesB ? 'PASS' : 'FAIL');
  console.log('UserB sees UserA online:', passBSeesA ? 'PASS' : 'FAIL');

  a.socket.disconnect();
  await new Promise(r => setTimeout(r, 1000));

  const bGotOffline = b.events.some(
    e => e.type === 'user_status_change' && e.data.userId === USER_A && e.data.status === 'offline'
  );
  console.log('UserB notified when UserA disconnects:', bGotOffline ? 'PASS' : 'FAIL');

  b.socket.disconnect();
  process.exit(passASeesB && passBSeesA && bGotOffline ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
