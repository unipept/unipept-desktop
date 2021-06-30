import Dockerode, { DockerOptions } from "dockerode";
import { NcbiId, ProgressListener } from "unipept-web-components";
import ProgressInspectorStream from "@/logic/communication/docker/ProgressInspectorStream";


export default class DockerCommunicator {
    public static readonly UNIX_DEFAULT_SETTINGS = JSON.stringify({ socketPath: "/var/run/docker.sock" });
    public static readonly WINDOWS_DEFAULT_SETTINGS = JSON.stringify({
        protocol: "tcp",
        host: "127.0.0.1",
        port: 2376
    });

    public static connection: Dockerode;

    public static initializeConnection(config: DockerOptions) {
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
     * Starts a new Docker container and begins by building the database with the given settings.
     *
     * @param databaseSources A list of URLs that should be downloaded and processed (UniProt-compatible xml.gz files).
     * @param databaseTypes The database types that correspond to the sources given in the first argument.
     * @param taxa A list of taxa ID's by which we should filter (these taxa, as well as their children in the lineage
     * tree will be included in the file).
     * @param databaseFolder Folder in which the database under construction should be stored. This folder should be
     * empty.
     * @param indexFolder Folder in which the constructed database index structure should be kept.
     * @param progressListener A callback function that can be used to
     */
    public async buildDatabase(
        databaseSources: string[],
        databaseTypes: string[],
        taxa: NcbiId[],
        databaseFolder: string,
        indexFolder: string,
        progressListener: (step: string, progress: number) => void
    ): Promise<void> {
        if (!DockerCommunicator.connection) {
            throw new Error("Connection to Docker daemon has not been initialized.");
        }

        DockerCommunicator.connection.run(
            "pverscha/unipept-custom-db:1.1.1",
            [],
            new ProgressInspectorStream(progressListener),
            {
                Env: [
                    "MYSQL_ROOT_PASSWORD=unipept",
                    "MYSQL_DATABASE=unipept",
                    "MYSQL_USER=unipept",
                    "MYSQL_PASSWORD=unipept",
                    `DB_TYPES=${databaseTypes.join(",")}`,
                    `DB_SOURCES=${databaseSources.join(",")}`,
                    `FILTER_TAXA=${taxa.join(",")}`
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
    }
}
