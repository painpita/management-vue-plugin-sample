<template>
    <div
        ref="menuItem"
        class="menu-item"
        :class="{
            'has-children': hasChildren,
            'is-dragging': isDragging,
            'drag-over-above': dropPosition === 'above',
            'drag-over-inside': dropPosition === 'inside',
            'drag-over-below': dropPosition === 'below',
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
    >
        <div class="item-row" ref="itemRow">
            <div class="item-controls">
                <div
                    class="drag-handle"
                    title="ドラッグして並べ替え"
                    draggable="true"
                    @dragstart="handleDragStart"
                    @dragend="handleDragEnd"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="6" r="2"></circle>
                        <circle cx="15" cy="6" r="2"></circle>
                        <circle cx="9" cy="12" r="2"></circle>
                        <circle cx="15" cy="12" r="2"></circle>
                        <circle cx="9" cy="18" r="2"></circle>
                        <circle cx="15" cy="18" r="2"></circle>
                    </svg>
                </div>
                <button
                    v-if="hasChildren"
                    class="toggle-btn"
                    type="button"
                    @click="toggleExpanded"
                    :title="expanded ? '折りたたむ' : '展開する'"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        :class="{ rotated: expanded }"
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>

            <div class="item-content">
                <div class="item-main">
                    <input
                        type="text"
                        v-model="localItem.label"
                        @input="emitUpdate"
                        placeholder="メニュー名"
                        class="label-input"
                    />

                    <div class="link-type-selector">
                        <label class="radio-label">
                            <input
                                type="radio"
                                v-model="localItem.linkType"
                                value="url"
                                @change="handleLinkTypeChange"
                            />
                            <span>URL</span>
                        </label>
                        <label class="radio-label">
                            <input
                                type="radio"
                                v-model="localItem.linkType"
                                value="category"
                                @change="handleLinkTypeChange"
                            />
                            <span>カテゴリ</span>
                        </label>
                        <label class="radio-label">
                            <input
                                type="radio"
                                v-model="localItem.linkType"
                                value="none"
                                @change="handleLinkTypeChange"
                            />
                            <span>なし</span>
                        </label>
                    </div>
                </div>

                <div class="item-link">
                    <template v-if="localItem.linkType === 'url'">
                        <input
                            type="url"
                            v-model="localItem.url"
                            @input="emitUpdate"
                            placeholder="https://..."
                            class="url-input"
                        />
                    </template>

                    <template v-else-if="localItem.linkType === 'category'">
                        <div class="category-selector">
                            <button
                                v-if="!localItem.categoryId"
                                type="button"
                                class="btn btn-select"
                                @click="openCategoryModal"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                    ></path>
                                </svg>
                                カテゴリを選択
                            </button>
                            <div v-else class="selected-category">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                    ></path>
                                </svg>
                                <span class="category-name">{{ localItem.categoryName || localItem.categoryId }}</span>
                                <button type="button" class="clear-btn" @click="clearCategory" title="クリア">
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <div class="item-actions">
                <button type="button" class="action-btn add-btn" @click="addChildItem" title="サブメニュー追加">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button type="button" class="action-btn delete-btn" @click="$emit('delete')" title="削除">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>

        <div v-if="hasChildren && expanded" class="children-container">
            <menu-item
                v-for="(child, index) in localItem.children"
                :key="child.id"
                :item="child"
                :index="index"
                :depth="depth + 1"
                :parent-id="localItem.id"
                @update="updateChild(index, $event)"
                @delete="deleteChild(index)"
                @open-category-modal="$emit('open-category-modal', $event)"
                @move-item="$emit('move-item', $event)"
            />
            <div
                class="drop-zone-bottom"
                :class="{ 'drop-zone-active': isChildDropZoneActive }"
                @dragover="handleChildDropZoneDragOver"
                @dragleave="handleChildDropZoneDragLeave"
                @drop="handleChildDropZoneDrop"
            >
                <span v-if="isChildDropZoneActive">ここにドロップ</span>
            </div>
        </div>
    </div>
</template>

<script>
let itemIdCounter = 0;

function generateItemId() {
    return `menu_${Date.now()}_${++itemIdCounter}`;
}

