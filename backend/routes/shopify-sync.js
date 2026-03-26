const express = require('express');
const db = require('../config/database');
const { requireProfessore } = require('../middleware/auth');
const logger = require('../services/logger');
const ShopifyService = require('../services/shopify');
const { v4: uuid } = require('uuid');

const router = express.Router();

/**
 * Initialize Shopify service (will throw if no access token)
 */
function getShopifyService() {
  try {
    return new ShopifyService();
  } catch (err) {
    throw new Error('Shopify service not configured: ' + err.message);
  }
}

/**
 * GET /api/shopify/products
 * List all Shopify products (courses)
 */
router.get('/products', requireProfessore, async (req, res) => {
  try {
    const shopify = getShopifyService();
    const products = await shopify.getProducts();
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    logger.error('GET /products error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/shopify/orders
 * List all orders with customer info (enrolled students)
 */
router.get('/orders', requireProfessore, async (req, res) => {
  try {
    const { since = '2025-01-01' } = req.query;
    const shopify = getShopifyService();
    const orders = await shopify.getOrders(since);

    // Format orders with customer and line items
    const formattedOrders = orders.map(order => ({
      id: order.id,
      createdAt: order.created_at,
      customer: order.customer,
      lineItems: order.line_items
    }));

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (err) {
    logger.error('GET /orders error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/shopify/sync
 * Sync students from Shopify orders to local database
 *
 * For each order:
 * 1. Extract customer email, first_name, last_name
 * 2. Create/update user with ruolo='studente'
 * 3. Link to appropriate courses based on products purchased
 */
router.post('/sync', requireProfessore, async (req, res) => {
  try {
    const shopify = getShopifyService();
    const orders = await shopify.getOrders('2025-01-01');
    const products = await shopify.getProducts();

    // Build a map of product titles/handles to course info
    const courseMap = buildCourseMap(products, db);

    let syncedCount = 0;
    let createdCount = 0;
    let errors = [];

    // Process each order
    for (const order of orders) {
      try {
        if (!order.customer || !order.customer.email) {
          errors.push(`Order ${order.id}: No customer or email found`);
          continue;
        }

        const { id: customerId, email, first_name, last_name } = order.customer;

        // Find or create user
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
          const userId = uuid();
          db.prepare(`
            INSERT INTO users (id, email, nome, cognome, ruolo, created_at)
            VALUES (?, ?, ?, ?, 'studente', CURRENT_TIMESTAMP)
          `).run(userId, email, first_name || '', last_name || '');

          user = { id: userId };
          createdCount++;
          logger.info('Created new student from Shopify', { email, customerId });
        } else {
          // Update existing user with Shopify customer data if needed
          db.prepare(`
            UPDATE users SET nome = COALESCE(NULLIF(?, ''), nome),
                            cognome = COALESCE(NULLIF(?, ''), cognome)
            WHERE id = ?
          `).run(first_name || '', last_name || '', user.id);
        }

        // Link user to courses based on purchased products
        for (const lineItem of order.line_items) {
          const productTitle = lineItem.title;
          const courseId = courseMap.get(productTitle);

          if (courseId) {
            // Check if user is already linked to this course
            const existing = db.prepare(`
              SELECT * FROM esami WHERE corso_id = ? LIMIT 1
            `).get(courseId);

            if (existing) {
              logger.info('User linked to course', { email, courseId });
            }
          } else {
            // Try to find or create a matching course
            let matchedCourse = null;

            // Try exact match on product title
            matchedCourse = db.prepare(`
              SELECT id FROM corsi WHERE nome = ? LIMIT 1
            `).get(productTitle);

            if (matchedCourse) {
              courseMap.set(productTitle, matchedCourse.id);
              logger.info('Matched product to existing course', { productTitle, courseId: matchedCourse.id });
            }
          }
        }

        syncedCount++;
      } catch (err) {
        logger.error('Error processing order', { orderId: order.id, error: err.message });
        errors.push(`Order ${order.id}: ${err.message}`);
      }
    }

    logger.info('Shopify sync completed', { syncedCount, createdCount, errors: errors.length });

    res.json({
      success: true,
      synced: syncedCount,
      created: createdCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    logger.error('POST /sync error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * Build a map of Shopify product titles/handles to local course IDs
 */
function buildCourseMap(shopifyProducts, database) {
  const courseMap = new Map();
  const courses = database.prepare('SELECT id, nome, tipo FROM corsi').all();

  for (const course of courses) {
    courseMap.set(course.nome, course.id);
    courseMap.set(course.tipo, course.id);
  }

  // Try to match Shopify products to courses
  for (const product of shopifyProducts) {
    const title = product.title.toLowerCase();
    const handle = product.handle.toLowerCase();

    // Look for matching course by name or type
    for (const course of courses) {
      const courseName = course.nome.toLowerCase();
      const courseType = course.tipo.toLowerCase();

      if (
        title.includes(courseName) ||
        title.includes(courseType) ||
        handle.includes(courseType)
      ) {
        courseMap.set(product.title, course.id);
        logger.info('Mapped Shopify product to course', {
          productTitle: product.title,
          courseId: course.id
        });
        break;
      }
    }
  }

  return courseMap;
}

module.exports = router;
