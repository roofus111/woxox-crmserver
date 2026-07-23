#!/bin/sh
set -e
# Volume mounts often arrive as root-owned; fix before dropping to app user.
mkdir -p /app/uploads/fileuploads /app/uploads/chat /app/data/wa-sessions
chown -R crmserver:crmserver /app/uploads /app/data 2>/dev/null || true
chmod -R u+rwX /app/uploads /app/data 2>/dev/null || true
exec su -s /bin/sh crmserver -c 'exec node index.js'
