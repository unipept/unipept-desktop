import { ipcMain } from "electron";
// import FileSystemManager from "./file-system/FileSystemManager";
import ConfigurationManager from "./configuration/ConfigurationManager";
import BrowserUtils from "./browser/BrowserUtils";
import DialogManager from "./dialog/DialogManager";
import AppManager from "./app/AppManager";
import FileSystemRecentProjectManager from "@main/project/FileSystemRecentProjectManager";

export default class IPCHandler {
    public initializeIPC() {
        // Manipulating the file system.
        // const fsManager = new FileSystemManager();
        // ipcMain.handle("fs:read-file", (_, path) => {

        // });

        // ipcMain.handle("fs:write-file", (event, path, contents) => {

        // });

        // Manipulating the application's current configuration.
        const configurationManager = new ConfigurationManager();
        ipcMain.handle(
            "config:read-configuration",
            () => configurationManager.readConfiguration()
        );

        ipcMain.handle(
            "config:write-configuration",
            (_, configuration) => configurationManager.writeConfiguration(configuration)
        );

        ipcMain.handle(
            "config:reset-configuration",
            () => configurationManager.resetConfiguration()
        );

        // Browser actions
        ipcMain.on("browser:open-in-browser", (_, url) => {
            BrowserUtils.openInBrowser(url);
        });

        // Dialog actions
        const dialogManager = new DialogManager();
        ipcMain.handle("dialog:show-folder-picker-dialog", () => dialogManager.showFolderPickerDialog());

        // App actions
        const appManager = new AppManager();
        ipcMain.on("app:restart", () => appManager.restartApplication());

        ipcMain.handle("app:get-app-version", () => appManager.getAppVersion());
        ipcMain.handle("app:get-electron-version", () => appManager.getElectronVersion());
        ipcMain.handle("app:get-chrome-version", () => appManager.getChromeVersion());

        // Project actions
        const recentProjectManager = new FileSystemRecentProjectManager();
        ipcMain.handle(
            "recent-projects:read-recent-projects",
            () => recentProjectManager.getRecentProjects()
        );
        ipcMain.handle(
            "recent-projects:add-recent-project",
            (_, projectPath) => recentProjectManager.addRecentProject(projectPath)
        );

    }
}
