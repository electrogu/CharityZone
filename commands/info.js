const { MessageEmbed } = require('discord.js')

module.exports = {
    commands: ['info', 'botinfo'],
    run: (message, args, context, client) => {
        const { channel } = message
        const embed = new MessageEmbed()
        .setAuthor(client.user.username + ` Info`, client.user.displayAvatarURL())
        .setDescription(
            `\`\`\`Servers: ${client.guilds.cache.size}\nUsers: ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}\`\`\``
            )
        .setFooter(`⏱️ ${client.uptime/1000} s`)
        channel.send({embeds: [embed]})
    }
}