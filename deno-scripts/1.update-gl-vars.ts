import {
 PROJ_URL,
 logx, jsonPrint,
} from "./common/utils.ts"

import {
    _fetchTxt, _getTxt, _postTxt, _delTxt, 
    _url,
    KNOWN_API
} from "./common/fetch.ts"

import {
    getProjectID
} from "./common/gitlabapi.ts"

import {
    readConfig,  DotGLCLIVarProject
} from "./common/config-file.ts"

type ss_var_info = {
    key:string, masked?: boolean, variable_type: string, environment_scope?: string
};

async function getProjectVariables(id: number) : Promise<Array<ss_var_info>> {
    const all_projs_vars = JSON.parse( await _getTxt(_url(KNOWN_API.proj_vars,{id})) || "" );
    return all_projs_vars.map((e:any)=>({
        key:e.key,
        masked:e.masked=="true",
        variable_type:e.variable_type,
        environment_scope:e.environment_scope
    })); // fail on any problem
}


async function addProjectVar(var_info: DotGLCLIVarProject, projID: number) {
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

    if (var_info.env_scope !== undefined) {
        body.set("environment_scope", String(var_info.env_scope))
    }

    let x = await _postTxt(
            _url(KNOWN_API.add_proj_vars,{id:projID}),
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

async function delProjectVar(ss_var: ss_var_info, projID: number) {
    let url = _url(KNOWN_API.del_proj_vars,{id: projID, key: ss_var.key});
    if (ss_var.environment_scope && ss_var.environment_scope != "*") {
        url += "?filter[environment_scope]=" + String(ss_var.environment_scope)
    }

    await _delTxt(url)
}



async function main() {
    logx("Loading config (.dotglci.yml) file")
    let configLoadResult = await readConfig();
    
    logx("Metadata:")
    jsonPrint(await _getTxt(_url(KNOWN_API.metadata)))

    logx("Instance Stats:")
    jsonPrint(await _getTxt(_url(KNOWN_API.stats)))

    const projectID = await getProjectID();
    logx(`Found proj id=${projectID} for url=${PROJ_URL}`)

    const proj_vars = await getProjectVariables(projectID);
    logx(`Found these proj variables:`)
    console.log(proj_vars)

    logx("Config MD5 Hash: " + configLoadResult.md5)
    const old_md5 = proj_vars.filter(e=>e.key=="DOTGLCI_MD5_"+configLoadResult.md5)
    if (old_md5 && old_md5.length > 0 ) {
        logx("Skipping variable update becauseh MD5 Hash the same!!!")
    }
    else {
        
        logx("Removing old vars")
        if (proj_vars) {
            for (let i = 0; i < proj_vars.length; i++) {
                logx("Deleting " + proj_vars[i].key + "...");
                await delProjectVar(proj_vars[i], projectID);
            }
        }

        logx("Adding new vars")
        let _vars = configLoadResult.config.variables
        if (_vars) {
            for (let i = 0; i < _vars.length; i++) {
                logx("Adding " + _vars[i].key + "...");
                await addProjectVar(_vars[i], projectID);
            }
        }

        logx("Adding the MD5 checksum of the var config")
        await addProjectVar({
            key:"DOTGLCI_MD5_"+configLoadResult.md5,
            variable_type:"env_var",
            value:"1"},
            projectID)
    }

    logx("[DONE Updating vars]")
}

await main()


