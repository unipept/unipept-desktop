import { EcResponse, EcCode } from "unipept-web-components";
import Database from "better-sqlite3";

export async function compute([
    installationDir,
    dbPath,
    codes,
    output
]: [string, string, EcCode[], Map<EcCode, EcResponse>]): Promise<Map<EcCode, EcResponse>> {
    // @ts-ignore
    const db = new Database(dbPath, {}, installationDir);
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
