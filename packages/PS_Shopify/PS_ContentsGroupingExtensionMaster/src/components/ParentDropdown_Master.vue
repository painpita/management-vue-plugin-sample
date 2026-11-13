<template>
    <div ref="root">
        <dt>{{ $attrs.ext_title }}</dt>
        <dd
            class="multi_dd"
            :class="`ext_item_${$attrs.ext_index - 1}`"
            :data-ext_type="$attrs.ext_type"
            :data-default_value="$attrs.default_value"
        >
            <select
                v-if="$attrs.type === '29'"
                :name="$attrs.name"
                @change="emitChildrenIDs"
                ref="select"
                v-model="selected"
                class="form-control w-auto"
            >
                <option v-if="!required" value="" selected>選択なし</option>
                <option
                    v-for="({ key, value, label, raw, sourceKey }, idx) in filteredMasterOptions"
                    :key="`${key}_${idx}`"
                    :label="label"
                    :data-key="`${key}_${idx}`"
                    :value="sourceKey || raw || key"
                    :data-value="sourceKey || raw || key"
                    :data-child-ids="value"
                >
                    {{ label }}
                </option>
            </select>

            <select
                v-else
                :name="$attrs.name"
                @change="emitChildrenIDs"
                ref="select"
                v-model="selected"
                class="form-control w-auto"
            >
                <option v-if="!required" value="" selected>選択なし</option>
                <option
                    v-for="({ key, value, label, raw, sourceKey }, idx) in extOptions"
                    :key="`${key}_${idx}`"
                    :label="label"
                    :data-key="`${key}_${idx}`"
                    :value="sourceKey || raw || key"
                    :data-value="sourceKey || raw || key"
                    :data-child-ids="value"
                >
                    {{ label }}
                </option>
            </select>
        </dd>

        <slot />
    </div>
</template>

<script>
import { GlobalEvent } from '@/common/globals';

