import MetaGenomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaGenomicsAssay";
import MetaProteomicsAssay from "unipept-web-components/src/logic/data-management/assay/MetaProteomicsAssay";
import FileSystemAssayVisitor from "@/logic/filesystem/assay/FileSystemAssayVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import { Database } from "better-sqlite3";

export class AssayFileSystemMetaDataWriter extends FileSystemAssayVisitor {
    protected readonly study: Study;

    public constructor(directoryPath: string, db: Database, study: Study) {
        super(directoryPath, db);
        this.study = study
    }

    public async visitMetaGenomicsAssay(mgAssay: MetaGenomicsAssay): Promise<void> {
        throw new Error("Not implemented");
    }

    public async visitMetaProteomicsAssay(mpAssay: MetaProteomicsAssay): Promise<void> {
        // Check if this study was saved before.
        if (this.db.prepare("SELECT * FROM assays WHERE `id`=?").get(mpAssay.getId())) {
            this.db.prepare("UPDATE assays SET `name`=?, `study_id`=? WHERE `id`=?")
                .run(mpAssay.getName(), mpAssay.getId(), this.study.getId());
        } else {
            console.debug();
            this.db.prepare("INSERT INTO assays (id, name, study_id) VALUES (?, ?, ?)")
                .run(mpAssay.getId(), mpAssay.getName(), this.study.getId());
        }
    }
}
