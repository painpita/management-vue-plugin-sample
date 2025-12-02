<template>
    <div class="shopify-menu-builder">
        <div class="builder-header">
            <div class="header-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <h3>メニュービルダー</h3>
            </div>
            <div class="header-actions">
                <button type="button" class="btn btn-primary" @click="addMenuItem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    メニュー項目を追加
                </button>
            </div>
        </div>

        <div class="builder-content">
            <div v-if="menuItems.length === 0" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <p>メニュー項目がありません</p>
                <button type="button" class="btn btn-primary" @click="addMenuItem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    最初のメニュー項目を追加
                </button>
            </div>

            <div v-else class="menu-list">
                <menu-item
                    v-for="(item, index) in menuItems"
                    :key="item.id"
                    :item="item"
                    :index="index"
                    :depth="0"
                    @update="updateMenuItem(index, $event)"
                    @delete="deleteMenuItem(index)"
                    @open-category-modal="handleOpenCategoryModal"
                    @move-item="handleMoveItem"
                />
                <div
                    class="drop-zone-bottom"
                    :class="{ 'drop-zone-active': isBottomDropZoneActive }"
                    @dragover="handleBottomDragOver"
                    @dragleave="handleBottomDragLeave"
                    @drop="handleBottomDrop"
                >
                    <span v-if="isBottomDropZoneActive">ここにドロップ</span>
                </div>
            </div>
        </div>

        <!-- Category Selection Modal -->
        <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Shopifyカテゴリを選択</h3>
                    <button type="button" class="close-btn" @click="closeCategoryModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-box">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            v-model="categorySearchQuery"
                            @input="handleCategorySearch"
                            placeholder="カテゴリを検索..."
                            class="search-input"
                        />
                    </div>
                    <div class="categories-list">
                        <div v-if="isLoadingCategories" class="loading-state">
                            <div class="spinner"></div>
                            <span>読み込み中...</span>
                        </div>
                        <div v-else-if="categories.length === 0 && categorySearchQuery" class="no-results">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <p>カテゴリが見つかりませんでした</p>
                        </div>
                        <div v-else-if="categories.length === 0 && !categorySearchQuery" class="no-results">
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <path
                                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                ></path>
                            </svg>
                            <p>カテゴリを検索してください</p>
                        </div>
                        <div
                            v-for="category in categories"
                            :key="category.id"
                            class="category-item"
                            @click="selectCategory(category)"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                ></path>
                            </svg>
                            <img
                                v-if="category.image && category.image.url"
                                :src="category.image.url"
                                :alt="category.image.altText || category.title"
                                class="category-image"
                            />
                            <div class="category-info">
                                <span class="category-name">{{ category.title }}</span>
                                <span class="category-handle">{{ category.handle }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hidden input for form submission -->
        <input type="hidden" :name="fieldName" :value="jsonOutput" />
    </div>
</template>

<script>
import Vue from 'vue';
import axios from 'axios';
import MenuItem from '@/components/MenuItem.vue';

window.rcmsJS.vue.registerVM(Vue, rcms_js_config.publicPath); // eslint-disable-line

let itemIdCounter = 0;

function generateItemId() {
    return `menu_${Date.now()}_${++itemIdCounter}`;
}

export default {
    name: 'ShopifyMenuBuilder',
    components: {
        MenuItem,
    },
    props: {
        shopifyApiEndpoint: {
            type: String,
            required: true,
        },
        extConfig: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            menuItems: [],
            showCategoryModal: false,
            categorySearchQuery: '',
            categories: [],
            allCategories: [],
            isLoadingCategories: false,
            currentCategoryCallback: null,
            isBottomDropZoneActive: false,
        };
    },
    computed: {
        fieldName() {
            if (this.extConfig && this.extConfig[0] && this.extConfig[0].name) {
                return this.extConfig[0].name;
            }
            return 'menu_builder_value';
        },
        jsonOutput() {
            return JSON.stringify(this.buildMenuJson(this.menuItems));
        },
    },
    created() {
        this.loadInitialValue();
    },
    methods: {
        loadInitialValue() {
            if (this.extConfig && this.extConfig[0] && this.extConfig[0].value) {
                try {
                    let initialData;
                    if (typeof this.extConfig[0].value === 'string') {
                        initialData = JSON.parse(this.extConfig[0].value);
                    } else {
                        initialData = this.extConfig[0].value;
                    }
                    if (Array.isArray(initialData)) {
                        this.menuItems = this.parseMenuJson(initialData);
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to parse initial value:', e);
                    this.menuItems = [];
                }
            }
        },
        parseMenuJson(items) {
            if (!Array.isArray(items)) return [];

            return items.map(item => ({
                id: generateItemId(),
                label: item.label || '',
                linkType: item.categoryId ? 'category' : item.url ? 'url' : 'none',
                url: item.url || '',
                categoryId: item.categoryId || '',
                categoryName: item.categoryName || '',
                children: this.parseMenuJson(item.children || []),
            }));
        },
        buildMenuJson(items) {
            return items.map(item => {
                const menuItem = {
                    label: item.label || '',
                };

                if (item.linkType === 'url' && item.url) {
                    menuItem.url = item.url;
                } else if (item.linkType === 'category' && item.categoryId) {
                    menuItem.categoryId = item.categoryId;
                    if (item.categoryName) {
                        menuItem.categoryName = item.categoryName;
                    }
                }

                if (item.children && item.children.length > 0) {
                    menuItem.children = this.buildMenuJson(item.children);
                }

                return menuItem;
            });
        },
        addMenuItem() {
            this.menuItems.push({
                id: generateItemId(),
                label: '',
                linkType: 'url',
                url: '',
                categoryId: '',
                categoryName: '',
                children: [],
            });
        },
        updateMenuItem(index, updatedItem) {
            this.$set(this.menuItems, index, updatedItem);
        },
        deleteMenuItem(index) {
            this.menuItems.splice(index, 1);
        },
        handleMoveItem(data) {
            const { draggedItem, targetItemId, targetParentId, position } = data;

            // Find and remove the dragged item from its original location
            const removedItem = this.removeItemById(draggedItem.id, this.menuItems);
            if (!removedItem) return;

            // Find target and insert based on position
            if (position === 'inside' || position === 'inside-last') {
                // Add as child of target item
                this.addItemAsChild(targetItemId, removedItem, this.menuItems);
            } else {
                // Add as sibling (above or below)
                this.addItemAsSibling(targetItemId, targetParentId, removedItem, position, this.menuItems);
            }
        },
        removeItemById(itemId, items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === itemId) {
                    return items.splice(i, 1)[0];
                }
                if (items[i].children && items[i].children.length > 0) {
                    const found = this.removeItemById(itemId, items[i].children);
                    if (found) return found;
                }
            }
            return null;
        },
        findItemById(itemId, items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === itemId) {
                    return { item: items[i], parent: items, index: i };
                }
                if (items[i].children && items[i].children.length > 0) {
                    const found = this.findItemById(itemId, items[i].children);
                    if (found) return found;
                }
            }
            return null;
        },
        addItemAsChild(targetItemId, newItem, items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === targetItemId) {
                    if (!items[i].children) {
                        items[i].children = [];
                    }
                    items[i].children.push(newItem);
                    return true;
                }
                if (items[i].children && items[i].children.length > 0) {
                    if (this.addItemAsChild(targetItemId, newItem, items[i].children)) {
                        return true;
                    }
                }
            }
            return false;
        },
        addItemAsSibling(targetItemId, targetParentId, newItem, position, items) {
            // If targetParentId is null, we're at root level
            const targetArray = targetParentId ? this.findChildrenArray(targetParentId, items) : items;
            if (!targetArray) return false;

            for (let i = 0; i < targetArray.length; i++) {
                if (targetArray[i].id === targetItemId) {
                    const insertIndex = position === 'above' ? i : i + 1;
                    targetArray.splice(insertIndex, 0, newItem);
                    return true;
                }
            }
            return false;
        },
        findChildrenArray(parentId, items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === parentId) {
                    return items[i].children || [];
                }
                if (items[i].children && items[i].children.length > 0) {
                    const found = this.findChildrenArray(parentId, items[i].children);
                    if (found) return found;
                }
            }
            return null;
        },
        handleBottomDragOver(e) {
            const data = window.__menuDragData;
            if (!data) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.isBottomDropZoneActive = true;
        },
        handleBottomDragLeave() {
            this.isBottomDropZoneActive = false;
        },
        handleBottomDrop(e) {
            e.preventDefault();
            this.isBottomDropZoneActive = false;

            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const removedItem = this.removeItemById(data.item.id, this.menuItems);
                if (removedItem) {
                    this.menuItems.push(removedItem);
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Drop error:', err);
            }
        },
        handleOpenCategoryModal(data) {
            this.currentCategoryCallback = data.callback;
            this.showCategoryModal = true;
            this.categorySearchQuery = '';
            // Fetch categories if not already loaded
            if (this.allCategories.length === 0) {
                this.fetchCategories();
            } else {
                this.categories = this.allCategories;
            }
        },
        closeCategoryModal() {
            this.showCategoryModal = false;
            this.currentCategoryCallback = null;
            this.categorySearchQuery = '';
        },
        handleCategorySearch() {
            // Filter already-loaded categories client-side
            this.filterCategories();
        },
        filterCategories() {
            const query = this.categorySearchQuery.trim().toLowerCase();
            if (!query) {
                this.categories = this.allCategories;
            } else {
                this.categories = this.allCategories.filter(
                    cat => cat.title.toLowerCase().includes(query) || cat.handle.toLowerCase().includes(query)
                );
            }
        },
        async fetchCategories() {
            this.isLoadingCategories = true;
            try {
                const url = `${this.shopifyApiEndpoint}?first=100`;
                const response = await axios.get(url);

                if (response.data && response.data.categories) {
                    this.allCategories = response.data.categories.map(item => ({
                        id: item.id,
                        handle: item.handle || '',
                        title: item.title || '',
                        image: item.image,
                        productsCount: item.productsCount && item.productsCount.value,
                    }));
                    this.categories = this.allCategories;
                } else {
                    this.allCategories = [];
                    this.categories = [];
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to fetch categories:', error);
                this.allCategories = [];
                this.categories = [];
            } finally {
                this.isLoadingCategories = false;
            }
        },
        selectCategory(category) {
            if (this.currentCategoryCallback) {
                this.currentCategoryCallback(category.id, category.title);
            }
            this.closeCategoryModal();
        },
    },
};
</script>

