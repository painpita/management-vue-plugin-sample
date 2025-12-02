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
                    v-if="selectedProduct.featuredImage"
                    :src="selectedProduct.featuredImage.url"
                    :alt="selectedProduct.featuredImage.altText || selectedProduct.title"
                    class="card-thumbnail"
                />
                <div class="card-info">
                    <h4>{{ selectedProduct.title }}</h4>
                    <p class="card-handle">{{ selectedProduct.handle }}</p>
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
                            v-for="product in products"
                            :key="product.id"
                            class="product-item"
                            @click="selectProduct(product)"
                        >
                            <img
                                v-if="product.featuredImage"
                                :src="product.featuredImage.url"
                                :alt="product.featuredImage.altText || product.title"
                                class="product-image"
                            />
                            <div class="product-info">
                                <h4>{{ product.title }}</h4>
                                <p class="product-handle">{{ product.handle }}</p>
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
        extConfig: { type: Array },
    },
    data() {
        return {
            show_modal: false,
            searchQuery: '',
            products: [],
            searchTimeout: null,
            selectedProduct: null,
            selectedProductId: '',
        };
    },
    created() {
        // Load initial product if provided
        if (this.extConfig && this.extConfig[0] && this.extConfig[0].value) {
            this.selectedProductId = this.extConfig[0].value;
            this.loadProductById(this.extConfig[0].value);
        }
    },
    methods: {
        async fetchProducts(query) {
            if (!this.shopifyApiEndpoint) {
                return [];
            }

            try {
                const url = `${this.shopifyApiEndpoint}/${encodeURIComponent(query)}`;
                const response = await axios.get(url);

                // Handle new API format: { products: [{ product: {...} }], total: N }
                if (response.data && response.data.products && Array.isArray(response.data.products)) {
                    return response.data.products.map(item => {
                        const product = item.product;
                        return {
                            ...product,
                            images: this.transformImages(product.images),
                        };
                    });
                }

                // Fallback for single product format: { product: {...} }
                if (response.data && response.data.product) {
                    const product = response.data.product;
                    return [
                        {
                            ...product,
                            images: this.transformImages(product.images),
                        },
                    ];
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
            if (!this.searchQuery.trim()) {
                this.products = [];
                return;
            }

            this.products = await this.fetchProducts(this.searchQuery.trim());
        },
        selectProduct(product) {
            this.selectedProduct = product;
            this.selectedProductId = product.id;
            // You can emit an event or handle the selection here
            this.show_modal = false;
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
