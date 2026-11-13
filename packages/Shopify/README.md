# Shopify

Kuroco management-screen plugins for Shopify, calling the **Shopify Storefront API directly from the browser**
(no proxy). Replaces the packages in `packages/PS_Shopify/` once validated; the menu builder
(`PS_ShopifyJsonBuilder`) is not ported.

| Page (bundle)            | Stored value (unchanged from PS_Shopify)                                   |
| ------------------------ | -------------------------------------------------------------------------- |
| `ShopifyProductSelector` | product GID, or a variant SKU with `selectColorVariant`                     |
| `ShopifyImageSelector`   | `[1][1]` product GID, `[1][2]` image URL, `[1][3]` `{"productId","imageId"}` |
| `ShopifyWysiwygEditor`   | `[0]` HTML, `[1][1]` product GID, `[1][2]` `{"productId","imageId"}`         |

Existing content saved with the PS_Shopify plugins loads as-is.

## Plugin settings

| Prop                           | All pages | Notes                                                                   |
| ------------------------------ | --------- | ----------------------------------------------------------------------- |
| `shopifyStorefrontDomain`      | required  | e.g. `xxx.myshopify.com`                                                |
| `shopifyStorefrontAccessToken` | required  | **Public** Storefront token only: anyone who can open the admin sees it |
| `shopifyApiVersion`            | optional  | default `2025-10`                                                       |
| `selectColorVariant`           | Product   | store a SKU per colour instead of the product GID                       |
| `colorOptionNames`             | Product   | default `Color,Colour,カラー,色`                                          |
| `uploadDir`, `helpMessage`     | WYSIWYG   | as before                                                               |

`ShopifyWysiwygEditor` also accepts its previous `NUXT_SHOPIFY_STOREFRONT_DOMAIN` /
`NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN` / `NUXT_SHOPIFY_API_VERSION` settings.
`shopifyApiEndpoint`, `vercelProtectionBypass` and `basicAuth*` are no longer used.

Bundles are published under `/files/user/mng_vue_components_shopify/` (see `rcms-js.config.js`), separate
from the PS_Shopify ones. The page/library names are the same as PS_Shopify's, so do not load an old and a
new bundle of the same plugin on one screen.

## Search

Storefront ignores the `sku:` search field, but SKUs are in the free-text index, so the search box takes product
names or SKUs (or a colour-level SKU prefix) as plain text. Free-text search is fuzzy: loading a stored SKU checks
for an exact variant match.

## Layout

```
src/common/storefront.js        Storefront client (search, by id, by exact SKU)
src/common/products.js          pure helpers: normalisation, colour/SKU grouping, result building (unit-tested)
src/common/kurocoExtensions.js  loads Kuroco core Ext* components (WYSIWYG)
src/common/rcms.js              registerVM, imported by every page
src/mixins/storefront.js        shared props (extConfig + Storefront settings) and the client
src/components/                 ShopifyModal, ProductSearch, SelectedCard, ShopifyImageField, ChildWysiwyg
src/pages/                      one bundle per page
```

## Commands

```
npm install
npm test          # unit tests (src/**/*.spec.js)
npm run lint
npm run build     # dist/
npm run serve     # dev server
```
