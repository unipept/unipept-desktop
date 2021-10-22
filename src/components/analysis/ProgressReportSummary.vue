<template>
    <div>
        <div
            v-for="(step, idx) in progressReport.steps"
            :key="step"
            :class="progressReport.currentStep >= idx ? 'text--primary' : 'text--disabled'">
            <div class="d-flex align-center">
                <v-progress-circular
                    v-if="progressReport.currentStep <= idx"
                    :value="progressReport.currentStep === idx ? progressReport.currentValue : 0"
                    color="primary"
                    size="20"
                    class="my-1"
                    :rotate="progressReport.currentValue === -1 ? 0 : -90"
                    :indeterminate="progressReport.currentStep === idx && progressReport.currentValue === -1">
                </v-progress-circular>

                <v-avatar v-else :color="progressReport.startTimes[idx] === -1 ? 'grey' : 'green'" size="20" class="my-1">
                    <v-icon dark>mdi-check</v-icon>
                </v-avatar>
                <div class="ml-2">
                    <div>
                        <span>{{ step }}</span>
                        <span v-if="progressReport.currentStep === idx && progressReport.currentValue !== -1">
                            ({{ progressReport.currentValue }}%)
                        </span>
                        <span v-if="progressReport.currentStep > idx && progressReport.startTimes[idx] !== -1" class="text--secondary">
                            (completed in {{ msToTimeString(progressReport.endTimes[idx] - progressReport.startTimes[idx]) }})
                        </span>
                        <span v-if="progressReport.currentStep > idx && progressReport.startTimes[idx] === 0" class="text--secondary">
                            (reused cached version)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import { ProgressReport, StringUtils } from "unipept-web-components";

@Component
export default class ProgressReportSummary extends Vue {
    @Prop({ required: true })
    private progressReport: ProgressReport;

    private currentTime: number = new Date().getTime();

    private mounted() {
        // Update the current time value every second so that it is also updated in the render
        setInterval(() => {
            this.currentTime = new Date().getTime();
        }, 1000);
    }

    private msToTimeString(ms: number) {
        return StringUtils.secondsToTimeString(ms / 1000);
    }
}
</script>

<style scoped>

</style>
