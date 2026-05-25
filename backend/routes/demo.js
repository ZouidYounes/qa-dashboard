import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Seed demo data
router.post('/seed', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Create demo suite
    const suiteId = uuidv4();
    await db.run(
      'INSERT INTO test_suites (id, name, description) VALUES (?, ?, ?)',
      [suiteId, 'Demo E-commerce Tests', 'Sample Piano event tracking tests for e-commerce site']
    );

    // Create demo test cases
    const testCases = [
      {
        name: 'Homepage Load',
        url: 'https://example.com',
        expectedEvents: [
          { type: 'pageView', eventName: 'page_view' },
          { type: 'engagement', eventName: 'page_interact' }
        ]
      },
      {
        name: 'Product Page View',
        url: 'https://example.com/products/item-1',
        expectedEvents: [
          { type: 'pageView', eventName: 'page_view' },
          { type: 'commerce', eventName: 'product_view', productId: 'item-1' }
        ]
      },
      {
        name: 'Cart Interaction',
        url: 'https://example.com/cart',
        expectedEvents: [
          { type: 'pageView', eventName: 'page_view' },
          { type: 'commerce', eventName: 'cart_view' },
          { type: 'engagement', eventName: 'interaction' }
        ]
      }
    ];

    for (const tc of testCases) {
      const caseId = uuidv4();
      await db.run(
        'INSERT INTO test_cases (id, suite_id, name, url, expected_events) VALUES (?, ?, ?, ?, ?)',
        [caseId, suiteId, tc.name, tc.url, JSON.stringify(tc.expectedEvents)]
      );
    }

    res.json({ 
      message: 'Demo data seeded successfully',
      suiteId,
      caseCount: testCases.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
