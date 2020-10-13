import { promises as fs } from "fs";

export default class FileSystemUtils {
    public static async deleteRecursive(path: string): Promise<void> {
        const stats = await fs.lstat(path);
        if (stats.isDirectory()) {
            // Remove all files in this directory
            for (const item of await fs.readdir(path)) {
                await FileSystemUtils.deleteRecursive(path + "/" + item);
            }
        } else {
            // Remove the file itself
            await fs.unlink(path);
        }
    }
}
