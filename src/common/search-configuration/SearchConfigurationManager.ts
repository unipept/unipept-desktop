import SearchConfiguration from "@common/search-configuration/SearchConfiguration";

export default interface SearchConfigurationManager {
    loadSearchConfiguration(id: number): Promise<SearchConfiguration | undefined>;
}

