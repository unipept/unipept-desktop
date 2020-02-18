import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import fs from "fs";
import mkdirp from "mkdirp";
import path from "path";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import { FileSystemStudyConsts } from "@/logic/filesystem/study/FileSystemStudyConsts";


/**
 * Class that's able to fully serialize a Study-object to the local filesystem.
 */
export default class StudyFileSystemWriter extends FileSystemStudyVisitor {
    public async visitStudy(study: Study): Promise<void> {
        const toWrite = {
            "id": study.getId()
        };

        try {
            // Make parent directory if it does not exist yet...
            await mkdirp(
                path.dirname(`${this.projectPath}${study.getName()}/${FileSystemStudyConsts.STUDY_METADATA_FILE}`)
            );

            fs.writeFileSync(
                this.projectPath,
                JSON.stringify(toWrite),
                {
                    encoding: "utf-8"
                }
            );
        } catch (err) {
            throw new IOException(err);
        }
    }
}
