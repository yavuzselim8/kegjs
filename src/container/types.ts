// Provider options
export interface ProviderOptions<T> {
    tokens: string[];
    useClass?: Constructor<T>;
    useValue?: T;
    useFactory?: (...args: any[]) => T;
    deps?: string[];
    default?: boolean;
    transient?: boolean;
}

export type Constructor<T = any> = new (...args: any[]) => T;

export type Token<T = any> = string | symbol | Constructor;

export type Provider<T> = Constructor<T> | ProviderOptions<T>;
