const { MessageEmbed, MessageCollector, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const parse = require('../main/methods/parse')
const truncateString = require('../main/methods/truncateString')
const { gql, GraphQLClient } = require('graphql-request');

module.exports = {
    commands: ['find', 'charity', 'zone', 'fc', 'findcharity', 'search'],
    run: (message, args, content, client, command1, command2) => {
        try{
            let embedd = new MessageEmbed()
              .setColor("GREEN")
            const { channel } = message
            const { timeout } = client

            let timeoutamount = 0.0003e+7
            let daily = timeout.get(`${message.author.id}+search`)
            if(daily !== undefined && timeoutamount - (Date.now() - daily) > 0){
              let time = parse(timeoutamount - (Date.now() - daily));
                return channel.send(`⏱️ **| ${message.author.tag}**, you need to wait **${time.seconds}.${time.milliseconds}s** to use command again.`)
            }
              timeout.set(`${message.author.id}+search`, Date.now())
            
        const row1 = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("resultSize")
                .setPlaceholder("Please choose the result size")
                .addOptions({
                    label: "10",
                    description: "10 results",
                    value: "10"
                },
                {
                    label: "100",
                    description: "100 results",
                    value: "100"
                },
                {
                    label: "1000",
                    description: "1000 results",
                    value: "1000"
                })
        )
        const row2 = new MessageActionRow().addComponents(    
            new MessageButton()
                .setCustomId("search")
                .setLabel(`Search`)
                .setEmoji(`🔎`) 
                .setStyle(`SUCCESS`),
            new MessageButton()
                .setCustomId("cancel")
                .setLabel(`Cancel`)
                .setEmoji(`🛑`) 
                .setStyle(`DANGER`)
        )
        let resultSize
        const embed = new MessageEmbed()
        .setDescription(`Search Term: **${content==``?`All Organizations (max. 1000)`:content}**
        Please choose the options you want to search with;`)
        channel.send({embeds: [embed], components: [row1, row2]})

        const filter = (interaction) =>
            (interaction.isSelectMenu() || interaction.isButton()) &&
            interaction.user.id == message.author.id;
        
        const collector = message.channel.createMessageComponentCollector({
            filter,
            time: 30000
        })
        
        collector.on('collect', (collected) => {
            const comptype = collected.componentType
            const customId = collected.customId
            if(comptype == "SELECT_MENU"){
                if(customId == "resultSize"){
                    resultSize = collected.values[0]
                    collected.deferUpdate()
                }
            }else if(comptype == "BUTTON"){
                if(customId == "cancel"){
                    collector.stop()
                    collected.update({embeds: [new MessageEmbed().setDescription(`Canceled the process!`)]})
                }else if(customId == "search"){
                    collector.stop()
                    collected.deferUpdate()
                    channel.send({embeds: [new MessageEmbed().setDescription(`<a:loading:907973094902214668> Fetching the data, please wait.`).setColor(`GREEN`)]}).then(loadmsg => {
                        if(!resultSize) resultSize = 1000
                        var sec = 0;
                        let interv = setInterval(function (){
                            sec++
                            if(sec == 5){
                                loadmsg.edit({embeds: [new MessageEmbed().setDescription(`<a:loading:907973094902214668> Fetching the data, please be patient.\nIf it took long time, please retry.`).setColor(`ORANGE`)]})
                            }else if(sec == 10){
                                loadmsg.edit({embeds: [new MessageEmbed().setDescription(`<a:loading:907973094902214668> You might wanna try again.`).setColor(`RED`)]})
                            }
                        }, 1000)
                        interv
                        const apiUrl = process.env.API_URL;
                        const apiKey = process.env.API_KEY

                          const QLClient = new GraphQLClient(apiUrl, {
                            headers: {
                              'Stellate-Api-Token': apiKey,
                            },
                          });
                        const query = gql`
                          query PublicSearchFaceted {
                            publicSearchFaceted (term: "${content}", result_size: ${parseInt(resultSize)}) {
                              size
                              term
                              results {
                                ein
                                name
                                mission
                                organization_url
                                charity_navigator_url
                                cause
                                street
                                street2
                                city
                                state
                                zip
                                country
                              }
                            }
                          }
                          `;

                          QLClient
                          .request(query)
                          .then(response => {
                            // Handle the response data here
                            //console.log("response: " + JSON.stringify(response, null, 2));
                            //console.log(response.publicSearchFaceted)
                            let results = response.publicSearchFaceted.results //array
                            const amount = results.length
                            let embeds = [], text = ``, c = 0, desc = `\`${results.length} results\``
                            for(let x = 0; x<amount; x++){
                                embedd.setDescription(desc)
                                let rawURL = results[x].organization_url
                                let url = rawURL == null ? null : (rawURL.toLowerCase().includes("http://") || rawURL.toLowerCase().includes("https://") ? rawURL : "https://" + rawURL)
                                text += `**${c+1}-** [\`${results[x].name}\`](${url==null?results[x].charity_navigator_url:url})\n`
                                c++
                                if(c%7 == 0){
                                    embedd.addField(`<:blankcz:907687384542482502>`, text, true)
                                    text = ``;
                                }
                                if(c%14 == 0){
                                    embedd.setDescription(desc)
                                    embeds.push(embedd)
                                    embedd = new MessageEmbed().setColor("GREEN")
                                }
                            }
                            c = (embeds.length*14)
                            if(amount%14>0){
                                text = ``, co=0
                                embedd = new MessageEmbed().setColor("GREEN")
                                for(let x =amount-(amount%14);x<amount;x++){
                                    let rawURL = results[x].organization_url
                                    let url = rawURL == null ? null : (rawURL.toLowerCase().includes("http://") || rawURL.toLowerCase().includes("https://") ? rawURL : "https://" + rawURL)
                                    text += `**${c+1}** - [\`${results[x].name}\`](${url==null?results[x].charity_navigator_url:url})\n`;
                                  if(c%7==6){
                                    embedd.setDescription(desc)
                                    embedd.addField(`<:blankcz:907687384542482502>`, text, true)
                                    text = ``;
                                    co+=7
                                  }
                                  c++
                                }
                                c = (embeds.length*14) + co
                                if(amount-c > 0){
                                  text = ``
                                  for(let x =c;x<amount;x++){
                                    let rawURL = results[x].organization_url
                                    let url = rawURL == null ? null : (rawURL.toLowerCase().includes("http://") || rawURL.toLowerCase().includes("https://") ? rawURL : "https://" + rawURL)
                                    text += `**${c+1}** - [\`${results[x].name}\`](${url==null?results[x].charity_navigator_url:url})\n`;
                                    c++
                                  }
                                  embedd.setDescription(desc)
                                  embedd.addField(`<:blankcz:907687384542482502>`, text, true)
                                }
                                embeds.push(embedd)
                            }
                            
                            /*
                            let charityOptions = []
                            for(var x = 1; x<=amount;x++){
                                charityOptions.push({
                                    label: `${x}`,
                                    value: `${x}`
                                })
                            }
                            const selectCharityMenu = new MessageActionRow().addComponents(
                                new MessageSelectMenu()
                                    .setCustomId("charityNumber")
                                    .setPlaceholder("Please choose a charity to learn more")
                                    .addOptions(charityOptions.map(option => { return { label: option.label, value: option.value }}))
                            )
                            */

                            const buttons = new MessageActionRow().addComponents(    
                                new MessageButton()
                                    .setCustomId("back")
                                    .setLabel(`<`) 
                                    .setStyle(`PRIMARY`),
                                new MessageButton()
                                    .setCustomId("next")
                                    .setLabel(`>`)
                                    .setStyle(`PRIMARY`),
                                new MessageButton()
                                    .setCustomId("cancel")
                                    .setLabel(`X`)
                                    .setStyle(`DANGER`)
                            )
                            loadmsg.edit({embeds: [embeds[0].setFooter(`Page 1/${embeds.length} || type <number> of the org. to learn more | page <pageNumber>`)], components: [buttons]}).then(msgg => {
                                clearInterval(interv)
                                const compfilter = (interaction) =>
                                    (interaction.isSelectMenu() || interaction.isButton()) &&
                                    interaction.user.id == message.author.id;
        
                                const compcollector = message.channel.createMessageComponentCollector({
                                    compfilter,
                                    time: 30000
                                })
        
                                compcollector.on('collect', (collected) => {
                                    const comptype = collected.componentType
                                    const customId = collected.customId
                                    if(comptype == "BUTTON"){
                                        if(customId == "cancel"){
                                            compcollector.stop()
                                            collected.update({embeds: [new MessageEmbed().setDescription(`Canceled the process!`)]})
                                            if (!msgg.deleted)msgg.delete()
                                        }else if(customId == "next"){
                                            collected.deferUpdate()
                                            if(page+1 == embeds.length) return
                                              page++
                                  
                                              msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | page <pageNumber>` : `type <number> of the org. to learn more | previous page | page <page>`) : `type <number> of the org. to learn more | previous page | page <page>`))]})
                                        }else if(customId == "back"){
                                            collected.deferUpdate()
                                            if(page == 0)
                                            return
                                                  
                                          page--
                                          
                                          msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | page <pageNumber>` : `type <number> of the org. to learn more | previous page | page <page>`) : `type <number> of the org. to learn more | previous page | page <page>`))]})
                                        }
                                    }
                                })
                                let page = 0
                                const user = message.author
                                const filter = res =>
                                  res.author.id === user.id && ['page'].includes(content) || res.startsWith(command1) || res.startsWith(command2) || 1<=parseInt(content)<=amount
                                let collector = new MessageCollector(message.channel, filter, {
                                  time: 120000
                                });
                                collector.on("collect", msg => {
                                    try{}catch(err){
                                        console.log(err);
                                    }
                                    let choice = msg.content
                                    if(choice.startsWith(command1) || choice.startsWith(command2)){
                                        if (!msg.deleted)checkPermandDelete(msg)
                                        if (!msgg.deleted)msgg.delete()
                                          collector.stop()
                                    }
                                    else if(choice.toLowerCase().includes("page")){
                                      let npage = choice.split(" ")[1]
                                      let isnum = /^\d+$/.test(npage);
                                  
                                          if(!npage || isnum == false){
                                            if (!msg.deleted)checkPermandDelete(msg)
                                            return channel.send({embeds: [embed.setDescription(`Please provide a valid number`).setTitle(`⛔ Error`).setColor("RED")]}).then(msg=>{
                                                if (!msg.deleted)checkPermandDelete(msg, 5000)
                                            })
                                          }
                                      if (npage > embeds.length || npage < 1){
                                        if (!msg.deleted)checkPermandDelete(msg)
                                          channel.send({embeds: [embed.setDescription(`Invalid page number`).setTitle(`⛔ Error`).setColor("RED")]}).then(msg=>{
                                            if (!msg.deleted)checkPermandDelete(msg, 5000)
                                            })
                                        return
                                      }
                                        page = npage -1
                                          if(!msg.deleted) checkPermandDelete(msg)
                                          msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | page <pageNumber>` : `type <number> of the org. to learn more | previous page | page <page>`) : `type <number> of the org. to learn more | previous page | page <page>`))]})
                                    
                                    }else{
                                      choice = parseInt(choice)
                                      let isnum = /^\d+$/.test(choice);
                                      if(isnum == false) return
                                      if(choice<1 || choice>amount) return
                                      i = choice-1
                                      
                                      let data = results[i]
                                      if (!msg.deleted)checkPermandDelete(msg)
                                      channel.send({embeds: [new MessageEmbed().setDescription(`<a:loading:907973094902214668> Fetching the data, please wait.`).setColor(`ORANGE`)]}).then(msg => {
                                      let mission = data.mission != null ? data.mission : `-`
                                      if(mission.length > 1024){
                                          mission = truncateString(mission, 1015)
                                      }
                                      let rawURL = data.organization_url
                                      let url = rawURL == null ? null : (rawURL.toLowerCase().includes("http://") || rawURL.toLowerCase().includes("https://") ? rawURL : "https://" + rawURL)
                                      let newURL = url==null?``:url
                                    const orginfo = new MessageEmbed()
                                        .setTitle(`**${data.name}**`)
                                        .addFields(
                                            {
                                                name: `🆔 ein`,
                                                value: `\`${data.ein}\``,
                                                inline: true
                                            },
                                            {
                                                name: `🎯 Mission`,
                                                value: `\`${mission.toLowerCase()}\``
                                            },
                                            {
                                                name: `🌐 Organization Website`,
                                                value: newURL != null ? `[\`Click Here\`](${newURL})` : `\`-\``,
                                                inline: true
                                            },
                                            {
                                                name: `🌐 CharityNavigator Webpage`,
                                                value: `[\`Click Here\`](${data.charity_navigator_url})`,
                                                inline: true
                                            },
                                            {
                                                name: `📊 Cause`,
                                                value: `\`${data.cause}\``,
                                                inline: true
                                            },
                                            {
                                                name: `🗺️ Country`,
                                                value: `\`${data.country}\``,
                                                inline: true
                                            },
                                            {
                                                name: `📍 State`,
                                                value: `\`${data.state}\``,
                                                inline: true
                                            },
                                            {
                                                name: `📍 City`,
                                                value: `\`${data.city}\``,
                                                inline: true
                                            },
                                            {
                                                name: `📮 Zip`,
                                                value: `\`${data.zip}\``,
                                                inline: true
                                            },
                                            {
                                                name: `📭 Street Address 1`,
                                                value: `\`${data.street}\``,
                                                inline: true
                                            },
                                            {
                                                name: `📫 Street Address 2`,
                                                value: `\`${data.street2 == null || data.street2 == undefined ? "-": data.street2}\``,
                                                inline: true
                                            }
                                            )
                                    msg.edit({embeds: [orginfo]})
                                        })
                                    }
                                })
                              })
                          })
                          .catch(error => {
                            // Handle any errors that occur
                            console.error(error);
                          });


                        
                    })
                }
            }
        })
        collector.on('end', () =>{
            if (!message.deleted)checkPermandDelete(message)
        })
        }catch(err){
            console.log(err)
        }
    }
}

function checkPermandDelete(message, timeout=0){
    try{
        if(message.guild.me.permissions.has("MANAGE_MESSAGES")){
            message.delete({timeout});
        }
    }catch(err){
        console.log(err)
    }
}