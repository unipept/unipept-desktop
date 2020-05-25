import { EcResponse } from "unipept-web-components/src/business/communication/functional/ec/EcResponse";
import { EcCode } from "unipept-web-components/src/business/ontology/functional/ec/EcDefinition";
import { expose } from "threads/worker";
import Database from "better-sqlite3";

expose({ process })

export default function process(
    installationDir: string,
    dbPath: string,
    codes: EcCode[],
    output: Map<EcCode, EcResponse>
): Map<EcCode, EcResponse> {
    // @ts-ignore
    const db = new Database(dbPath, {}, installationDir);
    db.pragma("journal_mode = WAL");

    const stmt = db.prepare("SELECT * FROM ec_numbers WHERE `code` = ?");

    for (const code of codes) {
        const row = stmt.get(code.substr(3));

        if (row) {
            output.set(code, {
                code: "EC:" + row.code,
                name: row.name
            });
        }
    }

    return output;
}
