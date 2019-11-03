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
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return pattern.test(x) || "An invalid URL is provided.";
    }
}
