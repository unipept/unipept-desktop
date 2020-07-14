import { spawn, Worker } from "threads/dist";
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { DataOptions } from "vuetify";
import { ItemType } from "./PeptideSummaryTable.worker";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";

export interface SummaryData {
    assay: ProteomicsAssay,
    progress: number
}

export interface PeptideSummaryState {
    summaryData: SummaryData[]
}

let summaryWorker;

const summaryState: PeptideSummaryState = {
    summaryData: []
}

const summaryGetters: GetterTree<PeptideSummaryState, any> = {
    getSummaryItems(state: PeptideSummaryState): (assay: ProteomicsAssay, options: DataOptions) => Promise<ItemType[]> {
        return async(assay: ProteomicsAssay, options: DataOptions) =>  summaryWorker.getItems(assay.getId(), options);
    },

    getProgress(state: PeptideSummaryState): (assay: ProteomicsAssay) => number {
        return (assay: ProteomicsAssay) => summaryState.summaryData.find(d => d.assay.id === assay.id)?.progress || 0.0;
    }
}

const summaryMutations: MutationTree<PeptideSummaryState> = {
    INIT_ASSAY_DATA(state: PeptideSummaryState, assay: ProteomicsAssay) {
        let data = summaryState.summaryData.find(d => d.assay.id === assay.id);
        if (!data) {
            data = {
                assay: assay,
                progress: 0
            }
            summaryState.summaryData.push(data);
        } else {
            data.progress = 0;
        }
    },

    SET_PROGRESS(state: PeptideSummaryState, [assay, progress]: [ProteomicsAssay, number]) {
        summaryState.summaryData.find(d => d.assay.id === assay.id).progress = progress;
    }
}

const summaryActions: ActionTree<PeptideSummaryState, any> = {
    lcaOntologyProcessed: {
        root: true,
        async handler(
            store: ActionContext<PeptideSummaryState, any>,
            [
                assay,
                ontology
            ]: [
                ProteomicsAssay,
                Ontology<NcbiId, NcbiTaxon>
            ]
        ) {
            store.commit("INIT_ASSAY_DATA", assay);

            if (!summaryWorker) {
                summaryWorker = await spawn(new Worker("./PeptideSummaryTable.worker.ts"));
            }

            const assayData = store.rootGetters["assayData"](assay);
            const communicationSource = assayData.communicationSource;
            const countTable: CountTable<Peptide> = assayData.peptideCountTable;
            const pept2DataCommunicator = communicationSource.getPept2DataCommunicator();
            const responseMap = pept2DataCommunicator.getPeptideResponseMap(assay.getSearchConfiguration());
            const [indexBuffer, dataBuffer] = responseMap.getBuffers();

            const obs = summaryWorker.computeItems(assay.getId(), indexBuffer, dataBuffer, countTable.toMap(), ontology);
            await new Promise((resolve, reject) => {
                obs.subscribe(
                    (val) => store.commit("SET_PROGRESS", [assay, val]),
                    (err) => reject(err),
                    () => resolve(),
                );
            });
        }
    }
}

export const summaryStore = {
    namespaced: true,
    state: summaryState,
    getters: summaryGetters,
    mutations: summaryMutations,
    actions: summaryActions
}


