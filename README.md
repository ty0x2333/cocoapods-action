CocoaPods Action
===

#### Example

```yml
on: push
jobs:
  test:
    runs-on: macOS-latest
    steps:
    - uses: actions/checkout@master
    - uses: ty0x2333/cocoapods-action@master
      with:
        workspace: Example/Your-Project-Name.xcworkspace
        scheme: Your-Shared-Scheme
```