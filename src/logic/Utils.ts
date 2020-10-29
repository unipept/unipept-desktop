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

    /**
     * Compares two version strings.
     *
     * @param firstVersion
     * @param secondVersion
     * @return True if firstVersion is larger than secondVersion
     */
    static isVersionLargerThan(firstVersion: string, secondVersion: string): boolean {
        const firstSplitted = firstVersion.split(".");
        const secondSplitted = secondVersion.split(".");

        for (let part = 0; part < firstSplitted.length; part++) {
            if (firstSplitted[part] > secondSplitted[part]) {
                return true;
            } else if (firstSplitted[part] < secondSplitted[part]) {
                return false;
            }
        }

        return false;
    }
}
