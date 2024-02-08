import RecentProject from "@common/project/RecentProject";

export default interface RecentProjectManager {
    /**
     * @return A list of all projects that were recently opened by the user, sorted descending by date. An empty list
     * is returned if the recent projects file does not exist.
     */
    getRecentProjects(): Promise<RecentProject[]>;

    addRecentProject(projectPath: string): Promise<void>;
}
