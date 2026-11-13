<template>
    <div class="shopify-wysiwyg-editor">
        <div class="editor-wrapper">
            <ChildWysiwyg
                v-if="isWysiwygLoaded"
                :name="fieldName"
                :value="editorContent"
                :options="wysiwygOptions"
                :upload-dir="uploadDir"
                :help-message="helpMessage"
                :is-loaded="isWysiwygLoaded"
                :activated="true"
                @input="editorContent = $event"
            />
            <div v-else class="loading-notice">
                <p>{{ wysiwygError || 'Loading WYSIWYG editor...' }}</p>
            </div>
        </div>

        <div class="shopify-selector-section">
            <label class="section-label">Shopify商品画像（リンクをコピーしてエディタに貼り付けます）</label>
            <ShopifyImageField
                :storefront="storefront"
                :value="image"
                button-label="Shopify画像を選択"
                @change="image = $event"
            />
        </div>

        <input type="hidden" :name="fieldName + '[1][1]'" :value="image ? image.productId : ''" />
        <input type="hidden" :name="fieldName + '[1][2]'" :value="imageData" />
    </div>
</template>

<script>
import Vue from 'vue';
import '@/common/rcms';
import RcmsI18n from '@/common/i18n/rcms-i18n.js';
import { globalState } from '@/common/global-state';
import { loadExtComponent } from '@/common/kurocoExtensions';
import storefrontMixin from '@/mixins/storefront';
import ChildWysiwyg from '@/components/ChildWysiwyg.vue';
import ShopifyImageField from '@/components/ShopifyImageField.vue';

// Kuroco's ExtWysiwyg relies on the translate() mixin: install it on this bundle's Vue and on the page's Vue.
Vue.use(RcmsI18n);
if (window.Vue && window.Vue !== Vue) {
    window.Vue.use(RcmsI18n);
}

function parseJson(value) {
    if (!value || typeof value !== 'string') return value || null;
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

/**
 * Kuroco WYSIWYG + Shopify image picker (the image link is copied into the editor by hand).
 * Stored value (same as PS_Shopify/ShopifyWysiwygEditor):
 *   [0] editor HTML, [1][1] product GID, [1][2] JSON {"productId","imageId"}
 */
export default {
    name: 'ShopifyWysiwygEditor',
    __translations: {},
    components: { ChildWysiwyg, ShopifyImageField },
    mixins: [storefrontMixin],
    props: {
        smarty_lang: { type: String, required: false },
        uploadDir: { type: String, default: '' },
        helpMessage: { type: String, default: '' },
    },
    data() {
        const stored = (this.extConfig[0] && this.extConfig[0].value) || {};
        const selection = stored[1] || {};
        const imageData = parseJson(selection[2]);
        return {
            editorContent: stored[0] || '',
            wysiwygOptions: { height: 400 },
            isWysiwygLoaded: false,
            wysiwygError: '',
            image:
                selection[1] && imageData && imageData.imageId
                    ? { productId: selection[1], imageId: imageData.imageId, imageUrl: '' }
                    : null,
        };
    },
    computed: {
        imageData() {
            return this.image ? JSON.stringify({ productId: this.image.productId, imageId: this.image.imageId }) : '';
        },
    },
    created() {
        globalState.siteLang = this.smarty_lang;
    },
    async mounted() {
        try {
            this.isWysiwygLoaded = await loadExtComponent('Wysiwyg');
            if (!this.isWysiwygLoaded) this.wysiwygError = 'WYSIWYG editor could not be loaded.';
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to load ExtWysiwyg:', e);
            this.wysiwygError = 'WYSIWYG editor could not be loaded.';
        }
    },
};
</script>

<style scoped>
.shopify-wysiwyg-editor {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.editor-wrapper {
    width: 100%;
}

.loading-notice {
    padding: 20px;
    text-align: center;
    color: #666;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.loading-notice p {
    margin: 0;
}

.shopify-selector-section {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.section-label {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin: 0;
}
</style>
