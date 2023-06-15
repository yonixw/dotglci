import { getENV } from "../api/export.ts"

// API version (v4) can be found in the /admin page
export const API_URL = getENV("API_URL", "http://dotgitlabci:80/api/v4")
export const API_TOKEN = getENV("API_TOKEN", "token-string-ABYZ000")

export const PROJ_NAME = getENV("DOTGLCI_PROJ_NAME", "local-gitlab-ci")
export const PROJ_URL = getENV("PROJ_URL", "root/" + PROJ_NAME)

export const DOTGL_CLI_PATH = getENV("DOTGL_CLI_PATH", "/workspace/.dotglci.yml")

export function logx (txt: string, prefix="***") {
    console.log(`[${prefix}] [${(new Date()).toISOString()}] ${txt}`)
}


export function jsonPrint(_txt:any){
    try {
        console.log(JSON.stringify(JSON.parse(_txt), null, 4))
    } catch (error) {
        console.log(_txt)
    }
}

