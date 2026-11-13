import { createStorefrontClient } from '@/common/storefront';

/** Props shared by every page: the Kuroco field config (extConfig) and the Storefront API settings. */
export default {
    props: {
        extConfig: { type: Array, default: () => [] },
        shopifyStorefrontDomain: { type: String, default: '' },
        // PUBLIC Storefront access token only: it is readable by anyone who can open the admin screen.
        shopifyStorefrontAccessToken: { type: String, default: '' },
        shopifyApiVersion: { type: String, default: '' },
        // Names used by the previous ShopifyWysiwygEditor, accepted so existing field settings keep working.
        NUXT_SHOPIFY_STOREFRONT_DOMAIN: { type: String, default: '' },
        NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN: { type: String, default: '' },
        NUXT_SHOPIFY_API_VERSION: { type: String, default: '' },
    },
    computed: {
        storefront() {
            return createStorefrontClient({
                domain: this.shopifyStorefrontDomain || this.NUXT_SHOPIFY_STOREFRONT_DOMAIN,
                accessToken: this.shopifyStorefrontAccessToken || this.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
                apiVersion: this.shopifyApiVersion || this.NUXT_SHOPIFY_API_VERSION,
            });
        },
        fieldName() {
            return (this.extConfig[0] && this.extConfig[0].name) || '';
        },
        initialValue() {
            return this.extConfig[0] ? this.extConfig[0].value : undefined;
        },
    },
};
