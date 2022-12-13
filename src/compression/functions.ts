import { executionFileAbsolute, Snowflake } from "./";
import { resolve } from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

type config = {
    zipPath: string
    sourceFolder: string
    src: string[]
}


export function zips(config: config) {

    let configFilePath = resolve(new Snowflake(1n, 2n).nextId().toString().concat('.json'))

    try {
        writeFileSync(configFilePath, JSON.stringify(config, null, 2), { encoding: 'utf-8' });
    } catch (error) {
        console.log("\n  临时配置文件写入失败");
    }

    try {
        execSync([executionFileAbsolute, '-c', configFilePath].join(' '))
    } catch (error) {
        console.log("\n  压缩异常");
    }

    try {
        unlinkSync(configFilePath)
    } catch (error) {
        console.log("\n  移除临时配置文件异常");
    }
}
