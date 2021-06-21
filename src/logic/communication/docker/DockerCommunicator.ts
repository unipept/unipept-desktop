import Dockerode, { DockerOptions } from "dockerode";


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
}
