/**
 * This workflow tests if the application starts up properly, and if we are able to create a new project, load it in
 * the app and get some analysis results.
 */

const Application = require("spectron").Application;
const electronPath = require("electron");
const path = require("path");

describe("Application launch", () => {
    jest.setTimeout(15000);

    let app;

    beforeEach(() => {
        app = new Application({
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
    });

    afterEach(() => {
        if (app && app.isRunning()) {
            return app.stop();
        }
    });

    it("shows an initial window", async() => {
        const count = await app.client.getWindowCount();
        expect(count).toBe(1);
    });

    it("creates a new project directory", async() => {
        // app.client.
    });
});
