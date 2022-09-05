import { EcCode, EcResponseCommunicator, EcResponse, QueueManager } from "unipept-web-components";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { Database } from "better-sqlite3";

export default class CachedEcResponseCommunicator extends EcResponseCommunicator {
    private static codeToResponses: Map<EcCode, EcResponse> = new Map<EcCode, EcResponse>();
    private static processing: Promise<Map<EcCode, EcResponse>>;
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

    public async process(codes: EcCode[]): Promise<void> {
        if (!this.db) {
            return super.process(codes);
        }

        const stmt = this.db.prepare("SELECT * FROM ec_numbers WHERE `code` = ?");

        for (const code of codes) {
            const row = stmt.get(code.substr(3));

            if (row) {
                CachedEcResponseCommunicator.codeToResponses.set(code, {
                    code: "EC:" + row.code,
                    name: row.name
                });
            }
        }
    }

    public getResponse(code: EcCode): EcResponse {
        if (!this.db) {
            return super.getResponse(code);
        }

        return CachedEcResponseCommunicator.codeToResponses.get(code);
    }

    public getResponseMap(): Map<EcCode, EcResponse> {
        if (!this.db) {
            return super.getResponseMap();
        }

        return CachedEcResponseCommunicator.codeToResponses;
    }
}
