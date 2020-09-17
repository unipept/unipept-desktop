import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import { Study, IOException } from "unipept-web-components";

export default class StudyFileSystemMetaDataReader extends FileSystemStudyVisitor {
    public async visitStudy(study: Study): Promise<void> {
        try {
            if (study.getId()) {
                const row = this.db.prepare("SELECT * FROM studies WHERE id = ?").get(study.getId());

                if (row) {
                    study.setName(row.name);
                }
            }
        } catch (err) {
            throw new IOException();
        }
    }
}
