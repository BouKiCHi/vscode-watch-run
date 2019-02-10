'use strict';
import * as vscode from 'vscode';

class Watcher {
    private watch: any;
    private targetList: any;
    private glob: any;

    constructor() {
        this.watch = require('node-watch');
        this.glob = require('glob-to-regexp');
    } 

    public setConfig(config:any) : boolean {
        this.targetList = config.get('targetList');

        if (!this.targetList || this.targetList.length === 0) { return false; }
        return true;
    }
    
    public addWatchTarget(workspace: string, target:string, task:string, command: string) {
        var re = this.glob(target, { globstar: true });
        // console.log("Watching..:" + workspace);

        this.watch(workspace, {
            recursive: true
        }, function(evt:any, name:any) {
            if (!re.test(name)) { return; }

            // console.log("Pattern Matched!: " + name);

            if (task === undefined) {
                if (!command) { return; }
                vscode.commands.executeCommand(command);
            }
            vscode.commands.executeCommand("workbench.action.tasks.runTask",task);
        });
    }

    public setWorkspace(workspacePath:string) {
        var tl = this.targetList;

        for(let i=0; i < tl.length; i++) {
            let t = tl[i];
            let target = t['target'];
            let task = t['task'];
            let command = t['command'];
            
            if (target === undefined) { continue; }
            this.addWatchTarget(workspacePath, target, task, command);
        }
    }
}


export function activate(context: vscode.ExtensionContext) {

    let config = vscode.workspace.getConfiguration('watch-run');
    if (!config) { return; }

    const folders = vscode.workspace.workspaceFolders;
    if (typeof folders === 'undefined') { return; }

    var w = new Watcher();

    if (!w.setConfig(config)) { return; }

    // important!
    // vscode.workspace.rootPath(in windows) format is : 'c:\folder\folder'

    for(var i=0; i < folders.length; i++) {
        w.setWorkspace(folders[i].uri.fsPath);
    }
}

export function deactivate() {
}