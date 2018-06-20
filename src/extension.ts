'use strict';
import * as vscode from 'vscode';
// import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    var chokidar = require('chokidar');

    let config = vscode.workspace.getConfiguration('watch-run');
    if (!config) {
        return;
    }

    let rootPath : string = vscode.workspace.rootPath || "";
    if (!rootPath) {
        return;
    }

    let targetList = config['targetList'];
    if (!targetList || targetList.length === 0) {
        return;
    }

    for(var i=0; i < targetList.length; i++) {
        function taskFunction(target:string,task:string) {
            chokidar.watch(target, {
                cwd: rootPath
            }).on('change', (filename:string, stats:object) => {
                // let targetFile = path.join(rootPath ? rootPath : "",filename);
                // console.log("File:" + targetFile + " Task:" + task);
                // console.log("filename:" + filename);
                vscode.commands.executeCommand("workbench.action.tasks.runTask",task);
          });
        }
        taskFunction(targetList[i]['target'],targetList[i]['task']);
    }
}

export function deactivate() {
}