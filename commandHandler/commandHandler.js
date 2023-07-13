const { prefix, ownerID } = require('../main/settings.json')
const language = require('../main/methods/language')
const db = require('quick.db')
const { MessageEmbed } = require('discord.js')
const parse = require('../main/methods/parse')

const validatePermissions = (perms) => {
  const validPermissions = [
    'CREATE_INSTANT_INVITE',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'MANAGE_GUILD',
    'ADD_REACTIONS',
    'VIEW_AUDIT_LOG',
    'PRIORITY_SPEAKER',
    'STREAM',
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'SEND_TTS_MESSAGES',
    'MANAGE_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'READ_MESSAGE_HISTORY',
    'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS',
    'VIEW_GUILD_INSIGHTS',
    'CONNECT',
    'SPEAK',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS',
    'MOVE_MEMBERS',
    'USE_VAD',
    'CHANGE_NICKNAME',
    'MANAGE_NICKNAMES',
    'MANAGE_ROLES',
    'MANAGE_WEBHOOKS',
    'MANAGE_EMOJIS',
    'USE_APPLICATION_COMMANDS'
    
  ]

  for (const permission of perms) {
    if (!permission === "OWNEROFTHEBOT") {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Unknown permission node "${permission}"`)
      }
    }
  }
};

module.exports = (client, cmdOptions) => {
  let {
    commands = [],
    reqArgs = "",
    permError = "",
    minArgs = 0,
    maxArgs = null,
    perms = [],
    enabled = true,
    run,
  } = cmdOptions

  // Ensure the command and aliases are in an array
  if (typeof commands === 'string') {
    commands = [commands]
  }

  //console.log(`Registering command "${commands[0]}"`)

  // Ensure the perms are in an array and are all valid
  if (perms.length) {
    if (typeof perms === 'string') {
      perms = [perms]
    }

    validatePermissions(perms)
  }

  // Listen for messages
  client.on('messageCreate', (message) => {
    const { member, content, guild, author } = message

    for (const alias of commands) {
      try {
        const command1 = `${prefix}${alias.toLowerCase()}`;
        const command2 = `${prefix} ${alias.toLowerCase()}`;

        if (
          content.toLowerCase().startsWith(`${command1} `) ||
          content.toLowerCase() === command1 ||
          content.toLowerCase().startsWith(`${command2} `) ||
          content.toLowerCase() === command2
        ) {
          // A command has been ran

          //Log the command
          const channelID = db.get(`commandlogchannel`);
          if (channelID) {
            const logChannel = client.channels.cache.get(channelID);
            const e = new MessageEmbed()
              .setDescription(`Command Used`)
              .addFields(
                {
                  name: `Guild`,
                  value: guild.name || "-",
                  inline: true,
                },
                {
                  name: `Guild ID`,
                  value: guild.id || "-",
                  inline: true,
                },
                {
                  name: `Guild Member Count`,
                  value: guild.memberCount.toString() || "-",
                  inline: true,
                },
                {
                  name: `Author`,
                  value: author.tag || "-",
                  inline: true,
                },
                {
                  name: `Command`,
                  value: message.content || "-",
                  inline: true,
                }
              )
              .setColor("GREEN");
            logChannel.send({ embeds: [e] }).catch((err) => console.log(err));
          }
          //Check if the bot is in maintenance
          const mainInfo = db.get(`maintenanceInfo`);
          if (mainInfo != null && author.id != ownerID) {
            const parsed = parse(Date.now() - mainInfo.date);
            message.reply({
              embeds: [
                new MessageEmbed().setTitle(`⚠️ Warning!`)
                  .setDescription(`Cannot process the command due to maintenance. Try again later, please.
          
          **Date:** <t:${Math.floor(mainInfo.unixtimestamp)}>
          **Time elapsed:** \`\`${parsed.hours}:${parsed.minutes}:${
                  parsed.seconds
                }\`\``),
              ],
            });
            return;
          }

          // Ensure the user has the required perms
          for (const permission of perms) {
            if (!permission === "OWNEROFTHEBOT") {
              if (!member.hasPermission(permission)) {
                message.reply(`${language(guild, "PERM_ERROR")}`);
                return;
              }
            } else {
              if (!author.id === ownerID) {
                return;
              }
            }
          }

          // Ensure the bot has the required perms
          if (!message.guild.me.permissions.has("MANAGE_MESSAGES")) {
            if (!message.guild.me.permissions.has("USE_APPLICATION_COMMANDS")) {
              return message.reply({
                embeds: [
                  new MessageEmbed()
                    .setTitle(`<:cross:964277728075481088> **Error**`)
                    .setDescription(
                      "I don't have `USE_APPLICATION_COMMANDS` permission for commands to work, please check the permissions on the role that I have!"
                    ),
                ],
              });
              //.then(msg=> setTimeout(() => msg.delete(), 5000))
            } else {
              message
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setTitle(`⚠️ **Warning**`)
                      .setDescription(
                        "I don't have `MANAGE_MESSAGES` permission for commands to work properly, please check the permissions on the role that I have!"
                      ),
                  ],
                })
                .then((msg) => setTimeout(() => msg.delete(), 5000));
            }
          }

          if (enabled == false) {
            message.channel
              .send(
                `**TR** : **${command}** komudu geçici olarak kullanım dışıdır.\n**EN** : **${command}** command is temporarily out of use.`
              )
              .then((msg) => setTimeout(() => msg.delete(), 5000));
            return;
          }
          // Split on any number of spaces
          const arguments = content.split(/[ ]+/);

          // Remove the command which is the first index
          arguments.shift();

          // Ensure we have the correct number of arguments
          if (
            arguments.length < minArgs ||
            (maxArgs !== null && arguments.length > maxArgs)
          ) {
            let text = language(guild, "SYNTAX_ERROR");
            text.then(function (r) {
              message.reply(`${r} **${prefix}${alias} ${reqArgs}**`);
            });
            return;
          }
          if (content.toLowerCase().startsWith(command2)) {
            arguments.shift();
          }
          // Handle the custom command code
          run(
            message,
            arguments,
            arguments.join(" "),
            client,
            command1,
            command2
          );
          return;
        }
      } catch (err) {
        console.log(err);
      }
    }
  });
};

/*

module.exports = {
commands: [],
  minArgs: 1,
  reqArgs: "<@kullanıcı/@user>",
  run: async (message, args) => {
    
  }
}

*/
