import { platform, env } from "node:process";
import { resolve, join } from "node:path";

export const executionFile =
    platform === 'darwin' ?
        'mac.go-compression'
        : platform === 'linux' ?
            'linux.go-compression'
            : 'go-compression.exe'

export const executionFileAbsolute = env.NODE_ENV === 'development' ? resolve(join('platform', platform, executionFile)) : resolve(join(platform, executionFile))