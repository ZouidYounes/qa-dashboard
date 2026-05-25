import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get results for a test case
router.get('/cases/:caseId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const results = await db.all(
      'SELECT * FROM test_results WHERE test_case_id = ? ORDER BY run_at DESC LIMIT 50',
      [caseId]
    );
    results.forEach(r => {
      if (r.captured_events) r.captured_events = JSON.parse(r.captured_events);
      if (r.errors) r.errors = JSON.parse(r.errors);
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a test result
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { testCaseId, status, capturedEvents, errors, durationMs } = req.body;
    const id = uuidv4();

    await db.run(
      'INSERT INTO test_results (id, test_case_id, status, captured_events, errors, duration_ms) VALUES (?, ?, ?, ?, ?, ?)',
      [id, testCaseId, status, JSON.stringify(capturedEvents), JSON.stringify(errors), durationMs]
    );

    res.json({ id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
