DROP TABLE assays;
DROP TABLE storage_metadata;

CREATE TABLE assays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    /*
      AnalysisSource that was last selected for this assay. This endpoint does not necessarily need to be the same as the one
      selected for the storage_metadata table. This endpoint is only used to detect whether the assay needs to be
      recomputed or not.
     */
    analysis_source_id INTEGER,
    FOREIGN KEY(study_id) REFERENCES studies(id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id),
    FOREIGN KEY(analysis_source_id) REFERENCES analysis_source(id)
);

CREATE TABLE storage_metadata (
    assay_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    /*
       Hash of the files that are stored on the local filesystem. This hash can be used to verify the integrity of the
       files containing the offline result data on the filesystem. Value for this column is the concatenation of
       the hash for both the data buffer and index buffer files.
    */
    data_hash TEXT,
    analysis_date TEXT,
    analysis_source_id INTEGER,
    PRIMARY KEY(assay_id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id),
    FOREIGN KEY(analysis_source_id) REFERENCES analysis_source(id)
);
