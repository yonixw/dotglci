import { parse as parseYAML, stringify as stringifYAML } from "https://deno.land/std@0.190.0/yaml/mod.ts";
import * as dotenv from "https://deno.land/std@0.190.0/dotenv/mod.ts";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";



// API version (v4) can be found in the /admin page
const API_URL = Deno.env.get("API_URL") || "http://dotgitlabci:80/api/v4" 
const API_TOKEN = Deno.env.get("API_TOKEN") || "token-string-ABYZ000"
const PROJ_NAME = Deno.env.get("DOTGLCI_PROJ_NAME") || "local-gitlab-ci"
const PROJ_URL = Deno.env.get("PROJ_URL") || "root/" + PROJ_NAME

const KNOWN_API = {
    stats: "/application/statistics",
    metadata: "/version",
    all_projects: "/projects",
    proj_vars: "/projects/:id/variables",
    add_proj_vars: "/projects/:id/variables", // method=POST
    del_proj_vars: "/projects/:id/variables/:key", // method=DELETE
}


function logx (txt: string, prefix="***") {
    console.log(`[${prefix}] [${(new Date()).toISOString()}] ${txt}`)
}

const _url = (apiSuffix: string, params: {[key:string]:any} ={})=> {
    Object.entries(params)
        .forEach((pair)=>
            apiSuffix=apiSuffix.replace(":"+pair[0],`${pair[1]}`.replace(/\//g,'%2F'))
        )
    return API_URL+apiSuffix;
}


async function _fetchTxt(url, method="GET", headers=undefined, body:any=undefined) : Promise< string | false> {
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

function  _getTxt(url, headers=undefined, body:any=undefined) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "GET", headers, body)
}

function  _postTxt(url, headers=undefined, body:any=undefined) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "POST", headers, body)
}

function  _delTxt(url, headers=undefined, body:any=undefined) : Promise< string | false> {
    headers = {...(headers || {}), "Authorization" : "Bearer " + API_TOKEN }
    return _fetchTxt(url, "DELETE", headers, body)
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

type ss_var_info = {
    key:string, masked?: boolean, variable_type: string, environment_scope?: string
};

async function getProjectVariables(id: number) : Promise<Array<ss_var_info>> {
    const all_projs_vars = JSON.parse( await _getTxt(_url(KNOWN_API.proj_vars,{id})) || "" );
    return all_projs_vars.map(e=>({
        key:e.key,
        masked:e.masked=="true",
        variable_type:e.variable_type,
        environment_scope:e.environment_scope
    })); // fail on any problem
}

type DotGLCLIVar = {
    key: string
    variable_type?: "env_var" | "file" | "dotglci_manual"

    value?: string
    path?: string

    protected?: boolean
    expanded?: boolean
    masked?: boolean
    env?: string
}

type DotGLCLI = {
    env_files?: string[]
    variables?: Array<DotGLCLIVar>
}


async function addProjectVar(var_info: DotGLCLIVar) {
    //https://docs.gitlab.com/ee/api/project_level_variables.html#create-a-variable

    const body=new FormData();
    body.set('key', var_info.key);
    
    if (var_info.variable_type !== "file") {
        body.set("variable_type", "env_var")
    }
    else {
        body.set("variable_type", "file")
    }

    if (var_info.path) {
        body.set("value", await Deno.readTextFile(var_info.path))
    }
    else {
        body.set("value", var_info.value || "")
    }

    if (var_info.protected !== undefined) {
        body.set("protected", String(var_info.protected))
    }

    if (var_info.expanded !== undefined) {
        body.set("raw", String(!var_info.expanded))
    }

    if (var_info.masked !== undefined) {
        body.set("masked", String(var_info.masked))
    }

    if (var_info.env !== undefined) {
        body.set("environment_scope", String(var_info.env))
    }

    let x = await _postTxt(
            _url(KNOWN_API.add_proj_vars,{id:PROJ_URL}),
            undefined, 
            body
    )

    if (typeof x == "string" && x.indexOf("invalid") > -1) {
        logx("Creating a variable failed! debug info:")
        if( var_info.masked !== undefined) {
            logx("Maybe need to adjust to satisfy mask requirments? See: "+ 
                "\n https://docs.gitlab.com/ee/ci/variables/#mask-a-cicd-variable")
        }
        console.log("[Request]",[...body.entries()])
        console.log("[Response]",x);
        throw("Failed adding all variables. Existing...")
    }

    return x;
}

async function delProjectVar(ss_var: ss_var_info) {
    let url = _url(KNOWN_API.del_proj_vars,{id: PROJ_URL, key: ss_var.key});
    if (ss_var.environment_scope && ss_var.environment_scope != "*") {
        url += "?filter[environment_scope]=" + String(ss_var.environment_scope)
    }

    await _delTxt(url)
}

async function getAllDotEnv(ymlData: DotGLCLI) {
    const tempMergedEnv = "/tmp/allenv.env";

    if (ymlData.env_files) {
        for (let i = 0; i < ymlData.env_files.length; i++) {
            const file = ymlData.env_files[i];
            logx("Loading env file from: " + file);
            await Deno.writeTextFile(
                tempMergedEnv,
                (await Deno.readTextFile(file)) + "\n",
                { append: true }
            );
        }
    }

    return await dotenv.load({
        export: false,
        envPath: tempMergedEnv,
        allowEmptyValues: true
    });
}


async function main() {
    logx("Loading yaml file")
    const text = await Deno.readTextFile("/workspace/.dotglci.yml");
    const config_version_md5 = (new Md5()).update(text).toString("hex")
    const configData = parseYAML(text) as DotGLCLI;

    logx("Metadata:")
    jsonPrint(await _getTxt(_url(KNOWN_API.metadata)))

    logx("Instance Stats:")
    jsonPrint(await _getTxt(_url(KNOWN_API.stats)))

    const projectID = await getProjectID();
    logx(`Found proj id=${projectID} for url=${PROJ_URL}`)

    const proj_vars = await getProjectVariables(projectID);
    logx(`Found these proj variables:`)
    console.log(proj_vars)

    logx("Config MD5 Hash: " + config_version_md5)
    const old_md5 = proj_vars.filter(e=>e.key=="DOTGLCI_MD5_"+config_version_md5)
    if (old_md5 && old_md5.length > 0 ) {
        logx("Skipping variable update becauseh MD5 Hash the same!!!")
    }
    else {
        
        logx("Removing old vars")
        if (proj_vars) {
            for (let i = 0; i < proj_vars.length; i++) {
                logx("Deleting " + proj_vars[i].key + "...");
                await delProjectVar(proj_vars[i]);
            }
        }

        logx("Adding new vars")
        if (configData.variables) {
            const dotenv_obj = await getAllDotEnv(configData);

            for (let i = 0; i < configData.variables.length; i++) {
                let myVar = configData.variables[i];

                if (myVar.variable_type !== "dotglci_manual") {
                    if (myVar.value === undefined && myVar.path === undefined &&
                        dotenv_obj[myVar.key] !== undefined) {

                        myVar.value = dotenv_obj[myVar.key];
                    }

                    logx("Adding " + myVar.key + "...");
                    await addProjectVar(myVar);
                }
            }
        }

        logx("Adding the MD5 checksum of the var config")
        await addProjectVar({
            key:"DOTGLCI_MD5_"+config_version_md5,
            variable_type:"env_var",
            value:"1"})
    }

    logx("[DONE Updating vars]")
}

await main()


