import type { ProviderOptions, Token } from "./types.js";

type InstanceContainer = {
    instance: any;
    isDefault: boolean;
};

interface RegistryEntry<T> extends ProviderOptions<T> {
    provided?: boolean;
}

export class Keg {
    private static container: Keg;
    private registry = new Map<Token, RegistryEntry<any>[]>();
    private instances = new Map<Token, InstanceContainer[]>();

    static getInstance(): Keg {
        if (!Keg.container) {
            Keg.container = new Keg();
        }
        return Keg.container;
    }

    register<T>(provider: ProviderOptions<T>): void {
        for (const token of provider.tokens) {
            if (!this.registry.has(token)) {
                this.registry.set(token, []);
            }

            this.registry.get(token)!.push(provider);
        }
    }

    resolveMultiple<T>(token: string, mustResolve = false): T[] {
        if (
            this.instances.has(token) &&
            this.instances.get(token)!.length ===
                this.registry.get(token)!.length
        ) {
            return this.instances
                .get(token)!
                .map((instance) => instance.instance);
        }
        if (mustResolve) {
            throw new Error(`Not all providers for ${token} can be resolved`);
        }

        this.populateInstances(token);

        return this.resolveMultiple(token, true);
    }

    resolveOne<T>(token: string, mustResolve = false): T {
        if (
            this.instances.has(token) &&
            this.instances.get(token)!.length ===
                this.registry.get(token)!.length
        ) {
            if (this.instances.get(token)!.length === 1) {
                return this.instances.get(token)![0].instance;
            }

            const defaultInstance = this.instances
                .get(token)!
                .filter((instance) => instance.isDefault);

            if (defaultInstance.length > 1) {
                throw new Error(
                    `Multiple default instances found for ${token}`,
                );
            } else if (defaultInstance.length === 0) {
                throw new Error(`No default instances found for ${token}`);
            }

            return defaultInstance[0].instance;
        }
        if (mustResolve) {
            throw new Error(`Not all providers for ${token} can be resolved`);
        }

        this.populateInstances(token);

        return this.resolveOne(token, true);
    }

    private populateInstances<T>(token: string) {
        const providers = this.registry.get(token);

        if (!providers) {
            throw new Error(`No provider found for ${token}`);
        }

        for (const provider of providers) {
            if (provider.provided) {
                continue;
            }

            this.createInstance(provider);
        }
    }

    private createInstance<T>(provider: RegistryEntry<T>) {
        let instance: T;

        if (provider.useValue) {
            instance = provider.useValue;
        } else if (provider.useFactory) {
            const deps = (provider.deps || []).map((dep) => this.resolve(dep));
            instance = provider.useFactory(...deps);
        } else if (provider.useClass) {
            const deps = (provider.deps || []).map((dep) => this.resolve(dep));
            instance = new provider.useClass(...deps);
        } else {
            throw new Error(
                `Invalid provider configuration for ${provider.tokens.join(", ")}`,
            );
        }

        for (const token of provider.tokens) {
            if (!this.instances.has(token)) {
                this.instances.set(token, []);
            }

            this.instances
                .get(token)!
                .push({ instance, isDefault: provider.default || false });
        }

        provider.provided = true;
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
        this.instances.clear();
    }
}
