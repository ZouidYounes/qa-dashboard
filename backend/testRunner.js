import { chromium } from "playwright";

class TestRunner {
  async runTest(testCase, io = null) {
    const startTime = Date.now();
    let browser = null;
    const capturedEvents = [];
    const errors = [];
    const networkEvents = []; // Store network-intercepted events

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Log all network requests to debug
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('event') || url.includes('tpq') || url.includes('piano') || url.includes('s=')) {
          console.log('[DEBUG] Network Request:', url);
        }
      });

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('event') || url.includes('tpq') || url.includes('piano')) {
          console.log('[DEBUG] Network Response:', url, response.status());
        }
      });

      // Intercept ALL requests to see them
      await page.route('**/*', async (route) => {
        const request = route.request();
        const url = request.url();
        const method = request.method();
        
        // Log Piano-related requests
        if (url.includes('event') || url.includes('tpq') || url.includes('piano') || url.includes('s=')) {
          console.log('[INTERCEPT]', method, 'Piano Request:', url);
          
          try {
            const urlParams = new URL(url).searchParams;
            
            // Try URL parameters first
            const eventsParam = urlParams.get('events');
            if (eventsParam) {
              console.log('[INTERCEPT] Found events in URL');
              try {
                const events = JSON.parse(eventsParam);
                if (Array.isArray(events)) {
                  console.log('[INTERCEPT] Parsed', events.length, 'events from URL');
                  events.forEach((event, idx) => {
                    const pianoEvent = {
                      timestamp: new Date().toISOString(),
                      type: event.name || 'unknown',
                      payload: event,
                      source: 'network-url',
                    };
                    console.log(`[INTERCEPT Event ${idx}]`, JSON.stringify(pianoEvent));
                    networkEvents.push(pianoEvent);
                  });
                }
              } catch (e) {
                console.warn('[INTERCEPT] Parse error:', e.message);
              }
            }

            // Try POST body for Piano events
            if (method === 'POST') {
              try {
                const postData = request.postData();
                if (postData) {
                  console.log('[INTERCEPT] POST body:', postData.substring(0, 200));
                  
                  // Try JSON
                  try {
                    const jsonData = JSON.parse(postData);
                    if (jsonData.events && Array.isArray(jsonData.events)) {
                      console.log('[INTERCEPT] Found', jsonData.events.length, 'events in POST body');
                      jsonData.events.forEach((event, idx) => {
                        const pianoEvent = {
                          timestamp: new Date().toISOString(),
                          type: event.name || 'unknown',
                          payload: event,
                          source: 'network-post',
                        };
                        console.log(`[INTERCEPT Event ${idx}]`, JSON.stringify(pianoEvent));
                        networkEvents.push(pianoEvent);
                      });
                    }
                  } catch (e) {
                    // Not JSON, might be form data
                    console.log('[INTERCEPT] Not JSON, trying form parsing');
                  }
                }
              } catch (e) {
                console.warn('[INTERCEPT] Error reading POST:', e.message);
              }
            }
          } catch (e) {
            console.warn('[INTERCEPT] Error:', e.message);
          }
        }
        
        route.continue().catch(() => {});
      });

      // Inject Piano event listener for JavaScript function calls
      await page.addInitScript(() => {
        window.capturedPianoEvents = [];
        window.tpq = window.tpq || { track: () => {} };

        const originalTrack = window.tpq.track;

        window.tpq.track = function (...args) {
          const event = {
            timestamp: new Date().toISOString(),
            type: args[0] || "unknown",
            payload: args[1] || {},
            rawArgs: args,
            source: 'function',
          };
          window.capturedPianoEvents.push(event);
          console.log("[Piano Event Captured]", event);
          return originalTrack ? originalTrack.apply(this, args) : null;
        };

        // Also capture through window.piano if it exists
        if (window.piano && typeof window.piano.track === "function") {
          const originalPianoTrack = window.piano.track;
          window.piano.track = function (...args) {
            const event = {
              timestamp: new Date().toISOString(),
              type: args[0] || "unknown",
              payload: args[1] || {},
              rawArgs: args,
              source: 'function',
            };
            window.capturedPianoEvents.push(event);
            console.log("[Piano.track Event Captured]", event);
            return originalPianoTrack.apply(this, args);
          };
        }

        // Monitor all fetch calls for Piano events
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
          const url = String(args[0]);
          if (url.includes('event') || url.includes('tpq') || url.includes('s=')) {
            console.log('[Piano Fetch] Request to:', url);
          }
          return originalFetch.apply(this, args);
        };
      });

      // Set a longer timeout for page load
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      // Navigate to the test page
      console.log(`[TestRunner] Starting test: ${testCase.name}`);
      console.log(`[TestRunner] Navigating to: ${testCase.url}`);

      try {
        await page.goto(testCase.url, {
          waitUntil: "load",
          timeout: 30000,
        });
      } catch (navError) {
        console.warn(
          `[TestRunner] Navigation timeout or error: ${navError.message}`,
        );
        // Continue anyway - page may still have loaded partially
      }

      // Wait for potential Piano events to fire
      console.log("[TestRunner] Waiting for initial Piano events...");
      await page.waitForTimeout(2000);

      // Try to dismiss common popups (cookie consent, GDPR notices, modals)
      console.log("[TestRunner] Attempting to dismiss popups...");
      await this.dismissPopups(page);

      // Wait longer after popup dismissal for Piano events
      console.log("[TestRunner] Waiting for Piano events after popup dismissal...");
      await page.waitForTimeout(3000);

      // Capture events from JavaScript function hooks
      const jsEvents = await page.evaluate(() => {
        return window.capturedPianoEvents || [];
      });

      // Combine network and JS events
      capturedEvents.push(...networkEvents);
      capturedEvents.push(...jsEvents);
      
      console.log(`[TestRunner] Captured ${networkEvents.length} network events + ${jsEvents.length} JS events = ${capturedEvents.length} total`);

      // Validate events
      const expectedEvents = testCase.expected_events || [];
      const validation = this.validateEvents(capturedEvents, expectedEvents);

      await context.close();

      const durationMs = Date.now() - startTime;
      const status = validation.passed ? "pass" : "fail";

      const result = {
        status,
        capturedEvents,
        errors: validation.failed,
        durationMs,
        validation,
      };

      console.log(`[TestRunner] Test ${status}: ${testCase.name}`);

      if (io) {
        io.emit("test-result", result);
      }

      return result;
    } catch (error) {
      console.error(`[TestRunner] Error executing test: ${error.message}`);
      errors.push({
        type: "execution-error",
        message: error.message,
        stack: error.stack,
      });

      return {
        status: "fail",
        capturedEvents,
        errors,
        durationMs: Date.now() - startTime,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  validateEvents(captured, expected) {
    const failed = [];
    
    // Parse expected events if they're strings
    let parsedExpected = expected;
    if (typeof expected === 'string') {
      parsedExpected = JSON.parse(expected);
    } else if (Array.isArray(expected) && expected.length > 0 && typeof expected[0] === 'string') {
      parsedExpected = expected.map(e => typeof e === 'string' ? JSON.parse(e) : e);
    }

    console.log(`[VALIDATION] Checking if ${parsedExpected.length} expected events are in ${captured.length} captured events`);
    if (parsedExpected.length > 0) {
      console.log(`[VALIDATION] First captured event:`, JSON.stringify(captured[0]).substring(0, 300));
      console.log(`[VALIDATION] First expected event:`, JSON.stringify(parsedExpected[0]).substring(0, 300));
    }

    // For each expected event, find it in the captured events (order-agnostic)
    parsedExpected.forEach((expectedEvent, expectedIdx) => {
      // Try to find a matching captured event
      const matchingCapturedIdx = captured.findIndex((capturedEvent) => {
        const errors = this.compareEvents(expectedEvent, capturedEvent, expectedIdx);
        return errors.length === 0; // Perfect match if no errors
      });

      if (matchingCapturedIdx === -1) {
        // No perfect match found - check for partial match for better error message
        console.log(`[VALIDATION] Expected event ${expectedIdx} not found in captured events`);
        const bestMatchIdx = captured.findIndex((capturedEvent) => {
          return capturedEvent.type === expectedEvent.type && 
                 capturedEvent.payload?.name === expectedEvent.name;
        });

        if (bestMatchIdx !== -1) {
          // Found event with matching type/name but field differences
          const errors = this.compareEvents(expectedEvent, captured[bestMatchIdx], expectedIdx);
          failed.push(...errors);
        } else {
          // No event with matching type/name found
          failed.push({
            type: "missing-event",
            message: `Expected event type "${expectedEvent.type}" with name "${expectedEvent.name}" not found`,
            index: expectedIdx,
            expected: expectedEvent,
          });
        }
      }
    });

    return {
      passed: failed.length === 0,
      failed,
      summary: {
        total: parsedExpected.length,
        matched: parsedExpected.length - failed.filter((e) => e.type === "missing-event").length,
        errors: failed.length,
      },
    };
  }

  compareEvents(expected, captured, index) {
    const errors = [];

    // Ensure we have the right structure
    if (!captured || !captured.type) {
      errors.push({
        type: "structure-error",
        index,
        message: `Invalid captured event structure`,
        actual: captured,
      });
      return errors;
    }

    // Type check
    if (expected.type && captured.type !== expected.type) {
      errors.push({
        type: "type-mismatch",
        index,
        message: `Event type mismatch: expected "${expected.type}", got "${captured.type}"`,
        expected: expected.type,
        actual: captured.type,
      });
    }

    // Name check (in payload)
    if (expected.name) {
      const capturedName = captured.payload?.name;
      if (capturedName !== expected.name) {
        errors.push({
          type: "payload-mismatch",
          index,
          field: "name",
          message: `Event name mismatch: expected "${expected.name}", got "${capturedName}"`,
          expected: expected.name,
          actual: capturedName,
        });
      }
    }

    // Check any additional fields in expected (look in payload.data)
    for (const [key, value] of Object.entries(expected)) {
      if (["type", "name"].includes(key)) continue;

      // Check in payload.data first (where Piano puts custom fields)
      let capturedValue = captured.payload?.data?.[key];
      
      // Debug log for each field
      if (capturedValue === undefined) {
        console.log(`[DEBUG] Field "${key}" not found in payload.data for event ${index}`);
        console.log(`[DEBUG] Captured payload:`, JSON.stringify(captured.payload || {}).substring(0, 200));
      }
      
      if (capturedValue !== value) {
        errors.push({
          type: "payload-mismatch",
          index,
          field: key,
          message: `Field mismatch: expected ${key}="${value}", got "${capturedValue}"`,
          expected: value,
          actual: capturedValue,
        });
      }
    }

    return errors;
  }

  async dismissPopups(page) {
    // Priority: Accept/Agree buttons FIRST (these enable Piano tracking)
    const acceptButtonSelectors = [
      // French versions (Bouygues, etc.)
      'button:has-text("Tout accepter")',
      'button:has-text("tout accepter")',
      'button:has-text("Accepter tout")',
      'button:has-text("accepter tout")',
      'button:has-text("Accepter")',
      'button:has-text("Confirmer")',
      'button:has-text("Valider")',

      // English versions
      'button:has-text("Accept all")',
      'button:has-text("Accept All")',
      'button:has-text("I accept")',
      'button:has-text("Agree")',
      'button:has-text("OK")',

      // By attributes
      'button[aria-label*="Accept all"]',
      'button[aria-label*="Tout accepter"]',
      'button[data-testid*="accept"]',
      'button[class*="accept-all"]',
      'button[class*="acceptAll"]',
      'button[class*="accept"]',

      // Generic first button in popup
      '[role="dialog"] button:first-of-type',
      '[id*="cookie"] button:first-of-type',
      '[class*="cookie"] button:first-of-type',
      '[class*="gdpr"] button:first-of-type',
      '[class*="consent"] button:first-of-type',
    ];

    const closeButtonSelectors = [
      // Close/X buttons
      'button[aria-label*="close"]',
      'button[aria-label*="Close"]',
      'button[aria-label*="Fermer"]',
      '[class*="close-btn"]',
      '[class*="closeBtn"]',
      ".btn-close",
      ".close",
    ];

    try {
      // FIRST: Try to click "Accept All" / "Tout accepter" buttons
      console.log("[TestRunner] Looking for accept buttons...");
      for (const btnSelector of acceptButtonSelectors) {
        try {
          const buttons = await page.$$(btnSelector);
          for (const button of buttons) {
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
              console.log(
                `[TestRunner] Found and clicking accept button: ${btnSelector}`,
              );
              await button.click().catch(() => {});
              await page.waitForTimeout(1000); // Wait longer for tracking to activate
              return; // Exit after clicking accept
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // SECOND: If no accept button found, try close buttons
      console.log(
        "[TestRunner] No accept button found, trying close buttons...",
      );
      for (const btnSelector of closeButtonSelectors) {
        try {
          const buttons = await page.$$(btnSelector);
          for (const button of buttons) {
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
              console.log(
                `[TestRunner] Found and clicking close button: ${btnSelector}`,
              );
              await button.click().catch(() => {});
              await page.waitForTimeout(500);
              return;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // THIRD: Try Escape key as last resort
      console.log("[TestRunner] Trying Escape key...");
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
    } catch (error) {
      console.warn(`[TestRunner] Error dismissing popups: ${error.message}`);
      // Don't fail the test if popup dismissal fails
    }
  }
}

export default TestRunner;
