import { InterproCode, InterproResponse, InterproResponseCommunicator, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";

export default class CachedInterproResponseCommunicator extends InterproResponseCommunicator {
    private static codeToResponses: Map<InterproCode, InterproResponse> = new Map<InterproCode, InterproResponse>();
    private static processing: Promise<Map<InterproCode, InterproResponse>>;
    private static worker: any;
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
            return super.process(codes as unknown as string[]);
        }

        while (CachedInterproResponseCommunicator.processing) {
            await CachedInterproResponseCommunicator.processing;
        }

        CachedInterproResponseCommunicator.processing = QueueManager.getLongRunningQueue().pushTask<
            Map<InterproCode, InterproResponse>, [string, string, InterproCode[], Map<InterproCode, InterproResponse>]
        >(
            "computeCachedInterproResponses",
            [
                __dirname,
                this.dbFile,
                codes,
                CachedInterproResponseCommunicator.codeToResponses
            ]
        );

        CachedInterproResponseCommunicator.codeToResponses = await CachedInterproResponseCommunicator.processing;
        CachedInterproResponseCommunicator.processing = undefined;
    }

    public getResponse(code: InterproCode): InterproResponse {
        if (!this.dbFile) {
            return super.getResponse(code as unknown as string);
        }

        return CachedInterproResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<InterproCode, InterproResponse> {
        if (!this.dbFile) {
            return super.getResponseMap();
        }

        return CachedInterproResponseCommunicator.codeToResponses;
    }
}
