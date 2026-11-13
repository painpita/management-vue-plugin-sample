<template>
    <td
        v-if="extConfig && isLoaded && config.parent && extOptions && extOptions.length > 0"
        class="js-expand"
        :class="distinguishClassName"
    >
        <dl>
            <!-- Category Selector -->
            <template v-if="parentCategories.length > 0">
                <dt>{{ config.parent.ext_title }} - Category</dt>
                <dd class="multi_dd">
                    <select
                        v-model="selectedParentCategory"
                        @change="onParentCategoryChange"
                        class="form-control w-auto"
                        style="margin-bottom: 8px"
                    >
                        <option value="">選択なし</option>
                        <option
                            v-for="(category, idx) in parentCategories"
                            :key="`parent_category_${idx}`"
                            :value="category"
                        >
                            {{ category }}
                        </option>
                    </select>
                </dd>
            </template>

            <ParentDropdown_Master
                v-if="parentCategories.length === 0 || selectedParentCategory"
                v-bind="{
                    ...config.parent,
                    extOptions,
                    extConfig,
                }"
                :debug="debug"
                :selectedCategory="selectedParentCategory"
                :class="`ext_item_${config.parent.ext_index}`"
                @change="(ids) => (selectedIDs = ids)"
                @changeMainId="(selectedId) => (selectedTopId = selectedId)"
            >
                <!-- ShopifyProductSelector injection when ProductsCarousel is selected -->
                <template v-if="isProductsCarouselSelected">
                    <!-- Product selector fields with add/remove buttons -->
                    <div class="product-selectors-container">
                        <div
                            v-for="(childConfig, index) in visibleProductSelectorConfigs"
                            :key="childConfig.no"
                            :class="`ext_item_${childConfig.ext_index}`"
                            class="product-selector-row"
                        >
                            <ShopifyProductSelector
                                :shopifyApiEndpoint="shopifyApiEndpoint"
                                :vercelProtectionBypass="vercelProtectionBypass"
                                :extConfig="[childConfig]"
                            />
                            <button
                                v-if="index > 0"
                                type="button"
                                class="btn btn-sm btn-danger product-selector-remove-btn"
                                @click.prevent="removeProductSelector(index)"
                                title="削除"
                            >
                                −
                            </button>
                            <button
                                v-if="index === visibleProductSelectorConfigs.length - 1 && canAddMoreProductSelectors"
                                type="button"
                                class="btn btn-sm btn-primary product-selector-add-btn"
                                @click.prevent="addProductSelector"
                                title="追加"
                            >
                                +
                            </button>
                        </div>
                        <!-- Show add button when no selectors visible yet but there are available configs -->
                        <div v-if="visibleProductSelectorConfigs.length === 0 && productSelectorConfigs.length > 0">
                            <button type="button" class="btn btn-sm btn-primary" @click.prevent="addProductSelector">
                                + 商品を追加
                            </button>
                        </div>
                    </div>
                    <!-- Non-product-selector fields render normally -->
                    <div
                        v-for="childConfig in nonProductSelectorConfigs"
                        :key="childConfig.no"
                        :class="`ext_item_${childConfig.ext_index}`"
                    >
                        <component
                            v-show="getIsActivated(childConfig)"
                            v-bind="{
                                ...getChildComponentProps(childConfig),
                                activated: getIsActivated(childConfig),
                                topics_group_id,
                                is_primary: is_primary,
                                isLoaded: isLoaded,
                                key: `comp-${childConfig.no}`,
                                topSelected: selectedTopId,
                            }"
                            v-bind:is="'div'"
                        />
                    </div>
                </template>

                <template v-else>
                    <div
                        v-for="childConfig in config.children"
                        :key="childConfig.no"
                        :class="`ext_item_${childConfig.ext_index}`"
                    >
                        <!-- eslint-disable-next-line vue/require-component-is -->
                        <component
                            v-show="getIsActivated(childConfig)"
                            v-bind="{
                                ...getChildComponentProps(childConfig),
                                activated: getIsActivated(childConfig),
                                topics_group_id,
                                is_primary: is_primary,
                                isLoaded: isLoaded,
                                key: `comp-${childConfig.no}`,
                                topSelected: selectedTopId,
                            }"
                            v-bind:is="'div'"
                        />
                    </div>
                </template>
            </ParentDropdown_Master>
        </dl>
    </td>
