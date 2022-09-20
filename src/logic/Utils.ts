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
        const firstSplitted = firstVersion.split(".").map(x => parseInt(x));
        const secondSplitted = secondVersion.split(".").map(x => parseInt(x));

        if (firstSplitted.length < secondSplitted.length) {
            for (let i = 0; i < secondSplitted.length - firstSplitted.length; i++) {
                firstSplitted.push(0);
            }
        } else if (secondSplitted.length < firstSplitted.length) {
            for (let i = 0; i < firstSplitted.length - secondSplitted.length; i++) {
                secondSplitted.push(0);
            }
        }

        for (let part = 0; part < firstSplitted.length; part++) {
            if (firstSplitted[part] > secondSplitted[part]) {
                return true;
            } else if (firstSplitted[part] < secondSplitted[part]) {
                return false;
            }
        }

        return false;
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
