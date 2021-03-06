"use strict"

import { app, protocol, BrowserWindow, Menu, shell, ipcMain, netLog, crashReporter } from "electron"
import { createProtocol } from "vue-cli-plugin-electron-builder/lib"
import Utils from "./logic/Utils";
import ConfigurationManager from "./logic/configuration/ConfigurationManager";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer"
const bt = require("backtrace-node");

app.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096 --expose_gc");

const isDevelopment = process.env.NODE_ENV !== "production"

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }])

// Electron crashes
crashReporter.start({
    productName: "unipept-desktop",
    companyName: "unipept",
    submitURL: "https://submit.backtrace.io/unipept/94d2b87fb00b2b755d07dc4bad99f231603503724471e122f95212f768704898/minidump",
    uploadToServer: true
});

// JavaScript errors in main process
bt.initialize({
    endpoint: "https://unipept.sp.backtrace.io:6098",
    token: "94d2b87fb00b2b755d07dc4bad99f231603503724471e122f95212f768704898"
});


async function createWindow() {
    let configManager = new ConfigurationManager(app);
    let config = await configManager.readConfiguration();

    // Create the browser window.
    let options = {
        width: 1200,
        height: 1000,
        webPreferences: { nodeIntegration: true, enableRemoteModule: true },
        show: false
    };


    // if (Utils.isWindows() && !config.useNativeTitlebar) {
    //     options["frame"] = false;
    // }

    win = new BrowserWindow(options);

    log.transports.file.level = "debug";
    autoUpdater.logger = log;

    autoUpdater.on("update-available", () => {
        if (win) {
            win.webContents.send("update-available");
        }
    });

    autoUpdater.on("update-downloaded", () => {
        if (win) {
            win.webContents.send("update-downloaded");
        }
    });

    autoUpdater.on("download-progress", (progress) => {
        if (win) {
            win.webContents.send("download-progress", progress.percent);
        }
    });

    autoUpdater.on("error", (err) => {
        if (win) {
            win.webContents.send("update-error", err);
        }
    })

    win.once("ready-to-show", () => {
        win.show();
        autoUpdater.checkForUpdatesAndNotify();
    });

    // Set the toolbar menu for this window
    const menu = createMenu(win);
    Menu.setApplicationMenu(menu);

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol("app")
        // Load the index.html when not in development
        await win.loadURL("app://./index.html")
    }

    win.on("closed", () => {
        win = null
    });
}

// Fill the native OS menu with all required menu items.
function createMenu(win: BrowserWindow) {
    const settingsItem = {
        label: "Settings",
        click: async() => {
            win.webContents.send("navigate", "/settings");
        }
    };

    const template = [
        ...(Utils.isMacOS() ? [{
            label: app.getName(),
            submenu: [
                { role: "about" },
                { type: "separator" },
                settingsItem,
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" }
            ]
        }] : []),
        {
            label: "File",
            submenu: [
                ...(Utils.isMacOS() ? [] : [settingsItem, { type: "separator" } ]),
                Utils.isMacOS() ? { role: "close" } : { role: "quit" }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                ...(Utils.isMacOS() ? [
                    { role: "pasteAndMatchStyle" },
                    { role: "delete" },
                    { role: "selectAll" },
                    { type: "separator" },
                    {
                        label: "Speech",
                        submenu: [
                            { role: "startspeaking" },
                            { role: "stopspeaking" }
                        ]
                    }
                ] : [
                    { role: "delete" },
                    { type: "separator" },
                    { role: "selectAll" }
                ])
            ]
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forcereload" },
                { role: "toggledevtools" },
                { type: "separator" },
                { role: "resetzoom" },
                { role: "zoomin" },
                { role: "zoomout" },
                { type: "separator" },
                { role: "togglefullscreen" }
            ]
        }
    ]

    // @ts-ignore
    return Menu.buildFromTemplate(template);
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", async() => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        await createWindow();
    }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async() => {
    if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
        try {
            await installExtension(VUEJS_DEVTOOLS);
        } catch (e) {
            console.error("Vue Devtools failed to install:", e.toString())
        }

    }
    await createWindow();
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", data => {
            if (data === "graceful-exit") {
                app.quit()
            }
        })
    } else {
        process.on("SIGTERM", () => {
            app.quit()
        })
    }
}
