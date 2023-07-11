const { MessageEmbed, MessageCollector, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js')
const axios = require('axios')
const parse = require('../main/methods/parse')
const { nav_app_id, nav_app_key, supp_app_id, supp_app_key } = require('../main/settings.json')
const truncateString = require('../main/methods/truncateString')
module.exports = {
    commands: [],
    perms: "OWNEROFTHEBOT",
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
            
        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("categories")
                .setPlaceholder("Please choose the category")
                .addOptions({
                    label: "All Categories",
                    description: "",
                    emoji: "",
                    value: "0"
                },
                {
                    label: "Animals",
                    description: "",
                    emoji: "🐘",
                    value: "1"
                },
                {
                    label: "Arts, Culture, Humanities",
                    description: "",
                    emoji: "🎨",
                    value: "2"
                },
                {
                    label: "Education",
                    description: "",
                    emoji: "🎓",
                    value: "3"
                },
                {
                    label: "Environment",
                    description: "",
                    emoji: "🍂",
                    value: "4"
                },
                {
                    label: "Health",
                    description: "",
                    emoji: "🏥",
                    value: "5"
                },
                {
                    label: "Human Services",
                    description: "",
                    emoji: "🧍",
                    value: "6"
                },
                {
                    label: "International",
                    description: "",
                    emoji: "🌐",
                    value: "7"
                },
                {
                    label: "Human and Civil Rights",
                    description: "",
                    emoji: "⚖️",
                    value: "8"
                },
                {
                    label: "Religion",
                    description: "",
                    emoji: "📿",
                    value: "9"
                },
                {
                    label: "Community Development",
                    description: "",
                    emoji: "💬",
                    value: "10"
                },
                {
                    label: "Research and Public Policy",
                    description: "",
                    emoji: "🔍",
                    value: "11"
                },
                )
        )
        const row1 = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("searchType")
                .setPlaceholder("Please choose the search type")
                .addOptions({
                    label: "DEFAULT",
                    description: "Search in all string properties.",
                    value: "default"
                },
                {
                    label: "NAME_ONLY",
                    description: "Search only in the Organization name.",
                    value: "name_only"
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
        let category, searchType
        const embed = new MessageEmbed()
        .setDescription(`Search Term: **${content==``?`All Organizations (max. 1000)`:content}**
        Please choose the options you want to search with;`)
        channel.send({embeds: [embed], components: [row, row1, row2]})

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
                if(customId == "categories"){
                    category = collected.values[0]
                    collected.deferUpdate()
                }
                if(customId == "searchType"){
                    searchType = collected.values[0]
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
                        if(!searchType) searchType = "DEFAULT"
                        if(category == "0") category = undefined
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
                        axios.get(`https://api.data.charitynavigator.org/v2/Organizations?app_id=${nav_app_id}&app_key=${nav_app_key}&pageSize=1000&search=${content}&searchType=${searchType ? searchType: `DEFAULT`}${category ? `&categoryID=${category}` : ""}`, { validateStatus: false })
                        .then(function (response){
                            if (response.data.errorMessage){
                                    embedd.setDescription(`${response.data.errorMessage}`).setColor(`RED`)
                                    loadmsg.edit({embeds: [embedd]})
                                    return
                            }
                            //console.log(response.data[0])
                        
                            const amount = response.data.length
                            let embeds = [], text = ``, c = 0, desc = `\`The organizations that meet your category\n**${response.data.length}** results\``
                            for(let x = 0; x<amount; x++){
                                embedd.setDescription(desc)
                                text += `**${c+1}-** [\`${response.data[x].charityName}\`](${response.data[x].websiteURL==null?``:response.data[x].websiteURL})\n`
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
                                  text += `**${c+1}** - [\`${response.data[x].charityName}\`](${response.data[x].websiteURL==null?``:response.data[x].websiteURL})\n`;
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
                                    text += `**${c+1}** - [\`${response.data[x].charityName}\`](${response.data[x].websiteURL==null?``:response.data[x].websiteURL})\n`;
                                    c++
                                  }
                                  embedd.setDescription(desc)
                                  embedd.addField(`<:blankcz:907687384542482502>`, text, true)
                                }
                                embeds.push(embedd)
                            }
                              //console.log(embeds[0].fields)
                            loadmsg.edit({embeds: [embeds[0].setFooter(`Page 1/${embeds.length} || next page | page <page> | cancel`)]}).then(msgg => {
                                clearInterval(interv)
                                let page = 0
                                const user = message.author
                                const filter = res =>
                                  res.author.id === user.id && ['previous', 'prev', 'next', 'page', 'cancel'].includes(content) || res.startsWith(command1) || res.startsWith(command2) || 1<=parseInt(content)<=amount
                                let collector = new MessageCollector(message.channel, filter, {
                                  time: 120000
                                });
                                collector.on("collect", msg => {
                                    try{}catch(err){
                                        console.log(err);
                                    }
                                    let choice = msg.content
                                    if(choice.startsWith(command1) || choice.startsWith(command2)){
                                        if (msg)checkPermandDelete(msg)
                                        if (msgg)msgg.delete()
                                          collector.stop()
                                    }else if(choice == "cancel" || choice == "iptal"){
                                        if (msg)checkPermandDelete(msg)
                                        if (msgg)msgg.delete()
                                          collector.stop()
                                    }else if(choice == "prev" || choice == "previous"){
                                          if(page == 0)
                                            if (msg)
                                              return checkPermandDelete(msg)
                                          
                                          page--
                                  
                                          if(msg) checkPermandDelete(msg)
                                          msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | next page | page <page> | cancel` : `type <number> of the org. to learn more | previous page | page <page> | cancel`) : `type <number> of the org. to learn more | next page | previous page | page <page> | cancel`))]})
                                    
                                    }else if(choice == "next" || choice == "next page"){
                                          if(page+1 == embeds.length) return
                                          page++
                                  
                                          if(msg) checkPermandDelete(msg)
                                          msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | next page | page <page> | cancel` : `type <number> of the org. to learn more | previous page | page <page> | cancel`) : `type <number> of the org. to learn more | next page | previous page | page <page> | cancel`))]})
                                    
                                    }else if(choice.toLowerCase().includes("page")){
                                      let npage = choice.split(" ")[1]
                                      let isnum = /^\d+$/.test(npage);
                                  
                                          if(!npage || isnum == false){
                                            if (msg)checkPermandDelete(msg)
                                            return channel.send({embeds: [embed.setDescription(`Please provide a valid number`).setTitle(`⛔ Error`).setColor("RED")]}).then(msg=>{
                                                if (msg)checkPermandDelete(msg, 5000)
                                            })
                                          }
                                      if (npage > embeds.length || npage < 1){
                                        if (msg)checkPermandDelete(msg)
                                          channel.send({embeds: [embed.setDescription(`Invalid page number`).setTitle(`⛔ Error`).setColor("RED")]}).then(msg=>{
                                            if (msg)checkPermandDelete(msg, 5000)
                                            })
                                        return
                                      }
                                        page = npage -1
                                          if(msg) checkPermandDelete(msg)
                                          msgg.edit({embeds : [embeds[page].setFooter(`Page ${page+1}/${embeds.length} || `+((page == 0 || page+1 == embeds.length) ? (page==0 ? `type <number> of the org. to learn more | next page | page <page> | cancel` : `type <number> of the org. to learn more | previous page | page <page> | cancel`) : `type <number> of the org. to learn more | next page | previous page | page <page> | cancel`))]})
                                    
                                    }else{
                                      choice = parseInt(choice)
                                      let isnum = /^\d+$/.test(choice);
                                      if(isnum == false) return
                                      if(choice<1 || choice>amount) return
                                      i = choice-1
                                      //console.log(response.data[i].ein)
                                      const ein = response.data[i].ein != null ? response.data[i].ein : null
                                      if(ein == null) return channel.send(new MessageEmbed().setTitle(`⛔ Error`).setDescription(`An error occured! Try again later please.`))
                                        channel.send({embeds: [new MessageEmbed().setDescription(`<a:loading:907973094902214668> Fetching the data, please wait.`).setColor(`ORANGE`)]}).then(msg => {
                                            axios.get(`https://api.data.charitynavigator.org/v2/Organizations/${ein}?app_id=${supp_app_id}&app_key=${supp_app_key}`, { validateStatus: false })
                                            .then(function (response){
                                                let mission = response.data.mission != null ? response.data.mission : `-`
                                                if(mission.length > 1024){
                                                    mission = truncateString(mission, 1015)
                                                }
                                              const orginfo = new MessageEmbed()
                                                  .setTitle(`**${response.data.charityName}**`)
                                                  .addFields(
                                                      {
                                                          name: `🆔 ein`,
                                                          value: `\`${ein}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `🎯 Mission`,
                                                          value: `\`${mission}\``
                                                      },
                                                      {
                                                          name: `🌐 Organization Website`,
                                                          value: response.data.websiteURL != null ? `[\`Click Here\`](${response.data.websiteURL})` : `\`-\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `🌐 CharityNavigator Webpage`,
                                                          value: `[\`Click Here\`](${response.data.charityNavigatorURL})`,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `🏦 Income Amount`,
                                                          value: `\`${response.data.irsClassification.incomeAmount}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `🏦 Asset Amount`,
                                                          value: `\`${response.data.irsClassification.assetAmount}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📊 Cause`,
                                                          value: `\`${response.data.irsClassification.classification}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `🗺️ Country`,
                                                          value: `\`${response.data.mailingAddress.country}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📍 State or Province`,
                                                          value: `\`${response.data.mailingAddress.stateOrProvince}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📍 City`,
                                                          value: `\`${response.data.mailingAddress.city}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📮 Postal Code`,
                                                          value: `\`${response.data.mailingAddress.postalCode}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📭 Street Address 1`,
                                                          value: `\`${response.data.mailingAddress.streetAddress1}\``,
                                                          inline: true
                                                      },
                                                      {
                                                          name: `📫 Street Address 2`,
                                                          value: `\`${response.data.mailingAddress.streetAddress2}\``,
                                                          inline: true
                                                      }
                                                      )
                                              msg.edit({embeds: [orginfo]})
                                            })
                                        })
                                    }
                                })
                              })
                        })
                    })
                }
            }
        })
        collector.on('end', () =>{
            if (message)checkPermandDelete(message)
        })
        }catch(err){
            console.log(err.response)
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