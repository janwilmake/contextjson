#!/usr/bin/env node
const fs = require("fs");

const cli = async () => {
  const exists = fs.existsSync("context.json");
  if (!exists) {
    console.log("context.json not found");
    return;
  }

  const context = fs.readFileSync("context.json");
  console.log("context.json found. length: ", context.length);
};
cli();
