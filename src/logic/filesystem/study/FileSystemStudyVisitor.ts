import StudyVisitor from "unipept-web-components/src/business/entities/study/StudyVisitor";
import { Database } from "better-sqlite3";

/**
 * A type of StudyVisitor that is built for interaction with the local filesystem. This Visitor needs to know the
 * path of the file associated with a study.
 */
export default abstract class FileSystemStudyVisitor extends StudyVisitor {
    /**
     * @param studyPath Points to the root of the study directory.
     * @param db Active database in which all metadata for the current project is stored.
     */
    constructor(
        protected readonly studyPath: string,
        protected readonly db: Database
    ) {
        super();
        if (!studyPath.endsWith("/")) {
            this.studyPath += "/";
        }
    }
}
