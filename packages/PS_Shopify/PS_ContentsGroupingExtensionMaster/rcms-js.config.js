module.exports = {
    name: 'ContentsGroupingExtension_Master',
    path: 'dist',
    publicPath: '/files/user/mng_vue_components_contents_grouping_extension_grouped/',

    devHost: process.env.RCMS_JS_DEV_HOST || '127.0.0.1',
    devPort: process.env.RCMS_JS_DEV_PORT || 26787,

    https: true,
    httpsKey: process.env.RCMS_JS_HTTPS_KEY_FILE,
    httpsCert: process.env.RCMS_JS_HTTPS_CERT_FILE,
    httpsCa: process.env.RCMS_JS_HTTPS_CA_FILE,
};
