import { promises as fs } from "fs";
import path from "path";

import RecentProject from "@common/project/RecentProject";
import RecentProjectManager from "@common/project/RecentProjectManager";
import { app } from "electron";
import FileSystemManager from "@main/file-system/FileSystemManager";

export default class FileSystemRecentProjectManager implements RecentProjectManager {
    public static readonly AMOUNT_OF_RECENT_PROJECTS = 15;
    private static readonly RECENT_PROJECTS_FILE = "unipept_recent_projects.config";

    /**
     * @return A list of all projects that were recently opened by the user, sorted descending by date. An empty list
     * is returned if the recent projects file does not exist.
     * @throws {Error} If the recent projects file was corrupt, not readable or otherwise damaged.
     */
    public async getRecentProjects(): Promise<RecentProject[]> {
        const fsManager = new FileSystemManager();

        try {
            const readProjects = await fsManager.readFile(await this.getRecentProjectsPath());

            if (readProjects === null) {
                return [];
            }

            const parsedProjects: RecentProject[] = JSON.parse(readProjects).map(
                (obj: any) => new RecentProject(obj.name, obj.path, new Date(parseInt(obj.lastOpened)))
            );

            const filteredProjects: RecentProject[] = [];
            for (const recentProject of parsedProjects) {
                try {
                    await fs.stat(recentProject.path);
                    filteredProjects.push(recentProject);
                } catch (err) {
                    // Do nothing, this project does not exist anymore.
                }
            }

            // We should also sort the filtered projects from newest to oldest.
            return filteredProjects.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime());
        } catch (err) {
            return [];
        }

    }

    /**
     * Add a new project to the list of recently opened projects. The name of the project will be derived from the path.
     * The time of last opening the project will be set to now. If a project with the same path was already opened
     * before, its visited date will be updated.
     *
     * @param projectPath Location of the project on the user's local filesystem.
     */
    public async addRecentProject(projectPath: string): Promise<void> {
        if (!projectPath.endsWith("/")) {
            projectPath += "/";
        }

        // First read the previously stored recent projects.
        const recentProjects: RecentProject[] = await this.getRecentProjects();

        // Now, check if the project to be added already exists in this list (if so, we only need to update its date).
        const existingProject: RecentProject | undefined = recentProjects.find(p => p.path === projectPath);

        if (existingProject) {
            existingProject.lastOpened = new Date();
        } else {
            recentProjects.push(new RecentProject(path.basename(projectPath), projectPath, new Date()));
        }

        await this.writeRecentProjects(recentProjects);
    }

    /**
     * Write a list of recent projects to local storage. Projects will be serialized and sorted by date before being
     * stored. Note that only the first n project will be kept (where n is the constant AMOUNT_OF_RECENT_PROJECTS).
     *
     * @param projects List of projects to store.
     */
    private writeRecentProjects(projects: RecentProject[]): Promise<void> {
        const fsManager = new FileSystemManager();
        return fsManager.writeFile(this.getRecentProjectsPath(), JSON.stringify(projects
            .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
            .slice(0, FileSystemRecentProjectManager.AMOUNT_OF_RECENT_PROJECTS)
            .map(p => {
                return {
                    name: p.name,
                    path: p.path,
                    lastOpened: p.lastOpened.getTime()
                };
            })
        ));
    }

    private getRecentProjectsPath(): string {
        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = app.getPath("userData");
        return configurationFolder + "/" + FileSystemRecentProjectManager.RECENT_PROJECTS_FILE;
    }
}
