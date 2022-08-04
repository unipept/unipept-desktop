import Dockerode  from "dockerode";
import ProgressInspectorStream from "@/logic/communication/docker/ProgressInspectorStream";
import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import StringNotifierInspectorStream from "@/logic/communication/docker/StringNotifierInspectorStream";
import Utils from "@/logic/Utils";
import FileSystemUtils from "@/logic/filesystem/FileSystemUtils";
import {inspect} from "util";

export default class DockerCommunicator {
    private static readonly BUILD_DB_CONTAINER_NAME = "unipept_desktop_build_database";
    private static readonly WEB_CONTAINER_NAME = "unipept_web";

    private static readonly INDEX_VOLUME_NAME = "unipept_index";
    private static readonly TEMP_VOLUME_NAME = "unipept_temp";

    public static readonly UNIX_DEFAULT_SETTINGS = JSON.stringify({
        socketPath: "/var/run/docker.sock"
    });
    public static readonly WINDOWS_DEFAULT_SETTINGS = JSON.stringify({
        socketPath: "//./pipe/docker_engine"
    })
    public static readonly WEB_COMPONENT_PUBLIC_URL = "http://localhost";
    public static readonly WEB_COMPONENT_PUBLIC_PORT = "3000";

    public static readonly UNIPEPT_DB_IMAGE_NAME = "pverscha/unipept-database:1.0.5";
    public static readonly UNIPEPT_WEB_IMAGE_NAME = "pverscha/unipept-web:1.0.0";

    public static connection: Dockerode;

    public static initializeConnection(config: Dockerode.DockerOptions) {
        DockerCommunicator.connection = new Dockerode(config);
    }

    /**
     * Checks if Docker is installed and ready to use on this system. This method only returns true if Docker is
     * completely ready to be utilized by this application.
     */
    public getDockerInfo(): Promise<any> {
        return DockerCommunicator.connection.info();
    }

    /**
     * Starts a new Docker container and begins by building the database with the given settings. This function resolves
     * after the new database has been built. Once the database has been built, the container is automatically
     * deleted (since the MySQL-generated database files are persisted on the file system).
     *
     * @param customDb A custom database instance that describes all the different properties that should hold true
     * for the database we are about to create.
     * @param databaseFolder Folder in which the database under construction should be stored. This folder should be
     * empty.
     * @param indexFolder Folder in which the constructed database index structure should be kept.
     * @param tempFolder Folder in which all temporary required data can reside. This folder will normally only contain
     * data during the build of the database. It will be cleaned up automatically once the database build is over.
     * @param progressListener A callback function that can be used to monitor the progress of building the database.
     * @param logReporter A callback that's called whenever a new line of log content is produced by the underlying
     * container.
     */
    public async buildDatabase(
        customDb: CustomDatabase,
        databaseFolder: string,
        indexFolder: string,
        tempFolder: string,
        progressListener: (step: string, progress: number, progress_step: number) => void,
        logReporter: (logLine: string) => void
    ): Promise<void> {
        if (!DockerCommunicator.connection) {
            throw new Error("Connection to Docker daemon has not been initialized.");
        }

        if ((await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME)) !== undefined) {
            // A database build is already in progress!
            throw new Error("A previous database build is still in progress.");
        }

        const dataVolumeName = await this.createDataVolume(customDb.name, databaseFolder);
        const indexVolumeName = await this.createIndexVolume(indexFolder);
        const tempVolumeName = await this.createTempVolume(tempFolder);

        progressListener("Fetching required Docker images", -1, 0);
        // Pull the database image
        await this.pullImage(DockerCommunicator.UNIPEPT_DB_IMAGE_NAME);

