export default class OperatingSystemUtils {
    public static isWindows(): boolean {
        return process.platform === "win32";
    }

    public static isLinux(): boolean {
        return process.platform === "linux";
    }

    public static isMacOS(): boolean {
        return process.platform === "darwin";
    }
}
