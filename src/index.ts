
import { zipHashElement, hashElement, HashedFolderAndFileType, diffVersionHash, handleHashedFolderChildrenToObject } from "./core";
import { getServiceHash } from "./net";
import { resolve, join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { UpdateJson } from "../types/type";
import { zips } from "./compression";


// 命令解析
interface IOption {
  pack: boolean;
  ungzip?: boolean;
  ddif?: boolean;
  url?: string;
  help: boolean;
  output: string;
  target: string;
  input: string;
  config?: string;
  updateJsonName: string;
  version?: string;
}
function checkOrFixOptions(options: IOption) {
  if (!existsSync(options.input)) {
    throw new Error("The input folder is not exist!");
  }
  if (!existsSync(options.output)) {
    mkdirSync(options.output);
  }
  options.target = options.target.replace(/\\$/, "");
  options.updateJsonName = options.updateJsonName.replace(/\.json$/, "").replace(/.\\\//ig, "");
}
function showDoc() {
  const sections = [
    {
      header: "阿帆题更新工具",
      content: "默认生成gzip包。"
    },
    {
      header: "Options",
      optionList: [
        {
          name: "pack",
          description: "运行pack功能",
          type: String,
          alias: "p"
        },
        {
          name: "ungzip",
          description: "不使用gzip压缩(仅生成hash",
          type: String,
          alias: "z"
        },
        {
          name: "ddif",
          description: "是否ddif比较",
          type: Boolean,
          alias: "d"
        },
        {
          name: "help",
          description: "使用帮助",
          typeLabel: "{underline help}",
          alias: "h",
          type: Boolean
        },
        {
          name: "output",
          typeLabel: "{underline directory}",
          description: "pack后输出的base文件夹路径 (默认: ./build)",
          type: String,
          alias: "o"
        },
        {
          name: "target",
          typeLabel: "{underline directory}",
          description: "pack后输出的gzip文件夹路径 (默认: ./build/gzip)",
          type: String,
          alias: "t"
        },
        {
          name: "input",
          typeLabel: "{underline directory}",
          description: "pack未压缩的文件夹路径 (默认: ./build/win-unpacked)",
          type: String,
          alias: "i"
        },
        {
          name: "updateJsonName",
          typeLabel: "{underline string}",
          description: "更新的json名称 (默认: update-config)",
          type: String,
          alias: "u"
        },
        {
          name: "config",
          typeLabel: "{underline file}",
          description: "配置文件路径 (默认: package.json) 读取配置文件中的version及electronUpdaterConfig属性内容",
          type: String,
          alias: "c"
        }
      ]
    }
  ];
  console.log(commandLineUsage(sections));
}
// pack文件夹下的文件
async function startPack(options: IOption) {
  let _options = { ...options };
  console.log(("\n  开始读取配置"));
  try {
    if (_options.config) {
      const config = require(join(process.cwd(), _options.config));
      _options = { ..._options, ...config };
    } else {
      const pkg = require(join(process.cwd(), "package.json"));
      _options = { ..._options, ...pkg.electronUpdaterConfig, version: pkg.version };
    }
  } catch (error) {
    console.log(("\n 读取配置失败"));
  }
  checkOrFixOptions(_options);
  try {
    console.log(("\n  获取文件夹的hash内容"));
    const hash = hashElement(_options.input);
    const targetPath = join(_options.output, _options.target + _options.version);
    if (!existsSync(targetPath)) {
      !_options.ungzip && mkdirSync(targetPath);
    }
    !_options.ungzip && console.log(("\n  Gzip压缩文件"));
    !_options.ungzip && await zipHashElement(hash as HashedFolderAndFileType, _options.input, targetPath, true);
    console.log(("\n  生成更新配置-json"));
    writeFileSync(join(_options.output, _options.updateJsonName + ".json"), JSON.stringify({
      version: _options.version,
      targetPath: _options.target + _options.version,
      hash
    }, null, 2));
    if (_options.ddif) {
      console.log("\n  ddif计算");
      if (_options.url) {
        let json: UpdateJson | null = null
        try {
          json = await getServiceHash(_options.url)
        } catch (error) {
          console.log("\n  请求异常");
        }
        if (json) {
          handleHashedFolderChildrenToObject(json.hash);
          const diffResult = diffVersionHash(json.hash, hash!);

          let changeds = await Promise.all(diffResult.changed.map(item => {
            return item.filePath
          }));
          let addeds = await Promise.all(diffResult.added.map(item => {
            return item.filePath
          }));

          try {
            console.log("\n  开始压缩");
            zips({
              zipPath: resolve(join(_options.output, 'Update.zip')),
              sourceFolder: resolve(_options.input),
              src: [...changeds, ...addeds]
            })
          } catch (error) {
            console.log("\n  压缩异常");
          }
        } else {
          console.log("\n  远程配置文件错误");
        }
      } else {
        console.log("\n  ddif失败,未设置url");
      }
    }
    console.log(
      "\n" + (" 完成 ") + "  " + "The resource file is packaged!\n"
    );
  } catch (error) {
    console.log(
      "\n" +
      (" ERROR ") +
      "  " +
      ((error as Error).message || error) +
      "\n"
    );
    process.exit(1);
  }
}

async function start() {
  // 解析参数
  const optionDefinitions = [
    { name: "pack", alias: "p", type: Boolean, defaultValue: false },
    { name: "ungzip", alias: "z", type: Boolean, defaultValue: false },
    { name: "ddif", alias: "d", type: Boolean, defaultValue: true },
    { name: "help", alias: "h", type: Boolean, defaultValue: true },
    { name: "output", alias: "o", type: String, defaultValue: "./build" },
    { name: "target", alias: "t", type: String, defaultValue: "gzip" },
    { name: "input", alias: "i", type: String, defaultValue: "./build/win-unpacked" },
    { name: "updateJsonName", alias: "u", type: String, defaultValue: "update-config" },
    { name: "config", alias: "c", type: String },
    { name: "get", alias: "g", type: Boolean, defaultValue: false },
    { name: "arch", alias: "a", type: String, defaultValue: "x64" }
  ];
  // 解析
  const options = commandLineArgs(optionDefinitions) as IOption;
  // 执行脚本
  if (options.pack) {
    await startPack(options);
  } else { // 显示help
    showDoc();
  }
}




start();
