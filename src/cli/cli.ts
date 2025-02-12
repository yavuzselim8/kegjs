#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { ProjectCodeGenerator } from "../codegen/projectCodeGenerator.js";
import { loadConfig } from "./config.js";
import type { Runtime } from "../utils/io.js";


const program = new Command();

program.name("kegjs").description("Kegjs CLI for filling container automatically").version("1.0.0");

function getRuntime(): Runtime{
    if (typeof Bun !== 'undefined' || process.versions?.bun) {
        return 'Bun';
    }
    if (typeof process !== 'undefined' && process.versions?.node) {
        return 'Node.js';
    }
    return 'Unknown';
}

console.log(chalk.green(`Running on ${getRuntime()}`));

program
    .command("generate")
    .description("Generates container code")
    .argument("[strict]", "validate", true)
    .action(async (strict) => {
        const start = Date.now();

        const config = await loadConfig();
        console.log("Generating code with config", config);
        const generator = new ProjectCodeGenerator({ ...config, runtime: getRuntime() });
        await generator.generate();

        const end = Date.now();
        console.log(chalk.green(`Generated container in ${end - start}ms`));
    });

program.parse();
