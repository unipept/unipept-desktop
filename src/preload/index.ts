import { contextBridge, ipcRenderer } from 'electron';
import Configuration from '@common/configuration/Configuration';

// Custom APIs for renderer
const api = {
  config: {
    readConfiguration: () => ipcRenderer.invoke("config:read-configuration"),
    writeConfiguration: (config: Configuration) => ipcRenderer.invoke("config:write-configuration", config),
    resetConfiguration: () => ipcRenderer.invoke("config:reset-configuration")
  },
  browser: {
    openInBrowser: (url: string) => ipcRenderer.send("browser:open-in-browser", url)
  },
  dialog: {
    showFolderPickerDialog: () => ipcRenderer.invoke("dialog:show-folder-picker-dialog")
  },
  app: {
    restart: () => ipcRenderer.send("app:restart")
  }
};
  

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api;
}
