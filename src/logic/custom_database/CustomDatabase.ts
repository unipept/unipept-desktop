import { NcbiId } from "unipept-web-components";

export default class CustomDatabase {
    constructor(
        public readonly name: String,
        public readonly source: String,
        public readonly sourceVersion: String,
        public readonly taxa: NcbiId[],
        // Amount of entries that are present in this filtered database.
        public readonly entries: number
    ) {}
}
