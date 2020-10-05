import { GoResponse, GoResponseCommunicator, GoCode, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";

export default class CachedGoResponseCommunicator extends GoResponseCommunicator {
    private static codeToResponses: Map<GoCode, GoResponse> = new Map<GoCode, GoResponse>();
    private static processing: Promise<Map<GoCode, GoResponse>>;
    private readonly dbManager: DatabaseManager;

    constructor() {
        super();
        try {
            const staticDatabaseManager = new StaticDatabaseManager();
            this.dbManager = staticDatabaseManager.getDatabaseManager();
        } catch (err) {
            console.warn("Gracefully falling back to online communicators...");
        }
    }

    public async process(codes: string[]): Promise<void> {
        if (!this.dbManager) {
            return super.process(codes);
        }

        await this.dbManager.performQuery<void>((db: Database) => {
            const stmt = db.prepare("SELECT * FROM go_terms WHERE `code` = ?");

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
        });
    }

    public getResponse(code: string): GoResponse {
        if (!this.dbManager) {
            return super.getResponse(code);
        }

        return CachedGoResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<GoCode, GoResponse> {
        if (!this.dbManager) {
            return super.getResponseMap();
        }

        return CachedGoResponseCommunicator.codeToResponses;
    }
}
