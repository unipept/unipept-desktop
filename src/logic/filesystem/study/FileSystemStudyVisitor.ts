import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";

/**
 * A type of StudyVisitor that is built for interaction with the local filesystem. This Visitor needs to know the
 * path of the file associated with a study.
 */
export default abstract class FileSystemStudyVisitor extends StudyVisitor {
    protected projectPath: string;

    /**
     * @param projectPath Points to the root of the project directory.
     */
    constructor(projectPath: string) {
        super();
        this.projectPath = projectPath;
    }
}
