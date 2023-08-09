import NetworkUtils from "@renderer/logic/utils/NetworkUtils";

export default class GitHubCommunicator {
    private static checkedForUpdate = false;
    private static remoteAppVersion = "";
    private static releaseNotesCache = "";
    private static releaseNotesVersion = "";

    public async getRemoteAppVersion(): Promise<string> {
        if (!GitHubCommunicator.checkedForUpdate) {
            GitHubCommunicator.checkedForUpdate = true;
            GitHubCommunicator.remoteAppVersion = await this.getMostRecentVersion();
        }

        return GitHubCommunicator.remoteAppVersion;
    }

    /**
     * Returns the release content for a specific release version. This content is formatted as MarkDown.
     *
     * @param appVersion Version of the application for which changes need to be retrieved. Just should be the plain
     * version number (no "v"-prefix!), e.g.: 0.6.2
     * @return A list of all changes that were made during this release.
     * @throws Error if the given release could not be found, or if no internet connection is established.
     */
    public async getReleaseNotes(appVersion: string): Promise<string> {
        if (GitHubCommunicator.releaseNotesCache === "" || GitHubCommunicator.releaseNotesVersion !== appVersion) {
            GitHubCommunicator.releaseNotesCache = (await NetworkUtils.getJSON(
                `https://api.github.com/repos/unipept/unipept-desktop/releases/tags/v${appVersion}`
            )).body;
            GitHubCommunicator.releaseNotesVersion = appVersion;
        }

        return GitHubCommunicator.releaseNotesCache;
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
