'use strict';
import * as vscode from 'vscode';
// import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // console.log("Activating...");
    var chokidar = require('chokidar');

    let config = vscode.workspace.getConfiguration('watch-run');
    if (!config) {
        return;
    }

    const folders = vscode.workspace.workspaceFolders;
    if (typeof folders === 'undefined') {
        return;
    }

    let targetList = config['targetList'];
    if (!targetList || targetList.length === 0) {
        return;
    }

    function setWorkspace(workspacePath:string) {
        // console.log("Adding:" + workspacePath);

        function addWatchTarget(target:string, task:string , command: string) {
            chokidar.watch(target, {
                cwd: workspacePath
            }).on('change', (filename:string, stats:object) => {
                // let targetFile = path.join(rootPath ? rootPath : "",filename);
                // console.log("File:" + targetFile + " Task:" + task);
                // console.log("filename:" + filename);
                if (task === undefined) {
                    vscode.commands.executeCommand(command);
                }
                vscode.commands.executeCommand("workbench.action.tasks.runTask",task);
            });
        }

        for(var i=0; i < targetList.length; i++) {
            let target = targetList[i]['target'];
            let task = targetList[i]['task'];
            let command = targetList[i]['command'];
            
            if (target === undefined) { continue; }
            addWatchTarget(target,task,command);
        }
    }

    // important!
    // vscode.workspace.rootPath(in windows) format is : 'c:\folder\folder'
    // 
    // let rootPath = vscode.workspace.rootPath || "";
    // setWorkspace(rootPath);


    for(var i=0; i < folders.length; i++) {
        setWorkspace(folders[i].uri.fsPath);
    }
}

export function deactivate() {
}