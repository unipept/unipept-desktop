import * as stream from "stream";

/**
 * This is a special kind of stream that inspects a stream of data that passes through it and invokes a callback
 * everytime a specific text is observed.
 *
 * @author Pieter Verschaffelt
 */
export default class StringNotifierInspectorStream extends stream.Writable {
    /**
     * @param textToObserve Everytime this text is observed the callback provided to the argument "listener" will be
     * invoked.
     * @param listener This function will be invoked everytime the given text has been observed.
     */
    constructor(
        private readonly textToObserve: RegExp,
        private readonly listener: () => void
    ) {
        super();
    }

    _write(chunk: any, enc: string, callback: any) {
        const textOccurrences = (chunk.toString().match(this.textToObserve) || []).length;

        for (let i = 0; i < textOccurrences; i++) {
            this.listener();
        }

        callback();
    }
}
