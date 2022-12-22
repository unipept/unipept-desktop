import {
    CountTable,
    EcCode, EcDefinition,
    GoCode,
    GoDefinition, GoNamespace, InterproCode, InterproDefinition,
    NcbiId, NcbiTaxon,
    Ontology,
    Peptide,
    PeptideData, StringUtils
} from "unipept-web-components";
import { ShareableMap } from "shared-memory-datastructures";
import { NcbiRank } from "unipept-web-components/src/business/ontology/taxonomic/ncbi/NcbiRank";

export default class PeptideExport {
    /**
     * Produces a CSV that contains one row per peptide (these rows are duplicated for peptides that occur multiple
     * times). Every row contains the LCA for a peptide, as well as it's associated lineage, and the top 3 most
     * occurring annotations for the EC-numbers, the three different GO-domains and InterPro-annotations.
     *
     * @param peptideCountTable Count table that contains all peptides and their associated counts that should be
     * present in the generated export.
     * @param pept2data Mapping between peptide and all of its associated functional annotations (as well as the
     * taxonomic information).
     * @param goOntology
     * @param ecOntology
     * @param iprOntology
     * @param ncbiOntology
     * @param separator The delimiter used to separate columns in the CSV. Use comma for international format, and semi-
     * colon for the European version.
     * @param secondarySeparator The delimiter used to separate multiple functional annotations from each other. Some
     * columns (like the EC-number list) contain multiple items, which need to be separated from each other using a
     * character different from the default separator.
     * @param lineEnding The line terminator that should be used.
     */
    public static async exportSummaryAsCsv(
        peptideCountTable: CountTable<Peptide>,
        pept2data: ShareableMap<Peptide, PeptideData>,
        goOntology: Ontology<GoCode, GoDefinition>,
        ecOntology: Ontology<EcCode, EcDefinition>,
        iprOntology: Ontology<InterproCode, InterproDefinition>,
        ncbiOntology: Ontology<NcbiId, NcbiTaxon>,
        separator = ",",
        secondarySeparator = ";",
        lineEnding = "\n"
    ): Promise<string> {
        const rows: string[] = [];
        rows.push(PeptideExport.getHeader().join(separator));

        const headerLength = PeptideExport.getHeader().length;

        for (const peptide of peptideCountTable.getOntologyIds()) {
            const row = [];

            row.push(peptide);

            const pept2DataResponse = pept2data.get(peptide);

            const sanitizeRegex = new RegExp(`${secondarySeparator}|${separator}`, "g");

            if (!pept2DataResponse) {
                for (let i = 0; i < headerLength - 1; i++) {
                    row.push("");
                }
            } else {
                // First construct the taxonomical part of each output row.
                const lcaDefinition = ncbiOntology.getDefinition(pept2DataResponse.lca);
                row.push(lcaDefinition ? lcaDefinition.name : "");

                const processedLineage = pept2DataResponse.lineage.map(l => l ? ncbiOntology.getDefinition(l) : null);
                row.push(...processedLineage.map(l => l ? l.name.replace(sanitizeRegex, "") : ""));

                // Now add information about the EC-numbers.
                // This list contains the (EC-code, protein count)-mapping, sorted descending on counts.
                const ecNumbers = PeptideExport.sortAnnotations(pept2DataResponse.ec);
                row.push(
                    ecNumbers
                        .map(a => `${a[0].substr(3)} (${StringUtils.numberToPercent(a[1] / pept2DataResponse.faCounts.ec)})`)
                        .join(secondarySeparator)
                );

                const ecDefinitions: [EcDefinition, number][] = ecNumbers.map(c => [ecOntology.getDefinition(c[0]), c[1]]);
                row.push(
                    ecDefinitions.map(
                        c => `${c[0] ? c[0].name : ""} (${StringUtils.numberToPercent(c[1] / pept2DataResponse.faCounts.ec)})`.replace(sanitizeRegex, "")
                    ).join(secondarySeparator)
                );

                // Now process the GO-terms
                const goCodes = [];
                const goNames = [];

                for (const ns of Object.values(GoNamespace)) {
                    const gos = pept2DataResponse.go;
                    const goAnnotations = Object.keys(gos).filter(
                        x => goOntology.getDefinition(x) && goOntology.getDefinition(x).namespace === ns
                    );

                    const goTerms = {};

                    for (const annotation of goAnnotations) {
                        goTerms[annotation] = gos[annotation];
                    }

                    const sortedTerms = PeptideExport.sortAnnotations(goTerms);

                    goCodes.push(
                        sortedTerms
                            .map(a => `${a[0]} (${StringUtils.numberToPercent(a[1] / pept2DataResponse.faCounts.go)})`)
                            .join(secondarySeparator)
                    );

                    const goDefinitions: [GoDefinition, number][] = sortedTerms.map(c => [goOntology.getDefinition(c[0]), c[1]]);
                    goNames.push(
                        goDefinitions.map(
                            c => `${c ? c[0].name : ""} (${StringUtils.numberToPercent(c[1] / pept2DataResponse.faCounts.go)})`.replace(sanitizeRegex, "")
                        ).join(secondarySeparator)
                    );
                }

                row.push(...goCodes);
                row.push(...goNames);

                // Now process the InterPro-terms
                const interproNumbers = PeptideExport.sortAnnotations(pept2DataResponse.ipr);
                row.push(
                    interproNumbers
                        .map(a => `${a[0].substr(4)} (${StringUtils.numberToPercent(a[1] / pept2DataResponse.faCounts.ipr)})`.replace(sanitizeRegex, ""))
                        .join(secondarySeparator)
                );

                const interproDefinitions: [InterproDefinition, number][] = interproNumbers.map(i => [iprOntology.getDefinition(i[0]), i[1]]);
                row.push(interproDefinitions.map(
                    i => `${i && i[0] ? i[0].name : ""} (${StringUtils.numberToPercent(i[1] / pept2DataResponse.faCounts.ipr)})`.replace(sanitizeRegex, "")
                ).join(secondarySeparator));
            }

            const rowString = row.join(separator);
            // Duplicate row in case that the peptide is present more than once.
            for (let i = 0; i < peptideCountTable.getCounts(peptide); i++) {
                rows.push(rowString);
            }
        }

        return rows.join(lineEnding);
    }

    private static sortAnnotations(
        annotations: any
    ): [string, number][] {
        return (Object.entries(annotations) as [string, any][] as [string, number][])
            .sort((a, b) => {
                if (b[1] === a[1]) {
                    return a[0] < b[0] ? -1 : 1;
                }
                return b[1] - a[1]
            })
            .slice(0, 3);
    }

    /**
     * @return The default set of columns that's part of the generated export.
     */
    private static getHeader(): string[] {
        const headers: string[] = [];
        headers.push("peptide");
        headers.push("lca");
        headers.push(...Object.values(NcbiRank));
        headers.push("EC");
        headers.push("EC - names")
        headers.push(...Object.values(GoNamespace).map(ns => `GO (${ns})`));
        headers.push(...Object.values(GoNamespace).map(ns => `GO (${ns}) - names`));
        headers.push("InterPro");
        headers.push("InterPro - names");
        return headers;
    }
}
