import path from "node:path";
import { eta } from "./eta";
import type { ParseResult, ParsedArgs } from "./parser";

export class CodeGenerator {
    getDependencies(args: ParsedArgs[]): { qualifier: string; type: string }[] {
        return args.map((arg) => {
            const qualifierDecorator = arg.decorators.find(
                (d) => d.name === "Qualifier",
            );
            if (qualifierDecorator) {
                return {
                    qualifier: qualifierDecorator.args[0],
                    type: arg.type,
                };
            }

            return {
                qualifier: arg.type,
                type: arg.type,
            };
        });
    }

    async generateContainerCode(
        filesWithClasses: Map<string, ParseResult>,
        outDir: string,
    ): Promise<string> {
        const data: {
            imports: { name: string; path: string }[];
            registers: {
                tokens: string;
                name: string;
                deps: string;
                type: "Class" | "Factory";
                default: boolean;
            }[];
        } = {
            imports: [],
            registers: [],
        };

        for (const [filePath, parseResult] of filesWithClasses) {
            for (const parsedClass of parseResult.classes) {
                data.imports.push({
                    name: parsedClass.name,
                    path: path.relative(outDir, filePath),
                });

                if (parsedClass.decoratedType === "Provider") {
                    for (const method of parsedClass.methods) {
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
                        ]
                            .map((token) => `'${token}'`)
                            .join(", ");

                        const deps = this.getDependencies(method.args);

                        const depsString = deps
                            .map((dep) => `'${dep.qualifier}'`)
                            .join(", ");

                        data.registers.push({
                            default:
                                method.decorators.filter(
                                    (d) => d.name === "Default",
                                ).length > 0,
                            tokens,
                            type: "Factory",
                            name: `${parsedClass.name}.${method.name}`,
                            deps: depsString,
                        });
                    }
                } else {
                    const tokens = [
                        parsedClass.name,
                        ...parsedClass.implements,
                        ...parsedClass.decorators
                            .filter((d) => d.name === "Qualifier")
                            .flatMap((d) => d.args),
                    ]
                        .map((token) => `'${token}'`)
                        .join(", ");

                    const deps = this.getDependencies(
                        parsedClass.constructors[0]?.args || [],
                    );
                    const depsString = deps
                        .map((dep) => `'${dep.qualifier}'`)
                        .join(", ");

                    data.registers.push({
                        default:
                            parsedClass.decorators.filter(
                                (d) => d.name === "Default",
                            ).length > 0,
                        tokens,
                        type:
                            parsedClass.decoratedType === "Provider"
                                ? "Factory"
                                : "Class",
                        name: parsedClass.name,
                        deps: depsString,
                    });
                }
            }
        }

        const result = await eta.renderAsync("container.eta", data);

        return result;
    }
}
