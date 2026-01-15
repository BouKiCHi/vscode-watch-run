'use strict';
import * as vscode from 'vscode';
import { Watcher } from './Watcher';

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

    // applySettings 
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.applySettings', () => {
        vscode.window.showInformationMessage('watch-run: Apply Settings!');
        w.closeWatch();
        startWatch();
    }));

    // getFilename
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.getFilename', (taskId) => {
        return w.getFilename(taskId);
    }));

    // getBasename
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.getBasename', (taskId) => {
        return w.getBasename(taskId);
    }));

    // getDirname
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.getDirname', (taskId) => {
        return w.getDirname(taskId);
    }));

    // getExtname
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.getExtname', (taskId) => {
        return w.getExtname(taskId);
    }));

    // getFilenameWithoutExtension
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.getFilenameWithoutExtension', (taskId) => {
        return w.getFilenameWithoutExtension(taskId);
    }));

}

export function deactivate() {
}