import RecentProject from "@common/project/RecentProject";
import RecentProjectManager from "@common/project/RecentProjectManager";

export default class RemoteRecentProjectManager implements RecentProjectManager {
    constructor() {}

    getRecentProjects(): Promise<RecentProject[]> {
        return window.api.project.recentProjects.getRecentProjects();
    }
    addRecentProject(projectPath: string): Promise<void> {
        return window.api.project.recentProjects.addRecentProject(projectPath);
    }
}
