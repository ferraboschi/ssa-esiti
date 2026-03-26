const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { SHOPIFY_STORE, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET } = require('../config/env');
const logger = require('../services/logger');
const { v4: uuid } = require('uuid');

const router = express.Router();

// Scopes we need: read orders, customers, products
const SCOPES = 'read_orders,read_customers,read_products';

/**
 * GET /api/shopify/auth
 * Start the Shopify OAuth flow.
 * Redirects admin to Shopify to authorise the app.
 */
router.get('/', (req, res) => {
  // Build the redirect URI dynamically from the incoming request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const redirectUri = `${protocol}://${host}/api/shopify/auth/callback`;

  // Create a nonce for security
  const nonce = crypto.randomBytes(16).toString('hex');

  // Store nonce in a cookie for verification later
  res.cookie('shopify_nonce', nonce, {
    httpOnly: true,
    secure: protocol === 'https',
    maxAge: 600000, // 10 minutes
    sameSite: 'lax'
  });

  const authUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_CLIENT_ID}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  logger.info('Starting Shopify OAuth', { redirectUri, store: SHOPIFY_STORE });

  res.redirect(authUrl);
});

/**
 * GET /api/shopify/auth/callback
 * Handle the OAuth callback from Shopify.
 * Exchange the authorization code for a permanent access token.
 */
router.get('/callback', async (req, res) => {
  const { code, shop, state, hmac } = req.query;

  if (!code) {
    logger.error('Shopify OAuth callback: missing code');
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>Errore OAuth Shopify</h2>
        <p>Codice di autorizzazione mancante. Riprova.</p>
        <a href="/api/shopify/auth">Riprova</a>
      </body></html>
    `);
  }

  // Verify HMAC if present (Shopify signs the callback URL)
  if (hmac) {
    const params = { ...req.query };
    delete params.hmac;
    const sortedKeys = Object.keys(params).sort();
    const message = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    const digest = crypto
      .createHmac('sha256', SHOPIFY_CLIENT_SECRET)
      .update(message)
      .digest('hex');

    if (digest !== hmac) {
      logger.error('Shopify OAuth callback: HMAC mismatch');
      return res.status(403).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>Errore di sicurezza</h2>
          <p>Verifica HMAC fallita.</p>
        </body></html>
      `);
    }
  }

  try {
    // Exchange the authorization code for a permanent access token
    const tokenUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/oauth/access_token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Shopify token exchange failed', {
        status: response.status,
        error: errText
      });
      return res.status(500).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>Errore scambio token</h2>
          <p>Shopify ha restituito un errore: ${response.status}</p>
          <a href="/api/shopify/auth">Riprova</a>
        </body></html>
      `);
    }

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    if (!accessToken) {
      logger.error('Shopify token exchange: no access_token in response', tokenData);
      return res.status(500).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>Errore</h2>
          <p>Token di accesso non ricevuto.</p>
        </body></html>
      `);
    }

    // Save token to database (upsert: update if store exists, insert if not)
    const existing = db.prepare('SELECT id FROM shopify_tokens WHERE store = ?').get(SHOPIFY_STORE);

    if (existing) {
      db.prepare(`
        UPDATE shopify_tokens
        SET access_token = ?, scope = ?, updated_at = CURRENT_TIMESTAMP
        WHERE store = ?
      `).run(accessToken, scope, SHOPIFY_STORE);
      logger.info('Shopify access token updated in DB', { store: SHOPIFY_STORE, scope });
    } else {
      db.prepare(`
        INSERT INTO shopify_tokens (id, store, access_token, scope)
        VALUES (?, ?, ?, ?)
      `).run(uuid(), SHOPIFY_STORE, accessToken, scope);
      logger.info('Shopify access token saved to DB', { store: SHOPIFY_STORE, scope });
    }

    // Show success page with redirect to dashboard
    res.send(`
      <html>
      <head>
        <meta charset="utf-8">
        <title>Shopify Connesso!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 60px 20px; background: #f6f6f7; }
          .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          h2 { color: #1a1a2e; margin-bottom: 16px; }
          .check { font-size: 48px; margin-bottom: 16px; }
          p { color: #666; line-height: 1.6; }
          .scope { background: #f0f0f0; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 13px; margin: 16px 0; }
          a { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #635BFF; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
          a:hover { background: #5046e5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="check">&#10004;</div>
          <h2>Shopify connesso con successo!</h2>
          <p>L'app SSA_ESITI è ora autorizzata ad accedere al tuo negozio Shopify.</p>
          <div class="scope">Scopes: ${scope || SCOPES}</div>
          <p>Puoi ora sincronizzare gli studenti dalla sezione Studenti.</p>
          <a href="/#/studenti">Vai agli Studenti</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error('Shopify OAuth callback error', { error: err.message, stack: err.stack });
    res.status(500).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>Errore</h2>
        <p>${err.message}</p>
        <a href="/api/shopify/auth">Riprova</a>
      </body></html>
    `);
  }
});

/**
 * GET /api/shopify/auth/status
 * Check if Shopify is connected (has a valid token)
 */
router.get('/status', (req, res) => {
  try {
    const row = db.prepare(
      'SELECT store, scope, updated_at FROM shopify_tokens WHERE store = ? ORDER BY updated_at DESC LIMIT 1'
    ).get(SHOPIFY_STORE);

    if (row) {
      res.json({ connected: true, store: row.store, scope: row.scope, updatedAt: row.updated_at });
    } else {
      res.json({ connected: false, authUrl: '/api/shopify/auth' });
    }
  } catch (err) {
    res.json({ connected: false, error: err.message, authUrl: '/api/shopify/auth' });
  }
});

module.exports = router;
