import {
    type ClassMember,
    type Param,
    type TsExpressionWithTypeArguments,
    type TsParameterProperty,
    parse,
} from "@swc/core";
import type {
    BindingIdentifier,
    ClassDeclaration,
    Declaration,
    Decorator,
    FunctionDeclaration,
    Identifier,
    ModuleItem,
    Pattern,
    Program,
    TsArrayType,
    TsTypeAnnotation,
    TsTypeReference,
} from "@swc/core";
import chalk from "chalk";

export interface ParseResult {
    classes: ParsedClass[];
    functions: ParsedFunction[];
}

interface ParsedItem {
    type: string;
}

export interface ParsedService extends ParsedClass {
    decoratedType: "Service";
}

export interface ParsedController extends ParsedClass {
    decoratedType: "Controller";
}

export interface ParsedClass extends ParsedItem {
    type: "Class";
    decoratedType: string;
    name: string;
    decorators: ParsedDecorator[];
    constructors: ParsedConstructor[];
    implements: string[];
    methods: ParsedMethod[];
}

export interface ParsedFunction extends ParsedItem {
    type: "Function";
    name: string;
    decorators: ParsedDecorator[];
    returnType?: string;
    args: ParsedArgs[];
}

interface ParsedDecorator {
    name: string;
    args: string[];
}

interface ParsedConstructor {
    accessibility: string;
    args: ParsedArgs[];
}

interface ParsedMethod {
    isStatic: boolean;
    name: string;
    decorators: ParsedDecorator[];
    returnType?: string;
    args: ParsedArgs[];
}

export interface ParsedArgs {
    type: string;
    decorators: ParsedDecorator[];
}

export async function parseSource(code: string): Promise<ParseResult> {
    const ast: Program = await parse(code, {
        syntax: "typescript",
        tsx: false,
        decorators: true,
        target: "es2022",
    });

    const classes: ParsedClass[] = [];
    const functions: ParsedFunction[] = [];

    // Traverse through program body
    for (const item of ast.body) {
        const parsedItem = parseModuleItem(item);
        if (!parsedItem) {
            continue;
        }
        switch (parsedItem.type) {
            case "Class":
                classes.push(parsedItem);
                break;
            case "Function":
                functions.push(parsedItem);
                break;
        }
    }

    return { classes, functions };
}

function parseModuleItem(
    item: ModuleItem,
): ParsedClass | ParsedFunction | undefined {
    switch (item.type) {
        case "ExportDeclaration":
            return parseDeclaration(item.declaration);

        default:
            return undefined;
    }
}

function parseDeclaration(
    declaration: Declaration,
): ParsedClass | ParsedFunction | undefined {
    switch (declaration.type) {
        case "ClassDeclaration":
            return parseClass(declaration);
        default:
            return undefined;
    }
}

export function parseFunction(
    node: FunctionDeclaration,
): ParsedFunction | undefined {
    const decorators = extractDecorators(node.decorators || []);

    if (
        decorators.length === 0 ||
        decorators.filter((d) => d.name === "Provides").length === 0
    ) {
        return undefined;
    }

    return {
        type: "Function",
        decorators: decorators,
        name: node.identifier.value,
        returnType: extractTypeFromTypeAnnotation(node.returnType),
        args: extractArgs(node.params),
    };
}

export function parseClass(node: ClassDeclaration): ParsedClass | undefined {
    const decorators = extractDecorators(node.decorators || []);

    if (
        decorators.length === 0 ||
        decorators.filter(
            (d) =>
                d.name === "Service" ||
                d.name === "Component" ||
                d.name === "Provider",
        ).length === 0
    ) {
        return undefined;
    }

    let type: string | undefined = undefined;

    for (const decorator of decorators) {
        if (decorator.name === "Service") {
            if (type) {
                throw Error();
            }
            type = "Service";
        }
        if (decorator.name === "Controller") {
            if (type) {
                throw Error();
            }
            type = "Controller";
        }
        if (decorator.name === "Provider") {
            if (type) {
                throw Error();
            }
            type = "Provider";
        }
    }

    let methods: ParsedMethod[] = [];
    if (type === "Provider") {
        methods = extractMethods(node.body);
    }

    return {
        type: "Class",
        decoratedType: type!,
        decorators: decorators,
        name: node.identifier.value,
        methods: methods,
        implements: extractImplements(node.implements),
        constructors: extractConstructor(node.body),
    };
}