export default {
    props: {
        extOptions: { type: Array, default: () => [] },
        use_slugs: { type: Boolean, default: false },
        extConfig: { type: Array, default: () => [] },
        selectedCategory: { type: String, default: '' }, // Category from parent component
        debug: { type: Boolean, default: true },
    },
    data() {
        return {
            selected: '',
            observer: null,
            masterOptions: [],
        };
    },
    computed: {
        required() {
            return this.$attrs.limits && this.$attrs.limits.required !== undefined;
        },
        filteredMasterOptions() {
            if (!this.masterOptions) return [];
            if (!this.selectedCategory) return this.masterOptions;
            console.log(
                'Filtering master options by selectedCategory:',
                this.masterOptions.filter((option) => option.category === this.selectedCategory)
            );
            return this.masterOptions.filter((option) => option.category === this.selectedCategory);
        },
    },
    watch: {
        selectedCategory(newVal, oldVal) {
            // Reset selection when category changes
            if (newVal !== oldVal && this.selected) {
                this.selected = '';
                this.$emit('change', []);
                this.$emit('changeMainId', '');
            }
        },
        extOptions: {
            immediate: true,
            handler() {
                this.getMasterOptions();
                this.$nextTick(() => {
                    const selectedValue = this.getSelectedValue();
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ParentDropdown_Master] watcher setting selected', {
                            selectedValue,
                            currentSelected: this.selected,
                        });
                    }
                    this.selected = selectedValue;
                    if (this.selected) {
                        // Wait for DOM to update after v-model change
                        this.$nextTick(() => {
                            this.emitChildrenIDs();
                        });
                    }
                });
            },
        },
    },
    methods: {
        getMasterOptions() {
            if (this.extOptions?.length) {
                this.masterOptions = this.extOptions.map((option) => ({
                    key: option.key,
                    value: option.value,
                    label: option.label || option.raw || option.key,
                    category: option.category || '',
                    raw: option.raw || option.key,
                    slugList: option.slugList || [],
                    sourceKey: option.sourceKey || option.raw || option.key,
                }));
                if (this.debug) {
                    // eslint-disable-next-line no-console
                    console.log('[ParentDropdown_Master] master options built', {
                        count: this.masterOptions.length,
                        sample: this.masterOptions[0],
                        allSourceKeys: this.masterOptions.map((opt) => opt.sourceKey),
                    });
                }
                return;
            }

            this.masterOptions = Object.keys(this.$attrs.options || {}).map((key) => ({
                key,
                value: key.replace(/\d+-/, ''),
                label: this.$attrs.options[key],
                category: '',
                raw: key,
                slugList: [],
                sourceKey: key,
            }));
            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ParentDropdown_Master] master options from attrs', {
                    count: this.masterOptions.length,
                });
            }
        },
        emitChildrenIDs() {
            const selectedOption = this.$refs?.select?.selectedOptions?.[0];
            const childIdsAttr =
                selectedOption?.dataset?.childIds || selectedOption?.getAttribute('data-child-ids') || '';
            const childrenIds = childIdsAttr.split(',').filter(Boolean);
            const id = this.$attrs.ext_col_nm + (this.$attrs.repeatCnt >= 0 ? '_' + this.$attrs.repeatCnt : '');

            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ParentDropdown_Master] emitChildrenIDs', {
                    selected: this.selected,
                    childIdsAttr,
                    childrenIds,
                    hasSelectRef: !!this.$refs?.select,
                    selectedOptionValue: selectedOption?.value,
                    allDataset: selectedOption?.dataset,
                });
            }

            GlobalEvent.dispatch(`ExtCsvtable.update.${id}`, this.selected);
            this.$emit('change', childrenIds);
            this.$emit('changeMainId', this.selected);
        },
        getSelectedValue() {
            const selected =
                (this.$attrs.default_value !== undefined && this.$attrs.default_value !== ''
                    ? this.$attrs.default_value
                    : this.$attrs.value) || '';

            // 前回未選択である場合はそのまま返す
            if (selected === '') {
                if (this.debug) {
                    // eslint-disable-next-line no-console
                    console.log('[ParentDropdown_Master] getSelectedValue skipped - no saved value');
                }
                return selected;
            }

            if (this.debug) {
                // eslint-disable-next-line no-console
                console.log('[ParentDropdown_Master] getSelectedValue input', {
                    selected,
                    default_value: this.$attrs.default_value,
                    value: this.$attrs.value,
                    masterOptionsCount: this.masterOptions?.length,
                    allAttrs: Object.keys(this.$attrs),
                });
            }
            if (this.$attrs.type === '29') {
                const exactMasterMatch = this.masterOptions?.find(({ sourceKey }) => sourceKey === selected);
                if (exactMasterMatch) {
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ParentDropdown_Master] exact match found', exactMasterMatch);
                    }
                    return exactMasterMatch.sourceKey;
                }

                const keyMatch = this.masterOptions?.find(({ key }) => key === selected);
                if (keyMatch) {
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ParentDropdown_Master] key match found', keyMatch);
                    }
                    return keyMatch.sourceKey;
                }

                const legacyMasterMatch = this.masterOptions?.find(
                    ({ raw }) => raw === selected || raw?.startsWith(selected)
                );
                if (legacyMasterMatch) {
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ParentDropdown_Master] legacy match found', legacyMasterMatch);
                    }
                    return legacyMasterMatch.sourceKey || legacyMasterMatch.key;
                }

                const slugMatch = this.masterOptions?.find(({ slugList = [] }) =>
                    slugList.some((slug) => slug === selected)
                );
                if (slugMatch) {
                    if (this.debug) {
                        // eslint-disable-next-line no-console
                        console.log('[ParentDropdown_Master] slug match found', slugMatch);
                    }
                }
                return slugMatch?.sourceKey || slugMatch?.key || '';
            }

            const exactExtMatch = this.extOptions?.find(({ sourceKey }) => sourceKey === selected);
            if (exactExtMatch) {
                return exactExtMatch.sourceKey || exactExtMatch.key;
            }

            return this.extOptions?.find(({ raw }) => raw === selected || raw?.startsWith(selected))?.sourceKey || '';
        },
    },
    mounted() {
        if (this.debug) {
            // eslint-disable-next-line no-console
            console.log('[ParentDropdown_Master] mounted', {
                hasExtOptions: !!this.extOptions?.length,
                hasMasterOptions: !!this.masterOptions?.length,
                currentSelected: this.selected,
                attrsValue: this.$attrs.value,
                attrsDefaultValue: this.$attrs.default_value,
            });
        }

        // Fallback: if watcher didn't set selection, try now
        if (!this.selected && this.masterOptions?.length) {
            this.$nextTick(() => {
                const selectedValue = this.getSelectedValue();
                if (selectedValue) {
                    this.selected = selectedValue;
                    if (this.selected) {
                        // Wait for DOM to update after v-model change
                        this.$nextTick(() => {
                            this.emitChildrenIDs();
                        });
                    }
                }
            });
        }

        // In case of add -> delete -> add this repeatable extension,
        // child extensions will be still shown (and retains it's value) despite of parent extension is non-selected.
        // To fix this, observe the parent extension's visibility and reset the value of child extensions.
        this.observer = new ResizeObserver((entries = []) => {
            const invisible = entries.some((entry) => {
                const { height, width } = entry.contentRect;
                return height === 0 && width === 0;
            });
            invisible && this.$emit('change', []); // reset value
        });
        this.observer.observe(this.$refs.root);
        console.log('extOptions', this.extOptions);
    },
    beforeDestroy() {
        this.observer?.disconnect?.();
    },
};
</script>
