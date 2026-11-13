import { isProductGid, normalizeProduct, productHasSku } from './products';

export const DEFAULT_API_VERSION = '2025-10';

const PRODUCT_FIELDS = `
    id
    handle
    title
    featuredImage { id url altText }
    images(first: 100) { edges { node { id url altText } } }
    variants(first: 100) {
        edges { node { id sku selectedOptions { name value } image { id url altText } } }
    }
`;

const SEARCH_PRODUCTS = `
    query searchProducts($query: String!, $first: Int!) {
        products(first: $first, query: $query) { edges { node { ${PRODUCT_FIELDS} } } }
    }
`;

const PRODUCT_BY_ID = `
    query productById($id: ID!) {
        node(id: $id) { ... on Product { ${PRODUCT_FIELDS} } }
    }
`;

/** 'https://shop.myshopify.com/' => 'shop.myshopify.com' */
function normalizeDomain(domain) {
    return String(domain || '')
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '');
}

/**
 * Client for the Shopify Storefront API, called directly from the browser.
 * The token must be a PUBLIC Storefront access token: it is visible to anyone who can open the admin screen.
 *
 * Search notes (verified against the STG store):
 * - Storefront ignores the `sku:` search field, but variant SKUs are in the free-text index,
 *   so SKUs (or a colour-level SKU prefix) are searched as plain text.
 * - Free-text search is fuzzy: callers that need an exact SKU must check the variants (findProductBySku does).
 */
export function createStorefrontClient({ domain, accessToken, apiVersion } = {}) {
    const host = normalizeDomain(domain);
    const isConfigured = !!(host && accessToken);
    const url = `https://${host}/api/${apiVersion || DEFAULT_API_VERSION}/graphql.json`;

    async function request(query, variables = {}) {
        if (!isConfigured) {
            throw new Error('Shopify Storefront API is not configured (domain / access token).');
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': accessToken,
            },
            body: JSON.stringify({ query, variables }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body || body.errors) {
            const detail = body && body.errors ? JSON.stringify(body.errors) : `HTTP ${response.status}`;
            throw new Error(`Shopify Storefront API error: ${detail}`);
        }
        return body.data;
    }

    async function searchProducts(text, { first = 12 } = {}) {
        const query = String(text || '').trim();
        if (!query) return [];
        const data = await request(SEARCH_PRODUCTS, { query, first });
        return data.products.edges.map(edge => normalizeProduct(edge.node));
    }

    async function getProductById(id) {
        if (!isProductGid(id)) return null;
        const data = await request(PRODUCT_BY_ID, { id });
        return data.node && data.node.id ? normalizeProduct(data.node) : null;
    }

    /** The product owning exactly this variant SKU, or null. */
    async function findProductBySku(sku) {
        const products = await searchProducts(sku);
        return products.find(product => productHasSku(product, sku)) || null;
    }

    return { isConfigured, request, searchProducts, getProductById, findProductBySku };
}
