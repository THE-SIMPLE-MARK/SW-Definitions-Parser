#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

let inputPath;
let destPath;

async function getPaths() {
  const question1 = await inquirer.prompt({
    name: "inputPath",
    type: "input",
    message: "Stormworks definitions folder path:",
    default() {
      return "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stormworks\\rom\\data\\definitions";
    },
  })

  inputPath = question1.inputPath;

  const question2 = await inquirer.prompt({
    name: "destPath",
    type: "input",
    message: "Output folder path:",
    default() {
      return "Definitions folder";
    },
  })

  destPath = question2.destPath === "Definitions folder" ? question1.inputPath : question2.destPath;

  // make sure that the paths exist
  const folderCheckSpinner = createSpinner("Checking folders paths...").start();
  await sleep(1000);

  if (!existsSync(inputPath)) {
    folderCheckSpinner.error({ text: "The input path provided is not a valid folder path!" });
    process.exit(1);
  } else if (!existsSync(destPath)) {
    folderCheckSpinner.error({ text: "The destination path provided is not a valid folder path!" });
    process.exit(1);
  } else {
    folderCheckSpinner.success({ text: "All folder paths are valid!" })
  }
}

async function parseDefinitions() {
  const spinner = createSpinner("Parsing XML definitions... [0%]").start();
  const finalJson = {
    definitions: [],
  }

  const fileNames = readdirSync(inputPath).filter(fileName => fileName.endsWith(".xml"));
  let finishedFiles = 0;

  for (const fileName of fileNames) {
    const fileData = readFileSync(`${inputPath}${inputPath.endsWith("\\") ? "" : "\\"}${fileName}`, { encoding: "utf8" });

    // parse XML to a JS Object
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix : "_",
    });

    const { definition } = await parser.parse(fileData);

    finalJson.definitions.push({
      name: definition._name,
      description: definition.tooltip_properties._description,
      shortDescription: definition.tooltip_properties._short_description,
      type: definition._type,
      mass: definition._mass,
      value: definition._value,
      flags: definition._flags,
      tags: definition._tags,
      surfaces: definition.surfaces.surface,
      buoyancySurfaces: definition.buoyancy_surfaces.surface,
      voxels: definition.voxels.voxel,
      voxelMin: definition.voxel_min,
      voxelMax: definition.voxel_max,
      voxelPhysMin: definition.voxel_physics_min,
      voxelPhysMax: definition.voxel_physics_max,
      bbPhysMin: definition.bb_physics_min,
      bbPhysMax: definition.bb_physics_max,
      compartmentSamplePos: definition.compartment_sample_pos,
      constraintPosParent: definition.constraint_pos_parent,
      constraintPosChild: definition.constraint_pos_child,
    })

    await sleep(1);
    finishedFiles++;
    spinner.update({
      text: `Parsing XML definitions... [${Math.round(finishedFiles / fileNames.length * 100)}%]`
    })
  }

  writeFileSync(`${destPath}\\output.json`, JSON.stringify(finalJson, null, 2), { encoding: "utf8" });

  spinner.success({ text: `Successfully parsed all XML definitions. An ${chalk.blue("output.json")} file is now available at the chosen destination folder.` })
}

await getPaths();
await parseDefinitions(inputPath, destPath);