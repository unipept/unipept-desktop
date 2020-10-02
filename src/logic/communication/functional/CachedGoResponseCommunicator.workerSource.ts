import Database from "better-sqlite3";
import { GoResponse } from "unipept-web-components/src/business/communication/functional/go/GoResponse";
import { GoCode } from "unipept-web-components/src/business/ontology/functional/go/GoDefinition";


export async function compute(
    [installationDir, dbPath, codes, output]: [string, string, GoCode[], Map<GoCode, GoResponse>]
): Promise<Map<GoCode, GoResponse>> {
    // @ts-ignore
    const db = new Database(dbPath, {}, installationDir);
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