export default {
    name: 'MenuItem',
    props: {
        item: {
            type: Object,
            required: true,
        },
        index: {
            type: Number,
            default: 0,
        },
        depth: {
            type: Number,
            default: 0,
        },
        parentId: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            localItem: this.cloneItem(this.item),
            expanded: true,
            isDragging: false,
            dropPosition: null, // 'above', 'inside', 'below', or null
            isChildDropZoneActive: false,
        };
    },
    computed: {
        hasChildren() {
            return this.localItem.children && this.localItem.children.length > 0;
        },
    },
    watch: {
        item: {
            handler(newVal) {
                this.localItem = this.cloneItem(newVal);
            },
            deep: true,
        },
    },
    methods: {
        cloneItem(item) {
            return JSON.parse(JSON.stringify(item));
        },
        emitUpdate() {
            this.$emit('update', this.localItem);
        },
        handleLinkTypeChange() {
            if (this.localItem.linkType === 'url') {
                this.localItem.categoryId = '';
                this.localItem.categoryName = '';
            } else if (this.localItem.linkType === 'category') {
                this.localItem.url = '';
            } else {
                this.localItem.url = '';
                this.localItem.categoryId = '';
                this.localItem.categoryName = '';
            }
            this.emitUpdate();
        },
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        addChildItem() {
            if (!this.localItem.children) {
                this.localItem.children = [];
            }
            this.localItem.children.push({
                id: generateItemId(),
                label: '',
                linkType: 'url',
                url: '',
                categoryId: '',
                categoryName: '',
                children: [],
            });
            this.expanded = true;
            this.emitUpdate();
        },
        updateChild(index, updatedChild) {
            this.localItem.children[index] = updatedChild;
            this.emitUpdate();
        },
        deleteChild(index) {
            this.localItem.children.splice(index, 1);
            this.emitUpdate();
        },
        openCategoryModal() {
            this.$emit('open-category-modal', {
                itemId: this.localItem.id,
                callback: (categoryId, categoryName) => {
                    this.localItem.categoryId = categoryId;
                    this.localItem.categoryName = categoryName || categoryId;
                    this.emitUpdate();
                },
            });
        },
        clearCategory() {
            this.localItem.categoryId = '';
            this.localItem.categoryName = '';
            this.emitUpdate();
        },
        handleDragStart(e) {
            // Stop propagation to prevent parent items from also starting drag
            e.stopPropagation();
            this.isDragging = true;
            e.dataTransfer.effectAllowed = 'move';

            const dragData = {
                id: this.localItem.id,
                item: this.localItem,
                index: this.index,
                depth: this.depth,
                parentId: this.parentId,
            };

            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            // Store drag data globally for access during dragover (since getData doesn't work in dragover)
            window.__menuDragData = dragData;
        },
        handleDragEnd() {
            this.isDragging = false;
            this.dropPosition = null;
            // Clean up global drag data
            window.__menuDragData = null;
        },
        getDropPosition(e) {
            const itemRow = this.$refs.itemRow;
            if (!itemRow) return null;

            const rect = itemRow.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;

            // Divide into 3 zones: top 25% = above, middle 50% = inside, bottom 25% = below
            if (y < height * 0.25) {
                return 'above';
            } else if (y > height * 0.75) {
                return 'below';
            } else {
                return 'inside';
            }
        },
        handleDragOver(e) {
            const data = window.__menuDragData;
            if (!data || data.id === this.localItem.id) {
                this.dropPosition = null;
                return;
            }

            // Prevent dropping an item into its own descendant
            if (this.isDescendantOf(data.id)) {
                this.dropPosition = null;
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';

            // Check if we're over the item-row or children
            const itemRow = this.$refs.itemRow;
            if (itemRow && itemRow.contains(e.target)) {
                this.dropPosition = this.getDropPosition(e);
            } else {
                this.dropPosition = null;
            }
        },
        handleDragLeave(e) {
            e.stopPropagation();
            // Only clear if we're actually leaving this element
            if (!this.$refs.menuItem.contains(e.relatedTarget)) {
                this.dropPosition = null;
            }
        },
        isDescendantOf(itemId) {
            // Check if this item is a descendant of the item being dragged
            // We need to traverse up to check
            let parent = this.$parent;
            while (parent) {
                if (parent.localItem && parent.localItem.id === itemId) {
                    return true;
                }
                if (!parent.$parent || !parent.$parent.localItem) {
                    break;
                }
                parent = parent.$parent;
            }
            return false;
        },
        handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();

            const position = this.dropPosition;
            this.dropPosition = null;

            if (!position) return;

            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));

                if (data.id === this.localItem.id) return;
                if (this.isDescendantOf(data.id)) return;

                // Emit move event with all necessary info
                this.$emit('move-item', {
                    draggedItem: data.item,
                    draggedItemId: data.id,
                    draggedFromParentId: data.parentId,
                    draggedFromIndex: data.index,
                    targetItemId: this.localItem.id,
                    targetParentId: this.parentId,
                    targetIndex: this.index,
                    position: position, // 'above', 'inside', 'below'
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Drop error:', err);
            }
        },
        handleChildDropZoneDragOver(e) {
            const data = window.__menuDragData;
            if (!data || data.id === this.localItem.id) return;
            // Prevent dropping into own descendant
            if (this.isDescendantOf(data.id)) return;

            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            this.isChildDropZoneActive = true;
        },
        handleChildDropZoneDragLeave(e) {
            e.stopPropagation();
            this.isChildDropZoneActive = false;
        },
        handleChildDropZoneDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            this.isChildDropZoneActive = false;

            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));

                if (data.id === this.localItem.id) return;
                if (this.isDescendantOf(data.id)) return;

                // Emit move event to add as last child of this item
                this.$emit('move-item', {
                    draggedItem: data.item,
                    draggedItemId: data.id,
                    draggedFromParentId: data.parentId,
                    draggedFromIndex: data.index,
                    targetItemId: this.localItem.id,
                    targetParentId: this.parentId,
                    targetIndex: this.index,
                    position: 'inside-last', // Special position for adding at end of children
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Drop error:', err);
            }
        },
    },
};
</script>

