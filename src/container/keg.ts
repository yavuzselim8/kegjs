import type { Constructor, ProviderOptions, Token} from "./types.js";


class RegistryEntry<T> implements ProviderOptions<T> {
    tokens: string[];
    useClass?: Constructor<T> | undefined;
    useValue?: T | undefined;
    useFactory?: ((...args: any[]) => T) | undefined;
    deps?: string[] | undefined;
    default?: boolean | undefined;
    instance?: T;
    transient?: boolean;

    constructor(provider: ProviderOptions<T>) {
        this.tokens = provider.tokens;
        this.useClass = provider.useClass;
        this.useValue = provider.useValue;
        this.useFactory = provider.useFactory;
        this.deps = provider.deps;
        this.default = provider.default;
        this.transient = provider.transient;
    }
}

interface TokenRegistry<T> {
    entries: RegistryEntry<T>[];
    default?: RegistryEntry<T>
}

export class Keg {
    protected static container?: Keg = undefined;
    protected registry = new Map<Token, TokenRegistry<any>>();

    static getInstance(): Keg {
        if (!Keg.container) {
            Keg.container = new Keg();
        }
        return Keg.container;
    }

    register<T>(provider: ProviderOptions<T>): void {
        const registryEntry = new RegistryEntry(provider);
        console.log("Registering provider");
        console.log(registryEntry)
        for (const token of provider.tokens) {
            if (!this.registry.has(token)) {
                this.registry.set(token, { entries: [] });
            }

            const tokenRegistry = this.registry.get(token)!;

            tokenRegistry.entries.push(registryEntry);

            if (provider.default) {
                if (tokenRegistry.default) {
                    throw new Error(
                        `Multiple default providers registered for ${token}`,
                    );
                }
                tokenRegistry.default = registryEntry;
            }
            console.log(this.registry.get(token))
        }
    }

    resolveMultiple<T>(token: string, mustResolve = false): T[] {
        if (this.registry.has(token)) {
            return this.registry
                .get(token)!
                .entries
                .map((registryEntry) => this.getRegistryEntryInstance(registryEntry));
        }

        throw new Error(`No provider found for ${token}`)
    }

    resolveOne<T>(token: string): T {
        console.log("Resolving")
        for(const key of this.registry.keys()){
            console.log(key);
        }
        if (!this.registry.has(token)) {
            throw new Error(`No provider found for ${token}`);
        }
        const tokenRegistry = this.registry.get(token)!;

        if (tokenRegistry.default) {
            return this.getRegistryEntryInstance(tokenRegistry.default);
        }

        if (tokenRegistry.entries.length > 1) {
            throw new Error(
                `Multiple providers registered for ${token} without a default`,
            );
        }

        return this.getRegistryEntryInstance(tokenRegistry.entries[0]);
    }

    protected getRegistryEntryInstance<T>(registryEntry: RegistryEntry<T>): T {
        if (registryEntry.instance) {
            return registryEntry.instance;
        }

        return this.createRegistryEntryInstance(registryEntry);
    }

    protected createRegistryEntryInstance<T>(registryEntry: RegistryEntry<T>): T {
        let instance: T;

        if (registryEntry.useValue) {
            instance = registryEntry.useValue;
        } else if (registryEntry.useFactory) {
            const deps = (registryEntry.deps || []).map((dep) => this.resolve(dep));
            instance = registryEntry.useFactory(...deps);
        } else if (registryEntry.useClass) {
            const deps = (registryEntry.deps || []).map((dep) => this.resolve(dep));
            instance = new registryEntry.useClass(...deps);
        } else {
            throw new Error(
                `Invalid provider configuration for ${registryEntry.tokens.join(", ")}`,
            );
        }

        this.cacheInstance(registryEntry, instance);

        return instance;
    }

    protected cacheInstance<T>(registryEntry: RegistryEntry<T>, instance: T): void {
        if (!registryEntry.transient) {
            registryEntry.instance = instance;
        }
    }

    resolve<T>(token: string): T | T[] {
        const isArray = token.endsWith("[]");

        if (isArray) {
            token = token.slice(0, -2);

            return this.resolveMultiple(token);
        }

        return this.resolveOne(token);
    }

    clearRegistry() {
        this.registry.clear();
    }
}

export class TestKeg extends Keg {

    protected cacheInstance<T>(registryEntry: RegistryEntry<T>, instance: T) {
        return;
    }
}
