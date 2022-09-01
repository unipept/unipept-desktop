'use strict'

import {app, protocol, BrowserWindow, Menu} from "electron"
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import Utils from "@/logic/Utils";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Increase maximum amount of memory allowed by the app to be consumed to 4GiB
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096 --expose_gc");
app.commandLine.appendSwitch('enable-features', "SharedArrayBuffer")

require('@electron/remote/main').initialize();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const options = {
    width: 1200,
    height: 1200,

    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      sandbox: false
    },
    show: false
  }

  win = new BrowserWindow(options);

  require("@electron/remote/main").enable(win.webContents);

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
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
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
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// let shutdownStarted = false;
// let shutdownCompleted = false;
// app.on("before-quit", async(event) => {
  // if (!shutdownCompleted) {
  //   event.preventDefault();
  // }
  //
  // if (!shutdownStarted) {
  //   shutdownStarted = true;
  //
  //   try {
  //     const configMng = new ConfigurationManager();
  //     const config = await configMng.readConfiguration();
  //
  //     const dockerCommunicator = new DockerCommunicator(config.customDbStorageLocation);
  //
  //     // Stop all the running database builds (if there are some still in progress).
  //     DockerCommunicator.initializeConnection(JSON.parse(config.dockerConfigurationSettings));
  //
  //     await dockerCommunicator.closeConnection();
  //   } finally {
  //     shutdownCompleted = true;
  //     app.quit();
  //   }
  // }
// });

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', (e as any).toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
