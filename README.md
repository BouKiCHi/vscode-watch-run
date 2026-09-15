# watch-run

`watch-run` は、ワークスペース内のファイル変更を監視し、変更されたファイルに対応する VS Code task を実行する拡張機能です。

ファイルの種類ごとに実行する task を割り当てられます。
変更されたファイルのパスを task へ渡すこともできます。

![save and run](images/image01.gif)

## 必要な環境

- VS Code 1.107 以降
- フォルダーまたはワークスペースを開いた状態
- 実行する task を `.vscode/tasks.json` に定義できること

## インストール

VS Code の拡張機能ビューで `watch-run` を検索してインストールします。

拡張機能を有効にした後、監視対象と実行する task を設定します。

## 基本設定

ワークスペースの `.vscode/settings.json` に `watch-run.targetList` を追加します。

```jsonc
{
    "watch-run.targetList": [
        {
            "target": "**/*.txt",
            "task": "show_filename"
        },
        {
            "target": "/js/*.js",
            "task": "run_js"
        },
        {
            "regexp": "index-\\d+\\.html",
            "task": "open_html"
        }
    ]
}
```

各項目には次のプロパティを指定します。

| プロパティ | 必須 | 説明 |
| --- | --- | --- |
| `target` | どちらか一方 | glob パターンで監視対象を指定します。 |
| `regexp` | どちらか一方 | JavaScript の正規表現で監視対象を指定します。大文字と小文字は区別しません。 |
| `task` | 必須 | 変更時に実行する task の `label` を指定します。 |

`target` と `regexp` を両方指定した場合は、`target` が使われます。
`target` には `glob-to-regexp` が解釈できる glob パターンを指定します。

パスはワークスペースルートからの相対パスを使って照合します。
先頭に `/` が付くため、ルート直下のファイルや特定のディレクトリを指定するときは、`/index.html` や `/js/*.js` のように書きます。
`**/*.txt` のようなパターンは、ワークスペース内の任意の階層にある `.txt` ファイルに一致します。

## task の定義

実行する task は `.vscode/tasks.json` に定義します。
`watch-run.targetList[].task` の値と、task の `label` は完全に一致させてください。

次の例では、テキストファイルの変更時にファイル名を表示し、JavaScript ファイルの変更時に Node.js で実行します。

```jsonc
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "show_filename",
            "type": "shell",
            "command": "echo File: ${input:show_filename_file}",
            "problemMatcher": []
        },
        {
            "label": "run_js",
            "type": "shell",
            "command": "node ${input:run_js_file}",
            "problemMatcher": []
        }
    ],
    "inputs": [
        {
            "id": "show_filename_file",
            "type": "command",
            "command": "watch-run.getFilename",
            "args": "show_filename"
        },
        {
            "id": "run_js_file",
            "type": "command",
            "command": "watch-run.getFilename",
            "args": "run_js"
        }
    ]
}
```

`inputs[].args` には、パスを取得したい task の `label` を指定します。
その task が監視対象に一致した後であれば、`${input:...}` を使って変更されたファイルのパスを取得できます。

## task を手動で実行する

コマンドパレットから `watch-run: Run Task` を実行すると、ワークスペースで利用できる task の一覧が表示されます。
task を選択すると、ファイル変更を待たずに実行できます。

エディター右上の再生ボタン（`$(play)`）からも同じ操作を実行できます。

## task を編集する

コマンドパレットから `watch-run: Edit Task` を実行し、task を選択すると、定義元の `.vscode/tasks.json` または `.code-workspace` が開いて対象の `label` が選択されます。
task の command やその他の設定は、開いたタスク定義ファイルで編集します。
編集元を特定できない自動検出taskや拡張機能由来のtaskは、一覧に表示されません。

## task を追加する

コマンドパレットから `watch-run: Add Task` を実行すると、`.vscode/tasks.json` に編集用のひな形が追加されます。
task の `label` や command を入力する必要はありません。

