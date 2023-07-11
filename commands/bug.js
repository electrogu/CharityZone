const { MessageEmbed } = require('discord.js')

module.exports = {
    commands: ['reportbug', 'error', 'bug', 'reporterror'],
    run: (message, args, content, client) => {
        const { channel, guild, author } = message
        const e = new MessageEmbed()
        if(!content || content == ""){
            e.setDescription(`Please write your report!`)
            .setColor('RED')
            return message.reply({embeds: [e]})
        }
        else{
            const report = new MessageEmbed()
            .addFields(
                {
                    name: `Report's Channel`,
                    value: `[${channel.name}](${channel.id})`,
                    inline: true
                },
                {
                    name: `Report's Guild`,
                    value: `[${guild.name}](${guild.id})`,
                    inline: true
                },
                {
                    name: `Report's Author`,
                    value: `[${author.tag}](${author.id})`,
                    inline: true
                },
                {
                    name: `Report`,
                    value: `\`${content}\``,
                    inline: true
                }
            )
            client.channels.cache.get('973135867319308308').send({embeds: [report]})
            e.setDescription(`Your report successfully sent!`)
            .setColor('GREEN')
            return message.reply({embeds: [e]})
        }
    }
}