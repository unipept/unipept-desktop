export default interface ErrorListener {
    handleError(err: Error): void;
}
