import { NcbiId } from "unipept-web-components";
import crypto from "crypto";

export default class CustomDatabase {
    constructor(
        public readonly name: string,
        public readonly sources: string[],
        public readonly sourceTypes: string[],
        public readonly taxa: NcbiId[],
        // Amount of entries that are present in this filtered database.
        public readonly entries: number,
        // Has the database successfully been built?
        public complete: boolean = false
    ) {}

    /**
     * Two custom databases are the same iff they produce the same hash value. This means that the original source,
     * source types, taxa and name of the database are also equal.
     */
    public getDatabaseHash(): string {
        return crypto.createHash("sha256").update(
            this.name + this.sources.toString() + this.sourceTypes.toString() + this.taxa.toString()
        ).digest("base64");
    }
}