追加されるひな形には、変更されたファイルのパスを取得する `inputs` と、その値を表示する shell task が含まれます。
コメントを参考に `label`、command、`inputs[].args` を編集し、保存してから使用してください。

```jsonc
{
    "tasks": [
        {
            // labelを変更したら、inputs[].argsにも同じ値を設定してください。
            "label": "watch-run-task",
            "type": "shell",
            // 実行するコマンドに置き換えてください。
            "command": "echo ${input:watchRunFilename}",
            "problemMatcher": []
        }
    ],
    "inputs": [
        {
            "id": "watchRunFilename",
            "type": "command",
            "command": "watch-run.getFilename",
            // 上のtaskのlabelと同じ値を設定してください。
            "args": "watch-run-task"
        }
    ]
}
```

既存の `tasks.json` がある場合は、そのコメントや JSONC の形式をできるだけ維持して追記します。
同じ `label` や `inputs[].id` がすでに存在する場合は、重複しない名前を生成します。

## 変数の一覧

`tasks.json` で使える変数には、VS Codeが提供する標準変数と、watch-runが提供する入力用コマンドがあります。

### watch-runの入力値

`inputs[].type` に `command` を指定し、`command` と `args` を設定します。
task の `command` や `args` では、対応する `id` を `${input:入力ID}` の形式で参照します。

| command | 取得する値 |
| --- | --- |
| `watch-run.getFilename` | 変更されたファイルのパス |
| `watch-run.getDirname` | 変更されたファイルがあるディレクトリのパス |
| `watch-run.getBasename` | ファイル名と拡張子。例：`file.ext` |
| `watch-run.getExtname` | 拡張子。例：`.ext` |
| `watch-run.getFilenameWithoutExtension` | 拡張子を除いたファイル名。例：`file` |

`args` には、値を取得したい task の `label` を指定します。
たとえば、次の設定では `build` task が直前に検出したファイルのパスを渡します。
指定した task がまだファイル変更を検出していない場合、値は取得できません。

```jsonc
{
    "label": "build",
    "type": "shell",
    "command": "node build.js ${input:buildFile}",
    "problemMatcher": []
}
```

```jsonc
{
    "id": "buildFile",
    "type": "command",
    "command": "watch-run.getFilename",
    "args": "build"
}
```

`watch-run.getFilename` などはwatch-run独自のコマンドです。
一方、`${input:buildFile}` はVS Codeが提供する入力変数の記法であり、入力値をtaskのcommandへ差し込むために使います。

### VS Codeの標準変数

次の変数は、VS Codeのtaskで使用できます。

| 変数 | 取得する値 |
| --- | --- |
| `${userHome}` | ユーザーのホームディレクトリ |
| `${workspaceFolder}` | taskが属するワークスペースフォルダーのパス |
| `${workspaceFolderBasename}` | ワークスペースフォルダー名 |
| `${file}` | アクティブエディターで開いているファイルのパス |
| `${fileWorkspaceFolder}` | アクティブなファイルが属するワークスペースフォルダーのパス |
| `${relativeFile}` | `workspaceFolder` からのアクティブなファイルの相対パス |
| `${relativeFileDirname}` | `workspaceFolder` からのアクティブなファイルのディレクトリ相対パス |
| `${fileBasename}` | アクティブなファイルのファイル名と拡張子 |
| `${fileBasenameNoExtension}` | 拡張子を除いたアクティブなファイル名 |
| `${fileExtname}` | アクティブなファイルの拡張子 |
| `${fileDirname}` | アクティブなファイルがあるディレクトリのパス |
| `${fileDirnameBasename}` | アクティブなファイルがあるディレクトリ名 |
| `${cwd}` | VS Code起動時のtask runnerのカレントディレクトリ |
| `${lineNumber}` | アクティブなファイルで選択している行番号 |
| `${columnNumber}` | アクティブなファイルで選択している列番号 |
| `${selectedText}` | アクティブなエディターで選択しているテキスト |
| `${execPath}` | 実行中のVS Codeのパス |
| `${defaultBuildTask}` | 既定のbuild taskの名前 |
| `${pathSeparator}` | パス区切り文字。Windowsでは `\\`、macOSとLinuxでは `/` |
| `${/}` | `${pathSeparator}` の短縮記法 |

