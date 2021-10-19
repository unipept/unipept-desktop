import schema_v3 from "raw-loader!@/db/schemas/schema_v3.sql";

export default class Schema {
    public static LATEST_VERSION: number = 3;
    public static LATEST_SCHEMA: string = schema_v3;
}
