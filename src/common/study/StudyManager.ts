import Study from "@common/study/Study";
import DatabaseManager from "@main/database/DatabaseManager";

export default interface StudyManager {
    /**
     * Load a study from the given directory. The study's name is assumed to be the name of the directory. If the given
     * directory is empty, a new study will be created.
     *
     * @param directory The directory that contains all assays and required metadata for this study.
     * @param dbManager A database manager connected to the project that this study belongs to and that can be used for
     * retrieving / updating this study's metadata.
     */
    loadStudy(
        directory: string,
        dbManager: DatabaseManager
    ): Promise<Study>;
}
