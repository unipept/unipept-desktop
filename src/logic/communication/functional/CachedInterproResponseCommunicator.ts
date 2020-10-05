import { InterproCode, InterproResponse, InterproResponseCommunicator, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";

export default class CachedInterproResponseCommunicator extends InterproResponseCommunicator {
    private static codeToResponses: Map<InterproCode, InterproResponse> = new Map<InterproCode, InterproResponse>();
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
            return super.process(codes as unknown as string[]);
        }

        await this.dbManager.performQuery<void>((db: Database) => {
            const stmt = db.prepare("SELECT * FROM interpro_entries WHERE `code` = ?");

            for (const code of codes) {
                const row = stmt.get(code.substr(4));

                if (row) {
                    CachedInterproResponseCommunicator.codeToResponses.set(code, {
                        code: "IPR:" + row.code,
                        name: row.name,
                        category: row.category
                    });
                }
            }
        });
    }

    public getResponse(code: InterproCode): InterproResponse {
        if (!this.dbManager) {
            return super.getResponse(code as unknown as string);
        }

        return CachedInterproResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<InterproCode, InterproResponse> {
        if (!this.dbManager) {
            return super.getResponseMap();
        }

        return CachedInterproResponseCommunicator.codeToResponses;
    }
}
