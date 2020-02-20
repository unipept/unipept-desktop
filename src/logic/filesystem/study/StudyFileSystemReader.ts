import FileSystemStudyVisitor from "./FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import fs from "fs";
import path from "path";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";
import { FileSystemStudyConsts } from "@/logic/filesystem/study/FileSystemStudyConsts";
import FileEvent from "@/logic/filesystem/project/FileEvent";

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
            const serializedObject: string = fs.readFileSync(
                `${this.studyPath}${FileSystemStudyConsts.STUDY_METADATA_FILE}`,
                {
                    encoding: "utf-8"
                }
            );
            const deserializedObject = JSON.parse(serializedObject);
            study.setName(path.basename(this.studyPath));
            study.setId(deserializedObject.id);
        } catch (err) {
            throw new IOException(err);
        }
    }

    public async getExpectedFileEvents(study: Study): Promise<FileEvent[]> {
        return [];
    }

}
