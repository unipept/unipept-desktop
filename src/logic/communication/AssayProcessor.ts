import ProgressListener from "unipept-web-components/src/business/progress/ProgressListener";
import CommunicationSource from "unipept-web-components/src/business/communication/source/CommunicationSource";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";
import { CountTable } from "unipept-web-components/src/business/counts/CountTable";
import PeptideCountTableProcessor from "unipept-web-components/src/business/processors/raw/PeptideCountTableProcessor";
import Pept2DataCommunicator from "unipept-web-components/src/business/communication/peptides/Pept2DataCommunicator";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import EcResponseCommunicator from "unipept-web-components/src/business/communication/functional/ec/EcResponseCommunicator";
import InterproResponseCommunicator from "unipept-web-components/src/business/communication/functional/interpro/InterproResponseCommunicator";
import NcbiResponseCommunicator from "unipept-web-components/src/business/communication/taxonomic/ncbi/NcbiResponseCommunicator";
import CachedCommunicationSource from "@/logic/communication/source/CachedCommunicationSource";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import { NcbiId } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiTaxon";

export default class AssayProcessor {
    public async processAssay(
        assay: ProteomicsAssay,
        progressListener: ProgressListener
    ): Promise<[CountTable<Peptide>, CommunicationSource]> {
        const peptideCountTableProcessor = new PeptideCountTableProcessor();
        const peptideCountTable = await peptideCountTableProcessor.getPeptideCountTable(
            assay.getPeptides(),
            assay.getSearchConfiguration()
        );

        const pept2DataProgressNotifier: ProgressListener = {
            // We consider the Pept2Data-communication part as 60% of the total progress.
            onProgressUpdate: (progress: number) => this.setProgress(0.6 * progress, progressListener)
        }

        const pept2DataCommunicator = new Pept2DataCommunicator();
        await pept2DataCommunicator.process(
            peptideCountTable,
            assay.getSearchConfiguration(),
            pept2DataProgressNotifier
        );

        // Now we have to extract all functional annotations and NCBI-taxons from the received responses and preload
        // these as well...
        const gos = new Set<GoCode>();
        const ecs = new Set<EcCode>();
        const iprs = new Set<InterproCode>();
        const ncbis = new Set<NcbiId>();

        for (const peptide of peptideCountTable.getOntologyIds()) {
            const response = pept2DataCommunicator.getPeptideResponse(peptide, assay.getSearchConfiguration());
            if (response) {
                Object.keys(response.fa.data).filter(x => x.startsWith("GO:")).map(x => gos.add(x));
                Object.keys(response.fa.data).filter(x => x.startsWith("EC:")).map(x => ecs.add(x));
                Object.keys(response.fa.data).filter(x => x.startsWith("IPR:")).map(x => iprs.add(x));
                ncbis.add(response.lca);
                response.lineage.filter(l => l).map(x => ncbis.add(x));
            }
        }

        // Now preload all the extracted annotations using the respective communicators
        const goCommunicator = new GoResponseCommunicator();
        const ecCommunicator = new EcResponseCommunicator();
        const iprCommunicator = new InterproResponseCommunicator();
        const ncbiCommunicator = new NcbiResponseCommunicator();

        await goCommunicator.process(Array.from(gos));
        this.setProgress(0.7, progressListener);
        await ecCommunicator.process(Array.from(ecs));
        this.setProgress(0.8, progressListener);
        await iprCommunicator.process(Array.from(iprs));
        this.setProgress(0.9, progressListener);
        await ncbiCommunicator.process(Array.from(ncbis));
        this.setProgress(1, progressListener);

        return [peptideCountTable, new CachedCommunicationSource(
            ecCommunicator.getResponseMap(),
            goCommunicator.getResponseMap(),
            iprCommunicator.getResponseMap(),
            ncbiCommunicator.getResponseMap(),
            pept2DataCommunicator.getPeptideResponseMap(assay.getSearchConfiguration()),
            await pept2DataCommunicator.getPeptideTrust(peptideCountTable, assay.getSearchConfiguration()),
            assay.getSearchConfiguration()
        )];
    }

    private setProgress(value: number, listener?: ProgressListener) {
        if (listener) {
            listener.onProgressUpdate(value);
        }
    }
}
