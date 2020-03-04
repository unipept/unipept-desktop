import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import * as fs from "fs";
import path from "path";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import { v4 as uuidv4 } from "uuid";
import Assay from "unipept-web-components/src/logic/data-management/assay/Assay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import AssayVisitor from "unipept-web-components/src/logic/data-management/assay/AssayVisitor";
import { AssayFileSystemMetaDataWriter } from "@/logic/filesystem/assay/AssayFileSystemMetaDataWriter";
import AssayFileSystemDataReader from "@/logic/filesystem/assay/AssayFileSystemDataReader";
import FileSystemAssayChangeListener from "@/logic/filesystem/assay/FileSystemAssayChangeListener";


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
                    assay = new MetaProteomicsAssay(
                        [new FileSystemAssayChangeListener(this.project, study)],
                        row.id,
                        undefined,
                        assayName,
                        new Date()
                    );
                } else {
                    // If assay not present in metadata, create a new UUID and write it to metadata.
                    assay = new MetaProteomicsAssay(
                        [new FileSystemAssayChangeListener(this.project, study)],
                        uuidv4(),
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
                const dataReader: AssayVisitor = new AssayFileSystemDataReader(this.studyPath, this.project.db);
                await assay.accept(dataReader);

                study.addAssay(assay);
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
