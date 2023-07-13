const { MessageEmbed, Message } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  slash: new SlashCommandBuilder()
    .setName("support")
    .setDescription("You have a question? Come to our server."),
  commands: ["support", "sup"],
  run: (element, args, content, client, command1, command2, isCommand) => {
    const e = new MessageEmbed()
      .setDescription(
        `You can get furher assistance from our support channel.
        To join the support channel [you can click here](https://discord.com/invite/BhQYHky6pB)`
      )
      .setColor("GREEN");

    sendOrEditReply(element, isCommand, { embeds: [e] });
  },
};

function sendOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.channel.send(content);
}