function extractImplements(
    implementedInterfaces: TsExpressionWithTypeArguments[],
): string[] {
    const implemented: string[] = [];

    for (const imp of implementedInterfaces) {
        if (imp.expression.type === "Identifier") {
            implemented.push(imp.expression.value);
        }
    }

    return implemented;
}

function extractConstructor(body: ClassMember[]): ParsedConstructor[] {
    const constructors: ParsedConstructor[] = [];

    for (const member of body) {
        if (member.type === "Constructor") {
            constructors.push({
                accessibility: member.accessibility || "public",
                args: extractArgs(member.params),
            });
        }
    }

    return constructors;
}

function extractTypeFromTypeReference(typeReference: TsTypeReference): string {
    switch (typeReference.typeName.type) {
        case "Identifier":
            return getTypeValueFromIdentifier(typeReference.typeName);
        case "TsQualifiedName":
            throw Error();
    }
}

function getTypeValueFromIdentifier(identifier: Identifier): string {
    return identifier.value;
}

function extractTypeFromArrayType(arrayType: TsArrayType): string {
    switch (arrayType.elemType.type) {
        case "TsTypeReference":
            return extractTypeFromTypeReference(arrayType.elemType) + "[]";
        default:
            throw Error();
    }
}

function extractTypeFromTypeAnnotation(
    annotation: TsTypeAnnotation | undefined,
): string | undefined {
    if (annotation) {
        switch (annotation.typeAnnotation.type) {
            case "TsTypeReference":
                return extractTypeFromTypeReference(annotation.typeAnnotation);
            case "TsArrayType":
                return extractTypeFromArrayType(annotation.typeAnnotation);
            default:
                console.warn(chalk.yellow(`Unknown type annotation type ${annotation.typeAnnotation.type} . `));
                return undefined;
        }
    }
    return undefined;
}

function extractTypeFromPattern(pattern: Pattern): string | undefined {
    switch (pattern.type) {
        case "Identifier":
            if (isBindingIdentifier(pattern)) {
                return extractTypeFromTypeAnnotation(pattern.typeAnnotation);
            }
        default:
            throw Error();
    }
}

function isBindingIdentifier(
    identifier: Identifier | BindingIdentifier,
): identifier is BindingIdentifier {
    return "typeAnnotation" in identifier;
}

function extractArgs(params: (TsParameterProperty | Param)[]): ParsedArgs[] {
    const args: ParsedArgs[] = [];

    for (const param of params) {
        let extractedType: string | undefined;
        switch (param.type) {
            case "Parameter":
                extractedType = extractTypeFromPattern(param.pat);
                if (extractedType) {
                    args.push({
                        type: extractedType,
                        decorators: extractDecorators(param.decorators || []),
                    });
                }
                break;
            case "TsParameterProperty":
                extractedType = extractTypeFromTypeAnnotation(
                    param.param.typeAnnotation,
                );
                if (extractedType) {
                    args.push({
                        type: extractedType,
                        decorators: extractDecorators(param.decorators || []),
                    });
                }
                break;
            default:
                throw Error();
        }
    }

    return args;
}

function extractDecorators(decorators: Decorator[]): ParsedDecorator[] {
    return decorators.map((d) => {
        if (d.expression.type === "CallExpression") {
            return {
                name: (d.expression.callee as any).value,
                args: d.expression.arguments.map(
                    (arg) => (arg.expression as any).value,
                ),
            };
        }
        return {
            name: (d.expression as any).value,
            args: [],
        };
    });
}

function extractMethods(body: ClassMember[]): ParsedMethod[] {
    const methods: ParsedMethod[] = [];

    for (const member of body) {
        if (member.type === "ClassMethod") {
            if (member.key.type === "Identifier") {
                methods.push({
                    args: extractArgs(member.function.params),
                    returnType: extractTypeFromTypeAnnotation(
                        member.function.returnType,
                    ),
                    isStatic: member.isStatic,
                    name: member.key.value,
                    decorators: extractDecorators(
                        member.function.decorators || [],
                    ),
                });
            }
        }
    }

    return methods;
}

// Usage example
async function parseCode() {
    const source = `
    export class Nothing {}
    
    @Qualifier('UserController1')
    @Controller('/users')
    export class UserController {
      @Get('/:id')
      async getUser(c: Context) {
        return c.json({ id: c.req.param('id') });
      }
    }
    
    @Service
    class UserService implements IUserService {
        constructor(private userRepository: UserRepository) {}
    }

    @Provider()
    export class RedisConfiguration {

    static provideRedisConfig(): RedisConfig {
        return {};
    }
}
  `;

    const parsed = await parseSource(source);
    console.log(JSON.stringify(parsed));
}
