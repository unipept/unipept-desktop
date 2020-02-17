export default class ErrorInformation {
    public readonly title: string;
    public readonly message: string;

    constructor(title: string, message: string) {
        this.title = title;
        this.message = message;
    }
}
