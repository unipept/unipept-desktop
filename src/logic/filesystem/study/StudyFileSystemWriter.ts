import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import fs from "fs";
import mkdirp from "mkdirp";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";


/**
 * Class that's able to fully serialize a Study-object to the local filesystem.
 */
export default class StudyFileSystemWriter extends FileSystemStudyVisitor {
    public async visitStudy(study: Study): Promise<void> {
        try {
            // Make study directory if it does not exist yet...
            await mkdirp(`${this.studyPath}`);

            if (this.project.db.prepare("SELECT * FROM studies WHERE `id`=?").get(study.getId())) {
                this.project.db.prepare("UPDATE studies SET `name`=? WHERE `id`=?").run(study.getName(), study.getId());
            } else {
                this.project.db.prepare(
                    "INSERT INTO studies (id, name) VALUES (?, ?)"
                ).run(study.getId(), study.getName());
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
