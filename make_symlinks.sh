#! /bin/bash
# This is an utility script that can be used to link the unipept-web-components repository with
# this repository so that changes in the web-components are directly reflected in this project.
# Should only be used during development of the packages, the unipept-web-components package
# will be published on npm for production builds.

# This script assumes that the unipept-web-components project and the unipept-desktop project
# live in the same parent folder.

mkdir node_modules/unipept-web-components
ln -s ../../../unipept-web-components/dist ./node_modules/unipept-web-components/dist
ln -s ../../../unipept-web-components/package.json ./node_modules/unipept-web-components/package.json
