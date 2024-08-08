<template>
  <div
      class="tooltip-wrapper"
      @mouseenter="startShowTooltipTimer"
      @mouseleave="cancelShowTooltipTimer"
  >
    <slot></slot>
    <div
        v-if="visible"
        class="custom-tooltip"
        ref="tooltip"
        @mouseenter="cancelHideTooltipTimer"
        @mouseleave="startHideTooltipTimer"
    >
      Missed cleavage handling is now always enabled. Because of a change in
      Unipept's underlying search engine, enabling missed cleavage handling no
      longer results in a performance penalty. As a result, this configuration
      option will be removed in a future release. See
      <a
          href="https://github.com/unipept/unipept/wiki/Unipept-Next"
          target="_blank"
          rel="noopener noreferrer"
          class="text-white"
      >this page</a>
      for more information.
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class CustomTooltip extends Vue {
  visible = false;
  showTooltipTimer: number | null = null;
  hideTooltipTimer: number | null = null;

  startShowTooltipTimer() {
    this.cancelHideTooltipTimer();
    if (this.showTooltipTimer !== null) {
      clearTimeout(this.showTooltipTimer);
      this.showTooltipTimer = null;
    }
    this.showTooltipTimer = window.setTimeout(() => {
      this.visible = true;
    }, 300);
  }

  cancelShowTooltipTimer() {
    if (this.showTooltipTimer !== null) {
      clearTimeout(this.showTooltipTimer);
      this.showTooltipTimer = null;
    }
    this.startHideTooltipTimer();
  }

  startHideTooltipTimer() {
    this.cancelHideTooltipTimer();
    this.hideTooltipTimer = window.setTimeout(() => {
      this.visible = false;
    }, 1000);
  }

  cancelHideTooltipTimer() {
    if (this.hideTooltipTimer !== null) {
      clearTimeout(this.hideTooltipTimer);
      this.hideTooltipTimer = null;
    }
  }
}
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
  overflow: visible;
}

.custom-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #323232;
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  margin-bottom: 8px;
  transition: opacity 0.2s ease-in-out;
  pointer-events: auto;
  max-width: 400px;
  width: max-content;
  overflow: hidden;
  white-space: normal;
  line-height: 1.4;
}

.custom-tooltip a {
  color: #1e88e5;
  text-decoration: underline;
}

.custom-tooltip a:hover {
  color: #1565c0;
}
</style>
