import { GoResponse, GoResponseCommunicator, GoCode, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";

export default class CachedGoResponseCommunicator extends GoResponseCommunicator {
    private static codeToResponses: Map<GoCode, GoResponse> = new Map<GoCode, GoResponse>();
    private static processing: Promise<Map<GoCode, GoResponse>>;
    private readonly db: Database;

    constructor() {
        super();
        try {
            const staticDatabaseManager = new StaticDatabaseManager();
            this.db = staticDatabaseManager.getDatabase();
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
        }
    }

    public async process(codes: string[]): Promise<void> {
        if (!this.db) {
            return super.process(codes);
        }

        const stmt = this.db.prepare("SELECT * FROM go_terms WHERE `code` = ?");

        for (const code of codes) {
            const row = stmt.get(code);

            if (row) {
                CachedGoResponseCommunicator.codeToResponses.set(code, {
                    code: row.code,
                    namespace: row.namespace,
                    name: row.name
                });
            }
        }
    }

    public getResponse(code: string): GoResponse {
        if (!this.db) {
            return super.getResponse(code);
        }

        return CachedGoResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<GoCode, GoResponse> {
        if (!this.db) {
            return super.getResponseMap();
        }

        return CachedGoResponseCommunicator.codeToResponses;
    }
}
