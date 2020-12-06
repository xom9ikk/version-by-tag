# version-by-tag@v1
> Github Action to generate version and unique version code based on the last tag

## 🔥 Usage
```yaml
jobs:
  build:
    runs-on: ubuntu-16.04

    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          path: custom_path_to_repo

      - name: Get version and version code
        uses: xom9ikk/version-by-tag@v1
        id: version_by_tag
        with:
          path: custom_path_to_repo
          isUseGithubRunNumber: false
          offset: 77

      - name: Some other action
        run: |
          echo "Tag: ${{ steps.version_by_tag.outputs.tag }}"
          echo "Semver: ${{ steps.version_by_tag.outputs.semver }}"
          echo "Version code: ${{ steps.version_by_tag.outputs.versionCode }}"
```

## ⭐ Quick results table

Instead of 1000 words of description, it is better to see how it works and what results are obtained:

| in:tag           | in:isUseGithubRunNumber | in:github.runNumber | in:offset     | out:versionCode |
|------------------|-------------------------|---------------------|---------------|-----------------|
| v1               | false                   | 0                   | 0             | 10000000        |
| v2.7             | false                   | 0                   | 0             | 20070000        |
| v3.9.2           | false                   | 0                   | 0             | 30090002        |
| 8.3.7            | false                   | 0                   | 0             | 80030007        |
| 4.2.6-alpha      | false                   | 0                   | 0             | 40020006        |
| v99.999.9999     | false                   | 0                   | 0             | 999999999       |
| v98.765.4321     | false                   | 0                   | 0             | 987654321       |
| v27.74.95        | false                   | 33                  | 0             | 270740095       |
| v27.74.95        | true                    | 33                  | 0             | 270740128       |
| v27.74.95        | true                    | 33 (ignore)         | 77            | 270740172       |

## ✨ Features
* ♻️ getting a tag from a repository;
* 🦄 creating a unique versionCode using the Github Action counter;
* 🎸 ability to set a custom offset for versionCode;
* 💎 simple API;

## 💡 Input

| property               | isRequired | default | comment                                                                                                      | example
|------------------------|:----------:|:-------:|--------------------------------------------------------------------------------------------------------------|:--------:
| `path`                 |      x     | ./      | the path to the git repository in which the last tag will be searched.                                       | ./custom/path/to/repo
| `isUseGithubRunNumber` |      x     | true    | indicates whether to use a variable ${{ github.run_number }} from Github Actions to generate a version code. | true
| `offset`               |      x     | 0       | value to be added to the version code. If not 0, then the isUseGithubRunNumber parameter will be ignored | 13

## 📦 Output

| property      | comment                                                  | example
|---------------|----------------------------------------------------------|---------
| `tag`         | the tag that was retrieved from the github repository.   | v2.3.26.3-alpha
| `semver`      | valid semver that was retrieved from the tag.            | 2.3.26
| `versionCode` | number that can be used as a build number (Android etc). | 2003026


## 🧩 Notes
This action gets the latest tag from the cloned repository using git. Any method can be used for cloning. Prefer [actions/checkout@v2](https://github.com/marketplace/actions/checkout).

Running this action sets the working directory from `path`. 

By default, during normal cloning, git does not load tags, so the command is executed: `git fetch --prune --unshallow`.
After that, we take the last tag for the current branch with the command: `git describe --tags --abbrev = 0`

Once we get a valid semver, we calculate the versionCode. To do this, use the formula `major * 1000000 + minor * 1000 + patch + [github.runNumber | offset]`. `major` /` minor` / `patch` are taken from the semver obtained earlier.

As an example, versionCode is later useful for changing the version of the gradle file for building an Android application. By default, `versionCode` will be unique, since the `${{ github.run_number }}` variable will be added to it. This behavior can be changed using the `isUseGithubRunNumber` flag.

Offset is also available. If it is other than 0, the `isUseGithubRunNumber` flag will be played. This is convenient in cases where, before using this GitHub Action, a version has already been compiled and published, which was calculated using the `versionCode` formula above.
Example of how to use and "unique" build number and small offset (123)

```yaml
# 1st step
# ...some instructions
- name: Calculate offset and set env
  run: echo OFFSET=`echo $((123 + ${{ github.run_number }}))` >> $GITHUB_ENV
```

```yaml
# 2nd step
# ...some instructions
- name: Get version and version code
  uses: xom9ikk/version-by-tag@v1
  id: version_by_tag
  with:
    path: custom_path_to_repo
    isUseGithubRunNumber: false
    offset: ${{ env.OFFSET }}
```

Or any similar cases you might come across...

# ✋ Warning
Google Play has limitations on the maximum value of versionCode.
> Warning: The greatest value Google Play allows for versionCode is 2100000000.

Because of this, there are some restrictions when using the library.

# 🙈 Restrictions

| property    | max value               |
|-------------|-------------------------|
| versionCode | 2100000000              |
| major       | 99                      | 
| minor       | 999                     |
| patch       | 9999                    |
| offset      | patch+offset < 9999     |
| run_number  | patch+run_number < 9999 |
