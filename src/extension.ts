'use strict';
import * as vscode from 'vscode';

class Watcher {
    private watch: any;
    private watcher: any;
    private targetList: any;
    private glob: any;
    private regexpList: any;


    constructor() {
        this.watch = require('node-watch');
        this.glob = require('glob-to-regexp');
    }

    public setConfig(config: any): boolean {
        var tl = config.get('targetList');
        this.targetList = tl;
        if (!tl || tl.length === 0) { return false; }
        var rel: any[] = [];
        this.regexpList = rel;
        for (var i = 0; i < tl.length; i++) {
            var to = tl[i];
            var target = to['target'];
            var regexpText = to['regexp'];
            var re = null;
            if (target) { re = this.glob(target, { globstar: true }); }
            if (!re && regexpText) { re = new RegExp(regexpText, 'i'); }
            rel.push(re);
        }

        return true;
    }

    public setWorkspace(workspacePath: string) {
        var THIS = this;
        var workspaceUri = vscode.Uri.file(workspacePath);
        var wsUriLength = workspaceUri.path.length;

        this.watcher = this.watch(workspacePath, { recursive: true }, function (evt: any, name: any) {
            // console.log("Filename Pattern:" + name);
            var uri = vscode.Uri.file(name);
            var tl = THIS.targetList;
            var rel = THIS.regexpList;
            for (var i = 0; i < tl.length; i++) {
                var to = tl[i];
                var re = rel[i];
                var leafPath = uri.path.substring(wsUriLength);
                if (!re.test(leafPath)) { continue; }
                var task = to['task'];
                vscode.commands.executeCommand("workbench.action.tasks.runTask", task);
            }
        });
    }

    public closeWatch() {
        if (this.watcher && !this.watcher.isClosed()) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}


export function activate(context: vscode.ExtensionContext) {
    var w = new Watcher();
    function startWatch() {
        // Get Config
        let config = vscode.workspace.getConfiguration('watch-run');
        if (!config) { return; }

        const folders = vscode.workspace.workspaceFolders;
        if (typeof folders === 'undefined') { return; }

        // Set Configuration to Watcher
        if (!w.setConfig(config)) { return; }

        // Add all workspace root to Watcher
        for (var i = 0; i < folders.length; i++) {
            w.setWorkspace(folders[i].uri.fsPath);
        }
    }

    startWatch();

    // apply 
    let disposable = vscode.commands.registerCommand('watch-run.applySettings', () => {
        vscode.window.showInformationMessage('watch-run: Apply Settings!');
        w.closeWatch();
        startWatch();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}