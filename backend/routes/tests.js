import express from "express";
import { v4 as uuidv4 } from "uuid";
import TestRunner from "../testRunner.js";

const router = express.Router();
const testRunner = new TestRunner();

// Get all test suites
router.get("/suites", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const suites = await db.all(
      "SELECT * FROM test_suites ORDER BY created_at DESC",
    );
    res.json(suites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new test suite
router.post("/suites", async (req, res) => {
  try {
    const { name, description } = req.body;
    const db = req.app.locals.db;
    const id = uuidv4();

    await db.run(
      "INSERT INTO test_suites (id, name, description) VALUES (?, ?, ?)",
      [id, name, description],
    );

    res.json({ id, name, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test cases for a suite
router.get("/suites/:suiteId/cases", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { suiteId } = req.params;
    const cases = await db.all(
      "SELECT * FROM test_cases WHERE suite_id = ? ORDER BY created_at",
      [suiteId],
    );
    cases.forEach((tc) => {
      tc.expected_events = JSON.parse(tc.expected_events);
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a test case
router.post("/suites/:suiteId/cases", async (req, res) => {
  try {
    const { suiteId } = req.params;
    const { name, url, expectedEvents } = req.body;
    const db = req.app.locals.db;
    const id = uuidv4();

    await db.run(
      "INSERT INTO test_cases (id, suite_id, name, url, expected_events) VALUES (?, ?, ?, ?, ?)",
      [id, suiteId, name, url, JSON.stringify(expectedEvents)],
    );

    res.json({ id, name, url, expectedEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific test case
router.get("/cases/:caseId", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const testCase = await db.get("SELECT * FROM test_cases WHERE id = ?", [
      caseId,
    ]);
    if (testCase) {
      testCase.expected_events = JSON.parse(testCase.expected_events);
    }
    res.json(testCase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a test case
router.put("/cases/:caseId", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { caseId } = req.params;
    const { url, expected_events } = req.body;

    await new Promise((resolve, reject) => {
      db.db.run(
        "UPDATE test_cases SET url = ?, expected_events = ? WHERE id = ?",
        [url, JSON.stringify(expected_events), caseId],
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    res.json({
      id: caseId,
      url,
      expected_events,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run a test
router.post("/run", async (req, res) => {
  try {
    const { testCaseId } = req.body;
    const db = req.app.locals.db;
    const io = req.app.locals.io;

    // Get test case
    const testCase = await db.get("SELECT * FROM test_cases WHERE id = ?", [
      testCaseId,
    ]);

    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" });
    }

    testCase.expected_events = JSON.parse(testCase.expected_events);

    // Run test
    const result = await testRunner.runTest(testCase, io);

    // Save result
    const resultId = uuidv4();
    await db.run(
      "INSERT INTO test_results (id, test_case_id, status, captured_events, errors, duration_ms) VALUES (?, ?, ?, ?, ?, ?)",
      [
        resultId,
        testCaseId,
        result.status,
        JSON.stringify(result.capturedEvents),
        JSON.stringify(result.errors),
        result.durationMs,
      ],
    );

    res.json({
      id: resultId,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
