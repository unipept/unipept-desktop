import mkdirp from "mkdirp";
import { promises as fs } from "fs";
import path from "path";

const { app } = require('@electron/remote');

import clover1a from "raw-loader!@/demo_project/clover/clover_1a.pep";
import clover1b from "raw-loader!@/demo_project/clover/clover_1b.pep";
import clover2 from "raw-loader!@/demo_project/clover/clover_2.pep";
import soybean1 from "raw-loader!@/demo_project/soybean/soybean_1.pep";
import soybean2 from "raw-loader!@/demo_project/soybean/soybean_2.pep";

import ProjectManager from "@/logic/filesystem/project/ProjectManager";
import FileSystemUtils from "@/logic/filesystem/FileSystemUtils";

export default class DemoProjectManager {
    /**
     * Creates a new project in the temp folder of this application.
     *
     * @return The project location on the filesystem. This location can be used to open the project later on.
     */
    public async initializeDemoProject(): Promise<string> {
        const tempFolder = app.getPath("temp");
        const demoFolder = path.join(tempFolder, "Demo project/");

        // Create new subdirectory inside of the temp folder
        await mkdirp(demoFolder);

        // Clear the folder if it already exists...
        await FileSystemUtils.deleteRecursive(demoFolder);

        const projectManager = new ProjectManager();
        await projectManager.setUpDatabase(demoFolder);

        await mkdirp(demoFolder + "Clover");

        // Now copy all demo files to this directory
        await fs.writeFile(path.join(demoFolder, "Clover", "Clover 1a.pep"), clover1a);
        await fs.writeFile(path.join(demoFolder, "Clover", "Clover 1b.pep"), clover1b);
        await fs.writeFile(path.join(demoFolder, "Clover", "Clover 2.pep"), clover2);

        await mkdirp(demoFolder + "Soybean");

        await fs.writeFile(path.join(demoFolder, "Soybean", "Soybean 1.pep"), soybean1);
        await fs.writeFile(path.join(demoFolder, "Soybean", "Soybean 2.pep"), soybean2);

        return demoFolder;
    }
}
