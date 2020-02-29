import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import * as fs from "fs";
import FileEvent from "@/logic/filesystem/project/FileEvent";
import { FileEventType } from "@/logic/filesystem/project/FileEventType";

export default class StudyFileSystemRemover extends FileSystemStudyVisitor {
    async visitStudy(study: Study): Promise<void> {
        if (!fs.existsSync(this.studyPath)) {
            return;
        }

        const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true })
            .map(entry => entry.name);

        for (const file of files) {
            fs.unlinkSync(`${this.studyPath}${file}`);
        }

        fs.rmdirSync(this.studyPath);
    }

    async getExpectedFileEvents(study: Study): Promise<FileEvent[]> {
        const events: FileEvent[] = [];

        if (!fs.existsSync(this.studyPath)) {
            return events;
        }

        events.push(new FileEvent(FileEventType.RemoveDir, this.studyPath));

        return events;
    }
}