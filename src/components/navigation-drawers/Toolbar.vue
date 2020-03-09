<template>
    <div class="toolbar">
        <v-navigation-drawer
            v-model="isOpen"
            :mini-variant="true"
            fixed :class="{'toolbar-navigation-drawer': !isMini}"
            permanent>
            <div class="navigation-toolbar" style="position: relative; top: 64px;">
                <v-list>
                    <v-list-item
                        :class="{'v-list-item--active': $route.path === '/'}"
                        link
                        @click="navigateAndCloseSideBar('/')">
                        <v-list-item-icon>
                            <v-icon>mdi-home</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Home</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item
                        :disabled="$store.getters.getProject === null"
                        :class="{'v-list-item--active': $route.path === '/analysis/single'}"
                        link
                        @click="navigateAndToggleExpand('/analysis/single')">
                        <v-list-item-icon>
                            <v-icon>mdi-bacteria</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Analyse</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item
                        :disabled="$store.getters.getProject === null"
                        :class="{'v-list-item--active': $route.path === '/analysis/multi'}"
                        link
                        @click="navigateAndToggleExpand('/analysis/multi')">
                        <v-list-item-icon>
                            <v-icon>mdi-test-tube</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Comparison</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </div>
        </v-navigation-drawer>
        <div class="toolbar-content" :class="{'open': !isMini}" :style="{'width': toolbarWidth +'px'}" ref="toolbar">
            <div class="toolbar-container">
                <single-analysis-toolbar
                    :project="$store.getters.getProject"
                    v-if="$route.path === '/analysis/single'">
                </single-analysis-toolbar>
                <comparative-analysis-toolbar
                    :project="$store.getters.getProject"
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
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import PeptideContainer from "unipept-web-components/src/logic/data-management/PeptideContainer";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import SingleAnalysisToolbar from "./SingleAnalysisToolbar.vue";
import ComparativeAnalysisToolbar from "@/components/navigation-drawers/ComparativeAnalysisToolbar.vue";

@Component({
    components: {
        ComparativeAnalysisToolbar,
        Tooltip,
        SingleAnalysisToolbar
    }
})
export default class Toolbar extends Vue {
    @Prop({ required: false, default: false })
    private open: boolean;
    @Prop({ required: false, default: true })
    private mini: boolean;

    // These are the models that will be used internally by this component to sync the current state.
    private isOpen: boolean = false;
    private isMini: boolean = true;

    private minToolbarWidth: number = 169;
    private originalToolbarWidth: number = 210;
    private toolbarWidth: number = this.originalToolbarWidth;

    mounted() {
        this.isOpen = this.open;
        this.isMini = this.mini;
        this.setupDraggableToolbar();
    }

    @Watch("open")
    private onOpenChanged() {
        this.isOpen = this.open;
    }

    @Watch("mini")
    private onMiniChanged() {
        this.isMini = this.mini;
    }

    @Watch("isOpen")
    private onIsOpenChanged() {
        this.$emit("update:open", this.isOpen);
    }

    @Watch("isMini")
    private onIsMiniChanged() {
        this.$emit("update:mini", this.isMini);
    }

    /**
     * The visibility of the sidebar should only toggle when the current route is the same as the route that a
     * component click should lead to.
     */
    private navigateAndToggleExpand(routeToGo: string) {
        if (this.$route.path === routeToGo) {
            // The toolbar content is only expanded when the current page is already activated. (The toolbar does
            // not expand when navigation takes place).
            this.isMini = !this.isMini;
        } else {
            // If the user does wan't to navigate, we change the current path.
            this.$router.replace(routeToGo);
        }
    }

    private navigateAndCloseSideBar(routeToGo: string) {
        if (this.$route.path !== routeToGo) {
            this.isMini = true;
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
