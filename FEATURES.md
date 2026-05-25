# 🎹 QA Dashboard - Complete Feature Documentation

## ✨ What You Get

A **production-ready QA Dashboard** for automated Piano event tracking with real-time reporting.

### Core Features

✅ **Browser Automation** - Playwright-based headless browser testing  
✅ **Piano Event Capture** - Intercepts and logs all Piano tracking events  
✅ **Event Validation** - Deep payload comparison against expected events  
✅ **Pass/Fail Reporting** - Clear test status with detailed error messages  
✅ **Real-time Dashboard** - Live results with WebSocket support  
✅ **Test History** - Tracks last 50 test runs per test case  
✅ **RESTful API** - Full control via HTTP endpoints  
✅ **Demo Data** - One-click test suite seeding  
✅ **Responsive UI** - Works on desktop and mobile

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│      Browser (Frontend - React)         │
│   • Test Suite Selection                │
│   • Run Test Buttons                    │
│   • Results Visualization               │
│   • Event Inspection                    │
└──────────────┬──────────────────────────┘
               │
               │ HTTP + WebSocket
               │
┌──────────────▼──────────────────────────┐
│    Express Server (Backend - Node)      │
│   ├─ /api/tests - Test management      │
│   ├─ /api/results - Result persistence │
│   └─ /api/demo - Demo data seeding    │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────▼──────┐  ┌───▼──────┐
  │ Playwright│  │ SQLite DB │
  │Browser    │  │  Results  │
  │Instance   │  │ & Tests   │
  └───────────┘  └───────────┘
```

## 🚀 Quick Start

### Option 1: Automated Setup

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Seed Demo Data

Once both servers are running, either:

1. **Click the button in the UI** - "📌 Create Demo Suite" button in the sidebar
2. **Use curl:**
   ```bash
   curl -X POST http://localhost:3001/api/demo/seed
   ```

## 📊 Test Structure

### Test Suite
A collection of test cases grouped by project/module.

```json
{
  "id": "uuid",
  "name": "E-commerce Checkout",
  "description": "Tests for Piano events during checkout flow"
}
```

### Test Case
Individual test that navigates to a URL and validates Piano events.

```json
{
  "id": "uuid",
  "suite_id": "parent-suite-id",
  "name": "Product Page View",
  "url": "https://example.com/products/item-123",
  "expected_events": [
    {
      "type": "pageView",
      "eventName": "page_view"
    },
    {
      "type": "commerce",
      "eventName": "product_view",
      "productId": "item-123",
      "price": 99.99
    }
  ]
}
```

## 🧪 How Tests Work

1. **Setup** - Playwright launches headless browser with event listener injected
2. **Inject** - JavaScript hook captures all `tpq.track()` calls
3. **Navigate** - Browser navigates to test URL
4. **Wait** - System waits 3 seconds for events to fire (configurable)
5. **Capture** - All intercepted events are collected
6. **Validate** - Each captured event is compared to expected specification
7. **Report** - Results (pass/fail) displayed with detailed comparison

## 📋 API Reference

### Test Management

**Create Suite**
```bash
POST /api/tests/suites
Content-Type: application/json

{
  "name": "My Test Suite",
  "description": "Testing Piano events"
}
```

**List Suites**
```bash
GET /api/tests/suites
```

**Create Test Case**
```bash
POST /api/tests/suites/{suiteId}/cases
Content-Type: application/json

{
  "name": "Test Case Name",
  "url": "https://example.com/page",
  "expectedEvents": [
    { "type": "pageView", "eventName": "page_view" }
  ]
}
```

**List Test Cases**
```bash
GET /api/tests/suites/{suiteId}/cases
```

### Test Execution

**Run Test**
```bash
POST /api/tests/run
Content-Type: application/json

{
  "testCaseId": "uuid"
}

Response:
{
  "id": "result-uuid",
  "status": "pass" | "fail",
  "capturedEvents": [...],
  "errors": [...],
  "durationMs": 5230,
  "validation": {...}
}
```

### Results

**Get Test Results**
```bash
GET /api/results/cases/{testCaseId}

