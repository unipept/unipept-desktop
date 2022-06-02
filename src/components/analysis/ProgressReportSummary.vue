<template>
    <div class="d-flex" style="width: 100%;">
        <div
            :class="{
                'flex-grow-1': true,
                'd-flex': true,
                'justify-center': !logsEnabled,
                'justify-start': logsEnabled
            }"
        >
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

                        <v-avatar
                            v-else
                            :color="progressReport.startTimes[idx] === -1 ? 'grey' : 'green'"
                            size="20"
                            class="my-1">
                            <v-icon dark>mdi-check</v-icon>
                        </v-avatar>
                        <div class="ml-2">
                            <div>
                                <span>{{ step }}</span>
                                <span v-if="progressReport.currentStep === idx && progressReport.currentValue !== -1">
                                    ({{ progressReport.currentValue }}%)
                                </span>
                                <span
                                    v-if="progressReport.currentStep > idx && progressReport.startTimes[idx] !== -1"
                                    class="text--secondary">
                                    (completed in {{ msToTimeString(progressReport.endTimes[idx] - progressReport.startTimes[idx]) }})
                                </span>
                                <span
                                    v-if="progressReport.currentStep > idx && progressReport.startTimes[idx] === 0"
                                    class="text--secondary">
                                    (reused cached version)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <v-divider v-if="logsEnabled" vertical class="mx-6" />
        <textarea
            v-if="logsEnabled"
            id="logview"
            :value="progressReport.logs.join('\n')"
            disabled
            class="pa-2"
            @change="onLogsChanged"/>
        <div class="ml-4" v-if="withLogs">
            <v-tooltip bottom open-delay="500">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn icon outlined @click="toggleLogView" v-on="on">
                        <v-icon>mdi-text-box-outline</v-icon>
                    </v-btn>
                </template>
                <span>Toggle logs</span>
            </v-tooltip>
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
    /**
     * Should this component allow the user to view logs?
     */
    @Prop({ required: false, default: false })
    private withLogs: boolean;

    /**
     * Did the user ask this component to be able to view logs?
     */
    private logViewEnabled: boolean = true;

    private currentTime: number = new Date().getTime();

    get logsEnabled() {
        return this.withLogs && this.logViewEnabled;
    }

    private mounted() {
        // Update the current time value every second so that it is also updated in the render
        setInterval(() => {
            this.currentTime = new Date().getTime();
        }, 1000);
    }

    @Watch("progressReport", { deep: true })
    private onLogsChanged() {
        const logArea = (document.getElementById("logview") as HTMLTextAreaElement);

        if (logArea) {
            // Wait for the element to be effectively updated, before we scroll
            this.$nextTick(() => {
                logArea.scrollTop = logArea.scrollHeight;
            });
        }
    }

    private toggleLogView() {
        this.logViewEnabled = !this.logViewEnabled;
        this.onLogsChanged();
    }

    private msToTimeString(ms: number) {
        return StringUtils.secondsToTimeString(ms / 1000);
    }
}
</script>

<style scoped>
#logview {
    background-color: #1a1a1a;
    color: white;
    font-family: "Roboto mono", monospace;
    width: 50%;
}
</style>
