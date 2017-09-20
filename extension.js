// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const CLIEngine = require('eslint').CLIEngine;
const path = require('path');
const fs = require('fs');
const jsbeautify = require('js-beautify');
const formatterConfig = require('./formatter');
const commands = vscode.commands;
const window = vscode.window;
const lvmama = 'lvmama fix';
const minTimeout = 1000;
let output;

/**
 * 读取目录下所有文件
 * 
 * @param {string} dir - 目录路径
 * @param {function} done - 回调函数
 */
function readDirFiles(dir, done) {
    let results = [];
    fs.readdir(dir, (err, list) => {
        if (err) {
            return done(err);
        }
        let pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach(file => {
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) => {
                if (err) {
                    return done(err);
                } else if (stat.isDirectory()) {
                    if (file.indexOf('node_modules') === -1) {
                        readDirFiles(file, (err, res) => {
                            results = results.concat(res);
                            if (!--pending) {
                                done(null, results);
                            }
                        });
                    } else {
                        // 如果是 node_modules 目录，需要判断下是否已结束
                        if (!--pending) {
                            done(null, results);
                        }
                    }
                } else {
                    results.push(file);
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
}

/**
 * 检查语法错误
 *
 * @param {string} fileName - 文件或目录路径
 * @param {object} cli - CLIEngine 实例
 * @returns
 */
function checkErr(fileName, cli) {
    // Eslint 检查
    const report = cli.executeOnFiles([fileName]);

    // 判断是否存在语法错误
    const parseErr = {};
    report.results.forEach(fileResult => {
        const err = fileResult.messages.filter(msg => msg.fatal === true);
        if (err.length > 0) {
            parseErr.filePath = fileResult.filePath;
            parseErr.err = err[0];
        }
    });

    if (Object.keys(parseErr).length) {
        return {
            hasErr: true,
            filePath: parseErr.filePath,
            line: parseErr.err.line,
            column: parseErr.err.column
        };
    }
    return { hasErr: false };
}

/**
 * 修复指定文件
 *
 * @param {string} fileName - 文件路径
 * @param {string} language - 语言
 * @param {object} cli - CLIEngine 实例
 * @returns {Promise}
 */
function fixFile(fileName, language, cli) {
    let beautiConfig = formatterConfig.html;
    let beatiFunc = jsbeautify.html;
    if (language === 'javascript') {
        beautiConfig = formatterConfig.javascript;
        beatiFunc = jsbeautify.js;
    }
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, buffer) => {
            if (err) {
                return reject(err);
            }

            // 首先格式化代码
            const content = buffer.toString('utf8');
            const beautiCotent = beatiFunc(content, beautiConfig);

            // 再用 Eslint 修复
            const report = cli.executeOnText(beautiCotent, fileName);
            const formatter = cli.getFormatter();
            const lintText = formatter(report.results);
            if (lintText.trim()) {
                output.show();
                output.appendLine(lintText);
            }
            const fixedContent = report.results[0].output || report.results[0].source || beautiCotent;

            if (fixedContent === content) {
                return resolve();
            }

            // 保存到文件
            fs.writeFile(fileName, fixedContent, err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const cli = new CLIEngine({
        configFile: path.join(__dirname, './eslint-lvmama.json'),
        extensions: ['.js', '.htm', '.html', '.vue'],
        ignorePattern: '**/node_modules',
        useEslintrc: false,
        fix: true
    });

    // 创建输出面板
    output = window.createOutputChannel(lvmama);

    // 修复单个文件
    const disposable = commands.registerCommand('extension.lvmamaFix', () => {
        // The code you place here will be executed every time your command is executed
        try {
            const editor = window.activeTextEditor;
            if (editor) {
                const doc = editor.document;
                const language = doc.languageId;
                const isUntitled = doc.isUntitled;

                if (isUntitled) {
                    window.showErrorMessage(`${lvmama}: 文件必须先保存！`);
                    return;
                }

                if (!['javascript', 'html', 'vue'].includes(language)) {
                    window.showErrorMessage(`${lvmama}: 不支持的文件类型！`);
                    return;
                }

                const checker = checkErr(doc.fileName, cli);
                if (checker.hasErr) {
                    window.showErrorMessage(`${lvmama}: 当前文件 ${checker.line}:${checker.column} 似乎存在语法错误，请检查修改！`);
                } else {
                    window.withProgress({ location: vscode.ProgressLocation.Window }, progress => {
                        return new Promise((resolve, reject) => {
                            const start = Date.now();
                            progress.report({ message: `${lvmama} 修复中...` });
                            fixFile(doc.fileName, language, cli).then(() => {
                                const end = Date.now();
                                if (end - start < minTimeout) {
                                    setTimeout(() => {
                                        resolve();
                                        window.showInformationMessage(`${lvmama}: 修复已完成！`);
                                    }, (minTimeout - (end - start)));
                                } else {
                                    resolve();
                                    window.showInformationMessage(`${lvmama}: 修复已完成！`);
                                }
                            }).catch(err => {
                                reject();
                                window.showErrorMessage(`${lvmama}: 修复失败！Error: ${err}`);
                            });
                        });
                    });
                }
            } else {
                window.showWarningMessage(`${lvmama}: 没有检测到已打开的文件！`);
            }
        } catch (e) {
            console.error(e);
            output.show();
            output.appendLine(e);
        }
    });

    // 修复目录下所有文件
    const disposable2 = commands.registerCommand('extension.lvmamaFixAll', () => {
        try {
            window.showInputBox({
                placeHolder: '请输入目录的相对路径或绝对路径',
                prompt: '支持目录下 .js, .htm, .html .vue 后缀的文件'
            }).then(input => {
                if (typeof input === 'undefined') {
                    return;
                }

                let folderPath = input.trim();

                // 空路径直接返回
                if (!folderPath) {
                    return;
                }

                folderPath = path.resolve(__dirname, folderPath);

                fs.stat(folderPath, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            window.showErrorMessage(`${lvmama}: 目录 ${folderPath} 不存在！`);
                        } else {
                            window.showErrorMessage(`${lvmama}: 读取 ${folderPath} 时出错！error: ${err.message}`);
                        }
                        return;
                    }

                    if (!stats.isDirectory()) {
                        window.showErrorMessage(`${lvmama}: 路径 ${folderPath} 必须是一个目录！`);
                        return;
                    }

                    try {
                        const checker = checkErr(folderPath, cli);
                        if (checker.hasErr) {
                            window.showErrorMessage(`${lvmama}: 文件 ${checker.filePath} ${checker.line}:${checker.column} 似乎存在语法错误，请检查修改！`);
                        } else {
                            window.withProgress({ location: vscode.ProgressLocation.Window }, progress => {
                                return new Promise((resolve, reject) => {
                                    const start = Date.now();
                                    progress.report({ message: `${lvmama} 修复中...` });

                                    // 读取目录下的所有文件
                                    readDirFiles(folderPath, (err, files) => {
                                        if (err) {
                                            reject();
                                            window.showErrorMessage(`${lvmama}: 读取 ${folderPath} 时出错！error: ${err.message}`);
                                            return;
                                        }
                                        const promiseList = [];
                                        files.forEach(file => {
                                            const extName = path.extname(file);
                                            if (extName === '.js') {
                                                promiseList.push(fixFile(file, 'javascript', cli));
                                            } else if (['.htm', '.html', '.vue'].indexOf(extName) >= 0) {
                                                promiseList.push(fixFile(file, 'html', cli));
                                            }
                                        });

                                        if (!promiseList.length) {
                                            resolve();
                                            window.showInformationMessage(`${lvmama}: 目录 ${folderPath} 下没有可支持的文件！`);
                                            return;
                                        }
                                        Promise.all(promiseList).then(() => {
                                            const end = Date.now();
                                            if (end - start < minTimeout) {
                                                setTimeout(() => {
                                                    resolve();
                                                    window.showInformationMessage(`${lvmama}: 目录 ${folderPath} 下的${promiseList.length}个文件全部修复完成！`);
                                                }, (minTimeout - (end - start)));
                                            } else {
                                                resolve();
                                                window.showInformationMessage(`${lvmama}: 目录 ${folderPath} 下的${promiseList.length}个文件全部修复完成！`);
                                            }
                                        }).catch(err => {
                                            reject();
                                            window.showErrorMessage(`${lvmama}: 修复失败！Error: ${err}`);
                                        });
                                    });
                                });
                            });
                        }
                    } catch (e) {
                        console.error(e);
                        output.show();
                        output.appendLine(e);
                    }
                });
            });
        } catch (e) {
            console.error(e);
            output.show();
            output.appendLine(e);
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
