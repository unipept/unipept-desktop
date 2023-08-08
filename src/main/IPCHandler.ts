import { ipcMain } from "electron";
import FileSystemManager from "./file-system/FileSystemManager";
import ConfigurationManager from "./configuration/ConfigurationManager";
import BrowserUtils from "./browser/BrowserUtils";
import DialogManager from "./dialog/DialogManager";

export default class IPCHandler {
    public initializeIPC() {
        // Manipulating the file system.
        const fsManager = new FileSystemManager();
        ipcMain.handle("fs:read-file", (event, path) => {
            
        });

        ipcMain.handle("fs:write-file", (event, path, contents) => {

        });

        // Manipulating the application's current configuration.
        const configurationManager = new ConfigurationManager();
        ipcMain.handle(
            "config:read-configuration", 
            (event) => configurationManager.readConfiguration()
        );

        ipcMain.handle(
            "config:write-configuration", 
            (event, configuration) => configurationManager.writeConfiguration(configuration)
        );

        ipcMain.handle(
            "config:reset-configuration", 
            (event) => configurationManager.resetConfiguration()
        );

        // Browser actions
        ipcMain.on("browser:open-in-browser", (event, url) => {
            BrowserUtils.openInBrowser(url);
        });

        // Dialog actions
        const dialogManager = new DialogManager();
        ipcMain.handle("dialog:show-folder-picker-dialog", (event) => dialogManager.showFolderPickerDialog());
    }
}
