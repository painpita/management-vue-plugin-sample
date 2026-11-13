<template>
    <div class="product-search">
        <div class="search-box">
            <input
                ref="input"
                type="text"
                v-model="query"
                @input="scheduleSearch"
                @keydown.enter.prevent="search"
                placeholder="商品名・SKUで検索..."
                class="search-input"
            />
        </div>
        <div class="products-list">
            <div v-if="!storefront.isConfigured" class="message message--error">
                Shopify Storefront APIの設定（ドメイン・アクセストークン）がありません
            </div>
            <div v-else-if="error" class="message message--error">検索に失敗しました: {{ error }}</div>
            <div v-else-if="loading" class="message">検索中...</div>
            <div v-else-if="!resultsQuery" class="message">商品を検索するには入力を開始してください</div>
            <div v-else-if="results.length === 0" class="message">商品が見つかりませんでした</div>
            <div
                v-for="result in results"
                :key="result.key"
                :class="['product-item', { 'product-item--disabled': result.disabled }]"
                @click="select(result)"
            >
                <img
                    v-if="result.image"
                    :src="result.image.url"
                    :alt="result.image.altText || result.title"
                    class="product-image"
                />
                <div class="product-info">
                    <h4>{{ result.title }}</h4>
                    <p v-if="result.subtitle" class="product-subtitle">{{ result.subtitle }}</p>
                    <p v-if="result.code" class="product-code">{{ result.code }}</p>
                    <p v-if="result.meta" class="product-meta">{{ result.meta }}</p>
                    <p v-if="result.note" class="product-note">{{ result.note }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const SEARCH_DEBOUNCE_MS = 500;

/** Default: one result per product, showing its handle. */
function defaultBuildResults(products) {
    return products.map(product => ({
        key: product.id,
        product,
        image: product.featuredImage,
        title: product.title,
        code: product.handle,
    }));
}

/**
 * Debounced Storefront product search. Emits `select` with the clicked result.
 * `buildResults(products, query)` maps products to results:
 * { key, image, title, subtitle?, code?, meta?, note?, disabled?, ...anything the parent needs back }.
 */
export default {
    name: 'ProductSearch',
    props: {
        storefront: { type: Object, required: true },
        buildResults: { type: Function, default: defaultBuildResults },
    },
    data() {
        return {
            query: '',
            products: [],
            resultsQuery: '',
            loading: false,
            error: '',
            timer: null,
            requestId: 0,
        };
    },
    computed: {
        results() {
            return this.buildResults(this.products, this.resultsQuery);
        },
    },
    mounted() {
        this.$refs.input.focus();
    },
    beforeDestroy() {
        clearTimeout(this.timer);
    },
    methods: {
        scheduleSearch() {
            clearTimeout(this.timer);
            this.timer = setTimeout(this.search, SEARCH_DEBOUNCE_MS);
        },
        async search() {
            clearTimeout(this.timer);
            const query = this.query.trim();
            // Responses can arrive out of order: only the latest request may update the list.
            const requestId = ++this.requestId;
            this.error = '';
            if (!query || !this.storefront.isConfigured) {
                this.products = [];
                this.resultsQuery = '';
                this.loading = false;
                return;
            }
            this.loading = true;
            try {
                const products = await this.storefront.searchProducts(query);
                if (requestId !== this.requestId) return;
                this.products = products;
                this.resultsQuery = query;
            } catch (e) {
                if (requestId !== this.requestId) return;
                // eslint-disable-next-line no-console
                console.error(e);
                this.error = e.message;
                this.products = [];
            } finally {
                if (requestId === this.requestId) this.loading = false;
            }
        },
        select(result) {
            if (!result.disabled) this.$emit('select', result);
        },
    },
};
</script>

<style scoped>
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

.message {
    text-align: center;
    padding: 40px 20px;
    color: #666;
    font-size: 16px;
}

.message--error {
    color: #dc3545;
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

.product-item--disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.product-item--disabled:hover {
    background-color: transparent;
    border-color: #e0e0e0;
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

.product-subtitle {
    margin: 0 0 2px 0;
    font-size: 14px;
    font-weight: 500;
}

.product-code {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.product-meta {
    margin: 4px 0 0 0;
    color: #999;
    font-size: 13px;
}

.product-note {
    margin: 2px 0 0 0;
    color: #dc3545;
    font-size: 12px;
}
</style>