        await new Promise<void>(async(resolve, reject) => {
            try {
                await DockerCommunicator.connection.run(
                    DockerCommunicator.UNIPEPT_DB_IMAGE_NAME,
                    [],
                    new ProgressInspectorStream(
                        progressListener,
                        () => resolve(),
                        (n: number) => customDb.entries = n,
                        logReporter
                    ),
                    {
                        Name: DockerCommunicator.BUILD_DB_CONTAINER_NAME,
                        Env: [
                            "MYSQL_ROOT_PASSWORD=unipept",
                            "MYSQL_DATABASE=unipept",
                            "MYSQL_USER=unipept",
                            "MYSQL_PASSWORD=unipept",
                            `DB_TYPES=${customDb.sourceTypes.join(",")}`,
                            `DB_SOURCES=${customDb.sources.join(",")}`,
                            `FILTER_TAXA=${customDb.taxa.join(",")}`
                        ],
                        PortBindings: {
                            "3306/tcp": [{
                                HostIP: "0.0.0.0",
                                HostPort: "3306"
                            }]
                        },
                        HostConfig: {
                            Binds: [
                                // Mount the folder in which the MySQL-specific database files will be kept
                                `${dataVolumeName}:/var/lib/mysql`,
                                // Mount the folder in which the reusable database index structure will be kept
                                `${indexVolumeName}:/index`
                            ]
                        }
                    }
                );

                // If resolve has not yet been called, we call it here.
                resolve();
            } catch (err) {
                reject(err);
            }
        });

        customDb.ready = true;

