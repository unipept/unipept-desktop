export default class SearchConfiguration {
    constructor(
        public equateIl: boolean = true,
        public filterDuplicates: boolean = true,
        public enableMissingCleavageHandling: boolean = false,
        public id?: string
    ) {}

    public toString() {
        return [this.equateIl, this.filterDuplicates, this.enableMissingCleavageHandling].map(
            t => t.toString()
        ).join(",");
    }
}
