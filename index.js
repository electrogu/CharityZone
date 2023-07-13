#!/usr/bin/env node

const { Client, Collection, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

client.slashcommands = new Collection();

const rest = new REST({ version: "9" }).setToken(token);

//slash-command-handler
const slashcommands = [];

fs.readdirSync("./commands").forEach(async (file) => {
  const command = await require(`./commands/${file}`);
  let onlyMessage = command.onlyMessage ?? false;
  if (!onlyMessage) {
    slashcommands.push(command.slash.toJSON());
    client.slashcommands.set(command.slash.name, command);
  }
});

client.on("ready", async () => {
  const botmention = require("./main/methods/botmention");
  botmention(client);
  const commandBase = require(`./commandHandler/commandHandler.js`);

  const readCommands = async (dir) => {
    const files = fs.readdirSync(path.join(__dirname, dir));
    for (const file of files) {
      const stat = fs.lstatSync(path.join(__dirname, dir, file))
      if (stat.isDirectory()) {
        readCommands(path.join(dir, file))
      } else {
        const option = require(path.join(__dirname, dir, file))
        commandBase(client, option)
      }
    }
  };
  readCommands("commands");

  const slashCommandBase = require(`./commandHandler/slashCommandHandler`);
  slashCommandBase(client);

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(clientId), {
      body: slashcommands,
    });

    console.log("Successfully registered application (/) commands.");
  } catch (error) {
    console.error(error);
  }
  console.log("The client is ready!");
});

client.login(token);
client.timeout = new Map();
