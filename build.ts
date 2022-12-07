import { rollup } from 'rollup';
import type { RollupOptions, OutputOptions } from 'rollup';
import buildConfig from './rollup.config';
import { exec } from 'pkg';
const [, , type, platform, nodev, nodex, nobytecode] = process.argv;
const isNobytecode = nobytecode === 'nobytecode';

rollup(buildConfig as RollupOptions)
    .then(async (build) => await build.write(buildConfig.output as OutputOptions))
    .then(() => {
        if (type) {
            let cmd = [buildConfig.output.file, '--out-path', 'out', '--compress', 'Brotli', '-t'];
            isNobytecode && cmd.push(...['--no-bytecode', '--public']);
            const v = nodev || '16';
            const x = nodex || 'x64';
            switch (type) {
                case 'pkg':
                    switch (platform || process.platform) {
                        case 'w':
                        case 'win':
                        case 'win32':
                            cmd.push(`node${v}-win-${x}`);
                            break;
                        case 'l':
                        case 'linux':
                            cmd.push(`node${v}-linux-${x}`);
                            break;
                        case 'm':
                        case 'mac':
                        case 'darwin':
                            cmd.push(`node${v}-macos-${x}`);
                            break;
                    }
                    break;
                case 'pkga':
                    cmd.push(`node${v}-macos-${x},node${v}-linux-${x},node${v}-win-${x}`);
                    break;
            }
           exec(cmd);
        }
    })
    .catch((error) => {
        console.log(`\x1B[31mFailed to build main process !\x1B[0m`);
        console.error(error);
        process.exit(1);
    });