<style scoped>
.shopify-menu-builder {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    max-width: 900px;
}

.builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    color: #333;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-title h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.builder-content {
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-top: none;
    border-radius: 0 0 12px 12px;
    min-height: 300px;
    background: #f8f9fa;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.empty-state svg {
    color: #ccc;
    margin-bottom: 16px;
}

.empty-state p {
    margin: 0 0 20px 0;
    font-size: 16px;
}

.menu-list {
    display: flex;
    flex-direction: column;
}

.drop-zone-bottom {
    min-height: 20px;
    margin-top: 8px;
    border: 2px dashed transparent;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.drop-zone-bottom.drop-zone-active {
    min-height: 50px;
    border-color: #007bff;
    background: #f0f7ff;
    color: #007bff;
    font-size: 14px;
    font-weight: 500;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

.btn-outline {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #333;
}

.builder-header .btn-outline {
    background: white;
    border: 1px solid #ddd;
    color: #333;
}

.builder-header .btn-outline:hover {
    background: #f5f5f5;
}

.modal-body .btn-outline {
    background: white;
    border: 1px solid #ddd;
    color: #333;
}

.modal-body .btn-outline:hover {
    background: #f5f5f5;
}

/* Modal styles */
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
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-content.modal-large {
    max-width: 700px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f5f5f5;
    color: #333;
}

.modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 16px;
    background: #f8f9fa;
}

.search-box svg {
    color: #999;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 15px;
    outline: none;
}

.search-input::placeholder {
    color: #999;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 400px;
    overflow-y: auto;
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: #666;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e0e0e0;
    border-top-color: #007bff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.no-results {
    text-align: center;
    padding: 40px 20px;
    color: #999;
}

.no-results svg {
    margin-bottom: 12px;
}

.no-results p {
    margin: 0;
    font-size: 14px;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.category-item:hover {
    background-color: #f0f7ff;
    border-color: #007bff;
}

.category-item svg {
    color: #007bff;
    flex-shrink: 0;
}

.category-image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
}

.category-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.category-info .category-name {
    font-weight: 500;
    color: #333;
}

.category-handle {
    font-size: 12px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
