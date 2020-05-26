# Unipept Desktop
This is the Unipept Desktop project. This application is a part of the [Unipept ecosystem](https://unipept.ugent.be) and aims at large-throughput metaproteomics data analysis.

## Run the application
1. Clone this repository.
2. Navigate to the repository's directory
3. Run `npm install` to install all dependencies.
4. Run `npm run postinstall` to rebuild native dependencies for node version of the Electron app.
5. Run `npx patch-package` to apply changes made to node modules in order to fix build issues.
6. Run `npm run electron:serve` to run the desktop application itself.
