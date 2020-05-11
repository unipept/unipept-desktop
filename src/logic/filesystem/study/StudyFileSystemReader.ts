import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";
import Study from "unipept-web-components/src/business/entities/study/Study";
import Assay from "unipept-web-components/src/business/entities/assay/Assay";
import ProteomicsAssay from "unipept-web-components/src/business/entities/assay/ProteomicsAssay";
import AssayVisitor from "unipept-web-components/src/business/entities/assay/AssayVisitor";
import IOException from "unipept-web-components/src/business/exceptions/IOException";
import SearchConfiguration from "unipept-web-components/src/business/configuration/SearchConfiguration";
import AssayFileSystemMetaDataReader from "@/logic/filesystem/assay/AssayFileSystemMetaDataReader";


/**
 * Class that's able to fully deserialize a study that's stored in the local filesystem of a user.
 */
export default class StudyFileSystemReader extends FileSystemStudyVisitor {
    /**
     * Read the study from the local filesystem.
     *
     * @param study The study object that should be filled with all properties stored on disk.
     * @throws {IOException} Whenever something goes wrong while loading the given file.
     */
    public async visitStudy(study: Study): Promise<void> {
        try {
            study.setName(path.basename(this.studyPath));

            // Try to read all assays and replace current assays where necessary.
            const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true })
                .filter(entry => !entry.name.startsWith("."))
                .map(entry => entry.name);

            for (const file of files.filter(name => name.endsWith(".pep"))) {
                const assayName: string = path.basename(file).replace(".pep", "");

                let assay: Assay;

                const row = this.project.db.prepare("SELECT * FROM assays WHERE `name`=? and `study_id`=?")
                    .get(assayName, study.getId());

                if (row) {
                    // Assay exists. Get it's ID and create a new object.
                    // TODO read in date.
                    assay = new ProteomicsAssay(
                        [new FileSystemAssayChangeListener(this.project, study)],
                        row.id,
                        new SearchConfiguration(),
                        undefined,
                        assayName,
                        new Date()
                    );

                    const assayVisitor = new AssayFileSystemMetaDataReader(this.studyPath, this.project.db);
                    await assay.accept(assayVisitor);
                } else {
                    // If assay not present in metadata, create a new UUID and write it to metadata.
                    assay = new ProteomicsAssay(
                        [new FileSystemAssayChangeListener(this.project, study)],
                        uuidv4(),
                        new SearchConfiguration(),
                        undefined,
                        assayName,
                        new Date()
                    );

                    const assayVisitor: AssayVisitor = new AssayFileSystemMetaDataWriter(
                        this.studyPath,
                        this.project.db,
                        study
                    );
                    await assay.accept(assayVisitor);
                }

                // Also read in any data related to this assay.
                const dataReader: AssayVisitor = new AssayFileSystemDataReader(this.studyPath, this.project.db, false);
                await assay.accept(dataReader);

                study.addAssay(assay);
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
