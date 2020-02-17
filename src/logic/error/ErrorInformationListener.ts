import ErrorInformation from "@/logic/error/ErrorInformation";

export default interface ErrorInformationListener {
    handleErrorInformation(information: ErrorInformation): Promise<void>;
}
