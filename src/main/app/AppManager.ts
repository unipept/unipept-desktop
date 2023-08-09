import { app } from "electron";

export default class AppManager {
    public restartApplication() {
        app.relaunch();
        app.exit();
    }

    public getElectronVersion() {
        return process.versions.electron;
    }

    public getChromeVersion() {
        return process.versions.chrome;
    }

    public getAppVersion() {
        return app.getVersion();
    }
}
