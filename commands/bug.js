const { MessageEmbed, Interaction } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  slash: new SlashCommandBuilder()
    .setName("bug")
    .setDescription("You found a bug? Let us know.")
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Explain the error/bug you found")
        .setRequired(true)
    ),
  commands: ["reportbug", "error", "bug", "reporterror"],
  run: (element, args, content, client, command1, command2, isCommand) => {
    const { channel, guild, author } = element;
    const e = new MessageEmbed();
    if (!content || content == "") {
      e.setDescription(`Please write your report!`).setColor("RED");
      return sendOrEditReply(element, isCommand, { embeds: [e] });
    } else {
      const report = new MessageEmbed().addFields(
        {
          name: `Report's Channel`,
          value: `[${channel.name}](${channel.id})`,
          inline: true,
        },
        {
          name: `Report's Guild`,
          value: `[${guild.name}](${guild.id})`,
          inline: true,
        },
        {
          name: `Report's Author`,
          value: `[${author.tag}](${author.id})`,
          inline: true,
        },
        {
          name: `Report`,
          value: `\`${args[0]}\``,
          inline: true,
        }
      );
      client.channels.cache
        .get("973135867319308308")
        .send({ embeds: [report] });
      e.setDescription(`Your report successfully sent!`).setColor("GREEN");
      return sendOrEditReply(element, isCommand, { embeds: [e] });
    }
  },
};

function sendOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.channel.send(content);
}
