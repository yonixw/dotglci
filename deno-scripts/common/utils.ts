
// API version (v4) can be found in the /admin page
export const API_URL = Deno.env.get("API_URL") || "http://dotgitlabci:80/api/v4" 
export const API_TOKEN = Deno.env.get("API_TOKEN") || "token-string-ABYZ000"

export const PROJ_NAME = Deno.env.get("DOTGLCI_PROJ_NAME") || "local-gitlab-ci"
export const PROJ_URL = Deno.env.get("PROJ_URL") || "root/" + PROJ_NAME

export const DOTGL_CLI_PATH = Deno.env.get("DOTGL_CLI_PATH") || "/workspace/.dotglci.yml"

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