<style scoped>
.menu-item {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s;
}

.menu-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-item.has-children {
    border-left: 3px solid #007bff;
}

.menu-item.is-dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

.menu-item.drag-over-above {
    border-top: 3px solid #007bff;
}

.menu-item.drag-over-inside {
    border: 2px dashed #28a745;
    background: #f0fff4;
}

.menu-item.drag-over-below {
    border-bottom: 3px solid #007bff;
}

.item-row {
    display: flex;
    align-items: stretch;
    min-height: 60px;
}

.item-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 7px 0 0 7px;
    gap: 4px;
}

.drag-handle {
    cursor: grab;
    background: none;
    border: none;
    padding: 6px;
    color: #aaa;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.drag-handle:hover {
    color: #666;
    background: #e9ecef;
}

.drag-handle:active {
    cursor: grabbing;
}

.toggle-btn {
    background: none;
    border: none;
    padding: 6px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.toggle-btn:hover {
    background: #e9ecef;
    color: #333;
}

.toggle-btn svg.rotated {
    transform: rotate(90deg);
}

.item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 8px;
}

.item-main {
    display: flex;
    align-items: center;
    gap: 16px;
}

.label-input {
    flex: 1;
    max-width: 300px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
}

.label-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.link-type-selector {
    display: flex;
    gap: 12px;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #666;
}

.radio-label input[type='radio'] {
    cursor: pointer;
}

.radio-label span {
    user-select: none;
}

.item-link {
    display: flex;
    align-items: center;
}

.url-input {
    flex: 1;
    max-width: 400px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 13px;
    color: #666;
}

.url-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.category-selector {
    display: flex;
    align-items: center;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-select {
    background: #f0f7ff;
    color: #007bff;
    border: 1px dashed #007bff;
}

.btn-select:hover {
    background: #007bff;
    color: white;
    border-style: solid;
}

.selected-category {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #e8f4fd;
    border: 1px solid #b3d7ff;
    border-radius: 6px;
    color: #0056b3;
}

.category-name {
    font-size: 13px;
    font-weight: 500;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.clear-btn {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.clear-btn:hover {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.1);
}

.item-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 8px;
    gap: 4px;
}

.action-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
}

.add-btn {
    color: #28a745;
}

.add-btn:hover {
    background: rgba(40, 167, 69, 0.1);
}

.delete-btn {
    color: #dc3545;
}

.delete-btn:hover {
    background: rgba(220, 53, 69, 0.1);
}

.children-container {
    margin: 0 12px 12px 40px;
    padding-left: 16px;
    border-left: 2px solid #e0e0e0;
}

.drop-zone-bottom {
    min-height: 16px;
    margin-top: 4px;
    border: 2px dashed transparent;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.drop-zone-bottom.drop-zone-active {
    min-height: 40px;
    border-color: #007bff;
    background: #f0f7ff;
    color: #007bff;
    font-size: 12px;
    font-weight: 500;
}
</style>
