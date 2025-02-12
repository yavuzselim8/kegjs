import { cosmiconfig } from "cosmiconfig";

export interface KegConfig {
    // Your config interface
    srcDir?: string;
    outDir?: string;
    strict?: boolean;
}

interface Config {
    srcDir: string;
    outDir: string;
    strict: boolean;
}

export async function loadConfig(): Promise<Config> {
    const explorer = cosmiconfig("kegcli");
    const result = await explorer.search();

    return {
        srcDir: "./src",
        outDir: "./src/generated",
        strict: true,
        ...result?.config,
    };
}
