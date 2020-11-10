import schema_v1 from "raw-loader!@/db/schemas/schema_v1.sql";

export default class Schema {
    public static LATEST_VERSION: number = 1;
    public static LATEST_SCHEMA: string = schema_v1;
}
