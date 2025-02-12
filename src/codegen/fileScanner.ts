import { glob } from "glob";

interface ScanOptions {
    srcDir: string;
    pattern: string | string[];
    ignore: string[];
}

interface FileScannerOptions {
    srcDir: string;
    pattern?: string | string[];
    ignore?: string[];
}

export class FileScanner {
    options: ScanOptions

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
        }
    }

    async scanFiles(): Promise<Map<string, string>> {
        const files = await glob(this.options.pattern, {
            cwd: this.options.srcDir,
            ignore: this.options.ignore,
            absolute: true,
        });

        const sourceFiles = new Map<string, string>();

        for (const file of files) {
            const content = await Bun.file(file).text();
            sourceFiles.set(file, content);
        }

        return sourceFiles;
    }
}
