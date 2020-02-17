import ErrorInformationListener from "@/logic/error/ErrorInformationListener";
import ErrorInformation from "@/logic/error/ErrorInformation";

export default abstract class ErrorInformationPublisher {
    private readonly errorListeners: ErrorInformationListener[] = [];

    public subscribeToErrors(listener: ErrorInformationListener) {
        this.errorListeners.push(listener);
    }

    protected async publishErrorInformation(errors: ErrorInformation[]) {
        if (errors && errors.length > 0) {
            for (const error of errors) {
                for (const listener of this.errorListeners) {
                    await listener.handleErrorInformation(error);
                }
            }
        }
    }
}
