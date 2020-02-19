import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";

/**
 * A type of StudyVisitor that is built for interaction with the local filesystem. This Visitor needs to know the
 * path of the file associated with a study.
 */
export default abstract class FileSystemStudyVisitor extends StudyVisitor {
    protected studyPath: string;

    /**
     * @param studyPath Points to the root of the study directory.
     */
    constructor(studyPath: string) {
        super();
        if (!studyPath.endsWith("/")) {
            studyPath += "/";
        }
        this.studyPath = studyPath;
    }
}
