export function Qualifier(..._: string[]) {
    return (target: any, ..._: any[]) => target;
}
