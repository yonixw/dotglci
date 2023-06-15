export function __env(name:string, fallback?:any) {
    return Deno.env.get(name) || fallback;
}

export function __argv()  {
    return Deno.args
}