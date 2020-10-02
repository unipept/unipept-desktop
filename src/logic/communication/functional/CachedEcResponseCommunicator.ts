import { EcCode, EcResponseCommunicator, EcResponse, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";

export default class CachedEcResponseCommunicator extends EcResponseCommunicator {
    private static codeToResponses: Map<EcCode, EcResponse> = new Map<EcCode, EcResponse>();
    private static processing: Promise<Map<EcCode, EcResponse>>;
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

    public async process(codes: EcCode[]): Promise<void> {
        if (!this.dbFile) {
            return super.process(codes);
        }

        while (CachedEcResponseCommunicator.processing) {
            await CachedEcResponseCommunicator.processing;
        }

        CachedEcResponseCommunicator.processing = QueueManager.getLongRunningQueue().pushTask<
            Map<EcCode, EcResponse>, [string, string, EcCode[], Map<EcCode, EcResponse>]
        >("computeCachedEcResponses", [
            __dirname,
            this.dbFile,
            codes,
            CachedEcResponseCommunicator.codeToResponses
        ]);

        CachedEcResponseCommunicator.codeToResponses = await CachedEcResponseCommunicator.processing;
        CachedEcResponseCommunicator.processing = undefined;
    }

    public getResponse(code: EcCode): EcResponse {
        if (!this.dbFile) {
            return super.getResponse(code);
        }

        return CachedEcResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<EcCode, EcResponse> {
        if (!this.dbFile) {
            return super.getResponseMap();
        }

        return CachedEcResponseCommunicator.codeToResponses;
    }
}
