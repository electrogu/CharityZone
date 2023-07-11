const { MessageEmbed } = require('discord.js')
const { prefix } = require('../main/settings.json')
module.exports = {
    commands: ["help"],
    run: (message) => {
        const { channel } = message
        let embed = new MessageEmbed()
        .setTitle(`ℹ️ Help Center`)
        .setDescription(`**\`•\`** **\`${prefix} search <searchTerm>\`** **\`:\`** To search organization(s) to learn info about them.
        **\`•\`** **\`${prefix} help\`** **\`:\`** To get help about the commands.
        **\`•\`** **\`${prefix} info\`** **\`:\`** To learn info about the bot statistics.`)

        channel.send({embeds: [embed]})
    }
}