const { Category } = require('../constants.js');
const gl = require('../global.js');
const cmdName = __filename.split('/').pop().split('.').shift();
const shared = require(`../shared/${cmdName}.js`);
const config = require(`../config/${cmdName}.json`);
const print = require('../print.js');

// Send a message about the bad ID
// Note that msg arg is the Discord object!
function sendIDWarningMessage(msg) {
    let reply = `The configured ID doesn't belong to a bot!`;
    if (msg.channel.type === 'dm') {
        reply += ` Somebody should check my settings... 😞`;
    } else {
        reply += ` Ask <@${msg.guild.owner.id}> to check my settings.`;
    }
    try {
        gl.replyMatchingCase(reply);
    } catch(error) {
        print.error(`Couldn't send message: ${error}`);
    }
}

module.exports = {
	name: cmdName,
    aliases: ['verify', 'imposter'],
	description: 'Check if a bot is verified yet, and add it to your server',
    category: Category.OTHER,
    argsRequired: false,
    dmCompatible: true,
    cooldown: 15,
    execute(msg, userMsg) {
        // TODO: Allow bot owner (dev) to reset isVerified
        this.perform(msg);
	},
    async perform(msg) {
        if (msg.channel.type !== 'dm' && !msg.guild.me.hasPermission('EMBED_LINKS')) {
            return msg.channel.send(`I'm not allowed to do that! Ask <@${msg.guild.owner.id}> to give me permission to embed links. 🥺`);
        }

        // Check bot verification status
        let bot;
        let isVerifiedBot = false;
        try {
            bot = await shared.fetchBot(msg.client);
            // This should never happen
            if (!bot) throw new Error('Bot object null.');

            isVerifiedBot = await shared.fetchVerificationStatus(bot);
        } catch (error) {
            if (error instanceof shared.InvalidBotIDError) {
                sendIDWarningMessage(msg);
                return print.error(`Couldn't verify bot: ${error}`, 'warn');
            } else if (error instanceof shared.FetchFlagsError) {
                print.error(`Couldn't fetch verficication status flags: ${error}`);
            } else {
                print.error(`Couldn't verify bot: ${error}`);
            }
            try {
                gl.replyMatchingCase("Hmm... I couldn't check that bot. 🤷‍♀️");
            } catch(error) {
                print.error(`Couldn't send message: ${error}`);
            }
            return;
        }

        // Send embed
        const embed = shared.createEmbed(bot, isVerifiedBot);
        try {
            await msg.channel.send(embed);
        } catch(error) {
            print.error(`Error sending embed: ${error}`);
        }

        // If bot is newly verified, send message to all subscribers as well
        if (isVerifiedBot && !config.isVerified) {
            const job = msg.client.jobs.get('verified');
            if (job && job.isRunning) {
                job.sendMessageToAll(bot, msg.channel);
            }
        }
    }
};