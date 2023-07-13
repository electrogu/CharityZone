const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  slash: new SlashCommandBuilder()
    .setName("info")
    .setDescription("To learn more about the bot statistics."),
  commands: ["info", "botinfo"],
  run: (element, args, content, client, command1, command2, isCommand) => {
    const embed = new MessageEmbed()
      .setAuthor(client.user.username + ` Info`, client.user.displayAvatarURL())
      .setDescription(
        `\`\`\`Servers: ${
          client.guilds.cache.size
        }\nUsers: ${client.guilds.cache.reduce(
          (a, b) => a + b.memberCount,
          0
        )}\`\`\``
      )
      .setFooter(`⏱️ ${client.uptime / 1000} s`);
    sendOrEditReply(element, isCommand, { embeds: [embed] });
  },
};

function sendOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.channel.send(content);
}
