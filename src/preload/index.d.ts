import Configuration from "@common/configuration/Configuration";
import RecentProject from "@common/project/RecentProject";

interface ExposedAPI {
    config: {
        readConfiguration: () => Promise<Configuration>,
        writeConfiguration: (contents: Configuration) => Promise<void>,
        resetConfiguration: () => Promise<Configuration>
    },
    browser: {
        openInBrowser: (url: string) => void
    },
    dialog: {
        showFolderPickerDialog: () => Promise<string[] | undefined>
    },
    app: {
        restart: () => void,
        versions: {
            app: Promise<string>,
            chrome: Promise<string>,
            electron: Promise<string>
        }
    },
    project: {
        recentProjects: {
            getRecentProjects: () => Promise<RecentProject[]>,
            addRecentProject: (projectPath: string) => Promise<void>
        }
    }
}

declare global {
    interface Window {
        api: ExposedAPI
    }
}