ワークスペースフォルダー名を指定すると、マルチルートワークスペース内の別フォルダーを参照できます。
たとえば `${workspaceFolder:Server}` は `Server` フォルダーのパスになります。

環境変数は `${env:変数名}`、VS Codeの設定値は `${config:設定名}` で参照します。
入力変数は `${input:入力ID}` で参照します。
VS Codeのコマンドが文字列を返す場合は、`${command:コマンドID}` でも参照できます。
`inputs` で使える入力の種類は `promptString`、`pickString`、`command` です。

`${file}` などの標準変数はアクティブエディターのファイルを基準にします。
監視によって変更されたファイルを基準にする場合は、watch-runの `watch-run.getFilename` などを使ってください。

VS Codeの標準変数は、`tasks.json` の文字列値で補完候補を表示すると全一覧を確認できます。
詳細は [VS CodeのVariables Reference](https://code.visualstudio.com/docs/reference/variables-reference) を参照してください。

## ファイルを監視対象に登録する

Explorer でファイルを右クリックし、`watch-run: Register File` を実行します。
実行する task を選択すると、ファイルがワークスペース設定の `watch-run.targetList` に登録されます。

コマンドパレットから `watch-run: Register File` を実行した場合は、現在アクティブなエディターで開いているファイルを登録します。
アクティブなファイルがない場合は、ファイルを開いてから実行してください。

たとえば、`src/example.ts` を `build` task に登録すると、次の設定が追加されます。

```jsonc
{
    "watch-run.targetList": [
        {
            "target": "/src/example.ts",
            "task": "build"
        }
    ]
}
```

登録したファイルを右クリックして `watch-run: Unregister File` を実行すると、登録を解除できます。
同じファイルを別の task に登録すると、既存の task が置き換わります。

登録と解除の後は、監視設定を自動的に読み直します。

## 設定を反映する

`settings.json` の `watch-run.targetList` を変更したら、コマンドパレットから `watch-run: Apply Settings` を実行します。

このコマンドは現在の監視を停止し、設定を読み直して監視を開始します。
設定変更後に実行しないと、変更前の監視条件が使われ続けます。

## よく使う設定例

### 特定の拡張子を監視する

```jsonc
{
    "watch-run.targetList": [
        {
            "target": "**/*.html",
            "task": "open_html"
        }
    ]
}
```

### 特定のディレクトリを監視する

```jsonc
{
    "watch-run.targetList": [
        {
            "target": "/scripts/*.js",
            "task": "run_js"
        }
    ]
}
```

### 正規表現で連番ファイルを監視する

```jsonc
{
    "watch-run.targetList": [
        {
            "regexp": "index-\\d+\\.html",
            "task": "open_html"
        }
    ]
}
```

正規表現は変更されたパス全体に対して評価されます。
`index-1234.html` のようにファイル名の一部を照合する場合は、上の例のようにファイル名だけを指定できます。

## 複数フォルダーのワークスペース

マルチルートワークスペースでは、すべてのワークスペースフォルダーを監視します。

同じ task の `label` を複数のフォルダーで使うと、その task に対して最後に検出したファイルのパスが保持されます。
フォルダーごとに変更ファイルを区別したい場合は、task の `label` を分けてください。

## 注意点

- 監視対象に一致した変更イベントごとに task を実行します。task の実行中に追加の変更が発生した場合も、イベントは自動的にはまとめられません。
- `target` の glob は大文字と小文字を区別します。
- `regexp` は大文字と小文字を区別しません。
- `task` に指定した task が存在しない場合、VS Code は task を実行できません。
- task の shell command は、通常の VS Code task と同じ権限と環境で実行されます。

## 開発

```bash
npm install
npm run compile
npm run lint
npm test
```

## リリース履歴

[CHANGELOG.md](CHANGELOG.md)
