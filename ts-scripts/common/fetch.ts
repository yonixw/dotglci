import {API_TOKEN, API_URL, logx} from "./utils.ts"


export const KNOWN_API = {
    stats: "/application/statistics",
    metadata: "/version",
    all_projects: "/projects",
    proj_vars: "/projects/:id/variables",
    add_proj_vars: "/projects/:id/variables", // method=POST
    del_proj_vars: "/projects/:id/variables/:key", // method=DELETE
}


export const _url = (apiSuffix: string, params: {[key:string]:any} ={})=> {
    Object.entries(params)
        .forEach((pair)=>
            apiSuffix=apiSuffix.replace(":"+pair[0],`${pair[1]}`.replace(/\//g,'%2F'))
        )
    return API_URL+apiSuffix;
}


export async function _fetchTxt(url:string, method="GET", headers?:Record<string,any>, body?:any) : Promise< string | false> {
    try {
        logx(url,method)
        let r = await fetch(url,{method, headers, body});
        let t = await r.text();
        return t;
    } catch (error) {
        console.log("[FETCH-ERR]",error);
        return false;
    }
}

export function  _getTxt(url:string, headers?:Record<string,any>, body?:any) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "GET", headers, body)
}

export function  _postTxt(url:string, headers?:Record<string,any>, body?:any) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "POST", headers, body)
}

export function  _delTxt(url:string, headers?:Record<string,any>, body?:any) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "DELETE", headers, body)
}