<template>
    <div class="toolbar">
        <v-navigation-drawer v-model="isOpen" :mini-variant="true" fixed :class="{'toolbar-navigation-drawer': !isMini}" permanent>
            <div class="navigation-toolbar" style="position: relative; top: 64px;">
                <v-list>
                    <v-list-item :class="{'v-list-item--active': $route.path === '/'}" link @click="navigateAndToggleExpand('/')">
                        <v-list-item-icon>
                            <v-icon>mdi-bacteria</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Analyse</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item :class="{'v-list-item--active': $route.path === '/compare'}" link @click="navigateAndToggleExpand('/compare')">
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
        <div class="toolbar-content" :style="isMini ? 'display: none' : 'display: block;'">
            <div class="toolbar-container">
                <div class="sample-list-placeholder" v-if="!this.$store.getters.selectedDatasets || this.$store.getters.selectedDatasets.length === 0">
                    No samples selected.
                </div>
                <v-list dense>
                    <v-list-item :class="{'v-list-item--active': $store.getters.activeDataset === dataset}" @click="activateDataset(dataset)" v-for="dataset of this.$store.getters.selectedDatasets" :key="dataset.id">
                        <v-list-item-title>
                            {{ dataset.getName() }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ dataset.getAmountOfPeptides() }} peptides
                        </v-list-item-subtitle>
                        <v-list-item-action>
                            <v-progress-circular v-if="dataset.progress !== 1" :rotate="-90" :size="18" :value="dataset.progress * 100" color="primary"></v-progress-circular>
                            <tooltip v-else message="Remove dataset from analysis." position="bottom">
                                <v-icon @click="deselectDataset(dataset)" v-on:click.stop small>mdi-close</v-icon>
                            </tooltip>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
                <v-btn @click="selectSample" class="select-sample-button" depressed color="primary">Select sample</v-btn>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import Tooltip from 'unipept-web-components/src/components/custom/Tooltip.vue';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';

@Component({
    components: {
        Tooltip
    }
})
export default class Toolbar extends Vue {
    @Prop({required: false, default: false})
    private open: boolean;
    @Prop({required: false, default: true})
    private mini: boolean;

    // These are the models that will be used internally by this component to sync the current state.
    private isOpen: boolean = false;
    private isMini: boolean = true;

    mounted() {
        this.isOpen = this.open;
        this.isMini = this.mini;
    }

    @Watch("open")
    private onOpenChanged() {
        this.isOpen = this.open;
    }

    @Watch("mini")
    private onMiniChanged() {
        console.log("IN TOOLBAR CHANGED: --> " + this.mini);
        this.isMini = this.mini;
    }

    @Watch('isOpen')
    private onIsOpenChanged() {
        this.$emit('update:open', this.isOpen);
    }

    @Watch('isMini')
    private onIsMiniChanged() {
        this.$emit('update:mini', this.isMini);
    }

    private selectSample() {
        this.$emit('click-select-sample');
    }

    private activateDataset(dataset: PeptideContainer) {
        this.$emit('activate-dataset', dataset);
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
        left: 80px; 
        width: 210px; 
        background-color: white;
        border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    .toolbar-container {
        position: relative; 
        top: 56px; 
        height: 100%;
    }

    .container-after-titlebar .toolbar-container {
        height: calc(100% - 30px);
    }

    .sample-list-placeholder {
        margin-left: 8px; 
        margin-right: 8px;
        position: relative;
        top: 16px;
        text-align: center;
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
</style>