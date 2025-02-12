import path from "node:path";
import { CodeGenerator } from "./codeGenerator";
import { FileScanner } from "./fileScanner";
import { type ParseResult, parseSource } from "./parser";

interface GeneratorConfig {
    srcDir: string;
    outDir: string;
}

export class ProjectCodeGenerator {
    private fileScanner: FileScanner;
    private codeGenerator: CodeGenerator;
    private parseResult: Map<string, ParseResult> = new Map();

    constructor(private config: GeneratorConfig) {
        this.fileScanner = new FileScanner({
            srcDir: path.resolve(process.cwd(), config.srcDir),
        });

        this.codeGenerator = new CodeGenerator();
    }

    async generate(): Promise<void> {
        // Scan all source files
        const sourceFiles = await this.fileScanner.scanFiles();

        // Parse all files
        await this.parseAllFiles(sourceFiles);

        // Generate DI container
        await this.generateContainer();

        this.validateContainer();
    }

    validateContainer() {
        const classes = this.parseResult
            .values()
            .flatMap((r) => r.classes)
            .toArray();

        const tokenToClassMap = new Map<
            string,
            { default: boolean; type: Set<string> }[]
        >();
        for (const cls of classes) {
            if (cls.decoratedType === "Provider") {
                for (const method of cls.methods) {
                    if (!method.returnType) {
                        continue;
                    }
                    if (!method.isStatic) {
                        continue;
                    }

                    const tokens = [
                        method.returnType,
                        ...method.decorators
                            .filter((d) => d.name === "Qualifier")
                            .flatMap((d) => d.args),
                    ];
                    for (const token of tokens) {
                        if (tokenToClassMap.has(token)) {
                            tokenToClassMap.get(token)?.push({
                                default:
                                    method.decorators.filter(
                                        (d) => d.name === "Default",
                                    ).length > 0,
                                type: new Set([method.returnType]),
                            });
                        } else {
                            tokenToClassMap.set(token, [
                                {
                                    default:
                                        method.decorators.filter(
                                            (d) => d.name === "Default",
                                        ).length > 0,
                                    type: new Set([method.returnType]),
                                },
                            ]);
                        }
                    }
                }
            } else {
                const tokens = [
                    cls.name,
                    ...cls.implements,
                    ...cls.decorators
                        .filter((d) => d.name === "Qualifier")
                        .flatMap((d) => d.args),
                ];
                for (const token of tokens) {
                    if (tokenToClassMap.has(token)) {
                        tokenToClassMap.get(token)?.push({
                            default:
                                cls.decorators.filter(
                                    (d) => d.name === "Default",
                                ).length > 0,
                            type: new Set([cls.name, ...cls.implements]),
                        });
                    } else {
                        tokenToClassMap.set(token, [
                            {
                                default:
                                    cls.decorators.filter(
                                        (d) => d.name === "Default",
                                    ).length > 0,
                                type: new Set([cls.name, ...cls.implements]),
                            },
                        ]);
                    }
                }
            }
        }

        for (const [token, instances] of tokenToClassMap) {
            const defaultInstances = instances.filter((d) => d.default);

            if (defaultInstances.length > 1) {
                throw new Error(
                    `Multiple default instances found for ${token}`,
                );
            } else if (instances.length > 1 && defaultInstances.length === 0) {
                throw new Error(
                    `No default instances found for ${token}. It has ${instances.length} instances`,
                );
            }
        }

        for (const cls of classes) {
            if (cls.decoratedType === "Provider") {
                for (const method of cls.methods) {
                    if (!method.returnType) {
                        continue;
                    }
                    if (!method.isStatic) {
                        continue;
                    }

                    const dependencies = this.codeGenerator.getDependencies(
                        method.args || [],
                    );

                    for (const dep of dependencies) {
                        const depType = dep.type.endsWith("[]")
                            ? dep.type.slice(0, -2)
                            : dep.type;
                        const depQualifier = dep.qualifier;

                        if (!tokenToClassMap.has(depQualifier)) {
                            throw new Error(
                                `Dependency ${depType} not found for class ${cls.name} method ${method.name}`,
                            );
                        }

                        tokenToClassMap
                            .get(depQualifier)!
                            .forEach((instance) => {
                                if (!instance.type.has(depType)) {
                                    throw new Error(
                                        `Type mismatch for class ${cls.name} method ${method.name} dependency with Qualifier ${depQualifier}. Found types: ${Array.from(instance.type)} Expected Type: ${depType}`,
                                    );
                                }
                            });
                    }
                }
            } else {
                const dependencies = this.codeGenerator.getDependencies(
                    cls.constructors[0]?.args || [],
                );

                for (const dep of dependencies) {
                    const depType = dep.type.endsWith("[]")
                        ? dep.type.slice(0, -2)
                        : dep.type;
                    const depQualifier = dep.qualifier;

                    if (!tokenToClassMap.has(depType)) {
                        throw new Error(
                            `Dependency ${depType} not found for class ${cls.name}`,
                        );
                    }

                    tokenToClassMap.get(depQualifier)!.forEach((instance) => {
                        if (!instance.type.has(depType)) {
                            throw new Error(
                                `Type mismatch for class ${cls.name} dependency with Qualifier ${depQualifier}. Found types: ${instance.type} Expected Type: ${depType}`,
                            );
                        }
                    });
                }
            }
        }
    }

    async generateContainer(): Promise<void> {
        const containerPath = path.join(
            path.resolve(process.cwd(), this.config.outDir),
            "container.generated.ts",
        );
        const containerContent = await this.codeGenerator.generateContainerCode(
            this.parseResult,
            this.config.outDir,
        );

        await Bun.write(containerPath, containerContent);
    }

    private async parseAllFiles(
        sourceFiles: Map<string, string>,
    ): Promise<void> {
        for (const [filePath, content] of sourceFiles) {
            try {
                const parseResult = await parseSource(content);
                if (
                    parseResult.classes.length > 0 ||
                    parseResult.functions.length > 0
                ) {
                    this.parseResult.set(filePath, parseResult);
                }
            } catch (error) {
                console.error(`Error parsing file ${filePath}:`, error);
            }
        }
    }
}
