declare const Deno : any;

import {PROJ_URL} from "./utils"
import {_getTxt,_url,KNOWN_API} from "./fetch"

export async function getProjectID() : Promise<number> {
    const all_projects = JSON.parse( await _getTxt(_url(KNOWN_API.all_projects)) || "" );
    const project = all_projects.filter(e=>e.path_with_namespace == PROJ_URL)[0];
    return project.id; // fail on any problem
}