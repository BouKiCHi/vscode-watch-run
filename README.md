# watch-run README

## Features

Monitor any files or directories and execute tasks when that is changed. 

![save and run](images/image01.gif)

## Extension Settings Example

**Note:** Reload window when settings.json are changed.

* `(project root)/.vscode/settings.json` : list of target items.

```
{
    // reload window is required to apply.
    "watch-run.targetList": [
        {
            "target": "**/*.js",
            "task": "echo_js"
        },
        {
            "target": "index.html",
            "task": "open_index_html"
        }
    ]
}
```

* `(project root)/.vscode/tasks.json` : Write tasks here. usually generated from Configure Tasks menu.  
```
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "label": "echo_js",
            "type": "shell",
            "command": "echo \"js is edited\""
        } ,
        {
            "label": "open_index_html",
            "type": "shell",
            "command": "start index.html"
        }
    ]
}
```

* edit somewhere_dir/something.js
 executes the task labeled "echo_js".

* edit (workspace_root)/index.html
 executes the task labeled "open_index_html" and finally open index.html in browser.(in Windows)  


## Release Notes

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
