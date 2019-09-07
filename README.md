# watch-run README

## Features

This extension will watch specified file and execute the task when that is changed. 

![save and run](images/image01.gif)

## Extension Settings Example

**Note:** If you change settings.json, call "Apply settings" from the menu.

* `(project root)/.vscode/settings.json` : list of target items.

```
{
    // If you change settings.json, call "Apply settings" from the menu.
    "watch-run.targetList": [
        {
            "target": "**/*.js",
            "task": "run_js"
        },
        {
            "target": "/index.html",
            "task": "open_index_html"
        },
        {
            "regexp": "index-\\d+.html",
            "task": "open_index_number_html"
        }
    ]
}
```
## tasks.json settings example

* `(project root)/.vscode/tasks.json` : Write tasks here. usually generated from Configure Tasks menu.  
```
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "label": "run_js",
            "type": "shell",
            "command": "node ${file}"
        },
        {
            "label": "open_index_html",
            "type": "shell",
            "command": "start ${file}"
        },
        {
            "label": "open_index_number_html",
            "type": "shell",
            "command": "start ${file}"
        }
    ]
}
```

## How work this example?

* edit somewhere_dir/something.js
 executes JavaScript on node command in the task labeled "run_js".

* edit (workspace_root)/index.html
 executes the task labeled "open_index_html" to open index.html in browser.(in Windows)

* edit somewhere_dir/index-1234.html
  open index-{number}.html in browser (Windows)

## Release Notes

### 0.4.0
Added Apply Setting to Menu.
Added RegExp field to Setting.
Fixed that glob pattern doesn't work properly.

### 0.3.0
Changed watch library to node-watch.

### 0.2.5
Added multi-root support.
Added internal command support.

### 0.2.2
Fixed a bug of ignoring directory/file which starts with dot.

### 0.2.1
Added Example.

### 0.2.0
Updated package.

### 0.0.2
Added description.

### 0.0.1
Initial release.
