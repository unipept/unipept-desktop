import electron from "electron";

export default class DialogManager {
    public async showFolderPickerDialog(): Promise<string[] | undefined> {
        const result = await electron.dialog.showOpenDialog({
            properties: ["openDirectory", "createDirectory"]
        });

        if (result && result.filePaths.length > 0) {
            return result.filePaths;
        }
        
        return undefined;
    }
}
