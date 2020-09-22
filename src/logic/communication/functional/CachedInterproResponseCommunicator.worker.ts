import { expose } from "threads/worker";
import Database from "better-sqlite3";
import InterproResponse from "unipept-web-components/src/business/communication/functional/interpro/InterproResponse";
import { InterproCode } from "unipept-web-components/src/business/ontology/functional/interpro/InterproDefinition";
import { EcResponse } from "unipept-web-components/src/business/communication/functional/ec/EcResponse";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";

expose({ process })

export default function process(
    installationDir: string,
    dbPath: string,
    codes: InterproCode[],
    output: Map<InterproCode, InterproResponse>
): Map<EcCode, EcResponse> {
    // @ts-ignore
    const db = new Database(dbPath, {}, installationDir);
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
