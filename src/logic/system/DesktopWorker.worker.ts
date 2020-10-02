import { createMessageEventListener, workerFunctionMap } from "unipept-web-components";
import {
    compute as computeCachedEcResponse
} from "@/logic/communication/functional/CachedEcResponseCommunicator.workerSource";
import {
    compute as computeCachedGoResponse
} from "@/logic/communication/functional/CachedGoResponseCommunicator.workerSource";
import {
    compute as computeCachedInterproResponse
} from "@/logic/communication/functional/CachedInterproResponseCommunicator.workerSource";
import {
    compute as computeCachedNcbiResponse
} from "@/logic/communication/taxonomic/ncbi/CachedNcbiResponseCommunicator.workerSource";
import {
    compute as readAssay
} from "@/logic/filesystem/assay/AssayFileSystemDataReader.workerSource";
import {
    compute as destroyAssay
} from "@/logic/filesystem/assay/AssayFileSystemDestroyer.workerSource";
import {
    readPept2Data,
    writePept2Data
} from "@/logic/filesystem/assay/processed/ProcessedAssayManager.workerSource";

workerFunctionMap.set("computeCachedEcResponses", computeCachedEcResponse);
workerFunctionMap.set("computeCachedGoResponses", computeCachedGoResponse);
workerFunctionMap.set("computeCachedInterproResponses", computeCachedInterproResponse);
workerFunctionMap.set("computeCachedNcbiResponses", computeCachedNcbiResponse);
workerFunctionMap.set("readAssay", readAssay);
workerFunctionMap.set("destroyAssay", destroyAssay);
workerFunctionMap.set("readPept2Data", readPept2Data);
workerFunctionMap.set("writePept2Data", writePept2Data);

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", createMessageEventListener(ctx));
