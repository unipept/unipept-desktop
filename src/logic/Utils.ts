import { compareVersions } from "compare-versions";

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
        return compareVersions(firstVersion, secondVersion) === 1;
    }

    static compareAssays<T>(a: T[], b: T[]): boolean {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }
}
