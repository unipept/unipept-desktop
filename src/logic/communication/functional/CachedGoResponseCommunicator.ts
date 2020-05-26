import { GoResponse } from "unipept-web-components/src/business/communication/functional/go/GoResponse";
import GoResponseCommunicator from "unipept-web-components/src/business/communication/functional/go/GoResponseCommunicator";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import { spawn, Worker } from "threads/dist";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";

export default class CachedGoResponseCommunicator extends GoResponseCommunicator {
    private static codeToResponses: Map<GoCode, GoResponse> = new Map<GoCode, GoResponse>();
    private static processing: Promise<Map<GoCode, GoResponse>>;
    private static worker;
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

    public async process(codes: GoCode[]): Promise<void> {
        if (!this.dbFile) {
            return super.process(codes);
        }

        while (CachedGoResponseCommunicator.processing) {
            await CachedGoResponseCommunicator.processing;
        }

        if (!CachedGoResponseCommunicator.worker) {
            CachedGoResponseCommunicator.worker = await spawn(
                new Worker("./CachedGoResponseCommunicator.worker.ts")
            );
        }
        CachedGoResponseCommunicator.processing = CachedGoResponseCommunicator.worker.process(
            __dirname,
            this.dbFile,
            codes,
            CachedGoResponseCommunicator.codeToResponses
        );

        CachedGoResponseCommunicator.codeToResponses = await CachedGoResponseCommunicator.processing;
        CachedGoResponseCommunicator.processing = undefined;
    }

    public getResponse(code: GoCode): GoResponse {
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
