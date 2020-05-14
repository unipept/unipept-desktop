import { expose } from "threads/worker";
import Database from "better-sqlite3";
import { GoResponse } from "unipept-web-components/src/business/communication/functional/go/GoResponse";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";

expose({ process })

export default function process(
    dbPath: string,
    codes: GoCode[],
    output: Map<GoCode, GoResponse>
): Map<GoCode, GoResponse> {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    const stmt = db.prepare("SELECT * FROM go_terms WHERE `code` = ?");

    for (const code of codes) {
        const row = stmt.get(code);

        if (row) {
            output.set(code, {
                code: row.code,
                name: row.name,
                namespace: row.namespace
            });
        }
    }

    return output;
}
