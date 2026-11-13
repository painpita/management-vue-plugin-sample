import { createStorefrontClient } from './storefront';

const productNode = (id, skus) => ({
    id,
    handle: id,
    title: id,
    images: { edges: [] },
    variants: { edges: skus.map(sku => ({ node: { sku, selectedOptions: [] } })) },
});

function mockFetch(responses) {
    global.fetch = jest.fn(() => {
        const { status = 200, body } = responses.shift();
        return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
    });
}

describe('createStorefrontClient', () => {
    const client = createStorefrontClient({ domain: 'https://shop.myshopify.com/', accessToken: 'token' });

    it('is not configured without domain or token', async () => {
        const empty = createStorefrontClient({ domain: '', accessToken: '' });
        expect(empty.isConfigured).toBe(false);
        await expect(empty.searchProducts('x')).rejects.toThrow('not configured');
    });

    it('posts to the Storefront endpoint with the token header', async () => {
        mockFetch([{ body: { data: { products: { edges: [{ node: productNode('p1', ['A']) }] } } } }]);
        const products = await client.searchProducts('  tee ');
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toBe('https://shop.myshopify.com/api/2025-10/graphql.json');
        expect(options.headers['X-Shopify-Storefront-Access-Token']).toBe('token');
        expect(JSON.parse(options.body).variables).toEqual({ query: 'tee', first: 12 });
        expect(products[0].variants).toEqual([{ sku: 'A', selectedOptions: [], image: null }]);
    });

    it('does not call the API for an empty query', async () => {
        global.fetch = jest.fn();
        expect(await client.searchProducts('  ')).toEqual([]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('findProductBySku only accepts a product that owns the exact SKU (search is fuzzy)', async () => {
        const search = { data: { products: { edges: [{ node: productNode('p1', ['SKU-1X']) }] } } };
        mockFetch([{ body: search }, { body: search }]);
        expect(await client.findProductBySku('SKU-1')).toBeNull();
        expect((await client.findProductBySku('SKU-1X')).id).toBe('p1');
    });

    it('getProductById ignores non-GIDs and returns null for unknown products', async () => {
        global.fetch = jest.fn();
        expect(await client.getProductById('SKU-1')).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();

        mockFetch([{ body: { data: { node: null } } }]);
        expect(await client.getProductById('gid://shopify/Product/9')).toBeNull();
    });

    it('throws on GraphQL errors and HTTP errors', async () => {
        mockFetch([{ body: { errors: [{ message: 'bad' }] } }, { status: 401, body: null }]);
        await expect(client.searchProducts('x')).rejects.toThrow('bad');
        await expect(client.searchProducts('x')).rejects.toThrow('HTTP 401');
    });
});
