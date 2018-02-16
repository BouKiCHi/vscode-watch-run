# watch-run README

## Features

Monitor files and directories and execute tasks when changed. 

![save and run](images/image01.gif)

## Extension Settings

**Note:** reload window when settings are changed.

* `watch-run.targetList` : list of target items.
```
// reload window when settings are changed
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

## Release Notes

### 0.0.1
Initial release.
