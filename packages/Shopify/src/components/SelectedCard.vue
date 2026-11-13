<template>
    <div class="selected-card">
        <div class="card-content" @click="$emit('open')">
            <img v-if="image" :src="image.url" :alt="image.altText || title" class="card-thumbnail" />
            <div class="card-info">
                <h4>{{ title }}</h4>
                <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
                <p v-for="(line, index) in lines" :key="index" class="card-line">{{ line }}</p>
                <p v-if="warning" class="card-warning">{{ warning }}</p>
            </div>
        </div>
        <button v-if="copyText" type="button" class="icon-btn copy-btn" title="リンクをコピー" @click.stop="copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span v-if="copied" class="copy-feedback">コピーしました!</span>
        </button>
        <button type="button" class="icon-btn remove-btn" title="選択を削除" @click.stop="$emit('remove')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </button>
    </div>
</template>

<script>
const COPY_FEEDBACK_MS = 2000;

/** The current selection: thumbnail, title, subtitle, detail lines, optional copy button, remove button. */
export default {
    name: 'SelectedCard',
    props: {
        image: { type: Object, default: null },
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' },
        lines: { type: Array, default: () => [] },
        warning: { type: String, default: '' },
        copyText: { type: String, default: '' },
    },
    data() {
        return { copied: false, timer: null };
    },
    beforeDestroy() {
        clearTimeout(this.timer);
    },
    methods: {
        async copy() {
            try {
                await navigator.clipboard.writeText(this.copyText);
                this.copied = true;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => (this.copied = false), COPY_FEEDBACK_MS);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to copy link:', e);
            }
        },
    },
};
</script>

<style scoped>
.selected-card {
    display: inline-flex;
    align-items: center;
    margin-top: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #f9f9f9;
    transition: all 0.2s;
    max-width: 400px;
}

.selected-card:hover {
    background: #e9ecef;
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

.card-content {
    display: flex;
    align-items: center;
    padding: 12px;
    flex: 1;
    cursor: pointer;
}

.card-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 16px;
}

.card-info {
    flex: 1;
}

.card-info h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 500;
}

.card-line {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.card-subtitle {
    margin: 0 0 2px 0;
    font-size: 14px;
    font-weight: 500;
}

.card-warning {
    margin: 2px 0 0 0;
    color: #dc3545;
    font-size: 12px;
}

.icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    position: relative;
}

.icon-btn svg {
    width: 16px;
    height: 16px;
}

.copy-btn {
    color: #007bff;
}

.copy-btn:hover {
    color: #0056b3;
    background: rgba(0, 123, 255, 0.1);
}

.remove-btn {
    color: #dc3545;
}

.remove-btn:hover {
    color: #c82333;
    background: rgba(220, 53, 69, 0.1);
}

.copy-feedback {
    position: absolute;
    top: -30px;
    right: 0;
    background: #28a745;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
}
</style>
