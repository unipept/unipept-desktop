import Dockerode, { DockerOptions } from "dockerode";
import { NcbiId } from "unipept-web-components";


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
     *
     */
    public async buildDatabase(
        databaseSources: string[],
        databaseTypes: string[],
        taxa: NcbiId[],
        destinationFolder: string
    ): Promise<void> {

    }
}
