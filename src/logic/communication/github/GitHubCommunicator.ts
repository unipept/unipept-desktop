import { NetworkUtils } from "unipept-web-components";

export default class GitHubCommunicator {
    /**
     * Returns the release content for a specific release version. This content is formatted as MarkDown.
     *
     * @param appVersion Version of the application for which changes need to be retrieved. Just should be the plain
     * version number (no "v"-prefix!), e.g.: 0.6.2
     * @return A list of all changes that were made during this release.
     * @throws Error if the given release could not be found, or if no internet connection is established.
     */
    public async getReleaseNotes(appVersion: string): Promise<string> {
        const result = await NetworkUtils.getJSON(
            `https://api.github.com/repos/unipept/unipept-desktop/releases/tags/v${appVersion}`
        );
        return result.body;
    }

    public async getAllReleases(): Promise<string[]> {
        const result = await NetworkUtils.getJSON(
            "https://api.github.com/repos/unipept/unipept-desktop/releases"
        );

        return result.map((obj: any) => obj.tag_name).map((tag: string) => tag.replace("v", ""));
    }

    public async getMostRecentVersion(): Promise<string> {
        return (await this.getAllReleases())[0];
    }
}
