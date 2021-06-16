import schema_v2 from "raw-loader!@/db/schemas/schema_v2.sql";

export default class Schema {
    public static LATEST_VERSION: number = 2;
    public static LATEST_SCHEMA: string = schema_v2;
}
