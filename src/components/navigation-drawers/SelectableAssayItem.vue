<template>
    <div>
        <div @click="selectAssay()" class="assay-item">
            <v-progress-circular
                v-if="assay.progress !== 1"
                :rotate="-90" :size="16"
                :value="assay.progress * 100"
                color="primary">
            </v-progress-circular>
            <v-icon
                color="#424242"
                size="20"
                v-if="assay.progress === 1">
                mdi-file-document-box-outline
            </v-icon>
            <span>
                {{ assay.getName() }}
            </span>

            <div style="display: flex; flex-direction: row; margin-left: auto; height: 32px;">
                <tooltip message="Add assay to comparative analysis." position="bottom">
                    <v-checkbox v-model="selected" dense></v-checkbox>
                </tooltip>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import ExperimentSummaryDialog from "@/components/analysis/ExperimentSummaryDialog.vue";
import { Prop, Watch } from "vue-property-decorator";

@Component({
    components: {
        Tooltip
    }
})
export default class SelectableAssayItem extends Vue {
    @Prop({ required: true })
    private assay: Assay;
    @Prop({ required: false, default: false })
    private value: boolean;

    private selected: boolean = false;

    private mounted() {
        this.onValueChanged();
    }

    private selectAssay() {
        this.selected = !this.selected;
    }

    @Watch("value")
    private onValueChanged() {
        this.selected = this.value;
    }

    @Watch("selected")
    private onSelectedChanged() {
        this.$emit("input", this.selected);
    }
}
</script>

<style scoped lang="less">
    @import "./../../assets/style/navigation-drawers/assay-item.css.less";
</style>
