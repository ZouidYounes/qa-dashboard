# QA Dashboard - Piano Event Testing

Automated QA testing dashboard with real-time Piano event tracking using Playwright browser automation.

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3001`

### Frontend Setup (in another terminal)

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## 📋 API Endpoints

### Test Suites
- `GET /api/tests/suites` - List all test suites
- `POST /api/tests/suites` - Create new test suite
- `GET /api/tests/suites/:suiteId/cases` - List test cases
- `POST /api/tests/suites/:suiteId/cases` - Create test case
- `GET /api/tests/cases/:caseId` - Get test case details
- `POST /api/tests/run` - Execute a test

### Results
- `GET /api/results/cases/:caseId` - Get test results
- `POST /api/results` - Save test result

### Demo
- `POST /api/demo/seed` - Seed demo test data

## 🧪 Test Definition Format

Each test case includes:
- **name**: Test name
- **url**: Page URL to test
- **expectedEvents**: Array of expected Piano events

### Example Test Case

```json
{
  "name": "Homepage Piano Events",
  "url": "https://example.com",
  "expectedEvents": [
    {
      "type": "pageView",
      "eventName": "page_view"
    },
    {
      "type": "engagement",
      "eventName": "user_interact"
    }
  ]
}
```

## 🎯 Test Execution Flow

1. **Setup**: Playwright launches a headless browser
2. **Inject**: Piano event listener is injected into the page
3. **Navigate**: Browser navigates to the test URL
4. **Wait**: System waits 3 seconds for Piano events to fire
5. **Capture**: All fired Piano events are captured
6. **Validate**: Captured events are compared against expected events
7. **Report**: Results (pass/fail) are displayed in the dashboard

## 📊 Test Results

Each test run provides:
- **status**: "pass" or "fail"
- **capturedEvents**: Array of actual Piano events fired
- **errors**: Validation errors and mismatches
- **durationMs**: Test execution time
- **validation**: Detailed event comparison results

### Event Object Structure

```javascript
{
  timestamp: "2026-05-25T13:00:00.000Z",
  type: "pageView",
  payload: {
    eventName: "page_view",
    // ... other Piano properties
  },
  rawArgs: [/* original arguments to tpq.track() */]
}
```

## 🛠️ Project Structure

```
qa-dashboard/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── db.js                  # SQLite database wrapper
│   ├── testRunner.js          # Playwright test executor
│   ├── routes/
│   │   ├── tests.js           # Test suite/case management
│   │   ├── results.js         # Results persistence
│   │   └── demo.js            # Demo data seeding
│   ├── package.json
│   ├── data.db                # SQLite database (auto-created)
│   └── .env                   # Environment config
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── App.css            # Dashboard styles
│   │   └── index.js           # React entry point
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## 🎨 Features

- ✅ Multi-suite test management
- ✅ Piano event capture via Playwright
- ✅ Event payload validation with deep comparison
- ✅ Pass/fail reporting
- ✅ Test history tracking (up to 50 latest results per test)
- ✅ Real-time dashboard with WebSocket support
- ✅ Detailed event inspection
- ✅ Error logging and debugging
- ✅ Demo test data seeding
- ✅ Responsive UI design

## 📝 Creating a Test Suite

### 1. Seed Demo Data

```bash
curl -X POST http://localhost:3001/api/demo/seed
```

### 2. Create Custom Suite

```bash
curl -X POST http://localhost:3001/api/tests/suites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Suite",
    "description": "Testing Piano events on my site"
  }'
```

### 3. Add Test Case

```bash
curl -X POST http://localhost:3001/api/tests/suites/{suiteId}/cases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product View Test",
    "url": "https://example.com/product/123",
    "expectedEvents": [
      {
        "type": "pageView",
        "eventName": "page_view"
      },
      {
        "type": "commerce",
        "eventName": "product_view",
        "productId": "123"
      }
    ]
  }'
```

### 4. Run Test from Dashboard

- Open http://localhost:3000
- Select your test suite from the sidebar
- Click "Run Test" on any test case
- View results immediately

## 🔍 Piano Event Matching

The system validates Piano events by checking:

1. **Event Type** - Matches the `type` field
2. **Event Name** - Matches the `eventName` in payload
3. **Custom Fields** - Any additional properties in expected event
4. **Event Count** - Total number of events matches

## 🐛 Debugging

### Backend Logs

The TestRunner logs all activity:
- Event capture attempts
- Navigation status
- Event counts
- Test status

### Browser Console

The injected script logs:
- `[Piano Event Captured]` - Each event intercepted
- `[Piano.track Event Captured]` - Alternative Piano tracking

### Results Inspection

In the dashboard, click:
- "Expected Events" - See what events you're expecting
- "Captured Events" - See what actually fired
- "Validation Errors" - See detailed mismatch information

## 📦 Dependencies

### Backend
- `express` - Web framework
- `playwright` - Browser automation
- `sqlite3` - Database
- `socket.io` - Real-time updates
- `cors` - Cross-origin requests
- `uuid` - Unique IDs

### Frontend
- `react` - UI framework
- `axios` - HTTP client
- `socket.io-client` - Real-time client

## 🚀 Deployment

### Docker Setup (Optional)

Build and run in containers for consistent environments.

### Environment Variables

```bash
# backend/.env
PORT=3001
NODE_ENV=production
```

## 📄 License

MIT

## 🤝 Support

For issues or questions, check the event validation details in test results or inspect the raw captured events.
