const {
  MessageEmbed,
  MessageCollector,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} = require("discord.js");
const parse = require("../main/methods/parse");
const truncateString = require("../main/methods/truncateString");
const { gql, GraphQLClient } = require("graphql-request");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  slash: new SlashCommandBuilder()
    .setName("search")
    .setDescription("To search organization(s) to learn info about them.")
    .addStringOption((option) =>
      option
        .setName("term")
        .setDescription("Search term to filter organizations")
    ),
  commands: ["find", "charity", "zone", "fc", "findcharity", "search"],
  run: async (
    element,
    args,
    content,
    client,
    command1,
    command2,
    isCommand
  ) => {
    try {
      let term = args[0];
      let embedd = new MessageEmbed().setColor("GREEN");
      const { channel } = element;
      const { timeout } = client;
      
      let seconds = 30
      let timeoutamount = seconds*1000;
      let daily = timeout.get(`${element.author.id}+search`);
      if (daily !== undefined && timeoutamount - (Date.now() - daily) > 0) {
        let time = parse(timeoutamount - (Date.now() - daily));
        return sendOrEditReply(
          element,
          isCommand,
          `⏱️ **| ${element.author.tag}**, you need to wait **${time.seconds}.${time.milliseconds}s** to use command again.`
        );
      }
      timeout.set(`${element.author.id}+search`, Date.now());

      const row1 = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("resultSize")
          .setPlaceholder("Please choose the result size")
          .addOptions(
            {
              label: "10",
              description: "10 results",
              value: "10",
            },
            {
              label: "100",
              description: "100 results",
              value: "100",
            },
            {
              label: "1000",
              description: "1000 results",
              value: "1000",
            }
          )
      );
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
      );
      let resultSize;
      const embed = new MessageEmbed().setDescription(`Search Term: **${
        term ?? `All Organizations (max. 1000)`
      }**
        Please choose the options you want to search with;`);
      sendOrEditReply(element, isCommand, {
        embeds: [embed],
        components: [row1, row2],
      });

      const filter = (interaction) =>
        (interaction.isSelectMenu() || interaction.isButton()) &&
        interaction.user.id == element.author.id;

      const collector = element.channel.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      collector.on("collect", (collected) => {
        const comptype = collected.componentType;
        const customId = collected.customId;
        if (comptype == "SELECT_MENU") {
          if (customId == "resultSize") {
            resultSize = collected.values[0];
            collected.deferUpdate();
          }
        } else if (comptype == "BUTTON") {
          if (customId == "cancel") {
            collector.stop();
            collected.update({
              embeds: [
                new MessageEmbed().setDescription(`Canceled the process!`),
              ],
              components: [],
            });
          } else if (customId == "search") {
            collector.stop();
            collected.deferUpdate();
            sendOrEditReply(element, isCommand, {
              embeds: [
                new MessageEmbed()
                  .setDescription(
                    `<a:loading:907973094902214668> Fetching the data, please wait.`
                  )
                  .setColor(`GREEN`),
              ],
              components: [],
            }).then((loadmsg) => {
              if (!isCommand) element = loadmsg;
              if (!resultSize) resultSize = 1000;
              var sec = 0;
              let interv = setInterval(function () {
                sec++;
                if (sec == 10) {
                  editOrEditReply(element, isCommand, {
                    embeds: [
                      new MessageEmbed()
                        .setDescription(
                          `<a:loading:907973094902214668> Fetching the data, please be patient.\nIf it took long time, please retry.`
                        )
                        .setColor(`ORANGE`),
                    ],
                  });
                } else if (sec == 15) {
                  editOrEditReply(element, isCommand, {
                    embeds: [
                      new MessageEmbed()
                        .setDescription(
                          `<a:loading:907973094902214668> You might wanna try again.`
                        )
                        .setColor(`RED`),
                    ],
                  });
                }
              }, 1000);
              interv;
              const apiUrl = process.env.API_URL;
              const apiKey = process.env.API_KEY;

              const QLClient = new GraphQLClient(apiUrl, {
                headers: {
                  "Stellate-Api-Token": apiKey,
                },
              });
              const query = gql`
                          query PublicSearchFaceted {
                            publicSearchFaceted (term: "${term ?? ""}", result_size: ${parseInt(
                resultSize
              )}) {
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

              QLClient.request(query)
                .then((response) => {
                  // Handle the response data here
                  //console.log("response: " + JSON.stringify(response, null, 2));
                  //console.log(response.publicSearchFaceted)
                  let results = response.publicSearchFaceted.results; //array
                  const amount = results.length;
                  let embeds = [],
                    text = ``,
                    c = 0,
                    desc = `\`${results.length} results\``;
                  for (let x = 0; x < amount; x++) {
                    embedd.setDescription(desc);
                    let rawURL = results[x].organization_url;
                    let url =
                      rawURL == null
                        ? null
                        : rawURL.toLowerCase().includes("http://") ||
                          rawURL.toLowerCase().includes("https://")
                        ? rawURL
                        : "https://" + rawURL;
                    text += `**${c + 1}-** [\`${results[x].name}\`](${
                      url == null ? results[x].charity_navigator_url : url
                    })\n`;
                    c++;
                    if (c % 7 == 0) {
                      embedd.addField(
                        `<:blankcz:907687384542482502>`,
                        text,
                        true
                      );
                      text = ``;
                    }
                    if (c % 14 == 0) {
                      embedd.setDescription(desc);
                      embeds.push(embedd);
                      embedd = new MessageEmbed().setColor("GREEN");
                    }
                  }
                  c = embeds.length * 14;
                  if (amount % 14 > 0) {
                    (text = ``), (co = 0);
                    embedd = new MessageEmbed().setColor("GREEN");
                    for (let x = amount - (amount % 14); x < amount; x++) {
                      let rawURL = results[x].organization_url;
                      let url =
                        rawURL == null
                          ? null
                          : rawURL.toLowerCase().includes("http://") ||
                            rawURL.toLowerCase().includes("https://")
                          ? rawURL
                          : "https://" + rawURL;
                      text += `**${c + 1}** - [\`${results[x].name}\`](${
                        url == null ? results[x].charity_navigator_url : url
                      })\n`;
                      if (c % 7 == 6) {
                        embedd.setDescription(desc);
                        embedd.addField(
                          `<:blankcz:907687384542482502>`,
                          text,
                          true
                        );
                        text = ``;
                        co += 7;
                      }
                      c++;
                    }
                    c = embeds.length * 14 + co;
                    if (amount - c > 0) {
                      text = ``;
                      for (let x = c; x < amount; x++) {
                        let rawURL = results[x].organization_url;
                        let url =
                          rawURL == null
                            ? null
                            : rawURL.toLowerCase().includes("http://") ||
                              rawURL.toLowerCase().includes("https://")
                            ? rawURL
                            : "https://" + rawURL;
                        text += `**${c + 1}** - [\`${results[x].name}\`](${
                          url == null ? results[x].charity_navigator_url : url
                        })\n`;
                        c++;
                      }
                      embedd.setDescription(desc);
                      embedd.addField(
                        `<:blankcz:907687384542482502>`,
                        text,
                        true
                      );
                    }
                    embeds.push(embedd);
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
                  );
                  const showOrganizations = editOrEditReply(
                    element,
                    isCommand,
                    {
                      embeds: [
                        embeds[0].setFooter(
                          `Page 1/${embeds.length} || type <number> of the org. to learn more | page <pageNumber>`
                        ),
                      ],
                      components: [buttons],
                    }
                  ).then((msgg) => {
                    if (!isCommand) element = msgg;
                    clearInterval(interv);
                    const compfilter = (interaction) =>
                      (interaction.isSelectMenu() || interaction.isButton()) &&
                      interaction.user.id == element.author.id;

                    const compcollector =
                      element.channel.createMessageComponentCollector({
                        compfilter,
                        time: 120000,
                      });

                    compcollector.on("collect", (collected) => {
                      const comptype = collected.componentType;
                      const customId = collected.customId;
                      if (comptype == "BUTTON") {
                        if (customId == "cancel") {
                          compcollector.stop();
                          if (!msgg.deleted)
                            deleteOrEditReply(element, isCommand, {
                              embeds: [
                                new MessageEmbed()
                                  .setDescription(`Canceled the process!`)
                                  .setColor("RED"),
                              ],
                              components: [],
                            });
                        } else if (customId == "next") {
                          collected.deferUpdate();
                          if (page + 1 == embeds.length) return;
                          page++;

                          editOrEditReply(element, isCommand, {
                            embeds: [
                              embeds[page].setFooter(
                                `Page ${page + 1}/${embeds.length} || ` +
                                  (page == 0 || page + 1 == embeds.length
                                    ? page == 0
                                      ? `type <number> of the org. to learn more | page <pageNumber>`
                                      : `type <number> of the org. to learn more | previous page | page <page>`
                                    : `type <number> of the org. to learn more | previous page | page <page>`)
                              ),
                            ],
                          });
                        } else if (customId == "back") {
                          collected.deferUpdate();
                          if (page == 0) return;

                          page--;

                          editOrEditReply(element, isCommand, {
                            embeds: [
                              embeds[page].setFooter(
                                `Page ${page + 1}/${embeds.length} || ` +
                                  (page == 0 || page + 1 == embeds.length
                                    ? page == 0
                                      ? `type <number> of the org. to learn more | page <pageNumber>`
                                      : `type <number> of the org. to learn more | previous page | page <page>`
                                    : `type <number> of the org. to learn more | previous page | page <page>`)
                              ),
                            ],
                          });
                        }
                      }
                    });
                    let page = 0;
                    const user = element.author;
                    const filter = (res) =>
                      (res.author.id === user.id &&
                        ["page"].includes(content)) ||
                      res.startsWith(command1) ||
                      res.startsWith(command2) ||
                      1 <= parseInt(content) <= amount;
                    let collector = new MessageCollector(
                      element.channel,
                      filter,
                      {
                        time: 120000,
                      }
                    );
                    collector.on("collect", (msg) => {
                      let choice = msg.content;
                      if (
                        choice.startsWith(command1) ||
                        choice.startsWith(command2)
                      ) {
                        if (!msg.deleted) checkPermandDelete(msg, null, false);
                        if (!msgg.deleted) msgg.delete();
                        collector.stop();
                      } else if (choice.toLowerCase().includes("page")) {
                        let npage = choice.split(" ")[1];
                        let isnum = /^\d+$/.test(npage);

                        if (!npage || isnum == false) {
                          if (!msg.deleted)
                            checkPermandDelete(msg, null, false);
                          return channel
                            .send({
                              embeds: [
                                embed
                                  .setDescription(
                                    `Please provide a valid number`
                                  )
                                  .setTitle(`⛔ Error`)
                                  .setColor("RED"),
                              ],
                            })
                            .then((msg) => {
                              if (!msg.deleted)
                                checkPermandDelete(msg, 5000, false);
                            });
                        }
                        if (npage > embeds.length || npage < 1) {
                          if (!msg.deleted)
                            checkPermandDelete(msg, null, false);
                          channel
                            .send({
                              embeds: [
                                embed
                                  .setDescription(`Invalid page number`)
                                  .setTitle(`⛔ Error`)
                                  .setColor("RED"),
                              ],
                            })
                            .then((msg) => {
                              if (!msg.deleted)
                                checkPermandDelete(msg, 5000, false);
                            });
                          return;
                        }
                        page = npage - 1;
                        //if(!msg.deleted) checkPermandDelete(msg)
                        editOrEditReply(element, isCommand, {
                          embeds: [
                            embeds[page].setFooter(
                              `Page ${page + 1}/${embeds.length} || ` +
                                (page == 0 || page + 1 == embeds.length
                                  ? page == 0
                                    ? `type <number> of the org. to learn more | page <pageNumber>`
                                    : `type <number> of the org. to learn more | previous page | page <page>`
                                  : `type <number> of the org. to learn more | previous page | page <page>`)
                            ),
                          ],
                        });
                      } else {
                        choice = parseInt(choice);
                        let isnum = /^\d+$/.test(choice);
                        if (isnum == false) return;
                        if (choice < 1 || choice > amount) return;
                        i = choice - 1;

                        let data = results[i];
                        if (!msg.deleted) checkPermandDelete(msg, null, false);
                        channel
                          .send({
                            embeds: [
                              new MessageEmbed()
                                .setDescription(
                                  `<a:loading:907973094902214668> Fetching the data, please wait.`
                                )
                                .setColor(`ORANGE`),
                            ],
                          })
                          .then((msg) => {
                            let mission =
                              data.mission != null ? data.mission : `-`;
                            if (mission.length > 1024) {
                              mission = truncateString(mission, 1015);
                            }
                            let rawURL = data.organization_url;
                            let url =
                              rawURL == null
                                ? null
                                : rawURL.toLowerCase().includes("http://") ||
                                  rawURL.toLowerCase().includes("https://")
                                ? rawURL
                                : "https://" + rawURL;
                            let newURL = url == null ? `` : url;
                            const orginfo = new MessageEmbed()
                              .setTitle(`**${data.name}**`)
                              .addFields(
                                {
                                  name: `🆔 ein`,
                                  value: `\`${data.ein}\``,
                                  inline: true,
                                },
                                {
                                  name: `🎯 Mission`,
                                  value: `\`${mission.toLowerCase()}\``,
                                },
                                {
                                  name: `🌐 Organization Website`,
                                  value:
                                    newURL != null
                                      ? `[\`Click Here\`](${newURL})`
                                      : `\`-\``,
                                  inline: true,
                                },
                                {
                                  name: `🌐 CharityNavigator Webpage`,
                                  value: `[\`Click Here\`](${data.charity_navigator_url})`,
                                  inline: true,
                                },
                                {
                                  name: `📊 Cause`,
                                  value: `\`${data.cause}\``,
                                  inline: true,
                                },
                                {
                                  name: `🗺️ Country`,
                                  value: `\`${data.country}\``,
                                  inline: true,
                                },
                                {
                                  name: `📍 State`,
                                  value: `\`${data.state}\``,
                                  inline: true,
                                },
                                {
                                  name: `📍 City`,
                                  value: `\`${data.city}\``,
                                  inline: true,
                                },
                                {
                                  name: `📮 Zip`,
                                  value: `\`${data.zip}\``,
                                  inline: true,
                                },
                                {
                                  name: `📭 Street Address 1`,
                                  value: `\`${data.street}\``,
                                  inline: true,
                                },
                                {
                                  name: `📫 Street Address 2`,
                                  value: `\`${
                                    data.street2 == null ||
                                    data.street2 == undefined
                                      ? "-"
                                      : data.street2
                                  }\``,
                                  inline: true,
                                }
                              );
                            msg.edit({ embeds: [orginfo] });
                          });
                      }
                    });
                  });
                })
                .catch((error) => {
                  // Handle any errors that occur
                  console.error(error);
                });
            });
          }
        }
      });
      collector.on("end", () => {
        if (!element.deleted) checkPermandDelete(element, null, isCommand);
      });
    } catch (err) {
      console.log(err);
    }
  },
};

function checkPermandDelete(element, timeout = 0, isCommand) {
  try {
    if (element.guild.me.permissions.has("MANAGE_MESSAGES")) {
      if (isCommand) {
        if (!element.ephemeral) element.deleteReply({ timeout });
      } else element.delete({ timeout });
    }
  } catch (err) {
    console.log(err);
  }
}

function sendOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.channel.send(content);
}

function editOrEditReply(element, isCommand, content) {
  if (isCommand) return element.editReply(content);
  else return element.edit(content);
}

function deleteOrEditReply(element, isCommand, content, timeout = 0) {
  if (isCommand) return element.editReply(content);
  else return element.delete({ timeout });
}
