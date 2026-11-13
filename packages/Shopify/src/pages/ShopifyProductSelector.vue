<template>
    <div class="shopify-product-selector">
        <button v-if="!value" type="button" class="btn btn-primary" @click.prevent="showModal = true">
            商品を選択
        </button>
        <SelectedCard
            v-else
            :image="cardImage"
            :title="product ? product.title : value"
            :subtitle="selectedColorVariant ? selectedColorVariant.color : ''"
            :lines="product ? [cardCode] : []"
            :warning="loadWarning"
            @open="showModal = true"
            @remove="removeSelection"
        />
        <ShopifyModal v-if="showModal" title="Shopify商品を選択" @close="showModal = false">
            <ProductSearch :storefront="storefront" :build-results="buildResults" @select="selectResult" />
        </ShopifyModal>
        <input type="hidden" :name="fieldName" :value="value" />
    </div>
</template>

<script>
import '@/common/rcms';
import storefrontMixin from '@/mixins/storefront';
import ProductSearch from '@/components/ProductSearch.vue';
import SelectedCard from '@/components/SelectedCard.vue';
import ShopifyModal from '@/components/ShopifyModal.vue';
import {
    DEFAULT_COLOR_OPTION_NAMES,
    buildProductResults,
    findColorVariantBySku,
    isProductGid,
    parseOptionNames,
} from '@/common/products';

/**
 * Stores a product GID, or a variant SKU when `selectColorVariant` is on
 * (same stored values as PS_ShopifyProductSelector).
 */
export default {
    name: 'ShopifyProductSelector',
    components: { ProductSearch, SelectedCard, ShopifyModal },
    mixins: [storefrontMixin],
    props: {
        // When true, search results list one entry per product colour and a SKU is always stored instead of
        // the product GID (products without colours store their first SKU; products without any SKU can't be selected).
        selectColorVariant: { type: Boolean, default: false },
        // Comma-separated Shopify option names treated as "colour" (case-insensitive).
        colorOptionNames: { type: String, default: DEFAULT_COLOR_OPTION_NAMES },
    },
    data() {
        return {
            showModal: false,
            value: '',
            product: null,
            loadWarning: '',
        };
    },
    computed: {
        colorOptionNameList() {
            return parseOptionNames(this.colorOptionNames);
        },
        selectedColorVariant() {
            if (!this.selectColorVariant || !this.product) return null;
            return findColorVariantBySku(this.product, this.value, this.colorOptionNameList);
        },
        cardImage() {
            const variantImage = this.selectedColorVariant && this.selectedColorVariant.image;
            return variantImage || (this.product && this.product.featuredImage) || null;
        },
        cardCode() {
            if (this.selectedColorVariant) return this.selectedColorVariant.code;
            // A stored SKU of a product without colours is shown as-is
            return isProductGid(this.value) ? this.product.handle : this.value;
        },
    },
    created() {
        if (typeof this.initialValue === 'string' && this.initialValue) {
            this.value = this.initialValue;
            this.loadProduct(this.value);
        }
    },
    methods: {
        async loadProduct(value) {
            try {
                const product = isProductGid(value)
                    ? await this.storefront.getProductById(value)
                    : await this.storefront.findProductBySku(value);
                if (value !== this.value) return; // selection changed meanwhile
                this.product = product;
                if (!product) this.loadWarning = 'Shopifyで商品が見つかりません';
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                this.loadWarning = 'Shopifyから読み込めませんでした';
            }
        },
        buildResults(products, query) {
            return buildProductResults(products, {
                selectColorVariant: this.selectColorVariant,
                colorOptionNames: this.colorOptionNameList,
                query,
            }).map(result => ({
                ...result,
                title: result.product.title,
                subtitle: result.colorVariant ? result.colorVariant.color : '',
                disabled: !result.value,
                note: result.value ? '' : 'SKU未設定のため選択できません',
            }));
        },
        selectResult(result) {
            this.value = result.value;
            this.product = result.product;
            this.loadWarning = '';
            this.showModal = false;
        },
        removeSelection() {
            this.value = '';
            this.product = null;
            this.loadWarning = '';
        },
    },
};
</script>
