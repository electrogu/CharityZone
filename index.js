#!/usr/bin/env node

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});
const s = require('./main/settings.json');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

client.on('ready', async () => {
  console.log('The client is ready!')

  const botmention = require('./main/methods/botmention')
  botmention(client)
  const baseFile = 'commandHandler.js'
  const commandBase = require(`./commandHandler/${baseFile}`)
  
  const readCommands = (dir) => {
    const files = fs.readdirSync(path.join(__dirname, dir))
    for (const file of files) {
      const stat = fs.lstatSync(path.join(__dirname, dir, file))
      if (stat.isDirectory()) {
        readCommands(path.join(dir, file))
      } else {
        const option = require(path.join(__dirname, dir, file))
        commandBase(client, option)
      }
    }
  }
  readCommands('commands')
})

client.login(process.env.TOKEN);
client.timeout = new Map();