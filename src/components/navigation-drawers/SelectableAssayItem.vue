<template>
    <div>
        <div @click="selectAssay()" class="assay-item">
            <v-progress-circular
                v-if="progress !== 1"
                :rotate="-90" :size="16"
                :value="progress * 100"
                color="primary">
            </v-progress-circular>
            <v-icon
                color="#424242"
                size="20"
                v-if="progress === 1">
                mdi-text-box-outline
            </v-icon>
            <span>
                {{ assay.getName() }}
            </span>

            <div style="display: flex; flex-direction: row; margin-left: auto; height: 32px;">
                <tooltip message="Add assay to comparative analysis." position="bottom">
                    <v-checkbox v-model="selected" dense @click.native.stop :disabled="progress !== 1"></v-checkbox>
                </tooltip>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Tooltip from "unipept-web-components/src/components/custom/Tooltip.vue";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import { Prop, Watch } from "vue-property-decorator";
import Project from "@/logic/filesystem/project/Project";

@Component({
    components: {
        Tooltip
    },
    computed: {
        progress: {
            get(): number {
                return this.project.getProcessingResults(this.assay).progress;
            }
        },
        errorStatus: {
            get(): boolean {
                return this.project.getProcessingResults(this.assay).errorStatus;
            }
        }
    }
})
export default class SelectableAssayItem extends Vue {
    @Prop({ required: true })
    private assay: Assay;
    @Prop({ required: false, default: false })
    private value: boolean;
    @Prop({ required: true })
    private project: Project;

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
