import {dotenv}  from "./deps.ts"

export function __loadEnvObject(options?: {
    export? : boolean,
    envPath? : string,
    allowEmptyValues? : boolean
}) : Promise<Record<string, string>> {
    return dotenv.load(options)
}

export function __writeToFile(path:string, data:string, options?: {append: boolean}) {
    return Deno.writeTextFile(
        path, data, options
    );
}

export function __readFromFile(path:string, options?: {}) {
    return Deno.readTextFile(
        path, options
    );
}

