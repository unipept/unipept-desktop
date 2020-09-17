import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import mkdirp from "mkdirp";
import { Study, IOException } from "unipept-web-components";


/**
 * Class that's able to fully serialize a Study-object to the local filesystem.
 */
export default class StudyFileSystemMetaDataWriter extends FileSystemStudyVisitor {
    public async visitStudy(study: Study): Promise<void> {
        try {
            // Make study directory if it does not exist yet...
            await mkdirp(`${this.studyPath}`);

            if (this.db.prepare("SELECT * FROM studies WHERE `id`=?").get(study.getId())) {
                this.db.prepare("UPDATE studies SET `name`=? WHERE `id`=?").run(study.getName(), study.getId());
            } else {
                this.db.prepare(
                    "INSERT INTO studies (id, name) VALUES (?, ?)"
                ).run(
                    study.getId(),
                    study.getName()
                );
            }
        } catch (err) {
            throw new IOException(err);
        }
    }
}