Response: Array of result objects (latest 50)
```

### Demo

**Seed Demo Data**
```bash
POST /api/demo/seed
```

## 🔍 Understanding Test Results

### Success Case

```json
{
  "id": "result-id",
  "status": "pass",
  "capturedEvents": [
    {
      "timestamp": "2026-05-25T13:00:00.000Z",
      "type": "pageView",
      "payload": { "eventName": "page_view" },
      "rawArgs": ["pageView", { "eventName": "page_view" }]
    }
  ],
  "errors": [],
  "durationMs": 3450,
  "validation": {
    "passed": true,
    "failed": [],
    "summary": {
      "total": 1,
      "matched": 1,
      "errors": 0
    }
  }
}
```

### Failure Case

```json
{
  "status": "fail",
  "errors": [
    {
      "type": "count-mismatch",
      "message": "Expected 2 events, got 1",
      "expected": 2,
      "actual": 1
    },
    {
      "type": "payload-mismatch",
      "index": 1,
      "field": "eventName",
      "message": "Event name mismatch: expected \"purchase\", got \"undefined\"",
      "expected": "purchase",
      "actual": "undefined"
    }
  ]
}
```

## 🎯 Event Matching Rules

The validation engine checks:

1. **Total Count** - Captured count must match expected count
2. **Event Type** - `type` field must match
3. **Event Name** - `eventName` in payload must match
4. **Custom Fields** - Any additional properties must match exactly
5. **Timestamp** - Recorded automatically (not validated)

## 🛠️ Customization

### Change Backend Port

Edit `backend/.env`:
```
PORT=3002
```

### Change Frontend Timeout

Edit `backend/testRunner.js` (line ~90):
```javascript
await page.waitForTimeout(5000);  // Wait 5 seconds instead of 3
```

### Add Custom Event Fields

Modify expected event in test case:
```json
{
  "type": "commerce",
  "eventName": "add_to_cart",
  "productId": "item-456",
  "price": 129.99,
  "currency": "USD",
  "customField": "custom-value"
}
```

## 📈 Database Schema

### test_suites
```sql
CREATE TABLE test_suites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### test_cases
```sql
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  expected_events TEXT NOT NULL,  -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suite_id) REFERENCES test_suites(id)
);
```

### test_results
```sql
CREATE TABLE test_results (
  id TEXT PRIMARY KEY,
  test_case_id TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'pass' or 'fail'
  captured_events TEXT,  -- JSON array
  errors TEXT,           -- JSON array
  run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
);
```

## 🐛 Troubleshooting

### No events captured

1. Check the page URL - is it actually loading?
2. Check Piano is loaded - inspect browser console
3. Check timeout - may need more than 3 seconds
4. Verify Piano is using `window.tpq.track()` method

### Test never completes

1. URL may not be responding - check with browser manually
2. Increase timeout in testRunner.js
3. Check browser console for JavaScript errors
4. Verify Playwright browsers are installed: `npx playwright install`

### Connection refused error

1. Backend not running? Check `npm start` in backend folder
2. Wrong port? Check backend/.env and React proxy in frontend/package.json
3. Firewall blocking? Try localhost vs 127.0.0.1

### Database locked

1. Close any other instances of the app
2. Delete `backend/data.db` and restart
3. Ensure no corrupted processes: `lsof | grep data.db` (macOS/Linux)

## 📦 Dependencies

### Backend
- `express` (4.18.2) - Web framework
- `playwright` (1.40.1) - Browser automation
- `sqlite3` (5.1.6) - Database
- `socket.io` (4.6.1) - Real-time communication
- `cors` (2.8.5) - Cross-origin support
- `uuid` (9.0.1) - ID generation

### Frontend
- `react` (18.2.0) - UI framework
- `axios` (1.6.2) - HTTP client
- `socket.io-client` (4.6.1) - Real-time client

## 🚢 Deployment

### Production Considerations

1. **Environment** - Set `NODE_ENV=production`
2. **Port** - Configure via environment variable
3. **Database** - Use persistent storage location
4. **Certificates** - Use HTTPS for production
5. **Scaling** - Consider queue system for many tests

### Docker Deployment (Optional)

Create `Dockerfile` in root:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install && cd backend && npm install && cd ../frontend && npm install
EXPOSE 3000 3001
CMD ["sh", "-c", "npm start --prefix backend & npm start --prefix frontend"]
```

Build and run:
```bash
docker build -t qa-dashboard .
docker run -p 3000:3000 -p 3001:3001 qa-dashboard
```

## 📊 Performance Notes

- **Test Duration**: Typically 3-5 seconds per test
- **Concurrent Tests**: Run sequentially to avoid port conflicts
- **Memory**: Each Playwright instance uses ~100-150MB
- **Storage**: Results database grows ~1KB per test result

## 🔄 WebSocket Events (Future)

The infrastructure supports real-time updates:
```javascript
// Listen for test results in real-time
socket.on('test-result', (result) => {
  console.log('Test completed:', result.status);
});
```

## 📝 License

MIT - Use freely, modify as needed

## 🤝 Support

- Check event validation details in test results
- Inspect captured events vs. expected in dashboard
- Review backend logs for navigation/execution errors
- Verify Piano integration on test URL

---

**Happy Testing! 🎉**
