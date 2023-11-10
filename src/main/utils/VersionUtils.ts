import { compareVersions } from "compare-versions";

export default class VersionUtils {
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
}
