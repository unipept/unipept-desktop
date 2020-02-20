import { FileEventType } from "@/logic/filesystem/project/FileEventType";

export default class FileEvent {
    public readonly eventType: FileEventType;
    public readonly path: string;

    constructor(eventType: FileEventType, path: string) {
        this.eventType = eventType;
        this.path = path;
    }
}
