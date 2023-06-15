import {Md5} from "./deps.ts"

export function __md5hash(data: string) {
    return (new Md5()).update(data).toString("hex")
}