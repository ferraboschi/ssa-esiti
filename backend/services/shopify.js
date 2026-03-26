const { SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN } = require('../config/env');
const logger = require('./logger');

const API_VERSION = '2026-01';
const BASE_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${API_VERSION}`;

/**
 * Shopify Admin API service
 * Reads access token from env var or from DB (shopify_tokens table)
 */
class ShopifyService {
  constructor() {
    this.accessToken = SHOPIFY_ACCESS_TOKEN || this._loadTokenFromDB();
    if (!this.accessToken) {
      throw new Error(
        'Nessun token Shopify configurato. ' +
        'Vai su /api/shopify/auth per completare il flusso OAuth.'
      );
    }
    this.baseUrl = BASE_URL;
  }

  /**
   * Load access token from DB (saved during OAuth callback)
   */
  _loadTokenFromDB() {
    try {
      const db = require('../config/database');
      const row = db.prepare(
        'SELECT access_token FROM shopify_tokens WHERE store = ? ORDER BY updated_at DESC LIMIT 1'
      ).get(SHOPIFY_STORE);
      return row ? row.access_token : null;
    } catch (err) {
      logger.error('Error loading Shopify token from DB', { error: err.message });
      return null;
    }
  }

  /**
   * Make authenticated request to Shopify API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Shopify API error', {
          status: response.status,
          endpoint,
          error
        });
        throw new Error(`Shopify API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return {
        data,
        linkHeader: response.headers.get('link')
      };
    } catch (err) {
      logger.error('Shopify request error', { endpoint, error: err.message });
      throw err;
    }
  }

  /**
   * Parse Link header for pagination
   */
  parseLinkHeader(linkHeader) {
    if (!linkHeader) return {};
    const links = {};
    const parts = linkHeader.split(',');
    for (const part of parts) {
      const section = part.split(';');
      const url = section[0].replace(/<(.*)>/, '$1').trim();
      const rel = section[1].match(/rel="(.*?)"/);
      if (rel) {
        links[rel[1]] = url;
      }
    }
    return links;
  }

  /**
   * Fetch all orders created since a given date
   */
  async getOrders(sinceDate = '2025-01-01') {
    const orders = [];
    let url = `/orders.json?status=any&created_at_min=${sinceDate}&limit=250&fields=id,created_at,customer,line_items`;

    try {
      while (url) {
        const result = await this.request(url);
        const pageOrders = result.data.orders || [];
        orders.push(...pageOrders);

        const links = this.parseLinkHeader(result.linkHeader);
        if (links.next) {
          url = links.next.replace(this.baseUrl, '');
        } else {
          url = null;
        }

        logger.info('Fetched orders page', {
          count: pageOrders.length,
          totalSoFar: orders.length,
          hasNext: !!links.next
        });
      }

      logger.info('All orders fetched', { total: orders.length });
      return orders;
    } catch (err) {
      logger.error('Error fetching orders', { error: err.message });
      throw err;
    }
  }

  /**
   * Fetch all customers
   */
  async getCustomers() {
    const customers = [];
    let url = '/customers.json?limit=250&fields=id,email,first_name,last_name';

    try {
      while (url) {
        const result = await this.request(url);
        const pageCustomers = result.data.customers || [];
        customers.push(...pageCustomers);

        const links = this.parseLinkHeader(result.linkHeader);
        if (links.next) {
          url = links.next.replace(this.baseUrl, '');
        } else {
          url = null;
        }

        logger.info('Fetched customers page', {
          count: pageCustomers.length,
          totalSoFar: customers.length,
          hasNext: !!links.next
        });
      }

      logger.info('All customers fetched', { total: customers.length });
      return customers;
    } catch (err) {
      logger.error('Error fetching customers', { error: err.message });
      throw err;
    }
  }

  /**
   * Fetch all products (courses)
   */
  async getProducts() {
    const products = [];
    let url = '/products.json?limit=250&fields=id,title,handle,vendor,product_type';

    try {
      while (url) {
        const result = await this.request(url);
        const pageProducts = result.data.products || [];
        products.push(...pageProducts);

        const links = this.parseLinkHeader(result.linkHeader);
        if (links.next) {
          url = links.next.replace(this.baseUrl, '');
        } else {
          url = null;
        }

        logger.info('Fetched products page', {
          count: pageProducts.length,
          totalSoFar: products.length,
          hasNext: !!links.next
        });
      }

      logger.info('All products fetched', { total: products.length });
      return products;
    } catch (err) {
      logger.error('Error fetching products', { error: err.message });
      throw err;
    }
  }

  /**
   * Fetch a single order with all details
   */
  async getOrder(orderId) {
    try {
      const result = await this.request(`/orders/${orderId}.json`);
      return result.data.order;
    } catch (err) {
      logger.error('Error fetching order', { orderId, error: err.message });
      throw err;
    }
  }
}

module.exports = ShopifyService;
