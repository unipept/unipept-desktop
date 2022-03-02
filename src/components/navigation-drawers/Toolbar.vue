<template>
    <div class="toolbar">
        <v-navigation-drawer
            :mini-variant="true"
            fixed :class="{'toolbar-navigation-drawer': !isMini}"
            permanent>
            <div
                class="navigation-toolbar"
                style="position: relative; top: 64px; height: calc(100% - 64px); display: flex; flex-direction: column;"
            >
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
                            <v-icon>mdi-test-tube</v-icon>
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
                            <v-icon>$vuetify.icons.testMultiple</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Comparative analysis</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
                <div style="flex-grow: 1;"></div>
                <v-list>
                    <v-list-item
                        :class="{'v-list-item--active': $route.path.includes('/peptide/single')}"
                        link
                        @click="navigate('/peptide/single', false)">
                        <v-list-item-icon>
                            <v-icon>mdi-bacteria</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Single peptide analysis</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
<!--                    <v-list-item-->
<!--                        :class="{'v-list-item&#45;&#45;active': $route.path.includes('/databases')}"-->
<!--                        link-->
<!--                        @click="navigate('/databases', false)">-->
<!--                        <v-list-item-icon>-->
<!--                            <v-icon>mdi-database-cog</v-icon>-->
<!--                        </v-list-item-icon>-->
<!--                        <v-list-item-content>-->
<!--                            <v-list-item-title>Custom databases</v-list-item-title>-->
<!--                        </v-list-item-content>-->
<!--                    </v-list-item>-->
                    <v-list-item
                        :class="{'v-list-item--active': $route.path === '/settings'}"
                        link
                        @click="navigate('/settings', false)">
                        <v-list-item-icon>
                            <v-icon>mdi-cog-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                            <v-list-item-title>Settings</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </div>
        </v-navigation-drawer>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import { Tooltip } from "unipept-web-components";

@Component({
    components: {
        Tooltip,
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
    private originalToolbarWidth: number = 210;
    private toolbarWidth: number = this.originalToolbarWidth;

    private navigate(routeToGo: string, activateSidebar: boolean) {
        if (this.$route.path !== routeToGo) {
            this.$router.replace(routeToGo);
        }
    }


}
</script>

<style lang="less">
    .container-after-titlebar .toolbar-container {
        height: calc(100% - 30px);
    }

    // Change default styling of selected navigation drawer item.
    .navigation-toolbar .v-list-item--active .v-icon {
        // TODO extract this color to constants.less and import it.
        color: #1976D2 !important;
    }

    .navigation-toolbar .v-list-item .v-icon:hover {
        color: #2196f3;
    }

    .v-list-item--disabled .v-icon {
        color: rgb(170, 170, 170) !important;
    }

    .v-list-item:hover .v-icon {
        color: #2196f3;
    }
</style>
