import Vue from 'vue';

// Registers this bundle's Vue with the Kuroco management screen. Import once from every page.
// publicPath ends with '/', which is stripped (same as ContentsGroupingExtensions).
window.rcmsJS.vue.registerVM(Vue, rcms_js_config.publicPath.slice(0, -1)); // eslint-disable-line
