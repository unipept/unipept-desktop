#! /bin/bash

set -e
set -o pipefail

# This is an utility script that can be used to link the unipept-web-components repository with
# this repository so that changes in the web-components are directly reflected in this project.
# Should only be used during development of the packages, the unipept-web-components package
# will be published on npm for production builds.

# This script assumes that the unipept-web-components project and the unipept-desktop project
# live in the same parent folder.

rm -fR node_modules/unipept-web-components

# First install each of the dependencies listed in the web-components package
cat "./../unipept-web-components/package.json" | jq ".dependencies" | grep -v "^[{|}]" | cut -d":" -f1 | sed "s/^ *//" | xargs npm install --no-save

# Then, link the two packages together
mkdir node_modules/unipept-web-components
ln -s ../../../unipept-web-components/src ./node_modules/unipept-web-components/src
ln -s ../../../unipept-web-components/package.json ./node_modules/unipept-web-components/package.json
