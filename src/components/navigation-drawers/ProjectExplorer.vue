<template>
    <div class="project-explorer" :style="{'width': explorerWidth +'px'}" ref="projectExplorer">
        <div class="project-explorer-container">
            <div class="d-flex flex-column" style="min-height: 100%;">
                <div v-if="$store.getters.studies.length === 0"
                     class="sample-list-placeholder flex-grow-1">
                    No studies present.
                </div>
                <div v-else class="flex-grow-1">
                    <div
                        v-for="study of sortedStudies"
                        :key="study.getId()">
                        <study-item
                            :study="study"
                            :selectable="$route.path === '/analysis/multi'"
                            v-on:createAssay="createAssay">
                        </study-item>
                    </div>
                </div>
                <div class="text-center mt-4 mb-4">
                    <v-btn class="select-sample-button" depressed color="primary" @click="createStudy()">
                        Create study
                    </v-btn>
                </div>
            </div>
        </div>
        <div class="v-navigation-drawer__border" style="width: 10px; cursor: col-resize;"></div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Study, Tooltip } from "unipept-web-components";
import StudyItem from "@/components/navigation-drawers/StudyItem.vue";
import mkdirp from "mkdirp";
import { Watch } from "vue-property-decorator";
import StudyFileSystemDataWriter from "@/logic/filesystem/study/StudyFileSystemDataWriter";

@Component({
    components: {
        Tooltip,
        StudyItem
    },
    computed: {
        sortedStudies: {
            get(): Study[] {
                return this.$store.getters.studies.sort(
                    (a: Study, b: Study) => a.getName().localeCompare(b.getName())
                )
            }
        }
    }
})
export default class ProjectExplorer extends Vue {
    private minExplorerWidth = 169;
    private originalExplorerWidth = 210;
    private explorerWidth: number = this.originalExplorerWidth;

    mounted() {
        this.setupDraggableExplorer();
    }

    private async createStudy() {
        // Check which studies already exist, and make sure there isn't one with the same name.
        const unknowns: number[] = this.$store.getters.studies
            .map((s: Study) => s.getName())
            .filter((s: string) => s.startsWith("Study name"))
            .map((s: string) => s.replace(/[^0-9]/g, ""))
            .map((s: string) => s === "" ? 0 : parseInt(s));

        let studyName = "Study name";
        if (unknowns.length > 0) {
            studyName += ` (${Math.max(...unknowns) + 1})`
        }

        const study = new Study();
        study.setName(studyName);
        await this.$store.dispatch("addStudy", study);

        const studyWriter = new StudyFileSystemDataWriter(
            `${this.$store.getters.projectLocation}/${studyName}`,
            this.$store.getters.dbManager
        );
        study.accept(studyWriter);
    }

    private setupDraggableExplorer() {
        const toolbar = this.$refs.projectExplorer as Element;
        const drawerBorder = toolbar.querySelector(".v-navigation-drawer__border");

        let initialMousePos = 0;

        const mouseMoveListener = (moveE: MouseEvent) => {
            const xDifference = initialMousePos - moveE.x;
            const computedWidth = this.originalExplorerWidth -xDifference;
            if (computedWidth >= this.minExplorerWidth) {
                this.explorerWidth = computedWidth;
            }
        };

        drawerBorder.addEventListener("mousedown", (e: MouseEvent) => {
            initialMousePos = e.x;
            document.addEventListener("mousemove", mouseMoveListener);
        });

        document.addEventListener("mouseup", (e: MouseEvent) => {
            // Reset start position for next mousedown-event
            this.originalExplorerWidth = this.explorerWidth;
            document.removeEventListener("mousemove", mouseMoveListener);
        });
    }

    @Watch("explorerWidth")
    private onExplorerWidthChanged(newWidth: number) {
        this.$emit("widthChange", newWidth);
    }

    private createAssay(study: Study) {
        this.$emit("createAssay", study);
    }
}
</script>

<style scoped>
    .sample-list-placeholder {
        margin-left: 8px;
        margin-right: 8px;
        margin-top: 16px;
        text-align: center;
    }

    .project-explorer {
        height: 100%;
        position: fixed;
        left: 55px;
        background-color: white;
        border-right: 1px solid rgba(0, 0, 0, 0.12);
        display: block;
    }

    .project-explorer .v-list-item__action {
        min-width: 48px;
    }

    .project-explorer .v-list-item__action span:first-child {
        margin-right: 8px;
    }

    .project-explorer-container {
        height: calc(100vh - 64px);
        overflow-y: auto;
    }
</style>
