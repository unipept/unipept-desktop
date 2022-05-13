import { AnalysisSource, OnlineAnalysisSource, ProteomicsAssay } from "unipept-web-components";
import ConfigurationManager from "@/logic/configuration/ConfigurationManager";
import CustomDatabaseManager from "@/logic/filesystem/docker/CustomDatabaseManager";
import CustomDatabase from "@/logic/custom_database/CustomDatabase";
import CachedCustomDbAnalysisSource from "@/logic/communication/analysis/CachedCustomDbAnalysisSource";
import CachedOnlineAnalysisSource from "@/logic/communication/analysis/CachedOnlineAnalysisSource";
import DatabaseManager from "@/logic/filesystem/database/DatabaseManager";
import { serialize } from "v8";

export default class AnalysisSourceSerializer {
    public static serializeAnalysisSource(source: AnalysisSource): string {
        if (source instanceof CachedOnlineAnalysisSource || source instanceof OnlineAnalysisSource) {
            return source.getCommunicationSource().getPept2DataCommunicator().serviceUrl;
        } else if (source instanceof CachedCustomDbAnalysisSource) {
            return `cdb://${source.customDatabase.name}`;
        }
    }

    public static async deserializeAnalysisSource(
        serializedSource: string,
        assay: ProteomicsAssay,
        dbManager: DatabaseManager,
        projectLocation: string
    ): Promise<AnalysisSource> {
        let analysisSource: AnalysisSource;
        if (serializedSource.startsWith("cdb://")) {
            console.log("serializedSource ==> " + serializedSource);
            const dbName = serializedSource.replace("cdb://", "");

            const configMng = new ConfigurationManager();
            const customDbLocation: string = (await configMng.readConfiguration()).customDbStorageLocation;

            const customDbManager = new CustomDatabaseManager();
            const customDb = (await customDbManager.listAllDatabases(customDbLocation)).filter(
                (db: CustomDatabase) => db.name === dbName
            )[0];

            console.log("Custom db here:");
            console.log(await customDbManager.listAllDatabases(customDbLocation));

            analysisSource = new CachedCustomDbAnalysisSource(
                assay,
                dbManager,
                customDb,
                customDbLocation,
                projectLocation
            );
        } else {
            analysisSource = new CachedOnlineAnalysisSource(
                serializedSource,
                assay,
                dbManager,
                projectLocation
            );
        }

        return analysisSource;
    }
}
