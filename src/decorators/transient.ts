export function Transient() {
    return (target: any, ..._: any[]) => target;
}
