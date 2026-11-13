/**
 * Pure helpers over Storefront API product data. No Vue, no network: unit-tested in products.spec.js.
 */

export const PRODUCT_GID_PREFIX = 'gid://shopify/Product/';

export const DEFAULT_COLOR_OPTION_NAMES = 'Color,Colour,カラー,色';

export function isProductGid(value) {
    return typeof value === 'string' && value.startsWith(PRODUCT_GID_PREFIX);
}

/** GraphQL connection ({ edges: [{ node }] } or { nodes: [] }) or plain array => array. */
export function flattenConnection(connection) {
    if (!connection) return [];
    if (Array.isArray(connection)) return connection.filter(Boolean);
    if (Array.isArray(connection.edges)) return connection.edges.map(edge => edge && edge.node).filter(Boolean);
    if (Array.isArray(connection.nodes)) return connection.nodes.filter(Boolean);
    return [];
}

/** Storefront returns `url`; the other keys only appear in values saved by older plugin versions. */
export function normalizeImage(image) {
    if (!image) return null;
    const url = image.url || image.src || image.originalSrc || image.original_src || '';
    return url ? { ...image, url } : null;
}

/** Flattens a raw Storefront product into { id, handle, title, featuredImage, images[], variants[] }. */
export function normalizeProduct(product) {
    if (!product) return null;
    return {
        ...product,
        featuredImage: normalizeImage(product.featuredImage),
        images: flattenConnection(product.images)
            .map(normalizeImage)
            .filter(Boolean),
        variants: flattenConnection(product.variants).map(variant => ({
            ...variant,
            image: normalizeImage(variant.image),
        })),
    };
}

export function getVariants(product) {
    return product ? flattenConnection(product.variants) : [];
}

export function productHasSku(product, sku) {
    return !!sku && getVariants(product).some(variant => variant.sku === sku);
}

export function getFirstSku(product) {
    const variant = getVariants(product).find(v => v.sku);
    return variant ? variant.sku : null;
}

/** 'Color, カラー' => ['color', 'カラー'] */
export function parseOptionNames(names) {
    return String(names || '')
        .split(',')
        .map(name => name.trim().toLowerCase())
        .filter(Boolean);
}

/** Value of the variant's colour option ('' when it has none). */
export function getColor(variant, colorOptionNames) {
    const option = ((variant && variant.selectedOptions) || []).find(({ name = '' }) =>
        colorOptionNames.includes(name.trim().toLowerCase())
    );
    return option ? option.value : '';
}

export function getCommonPrefix(values) {
    if (!values.length) return '';
    return values.reduce((prefix, value) => {
        let i = 0;
        while (i < prefix.length && prefix[i] === value[i]) i++;
        return prefix.slice(0, i);
    });
}

/**
 * One entry per colour (first variant with a SKU for that colour), in Shopify's variant order.
 * `skus` holds the SKUs of every size of that colour, and `code` their common prefix
 * (e.g. 1000000000001A____002S / ...002M => 1000000000001A____002).
 * Returns [] when the product has no colour option.
 */
export function getColorVariants(product, colorOptionNames) {
    const byColor = new Map();
    getVariants(product).forEach(variant => {
        const color = getColor(variant, colorOptionNames);
        if (!color || !variant.sku) return;
        if (byColor.has(color)) {
            byColor.get(color).skus.push(variant.sku);
            return;
        }
        byColor.set(color, { color, sku: variant.sku, skus: [variant.sku], image: variant.image || null });
    });
    return Array.from(byColor.values()).map(colorVariant => ({
        ...colorVariant,
        code: getCommonPrefix(colorVariant.skus),
    }));
}

/**
 * When the query is part of some colours' SKUs (e.g. "1000000000001A____002"), keep only those colours.
 * Otherwise (title search, or a code shared by every colour) all colours are kept.
 */
export function filterColorVariantsBySku(colorVariants, query) {
    const needle = (query || '').toLowerCase();
    if (!needle) return colorVariants;
    const matching = colorVariants.filter(cv => cv.skus.some(sku => sku.toLowerCase().includes(needle)));
    return matching.length > 0 ? matching : colorVariants;
}

/** Colour entry owning `sku` (any size of that colour), or null. */
export function findColorVariantBySku(product, sku, colorOptionNames) {
    const variant = getVariants(product).find(v => v.sku === sku);
    const color = variant && getColor(variant, colorOptionNames);
    return (color && getColorVariants(product, colorOptionNames).find(cv => cv.color === color)) || null;
}

/**
 * Search results for the product selector. `value` is what gets stored; a null value marks the result unselectable.
 * - Product mode: one result per product, value = product GID.
 * - Colour mode: one result per colour (products without colours once), value = a SKU, never the GID.
 */
export function buildProductResults(products, { selectColorVariant, colorOptionNames, query }) {
    return products.reduce((results, product) => {
        const base = { key: product.id, product, colorVariant: null, image: product.featuredImage };
        if (!selectColorVariant) {
            results.push({ ...base, value: product.id, code: product.handle });
            return results;
        }
        const colorVariants = filterColorVariantsBySku(getColorVariants(product, colorOptionNames), query);
        if (colorVariants.length === 0) {
            const sku = getFirstSku(product);
            results.push({ ...base, value: sku, code: sku || product.handle });
            return results;
        }
        colorVariants.forEach(colorVariant => {
            results.push({
                key: `${product.id}_${colorVariant.color}`,
                product,
                colorVariant,
                image: colorVariant.image || product.featuredImage,
                value: colorVariant.sku,
                code: colorVariant.code,
            });
        });
        return results;
    }, []);
}
