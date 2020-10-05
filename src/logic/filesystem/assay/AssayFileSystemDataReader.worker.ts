import { Peptide } from "unipept-web-components/src/business/ontology/raw/Peptide";

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", (message: MessageEvent) => {
    ctx.postMessage(compute(message.data));

    try {
        // This is unfortunately required to get the workers to stop consuming 100% CPU once they're done
        // processing...
        if (global && global.gc) {
            global.gc();
        }
    } catch (err) {
        // GC is not available.
    }
});

export function compute(peptidesString: string): Peptide[] {
    const output = [];
    let terminatorPos = peptidesString.indexOf("\n");
    let previousTerminatorPos = 0;
    while (terminatorPos !== -1) {
        output.push(peptidesString.substring(previousTerminatorPos, terminatorPos).trimEnd());
        previousTerminatorPos = terminatorPos + 1;
        terminatorPos = peptidesString.indexOf("\n", previousTerminatorPos);
    }
    return output;
}
