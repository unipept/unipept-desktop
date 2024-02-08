import Project from "@common/project/Project";

export default interface ProjectManager {
    /**
     * Load an existing project. If the project files do not exist, this function will throw an error.
     *
     * @param projectLocation The main directory of the project on disk.
     * @param addToRecents Should this project be added to the list of recent projects? Set to false for no.
     */
    loadProject(
        projectLocation: string,
        addToRecents: boolean
    ): Promise<Project>;

    /**
     * Create a new project and correctly initialize all project files in the provided directory.
     *
     * @param projectLocation The main directory of the project on disk.
     * @param addToRecents Should this project be added to the list of recent projects? Set to false for no.
     */
    createProject(
        projectLocation: string,
        addToRecents: boolean
    ): Promise<Project>;
}
