/**
 * This class contains some common rules that can be used for validation of form inputs.
 */
export default class Rules {
    /**
     * The field cannot be empty. This means that the string-contents of the field must contain at least one
     * character.
     */
    public static required: (x: string) => boolean | string = (x: string) => {
        return !!x || "A value should be provided";
    }

    /**
     * The field content must be longer than a predefinied value.
     *
     * @param length The minimum length of the field's content.
     */
    public static minLength(length: number): (x: string) => boolean | string {
        return (x: string) => {
            return x.length >= length || "Minimum " + length + " characters are required.";
        }
    }

    /**
     * The field content must be a valid URL.
     */
    public static url: (x: string) => boolean | string = (x:string) => {
        const pattern = new RegExp("^(https?:\\/\\/)?"+ // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|"+ // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))"+ // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*"+ // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?"+ // query string
            "(\\#[-a-z\\d_]*)?$","i"); // fragment locator
        return pattern.test(x) || "An invalid URL is provided.";
    }

    /**
     * Is the provided string a valid JSON object?
     * @param x
     */
    public static json: (x: string) => boolean | string = (x: string) => {
        try {
            JSON.parse(x);
            return true;
        } catch (e) {
            return "The provided value is not a valid JSON object.";
        }
    }

    public static integer: (x: string) => boolean | string = (x: string) => {
        return Number.isInteger(Number.parseFloat(x)) || "Provided value is not a valid integer.";
    }

    public static gtZero: (x: string) => boolean | string = (x: string) => {
        return Number.parseInt(x) > 0 || "Provided value must be larger than zero.";
    }

    public static lteTen: (x: string) => boolean | string = (x: string) => {
        return Number.parseInt(x) <= 10 || "Provided value must be 10 or smaller.";
    }
}
