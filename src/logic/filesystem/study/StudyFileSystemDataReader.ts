import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import * as fs from "fs";
import path from "path";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import { Study, Assay, ProteomicsAssay, AssayVisitor, IOException } from "unipept-web-components";
import { Database } from "better-sqlite3";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import AssayFileSystemDataWriter from "@/logic/filesystem/assay/AssayFileSystemDataWriter";


/**
 * This visitor deserializes a study's data which generally consists of the assay's of which this study is composed.
 * Each of these assays is read from disk with the corresponding assay visitors and are only added if they are not yet
 * present in the given study.
 *
 * @author Pieter Verschaffelt
 */
export default class StudyFileSystemDataReader extends FileSystemStudyVisitor {
    constructor(
        studyPath: string,
        dbManager: DatabaseManager,
        private readonly projectLocation: string
    ) {
        super(studyPath, dbManager);
    }

    public async visitStudy(study: Study): Promise<void> {
        try {
            // Try to read all assays and replace current assays where necessary.
            const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true })
                .filter(entry => !entry.name.startsWith("."))
                .map(entry => entry.name);

            for (const file of files.filter(name => name.endsWith(".pep"))) {
                const assayName: string = path.basename(file).replace(".pep", "");

                let assay: Assay;

                const row = await this.dbManager.performQuery<any>((db: Database) => {
                    return db.prepare(
                        "SELECT * FROM assays WHERE `name` = ? and `study_id` = ?"
                    ).get(assayName, study.getId());
                });

                if (row) {
                    // Assay exists. Get it's ID and create a new object.
                    assay = new ProteomicsAssay(row.id);
                    assay.setName(assayName);

                    const assayVisitor = new AssayFileSystemDataReader(this.studyPath, this.dbManager, this.projectLocation);
                    await assay.accept(assayVisitor);
                } else {
                    // If assay not present in metadata, create a new UUID and write it to metadata.
                    assay = new ProteomicsAssay();
                    assay.setName(assayName);

                    const assayVisitor: AssayVisitor = new AssayFileSystemDataWriter(
                        this.studyPath,
                        this.dbManager,
                        study
                    );
                    await assay.accept(assayVisitor);
                }

                study.addAssay(assay);
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
