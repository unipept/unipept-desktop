import Study from "@common/study/Study";

export default class Project {
    constructor(
        public readonly name: string,
        public readonly location: string,
        public readonly studies: Study[],
    ) {}
}
