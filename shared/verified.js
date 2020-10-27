// // TODO: Obviously make better use of errors
class CError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class InvalidBotIDError extends CError { }
class FetchFlagsError extends CError { }

const print = require('../print.js');
const Discord = require('discord.js');
const cmdName = __filename.split('/').pop().split('.').shift();
const config = require(`../config/${cmdName}.json`);
const botID = config.botID;

const fm = require('../filemanager.js');
const path = require('path');
const jobConfigFilePath = path.join(__dirname, `../config/${cmdName}.json`);


module.exports = {
    CError,
    InvalidBotIDError,
    FetchFlagsError,
    // Returns the bot user or throws an error
    async fetchBot(client) {
        // We'll need the bot info regardless if verified, so get bot
        //const botID = config.botID;
        try {
            // Will throw if ID is malformed
            const bot = await client.users.fetch(botID);
            // Make sure it's a bot
            if (!bot.bot)
                throw new InvalidBotIDError(`ID#${botID} isn't a bot.`);
            return bot;
        } catch(error) {
            throw error;
        }
    },


    // DEBUG ONLY
    async __fetchBot(client, __botID) {
        // We'll need the bot info regardless if verified, so get bot
        try {
            // Will throw if ID is malformed
            const bot = await client.users.fetch(__botID);
            // Make sure it's a bot
            if (!bot.bot)
                throw new InvalidBotIDError(`ID#${__botID} isn't a bot.`);
            return bot;
        } catch(error) {
            throw error;
        }
    },

    async fetchVerificationStatus(bot) {
        // See if we already cached verification first
        if (config.isVerified) return true;

        // Force uncached, since we're looking for updates
        try {
            const flags = await bot.fetchFlags(true);
            return flags.toArray().includes('VERIFIED_BOT');
        } catch(error) {
            throw new FetchFlagsError(error.message);
        }
    },

    createEmbed(bot, verified) {
        // Get name and avatar
        const username = bot.username;
        const avatarURL = bot.displayAvatarURL();

        // Create embed
        const embed = new Discord.MessageEmbed()
            .setThumbnail(avatarURL);

        if (verified) {
            const permissions = config.permissions || '0';
            const url = `https://discord.com/oauth2/authorize?scope=bot&client_id=${botID}&permissions=${permissions}`;
            embed.setColor('#39a963')
                .setAuthor(
                    username,
                    'https://emoji.gg/assets/emoji/6817_Discord_Verified.png',
                    url
                )
                .setTitle('Now available!')
                .setDescription(`[**ADD TO SERVER**](${url})`);
        } else {
            // No error when using undefined in setAuthor
            const url = config.infoURL;
            embed.setColor('#fc0005')
                .setAuthor(
                    username,
                    //'https://emoji.gg/assets/emoji/bottag.png',
                    'https://www.iconsdb.com/icons/preview/color/7289DA/clock-10-xxl.png',
                    url
                )
                .setTitle('Not yet available...')
            if (url)
                embed.setDescription(`[*more info*](${url})`);
        }

        return embed;
    },

    async updateConfig(key) {
        // TODO: Use db or file locking in future for multiple writes
        await fm.setJSONValue(jobConfigFilePath, key, true);
    }
};