import Study from "@common/study/Study";

export default class Project {
    private studies: Study[];

    /**
     * A project is the global entity that keeps track of all the studies and assays that belong together.
     *
     * @param name Name of the project. This can be used by the user to distinguish between different projects and their
     * unique properties
     * @param location Value used to identify where this project can be retrieved from. In most cases this is a
     * directory somewhere on the local system, but it does not need to be.
     */
    constructor(
        public readonly name: string,
        public readonly location: string,
    ) {
        this.studies = [];
    }

    public addStudy(study: Study) {
        this.studies.push(study);
    }

    public getStudies(): Study[] {
        return this.studies;
    }

    public removeStudy(study: Study) {
        const idx = this.studies.findIndex((val: Study) => val.getId() === study.getId());
        if (idx !== -1) {
            this.studies.splice(idx, 1);
        }
    }
}
