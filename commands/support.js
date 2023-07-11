const { MessageEmbed, Message } = require('discord.js')

module.exports = {
    commands: ['support', 'sup'],
    run: (message) => {
        const e = new MessageEmbed()
        .setDescription(`You can get furher assistance from our support channel.
        To join the support channel [you can click here](https://discord.com/invite/BhQYHky6pB)`)
        .setColor('GREEN')

        message.reply({embeds: [e]})
    }
}