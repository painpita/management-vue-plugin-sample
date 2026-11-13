export default {
    props: {
        isLoaded: { type: Boolean, required: true },
        activated: { type: Boolean, required: true },
    },
    data() {
        return {
            extComponentName: '',
            flagToLoadOnce: false,
        };
    },
    methods: {
        checkAndLoadDynamicExtComponent() {
            if (this.isLoaded && this.activated && !this.flagToLoadOnce) {
                const extComponent = window['common/components/extensions/' + this.extComponentName];
                if (extComponent) {
                    this.$options.components[this.extComponentName] = extComponent;
                    this.flagToLoadOnce = true;
                } else {
                    // eslint-disable-next-line no-console
                    console.error(
                        `${this.extComponentName} not found in window['common/components/extensions/']. ` +
                            'Make sure Kuroco core components are loaded.'
                    );
                }
            }
        },
    },
    mounted() {
        this.checkAndLoadDynamicExtComponent();
    },
    watch: {
        isLoaded: {
            immediate: true,
            handler() {
                this.checkAndLoadDynamicExtComponent();
            },
        },
        activated: {
            immediate: true,
            handler() {
                this.checkAndLoadDynamicExtComponent();
            },
        },
    },
};
