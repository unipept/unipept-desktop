import Dockerode  from "dockerode";
import ProgressInspectorStream from "@/logic/communication/docker/ProgressInspectorStream";
import { promises as fs } from "fs";
import path from "path";
import mkdirp from "mkdirp";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import StringNotifierInspectorStream from "@/logic/communication/docker/StringNotifierInspectorStream";
import Utils from "@/logic/Utils";
import FileSystemUtils from "@/logic/filesystem/FileSystemUtils";
import PortFinder from "portfinder";

export default class DockerCommunicator {
    private static readonly BUILD_DB_CONTAINER_NAME = "unipept_desktop_build_database";
    private static readonly RUN_DB_CONTAINER_NAME = "unipept_desktop_run_database";
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

    public static readonly UNIPEPT_DB_IMAGE_NAME = "ghcr.io/unipept/unipept-database:sha-0a5a124";
    public static readonly UNIPEPT_WEB_IMAGE_NAME = "pverscha/unipept-web:1.0.0";

    public static connection: Dockerode;

    // The database that's currently being constructed by Docker.
    private dbBeingConstructed: CustomDatabase;

    public static initializeConnection(config: Dockerode.DockerOptions) {
        DockerCommunicator.connection = new Dockerode(config);
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
            // All containers that have been constructed by this application need to be stopped. (All containers
            // created by this application will contain `unipept` in their name).
            containers.filter(c => c.Names.some(n => n.includes("unipept"))).map(
                c => new Promise<void>(
                    resolve => DockerCommunicator.connection.getContainer(c.Id).stop(resolve)
                )
            )
        );
    }

    /**
     * @param dbRootFolder Where are the databases themselves stored?
     */
    public constructor(
        private readonly dbRootFolder: string
    ) {}

    /**
     * Checks if Docker is installed and ready to use on this system. This method only returns true if Docker is
     * completely ready to be utilized by this application.
     */
    public getDockerInfo(): Promise<any> {
        return DockerCommunicator.connection.info();
    }

    /**
     * Start the construction process of a new database.
     *
     * @param customDb All configuration properties required for the new database that should be constructed.
     * @param indexLocation Where is the database index stored?
     * @param tempLocation Which directory can be used for temporary files? (Must be large enough).
     * @param progressListener A callback function that can be used to monitor the progress of building the database.
     * @param logReporter A callback that's called whenever a new line of log content is produced by the underlying
     container.
     */
    public async buildDatabase(
        customDb: CustomDatabase,
        indexLocation: string,
        tempLocation: string,
        progressListener: (step: string, progress: number, progress_step: number) => void,
        logReporter: (logLine: string) => void
    ): Promise<void> {
        if (!DockerCommunicator.connection) {
            throw new Error("Connection to Docker daemon has not been initialized.");
        }

        // Only one database can be constructed at the same time.
        if (this.dbBeingConstructed) {
            throw new Error("A database is already being constructed.");
        }

        this.dbBeingConstructed = customDb;

        // Check that no other database construction containers are running and stop them if this is the case.
        const runningContainers = await this.listConstructionContainers();
        if (runningContainers.length > 0) {
            await Promise.all(runningContainers.map(
                (container) => this.stopContainer(container.Names[0])
            ));
        }

        // Now, start effectively by constructing the new database
        progressListener("Fetching required Docker images", -1, 0);
        // Check and pull the database image if it is not present on this system.
        await this.pullImage(DockerCommunicator.UNIPEPT_DB_IMAGE_NAME);

        const dataVolumeName = await this.createDataVolume(customDb, this.dbRootFolder);
        const indexVolumeName = await this.createIndexVolume(indexLocation);
        const tempVolumeName = await this.createTempVolume(tempLocation);

        const containerName: string =
            `${DockerCommunicator.BUILD_DB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;

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
                        name: containerName,
                        Env: [
                            "MARIADB_ROOT_PASSWORD=unipept",
                            "MARIADB_DATABASE=unipept",
                            "MARIADB_USER=unipept",
                            "MARIADB_PASSWORD=unipept",
                            `DB_TYPES=${customDb.sourceTypes.join(",")}`,
                            `DB_SOURCES=${customDb.sources.join(",")}`,
                            `FILTER_TAXA=${customDb.taxa.join(",")}`
                        ],
                        HostConfig: {
                            Binds: [
                                // Mount the folder in which the MySQL-specific database files will be kept
                                `${dataVolumeName}:/var/lib/mysql`,
                                // Mount the folder in which the reusable database index structure will be kept
                                `${indexVolumeName}:/index`,
                                `${tempVolumeName}:/temp`
                            ]
                        }
                    }
                );

                // If resolve has not yet been called, we call it here.
                resolve();
            } catch (err) {
                this.dbBeingConstructed = undefined;
                reject(err);
            }
        });

        customDb.ready = true;

        await this.stopContainer(containerName);

        this.dbBeingConstructed = undefined;
    }

    /**
     * Stop the database construction process for the given database object.
     *
     * @param customDb
     */
    public async stopDatabaseBuild(customDb: CustomDatabase): Promise<void> {
        const constructionContainerName =
            `${DockerCommunicator.BUILD_DB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;
        await this.stopContainer(constructionContainerName);

        if (this.dbBeingConstructed && this.dbBeingConstructed.name === customDb.name) {
            this.dbBeingConstructed = undefined;
        }
    }

    /**
     * Start a Unipept service that can be used to be queried for analysis results. This function returns the port
     * number on which the service is exposed.
     *
     * @param customDb
     */
    public async startDatabase(customDb: CustomDatabase): Promise<number> {
        const dataVolumeName = this.generateDataVolumeName(customDb.name);

        // Pull all images that are required to start the web service.
        await this.pullImage(DockerCommunicator.UNIPEPT_DB_IMAGE_NAME);
        await this.pullImage(DockerCommunicator.UNIPEPT_WEB_IMAGE_NAME);

        // Stop the execution of previous services for this db
        await this.stopDatabase(customDb);

        const dbContainerName: string =
            `${DockerCommunicator.RUN_DB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;

        const mysqlPort: number = await PortFinder.getPortPromise({
            port: 3300,
            stopPort: 3400
        });
        // TODO: user PortFinder also for the web service port.
        const webPort: number = 3000;

        await new Promise<void>(async(resolve, reject) => {
            try {
                const stringInspector = new StringNotifierInspectorStream(
                    /InnoDB: Buffer pool\(s\) load completed/,
                    resolve
                );

                await DockerCommunicator.connection.run(
                    DockerCommunicator.UNIPEPT_DB_IMAGE_NAME,
                    [],
                    stringInspector,
                    {
                        name: dbContainerName,
                        Env: [
                            "MARIADB_ROOT_PASSWORD=unipept"
                        ],
                        HostConfig: {
                            Binds: [
                                // Mount the folder in which the MySQL-specific database files will be kept
                                `${dataVolumeName}:/var/lib/mysql`
                            ],
                            PortBindings: {
                                "3306/tcp": [{
                                    HostIP: "0.0.0.0",
                                    HostPort: mysqlPort.toString()
                                }]
                            }
                        }
                    });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });

        const webContainerName: string =
            `${DockerCommunicator.WEB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;

        await new Promise<void>(async(resolve, reject) => {
            const inspectorStream = new StringNotifierInspectorStream(/Listening on/, resolve);
            try {
                await DockerCommunicator.connection.run(
                    DockerCommunicator.UNIPEPT_WEB_IMAGE_NAME,
                    [],
                    inspectorStream,
                    {
                        name: webContainerName,
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

        return webPort;
    }

    /**
     * Stop the running database process for a specific custom database.
     *
     * @param customDb The database for which all running containers should be stopped.
     */
    public async stopDatabase(customDb: CustomDatabase): Promise<void> {
        const webContainerName = `${DockerCommunicator.WEB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;
        const webContainers = (await this.listWebContainers())
            .filter((c) => c.Names[0].includes(webContainerName));

        for (const container of webContainers) {
            await this.stopContainer(container.Names[0]);
        }

        const dbContainerName =
            `${DockerCommunicator.RUN_DB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;
        const dbContainers = (await this.listDatabaseContainers())
            .filter((c) => c.Names[0].includes(dbContainerName));

        for (const container of dbContainers) {
            await this.stopContainer(container.Names[0]);
        }
    }

    /**
     * Stop all services associated with the given database and remove all of its data from disk.
     *
     * @param customDb The database for which all Docker-related data should be removed from disk.
     */
    public async removeDatabase(customDb: CustomDatabase): Promise<void> {
        // Check if the database that's currently in construction is this db.
        const constructionName =
            `${DockerCommunicator.BUILD_DB_CONTAINER_NAME}_${this.sanitizeDatabaseName(customDb.name)}`;
        const constructDbs = (await this.listConstructionContainers())
            .filter((c) => c.Names[0].includes(constructionName));

        for (const db of constructDbs) {
            await this.stopContainer(db.Names[0]);
        }

        if (this.dbBeingConstructed && this.dbBeingConstructed.name === customDb.name) {
            this.dbBeingConstructed = undefined;
        }

        // Also stop database and web service if these are running.
        await this.stopDatabase(customDb);

        // Now remove all data from the local disk associated with this database
        const dataVolumeName = this.generateDataVolumeName(customDb.name);
        this.deleteVolume(dataVolumeName);
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

    public async getDatabaseSize(dbName: string): Promise<number> {
        if (!(await this.volumeExists(this.generateDataVolumeName(dbName)))) {
            return -1;
        }

        const dataVolumeName = this.generateDataVolumeName(dbName);
        const volume = await this.getVolume(dataVolumeName);
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

    /**
     * List all active Docker containers that are used for constructing a Unipept database.
     */
    private listConstructionContainers(): Promise<Dockerode.ContainerInfo[]> {
        return this.filterContainersByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME);
    }

    /**
     * List all active Docker containers that are used for running a Unipept database.
     */
    private listDatabaseContainers(): Promise<Dockerode.ContainerInfo[]> {
        return this.filterContainersByName(DockerCommunicator.RUN_DB_CONTAINER_NAME);
    }

    /**
     * List all active Docker containers that are used for running a Unipept web server.
     */
    private listWebContainers(): Promise<Dockerode.ContainerInfo[]> {
        return this.filterContainersByName(DockerCommunicator.WEB_CONTAINER_NAME);
    }

    /**
     * Return a list of all active Docker containers for which the name includes the given string.
     * @param name Name by which the active Docker containers need to be filtered.
     */
    private async filterContainersByName(name: string): Promise<Dockerode.ContainerInfo[]> {
        return (await DockerCommunicator.connection.listContainers()).filter((c: Dockerode.ContainerInfo) => {
            return c.Names.some(n => n.includes(name));
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

    /**
     * Pull an image with the given name from Docker Hub.
     *
     * @param imageName Exact matching name of the image that should be pulled from the Docker Hub (should also include
     * the correct version numbering).
     */
    private pullImage(imageName: string): Promise<void> {
        return new Promise<void>(
            async(resolve, reject) => {
                try {
                    await DockerCommunicator.connection.pull(
                        imageName,
                        function(err: any, stream: any) {
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
                } catch (err) {
                    reject(err);
                }
            }
        );
    }

    private getVolume(volumeName: string): Dockerode.Volume {
        return DockerCommunicator.connection.getVolume(volumeName);
    }

    private async deleteVolume(volumeName: string): Promise<any> {
        const volume = await DockerCommunicator.connection.getVolume(volumeName);
        if (volume) {
            return volume.remove();
        }
    }

    private async createDataVolume(db: CustomDatabase, dbLocation: string): Promise<string> {
        const volumeName = this.generateDataVolumeName(db.name);

        if (!Utils.isWindows()) {
            dbLocation = this.generateDataVolumePath(db);

            // Clear what's currently stored in the data volume path
            await fs.rmdir(dbLocation, { recursive: true });
            await mkdirp(dbLocation);
        }

        // If the volume already exists, we need to delete it and create a new one (since the analysis will be
        // completely restarted).
        if (await this.volumeExists(volumeName)) {
            await this.deleteVolume(volumeName);
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
     * @return Name of this volume.
     */
    private async createIndexVolume(indexLocation: string): Promise<string> {
        indexLocation = this.generateIndexVolumePath(indexLocation);
        await mkdirp(indexLocation);
        return this.createVolume(DockerCommunicator.INDEX_VOLUME_NAME, indexLocation);
    }

    /**
     * Create a new Docker named volume that's used to store temporary files.
     *
     * Note that a temporary volume will also be created when on Windows, but that the given location will not be
     * respected in that case.
     *
     * @return Name of this volume.
     */
    private async createTempVolume(tempLocation: string): Promise<string> {
        tempLocation = this.generateTempVolumePath(tempLocation);
        await mkdirp(tempLocation);
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
        return `${this.sanitizeDatabaseName(dbName)}_unipept_data`;
    }

    private sanitizeDatabaseName(dbName: string): string {
        return dbName
            .toLowerCase()
            .replace(/[)( ]+/g, "_")
            .replace(/[^a-z0-9_]+/g, "");
    }

    private generateDataVolumePath(database: CustomDatabase): string {
        return path.join(this.dbRootFolder, "databases", database.name, "data");
    }

    private generateIndexVolumePath(indexLocation: string): string {
        return indexLocation;
    }

    private generateTempVolumePath(tempLocation: string): string {
        return tempLocation;
    }
}
