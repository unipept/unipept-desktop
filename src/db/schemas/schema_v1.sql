CREATE TABLE studies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE assays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    FOREIGN KEY(study_id) REFERENCES studies(id)
);
