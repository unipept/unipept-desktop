export default class Utils {
    static isWindows(): boolean {
        return process.platform === "win32";
    }

    static isLinux(): boolean {
        return process.platform === "linux";
    }

    static isMacOS(): boolean {
        return process.platform === "darwin";
    }
}