export default class NetworkUtils {
    public static async getJSON(url: string): Promise<any> {
        const response = await fetch(url);
        return response.json();
    }
}
