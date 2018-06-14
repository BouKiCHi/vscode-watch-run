# watch-run README

## Features

Monitor any files or directories and execute tasks when that is changed. 

![save and run](images/image01.gif)

## Extension Settings Example

**Note:** Reload window when settings.json are changed.

* `(project root)/.vscode/settings.json` : list of target items.

```
{
    "watch-run.targetList": [
        {
            "target": "**/*.mml",
            "task": "compileMml"
        },
        {
            "target": "**/*.h",
            "task": "compileHeader"
        }
    ]
}
```

* `(project root)/.vscode/tasks.json` : Write tasks here. usually generated from Configure Tasks menu.  
```

{
    // tasks.json for mml compiler
    // ./run68/run68.exe
    // ./note/note.x
    "version": "2.0.0",
    "tasks": [
        {
            "label": "compileMml",
            "type": "shell",
            // Rewrite as necessary
            "command": "cmd /c ${workspaceRoot}\\batch\\play.bat ${workspaceRoot} ${file}",
            // "command": "cmd /c ${workspaceRoot}\\run68\\run68.exe ${workspaceRoot}\\note\\note.x ${file} > compile.log ; type compile.log",
            "problemMatcher": {
                "owner": "mml extension",
                "fileLocation": "absolute",
                "pattern": {
                    "regexp": "^(.*)\\s+(\\d+):\\s+(.*)$",
                    "severity": 0,
                    "file": 1,
                    "line": 2,
                    "message": 3,
                    "column": 0
                }
            },
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```
## Release Notes

### 0.2.1
Added Example.

### 0.2.0
Updated package.

### 0.0.2
Added description.

### 0.0.1
Initial release.