</template>

<script>
/* eslint-disable vue/no-unused-components */
import Axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

import ParentDropdown_Master from '@/components/ParentDropdown_Master.vue';

import Vue from 'vue';
import RcmsI18n from '@/common/i18n/rcms-i18n.js';

Vue.use(RcmsI18n);
if (window.Vue && window.Vue !== Vue) {
    window.Vue.use(RcmsI18n);
}

window.rcmsJS.vue.registerVM(Vue, rcms_js_config.publicPath.slice(0, -1)); // eslint-disable-line

import VueLocalStorage from 'vue-localstorage';
Vue.use(VueLocalStorage);

import store from '@/store';

import { EXT_TYPE, getExtTypeByValue } from '@/common/const.js';
import { globalState } from '@/common/global-state';

// Global object to track loaded and loading scripts
// This is needed because every loop of the same field will mount this component with different Vue instance
// and we need to make sure that the script is loaded only once
window.scriptLoadingTracker = window.scriptLoadingTracker || {};
// Same as above, but for kuroco core manifest
window.kurocoCoreManifestLoadingTracker = window.kurocoCoreManifestLoadingTracker || {};

const axios = setupCache(Axios);

export default {
    __translations: {}, // Initialize empty translations object to prevent errors
    name: 'ContentsGroupingExtension_Master',
    props: {
        smarty_lang: { type: String, required: false },
        is_primary: { type: Boolean, required: true },
        request: { type: Object, required: false },
        extConfig: { type: Array, required: true },
        topics_group_id: { type: Number, required: true },
        preserve_keys_endpoint: { type: String, default: null },
        debug: { type: Boolean, default: true },
        shopifyApiEndpoint: { type: String, default: '' },
        vercelProtectionBypass: { type: String, default: '' },
    },
    components: {
        ParentDropdown_Master,
        ShopifyProductSelector: () =>
            import(/* webpackChunkName: "ShopifyProductSelector" */ '@/components/ShopifyProductSelector.vue'),
        ChildImage: () => import(/* webpackChunkName: "ChildImage" */ '@/components/ChildImage.vue'),
        ChildFileManager: () => import(/* webpackChunkName: "ChildFileManager" */ '@/components/ChildFileManager.vue'),
        ChildText: () => import(/* webpackChunkName: "ChildText" */ '@/components/ChildText.vue'),
        ChildTextarea: () => import(/* webpackChunkName: "ChildTextarea" */ '@/components/ChildTextarea.vue'),
        ChildWysiwyg: () => import(/* webpackChunkName: "ChildWysiwyg" */ '@/components/ChildWysiwyg.vue'),
        ChildMultipleCheckbox: () =>
            import(/* webpackChunkName: "ChildMultipleCheckbox" */ '@/components/ChildMultipleCheckbox.vue'),
        ChildLink: () => import(/* webpackChunkName: "ChildLink" */ '@/components/ChildLink.vue'),
        ChildSelectbox: () => import(/* webpackChunkName: "ChildSelectbox" */ '@/components/ChildSelectbox.vue'),
        ChildMap: () => import(/* webpackChunkName: "ChildMap" */ '@/components/ChildMap.vue'),
        ChildRelationField: () =>
            import(/* webpackChunkName: "ChildRelationField" */ '@/components/ChildRelationField.vue'),
        ChildHtml: () => import(/* webpackChunkName: "ChildHtml" */ '@/components/ChildHtml.vue'),
        ChildDate: () => import(/* webpackChunkName: "ChildDate" */ '@/components/ChildDate.vue'),
        ChildCsvtable: () => import(/* webpackChunkName: "ChildCsvtable" */ '@/components/ChildCsvtable.vue'),
    },
    data() {
        return {
            EXT_TYPE,
            selectedIDs: [],
            selectedTopId: '',
            // in order to determine what the index number the current component is (within iteratable extension), see `mounted()`.
            distinguishClassName: 'js__contents-grouping-extension-master',
            extOptions: [],
            isLoaded: false,
            selectedParentCategory: '',
            parentCategories: [],
            visibleProductSelectorCount: 1,
        };
    },
    computed: {
        config() {
            const parent = this.extConfig.find((d) => d.ext_group_parent_ext_col === '');
            const children = this.extConfig
                .filter((d) => d.ext_group_parent_ext_col !== '')
                // sort by selectedIDs order, in order to display childrens as user specified.
                // e.g.) if user specified 90,1,25, then 90,1,25 order should be displayed (not 1,25,90).
                .sort((a, b) => {
                    const ids = this.selectedIDs.map((no) => `${no}`.padStart(2, '0'));
                    return ids.indexOf(a.no) - ids.indexOf(b.no);
                });

            return {
                parent,
                children,
            };
        },
        getIsActivated() {
            return (childConfig) => this.selectedIDs.map((no) => `${no}`.padStart(2, '0')).includes(childConfig.no);
        },
        getChildComponentProps() {
            return (childConfig) => {
                const extType = getExtTypeByValue(`${childConfig.ext_type}`);
                if (extType === undefined) {
                    // eslint-disable-next-line no-console
                    console.warn(`could not resolve specified extension type: ${childConfig.ext_type}`);
                    return {
                        is: 'template', // just for go through component rendering error without `is` prop.
                    };
                }
                return {
                    is: `Child${extType}`,
                    ...childConfig,
                };
            };
        },
        isProductsCarouselSelected() {
            if (!this.selectedTopId) return false;
            return this.selectedTopId === '39';
        },
        isProductSelectorField() {
            return (childConfig) => {
                // Only Text fields (ext_type 0) should become product selectors
                return `${childConfig.ext_type}` === `${EXT_TYPE.Text}`;
            };
        },
        activatedChildConfigs() {
            return this.config.children.filter((childConfig) => this.getIsActivated(childConfig));
        },
        productSelectorConfigs() {
            // Get all Text fields, then skip the first one (which is the title)
            const textFields = this.activatedChildConfigs.filter((childConfig) =>
                this.isProductSelectorField(childConfig)
            );
            return textFields.slice(1); // Skip the first Text field (title)
        },
        nonProductSelectorConfigs() {
            // Include non-Text fields AND the first Text field (title)
            const textFields = this.activatedChildConfigs.filter((childConfig) =>
                this.isProductSelectorField(childConfig)
            );
            const firstTextField = textFields[0];
            const nonTextFields = this.activatedChildConfigs.filter(
                (childConfig) => !this.isProductSelectorField(childConfig)
            );
            return firstTextField ? [firstTextField, ...nonTextFields] : nonTextFields;
        },
        visibleProductSelectorConfigs() {
            return this.productSelectorConfigs.slice(0, this.visibleProductSelectorCount);
        },
        canAddMoreProductSelectors() {
            return this.visibleProductSelectorCount < this.productSelectorConfigs.length;
        },
    },
    methods: {
        extractParentCategories() {
            if (!this.extOptions || this.extOptions.length === 0) {
                this.parentCategories = [];
                return;
            }

            const categoriesSet = new Set();
            this.extOptions.forEach(({ category }) => {
                if (category) {
                    categoriesSet.add(category);
                }
            });

            this.parentCategories = Array.from(categoriesSet).sort();

            // If there's already a selected value, set the category to match
            const selectedValue =
                (this.config.parent?.default_value !== undefined && this.config.parent?.default_value !== ''
                    ? this.config.parent?.default_value
                    : this.config.parent?.value) || '';

            if (selectedValue && this.parentCategories.length > 0) {
                const selectedOption = this.extOptions.find(
                    ({ key, raw, sourceKey }) =>
                        key === selectedValue ||
                        raw === selectedValue ||
                        sourceKey === selectedValue ||
                        raw?.startsWith(selectedValue)
                );

                if (selectedOption?.category) {
                    this.selectedParentCategory = selectedOption.category;
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ContentsGroupingExtension_Master] category restored', {
                            selectedValue,
                            category: selectedOption.category,
                        });
                    }
                }
            }
        },
        onParentCategoryChange() {
            // Reset selected IDs when category changes
            this.selectedIDs = [];
            this.selectedTopId = '';
            this.visibleProductSelectorCount = 1;
        },
        addProductSelector() {
            if (this.canAddMoreProductSelectors) {
                this.visibleProductSelectorCount++;
            }
        },
        removeProductSelector(index) {
            if (this.visibleProductSelectorCount > 1 && index > 0) {
                this.visibleProductSelectorCount--;
            }
        },
        /**
         * returns extConfig with merging its value as original value and stored value.
         * stored value would have been generated when POST the form then failed, it consists of submitted form values.
         * to restore and render that stored value in refreshed form, applies it as the default value.
         * @param {*} extConfig single extConfig
         */
        getExtConfigWithStoredValue(extConfig, iteratableSelfComponentIndex) {
            const name = extConfig.ext_col_nm;
            const value = extConfig.value;
            const restoredValue = this.request?.[name]?.[iteratableSelfComponentIndex];
            return {
                ...extConfig,
                value: restoredValue || value,
            };
        },
        getConfigsBy(extType) {
            return this.extConfig.filter(({ ext_type }) => `${ext_type}` === `${extType}`);
        },
        sortByExtOrderNumber(extA, extB) {
            return extB.ext_order_no - extA.ext_order_no;
        },
        async convertToExtOptions(ext_option = '', preserve_keys_endpoint = '') {
            const optionsFromParent = this.buildOptionsFromParentConfig();
            if (optionsFromParent.length > 0) {
                if (this.debug) {
                    // eslint-disable-next-line no-console
                    console.log('[ContentsGroupingExtension_Master] using parent options', {
                        sample: optionsFromParent[0],
                    });
                }
                return optionsFromParent;
            }

            const extOptions = ext_option
                .split('\n')
                .filter((v) => v)
                .map((opt) => opt.split('::'))
                .filter(([keyDef, label]) => keyDef && label)
                .map(([key, label]) => ({
                    key,
                    value: key.replace(/\d+-/, ''),
                    label,
                    raw: label,
                    sourceKey: key,
                }));

            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ContentsGroupingExtension_Master] convertToExtOptions input', {
                    extOptionCount: extOptions.length,
                    preserve_keys_endpoint,
                });
            }

            if (!preserve_keys_endpoint) {
                if (this.debug) {
                    // eslint-disable-next-line no-console
                    console.log('[ContentsGroupingExtension_Master] convertToExtOptions skip preserve key override', {
                        extOptions,
                    });
                }
                return extOptions;
            }

            const resp =
                this.preserve_keys_endpoint &&
                (await axios(preserve_keys_endpoint, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    withCredentials: true,
                }));
            const keyMapMasterList = resp?.data?.list || [];
            const resolvePreservedKey = (row = []) => {
                const [col0 = '', col1 = ''] = row;
                return (col0 || col1 || '').replace(/::.*/, '');
            };
            const resolvePreservedValue = (row = []) => {
                const [, col1 = '', col2 = ''] = row;
                return col1 || col2 || '';
            };

            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ContentsGroupingExtension_Master] key map preview', {
                    header: keyMapMasterList?.[0],
                    firstRow: keyMapMasterList?.[1],
                });
            }

            keyMapMasterList
                ?.filter((_, idx) => idx !== 0) // remove column title row
                ?.forEach((row, idx) => {
                    const preservedKey = resolvePreservedKey(row);
                    const preservedValue = resolvePreservedValue(row);
                    if (!preservedKey) {
                        if (this.debug) {
                            // eslint-disable-next-line no-console
                            console.log('[ContentsGroupingExtension_Master] skipped preserve row', { idx, row });
                        }
                        return;
                    }

                    const targetOption = extOptions.find((opt) => opt.key === preservedKey);
                    if (targetOption) {
                        targetOption.value = preservedValue;
                        if (this.debug) {
                            // eslint-disable-next-line no-console
                            console.log('[ContentsGroupingExtension_Master] override option value', {
                                idx,
                                row,
                                preservedKey,
                                preservedValue,
                            });
                        }
                    } else if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ContentsGroupingExtension_Master] no matching option for preserved key', {
                            idx,
                            row,
                            preservedKey,
                        });
                    }
                });

            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ContentsGroupingExtension_Master] convertToExtOptions result', { extOptions });
            }
            return extOptions;
        },
        buildOptionsFromParentConfig() {
            const parentOptions = this.config.parent?.options || {};
            const entries = Object.entries(parentOptions);
            if (entries.length === 0) {
                return [];
            }

            return entries
                .map(([rawKey, rawValue], idx) =>
                    this.normalizeParentOption(`${rawValue ?? rawKey}`, rawKey || `option_${idx}`, rawKey)
                )
                .filter(Boolean);
        },
        normalizeParentOption(definition = '', fallbackKey = '', sourceKey = '') {
            if (!definition) {
                return null;
            }

            const trimmedDefinition = definition.trim();
            const firstDashIndex = trimmedDefinition.indexOf('-');
            const category =
                firstDashIndex > -1 ? trimmedDefinition.substring(0, firstDashIndex).trim() : fallbackKey.trim();
            const remainder = firstDashIndex > -1 ? trimmedDefinition.substring(firstDashIndex + 1) : trimmedDefinition;
            const secondDashIndex = remainder.indexOf('-');
            const label =
                secondDashIndex > -1 ? remainder.substring(0, secondDashIndex).trim() : remainder.trim() || fallbackKey;
            const slugString = secondDashIndex > -1 ? remainder.substring(secondDashIndex + 1).trim() : '';
            const slugList = slugString
                .split(',')
                .map((slug) => slug.trim())
                .filter(Boolean);

            const idsFromSlugs = slugList
                .map((slug) =>
                    this.extConfig.find(
                        (data) =>
                            data.ext_slug === slug ||
                            `${data.ext_index}` === slug ||
                            data.ext_col_nm === slug ||
                            data.ext_parent_col_nm === slug
                    )
                )
                .map((found) => {
                    if (!found) {
                        return null;
                    }
                    const no = found.no || found.ext_index;
                    if (!no) {
                        return null;
                    }
                    return `${no}`.padStart(2, '0');
                })
                .filter(Boolean);

            return {
                key: slugString || fallbackKey || trimmedDefinition,
                value: idsFromSlugs.join(','),
                label,
                category,
                raw: trimmedDefinition,
                slugList,
                sourceKey: sourceKey || fallbackKey || trimmedDefinition,
            };
        },
        loadScript(src) {
            return new Promise((resolve, reject) => {
                // If the script is already loaded, resolve immediately
                if (window.scriptLoadingTracker[src]?.status === 'loaded') {
                    resolve();
                    return;
                }

                // If the script is being loaded, wait for it to complete
                if (window.scriptLoadingTracker[src]?.status === 'loading') {
                    window.scriptLoadingTracker[src].promise.then(resolve, reject);
                    return;
                }

                // If the script hasn't started loading, start the loading process
                let script = document.createElement('script');
                script.src = src;
                if (src.endsWith('.css')) {
                    script = document.createElement('link');
                    script.rel = 'stylesheet';
                    script.href = src;
                }

                // Initialize the script loading state and promise
                let resolveLoading, rejectLoading;
                const loadingPromise = new Promise((res, rej) => {
                    resolveLoading = res;
                    rejectLoading = rej;
                });

                window.scriptLoadingTracker[src] = {
                    status: 'loading',
                    promise: loadingPromise,
                };

                script.onload = () => {
                    // Mark the script as loaded and resolve the promise
                    window.scriptLoadingTracker[src].status = 'loaded';
                    resolveLoading();
                    resolve();
                };

                script.onerror = () => {
                    // Mark the script as failed and reject the promise
                    window.scriptLoadingTracker[src].status = 'failed';
                    rejectLoading();
                    reject();
                };

                document.body.appendChild(script);
            });
        },
    },
    watch: {
        productSelectorConfigs: {
            immediate: true,
            handler(configs) {
                // Initialize visible count based on how many already have values
                if (configs && configs.length > 0) {
                    const filledCount = configs.filter((c) => c.value || c.default_value).length;
                    if (filledCount > this.visibleProductSelectorCount) {
                        this.visibleProductSelectorCount = filledCount;
                    }
                }
            },
        },
    },
    async created() {
        this.extConfig.sort(this.sortByExtOrderNumber);
        this.extOptions = await this.convertToExtOptions(this.config.parent.ext_option, this.preserve_keys_endpoint);
        this.extractParentCategories();
        globalState.siteLang = this.smarty_lang;
        this.$store = store;
    },
    async mounted() {
        // since multiple custom components do not have its index number, gets it from CSS picking.
        console.log('mounted');
        const iteratableSelfComponentIndex =
            window.document.querySelectorAll(`.${this.distinguishClassName}`).length - 1;
        this.extConfig = this.extConfig.map((extConfig) =>
            this.getExtConfigWithStoredValue(extConfig, iteratableSelfComponentIndex)
        );

        const prefixUrl = '/management/js/rcms-vue/components/rcms-mng/';

        const loadManifest = async () => {
            const kurocoCoreManifestUrl = prefixUrl + 'manifest.json';
            return fetch(kurocoCoreManifestUrl).then((response) => response.json());
        };

        const getManifest = async () => {
            if (window.kurocoCoreManifestUrlForPlugin?.status === 'loaded') {
                return window.kurocoCoreManifestUrlForPlugin.manifest;
            }

            if (window.kurocoCoreManifestUrlForPlugin?.status === 'loading') {
                return window.kurocoCoreManifestUrlForPlugin.promise;
            }

            const manifestPromise = loadManifest();
            window.kurocoCoreManifestUrlForPlugin = {
                status: 'loading',
                promise: manifestPromise,
            };
            const manifest = await manifestPromise;
            window.kurocoCoreManifestUrlForPlugin = {
                status: 'loaded',
                manifest,
            };
            return manifest;
        };

        const manifest = await getManifest();

        try {
            await this.loadScript(prefixUrl + manifest['rcms-mng-vendors.js']);
            const coreComponents = [
                'Text',
                'Textarea',
                'Link',
                'RelationFld',
                'Selectbox',
                'Checkbox',
                'Html',
                'Date',
                'Wysiwyg',
                'Image',
                'FileManager',
                'Location',
                'Csvtable',
            ];
            // Remove component from coreComponents when it is already loaded.
            coreComponents.forEach((component) => {
                if (window['common/components/extensions/Ext' + component]) {
                    coreComponents.splice(coreComponents.indexOf(component), 1);
                }
            });

            // CSS
            await Promise.all(
                coreComponents.map((component) => {
                    if (manifest['common/components/extensions/Ext' + component + '.css'] === undefined) {
                        return Promise.resolve();
                    }
                    return this.loadScript(
                        prefixUrl + manifest['common/components/extensions/Ext' + component + '.css']
                    );
                })
            );

            // JS
            await Promise.all(
                coreComponents.map((component) => {
                    if (manifest['common/components/extensions/Ext' + component + '.js'] === undefined) {
                        return Promise.resolve();
                    }
                    return this.loadScript(
                        prefixUrl + manifest['common/components/extensions/Ext' + component + '.js']
                    );
                })
            );

            this.isLoaded = true;
        } catch (error) {
            console.error(`Failed to load script: ${error}`);
        }
    },
};
</script>

<style scoped>
.js-expand {
    width: 1%;
}

.product-selectors-container {
    margin-bottom: 10px;
}

.product-selector-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
}

.product-selector-row > :first-child {
    flex: 1;
}

.product-selector-add-btn,
.product-selector-remove-btn {
    min-width: 32px;
    height: 32px;
    padding: 0;
    font-size: 18px;
    line-height: 1;
    margin-top: 4px;
}
</style>
