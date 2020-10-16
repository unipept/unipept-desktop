const Application = require("spectron").Application;
const electronPath = require("electron");
const path = require("path");

export default class Setup {
    async setupApp() {
        if (process.platform === "darwin") {
            let app = new Application({
                path: path.join(
                    __dirname,
                    "..",
                    "..",
                    "dist_electron",
                    "mac",
                    "Unipept Desktop.app",
                    "Contents",
                    "MacOS",
                    "Unipept Desktop"
                )
            });

            return app.start();
        } else if (process.platform === "win32") {
            let app = new Application({
                path: path.join(
                    __dirname,
                    "..",
                    "..",
                    "dist_electron",
                    "win-unpacked",
                    "Unipept Desktop.exe"
                )
            });

            return app.start();
        } else {
            throw Error("Current platform " + process.platform + " is not supported for the integration tests!");
        }
    }
}
