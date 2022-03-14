export default class BufferUtils {
    public static bufferToSharedArrayBuffer(buf: Buffer): SharedArrayBuffer {
        const ab = new SharedArrayBuffer(buf.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }

    public static arrayBufferToBuffer(buffer: ArrayBuffer): Buffer {
        return Buffer.from(buffer);
    }
}
