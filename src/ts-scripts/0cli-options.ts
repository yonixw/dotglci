import { getARGV } from "./api/export.ts"

import {logx as _logx} from "./common/env.ts"
const SCRIPT_PREFIX = "CLI"
const logx = (text:string)=>_logx(text,SCRIPT_PREFIX);


logx("1")

logx(JSON.stringify(getARGV()))