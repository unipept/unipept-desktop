import * as fs from "fs/promises";

export default class FileSystemManager {
    public readFile(path: string): Promise<string> {
        return fs.readFile(path, { encoding: "utf-8" });
    }

    public writeFile(path: string, contents: string): Promise<void> {
        return fs.writeFile(path, contents, { encoding: "utf-8" });
    }

    public async mkdir(path: string): Promise<void> {
        await fs.mkdir(path, { recursive: true });
    }

    public async fileExists(path: string): Promise<boolean> {
        try {
            await fs.stat(path);
            return true;
        } catch (e) {
            return false;
        }
    }
}
