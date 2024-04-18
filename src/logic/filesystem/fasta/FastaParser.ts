export default class FastaParser {
    /**
     * This function reads in a FASTA string and extracts all protein sequences from this string and returns them as an
     * array of strings.
     *
     * @param fasta
     */
    public extractProteinSequences(fasta: string): string[] {
        // Split the input string into lines
        const lines = fasta.trim().split("\n");

        // Initialize an empty array to hold the sequences
        const sequences: string[] = [];

        // Initialize an empty string to hold the current sequence
        let currentSequence = "";

        // Iterate over each line
        for (const line of lines) {
            // If the line starts with '>', it's a description line
            if (line.startsWith(">")) {
                // If there's a current sequence, add it to the sequences array
                if (currentSequence) {
                    sequences.push(currentSequence);
                }
                // Start a new sequence
                currentSequence = "";
            } else {
                // If the line doesn't start with '>', it's a sequence line, so add it to the current sequence
                currentSequence += line;
            }
        }

        // If there's a current sequence at the end, add it to the sequences array
        if (currentSequence) {
            sequences.push(currentSequence);
        }

        return sequences;
    }
}
