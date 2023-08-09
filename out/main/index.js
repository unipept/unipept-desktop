"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fs = require("fs/promises");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const icon = path.join(__dirname, "../../resources/icon.png");
class FileSystemManager {
  readFile(path2) {
    return fs__namespace.readFile(path2, { encoding: "utf-8" });
  }
  writeFile(path2, contents) {
    return fs__namespace.writeFile(path2, contents, { encoding: "utf-8" });
  }
  async mkdir(path2) {
    await fs__namespace.mkdir(path2, { recursive: true });
  }
  async fileExists(path2) {
    try {
      await fs__namespace.stat(path2);
      return true;
    } catch (e) {
      return false;
    }
  }
}
class OperatingSystemUtils {
  static isWindows() {
    return process.platform === "win32";
  }
  static isLinux() {
    return process.platform === "linux";
  }
  static isMacOS() {
    return process.platform === "darwin";
  }
}
class ConfigurationManager {
  static CONFIG_FILE_NAME = "unipept.config";
  static DOCKER_UNIX_DEFAULT_SETTINGS = JSON.stringify({
    socketPath: "/var/run/docker.sock"
  });
  static DOCKER_WINDOWS_DEFAULT_SETTINGS = JSON.stringify({
    socketPath: "//./pipe/docker_engine"
  });
  configurationRules = [
    (config) => {
      return Number.isInteger(config.maxParallelRequests) && config.maxParallelRequests <= 10 && config.maxParallelRequests >= 1;
    },
    (config) => {
      try {
        JSON.parse(config.dockerConfigurationSettings);
        return true;
      } catch (e) {
        return false;
      }
    },
    (config) => config.customDbStorageLocation !== ""
    // (config: Configuration) => config.apiEndpoints.every(e => FormValidation.url(e))
  ];
  async readConfiguration() {
    const fsManager = new FileSystemManager();
    const configPath = this.getConfigurationFilePath();
    if (!await fsManager.fileExists(configPath)) {
      return await this.createDefaultConfiguration();
    }
    const parsedConfig = JSON.parse(await fsManager.readFile(this.getConfigurationFilePath()));
    for (const [key, value] of Object.entries(await this.createDefaultConfiguration())) {
      if (!(key in parsedConfig)) {
        parsedConfig[key] = value;
      }
    }
    await this.isConfigurationValid(parsedConfig);
    return parsedConfig;
  }
  async writeConfiguration(config) {
    await this.isConfigurationValid(config);
    const fsManager = new FileSystemManager();
    return fsManager.writeFile(this.getConfigurationFilePath(), JSON.stringify(config));
  }
  async resetConfiguration() {
    const defaultConfig = await this.createDefaultConfiguration();
    await this.writeConfiguration(defaultConfig);
    return defaultConfig;
  }
  getConfigurationFilePath() {
    const configurationFolder = electron.app.getPath("userData");
    return configurationFolder + "/" + ConfigurationManager.CONFIG_FILE_NAME;
  }
  async createDefaultConfiguration() {
    const homeDir = electron.app.getPath("documents");
    const customDbDir = path.join(homeDir, "unipept", "data");
    const fsManager = new FileSystemManager();
    await fsManager.mkdir(customDbDir);
    return {
      maxParallelRequests: 4,
      dockerConfigurationSettings: OperatingSystemUtils.isWindows() ? ConfigurationManager.DOCKER_WINDOWS_DEFAULT_SETTINGS : ConfigurationManager.DOCKER_UNIX_DEFAULT_SETTINGS,
      customDbStorageLocation: customDbDir,
      apiEndpoints: [
        "https://api.unipept.ugent.be"
      ]
    };
  }
  async isConfigurationValid(config) {
    const missingKeys = Object.keys(await this.createDefaultConfiguration()).filter((key) => !(key in config));
    if (missingKeys && missingKeys.length > 0) {
      throw new Error(
        "Provided configuration object missing properties: " + missingKeys.join(", ") + ".Original object is: " + JSON.stringify(config) + "."
      );
    }
    const missingRules = this.configurationRules.filter((rule) => !rule(config));
    if (missingRules && missingRules.length > 0) {
      throw new Error(
        "Provided configuration values not satisfying constraints: " + missingRules.join(", ") + ".Original object is: " + JSON.stringify(config) + "."
      );
    }
  }
}
class BrowserUtils {
  static openInBrowser(url) {
    electron.shell.openExternal(url);
  }
}
class DialogManager {
  async showFolderPickerDialog() {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });
    if (result && result.filePaths.length > 0) {
      return result.filePaths;
    }
    return void 0;
  }
}
class AppManager {
  restartApplication() {
    electron.app.relaunch();
    electron.app.exit();
  }
  getElectronVersion() {
    return process.versions.electron;
  }
  getChromeVersion() {
    return process.versions.chrome;
  }
  getAppVersion() {
    return electron.app.getVersion();
  }
}
class IPCHandler {
  initializeIPC() {
    const configurationManager = new ConfigurationManager();
    electron.ipcMain.handle(
      "config:read-configuration",
      () => configurationManager.readConfiguration()
    );
    electron.ipcMain.handle(
      "config:write-configuration",
      (_, configuration) => configurationManager.writeConfiguration(configuration)
    );
    electron.ipcMain.handle(
      "config:reset-configuration",
      () => configurationManager.resetConfiguration()
    );
    electron.ipcMain.on("browser:open-in-browser", (_, url) => {
      BrowserUtils.openInBrowser(url);
    });
    const dialogManager = new DialogManager();
    electron.ipcMain.handle("dialog:show-folder-picker-dialog", () => dialogManager.showFolderPickerDialog());
    const appManager = new AppManager();
    electron.ipcMain.on("app:restart", () => appManager.restartApplication());
    electron.ipcMain.handle("app:get-app-version", () => appManager.getAppVersion());
    electron.ipcMain.handle("app:get-electron-version", () => appManager.getElectronVersion());
    electron.ipcMain.handle("app:get-chrome-version", () => appManager.getChromeVersion());
  }
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 1e3,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js")
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  const ipcHandler = new IPCHandler();
  ipcHandler.initializeIPC();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
