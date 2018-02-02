#!/bin/sh

set -e

# so you can run this script from any folder and it will find the tmp dir
cd "`git rev-parse --show-toplevel`"

mkdir -p tmp
cd tmp

branch=master

VERSION=`git tag --list --points-at HEAD`

command=new
repo_folder=glimmer-blueprint-output
local_folder=my-app

git clone git@github.com:glimmerjs/$repo_folder.git --branch $branch
pushd $repo_folder
git rm -rf .
ember $command $local_folder --blueprint ../../ -skip-bower --skip-npm --skip-git
cp -r $local_folder/ .
rm -r $local_folder

git add --all
git commit --allow-empty --message $VERSION
git tag $VERSION
git push
git push --tags

popd
rm -rf $repo_folder
