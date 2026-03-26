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

        // Create enrollment records for each line item (course product)
        for (const lineItem of order.line_items) {
          const productTitle = lineItem.title;
          const parsed = parseCourseTitle(productTitle);

          if (!parsed) continue; // Skip non-course products (merchandise, etc.)

          // Check if enrollment already exists
          const existingEnrollment = db.prepare(`
            SELECT id FROM iscrizioni WHERE studente_id = ? AND shopify_order_id = ? AND corso_nome = ?
          `).get(user.id, String(order.id), productTitle);

          if (!existingEnrollment) {
            db.prepare(`
              INSERT INTO iscrizioni (id, studente_id, corso_nome, tipo_corso, citta, data_corso, shopify_order_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuid(), user.id, productTitle, parsed.tipo, parsed.citta, parsed.data, String(order.id));

            logger.info('Created enrollment', { email, corso: productTitle, tipo: parsed.tipo, citta: parsed.citta });
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
 * Parse a Shopify product title to extract course type and city.
 * Examples:
 *   "Corso di Sake Sommelier Certificato - Aprile 2025, Milano"
 *     → { tipo: 'certificato', citta: 'Milano', data: 'Aprile 2025' }
 *   "Corso di Sake Sommelier Introduttivo - Marzo 2025, Roma"
 *     → { tipo: 'introduttivo', citta: 'Roma', data: 'Marzo 2025' }
 *   "Aromi del sake - Canvas" → null (not a course)
 */
function parseCourseTitle(title) {
  if (!title) return null;

  const lower = title.toLowerCase();

  // Must contain "corso" or "sommelier" to be a course product
  if (!lower.includes('corso') && !lower.includes('sommelier')) return null;

  // Skip merchandise or non-course items
  if (lower.includes('canvas') || lower.includes('poster') || lower.includes('puzzle') ||
      lower.includes('borraccia') || lower.includes('bottiglia')) return null;

  // Determine course type
  let tipo = 'altro';
  if (lower.includes('certificato')) tipo = 'certificato';
  else if (lower.includes('introduttivo')) tipo = 'introduttivo';

  // Extract city: usually after the last comma
  let citta = null;
  let data = null;

  // Pattern: "... - Mese Anno, Città" or "... - Mese Anno, N date Online"
  const dashParts = title.split(' - ');
  if (dashParts.length >= 2) {
    const afterDash = dashParts.slice(1).join(' - ').trim();
    const commaParts = afterDash.split(',');

    if (commaParts.length >= 2) {
      citta = commaParts[commaParts.length - 1].trim();
      data = commaParts.slice(0, -1).join(',').trim();
    } else {
      // No comma, the whole part after dash might be just a date
      data = afterDash;
    }
  }

  // Clean up city: remove leading numbers/dates like "8 date Online" → "Online"
  if (citta) {
    const onlineMatch = citta.match(/online/i);
    if (onlineMatch) citta = 'Online';
  }

  return { tipo, citta, data };
}

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

  for (const product of shopifyProducts) {
    const title = product.title.toLowerCase();
    const handle = product.handle.toLowerCase();

    for (const course of courses) {
      const courseName = course.nome.toLowerCase();
      const courseType = course.tipo.toLowerCase();

      if (
        title.includes(courseName) ||
        title.includes(courseType) ||
        handle.includes(courseType)
      ) {
        courseMap.set(product.title, course.id);
        break;
      }
    }
  }

  return courseMap;
}

module.exports = router;
