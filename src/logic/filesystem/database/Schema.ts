import schema_v3 from "raw-loader!@/db/schemas/schema_v3.sql";

export default class Schema {
    public static LATEST_VERSION: number = 3;
    public static LATEST_SCHEMA: string = schema_v3;
}

// Type definitions for all the different rows in the database schema.
export type AssayTableRow = {
    id: string,
    name: string,
    study_id: string,
    configuration_id: number,
    endpoint: string
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
    endpoint: string,
    fingerprint: string,
    data_hash: string,
    analysis_date: string
};

export type DatabaseMetadataTableRow = {
    application_version: string
}

