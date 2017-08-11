#!/bin/bash

# based on https://gist.github.com/felipernb/968fafb2eb8f8fa741847a2eb87e62e5

function is_mac() {
    if [ `uname -s` = "Darwin" ]; then
      return 0
    else
      return 1
    fi
}

ROOT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

function import_repo() {
    PKG_NAME=$1
    if is_mac; then
        TMP_DIR=$( mktemp -d -t import-repo )
    else
        TMP_DIR=$( mktemp -d -t import-repo.XXXXXX )
    fi

    echo "Importing ${USER}/${PKG_NAME}"

    git clone https://github.com/$USER/$PKG_NAME $TMP_DIR
    cd $TMP_DIR
    ESCAPED_PKG_NAME=`node -pe "require('./package.json').name" | sed 's/\-/\\\-/g'`

    echo "Rewriting history for ${PKG_NAME}"

    ESCAPED_PATH="packages/${ESCAPED_PKG_NAME}"
    git filter-branch --prune-empty --tree-filter '
if [ ! -e '"$ESCAPED_PATH"' ]; then
    mkdir -p '"$ESCAPED_PATH"'
    git ls-tree --name-only $GIT_COMMIT | xargs -I files mv files '"$ESCAPED_PATH"'
fi'

    if [ $? -eq 0 ]; then
        cd $ROOT_DIR
        git remote add -f $PKG_NAME $TMP_DIR
        git merge --allow-unrelated-histories -m "Import ${ESCAPED_PATH}" $PKG_NAME/master
        git remote remove $PKG_NAME
        rm -rf $TMP_DIR
    else
        echo "Failed to rewrite history, aborting."
        exit 1
    fi
}

USER="glimmerjs"
LIBS=("glimmer-component glimmer-application")

for lib in $LIBS; do
    import_repo $lib
done;

# Remove nested gitignore files
rm packages/**/*.gitignore
rm packages/*/*/tsconfig.json
rm packages/*/*/tsconfig.tests.json
rm packages/*/*/tslint.json
rm packages/*/*/yarn.lock
rm packages/*/*/ember-cli-build.js
rm packages/*/*/.travis.yml
rm packages/*/*/CODE_OF_CONDUCT.md
rm packages/*/*/LICENSE
rm -rf packages/*/*/tmp
rm -rf packages/*/*/dist

