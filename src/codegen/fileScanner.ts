import { glob } from "glob";
import { readFileAsText, type Runtime } from "../utils/io.js";

interface ScanOptions {
    srcDir: string;
    runtime: Runtime;
    pattern: string | string[];
    ignore: string[];
}

interface FileScannerOptions {
    srcDir: string;
    runtime: Runtime;
    pattern?: string | string[];
    ignore?: string[];
}

export class FileScanner {
    options: ScanOptions;

    constructor(options: FileScannerOptions) {
        this.options = {
            pattern: ["**/*.ts", "**/*.js"],
            ignore: [
                "**/*.spec.ts",
                "**/*.test.ts",
                "**/node_modules/**",
                "**/generated/**",
            ],
            ...options,
        };
    }

    async scanFiles(): Promise<Map<string, string>> {
        const files = await glob(this.options.pattern, {
            cwd: this.options.srcDir,
            ignore: this.options.ignore,
            absolute: true,
        });

        const sourceFiles = new Map<string, string>();

        for (const file of files) {
            const content = await readFileAsText(file, this.options.runtime);
            sourceFiles.set(file, content);
        }

        return sourceFiles;
    }
}
