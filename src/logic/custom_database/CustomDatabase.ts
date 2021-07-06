import { NcbiId } from "unipept-web-components";

export default class CustomDatabase {
    constructor(
        public readonly name: string,
        public readonly sources: string[],
        public readonly sourceTypes: string[],
        public readonly taxa: NcbiId[],
        // Amount of entries that are present in this filtered database.
        public readonly entries: number
    ) {}
}
