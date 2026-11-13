import {
    buildProductResults,
    filterColorVariantsBySku,
    findColorVariantBySku,
    flattenConnection,
    getColorVariants,
    getCommonPrefix,
    normalizeProduct,
    parseOptionNames,
} from './products';

const COLOR_NAMES = parseOptionNames('Color, カラー');

const variant = (sku, color, size) => ({
    sku,
    selectedOptions: [
        ...(color ? [{ name: 'カラー', value: color }] : []),
        ...(size ? [{ name: 'Size', value: size }] : []),
    ],
    image: color ? { url: `https://cdn/${color}.jpg` } : null,
});

const product = normalizeProduct({
    id: 'gid://shopify/Product/1',
    handle: 'tee',
    title: 'Tee',
    featuredImage: { url: 'https://cdn/featured.jpg' },
    images: { edges: [{ node: { id: 'img1', url: 'https://cdn/1.jpg' } }, { node: { id: 'img2', src: 'old.jpg' } }] },
    variants: {
        edges: [
            { node: variant('1000000000002A____800S', 'Navy', 'S') },
            { node: variant('1000000000002A____800M', 'Navy', 'M') },
            { node: variant('1000000000002A____100S', 'White', 'S') },
            { node: variant('', 'Black', 'S') },
        ],
    },
});

describe('flattenConnection / normalizeProduct', () => {
    it('accepts edges, nodes, arrays and nothing', () => {
        expect(flattenConnection({ edges: [{ node: 1 }, { node: null }] })).toEqual([1]);
        expect(flattenConnection({ nodes: [1, 2] })).toEqual([1, 2]);
        expect(flattenConnection([1, null])).toEqual([1]);
        expect(flattenConnection(undefined)).toEqual([]);
    });

    it('flattens images and maps legacy image keys to url', () => {
        expect(product.images.map(i => i.url)).toEqual(['https://cdn/1.jpg', 'old.jpg']);
        expect(product.variants).toHaveLength(4);
    });
});

describe('colour variants', () => {
    it('groups sizes by colour and skips variants without SKU', () => {
        const colors = getColorVariants(product, COLOR_NAMES);
        expect(colors.map(c => [c.color, c.sku, c.code])).toEqual([
            ['Navy', '1000000000002A____800S', '1000000000002A____800'],
            ['White', '1000000000002A____100S', '1000000000002A____100S'],
        ]);
    });

    it('matches option names case-insensitively and returns [] without a colour option', () => {
        expect(getColorVariants(product, parseOptionNames('size'))).toHaveLength(2);
        expect(getColorVariants(product, parseOptionNames('Material'))).toEqual([]);
    });

    it('keeps only colours whose SKUs contain the query, or all if none match', () => {
        const colors = getColorVariants(product, COLOR_NAMES);
        expect(filterColorVariantsBySku(colors, '____800').map(c => c.color)).toEqual(['Navy']);
        expect(filterColorVariantsBySku(colors, 'tee').map(c => c.color)).toEqual(['Navy', 'White']);
    });

    it('resolves a stored SKU of any size to its colour', () => {
        expect(findColorVariantBySku(product, '1000000000002A____800M', COLOR_NAMES).color).toBe('Navy');
        expect(findColorVariantBySku(product, 'unknown', COLOR_NAMES)).toBeNull();
    });

    it('computes common prefixes', () => {
        expect(getCommonPrefix(['abc1', 'abc2'])).toBe('abc');
        expect(getCommonPrefix(['abc'])).toBe('abc');
        expect(getCommonPrefix([])).toBe('');
    });
});

describe('buildProductResults', () => {
    it('product mode: one result per product storing the GID', () => {
        const results = buildProductResults([product], { selectColorVariant: false, colorOptionNames: COLOR_NAMES });
        expect(results.map(r => [r.value, r.code])).toEqual([['gid://shopify/Product/1', 'tee']]);
    });

    it('colour mode: one result per colour storing a SKU', () => {
        const results = buildProductResults([product], {
            selectColorVariant: true,
            colorOptionNames: COLOR_NAMES,
            query: 'tee',
        });
        expect(results.map(r => [r.value, r.code, r.image.url])).toEqual([
            ['1000000000002A____800S', '1000000000002A____800', 'https://cdn/Navy.jpg'],
            ['1000000000002A____100S', '1000000000002A____100S', 'https://cdn/White.jpg'],
        ]);
    });

    it('colour mode: products without colours store their first SKU, or are unselectable without any', () => {
        const plain = normalizeProduct({ id: 'p2', handle: 'h2', variants: [variant('SKU-2'), variant('SKU-3')] });
        const noSku = normalizeProduct({ id: 'p3', handle: 'h3', variants: [variant('')] });
        const results = buildProductResults([plain, noSku], {
            selectColorVariant: true,
            colorOptionNames: COLOR_NAMES,
        });
        expect(results.map(r => [r.value, r.code])).toEqual([
            ['SKU-2', 'SKU-2'],
            [null, 'h3'],
        ]);
    });
});
