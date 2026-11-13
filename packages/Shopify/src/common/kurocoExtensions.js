/**
 * Loads Kuroco core field components (e.g. ExtWysiwyg) from the management screen's manifest.
 * Every repeat of a field mounts its own component instance, so loads are de-duplicated through window globals.
 */
const PREFIX_URL = '/management/js/rcms-vue/components/rcms-mng/';

// Core components ExtWysiwyg depends on.
const CORE_COMPONENTS = [
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

window.scriptLoadingTracker = window.scriptLoadingTracker || {};

export function getExtComponent(name) {
    return window['common/components/extensions/Ext' + name];
}

async function getManifest() {
    const cached = window.kurocoCoreManifestUrlForPlugin;
    if (cached && cached.status === 'loaded') return cached.manifest;
    if (cached && cached.status === 'loading') return cached.promise;

    const promise = fetch(PREFIX_URL + 'manifest.json').then(response => response.json());
    window.kurocoCoreManifestUrlForPlugin = { status: 'loading', promise };
    const manifest = await promise;
    window.kurocoCoreManifestUrlForPlugin = { status: 'loaded', manifest };
    return manifest;
}

/** Adds a <script> (or <link> for .css) once per URL, shared across all bundles on the page. */
export function loadScriptOnce(src) {
    const tracked = window.scriptLoadingTracker[src];
    if (tracked && tracked.status === 'loaded') return Promise.resolve();
    if (tracked && tracked.status === 'loading') return tracked.promise;

    const promise = new Promise((resolve, reject) => {
        let element;
        if (src.endsWith('.css')) {
            element = document.createElement('link');
            element.rel = 'stylesheet';
            element.href = src;
        } else {
            element = document.createElement('script');
            element.src = src;
        }
        element.onload = () => {
            window.scriptLoadingTracker[src].status = 'loaded';
            resolve();
        };
        element.onerror = () => {
            window.scriptLoadingTracker[src].status = 'failed';
            reject(new Error(`Failed to load ${src}`));
        };
        document.body.appendChild(element);
    });
    window.scriptLoadingTracker[src] = { status: 'loading', promise };
    return promise;
}

/** Resolves true once window['common/components/extensions/Ext<name>'] is available. */
export async function loadExtComponent(name) {
    if (getExtComponent(name)) return true;

    const manifest = await getManifest();
    if (manifest['rcms-mng-vendors.js']) {
        await loadScriptOnce(PREFIX_URL + manifest['rcms-mng-vendors.js']);
    }
    const missing = CORE_COMPONENTS.filter(component => !getExtComponent(component));
    const files = ext => missing.map(c => manifest[`common/components/extensions/Ext${c}.${ext}`]).filter(Boolean);
    await Promise.all(files('css').map(file => loadScriptOnce(PREFIX_URL + file)));
    await Promise.all(files('js').map(file => loadScriptOnce(PREFIX_URL + file)));
    return !!getExtComponent(name);
}
