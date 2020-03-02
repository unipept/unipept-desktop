import StudyVisitor from "unipept-web-components/src/logic/data-management/study/StudyVisitor";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import Project from "@/logic/filesystem/project/Project";

/**
 * A type of StudyVisitor that is built for interaction with the local filesystem. This Visitor needs to know the
 * path of the file associated with a study.
 */
export default abstract class FileSystemStudyVisitor extends StudyVisitor {
    protected readonly studyPath: string;
    protected readonly project: Project;

    /**
     * @param studyPath Points to the root of the study directory.
     * @param project Currently active project to which the managed study belongs.
     */
    constructor(studyPath: string, project: Project) {
        super();
        if (!studyPath.endsWith("/")) {
            studyPath += "/";
        }
        this.studyPath = studyPath;
        this.project = project;
    }

    public abstract async getExpectedFileEvents(study: Study): Promise<FileEvent[]>;
}
