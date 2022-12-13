import { rollup } from 'rollup';
import type { RollupOptions, OutputOptions } from 'rollup';
import buildConfig from './rollup.config';
import { exec } from 'pkg';
import copy from 'rollup-plugin-copy'
import type { Target } from 'rollup-plugin-copy'
const targets: Target[] = []
const [, , type, platform, nodev, nodex, nobytecode] = process.argv;
const isNobytecode = nobytecode === 'nobytecode';


const cmd = [buildConfig.output.file, '--out-path', 'out', '--compress', 'Brotli', '-t'];

if (type) {
    isNobytecode && cmd.push(...['--no-bytecode', '--public']);
    const v = nodev || '16';
    const x = nodex || 'x64';
    switch (type) {
        case 'pkg':
            switch (platform || process.platform) {
                case 'w':
                case 'win':
                case 'win32':
                    targets.push({
                        src: 'platform/win32',
                        dest: 'out'
                    })
                    cmd.push(`node${v}-win-${x}`);
                    break;
                case 'l':
                case 'linux':
                    targets.push({
                        src: 'platform/linux',
                        dest: 'out'
                    })
                    cmd.push(`node${v}-linux-${x}`);
                    break;
                case 'm':
                case 'mac':
                case 'darwin':
                    targets.push({
                        src: 'platform/darwin',
                        dest: 'out'
                    })
                    cmd.push(`node${v}-macos-${x}`);
                    break;
            }
            break;
        case 'pkga':
            targets.push({
                src: 'platform/win32',
                dest: 'out'
            })
            targets.push({
                src: 'platform/linux',
                dest: 'out'
            })
            targets.push({
                src: 'platform/darwin',
                dest: 'out'
            })
            cmd.push(`node${v}-macos-${x},node${v}-linux-${x},node${v}-win-${x}`);
            break;
    }
} else {
    targets.push({
        src: 'platform/win32',
        dest: 'dist'
    })
    targets.push({
        src: 'platform/linux',
        dest: 'dist'
    })
    targets.push({
        src: 'platform/darwin',
        dest: 'dist'
    })
}

buildConfig.plugins.push(copy({ targets }))

rollup(buildConfig as RollupOptions)
    .then(async (build) => await build.write(buildConfig.output as OutputOptions))
    .then(() => { type && exec(cmd) })
    .catch((error) => {
        console.log(`\x1B[31mFailed to build main process !\x1B[0m`);
        console.error(error);
        process.exit(1);
    });