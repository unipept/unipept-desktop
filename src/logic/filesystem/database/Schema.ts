import schema_v5 from "raw-loader!@/db/schemas/schema_v5.sql";

export default class Schema {
    public static LATEST_VERSION: number = 5;
    public static LATEST_SCHEMA: string = schema_v5;
}

// Type definitions for all the different rows in the database schema.
export type AssayTableRow = {
    id: string,
    name: string,
    study_id: string,
    configuration_id: number,
    datasource_id: number
};

export type StudyTableRow = {
    id: string,
    name: string
};

export type SearchConfigurationTableRow = {
    id: number,
    // boolean coded as an integer. 1 = true, 0 = false
    equate_il: number,
    filter_duplicates: number,
    missing_cleavage_handling: number
};

export type PeptideTrustTableRow = {
    assay_id: string,
    missed_peptides: string,
    matched_peptides: number,
    searched_peptides: number
};

export type StorageMetadataTableRow = {
    assay_id: string,
    configuration_id: number,
    data_hash: string,
    analysis_date: string,
    datasource_id: number
};

export type AnalysisSourceTableRow = {
    id: number,
    type: "online" | "custom_db",
    uniprot_version: string,
    selected_taxa: string,
    swissprot_selected: boolean,
    trembl_selected: boolean
}

export type DatabaseMetadataTableRow = {
    application_version: string
};
