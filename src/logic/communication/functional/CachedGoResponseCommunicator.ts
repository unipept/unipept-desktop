import { GoResponse, GoResponseCommunicator, GoCode, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";

export default class CachedGoResponseCommunicator extends GoResponseCommunicator {
    private static codeToResponses: Map<GoCode, GoResponse> = new Map<GoCode, GoResponse>();
    private static processing: Promise<Map<GoCode, GoResponse>>;
    private readonly dbFile: string;

    constructor() {
        super();
        try {
            const staticDatabaseManager = new StaticDatabaseManager();
            staticDatabaseManager.getDatabase();
            this.dbFile = staticDatabaseManager.getDatabasePath();
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
            this.dbFile = "";
        }
    }

    public async process(codes: string[]): Promise<void> {
        if (!this.dbFile) {
            return super.process(codes);
        }

        while (CachedGoResponseCommunicator.processing) {
            await CachedGoResponseCommunicator.processing;
        }

        CachedGoResponseCommunicator.processing = QueueManager.getLongRunningQueue().pushTask<
            Map<string, GoResponse>, [string, string, GoCode[], Map<GoCode, GoResponse>]
        >("computeCachedGoResponses", [
            __dirname,
            this.dbFile,
            codes,
            CachedGoResponseCommunicator.codeToResponses
        ]);

        CachedGoResponseCommunicator.codeToResponses = await CachedGoResponseCommunicator.processing;
        CachedGoResponseCommunicator.processing = undefined;
    }

    public getResponse(code: string): GoResponse {
        if (!this.dbFile) {
            return super.getResponse(code);
        }

        return CachedGoResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<GoCode, GoResponse> {
        if (!this.dbFile) {
            return super.getResponseMap();
        }

        return CachedGoResponseCommunicator.codeToResponses;
    }
}
