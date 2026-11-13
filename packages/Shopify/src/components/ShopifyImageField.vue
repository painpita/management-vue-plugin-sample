<template>
    <div class="shopify-image-field">
        <button v-if="!current" type="button" class="btn btn-primary" @click.prevent="openModal">
            {{ buttonLabel }}
        </button>
        <SelectedCard
            v-else
            :image="cardImage"
            :title="productTitle || current.productId"
            :lines="[cardImage && cardImage.altText ? cardImage.altText : '画像名なし']"
            :warning="loadWarning"
            :copy-text="current.imageUrl || (cardImage && cardImage.url) || ''"
            @open="openModal"
            @remove="clear"
        />

        <ShopifyModal v-if="showModal" :title="step === 'product' ? '商品を選択' : '画像を選択'" @close="closeModal">
            <ProductSearch
                v-if="step === 'product'"
                :storefront="storefront"
                :build-results="buildResults"
                @select="pickProduct"
            />
            <div v-else class="image-step">
                <button type="button" class="btn btn-secondary back-btn" @click="step = 'product'">
                    ← 商品一覧に戻る
                </button>
                <div class="picked-product">
                    <h4>{{ pickedProduct.title }}</h4>
                    <p>この商品から画像を選択してください</p>
                </div>
                <div v-if="pickedProduct.images.length === 0" class="message">この商品には画像がありません</div>
                <div v-else class="images-grid">
                    <div
                        v-for="(image, index) in pickedProduct.images"
                        :key="image.id"
                        :class="['image-item', { selected: pickedImage && pickedImage.id === image.id }]"
                        @click="pickedImage = image"
                    >
                        <img :src="image.url" :alt="image.altText || `画像 ${index + 1}`" />
                        <div v-if="image.altText" class="image-alt-text">{{ image.altText }}</div>
                    </div>
                </div>
            </div>
            <template v-if="step === 'image'" #footer>
                <button type="button" class="btn btn-primary" :disabled="!pickedImage" @click="confirm">
                    選択を確定
                </button>
            </template>
        </ShopifyModal>
    </div>
</template>

<script>
import ProductSearch from './ProductSearch.vue';
import SelectedCard from './SelectedCard.vue';
import ShopifyModal from './ShopifyModal.vue';

/**
 * Two-step picker (product, then one of its images) with the selected-image card.
 * `value` is { productId, imageId, imageUrl } or null; emits `change` with the same shape (or null).
 * How the value is stored in the form is up to the page.
 */
export default {
    name: 'ShopifyImageField',
    components: { ProductSearch, SelectedCard, ShopifyModal },
    props: {
        storefront: { type: Object, required: true },
        value: { type: Object, default: null },
        buttonLabel: { type: String, default: '画像を選択' },
    },
    data() {
        return {
            current: this.value && this.value.productId && this.value.imageId ? { ...this.value } : null,
            productTitle: '',
            image: null,
            loadWarning: '',
            showModal: false,
            step: 'product',
            pickedProduct: null,
            pickedImage: null,
        };
    },
    computed: {
        cardImage() {
            if (this.image) return this.image;
            // Until the product is loaded (or if it can't be), show the stored URL.
            return this.current && this.current.imageUrl ? { url: this.current.imageUrl } : null;
        },
    },
    created() {
        if (this.current) this.loadCurrent();
    },
    methods: {
        async loadCurrent() {
            const { productId, imageId } = this.current;
            try {
                const product = await this.storefront.getProductById(productId);
                const image = product && product.images.find(img => img.id === imageId);
                if (!product) {
                    this.loadWarning = 'Shopifyで商品が見つかりません';
                    return;
                }
                this.productTitle = product.title;
                if (image) this.image = image;
                else this.loadWarning = 'Shopifyで画像が見つかりません';
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                this.loadWarning = 'Shopifyから読み込めませんでした';
            }
        },
        buildResults(products) {
            return products.map(product => ({
                key: product.id,
                product,
                image: product.featuredImage,
                title: product.title,
                code: product.handle,
                meta: `${product.images.length} 枚の画像`,
            }));
        },
        openModal() {
            this.showModal = true;
            this.step = 'product';
        },
        closeModal() {
            this.showModal = false;
            this.pickedProduct = null;
            this.pickedImage = null;
        },
        pickProduct(result) {
            this.pickedProduct = result.product;
            this.pickedImage = null;
            this.step = 'image';
        },
        confirm() {
            this.productTitle = this.pickedProduct.title;
            this.image = this.pickedImage;
            this.loadWarning = '';
            this.current = {
                productId: this.pickedProduct.id,
                imageId: this.pickedImage.id,
                imageUrl: this.pickedImage.url,
            };
            this.$emit('change', { ...this.current });
            this.closeModal();
        },
        clear() {
            this.current = null;
            this.productTitle = '';
            this.image = null;
            this.loadWarning = '';
            this.$emit('change', null);
        },
    },
};
</script>

<style scoped>
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

.back-btn {
    margin-bottom: 15px;
}

.picked-product {
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
}

.picked-product h4 {
    margin: 0 0 5px 0;
    font-size: 18px;
}

.picked-product p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.message {
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: 16px;
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
