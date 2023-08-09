"use strict";
const electron = require("electron");
const api = {
  config: {
    readConfiguration: () => electron.ipcRenderer.invoke("config:read-configuration"),
    writeConfiguration: (config) => electron.ipcRenderer.invoke("config:write-configuration", config),
    resetConfiguration: () => electron.ipcRenderer.invoke("config:reset-configuration")
  },
  browser: {
    openInBrowser: (url) => electron.ipcRenderer.send("browser:open-in-browser", url)
  },
  dialog: {
    showFolderPickerDialog: () => electron.ipcRenderer.invoke("dialog:show-folder-picker-dialog")
  },
  app: {
    restart: () => electron.ipcRenderer.send("app:restart"),
    versions: {
      app: electron.ipcRenderer.invoke("app:get-app-version"),
      chrome: electron.ipcRenderer.invoke("app:get-chrome-version"),
      electron: electron.ipcRenderer.invoke("app:get-electron-version")
    }
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
