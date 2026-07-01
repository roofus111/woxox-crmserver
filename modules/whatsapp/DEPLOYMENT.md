# WhatsApp Business Cloud API - Deployment Guide

## Prerequisites

- Meta Developer Account with WhatsApp Business API access
- MongoDB database (existing CRM connection)
- Redis instance (for BullMQ queues and caching)
- Public HTTPS URL for webhooks
- Node.js 18+

## Environment Variables

Add these to `crmserver/.env`:

```env
# WhatsApp Module
WHATSAPP_ENCRYPTION_KEY=your-32-char-minimum-secret-key
WHATSAPP_GRAPH_API_VERSION=v21.0

# Existing (required)
MONGODB_URI=mongodb://...
JWT_SECRET=...
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
```

## Meta Developer Setup

1. Create a Meta App at https://developers.facebook.com
2. Add **WhatsApp** product to your app
3. Configure a WhatsApp Business Account and phone number
4. Generate a **Permanent Access Token** with `whatsapp_business_messaging` permission
5. Note down:
   - App ID
   - App Secret
   - Business Account ID (WABA ID)
   - Phone Number ID

## Webhook Configuration

1. In Meta Developer Console → WhatsApp → Configuration
2. Set Callback URL: `https://your-api-domain.com/api/whatsapp/webhook`
3. Set Verify Token: use the token from CRM Settings → WhatsApp (or set your own before saving)
4. Subscribe to: `messages` field
5. Click **Verify and Save**

## CRM Configuration

1. Log in as Admin
2. Go to **Settings → WhatsApp**
3. Enter all Meta credentials
4. Enable **Auto Lead Creation** and **Auto Assignment** as needed
5. Click **Test API Connection**
6. Save settings

## API Endpoints

Base URL: `/api/whatsapp`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook` | Meta webhook verification |
| POST | `/webhook` | Incoming messages & status updates |
| GET | `/settings` | Get WhatsApp settings |
| PUT | `/settings` | Update settings |
| POST | `/settings/test` | Test API connection |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/messages` | Send message |
| POST | `/broadcasts` | Create broadcast |
| GET | `/reports` | Analytics dashboard |

Full Swagger docs: `https://your-api-domain.com/api-docs`

## Architecture

```
Frontend (Next.js)
    ↓ REST + Socket.IO
Express /api/whatsapp
    ↓
Services (WhatsApp API, Lead Creation, Messages, Webhooks)
    ↓
MongoDB Collections + Redis Cache + BullMQ Queues
    ↓
Meta WhatsApp Cloud API
```

## Testing Webhook Locally

Use ngrok or similar:

```bash
ngrok http 8000
```

Set webhook URL to `https://xxxx.ngrok.io/api/whatsapp/webhook`

## Sample API Requests

### Send Text Message

```bash
curl -X POST https://your-api.com/api/whatsapp/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Hello from CRM!"}'
```

### Create Broadcast

```bash
curl -X POST https://your-api.com/api/whatsapp/broadcasts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Campaign",
    "messageType": "text",
    "message": "Welcome to our university!",
    "sendNow": true,
    "filters": { "leadStatus": ["New"] }
  }'
```

## Permissions

| Role | Capabilities |
|------|-------------|
| admin | Full access |
| manager | Chats, broadcasts, templates, reports |
| user | View & reply to assigned chats |
| marketing | Broadcasts, campaigns, templates |

## Troubleshooting

- **Webhook not verifying**: Ensure verify token in Meta matches CRM settings exactly
- **Messages not sending**: Check access token permissions and phone number status
- **No real-time updates**: Verify Socket.IO URL in frontend env and CORS settings
- **Broadcasts stuck**: Ensure Redis is running for BullMQ workers
