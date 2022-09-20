import { promises as fs } from "fs";
import path from "path";
import { exec, ExecException } from "child_process";
import checkDiskSpace from "check-disk-space";

export type DiskStats = {
    total: number,
    free: number
}

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

    /**
     * Computes the size of a file or directory (including all of it's subdirectories).
     *
     * @param location Valid path on disk for which the filesize should be computed.
     * @return Size of the given path in bytes (total size of directory if path points to a directory).
     */
    public static async getSize(location: string): Promise<number> {
        try {
            const stats = await fs.lstat(location);
            let totalSize = 0;
            if (stats.isDirectory()) {
                for (const subPath of await fs.readdir(location)) {
                    totalSize += await this.getSize(path.join(location, subPath));
                }
                return totalSize;
            } else {
                return stats.size;
            }
        } catch (e) {
            // Folder was not found... Reported size is 0 in this case.
            return 0;
        }
    }

    public static async getDiskStats(folder: string): Promise<DiskStats | undefined> {
        try {
            await fs.readdir(folder);
        } catch (err) {
            console.warn(err);
            // This folder does not exist.
            return undefined;
        }

        const space = await checkDiskSpace(folder);
        return {
            total: space.size,
            free: space.free
        }
    }
}