        // Now, stop this container
        await this.stopDatabase();
    }

    public async startDatabase(dbName: string): Promise<void> {
        const dataVolumeName = this.generateDataVolumeName(dbName);

        // Pull image if required...
        await this.pullImage(DockerCommunicator.UNIPEPT_DB_IMAGE_NAME);

        return new Promise<void>(async(resolve, reject) => {
            try {
                const inspectorStream = new ProgressInspectorStream(
                    (s: string, p: number) => {},
                    () => resolve(),
                    () => {},
                    () => {}
                );

                await DockerCommunicator.connection.run(
                    DockerCommunicator.UNIPEPT_DB_IMAGE_NAME,
                    [],
                    inspectorStream,
                    {
                        Name: DockerCommunicator.BUILD_DB_CONTAINER_NAME,
                        Env: [
                            "MYSQL_ROOT_PASSWORD=unipept"
                        ],
                        HostConfig: {
                            Binds: [
                                // Mount the folder in which the MySQL-specific database files will be kept
                                `${dataVolumeName}:/var/lib/mysql`
                            ],
                            PortBindings: {
                                "3306/tcp": [{
                                    HostIP: "0.0.0.0",
                                    HostPort: "3306"
                                }]
                            }
                        }
                    });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }

    /**
     * Stop all the running Docker database containers associated with the Unipept Desktop application.
     */
    public async stopDatabase(): Promise<void> {
        while ((await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME)) !== undefined) {
            const containerInfo = await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME);
            const container = DockerCommunicator.connection.getContainer(containerInfo!.Id);
            await container.stop();
            await container.remove();
        }
    }

    /**
     * Checks if the database container is currently running and active. This means that the communicator is going to
     * check if a container with the BUILD_DB identifier is currently active.
     *
     * @return true if the database is active, false otherwise.
     */
    public async isDatabaseActive(): Promise<boolean> {
        return (await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME)) !== undefined;
    }

    /**
     * Start a Docker container that connects to a database on port 3306 of the host computer and exposes a Unipept
     * API service on port 3000 that can be connected to from this application.
     */
    public async startWebComponent(): Promise<void> {
        await this.pullImage(DockerCommunicator.UNIPEPT_WEB_IMAGE_NAME);

        await new Promise<void>(async(resolve, reject) => {
            const inspectorStream = new StringNotifierInspectorStream("Listening on", resolve);
            try {
                await DockerCommunicator.connection.run(
                    DockerCommunicator.UNIPEPT_WEB_IMAGE_NAME,
                    [],
                    inspectorStream,
                    {
                        Name: DockerCommunicator.WEB_CONTAINER_NAME,
                        HostConfig: {
                            PortBindings: {
                                "3000/tcp": [{
                                    HostIP: "0.0.0.0",
                                    HostPort: DockerCommunicator.WEB_COMPONENT_PUBLIC_PORT
                                }]
                            }
                        }
                    }
                );
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    public async stopWebComponent(): Promise<void> {
        const containerInfo = await this.getContainerByName(DockerCommunicator.WEB_CONTAINER_NAME);
        const container = DockerCommunicator.connection.getContainer(containerInfo.Id);
        await container.stop();
        await container.remove();
    }

    /**
     * Close the connection to the Docker daemon and stop all running containers. This means that containers that
     * are currently still being built will also be stopped and that their build-process needs to be restarted next
     * time the application is started.
     */
    public async closeConnection(): Promise<void> {
        const containers = await new Promise<Dockerode.ContainerInfo[]>(
            (resolve) => {
                DockerCommunicator.connection.listContainers((err, containers) => resolve(containers))
            }
        );

        await Promise.all(
            containers.map(
                c => new Promise<void>(
                    resolve => DockerCommunicator.connection.getContainer(c.Id).stop(resolve)
                )
            )
        );
    }

    public async cleanDatabase(dbName: string): Promise<void> {
        await this.deleteDataVolume(dbName);
    }

    public async getDatabaseSize(dbName: string): Promise<number> {
        const volume = await this.getDataVolume(dbName);
        const info = await volume.inspect();

        if (Utils.isWindows()) {
            // TODO: UsageData is not reported by the engine at this time, should be fixed in the future.
            if (info.UsageData) {
                return info.UsageData.Size;
            } else {
                return -1;
            }
        } else {
            return await FileSystemUtils.getSize(info.Options["device"]);
        }
    }

    private async listUnipeptContainers(): Promise<Dockerode.ContainerInfo[]> {
        return (await DockerCommunicator.connection.listContainers()).filter((c: Dockerode.ContainerInfo) => {
            return c.Names.filter(n => n.includes("unipept_desktop"));
        });
    }

    /**
     * Return all container details for a specific container by name.
     *
     * @param name The container name for which all details should be retrieved.
     */
    private async getContainerByName(name: string): Promise<Dockerode.ContainerInfo | undefined> {
        const allWithName = (await DockerCommunicator.connection.listContainers()).filter(
            (c: Dockerode.ContainerInfo) => {
                return c.Names.filter(n => n.includes(name));
            }
        );

        if (allWithName && allWithName.length > 0) {
            return allWithName[0];
        }
        return undefined;
    }

    private async stopContainer(name: string): Promise<void> {
        const containerInfo = await this.getContainerByName(name);

        if (containerInfo) {
            const container = DockerCommunicator.connection.getContainer(containerInfo.Id);
            await container.stop();
            await container.remove();
        }
    }

    private pullImage(imageName: string): Promise<void> {
        return new Promise<void>(
            async(resolve, reject) => {
                try {
                    await DockerCommunicator.connection.pull(
                        imageName,
                        function (err: any, stream: any) {
                            if (err) {
                                reject(err);
                            }

                            DockerCommunicator.connection.modem.followProgress(
                                stream,
                                // onFinished
                                (err: any, output: any) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    resolve();
                                },
                                // onProgress
                                (progressEvent: any) => {}
                            );
                        }
                    );

                    resolve();
                } catch (err) {
                    reject(err);
                }
            }
        );
    }

    private async getDataVolume(dbName: string): Promise<Dockerode.Volume> {
        return DockerCommunicator.connection.getVolume(this.generateDataVolumeName(dbName));
    }

    private async deleteDataVolume(dbName: string): Promise<any> {
        return this.deleteVolume(this.generateDataVolumeName(dbName));
    }

    private async deleteVolume(volumeName: string): Promise<any> {
        const volume = await DockerCommunicator.connection.getVolume(volumeName);
        if (volume) {
            return volume.remove();
        }
    }

    private async createDataVolume(dbName: string, dbLocation: string): Promise<string> {
        const volumeName = this.generateDataVolumeName(dbName);

        if (!Utils.isWindows()) {
            dbLocation = this.generateDataVolumePath(dbLocation);

            // Clear what's currently stored in the data volume path
            await fs.rmdir(dbLocation, { recursive: true });
            await mkdirp(dbLocation);
        }

        // If the volume already exists, we need to delete it and create a new one (since the analysis will be
        // completely restarted).
        if (await this.volumeExists(volumeName)) {
            await this.deleteDataVolume(dbName);
        }

        await this.createVolume(volumeName, dbLocation);

        return volumeName;
    }

    /**
     * Create a new Docker named volume that's used to store the database index files (which can be used to speed up
     * later iterations of the database construction process).
     *
     * Note that an index volume will also be created when on Windows, but that the given location will not be respected
     * in that case!
     *
     * @param indexLocation Location on the hard drive where the index files can be stored.
     * @return Name of this volume.
     */
    private async createIndexVolume(indexLocation: string): Promise<string> {
        indexLocation = this.generateIndexVolumePath(indexLocation);
        return this.createVolume(DockerCommunicator.INDEX_VOLUME_NAME, indexLocation);
    }

    private async createTempVolume(tempLocation: string): Promise<string> {
        tempLocation = this.generateIndexVolumePath(tempLocation);
        return this.createVolume(DockerCommunicator.TEMP_VOLUME_NAME, tempLocation);
    }

    /**
     * Create a new named volume at a specific location on the filesystem. If a volume with the given name already
     * exists, no new volume will be created (EXCEPT in one situation: if the filesystem path is different for
     * the existing volume and the new volume and the current OS is different from Windows, the old one will be deleted
     * and a new one will be created).
     *
     * @param volumeName Name of the volume that should be created.
     * @param volumeLocation Path on the filesystem where this new named volume should be created.
     * @return The final volume name that was assigned by the system to this volume (will be the same as the first
     * argument in almost all situations).
     */
    private async createVolume(volumeName: string, volumeLocation: string): Promise<string> {
        if (await this.volumeExists(volumeName)) {
            // Since the path on Windows cannot change (due to a bug in WSL2), we are done for Windows in this case.
            if (Utils.isWindows()) {
                return volumeName;
            }

            // Check if the path where this volume is currently is stored is the same as the requested path
            const existingVolume = await DockerCommunicator.connection.getVolume(volumeName);
            const info = await existingVolume.inspect();

            if (path.resolve(info.Options["device"]) !== path.resolve(volumeLocation)) {
                // Remove the volume and create a new one later (the path where index files are stored has changed).
                await this.deleteVolume(volumeName);
            } else {
                // Reuse the current volume
                return volumeName;
            }
        }

        if (Utils.isWindows()) {
            // Do not take into account the database location, due to a bug in WSL2 on Windows.
            await DockerCommunicator.connection.createVolume({
                Name: volumeName
            });
        } else {
            await DockerCommunicator.connection.createVolume({
                Name: volumeName,
                DriverOpts: {
                    "type": "none",
                    "device": volumeLocation,
                    "o": "bind"
                }
            });
        }

        return volumeName;
    }

    /**
     * Checks if a volume with the given name exists in the current Docker context.
     *
     * @param volumeName
     * @return true if a volume with the given name does exist.
     */
    private async volumeExists(volumeName: string): Promise<boolean> {
        const volumes = await DockerCommunicator.connection.listVolumes();
        return volumes.Volumes.some(v => v.Name === volumeName);
    }

    /**
     * Generate a data volume name for the given database name. All special characters will be removed from the given
     * database name (these are not allowed to be used in a volume name).
     *
     * @param dbName Name of the database for which the new volume name should be generated.
     */
    private generateDataVolumeName(dbName: string): string {
        const encodedName = dbName
            .toLowerCase()
            .replace(/[)( ]+/g, "_")
            .replace(/[^a-z0-9_]+/g, "");
        return `${encodedName}_unipept_data`;
    }

    private generateDataVolumePath(dbLocation: string): string {
        return dbLocation;
    }

    private generateIndexVolumePath(indexLocation: string): string {
        return indexLocation;
    }

    private generateTempVolumePath(tempLocation: string): string {
        return tempLocation;
    }
}
