<template>
    <div class="shopify-image-selector">
        <ShopifyImageField :storefront="storefront" :value="image" @change="image = $event" />
        <input type="hidden" :name="fieldName + '[1][1]'" :value="image ? image.productId : ''" />
        <input type="hidden" :name="fieldName + '[1][2]'" :value="image ? image.imageUrl : ''" />
        <input type="hidden" :name="fieldName + '[1][3]'" :value="imageData" />
    </div>
</template>

<script>
import '@/common/rcms';
import storefrontMixin from '@/mixins/storefront';
import ShopifyImageField from '@/components/ShopifyImageField.vue';

function parseJson(value) {
    if (!value || typeof value !== 'string') return value || null;
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

/**
 * Stored value (same as PS_ShopifyImageSelector):
 *   [1][1] product GID, [1][2] image CDN URL, [1][3] JSON {"productId","imageId"}
 */
export default {
    name: 'ShopifyImageSelector',
    components: { ShopifyImageField },
    mixins: [storefrontMixin],
    data() {
        const stored = (this.extConfig[0] && this.extConfig[0].value && this.extConfig[0].value[1]) || {};
        const imageData = parseJson(stored[3]);
        return {
            image:
                stored[1] && imageData && imageData.imageId
                    ? { productId: stored[1], imageId: imageData.imageId, imageUrl: stored[2] || imageData.url || '' }
                    : null,
        };
    },
    computed: {
        imageData() {
            return this.image ? JSON.stringify({ productId: this.image.productId, imageId: this.image.imageId }) : '';
        },
    },
};
</script>
