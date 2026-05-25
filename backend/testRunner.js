import { chromium } from 'playwright';

class TestRunner {
  async runTest(testCase, io = null) {
    const startTime = Date.now();
    const browser = await chromium.launch();
    const context = await browser.createContext();
    const page = await context.newPage();
    
    const capturedEvents = [];
    const errors = [];

    // Inject Piano event listener
    await page.addInitScript(() => {
      if (window.tpq) {
        window.capturedPianoEvents = [];
        const originalTrack = window.tpq.track;
        window.tpq.track = function(...args) {
          window.capturedPianoEvents.push({
            timestamp: new Date().toISOString(),
            args: args
          });
          return originalTrack.apply(this, args);
        };
      }
    });

    try {
      // Navigate to the test page
      await page.goto(testCase.url, { waitUntil: 'networkidle' });
      
      // Wait for events to fire
      await page.waitForTimeout(2000);

      // Capture events
      const events = await page.evaluate(() => {
        return window.capturedPianoEvents || [];
      });

      capturedEvents.push(...events);

      // Validate events
      const expectedEvents = testCase.expected_events || [];
      const validation = this.validateEvents(events, expectedEvents);

      await browser.close();

      const durationMs = Date.now() - startTime;
      const status = validation.passed ? 'pass' : 'fail';

      const result = {
        status,
        capturedEvents,
        errors: validation.failed,
        durationMs,
        validation
      };

      if (io) {
        io.emit('test-result', result);
      }

      return result;
    } catch (error) {
      errors.push({
        type: 'execution-error',
        message: error.message,
        stack: error.stack
      });

      await browser.close();

      return {
        status: 'fail',
        capturedEvents,
        errors,
        durationMs: Date.now() - startTime
      };
    }
  }

  validateEvents(captured, expected) {
    const passed = expected.length === captured.length;
    const failed = [];

    if (!passed) {
      failed.push({
        type: 'count-mismatch',
        message: `Expected ${expected.length} events, got ${captured.length}`
      });
    }

    expected.forEach((expectedEvent, idx) => {
      if (idx < captured.length) {
        const capturedEvent = captured[idx];
        if (!this.eventsMatch(expectedEvent, capturedEvent)) {
          failed.push({
            type: 'payload-mismatch',
            index: idx,
            expected: expectedEvent,
            captured: capturedEvent
          });
        }
      }
    });

    return { passed: failed.length === 0, failed };
  }

  eventsMatch(expected, captured) {
    // Simple payload comparison - can be enhanced
    if (expected.type && captured.args[0] !== expected.type) return false;
    if (expected.event && !captured.args[1]?.event?.includes(expected.event)) return false;
    return true;
  }
}

export default TestRunner;
