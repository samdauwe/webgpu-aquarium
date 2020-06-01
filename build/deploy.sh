#!/usr/bin/env bash

# Environment
BUILD_DIR="dist"
RELEASE_BRANCH="gh-pages"
VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# Script
git fetch origin $RELEASE_BRANCH
git add -f $BUILD_DIR
tree=$(git write-tree --prefix=$BUILD_DIR)
git reset -- $BUILD_DIR
identifier=$(git describe --dirty --always)
commit=$(git commit-tree -p refs/remotes/origin/$RELEASE_BRANCH -m "Deploy $identifier as v$VERSION" $tree)
git update-ref refs/heads/$RELEASE_BRANCH $commit
git tag -a "v$VERSION" -m "Release tag for $VERSION" $commit
git push --follow-tags origin refs/heads/$RELEASE_BRANCH