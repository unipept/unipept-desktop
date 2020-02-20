import FileSystemStudyVisitor from "@/logic/filesystem/study/FileSystemStudyVisitor";
import Study from "unipept-web-components/src/logic/data-management/study/Study";
import * as fs from "fs";

export default class StudyFileSystemRemover extends FileSystemStudyVisitor {
    async visitStudy(study: Study): Promise<void> {
        const files: string[] = fs.readdirSync(this.studyPath, { withFileTypes: true }).map(entry => entry.name);
        // Remove all files in this directory
        for (const file of files) {
            fs.unlinkSync(`${this.studyPath}${file}`);
        }
        fs.unlinkSync(this.studyPath);
    }
}
