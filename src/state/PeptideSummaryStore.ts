import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { DataOptions } from "vuetify";
import { ItemType } from "./PeptideSummaryTable.worker";
import { Ontology } from "unipept-web-components/src/business/ontology/Ontology";
import NcbiTaxon from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import Worker from "worker-loader?inline=fallback!./PeptideSummaryTable.worker"

export interface SummaryData {
    assay: ProteomicsAssay,
    progress: number
}

export interface PeptideSummaryState {
    summaryData: SummaryData[]
}

let inProgress: Promise<any>;
let summaryWorker: any;

const summaryState: PeptideSummaryState = {
    summaryData: []
}

const summaryGetters: GetterTree<PeptideSummaryState, any> = {
    getSummaryItems(state: PeptideSummaryState): (assay: ProteomicsAssay, options: DataOptions) => Promise<ItemType[]> {
        return async(assay: ProteomicsAssay, options: DataOptions) =>  {
            while (inProgress) {
                await inProgress;
            }

            inProgress = new Promise<ItemType[]>(async(resolve, reject) => {
                const eventListener = (message: MessageEvent) => {
                    summaryWorker.removeEventListener("message", eventListener);
                    resolve(message.data.result);
                }

                summaryWorker.addEventListener("message", eventListener)

                summaryWorker.postMessage(
                    {
                        type: "getItems",
                        args: [assay.getId(), options]
                    }
                );
            });

            const result = await inProgress;
            inProgress = undefined;
            return result;
        }
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

            while (inProgress) {
                await inProgress;
            }

            inProgress = new Promise<void>(async(resolve, reject) => {
                if (!summaryWorker) {
                    summaryWorker = new Worker();
                }

                const assayData = store.rootGetters["assayData"](assay);

                if (!assayData) {
                    // The assay no longer exists...
                    resolve();
                    return;
                }

                const communicationSource = assayData.communicationSource;
                const countTable: CountTable<Peptide> = assayData.peptideCountTable;
                const pept2DataCommunicator = communicationSource.getPept2DataCommunicator();
                const responseMap = pept2DataCommunicator.getPeptideResponseMap(assay.getSearchConfiguration());
                const [indexBuffer, dataBuffer] = responseMap.getBuffers();

                await new Promise<void>((resolve) => {
                    const eventListener = (message: MessageEvent) => {
                        summaryWorker.removeEventListener("message", eventListener);
                        resolve();
                    }

                    summaryWorker.addEventListener("message", eventListener)

                    summaryWorker.postMessage(
                        {
                            type: "computeItems",
                            args: [assay.getId(), indexBuffer, dataBuffer, countTable.toMap(), ontology]
                        }
                    );
                });

                store.commit("SET_PROGRESS", [assay, 1]);

                resolve();
            });

            await inProgress;
            inProgress = undefined;
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


