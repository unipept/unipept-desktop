<template>
    <div class="toolbar">
        <v-navigation-drawer
            :mini-variant="true"
            fixed :class="{'toolbar-navigation-drawer': !isMini}"
            permanent>
            <div class="navigation-toolbar" style="position: relative; top: 64px;">
                <v-list>
                    <v-list-item
                        :class="{'v-list-item--active': $route.path === '/'}"
                        link
                        @click="navigate('/', false)">
                        <v-list-item-icon>
                            <v-icon>mdi-home</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Home</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item
                        :disabled="$store.getters.projectLocation === ''"
                        :class="{'v-list-item--active': $route.path === '/analysis/single'}"
                        link
                        @click="navigate('/analysis/single', true)">
                        <v-list-item-icon>
                            <v-icon>mdi-bacteria</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Single assay analysis</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item
                        :disabled="$store.getters.projectLocation === ''"
                        :class="{'v-list-item--active': $route.path === '/analysis/multi'}"
                        link
                        @click="navigate('/analysis/multi', true)">
                        <v-list-item-icon>
                            <v-icon>mdi-test-tube</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Comparative analysis</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </div>
        </v-navigation-drawer>
        <div class="toolbar-content" :class="{'open': !isMini}" :style="{'width': toolbarWidth +'px'}" ref="toolbar">
            <div class="toolbar-container">
                <single-analysis-toolbar
                    :project="$store.getters.projectLocation === ''"
                    v-if="$route.path === '/analysis/single'">
                </single-analysis-toolbar>
                <comparative-analysis-toolbar
                    :project="$store.getters.projectLocation === ''"
                    v-if="$route.path === '/analysis/multi'">
                </comparative-analysis-toolbar>
            </div>
            <div class="v-navigation-drawer__border" style="width: 10px; cursor: col-resize;"></div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { Tooltip } from "unipept-web-components";
import SingleAnalysisToolbar from "./SingleAnalysisToolbar.vue";
import ComparativeAnalysisToolbar from "@/components/navigation-drawers/ComparativeAnalysisToolbar.vue";

@Component({
    components: {
        ComparativeAnalysisToolbar,
        Tooltip,
        SingleAnalysisToolbar
    },
    computed: {
        isMini: {
            get(): boolean {
                return ! ["/analysis/single", "/analysis/multi"].includes(this.$route.path);
            }
        }
    }
})
export default class Toolbar extends Vue {
    private minToolbarWidth: number = 169;
    private originalToolbarWidth: number = 210;
    private toolbarWidth: number = this.originalToolbarWidth;

    mounted() {
        this.setupDraggableToolbar();
    }

    private navigate(routeToGo: string, activateSidebar: boolean) {
        if (this.$route.path !== routeToGo) {
            this.$router.replace(routeToGo);
        }
    }

    private setupDraggableToolbar() {
        const toolbar = this.$refs.toolbar as Element;
        const drawerBorder = toolbar.querySelector(".v-navigation-drawer__border");

        let initialMousePos: number = 0;

        const mouseMoveListener = (moveE: MouseEvent) => {
            const xDifference = initialMousePos - moveE.x;
            const computedWidth = this.originalToolbarWidth -1 * xDifference;
            if (computedWidth >= this.minToolbarWidth) {
                this.toolbarWidth = computedWidth;
            }
        };

        drawerBorder.addEventListener("mousedown", (e: MouseEvent) => {
            initialMousePos = e.x;
            document.addEventListener("mousemove", mouseMoveListener);
        });

        document.addEventListener("mouseup", (e: MouseEvent) => {
            // Reset start position for next mousedown-event
            this.originalToolbarWidth = this.toolbarWidth;
            document.removeEventListener("mousemove", mouseMoveListener);
        });
    }

    @Watch("toolbarWidth")
    private onToolbarWidthChanged(newWidth: number) {
        this.$emit("update:toolbar-width", newWidth);
    }
}
</script>

<style lang="less">
    .select-sample-button {
        margin: 0 auto;
        display: block !important;
        position: absolute !important;
        bottom: 72px;
        left: 50%;
        transform: translateX(-50%);
    }

    .toolbar-content {
        height: 100%;
        position: fixed;
        left: 55px;
        background-color: white;
        border-right: 1px solid rgba(0, 0, 0, 0.12);
        display: none;
    }

    .toolbar-content.open {
        display: block;
    }

    .toolbar-content .v-list-item__action {
        min-width: 48px;
    }

    .toolbar-content .v-list-item__action span:first-child {
        margin-right: 8px;
    }

    .toolbar-container {
        position: relative;
        top: 64px;
        height: 100%;
    }

    .container-after-titlebar .toolbar-container {
        height: calc(100% - 30px);
    }

    // Change default styling of selected navigation drawer item.
    .navigation-toolbar .v-list-item--active .v-icon {
        // TODO extract this color to constants.less and import it.
        color: #1976D2 !important;
    }

    .navigation-toolbar .v-list-item--active {
        color: white !important;
    }

    .navigation-toolbar .v-list-item:hover {
        color: white !important;
    }

    .navigation-toolbar .v-list-item .v-icon:hover {
        color: #2196F3;
    }

    .v-list-item--disabled .v-icon {
        color: rgba(0, 0, 0, 0.15);
    }
</style>
