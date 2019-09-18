const shell = require('shelljs');
const core = require('@actions/core');
const github = require('@actions/github');

function printSoftEnv(name, command) {
    shell.exec('echo "\033[1m' + name + ':\033[0m \n`' + command + '`"')
}

shell.echo("\033[1m=== Software Environments ===\033[0m")

printSoftEnv("Xcode Version", "xcodebuild -version")
printSoftEnv("CocoaPods Version", "pod --version")
printSoftEnv("xcpretty Version", "xcpretty --version")

shell.echo("\033[1m=== SDKs ===\033[0m")
shell.exec("xcodebuild -showsdks")

shell.echo("\033[1m=== Devices ===\033[0m")
shell.exec("instruments -s devices")

shell.echo("\033[1m=== Inputs ===\033[0m")
var workspace = core.getInput('workspace')
if (!workspace) {
    const workspaceFileName = shell.ls('Example').filter(function(file) { return file.match(/\.xcworkspace$/); })
    if (!workspaceFileName) {
        core.setFailed('Unable to find the workspace. Did you set with.workspace?')
        process.exit(1)
    }
    workspace = "Example/" + workspaceFileName
    core.warning('No `workspace` specified. use "' + workspace + '"')
}

var scheme = core.getInput('scheme')
if (!scheme) {
    const workspaceInfo = JSON.parse(shell.exec('xcodebuild -workspace ' + workspace + ' -list -json', {silent: true}).stdout)
    const schemes = workspaceInfo.workspace.schemes
    console.log('find schemes: ' + JSON.stringify(schemes))
    if (schemes.length < 1) {
        core.setFailed('Unable to find the scheme. Did you set with.scheme?')
        process.exit(1)
    }
    scheme = schemes[0]
    core.warning('No `scheme` specified. use "' + scheme + '"')
}

var useModernBuildSystem
if (core.getInput('use_modern_build_system') === true) {
    useModernBuildSystem = "YES"
} else {
    useModernBuildSystem = "NO"
}

if (core.getInput('test')) {
    var additionXcodeBuildParams = core.getInput('additional_build_params')
    shell.echo("\033[1m=== Test ===\033[0m")
    const buildCommand = 'set -o pipefail && xcodebuild test -enableCodeCoverage YES -workspace ' + workspace + ' -scheme ' + scheme + ' ONLY_ACTIVE_ARCH=NO CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO -UseModernBuildSystem=' + useModernBuildSystem + ' ' + additionXcodeBuildParams + ' | xcpretty --color'
    console.log(buildCommand)
    if (shell.exec(buildCommand).code != 0) {
        core.setFailed('test fail')
    }
}

if (core.getInput('lint')) {
    var additionLintParams = core.getInput('additional_lint_params')
    shell.echo("\033[1m=== Lint ===\033[0m")
    const lintCommand = 'pod lib lint ' + additionLintParams
    console.log(lintCommand)
    if (shell.exec(lintCommand) != 0) {
        core.setFailed('lint fail')
    }
}

