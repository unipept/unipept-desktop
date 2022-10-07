DROP TABLE analysis_source;
CREATE TABLE analysis_source (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK( type in ('online', 'custom_db') ) NOT NULL,
    /**
    * If the type of the AnalysisSource is online, this field indicates which API endpoint was used for the analysis.
    */
    endpoint TEXT,
    /* UniProt version that was used to process the underlying data (e.g. 2022.02). */
    uniprot_version TEXT NOT NULL,
    /**
    * Comma-delimited list of NCBI taxon ID's that are used for filtering in this database. This field will only be
    * used if the type of this analysis source is "custom_db".
    */
    selected_taxa TEXT,
    /**
    * Comma-delimited list of databases (or database sources) that are used to construct this database. This list
    * could include things like swissprot, trembl or reference proteome identifiers.
    */
    sources TEXT
);
