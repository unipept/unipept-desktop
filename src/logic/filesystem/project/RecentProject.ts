export default class RecentProject {
    public readonly name: string;
    public readonly path: string;
    public lastOpened: Date;

    constructor(name: string, path: string, lastOpened: Date) {
        this.name = name;
        this.path = path;
        this.lastOpened = lastOpened;
    }
}
