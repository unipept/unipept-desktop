import RecentProject from "@/logic/filesystem/project/RecentProject";
import fs from "fs";
import path from "path";
import IOException from "unipept-web-components/src/logic/exceptions/IOException";

export default class RecentProjectsManager {
    public static readonly RECENT_PROJECTS_FILE = "recents.json";
    // How many recent projects do we keep track off?
    public static readonly AMOUNT_OF_RECENTS = 15;

    /**
     * @return A list of all projects that were recently opened by the user, sorted descending by date. An empty list
     * is returned if the recent projects file does not exist.
     * @throws {IOException} If the recent projects file was corrupt, not readable or otherwise damaged.
     */
    public async getRecentProjects(): Promise<RecentProject[]> {
        try {
            if (!fs.existsSync(this.getRecentsFilePath())) {
                return [];
            }

            const projectData: string = fs.readFileSync(this.getRecentsFilePath(), {
                encoding: "utf-8"
            });

            console.log(JSON.parse(projectData));

            return JSON.parse(projectData)
                .map(obj => new RecentProject(obj.name, obj.path, new Date(parseInt(obj.lastOpened))));
        } catch (err) {
            throw new IOException(err);
        }
    }

    /**
     * Add a new project to the list of recently opened projects. The name of the project will be derived from the path.
     * The time of last opening the project will be set to now. If a project with the same path was already opened
     * before, it's visited date will be updated.
     *
     * @param projectPath Location of the project on the user's local filesystem.
     */
    public async addRecentProject(projectPath: string): Promise<void> {
        if (!projectPath.endsWith("/")) {
            projectPath += "/";
        }

        // First read the previously stored recent projects.
        const recentProjects: RecentProject[] = await this.getRecentProjects();

        // Now, check if the project to be added already exists in this list (if so, we only need to update it's date).
        const existingProject: RecentProject = recentProjects.find(p => p.path === projectPath);

        if (existingProject) {
            existingProject.lastOpened = new Date();
        } else {
            recentProjects.push(new RecentProject(path.basename(projectPath), projectPath, new Date()));
        }

        const toWrite = recentProjects.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
            .slice(0, RecentProjectsManager.AMOUNT_OF_RECENTS)
            .map(p => {
                return {
                    name: p.name,
                    path: p.path,
                    lastOpened: p.lastOpened.getTime()
                }
            });

        console.log(toWrite);

        fs.writeFileSync(this.getRecentsFilePath(), JSON.stringify(toWrite), {
            encoding: "utf-8"
        });
    }

    private getRecentsFilePath(): string {
        const { app } = require("electron").remote;
        // Get a reference to the user data folder in which configuration data will be stored.
        const configurationFolder = app.getPath("userData");
        return configurationFolder + "/" + RecentProjectsManager.RECENT_PROJECTS_FILE;
    }
}
