import { NetworkUtils } from "unipept-web-components";

export default class GitHubCommunicator {
    /**
     * Returns a list of all changes that were made in the given app version.
     *
     * @param appVersion Version of the application for which changes need to be retrieved. Just should be the plain
     * version number (no "v"-prefix!), e.g.: 0.6.2
     * @return A list of all changes that were made during this release.
     */
    public async getReleaseNotes(appVersion: string): Promise<String[]> {
        const result = await NetworkUtils.getJSON(
            `https://api.github.com/repos/unipept/unipept-desktop/releases/tags/v${appVersion}`
        );

        return result.body.split("\n").map((s: string) => s.replace("* ", ""));
    }
}
