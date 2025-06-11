# 🚀 Penta Subathon Timer API Documentation

## Timer Management Endpoints

### `GET /api/timer`
Get current timer state
```json
// Response
{
  "timeRemaining": 3600,
  "isActive": false,
  "settings": { /* timer settings */ },
  "lastUpdate": 1234567890
}
```

### `POST /api/timer/start`
Start the timer
```json
// Response
{
  "success": true,
  "message": "Timer started"
}
```

### `POST /api/timer/stop`
Stop the timer
```json
// Response
{
  "success": true,
  "message": "Timer stopped"
}
```

### `POST /api/timer/reset`
Reset timer to specified time
```json
// Request
{
  "time": 3600  // seconds, defaults to 3600
}

// Response
{
  "success": true,
  "message": "Timer reset"
}
```

### `POST /api/timer/add`
Manually add time to timer
```json
// Request
{
  "seconds": 45  // must be positive number
}

// Response
{
  "success": true,
  "message": "Added 45 seconds"
}
```

## Settings Endpoints

### `GET /api/settings`
Get current subscription time settings
```json
// Response
{
  "regularSubTime": 45,
  "tier2SubTime": 90,
  "tier3SubTime": 135,
  "primeSubTime": 45,
  "giftSubTime": 45,
  "timerSize": 0,
  "timerColor": "#60e9b9",
  "timerFont": "'Nunito', sans-serif",
  "timerShadowColor": "#000000",
  "timerShadowBlur": 4,
  "timerShadowOpacity": 0.3,
  "timerShadowX": 2,
  "timerShadowY": 2
}
```

### `POST /api/settings`
Update subscription time settings and timer styling
```json
// Request (all fields optional)
{
  "regularSubTime": 45,
  "tier2SubTime": 90,
  "tier3SubTime": 135,
  "primeSubTime": 45,
  "giftSubTime": 45,
  "timerSize": 120,
  "timerColor": "#60e9b9",
  "timerFont": "'Arial', sans-serif",
  "timerShadowColor": "#000000",
  "timerShadowBlur": 4,
  "timerShadowOpacity": 0.3,
  "timerShadowX": 2,
  "timerShadowY": 2
}

// Response
{
  "success": true,
  "message": "Settings updated",
  "settings": { /* updated settings */ }
}
```

## 🧪 Development/Testing Endpoints

### `POST /api/dev/simulate-sub`
Simulate any subscription event for testing
```json
// Request
{
  "username": "TestUser",      // default: "TestUser"
  "tier": "1",                 // "1", "2", "3", or "prime"
  "type": "sub",               // "sub", "resub", or "gift"
  "count": 1,                  // for gifts: number of subs gifted
  "recipient": "SomeUser",     // for single gifts: recipient name
  "months": 12                 // for resubs: months subscribed
}

// Response
{
  "success": true,
  "message": "Simulated sub for TestUser (Tier 1) - Added 45s",
  "data": {
    "type": "subscription",
    "username": "TestUser",
    "msgId": "sub",
    "subPlan": "1000",
    "tierName": "Tier 1",
    "timeAdded": 45,
    "subCount": 1,
    "subType": "subscription"
  }
}
```

### `POST /api/dev/simulate-gift-bomb`
Simulate a large gift bomb (10 subs by default)
```json
// Request
{
  "username": "GiftBomber",    // default: "GiftBomber"
  "tier": "1",                 // default: "1"
  "count": 10                  // default: 10
}

// Response - same structure as simulate-sub
```

### `POST /api/dev/simulate-random-sub`
Simulate a random subscription (useful for testing variety)
```json
// Request - no body needed

// Response - same structure as simulate-sub
// Randomly generates username, tier, type, and count
```

## WebSocket Events

Connect to `ws://localhost:3000` (or your domain) to receive real-time updates:

### Timer Events
```json
// Timer state changes
{
  "type": "timer_update",
  "timeRemaining": 3555,
  "isActive": true
}

// Time added to timer
{
  "type": "time_added",
  "timeRemaining": 3600,
  "isActive": true,
  "addedTime": 45,
  "previousTime": 3555
}

// Timer lifecycle
{
  "type": "timer_started|timer_stopped|timer_reset|timer_ended",
  "timeRemaining": 3600,
  "isActive": false
}
```

### Subscription Events
```json
// New subscription (includes all metadata)
{
  "type": "subscription",
  "username": "SomeUser",
  "msgId": "sub|resub|subgift",
  "subPlan": "1000|2000|3000|Prime",
  "tierName": "Tier 1|Tier 2|Tier 3|Prime",
  "timeAdded": 45,
  "subCount": 1,
  "subType": "subscription|resub|gift",
  "recipient": "RecipientUser",  // for gifts
  "months": 12                   // for resubs
}
```

### Timer Styling Events
```json
{
  "type": "timer_size_update",
  "size": 120
}

{
  "type": "timer_style_update",
  "style": {
    "timerColor": "#60e9b9",
    "timerFont": "'Arial', sans-serif",
    "timerShadowColor": "#000000",
    "timerShadowBlur": 4,
    "timerShadowOpacity": 0.3,
    "timerShadowX": 2,
    "timerShadowY": 2
  }
}
```

## Testing Examples

```bash
# Simulate a Tier 2 subscription
curl -X POST http://localhost:3000/api/dev/simulate-sub \
  -H "Content-Type: application/json" \
  -d '{"username": "CoolUser", "tier": "2", "type": "sub"}'

# Simulate someone gifting 5 Tier 1 subs
curl -X POST http://localhost:3000/api/dev/simulate-sub \
  -H "Content-Type: application/json" \
  -d '{"username": "Generous", "tier": "1", "type": "gift", "count": 5}'

# Simulate a 12-month resub
curl -X POST http://localhost:3000/api/dev/simulate-sub \
  -H "Content-Type: application/json" \
  -d '{"username": "Loyal", "tier": "1", "type": "resub", "months": 12}'

# Quick gift bomb test
curl -X POST http://localhost:3000/api/dev/simulate-gift-bomb

# Random subscription for variety testing
curl -X POST http://localhost:3000/api/dev/simulate-random-sub
```

## Error Responses
All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

## Key Notes
- Server runs on port 3000 by default
- WebSocket connection: `ws://localhost:3000`
- All timer values are in seconds
- Dev endpoints are perfect for testing without real Twitch events
- Subscription events now have proper metadata separation (timer vs subscription data)
- Timer styling updates are broadcast immediately to all connected clients