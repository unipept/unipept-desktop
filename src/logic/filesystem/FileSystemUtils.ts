import { promises as fs } from "fs";
import path from "path";
import { exec, ExecException } from "child_process";

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
        const stats = await fs.lstat(location);
        let totalSize: number = 0;
        if (stats.isDirectory()) {
            for (const subPath of await fs.readdir(location)) {
                totalSize += await this.getSize(path.join(location, subPath));
            }
            return totalSize;
        } else {
            return stats.size;
        }
    }

    public static async getDiskStats(folder: string): Promise<DiskStats | undefined> {
        const { exec } = require("child_process");

        if (process.platform === "darwin") {
            const [stdout, stderr] = await new Promise<[string, string]>(
                (resolve, reject) =>  {
                    exec(
                        `df -B1 ${folder}`,
                        (err: ExecException | null, stdout: string, stderr: string) =>  {
                            if (err) {
                                reject(err);
                            } else {
                                resolve([stdout, stderr]);
                            }
                        }
                    );
                }
            );

            if (stderr) {
                return undefined;
            } else {
                // Try to parse the output
                const lines = stdout.split("\n");
                const fields = lines[1].split(/\s+/);

                return {
                    total: Number.parseInt(fields[3]) + Number.parseInt(fields[2]),
                    free: Number.parseInt(fields[3])
                }
            }
        } else if (process.platform === "win32") {
            const [stdout, stderr] = await new Promise<[string, string]>(
                (resolve, reject) =>  {
                    exec(
                        "wmic logicaldisk get size,freespace,caption",
                        (err: ExecException | null, stdout: string, stderr: string) =>  {
                            if (err) {
                                reject(err);
                            } else {
                                resolve([stdout, stderr]);
                            }
                        }
                    );
                }
            );

            if (stderr) {
                return undefined;
            }

            // Drive identification information is always given as the first part of the path in Windows
            const driveLetter = folder.slice(0, 2);

            const lines = stdout.split("\n").map(l => l.trimEnd());
            const requestedLine = lines.find(l => l.startsWith(driveLetter));

            const fields = requestedLine.split(/\s+/);

            return {
                total: Number.parseInt(fields[2]),
                free: Number.parseInt(fields[1])
            }
        }

        return undefined;
    }
}
