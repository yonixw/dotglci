import { loadEnvObject, md5hash, parseYAML, readFile, writeFile, z } from "../api/export.ts"
import {DOTGL_CLI_PATH, logx} from "./env.ts"


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
            await writeFile(
                tempMergedEnv,
                (await readFile(file)) + "\n",
                { append: true }
            );
        }
    }

    return await loadEnvObject ({
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
    const text = await readFile(DOTGL_CLI_PATH);
    const config_version_md5 = md5hash(text);
    let configData = parseYAML(text) as DotGLCLI;

    configData = await updateConfigWithENV(configData);

    return {config: configData, md5: config_version_md5};
}