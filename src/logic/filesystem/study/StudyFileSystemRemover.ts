import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import * as fs from "fs";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import {FileEventType} from "@/logic/filesystem/project/FileEventType";

export default class StudyFileSystemRemover extends FileSystemStudyVisitor {
    async visitStudy(study: Study): Promise<void> {
        const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true }).map(entry => entry.name);
        // Remove all files in this directory
        for (const file of files) {
            fs.unlinkSync(`${this.studyPath}${file}`);
        }
        fs.unlinkSync(this.studyPath);
    }

    async getExpectedFileEvents(study: Study): Promise<FileEvent[]> {
        const events: FileEvent[] = [];

        const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true }).map(entry => entry.name);
        // Remove all files in this directory
        for (const file of files) {
            events.push(new FileEvent(FileEventType.RemoveFile, `${this.studyPath}${file}`));
        }
        events.push(new FileEvent(FileEventType.RemoveDir, this.studyPath))

        return events;
    }
}
