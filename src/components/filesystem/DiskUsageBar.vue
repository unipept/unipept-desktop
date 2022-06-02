<template>
    <div>
        <div v-if="error">
            Disk space information not available
        </div>
        <div v-else>
            <div class="d-flex">
                <div :style="{
                'background-color': '#1976d2',
                'height': '15px',
                'flex': (100 - totalFreeSpacePercentage),
                'text-align': 'center',
                'color': 'white'
            }"
                >
                </div>
                <div :style="{
                'background-color': '#ff5722',
                'height': '15px',
                'flex': spaceUsedByFolderPercentage
            }"
                >
                </div>
                <div :style="{
                'background-color': '#cecece',
                'height': '15px',
                'flex': totalFreeSpacePercentage
            }"
                >
                </div>
            </div>
            <div class="d-flex align-center">
                <div style="width: 15px; height: 15px; background-color: #1976d2;" class="ma-2"></div>
                <span>{{ Math.round((totalDiskSpace - totalFreeSpace) / (1024 ** 3)) }} GiB used space</span>
                <div style="width: 15px; height: 15px; background-color: #ff5722;" class="ma-2"></div>
                <span>{{ Math.round((spaceUsedByFolder) / (1024 ** 3)) }} GiB used by the application</span>
                <div style="width: 15px; height: 15px; background-color: #cecece;" class="ma-2"></div>
                <span>{{ Math.round((totalFreeSpace) / (1024 ** 3)) }} GiB free space</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import FileSystemUtils from "@/logic/filesystem/FileSystemUtils";

@Component
export default class DiskUsageBar extends Vue {
    @Prop({ required: true })
    /**
     * Folder for which the currently used disk usage should be shown.
     */
    private folder: string;

    private totalDiskSpace: number = 0;
    private totalFreeSpace: number = 0;
    private totalFreeSpacePercentage: number = 0;
    private spaceUsedByFolder: number = 0;
    private spaceUsedByFolderPercentage: number = 0;

    private error: boolean = false;

    private interval: NodeJS.Timeout;

    private async mounted() {
        await this.update();
        this.interval = setInterval(() => {
            this.update();
        }, 1000);
    }

    private async beforeDestroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    private async update() {
        if (this.folder) {
            try {
                const spaceReport = await FileSystemUtils.getDiskStats(this.folder);
                this.totalDiskSpace = spaceReport.total;
                this.totalFreeSpace = spaceReport.free;

                this.spaceUsedByFolder = await FileSystemUtils.getSize(this.folder);

                this.totalFreeSpacePercentage = Math.round((this.totalFreeSpace / this.totalDiskSpace) * 100);
                this.spaceUsedByFolderPercentage = Math.round((this.spaceUsedByFolder / this.totalDiskSpace) * 100);

                this.error = false;
            } catch (err) {
                this.error = true;
            }
        }
    }
}
</script>

<style scoped>

</style>
