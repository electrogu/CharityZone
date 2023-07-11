const lang = require('../lang.json')
//const db = require('quick.db')
module.exports = async (guild, textId) => {
  if (!lang.translations[textId]) {
    throw new Error(`Unknown text ID "${textId}"`)
  }
  const guildLang = 'en'//await db.fetch(`botdil_${guild.id}`);
  const selectedLanguage = guildLang ? guildLang.toLowerCase() : "en"

  return lang.translations[textId][selectedLanguage]
}