// API version (v4) can be found in the /admin page
const API_URL = Deno.env.get("API_URL") || "http://gitlab:80/api/v4" 
const API_TOKEN = Deno.env.get("API_TOKEN") || "token-string-ABYZ000"
const PROJ_NAME = Deno.env.get("PROJ_NAME") || "local-gitlab-ci"
const PROJ_URL = Deno.env.get("PROJ_URL") || "root/" + PROJ_NAME

const KNOWN_API = {
    stats: "/application/statistics",
    metadata: "/version",
    all_projects: "/projects",
    proj_vars: "/projects/:id/variables",
    del_proj_vars: "/projects/:id/variables/:key", // method=DELETE
    add_proj_vars: "/projects/:id/variables" // method=POST
}


function logx (txt: string, prefix="***") {
    console.log(`[${prefix}] [${(new Date()).toISOString()}] ${txt}`)
}

const _url = (apiSuffix: string, params: {[key:string]:any} ={})=> {
    let pairs = Object.entries(params).forEach((pair)=>apiSuffix=apiSuffix.replace(":"+pair[0],`${pair[1]}`))
    return API_URL+apiSuffix;
}


async function _fetchTxt(url, method="GET", headers=undefined, body=undefined) : Promise< string | false> {
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

function  _getTxt(url, headers=undefined, body=undefined) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "GET", headers, body)
}

function  _postTxt(url, headers=undefined, body=undefined) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "POST", headers, body)
}

function jsonPrint(_txt:any){
    try {
        console.log(JSON.stringify(JSON.parse(_txt), null, 4))
    } catch (error) {
        console.log(_txt)
    }
}

async function getProjectID() : Promise<number> {
    const all_projects = JSON.parse( await _getTxt(_url(KNOWN_API.all_projects)) || "" );
    const project = all_projects.filter(e=>e.path_with_namespace == PROJ_URL)[0];
    return project.id; // fail on any problem
}

async function getProjectVariables(id: number) {
    const all_projs_vars = JSON.parse( await _getTxt(_url(KNOWN_API.proj_vars,{id})) || "" );
    return all_projs_vars.map(e=>({
        key:e.key,
        masked:e.masked,
        variable_type:e.variable_type
    })); // fail on any problem
}

async function delProjectVar() {
    
}

async function addProjectVar() {
    /*
    const body=new FormData();
    body.set('a', 'b');
    body.set('c', '10');
    */
}

async function main() {
    logx("Metadata:")
    jsonPrint(await _getTxt(_url(KNOWN_API.metadata)))

    logx("Instance Stats:")
    jsonPrint(await _getTxt(_url(KNOWN_API.stats)))

    const projectID = await getProjectID();
    logx(`Found proj id=${projectID} for url=${PROJ_URL}`)

    const proj_vars = await getProjectVariables(projectID);
    logx(`Found these proj variables:`)
    console.log(proj_vars)


}

await main()

