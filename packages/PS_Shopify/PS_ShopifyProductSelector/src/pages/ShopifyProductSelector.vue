<template>
    <div>
        <button
            v-if="!selectedProduct"
            class="btn btn-primary btn-default-width"
            @click.prevent="show_modal = !show_modal"
        >
            商品を選択
        </button>
        <div v-if="selectedProduct" class="selected-product-card">
            <div class="card-content" @click="show_modal = true">
                <img
                    v-if="cardImage"
                    :src="cardImage.url"
                    :alt="cardImage.altText || selectedProduct.title"
                    class="card-thumbnail"
                />
                <div class="card-info">
                    <h4>{{ selectedProduct.title }}</h4>
                    <p v-if="selectedColorVariant" class="card-color">{{ selectedColorVariant.color }}</p>
                    <p class="card-handle">{{ cardCode }}</p>
                </div>
            </div>
            <button class="remove-btn" @click.stop="removeSelection" title="選択を削除">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </div>
        <div v-if="show_modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Shopify商品を選択</h3>
                    <button class="close-btn" @click="show_modal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-box">
                        <input
                            type="text"
                            v-model="searchQuery"
                            @input="handleSearchInput"
                            placeholder="商品を検索..."
                            class="search-input"
                        />
                    </div>
                    <div class="products-list">
                        <div v-if="products.length === 0 && searchQuery" class="no-results">
                            商品が見つかりませんでした
                        </div>
                        <div v-if="products.length === 0 && !searchQuery" class="no-results">
                            商品を検索するには入力を開始してください
                        </div>
                        <div
                            v-for="result in searchResults"
                            :key="result.key"
                            :class="['product-item', { 'product-item--disabled': !result.value }]"
                            @click="selectProduct(result)"
                        >
                            <img
                                v-if="result.image"
                                :src="result.image.url"
                                :alt="result.image.altText || result.product.title"
                                class="product-image"
                            />
                            <div class="product-info">
                                <h4>{{ result.product.title }}</h4>
                                <p v-if="result.colorVariant" class="product-color">
                                    {{ result.colorVariant.color }}
                                </p>
                                <p class="product-handle">{{ result.code }}</p>
                                <p v-if="!result.value" class="product-unselectable">SKU未設定のため選択できません</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <input type="hidden" :name="extConfig[0].name" v-model="selectedProductId" />
    </div>
