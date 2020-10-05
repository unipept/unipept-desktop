import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import mkdirp from "mkdirp";
import { Study, IOException } from "unipept-web-components";
import { Database } from "better-sqlite3";


/**
 * Class that's able to fully serialize a Study-object to the local filesystem.
 */
export default class StudyFileSystemMetaDataWriter extends FileSystemStudyVisitor {
    public async visitStudy(study: Study): Promise<void> {
        try {
            // Make study directory if it does not exist yet...
            await mkdirp(`${this.studyPath}`);

            await this.dbManager.performQuery<void>((db: Database) => {
                db.prepare("REPLACE INTO studies (id, name) VALUES (?, ?)").run(study.getId(), study.getName())
            });
        } catch (err) {
            throw new IOException(err);
        }
    }
}
