DROP TABLE storage_metadata;

/* Create the same table again, but this time without a db_version column and with a fingerprint column */
CREATE TABLE storage_metadata (
      assay_id TEXT NOT NULL,
      configuration_id INT NOT NULL,
      endpoint TEXT,
      fingerprint TEXT,
      data_hash TEXT,
      analysis_date TEXT,
      PRIMARY KEY(assay_id),
      FOREIGN KEY(configuration_id) REFERENCES search_configuration(id)
);

DROP TABLE assays;

CREATE TABLE assays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    configuration_id INT NOT NULL,
    FOREIGN KEY(study_id) REFERENCES studies(id),
    FOREIGN KEY(configuration_id) REFERENCES search_configuration(id)
);
