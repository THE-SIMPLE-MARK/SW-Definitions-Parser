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
      return inputPath;
    },
  })

  destPath = question2.destPath

  // make sure that the paths exist
  const folderCheckSpinner = createSpinner("Checking folders' paths...").start();
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

    const hasTags = definition?._tags !== ""

    finalJson.definitions.push({
      name: definition?._name ?? null,
      description: definition?.tooltip_properties?._description ?? null,
      shortDescription: definition?.tooltip_properties?._short_description ?? null,
      type: definition?._type ?? null,
      mass: definition?._mass ?? null,
      value: definition?._value ?? null,
      flags: definition?._flags ?? null,
      tags: hasTags ? definition?._tags?.split(",") : [] ?? null,
    })

    await sleep(1);
    finishedFiles++;

    const percentage = Math.round(finishedFiles / fileNames.length * 100)

    spinner.update({
      text: `Parsing XML definitions... [${percentage}%] (${finishedFiles} / ${fileNames.length})`
    })
  }

  writeFileSync(`${destPath}\\output.json`, JSON.stringify(finalJson, null, 2), { encoding: "utf8" });

  spinner.success({ text: `Successfully parsed all XML definitions. An ${chalk.blue("output.json")} file is now available at the chosen destination folder.` })
}

await getPaths();
await parseDefinitions(inputPath, destPath);