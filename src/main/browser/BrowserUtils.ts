import electron from "electron";

export default class BrowserUtils {
    public static openInBrowser(url: string) {
        electron.shell.openExternal(url);
    }
}
