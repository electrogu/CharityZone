const {run} = require('../../commands/help')
module.exports = async (client)=> {    
    client.on("messageCreate", message => {
        if(message.mentions.has(client.user)&&!message.content.includes("@everyone")&&!message.content.includes("@here")){
            let args = "", text = "";
            run(message, args, text, client)
        }
    })
  }