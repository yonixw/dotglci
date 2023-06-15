declare const Deno : any;

import { parse as parseYAML, stringify as stringifYAML } from "https://deno.land/std@0.190.0/yaml/mod.ts";
import * as dotenv from "https://deno.land/std@0.190.0/dotenv/mod.ts";
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts";

import {DOTGL_CLI_PATH, logx} from "./utils.ts"


export type DotGLCLIVarCommon = {
    // Common for both maunal and project level variables
    key: string
    variable_type?: "env_var" | "file"

    value?: string
    path?: string
}

export type DotGLCLIVarProject =  DotGLCLIVarCommon & {
   
    protected?: boolean
    expanded?: boolean
    masked?: boolean
    env_scope?: string 
}

export type DotGLCLISecureFile = {
    name: string,
    path: string
}

export type DotGLCLIManualPipeline = {
    git_ref: string,
    manual_vars?: Array<DotGLCLIVarCommon>
}

export type DotGLCLI = {
    ci_yaml_path?: string
    env_files?: string[]
    variables?: Array<DotGLCLIVarProject>
    secure_files?: Array<DotGLCLISecureFile>
    manual_pipelines?: Array<DotGLCLIManualPipeline>
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

async function updateConfigWithENV(configData: DotGLCLI) {
    if (configData.variables) {
        const dotenv_obj = await getAllDotEnv(configData);

        for (let i = 0; i < configData.variables.length; i++) {
            let myVar = configData.variables[i];

            if (myVar.value === undefined && myVar.path === undefined &&
                dotenv_obj[myVar.key] !== undefined) {
                    myVar.value = dotenv_obj[myVar.key];
                }
                
            configData.variables[i] = myVar;
        }
    }

    return configData;
}

export async function readConfig() {
    const text = await Deno.readTextFile(DOTGL_CLI_PATH);
    const config_version_md5 = (new Md5()).update(text).toString("hex")
    let configData = parseYAML(text) as DotGLCLI;

    configData = await updateConfigWithENV(configData);

    return {config: configData, md5: config_version_md5};
}