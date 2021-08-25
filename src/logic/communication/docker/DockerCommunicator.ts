import Dockerode  from "dockerode";
import { NcbiId, ProgressListener } from "unipept-web-components";
import ProgressInspectorStream from "@/logic/communication/docker/ProgressInspectorStream";
import { promises as fs } from "fs";
import mkdirp from "mkdirp";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import StringNotifierInspectorStream from "@/logic/communication/docker/StringNotifierInspectorStream";


export default class DockerCommunicator {
    private static readonly BUILD_DB_CONTAINER_NAME = "unipept_desktop_build_database";
    private static readonly WEB_CONTAINER_NAME = "unipept_web";

    public static readonly UNIX_DEFAULT_SETTINGS = JSON.stringify({ socketPath: "/var/run/docker.sock" });
    public static readonly WINDOWS_DEFAULT_SETTINGS = JSON.stringify({
        protocol: "tcp",
        host: "127.0.0.1",
        port: 2376
    });

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
     * @param progressListener A callback function that can be used to monitor the progress of building the database.
     */
    public async buildDatabase(
        customDb: CustomDatabase,
        databaseFolder: string,
        indexFolder: string,
        progressListener: (step: string, progress: number) => void
    ): Promise<void> {
        if (!DockerCommunicator.connection) {
            throw new Error("Connection to Docker daemon has not been initialized.");
        }

        if ((await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME)) !== undefined) {
            // A database build is already in progress!
            throw new Error("A previous database build is still in progress.");
        }

        // Clear the database output folder since this one will be filled up again by rebuilding the database.
        await fs.rmdir(databaseFolder, { recursive: true });
        await mkdirp(databaseFolder);

        await new Promise<void>((resolve) => {
            DockerCommunicator.connection.run(
                "pverscha/unipept-custom-db:1.1.1",
                [],
                new ProgressInspectorStream(progressListener, () => resolve()),
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
                    Binds: [
                        // Mount the folder in which the MySQL-specific database files will be kept
                        `${databaseFolder}:/var/lib/mysql`,
                        // Mount the folder in which the reusable database index structure will be kept
                        `${indexFolder}:/data`
                    ]
                }
            );
        });

        // Now, stop this container
        const buildContainer = await this.getContainerByName(DockerCommunicator.BUILD_DB_CONTAINER_NAME);
        return new Promise<void>(
            resolve => DockerCommunicator.connection.getContainer(buildContainer!.Id).stop(resolve)
        );
    }

    public async startDatabase(databaseLocation: string): Promise<void> {
        await new Promise<void>((resolve) => {
            DockerCommunicator.connection.run(
                "pverscha/unipept-custom-db:1.1.1",
                [],
                new ProgressInspectorStream((step: string, progress: number) => {}, () => {}),
                {
                    Name: DockerCommunicator.BUILD_DB_CONTAINER_NAME,
                    PortBindings: {
                        "3306/tcp": [{
                            HostIP: "0.0.0.0",
                            HostPort: "3306"
                        }]
                    },
                    Binds: [
                        // Mount the folder in which the MySQL-specific database files will be kept
                        `${databaseLocation}:/var/lib/mysql`
                    ]
                }
            );
        });
    }

    /**
     * Start a Docker container that connects to a database on port 3306 of the host computer and exposes a Unipept
     * API service on port 3000 that can be connected to from this application.
     */
    public async startWebComponent(): Promise<void> {
        await new Promise<void>((resolve) => {
            DockerCommunicator.connection.run(
                "pverscha/unipept-web",
                [],
                new StringNotifierInspectorStream("Listening on", resolve),
                {
                    Name: DockerCommunicator.WEB_CONTAINER_NAME,
                    PortBindings: {
                        "3000/tcp": [{
                            HostIP: "0.0.0.0",
                            HostPort: "3000"
                        }]
                    }
                }
            )
        });
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
}
