const shell = require('shelljs');
const core = require('@actions/core');
const github = require('@actions/github');
const path = require('path');

function printSoftEnv(name, command) {
    shell.exec('echo "\033[1m' + name + ':\033[0m \n`' + command + '`"')
}

function intelligentSelectScheme(schemes, workspacePath) {
    if (schemes.length < 1) {
        return null
    }
    const workspaceName = path.parse(workspacePath).name
    const podTemplateDefaultScheme = workspaceName + '-Example'
    if (schemes.includes(podTemplateDefaultScheme)) { // For pod-template project
        return podTemplateDefaultScheme
    }
    if (schemes.includes(workspaceName)) {
        return workspaceName
    }
    return schemes[0]
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
    scheme = intelligentSelectScheme(schemes, workspace)
    if (!scheme) {
        core.setFailed('Unable to find the scheme. Did you set with.scheme?')
        process.exit(1)
    }
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
    const buildResultCode = shell.exec(buildCommand).code
    if (buildResultCode != 0) {
        core.setFailed('test fail with exit code: ' + buildResultCode)
    }
}

if (core.getInput('lint')) {
    var additionLintParams = core.getInput('additional_lint_params')
    shell.echo("\033[1m=== Lint ===\033[0m")
    const lintCommand = 'pod lib lint ' + additionLintParams
    console.log(lintCommand)
    const lintResultCode = shell.exec(lintCommand).code
    if (lintResultCode != 0) {
        core.setFailed('lint fail with exit code: ' + lintResultCode)
    }
}

