'use strict';
import * as vscode from 'vscode';

const path = require('path');

export class Watcher {

    private watch: any;
    private watchers: any[];
    private targetList: any;
    private glob: any;
    private regexpList: any;

    private taskToFile: any;

    constructor() {
        this.watch = require('node-watch');
        this.glob = require('glob-to-regexp');
        this.watchers = [];
        this.taskToFile = {};
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

        const watcher = this.watch(workspacePath, { recursive: true }, function (evt: any, name: any) {
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
                THIS.taskToFile[task] = name;
                vscode.commands.executeCommand("workbench.action.tasks.runTask", task);
            }
        });
        this.watchers.push(watcher);
    }

    public getFilename(taskId : string): string | undefined {
        if (!taskId || !(taskId in this.taskToFile)) { return undefined; }
        return this.taskToFile[taskId];
    }

    public getDirname(taskId : string): string | undefined {
        if (!taskId || !(taskId in this.taskToFile)) { return undefined; }
        return path.dirname(this.taskToFile[taskId]);
    }

    public getBasename(taskId : string): string | undefined {
        if (!taskId || !(taskId in this.taskToFile)) { return undefined; }
        return path.basename(this.taskToFile[taskId]);
    }

    public getExtname(taskId : string): string | undefined {
        if (!taskId || !(taskId in this.taskToFile)) { return undefined; }
        return path.extname(this.taskToFile[taskId]);
    }

    public getFilenameWithoutExtension(taskId : string): string | undefined {
        if (!taskId || !(taskId in this.taskToFile)) { return undefined; }
        var data = path.parse(this.taskToFile[taskId]);
        return data.name;
    }

    public closeWatch() {
        for (var i = 0; i < this.watchers.length; i++) {
            var watcher = this.watchers[i];
            if (watcher && !watcher.isClosed()) {
                watcher.close();
            }
        }
        this.watchers = [];
        this.taskToFile = {};
    }
}
