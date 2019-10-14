<template>
    <div class="toolbar">
        <v-navigation-drawer v-model="isOpen" :mini-variant="true" fixed :class="{'toolbar-navigation-drawer': !isMini}">
            <div style="position: relative; top: 64px;">
                <v-list>
                    <v-list-item :class="{'v-list-item--active': $route.path === '/'}" link @click="navigateAndToggleExpand('/')">
                        <v-list-item-icon>
                            <v-icon>mdi-bacteria</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Analyse</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <!-- <v-list-group prepend-icon="mdi-bacteria" >
                        <template v-slot:activator>
                            <v-list-item-content to="/">
                                <v-list-item-title>Analyse</v-list-item-title>
                            </v-list-item-content>
                        </template>
                        
                        <v-list-item @click="activateDataset(dataset)" v-for="dataset of this.$store.getters.selectedDatasets" :key="dataset.id">
                            <v-list-item-title>
                            {{ dataset.getName() }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                            {{ dataset.getAmountOfPeptides() }} peptides
                            </v-list-item-subtitle>
                            <v-list-item-action v-if="dataset.progress !== 1">
                                <v-progress-circular :rotate="-90" :size="24" :value="dataset.progress * 100" color="primary"></v-progress-circular>
                            </v-list-item-action>
                        </v-list-item>

                        <div>
                            <v-btn @click="selectSample" class="select-sample-button" depressed color="primary">Select sample</v-btn>
                        </div>
                    </v-list-group>

                    <v-list-group prepend-icon="mdi-tune">
                        <template v-slot:activator>
                            <v-list-item-content>
                            <v-list-item-title>Search settings</v-list-item-title>
                            </v-list-item-content>
                        </template>

                        <v-list-item>
                            <template v-slot:default="{active, toggle}">
                            <v-list-item-action>
                                <v-checkbox></v-checkbox>
                            </v-list-item-action>

                            <v-list-item-content>
                                <v-list-item-title>Equate I and L</v-list-item-title>
                            </v-list-item-content>
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:default="{active, toggle}">
                            <v-list-item-action>
                                <v-checkbox></v-checkbox>
                            </v-list-item-action>

                            <v-list-item-content>
                                <v-list-item-title>Filter duplicate peptides</v-list-item-title>
                            </v-list-item-content>
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:default="{active, toggle}">
                            <v-list-item-action>
                                <v-checkbox></v-checkbox>
                            </v-list-item-action>

                            <v-list-item-content>
                                <v-list-item-title>Advanced missing cleavage handling</v-list-item-title>
                            </v-list-item-content>
                            </template>
                        </v-list-item>
                    </v-list-group> -->

                    <v-list-item link to='/settings'>
                        <v-list-item-icon>
                            <v-icon>mdi-settings</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Settings</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </div>
        </v-navigation-drawer>
        <div class="toolbar-content" :style="isMini ? 'display: none' : 'display: block;'">
            <div style="position: relative; top: 64px;">
                <span>Assays</span>
                <v-list>
                    <v-list-item @click="activateDataset(dataset)" v-for="dataset of this.$store.getters.selectedDatasets" :key="dataset.id">
                        <v-list-item-title>
                            {{ dataset.getName() }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ dataset.getAmountOfPeptides() }} peptides
                        </v-list-item-subtitle>
                        <v-list-item-action v-if="dataset.progress !== 1">
                            <v-progress-circular :rotate="-90" :size="24" :value="dataset.progress * 100" color="primary"></v-progress-circular>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import PeptideContainer from 'unipept-web-components/src/logic/data-management/PeptideContainer';

@Component
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
    .drawer-chevron {
        position: absolute !important;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        left: 42px;
    }

    .drawer-chevron-open {
        left: 218px !important;
    }

    .select-sample-button {
        margin: 0 auto;
        display: block !important;
    }

    .toolbar-content {
        height: 100%;
        position: fixed; 
        left: 80px; 
        width: 176px; 
        background-color: white;
        border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    .toolbar-navigation-drawer > .v-navigation-drawer__border {
        display: none;
    }

    // Change default styling of selected navigation drawer item.
    .toolbar .v-list-item--active .v-icon {
        // TODO extract this color to constants.less and import it.
        color: #1976D2 !important; 
    }

    .toolbar .v-list-item--active {
        color: white !important;
    }

    .toolbar .v-list-item:hover {
        color: white !important;
    }
</style>