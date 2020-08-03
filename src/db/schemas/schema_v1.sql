CREATE TABLE studies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE assays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    FOREIGN KEY(study_id) REFERENCES studies(id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id)
);

CREATE TABLE search_configuration (
    id INTEGER PRIMARY KEY,
    equate_il INT NOT NULL,
    filter_duplicates INT NOT NULL,
    missing_cleavage_handling INT NOT NULL
);

CREATE TABLE pept2data (
    assay_id TEXT NOT NULL,
    index_buffer BLOB NOT NULL,
    data_buffer BLOB NOT NULL,
    PRIMARY KEY(assay_id)
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
    db_version TEXT,
    PRIMARY KEY(assay_id)
);
