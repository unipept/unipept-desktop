/**
 * This workflow tests if the application starts up properly, and if we are able to create a new project, load it in
 * the app and get some analysis results.
 */

import Setup from "../../src/Setup";

const Application = require("spectron").Application;
const electronPath = require("electron");
const path = require("path");

describe("Application launch", () => {
    jest.setTimeout(15000);

    let app;

    beforeEach(async() => {
        const setup = new Setup();
        app = await setup.setupApp();
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
        await app.client.waitUntilWindowLoaded();
        // Make sure the application is properly started...
        await app.client.waitUntilTextExists(".project-actions", "Create new project");
    });
});
