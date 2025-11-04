<template>
    <div>
        <button
            v-if="!selectedImage"
            class="btn btn-primary btn-default-width"
            @click.prevent="show_modal = !show_modal"
        >
            画像を選択
        </button>
        <div v-if="selectedImage" class="selected-product-card">
            <div class="card-content" @click="show_modal = true">
                <img :src="selectedImage.url" :alt="selectedImage.altText || '選択された画像'" class="card-thumbnail" />
                <div class="card-info">
                    <h4>{{ selectedProductTitle }}</h4>
                    <p class="card-handle">{{ selectedImage.altText || '画像名なし' }}</p>
                </div>
            </div>
            <button class="copy-btn" @click.stop.prevent="copyImageLinkToClipboard" title="リンクをコピー">
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span v-if="showCopyFeedback" class="copy-feedback">コピーしました!</span>
            </button>
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
                    <h3>{{ currentStep === 'product' ? '商品を選択' : '画像を選択' }}</h3>
                    <button class="close-btn" @click="closeModal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Step 1: Product Selection -->
                    <div v-if="currentStep === 'product'" class="product-selection">
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
                                    <p class="product-images-count">
                                        {{ product.images ? product.images.edges.length : 0 }} 枚の画像
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Image Selection -->
                    <div v-if="currentStep === 'image'" class="image-selection">
                        <div class="back-button-container">
                            <button class="btn btn-secondary" @click="backToProducts">
                                ← 商品一覧に戻る
                            </button>
                        </div>
                        <div class="selected-product-info">
                            <h4>{{ selectedProductTitle }}</h4>
                            <p>この商品から画像を選択してください</p>
                        </div>
                        <div v-if="productImages.length === 0" class="no-results">
                            この商品には画像がありません
                        </div>
                        <div v-else class="images-grid">
                            <div
                                v-for="(image, index) in productImages"
                                :key="image.id"
                                class="image-item"
                                :class="{ selected: selectedImage && selectedImage.id === image.id }"
                                @click="selectImage(image)"
                            >
                                <img :src="image.url" :alt="image.altText || `画像 ${index + 1}`" />
                                <div v-if="image.altText" class="image-alt-text">{{ image.altText }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="currentStep === 'image'" class="modal-footer">
                    <button class="btn btn-primary" @click="confirmSelection" :disabled="!selectedImage">
                        選択を確定
                    </button>
                </div>
            </div>
        </div>
        <input type="hidden" :name="extConfig[0].name + '[1][1]'" v-model="selectedProductId" />
        <input type="hidden" :name="extConfig[0].name + '[1][2]'" v-model="selectedImageId" />
    </div>
</template>
<script>
import Vue from 'vue';
import axios from 'axios';
window.rcmsJS.vue.registerVM(Vue, rcms_js_config.publicPath); // eslint-disable-line
export default {
    components: {},
    props: {
        NUXT_SHOPIFY_STOREFRONT_DOMAIN: { type: String, default: '' },
        NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN: { type: String, default: '' },
        NUXT_SHOPIFY_API_VERSION: { type: String, default: '' },
        extConfig: { type: Array },
    },
    data() {
        return {
            show_modal: false,
            currentStep: 'product', // 'product' or 'image'
            searchQuery: '',
            products: [],
            productImages: [],
            searchTimeout: null,
            selectedProduct: null,
            selectedProductId: '',
            selectedProductTitle: '',
            selectedImage: null,
            selectedImageId: '',
            showCopyFeedback: false,
        };
    },
    created() {
        // Load initial image if provided
        if (this.extConfig && this.extConfig[0] && this.extConfig[0].value && this.extConfig[0].value[1]) {
            try {
                const productId = this.extConfig[0].value[1][1];
                const imageDataStr = this.extConfig[0].value[1][2];

                if (productId && imageDataStr) {
                    const imageData = JSON.parse(imageDataStr);
                    if (imageData.imageId) {
                        this.selectedProductId = productId;
                        this.selectedImageId = imageDataStr;
                        this.loadImageFromProduct(productId, imageData.imageId);
                    }
                }
            } catch (e) {
                console.error('Failed to parse initial value:', e);
            }
        }
    },
    methods: {
        async getShopifyData(query, variables = {}) {
            if (!this.NUXT_SHOPIFY_STOREFRONT_DOMAIN || !this.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
                return;
            }

            const url = `https://${this.NUXT_SHOPIFY_STOREFRONT_DOMAIN}/api/${this.NUXT_SHOPIFY_API_VERSION}/graphql.json`;

            const response = await axios.post(
                url,
                {
                    query,
                    variables,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Storefront-Access-Token': this.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
                    },
                }
            );

            if (response.data.errors) {
                console.error('Shopify Storefront API errors:', response.data.errors);
            } else {
                return response.data;
            }
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

            const query = `
                query searchProducts($query: String!) {
                    products(first: 20, query: $query) {
                        nodes {
                            id
                            title
                            handle
                            featuredImage {
                                url
                                altText
                            }
                            images(first: 250) {
                                edges {
                                    node {
                                        id
                                        url
                                        altText
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const variables = {
                query: this.searchQuery,
            };

            const result = await this.getShopifyData(query, variables);
            if (result && result.data && result.data.products) {
                this.products = result.data.products.nodes;
            }
        },
        selectProduct(product) {
            this.selectedProduct = product;
            this.selectedProductId = product.id;
            this.selectedProductTitle = product.title;

            // Extract images from the product
            if (product.images && product.images.edges) {
                this.productImages = product.images.edges.map(edge => edge.node);
            } else {
                this.productImages = [];
            }

            // Move to image selection step
            this.currentStep = 'image';
        },
        selectImage(image) {
            this.selectedImage = image;
        },
        confirmSelection() {
            if (this.selectedImage && this.selectedProductId) {
                // Store both product ID and image ID as JSON
                this.selectedImageId = JSON.stringify({
                    productId: this.selectedProductId,
                    imageId: this.selectedImage.id,
                });
                // Emit an event or handle the selection here
                this.show_modal = false;
            }
        },
        backToProducts() {
            this.currentStep = 'product';
            this.selectedImage = null;
            this.productImages = [];
        },
        closeModal() {
            this.show_modal = false;
            this.currentStep = 'product';
            this.searchQuery = '';
            this.products = [];
            this.productImages = [];
            this.selectedProduct = null;
            this.selectedImage = null;
        },
        removeSelection() {
            this.selectedImage = null;
            this.selectedProduct = null;
            this.selectedProductId = '';
            this.selectedProductTitle = '';
            this.selectedImageId = '';
        },
        async copyImageLinkToClipboard() {
            if (!this.selectedImage || !this.selectedImage.url) return;

            try {
                await navigator.clipboard.writeText(this.selectedImage.url);
                this.showCopyFeedback = true;

                // Hide feedback after 2 seconds
                setTimeout(() => {
                    this.showCopyFeedback = false;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        },
        async loadImageFromProduct(productId, imageId) {
            if (!productId || !imageId) return;

            const query = `
                query getProduct($id: ID!) {
                    node(id: $id) {
                        ... on Product {
                            id
                            title
                            images(first: 250) {
                                edges {
                                    node {
                                        id
                                        url
                                        altText
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const variables = {
                id: productId,
            };

            const result = await this.getShopifyData(query, variables);
            if (result && result.data && result.data.node) {
                const product = result.data.node;
                this.selectedProductId = product.id;
                this.selectedProductTitle = product.title;

                // Find the specific image
                if (product.images && product.images.edges) {
                    const imageNode = product.images.edges.find(edge => edge.node.id === imageId);
                    if (imageNode) {
                        this.selectedImage = imageNode.node;
                    }
                }
            }
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

.copy-btn {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    position: relative;
}

.copy-btn:hover {
    color: #0056b3;
    background: rgba(0, 123, 255, 0.1);
}

.copy-btn svg {
    width: 16px;
    height: 16px;
}

.copy-feedback {
    position: absolute;
    top: -30px;
    right: 0;
    background: #28a745;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
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

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
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
    margin: 0 0 4px 0;
    color: #666;
    font-size: 14px;
}

.product-images-count {
    margin: 0;
    color: #999;
    font-size: 13px;
}

.back-button-container {
    margin-bottom: 15px;
}

.btn-secondary {
    padding: 8px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.btn-secondary:hover {
    background: #5a6268;
}

.selected-product-info {
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
}

.selected-product-info h4 {
    margin: 0 0 5px 0;
    font-size: 18px;
}

.selected-product-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

.image-item {
    position: relative;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s;
    aspect-ratio: 1;
}

.image-item:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
}

.image-item.selected {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.3);
}

.image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.image-alt-text {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 8px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
