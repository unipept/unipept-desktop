import { app } from "electron";

export default class AppManager {
    public restartApplication() {
        app.relaunch();
        app.exit();
    }
}
