export function __env(name:string, fallback?:any) {
    return Deno.env.get(name) || fallback;
}