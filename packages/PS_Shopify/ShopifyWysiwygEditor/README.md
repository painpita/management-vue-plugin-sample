# Shopify WYSIWYG Editor Component

A Vue.js component that combines Kuroco OpenDev WYSIWYG editor with Shopify image selector functionality.

## Overview

This component provides a combined interface with:
1. **WYSIWYG Editor** (CKEditor) for rich text content editing
2. **Shopify Image Selector** for selecting and inserting product images from your Shopify store

## Project Structure

```
ShopifyWysiwygEditor/
├── src/
│   ├── pages/
│   │   └── ShopifyWysiwygEditor.vue    # Main component
│   ├── common/
│   │   └── config.js                    # Configuration
│   └── index.js
├── dist/                                 # Build output
├── package.json
├── webpack.config.js
├── rcms-js.config.js
└── README.md
```

## Component Architecture

The component is built as a combination of two existing components:

### 1. WYSIWYG Editor Integration
- Uses CKEditor for rich text editing
- Integrates with Kuroco OpenDev's WYSIWYG system
- Provides standard editing tools (formatting, links, lists, etc.)
- Supports file uploads via CKFinder

### 2. Shopify Image Selector
- Two-step selection process:
  1. Search and select a product
  2. Choose an image from the product's gallery
- Real-time product search via Shopify Storefront API
- Image preview and selection
- Direct insertion into WYSIWYG editor

## Usage

### Basic Implementation

```vue
<template>
    <div>
        <!-- WYSIWYG Editor Section -->
        <div class="editor-section">
            <label>Content Editor</label>
            <div ref="editorElement"></div>
        </div>

        <!-- Shopify Image Selector -->
        <shopify-image-selector
            :NUXT_SHOPIFY_STOREFRONT_DOMAIN="shopifyDomain"
            :NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN="shopifyToken"
            :NUXT_SHOPIFY_API_VERSION="apiVersion"
            :extConfig="extConfig"
        />
    </div>
</template>

<script>
export default {
    data() {
        return {
            editorInstance: null,
            shopifyDomain: 'your-store.myshopify.com',
            shopifyToken: 'your-storefront-token',
            apiVersion: '2024-10',
            extConfig: [/* your config */]
        }
    },
    mounted() {
        // Initialize CKEditor
        if (typeof CKEDITOR !== 'undefined') {
            this.editorInstance = CKEDITOR.replace(this.$refs.editorElement, {
                height: 400,
                filebrowserBrowseUrl: '/management/wysiwyg',
                filebrowserImageBrowseUrl: '/management/wysiwyg?type=Images'
            });
        }
    }
}
</script>
```

## Features

### WYSIWYG Editor Features
- Rich text formatting (bold, italic, underline, strikethrough)
- Headings and paragraph styles
- Lists (ordered and unordered)
- Links and anchors
- Tables
- Image insertion and management
- Source code editing
- Copy/paste from Word
- Undo/redo

### Shopify Image Selector Features
- **Product Search**: Real-time search across your Shopify products
- **Image Gallery**: View all images from a selected product
- **Image Preview**: See thumbnails and alt text for each image
- **Selection UI**: Visual feedback for selected images
- **Quick Actions**:
  - Copy image URL to clipboard
  - Remove selection
  - Re-select different image

## Configuration

### Shopify Setup

1. **Create Storefront API Access Token**:
   - Go to Shopify Admin → Settings → Apps and sales channels
   - Create a new app or use existing
   - Configure Storefront API scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
   - Copy the Storefront API access token

2. **Get Your Details**:
   - Domain: `your-store.myshopify.com`
   - API Version: `2024-10` (or your preferred version)
   - Access Token: From step 1

### CKEditor Setup

CKEditor must be loaded globally before initializing the component:

```html
<script src="/management/wysiwyg/ckeditor/ckeditor.js"></script>
```

## Integration Pattern

### Combined Workflow

1. **Content Creation**:
   - User writes content in WYSIWYG editor
   - User wants to add a product image

2. **Image Selection**:
   - Click "画像を選択" (Select Image) button
   - Search for product by name
   - Select product from results
   - Choose specific image from product gallery
   - Confirm selection

3. **Image Insertion**:
   - Selected image details are displayed
   - User can copy image URL
   - Image URL can be manually inserted into editor
   - Or use custom integration to insert directly

### Custom Integration Example

To insert Shopify images directly into the editor, you can extend the component:

```javascript
methods: {
    insertImageIntoEditor() {
        if (this.selectedImage && this.editorInstance) {
            const imgHtml = `<img src="${this.selectedImage.url}" alt="${this.selectedImage.altText || ''}" />`;
            this.editorInstance.insertHtml(imgHtml);
        }
    }
}
```

## Building

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build

# Watch mode
npm run watch

# Development server
npm run serve
```

##  Installation Steps

1. Copy the existing Shopify Image Selector component
2. Add CKEditor initialization logic
3. Create integration between the two components
4. Build and deploy

## Dependencies

- Vue.js 2.6.6
- Axios (for Shopify API calls)
- CKEditor (loaded globally)
- Shopify Storefront API access

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE 10+

## Notes

- CKEditor must be loaded globally
- Requires valid Shopify Storefront API credentials
- Images are hosted on Shopify's CDN
- Component follows Kuroco OpenDev patterns

## Related Components

- **PS_ShopifyImageSelector**: Standalone Shopify image selector
- **PS_ShopifyProductSelector**: Shopify product selector component
- **ContentsGroupingExtensions**: Contains ChildWysiwyg component example

## License

UNLICENSED
