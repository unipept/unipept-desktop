<template>
    <div>
        <div class="study-item">
            <v-icon
                    v-if="!collapsed"
                    color="#424242"
                    style="padding-left: 8px;"
                    @click="collapsed = !collapsed">
                mdi-chevron-down
            </v-icon>
            <v-icon
                    v-else
                    color="#424242"
                    style="padding-left: 8px;"
                    @click="collapsed = !collapsed">
                mdi-chevron-right
            </v-icon>
            <span class="study-item-name">
                {{ study.getName() }}
            </span>
            <div class="study-action" style="margin-right: 0;">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                        <v-checkbox dense></v-checkbox>
                    </template>
                    <span>Toggle selection of all assays in this study.</span>
                </v-tooltip>
            </div>
        </div>
        <div class="assay-items" v-if="study.getAssays().length > 0 && !collapsed">
            <selectable-assay-item
                v-for="assay of sortedAssays"
                :assay="assay"
                :study="study"
                v-bind:key="assay.id">
            </selectable-assay-item>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import SelectableAssayItem from "@/components/navigation-drawers/SelectableAssayItem.vue";
import { Prop } from "vue-property-decorator";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";

@Component({
    components: {
        SelectableAssayItem
    },
    computed: {
        sortedAssays: {
            get(): Assay[] {
                return this.study.getAssays().sort(
                    (a: Assay, b: Assay) => a.getName().localeCompare(b.getName())
                )
            }
        }
    }
})
export default class SelectableStudyItem extends Vue {
    @Prop({ required: true })
    private study: Study;

    private collapsed: boolean = false;
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/study-item.css.less";
</style>
