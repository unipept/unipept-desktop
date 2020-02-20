import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import fs from "fs";
import mkdirp from "mkdirp";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import {FileSystemStudyConsts} from "@/logic/filesystem/study/FileSystemStudyConsts";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import {FileEventType} from "@/logic/filesystem/project/FileEventType";


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
            await mkdirp(`${this.studyPath}`);

            fs.writeFileSync(
                `${this.studyPath}${FileSystemStudyConsts.STUDY_METADATA_FILE}`,
                JSON.stringify(toWrite),
                {
                    encoding: "utf-8"
                }
            );
        } catch (err) {
            throw new IOException(err);
        }
    }

    async getExpectedFileEvents(study: Study): Promise<FileEvent[]> {
        return [
            new FileEvent(FileEventType.AddFile, `${this.studyPath}${FileSystemStudyConsts.STUDY_METADATA_FILE}`)
        ]
    }
}
