import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import { Study, Assay, ProteomicsAssay, AssayVisitor, IOException } from "unipept-web-components";
import AssayFileSystemMetaDataReader from "@/logic/filesystem/assay/AssayFileSystemMetaDataReader";
import { Database } from "better-sqlite3";


/**
 * This visitor deserializes a study's data which generally consists of the assay's of which this study is composed.
 * Each of these assays is read from disk with the corresponding assay visitors and are only added if they are not yet
 * present in the given study.
 *
 * @author Pieter Verschaffelt
 */
export default class StudyFileSystemDataReader extends FileSystemStudyVisitor {
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
                        "SELECT * FROM assays WHERE `name`=? and `study_id`=?"
                    ).get(assayName, study.getId());
                });

                if (row) {
                    // Assay exists. Get it's ID and create a new object.
                    assay = new ProteomicsAssay(row.id);
                    assay.setName(assayName);

                    const assayVisitor = new AssayFileSystemMetaDataReader(this.studyPath, this.dbManager);
                    await assay.accept(assayVisitor);
                } else {
                    // If assay not present in metadata, create a new UUID and write it to metadata.
                    assay = new ProteomicsAssay(uuidv4());
                    assay.setName(assayName);

                    const assayVisitor: AssayVisitor = new AssayFileSystemMetaDataWriter(
                        this.studyPath,
                        this.dbManager,
                        study
                    );
                    await assay.accept(assayVisitor);
                }

                // Also read in any data related to this assay.
                try {
                    const dataReader: AssayVisitor = new AssayFileSystemDataReader(this.studyPath, this.dbManager);
                    await assay.accept(dataReader);

                    study.addAssay(assay);
                } catch (err) {
                    // Do nothing...
                }
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
