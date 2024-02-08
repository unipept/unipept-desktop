import Study from "@common/study/Study";

export default interface StudyManager {
    /**
     * Load all studies that are associated to this study manager. Typically something to identify these studies (such
     * as a project) is passed along the constructor of this class.
     */
    loadStudies(): Promise<Study[]>;

    /**
     * Write the given study object (that is associated with the given project) to disk.
     *
     * @param study
     */
    writeStudy(study: Study): Promise<void>;

    /**
     * Remove the given study object from the underlying storage system.
     *
     * @param study
     */
    removeStudy(study: Study): Promise<void>;
}
