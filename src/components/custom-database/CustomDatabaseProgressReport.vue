<template>
    <div>
        <div
            v-for="(step, idx) in steps"
            :key="step"
            :class="progressInfo.progress_step >= idx ? 'text--primary' : 'text--disabled'">
            <div class="d-flex align-center">
                <v-progress-circular
                    v-if="progressInfo.progress_step <= idx"
                    :value="progressInfo.progress_step === idx ? progressInfo.value : 0"
                    color="primary"
                    size="20"
                    class="my-1"
                    :indeterminate="progressInfo.progress_step === idx && progressInfo.value === -1">
                </v-progress-circular>

                <v-avatar v-else :color="progressInfo.startTimes[idx] === -1 ? 'grey' : 'green'" size="20" class="my-1">
                    <v-icon dark>mdi-check</v-icon>
                </v-avatar>
                <span class="ml-2">
                    {{ step }}
                    <span v-if="progressInfo.progress_step === idx && progressInfo.value !== -1">
                        ({{ progressInfo.value }}%)
                    </span>
                    <span v-if="progressInfo.progress_step > idx && progressInfo.startTimes[idx] !== -1" class="text--secondary">
                        (completed in {{ msToTimeString(progressInfo.endTimes[idx] - progressInfo.startTimes[idx]) }})
                    </span>
                    <span v-if="progressInfo.progress_step > idx && progressInfo.startTimes[idx] === -1" class="text--secondary">
                        (reused cached version)
                    </span>
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { StringUtils } from "unipept-web-components";

@Component
export default class CustomDatabaseProgressReport extends Vue {
    @Prop({ required: true })
    private db: CustomDatabase;

    private steps: string[] = [
        "Creating taxon tables",
        "Initializing database build process",
        "Downloading database",
        "Processing chunks",
        "Started building main database tables",
        "Calculating lowest common ancestors",
        "Calculating functional annotations",
        "Sorting peptides",
        "Creating sequence table",
        "Fetching EC numbers",
        "Fetching GO terms",
        "Fetching InterPro entries",
        "Filling database and computing indices"
    ];

    get progressInfo() {
        return this.$store.getters.databaseInfo(this.db).progress;
    }

    private msToTimeString(ms: number) {
        return StringUtils.secondsToTimeString(ms / 1000);
    }
}
</script>

<style scoped>

</style>
