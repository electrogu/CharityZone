const { MessageEmbed } = require("discord.js");
const { prefix } = require("../main/settings.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  slash: new SlashCommandBuilder()
    .setName("help")
    .setDescription("To get help about the commands"),
  commands: ["help"],
  run: (element, args, content, client, command1, command2, isCommand) => {
    let embed = new MessageEmbed().setTitle(`ℹ️ Help Center`)
      .setDescription(`**\`•\`** **\`${prefix} search <searchTerm>\`** **\`:\`** To search organization(s) to learn info about them.
        **\`•\`** **\`${prefix} help\`** **\`:\`** To get help about the commands.
        **\`•\`** **\`${prefix} info\`** **\`:\`** To learn more about the bot statistics.`);

    sendOrEditReply(element, isCommand, { embeds: [embed] });
  },
};

function sendOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.channel.send(content);
}
