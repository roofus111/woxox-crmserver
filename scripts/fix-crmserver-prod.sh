#!/bin/bash
set -e
sudo chmod -R a+rX /opt/woxox/crmserver/modules/personalWhatsapp || true
sudo find /opt/woxox/crmserver/modules/personalWhatsapp -type d -exec chmod a+rx {} \; || true
sudo find /opt/woxox/crmserver/modules/personalWhatsapp -type f -exec chmod a+r {} \; || true
sudo node /tmp/patch-personal-wa.js
sudo cp /tmp/followUpController.js /opt/woxox/crmserver/controllers/followUpController.js
sudo cp /tmp/resolveUserCompany.js /opt/woxox/crmserver/utils/resolveUserCompany.js 2>/dev/null || true
sudo cp /tmp/ensureCompanyPlan.js /opt/woxox/crmserver/utils/ensureCompanyPlan.js 2>/dev/null || true
echo "bust-$(date +%s)" | sudo tee /opt/woxox/crmserver/.docker-bust >/dev/null
cd /opt/woxox/crm
sudo docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache crmserver
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --force-recreate --remove-orphans crmserver
sleep 12
sudo docker ps --filter name=crmserver --format '{{.Names}} {{.Status}}'
sudo docker logs --tail 30 woxox-crm-prod-crmserver-1
