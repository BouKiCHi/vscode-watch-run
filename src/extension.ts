'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import {
    applyEdits,
    findNodeAtLocation,
    modify,
    parse,
    parseTree,
    type Node,
    type ParseError,
} from 'jsonc-parser';
import { Watcher } from './Watcher';

export function activate(context: vscode.ExtensionContext) {
    var w = new Watcher();
    context.subscriptions.push({
        dispose: () => w.closeWatch(),
    });

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

    function reloadWatch() {
        w.closeWatch();
        startWatch();
    }

    async function pickTask(editableOnly = false): Promise<vscode.Task | undefined> {
        let tasks = await vscode.tasks.fetchTasks();
        if (editableOnly) {
            const editableTasks: vscode.Task[] = [];
            for (const task of tasks) {
                const uri = getTaskDefinitionUri(task);
                if (!uri) { continue; }

                let document: vscode.TextDocument;
                try {
                    document = await vscode.workspace.openTextDocument(uri);
                } catch {
                    continue;
                }

                if (findTaskPropertyNode(
                    document.getText(),
                    task.name,
                    'label',
                    getTaskPath(task),
                )) {
                    editableTasks.push(task);
                }
            }
            tasks = editableTasks;
        }
        if (tasks.length === 0) {
            vscode.window.showWarningMessage(
                editableOnly
                    ? 'watch-run: No editable VS Code tasks are available.'
                    : 'watch-run: No VS Code tasks are available.',
            );
            return undefined;
        }

        const items = tasks.map((task) => ({
            label: task.name,
            description: getTaskDescription(task),
            task,
        }));
        const item = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a task',
            matchOnDescription: true,
        });
        return item?.task;
    }

    async function pickFile(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
        if (uri) { return uri; }

        const activeUri = vscode.window.activeTextEditor?.document.uri;
        if (activeUri?.scheme === 'file') {
            return activeUri;
        }

        vscode.window.showWarningMessage('watch-run: Open a file in the active editor first.');
        return undefined;
    }

    function getTargetForFile(uri: vscode.Uri): string | undefined {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) { return undefined; }

        const relativePath = path.relative(
            workspaceFolder.uri.fsPath,
            uri.fsPath,
        ).split(path.sep).join('/');
        if (!relativePath || relativePath === '..' || relativePath.startsWith('../')) {
            return undefined;
        }
        return `/${relativePath}`;
    }

    function getTasksFileUri(folder: vscode.WorkspaceFolder): vscode.Uri {
        return vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');
    }

    function getTaskDefinitionUri(task: vscode.Task): vscode.Uri | undefined {
        if (task.scope && typeof task.scope !== 'number') {
            return getTasksFileUri(task.scope);
        }
        if (task.scope === vscode.TaskScope.Workspace) {
            const workspaceFile = vscode.workspace.workspaceFile;
            if (workspaceFile && workspaceFile.scheme === 'file') {
                return workspaceFile;
            }
        }
        return undefined;
    }

    function getTaskDescription(task: vscode.Task): string {
        const source = String(task.source);
        if (task.scope && typeof task.scope !== 'number') {
            return `${source} (${task.scope.name})`;
        }
        if (task.scope === vscode.TaskScope.Workspace) {
            return `${source} (workspace)`;
        }
        return source;
    }

    function getTaskPath(task: vscode.Task): string[] {
        return task.scope === vscode.TaskScope.Workspace
            ? ['tasks', 'tasks']
            : ['tasks'];
    }

    function findTaskPropertyNode(
        text: string,
        taskName: string,
        property: string,
        taskPath: string[] = ['tasks'],
    ): Node | undefined {
        const errors: ParseError[] = [];
        const tree = parseTree(text, errors, { allowTrailingComma: true });
        if (!tree || errors.length > 0) { return undefined; }

        const tasksNode = findNodeAtLocation(tree, taskPath);
        const taskNode = tasksNode?.children?.find((candidate) => {
            const labelNode = findNodeAtLocation(candidate, ['label']);
            return labelNode?.value === taskName;
        });
        return taskNode ? findNodeAtLocation(taskNode, [property]) : undefined;
    }

    function findInputPropertyNode(text: string, inputId: string, property: string): Node | undefined {
        const errors: ParseError[] = [];
        const tree = parseTree(text, errors, { allowTrailingComma: true });
        if (!tree || errors.length > 0) { return undefined; }

        const inputsNode = findNodeAtLocation(tree, ['inputs']);
        const inputNode = inputsNode?.children?.find((candidate) => {
            const idNode = findNodeAtLocation(candidate, ['id']);
            return idNode?.value === inputId;
        });
        return inputNode ? findNodeAtLocation(inputNode, [property]) : undefined;
    }

    function insertCommentBeforeNode(text: string, node: Node | undefined, comment: string): string {
        if (!node) { return text; }
        const lineStart = text.lastIndexOf('\n', node.offset) + 1;
        const line = text.slice(lineStart, node.offset);
        const indent = line.match(/^\s*/)?.[0] ?? '';
        const eol = text.includes('\r\n') ? '\r\n' : '\n';
        return `${text.slice(0, lineStart)}${indent}${comment}${eol}${text.slice(lineStart)}`;
    }

    async function openTaskDefinition(task: vscode.Task): Promise<void> {
        const uri = getTaskDefinitionUri(task);
        if (!uri) {
            vscode.window.showWarningMessage('watch-run: The task definition file could not be determined.');
            return;
        }

        let document: vscode.TextDocument;
        try {
            document = await vscode.workspace.openTextDocument(uri);
        } catch {
            vscode.window.showWarningMessage(`watch-run: Could not open ${uri.fsPath}.`);
            return;
        }

        const editor = await vscode.window.showTextDocument(document);
        const labelNode = findTaskPropertyNode(
            document.getText(),
            task.name,
            'label',
            getTaskPath(task),
        );
        if (!labelNode) {
            vscode.window.showInformationMessage(`watch-run: Could not find task "${task.name}" in ${uri.fsPath}.`);
            return;
        }

        const start = document.positionAt(labelNode.offset);
        const end = document.positionAt(labelNode.offset + labelNode.length);
        const range = new vscode.Range(start, end);
        editor.selection = new vscode.Selection(start, end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }

    async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showWarningMessage('watch-run: Open a workspace before adding a task.');
            return undefined;
        }
        if (folders.length === 1) { return folders[0]; }

        const items = folders.map((folder) => ({
            label: folder.name,
            description: folder.uri.fsPath,
            folder,
        }));
        const item = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a workspace folder',
            matchOnDescription: true,
        });
        return item?.folder;
    }

    async function addTask(): Promise<void> {
        const folder = await pickWorkspaceFolder();
        if (!folder) { return; }

        const uri = getTasksFileUri(folder);
        let text = '{\n    "version": "2.0.0",\n    "tasks": []\n}\n';
        let document: vscode.TextDocument;
        try {
            document = await vscode.workspace.openTextDocument(uri);
            text = document.getText();
        } catch {
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder.uri, '.vscode'));
            await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
            document = await vscode.workspace.openTextDocument(uri);
        }

        const errors: ParseError[] = [];
        const parsed = parse(text, errors, { allowTrailingComma: true });
        if (!parsed || Array.isArray(parsed) || errors.length > 0) {
            vscode.window.showErrorMessage(`watch-run: ${uri.fsPath} is not valid JSONC.`);
            return;
        }

        if (parsed.tasks !== undefined && !Array.isArray(parsed.tasks)) {
            vscode.window.showErrorMessage(`watch-run: The tasks property in ${uri.fsPath} must be an array.`);
            return;
        }
        if (parsed.inputs !== undefined && !Array.isArray(parsed.inputs)) {
            vscode.window.showErrorMessage(`watch-run: The inputs property in ${uri.fsPath} must be an array.`);
            return;
        }

        const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const inputs = Array.isArray(parsed.inputs) ? parsed.inputs : [];
        const baseLabel = 'watch-run-task';
        let label = baseLabel;
        let suffix = 1;
        while (tasks.some((task: { label?: string }) => task.label === label)) {
            label = `${baseLabel}-${suffix++}`;
        }

        const baseInputId = 'watchRunFilename';
        let inputId = baseInputId;
        suffix = 1;
        while (inputs.some((input: { id?: string }) => input.id === inputId)) {
            inputId = `${baseInputId}${suffix++}`;
        }

        const newTask = {
            label,
            type: 'shell',
            command: `echo \${input:${inputId}}`,
            problemMatcher: [],
        };
        const newInput = {
            id: inputId,
            type: 'command',
            command: 'watch-run.getFilename',
            args: label,
        };
        const eol = text.includes('\r\n') ? '\r\n' : '\n';
        const formattingOptions = {
            insertSpaces: true,
            tabSize: 4,
            eol,
            insertFinalNewline: true,
        };
        const editPath = Array.isArray(parsed.tasks) ? ['tasks', -1] : ['tasks'];
        const editValue = Array.isArray(parsed.tasks) ? newTask : [newTask];
        let newText = applyEdits(text, modify(text, editPath, editValue, {
            formattingOptions,
        }));
        const inputPath = Array.isArray(parsed.inputs) ? ['inputs', -1] : ['inputs'];
        const inputValue = Array.isArray(parsed.inputs) ? newInput : [newInput];
        newText = applyEdits(newText, modify(newText, inputPath, inputValue, {
            formattingOptions,
        }));
        newText = insertCommentBeforeNode(
            newText,
            findTaskPropertyNode(newText, label, 'label'),
            '// labelを変更したら、inputs[].argsにも同じ値を設定してください。',
        );
        newText = insertCommentBeforeNode(
            newText,
            findTaskPropertyNode(newText, label, 'command'),
            '// 実行するコマンドに置き換えてください。',
        );
        newText = insertCommentBeforeNode(
            newText,
            findInputPropertyNode(newText, inputId, 'args'),
            '// 上のtaskのlabelと同じ値を設定してください。',
        );

        const editor = await vscode.window.showTextDocument(document);
        const applied = await editor.edit((editBuilder) => {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length),
            );
            editBuilder.replace(fullRange, newText);
        });
        if (!applied) {
            vscode.window.showErrorMessage(`watch-run: Could not insert the task template into ${uri.fsPath}.`);
            return;
        }

        const labelNode = findTaskPropertyNode(newText, label, 'label');
        if (labelNode) {
            const start = document.positionAt(labelNode.offset);
            const end = document.positionAt(labelNode.offset + labelNode.length);
            const range = new vscode.Range(start, end);
            editor.selection = new vscode.Selection(start, end);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        }
        vscode.window.showInformationMessage('watch-run: Inserted a task template. Review and save tasks.json.');
    }

    async function updateRegisteredFile(uri: vscode.Uri, taskName?: string): Promise<void> {
        const target = getTargetForFile(uri);
        if (!target) {
            vscode.window.showWarningMessage('watch-run: The file must be inside an open workspace.');
            return;
        }

        const config = vscode.workspace.getConfiguration('watch-run');
        const targetList = config.get<Array<{ target?: string; task?: string; regexp?: string }>>('targetList', []);

        if (taskName) {
            const existing = targetList.findIndex((item) => item.target === target);
            const entry = { target, task: taskName };
            if (existing >= 0) {
                targetList[existing] = entry;
            } else {
                targetList.push(entry);
            }
            await config.update('targetList', targetList, vscode.ConfigurationTarget.Workspace);
            reloadWatch();
            vscode.window.showInformationMessage(`watch-run: Registered ${target} for task ${taskName}.`);
            return;
        }

        const nextTargetList = targetList.filter((item) => item.target !== target);
        if (nextTargetList.length === targetList.length) {
            vscode.window.showInformationMessage(`watch-run: ${target} is not registered.`);
            return;
        }

        await config.update('targetList', nextTargetList, vscode.ConfigurationTarget.Workspace);
        reloadWatch();
        vscode.window.showInformationMessage(`watch-run: Unregistered ${target}.`);
    }

    startWatch();

    // applySettings 
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.applySettings', () => {
        vscode.window.showInformationMessage('watch-run: Apply Settings!');
        reloadWatch();
    }));

    // runTask
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.runTask', async () => {
        const task = await pickTask();
        if (task) {
            await vscode.tasks.executeTask(task);
        }
    }));

    // editTask
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.editTask', async () => {
        const task = await pickTask(true);
        if (task) {
            await openTaskDefinition(task);
        }
    }));

    // addTask
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.addTask', async () => {
        await addTask();
    }));

    // registerFile
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.registerFile', async (uri?: vscode.Uri) => {
        const file = await pickFile(uri);
        if (!file) { return; }

        const task = await pickTask();
        if (task) {
            await updateRegisteredFile(file, task.name);
        }
    }));

    // unregisterFile
    context.subscriptions.push(vscode.commands.registerCommand('watch-run.unregisterFile', async (uri?: vscode.Uri) => {
        const file = await pickFile(uri);
        if (file) {
            await updateRegisteredFile(file);
        }
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
