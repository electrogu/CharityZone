const { prefix, ownerID } = require("../main/settings.json");
const language = require("../main/methods/language");
const db = require("quick.db");
const { MessageEmbed } = require("discord.js");
const parse = require("../main/methods/parse");

const validatePermissions = (perms) => {
  const validPermissions = [
    "CREATE_INSTANT_INVITE",
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "ADMINISTRATOR",
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "ADD_REACTIONS",
    "VIEW_AUDIT_LOG",
    "PRIORITY_SPEAKER",
    "STREAM",
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "SEND_TTS_MESSAGES",
    "MANAGE_MESSAGES",
    "EMBED_LINKS",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY",
    "MENTION_EVERYONE",
    "USE_EXTERNAL_EMOJIS",
    "VIEW_GUILD_INSIGHTS",
    "CONNECT",
    "SPEAK",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "USE_VAD",
    "CHANGE_NICKNAME",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
    "MANAGE_EMOJIS",
    "USE_APPLICATION_COMMANDS",
  ];

  for (const permission of perms) {
    if (!permission === "OWNEROFTHEBOT") {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Unknown permission node "${permission}"`);
      }
    }
  }
};

module.exports = (client) => {
  const array = Array.from(client.slashcommands);
  array.forEach((command) => {
    let perms = command[1].perms ?? [];
    // Ensure the perms are in an array and are all valid
    if (perms.length) {
      if (typeof perms === "string") {
        perms = [perms];
      }
      validatePermissions(perms);
    }
  });

  //Listen for slash commands
  client.on("interactionCreate", async (interaction) => {
    interaction.guild = interaction.member.guild;
    interaction.author = interaction.user;
    const { member, content, guild, author } = interaction;
    let client = interaction.client;
    interaction.channel = client.channels.fetch(interaction.channelId);
    const command = client.slashcommands.get(interaction.commandName);
    let enabled = command?.enabled ?? true;
    let perms = command?.perms ?? [];
    if (!interaction.isCommand()) return;
    if (interaction.user.bot) return;
    try {
      // A command has been ran
      await interaction.deferReply({
        ephemeral: true,
      });
      //Log the command
      log(client, guild, author, interaction, interaction.commandName);

      //Check if the bot is in maintenance
      maintenanceCheck(author, interaction);

      // Ensure the user has the required perms
      checkUserPerm(perms, member, interaction, guild, author);

      // Ensure the bot has the required perms
      checkBotPerm(guild, interaction);

      // Check if the command is enabled
      checkEnabled(enabled, interaction, interaction.commandName);
      let args = [];
      interaction.options._hoistedOptions.forEach((option) => {
        args.push(option.value);
      });
      command.run(
        interaction,
        args,
        !args.length ? "" : args.join(" "),
        client,
        interaction.commandName,
        interaction.commandName,
        true
      );
    } catch (e) {
      console.log(e);
      interaction.editReply({
        content: "An error occurred. Please try again.",
        ephemeral: true,
      });
    }
  });
};

function log(client, guild, author, interaction, command) {
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
          value: author.username || "-",
          inline: true,
        },
        {
          name: `Command`,
          value: command || "-",
          inline: true,
        }
      )
      .setColor("GREEN");
    logChannel.send({ embeds: [e] }).catch((err) => console.log(err));
  }
}

function maintenanceCheck(author, interaction) {
  const mainInfo = db.get(`maintenanceInfo`);
  if (mainInfo != null && author.id != ownerID) {
    const parsed = parse(Date.now() - mainInfo.date);
    interaction.editReply({
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
}

function checkUserPerm(perms, member, interaction, guild, author) {
  for (const permission of perms) {
    if (!permission === "OWNEROFTHEBOT") {
      if (!member.hasPermission(permission)) {
        interaction.editReply(`${language(guild, "PERM_ERROR")}`);
        return;
      }
    } else {
      if (!author.id === ownerID) {
        return;
      }
    }
  }
}

function checkBotPerm(guild, interaction) {
  if (!guild.me.permissions.has("MANAGE_MESSAGES")) {
    if (!guild.me.permissions.has("USE_APPLICATION_COMMANDS")) {
      return interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setTitle(`<:cross:964277728075481088> **Error**`)
            .setDescription(
              "I don't have `USE_APPLICATION_COMMANDS` permission for commands to work, please check the permissions on the role that I have!"
            ),
        ],
      });
    } else {
      interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setTitle(`⚠️ **Warning**`)
            .setDescription(
              "I don't have `MANAGE_MESSAGES` permission for commands to work properly, please check the permissions on the role that I have!"
            ),
        ],
      });
    }
  }
}

function checkEnabled(enabled, interaction, command) {
  if (enabled == false) {
    interaction.editReply(
      `**TR** : **${command}** komudu geçici olarak kullanım dışıdır.\n**EN** : **${command}** command is temporarily out of use.`
    );
    return;
  }
}
