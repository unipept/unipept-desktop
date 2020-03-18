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
    id INT PRIMARY KEY,
    equate_il INT NOT NULL,
    filter_duplicates INT NOT NULL,
    missing_cleave_handling INT NOT NULL
);