</template>
<script>
import Vue from 'vue';
import axios from 'axios';
window.rcmsJS.vue.registerVM(Vue, rcms_js_config.publicPath); // eslint-disable-line
export default {
    name: 'ShopifyProductSelector',
    components: {},
    props: {
        shopifyApiEndpoint: { type: String, required: true },
        vercelProtectionBypass: { type: String, default: '' },
        // Optional Basic authentication for the product API (sent only when both are set)
        basicAuthUser: { type: String, default: '' },
        basicAuthPassword: { type: String, default: '' },
        extConfig: { type: Array },
        // When true, search results list one entry per product colour and a SKU is always stored
        // instead of the product GID (products without colours store their first SKU; products
        // without any SKU cannot be selected).
        selectColorVariant: { type: Boolean, default: false },
        // Comma-separated Shopify option names treated as "colour" (case-insensitive).
        colorOptionNames: { type: String, default: 'Color,Colour,カラー,色' },
    },
    data() {
        return {
            show_modal: false,
            searchQuery: '',
            products: [],
            // Query that produced `products` (searchQuery may change while a search is in flight)
            resultsQuery: '',
            searchTimeout: null,
            selectedProduct: null,
            selectedProductId: '',
        };
    },
    computed: {
        colorOptionNameList() {
            return this.colorOptionNames
                .split(',')
                .map(name => name.trim().toLowerCase())
                .filter(Boolean);
        },
        searchResults() {
            // `value` is what gets stored on selection; a null value marks the result as unselectable.
            // With colour selection, each product is listed once per colour (products without colours once)
            // and the value is always a SKU, never the product GID.
            return this.products.reduce((results, product) => {
                const base = { key: product.id, product, colorVariant: null, image: product.featuredImage };
                if (!this.selectColorVariant) {
                    results.push({ ...base, value: product.id, code: product.handle });
                    return results;
                }
                const colorVariants = this.filterColorVariantsBySku(this.getColorVariants(product), this.resultsQuery);
                if (colorVariants.length === 0) {
                    const sku = this.getFirstSku(product);
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
        },
        selectedColorVariant() {
            // Match by colour, so a stored SKU of any size of that colour still resolves
            if (!this.selectColorVariant || !this.selectedProduct) return null;
            const storedVariant = this.getVariants(this.selectedProduct).find(
                variant => variant.sku === this.selectedProductId
            );
            const color = storedVariant && this.getColor(storedVariant);
            return (color && this.getColorVariants(this.selectedProduct).find(cv => cv.color === color)) || null;
        },
        cardImage() {
            const variantImage =
                this.selectColorVariant && this.selectedColorVariant && this.selectedColorVariant.image;
            return variantImage || (this.selectedProduct && this.selectedProduct.featuredImage);
        },
        cardCode() {
            if (this.selectedColorVariant) return this.selectedColorVariant.code;
            // A stored SKU of a product without colours is shown as-is
            const isSku = this.selectedProductId && !this.selectedProductId.startsWith('gid://shopify/Product/');
            return isSku ? this.selectedProductId : this.selectedProduct.handle;
        },
    },
    created() {
        // Load initial product if provided.
        // The stored value is a product GID, or a variant SKU when it was saved with colour selection enabled.
        if (this.extConfig && this.extConfig[0] && this.extConfig[0].value) {
            const value = this.extConfig[0].value;
            this.selectedProductId = value;
            if (value.startsWith('gid://shopify/Product/')) {
                this.loadProductById(value);
            } else {
                this.loadProductBySku(value);
            }
        }
    },
    methods: {
        getAuthConfig() {
            const headers = {};
            if (this.vercelProtectionBypass) {
                headers['x-vercel-protection-bypass'] = this.vercelProtectionBypass;
            }
            if (this.basicAuthUser && this.basicAuthPassword) {
                // Encode as UTF-8 first, since btoa only accepts Latin-1
                const credentials = unescape(encodeURIComponent(`${this.basicAuthUser}:${this.basicAuthPassword}`));
                headers.Authorization = `Basic ${btoa(credentials)}`;
            }
            return Object.keys(headers).length ? { headers } : {};
        },
        async fetchProducts(query) {
            if (!this.shopifyApiEndpoint) {
                return [];
            }

            try {
                const url = `${this.shopifyApiEndpoint}?query=${encodeURIComponent(query)}&first=12`;
                const response = await axios.get(url, this.getAuthConfig());

                if (response.data && response.data.products && Array.isArray(response.data.products)) {
                    return response.data.products.map(product => {
                        return {
                            ...product,
                            images: this.transformImages(product.images),
                        };
                    });
                }

                return [];
            } catch (error) {
                console.error('Failed to fetch products:', error);
                return [];
            }
        },
        transformImages(imagesData) {
            // Transform from { edges: [{ node: {...} }] } to flat array
            if (imagesData && imagesData.edges && Array.isArray(imagesData.edges)) {
                return imagesData.edges.map(edge => edge.node);
            }
            // Already flat array or empty
            if (Array.isArray(imagesData)) {
                return imagesData;
            }
            return [];
        },
        handleSearchInput() {
            // Clear existing timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            // Set new timeout for 500ms
            this.searchTimeout = setTimeout(() => {
                this.searchProducts();
            }, 500);
        },
        async searchProducts() {
            const query = this.searchQuery.trim();
            if (!query) {
                this.products = [];
                this.resultsQuery = '';
                return;
            }

            const products = await this.fetchProducts(query);
            this.products = products;
            this.resultsQuery = query;
        },
        selectProduct(result) {
            // Products without any SKU cannot be selected in colour mode
            if (!result.value) return;
            this.selectedProduct = result.product;
            // Colour mode stores a SKU (the chosen colour's first size); otherwise the product GID
            this.selectedProductId = result.value;
            // You can emit an event or handle the selection here
            this.show_modal = false;
        },
        getVariants(product) {
            // Accept both GraphQL edges ({ edges: [{ node }] }) and flat arrays
            const variants = product && product.variants;
            if (variants && Array.isArray(variants.edges)) {
                return variants.edges.map(edge => edge.node).filter(Boolean);
            }
            return Array.isArray(variants) ? variants : [];
        },
        /**
         * One entry per colour (first variant with a SKU for that colour), in Shopify's variant order.
         * `skus` holds the SKUs of every size of that colour, and `code` their common prefix
         * (e.g. 1533507330127Y____002S / ...002M => 1533507330127Y____002).
         * Returns [] when the product has no colour option or the API does not return `selectedOptions`.
         */
        getColorVariants(product) {
            const byColor = new Map();
            this.getVariants(product).forEach(variant => {
                const color = this.getColor(variant);
                if (!color || !variant.sku) {
                    return;
                }
                if (byColor.has(color)) {
                    byColor.get(color).skus.push(variant.sku);
                    return;
                }
                byColor.set(color, {
                    color,
                    sku: variant.sku,
                    skus: [variant.sku],
                    image: variant.image || null,
                });
            });
            return Array.from(byColor.values()).map(colorVariant => ({
                ...colorVariant,
                code: this.getCommonPrefix(colorVariant.skus),
            }));
        },
        getFirstSku(product) {
            const variant = this.getVariants(product).find(v => v.sku);
            return variant ? variant.sku : null;
        },
        getCommonPrefix(values) {
            return values.reduce((prefix, value) => {
                let i = 0;
                while (i < prefix.length && prefix[i] === value[i]) i++;
                return prefix.slice(0, i);
            });
        },
        /**
         * When the query is part of some colours' SKUs (e.g. "1533507330127Y____002"), keep only those colours.
         * Otherwise (title search, or a code shared by every colour) all colours are kept.
         */
        filterColorVariantsBySku(colorVariants, query) {
            const needle = (query || '').toLowerCase();
            if (!needle) return colorVariants;
            const matching = colorVariants.filter(cv => cv.skus.some(sku => sku.toLowerCase().includes(needle)));
            return matching.length > 0 ? matching : colorVariants;
        },
        getColor(variant) {
            const colorOption = (variant.selectedOptions || []).find(({ name = '' }) =>
                this.colorOptionNameList.includes(name.trim().toLowerCase())
            );
            return colorOption ? colorOption.value : '';
        },
        async loadProductBySku(sku) {
            if (!sku) return;

            // The search is fuzzy, so only accept the product that actually owns this SKU
            const products = await this.fetchProducts(sku);
            const product = products.find(p => this.getVariants(p).some(variant => variant.sku === sku));

            if (product) {
                this.selectedProduct = product;
            }
        },
        async loadProductById(productId) {
            if (!productId) return;

            // Fetch product by ID
            const products = await this.fetchProducts(productId);
            const product = products.find(p => p.id === productId);

            if (product) {
                this.selectedProduct = product;
            }
        },
        removeSelection() {
            this.selectedProduct = null;
            this.selectedProductId = '';
        },
    },
};
</script>
<style scoped>
.btn-default-width {
    width: 120px;
}

.selected-product-card {
    display: inline-flex;
    align-items: center;
    margin-top: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #f9f9f9;
    transition: all 0.2s;
    max-width: 400px;
}

.selected-product-card:hover {
    background: #e9ecef;
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.card-content {
    display: flex;
    align-items: center;
    padding: 12px;
    flex: 1;
    cursor: pointer;
}

.card-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 16px;
}

.card-info {
    flex: 1;
}

.card-info h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 500;
}

.card-handle {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #000;
}

.modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.search-box {
    margin-bottom: 20px;
}

.search-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
}

.search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.products-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.no-results {
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: 16px;
}

.product-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.product-item:hover {
    background-color: #f5f5f5;
    border-color: #007bff;
}

.product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 16px;
}

.product-info {
    flex: 1;
}

.product-info h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 500;
}

.product-handle {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.product-item--disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.product-item--disabled:hover {
    background-color: transparent;
    border-color: #e0e0e0;
}

.product-unselectable {
    margin: 2px 0 0 0;
    color: #dc3545;
    font-size: 12px;
}

.card-color,
.product-color {
    margin: 0 0 2px 0;
    font-size: 14px;
    font-weight: 500;
}

.remove-btn {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.remove-btn:hover {
    color: #c82333;
    background: rgba(220, 53, 69, 0.1);
}

.remove-btn svg {
    width: 16px;
    height: 16px;
}
</style>
