import { EcResponse } from "unipept-web-components/src/business/communication/functional/ec/EcResponse";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import { expose } from "threads/worker";
import Database from "better-sqlite3";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import InterproResponse from "unipept-web-components/src/business/communication/functional/interpro/InterproResponse";

expose({ process })

export default function process(
    dbPath: string,
    codes: InterproCode[],
    output: Map<InterproCode, InterproResponse>
): Map<EcCode, EcResponse> {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");

    const stmt = db.prepare("SELECT * FROM interpro_entries WHERE `code` = ?");

    for (const code of codes) {
        const row = stmt.get(code.substr(4));

        if (row) {
            output.set(code, {
                code: "IPR:" + row.code,
                name: row.name,
                category: row.category
            });
        }
    }

    return output;
}
