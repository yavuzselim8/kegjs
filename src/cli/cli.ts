#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { ProjectCodeGenerator } from "../codegen/projectCodeGenerator";
import { loadConfig } from "./config";


const program = new Command();

program.name("kegjs").description("Kegjs CLI for filling container automatically").version("1.0.0");

function getRuntime() {
    if (typeof Bun !== 'undefined' || process.versions?.bun) {
        return 'Bun';
    }
    if (typeof process !== 'undefined' && process.versions?.node) {
        return 'Node.js';
    }
    return 'Unknown';
}

program
    .command("generate")
    .description("Generates container code")
    .argument("[strict]", "validate", true)
    .action(async (strict) => {
        const config = await loadConfig();

        const generator = new ProjectCodeGenerator(config)
        await generator.generate();
    });

program.parse();
