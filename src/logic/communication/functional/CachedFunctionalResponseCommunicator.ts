import FunctionalResponseCommunicator from "unipept-web-components/src/business/communication/functional/FunctionalResponseCommunicator";
import { OntologyIdType } from "unipept-web-components/src/business/ontology/Ontology";
import FunctionalResponse from "unipept-web-components/src/business/communication/functional/FunctionalResponse";
import { Database, Statement } from "better-sqlite3";
import StaticDatabaseManager from "@/logic/communication/static/StaticDatabaseManager";

export default abstract class CachedFunctionalResponseCommunicator<
    OntologyId extends OntologyIdType,
    ResponseType extends FunctionalResponse<OntologyId>
> implements FunctionalResponseCommunicator<OntologyId, ResponseType> {
    private readonly database: Database;
    private codesToProcess: Set<OntologyId> = new Set();
    private readonly extractStmt: Statement;

    protected constructor(
        private readonly fallbackCommunicator: FunctionalResponseCommunicator<OntologyId, ResponseType>,
        extractStmt: string,
        private readonly termPrefix: string = ""
    ) {
        const staticDatabaseManager = new StaticDatabaseManager();
        try {
            this.database = staticDatabaseManager.getDatabase();
            this.extractStmt = this.database.prepare(extractStmt);
        } catch (err) {
            console.warn("Gracefully falling back to online communicators due to " + err);
            this.database = null;
        }
    }

    public async process(codes: OntologyId[]): Promise<void> {
        if (!this.database) {
            // Gracefully fallback if on local database seems to be present.
            await this.fallbackCommunicator.process(codes);
        } else {
            for (const code of codes) {
                this.codesToProcess.add(code);
            }
        }
    }

    public getResponse(code: OntologyId): ResponseType | undefined {
        if (!this.database) {
            return this.fallbackCommunicator.getResponse(code);
        } else {
            const requestCode = this.termPrefix === "" ? code : code.toString().substr(this.termPrefix.length);
            return this.convertToResponse(this.extractStmt.get(requestCode));
        }
    }

    public getResponseMap(): Map<OntologyId, ResponseType> {
        if (!this.database) {
            return this.fallbackCommunicator.getResponseMap();
        } else {
            const out = new Map<OntologyId, ResponseType>();
            for (const code of this.codesToProcess) {
                out.set(code, this.getResponse(code));
            }
            return out;
        }
    }

    /**
     * Convert a row retrieved from the database to the correct response type for this communicator.
     *
     * @param row A row retrieved from the database. Could be undefined if requested code was not found in the database.
     */
    protected abstract convertToResponse(row: any): ResponseType;
}
