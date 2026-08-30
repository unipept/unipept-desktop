<template>
  <div
      :class="{
            'search-settings-form': true,
            'd-flex': true,
            'flex-column': !horizontal,
            'flex-row': horizontal,
            'justify-space-between': horizontal
    }">
    <tooltip message="Equate isoleucine (I) and leucine (L) when matching peptides to UniProt entries.">
      <v-checkbox :disabled="disabled" v-model="equateIlModel" label="Equate I and L" hide-details class="mt-0">
        <span slot="label">Equate I and L</span>
      </v-checkbox>
    </tooltip>
    <tooltip message="Remove duplicate peptides from the input before searching.">
      <v-checkbox :disabled="disabled" v-model="filterDuplicatesModel" hide-details class="mt-0">
        <span slot="label">Filter duplicate peptides</span>
      </v-checkbox>
    </tooltip>
    <custom-tooltip message="Recombine subpeptides of miscleavages. Enabling this has a serious performance impact!">
      <v-checkbox disabled input-value="true" hide-details class="mt-0">
        <span slot="label">Advanced missed cleavage handling</span>
      </v-checkbox>
    </custom-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import CustomTooltip from "@/components/analysis/CustomTooltip.vue";
import { Tooltip } from "unipept-web-components"

@Component({
  components: {
    CustomTooltip,
    Tooltip
  },
  computed: {
    equateIlModel: {
      get() {
        return this.equateIl;
      },
      set(val) {
        this.equateIlData = val;
        this.$emit("update:equate-il", val);
      }
    },
    filterDuplicatesModel: {
      get(): boolean {
        return this.filterDuplicates;
      },
      set(val: boolean) {
        this.filterDuplicatesData = val;
        this.$emit("update:filter-duplicates", val);
      }
    },
    missingCleavageModel: {
      get() {
        return this.missingCleavage;
      },
      set(val) {
        this.missingCleavageData = val;
        this.$emit("update:missing-cleavage", val);
      }
    }
  }
})
export default class SearchSetingsForm extends Vue {
  @Prop({ default: false }) disabled!: boolean;
  @Prop({ default: true }) equateIl!: boolean;
  @Prop({ default: true }) filterDuplicates!: boolean;
  @Prop({ default: false }) missingCleavage!: boolean;
  /**
   * Show the component in a horizontal or vertical fashion? Set to true to show the different checkboxes on one line.
   */
  @Prop({ required: false, default: true })
  private horizontal: boolean;

  private equateIlData: boolean = this.equateIl;
  private filterDuplicatesData: boolean = this.filterDuplicates;
  private missingCleavageData: boolean = this.missingCleavage;

  @Watch("equateIl") onEquateIlChanged() {
    this.equateIlData = this.equateIl;
  }

  @Watch("filterDuplicates") onFilterDuplicatesChanged() {

    this.filterDuplicatesData = this.filterDuplicates;
  }

  @Watch("missingCleavage") onMissingCleavageChanged() {
    this.missingCleavageData = this.missingCleavage;
  }
}
</script>
