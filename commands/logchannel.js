const { MessageEmbed } = require('discord.js')
const { get, fetch, set } = require('quick.db')

module.exports = {
    commands: ["log"],
    perms: `OWNEROFTHEBOT`,
    run: (message, args, context, client) => {
        try{
        let channelID = message.mentions.channels.first() || null
        if(channelID == null){
            let isnum = /^\d+$/.test(args[0]);
            if(isnum){
                if(!message.guild.channels.cache.find(ch => ch.id == args[0])) return message.reply({embeds: [new MessageEmbed().setDescription('Invalid channel ID').setColor('ORANGE')]})
                channelID = args[0]
            }
        }else{
            channelID = args[0].substring(2).substring(0,18)
            if(!message.guild.channels.cache.find(ch => ch.id == channelID)) return message.reply({embeds: [new MessageEmbed().setDescription('Check your message!\nMake sure that the first argument is channel mention.').setColor('ORANGE')]})
        }
        set(`commandlogchannel`, channelID)
        message.reply(`The command log channel has been set to <#${channelID}>`)
        }catch(err){
            console.log(err)
        }
    }
}