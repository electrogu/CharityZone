const db = require('quick.db')
const parse = require('../main/methods/parse')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

module.exports = {
    commands: ['maintenance', 'bakım', 'mt'],
    perms: `OWNEROFTHEBOT`,
    run: (message, args, context, client) => {
        try{
            let mainInfo = db.get(`maintenanceInfo`)
            let boolean = mainInfo == null ? true : false
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`startmt`)
                    .setLabel(`Start`)
                    .setEmoji(`🏁`)
                    .setStyle(`SUCCESS`)
                    .setDisabled(boolean==true?false:true),

                new MessageButton()
                    .setCustomId(`stopmt`)
                    .setLabel(`Stop`)
                    .setEmoji(`🛑`)
                    .setStyle(`DANGER`)
                    .setDisabled(boolean==true?true:false)
            )

            const parsed = mainInfo ? parse(Date.now() - mainInfo.date) : parse(Date.now())
            let text = mainInfo ? `**Date:** <t:${Math.floor(mainInfo.unixtimestamp)}>\n\`\`\`Time elapsed: ${parsed.hours}:${parsed.minutes}:${parsed.seconds}\`\`\`` : `There isn't any maintenance right now, you can use the buttons down below to start or stop a maintenance`
            const embed = new MessageEmbed()
                .setTitle(mainInfo?`🔴 Maintenance`:`➖ No Maintenance`)
                .setDescription(text)

            message.channel.send({embeds: [embed], components: [row]})

            const filter = (interaction) => {
                if (interaction.user.id == message.author.id) return true;
                return interaction.reply({content: "You cannot use this button."})
            }

            const collector = message.channel.createMessageComponentCollector({
                filter,
                max: 1
            })

            collector.on('end', (ButtonInteraction) => {

                let first = ButtonInteraction.first()
                if(first.customId == `startmt`){
                    db.set(`maintenanceInfo`, {date: Date.now(), unixtimestamp: Date.now()/1000})
                    first.reply(`Maintenance session started: <t:${Math.floor(Date.now()/1000)}>`)
                }else if(first.customId == `stopmt`){
                    db.delete(`maintenanceInfo`)
                    first.reply(`Maintenance session finished: <t:${Math.floor(Date.now()/1000)}>`)
                }
            })  
        }catch(err){
            console.log(err)
        }
    }
}