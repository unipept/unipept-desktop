import { NcbiResponseCommunicator, NcbiId, NcbiResponse } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import { Database, Statement } from "better-sqlite3";
import { spawn, Worker } from "threads/dist";

export default class CachedNcbiResponseCommunicator extends NcbiResponseCommunicator {
    private readonly database: Database;
    private fallbackCommunicator: NcbiResponseCommunicator;
    private readonly extractStmt: Statement;
    private static codesProcessed: Map<NcbiId, NcbiResponse> = new Map<NcbiId, NcbiResponse>();
    private static processing: Promise<Map<NcbiId, NcbiResponse>>;
    private static worker: any;

    constructor() {
        super();
        const staticDatabaseManager = new StaticDatabaseManager();
        try {
            this.database = staticDatabaseManager.getDatabase();
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
            this.database = null;
            this.fallbackCommunicator = new NcbiResponseCommunicator();
        }
    }

    public async process(codes: NcbiId[]): Promise<void> {
        if (!this.database) {
            await this.fallbackCommunicator.process(codes);
        } else {
            while (CachedNcbiResponseCommunicator.processing) {
                await CachedNcbiResponseCommunicator.processing;
            }

            const staticDatabaseManager = new StaticDatabaseManager();

            if (!CachedNcbiResponseCommunicator.worker) {
                CachedNcbiResponseCommunicator.worker = await spawn(
                    new Worker("./CachedNcbiResponseCommunicator.worker.ts")
                );
            }
            CachedNcbiResponseCommunicator.processing = CachedNcbiResponseCommunicator.worker.process(
                __dirname,
                staticDatabaseManager.getDatabasePath(),
                codes,
                CachedNcbiResponseCommunicator.codesProcessed
            );
            CachedNcbiResponseCommunicator.codesProcessed = await CachedNcbiResponseCommunicator.processing;
            CachedNcbiResponseCommunicator.processing = undefined;
        }
    }

    public getResponse(id: NcbiId): NcbiResponse {
        if (!this.database) {
            return this.fallbackCommunicator.getResponse(id);
        } else {
            return CachedNcbiResponseCommunicator.codesProcessed.get(id);
        }
    }

    public getResponseMap(): Map<NcbiId, NcbiResponse> {
        return CachedNcbiResponseCommunicator.codesProcessed;
    }
}
