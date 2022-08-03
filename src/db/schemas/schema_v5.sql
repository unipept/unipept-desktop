CREATE TABLE studies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE assays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    /*
      Endpoint that was last selected for this assay. This endpoint does not necessarily need to be the same as the one
      selected for the storage_metadata table. This endpoint is only used to detect whether the assay needs to be
      recomputed or not.
     */
    endpoint TEXT,
    FOREIGN KEY(study_id) REFERENCES studies(id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id)
);

CREATE TABLE search_configuration (
    id INTEGER PRIMARY KEY,
    equate_il INT NOT NULL,
    filter_duplicates INT NOT NULL,
    missing_cleavage_handling INT NOT NULL
);

CREATE TABLE peptide_trust (
    assay_id TEXT NOT NULL,
    missed_peptides TEXT NOT NULL,
    matched_peptides INT NOT NULL,
    searched_peptides INT NOT NULL,
    PRIMARY KEY(assay_id)
);

CREATE TABLE storage_metadata (
    assay_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    endpoint TEXT,
    /*
       Unique fingerprint hash for the data that has been stored on the hard drive for this specific combination of
       assay configuration properties.
    */
    fingerprint TEXT,
    /*
       Hash of the files that are stored on the local filesystem. This hash can be used to verify the integrity of the
       files containing the offline result data on the filesystem. Value for this column is the concatenation of
       the hash for both the data buffer and index buffer files.
    */
    data_hash TEXT,
    analysis_date TEXT,
    PRIMARY KEY(assay_id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id)
);

CREATE TABLE datasource (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK( type in ('online', 'custom_db') ) NOT NULL,
    /* UniProt version that was used to process the underlying data (e.g. 2022.02). */
    uniprot_version TEXT NOT NULL,
    /* Comma-delimited list of NCBI taxon ID's that are used for filtering in this database. */
    selected_taxa TEXT,
    /* Is SwissProt included in this datasource? */
    swissprot_selected INTEGER,
    /* Is TrEMBL included in this datasource? */
    trembl_selected INTEGER
);

CREATE TABLE database_metadata (
    application_version TEXT NOT NULL
);
