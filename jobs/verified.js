//
// Keeps checking if a bot is verified until it finally is
//
// Because this is specifically to ask about unverified bots, we cannot ask about any privileged intents, i.e. guild members or their presence.
// This keeps us from having to be verified ourselves, but we must be careful not to reference any of these objects
//

const gl = require('../global.js');
const print = require('../print.js');
const { CronJob } = require('cron');

const jobName = __filename.split('/').pop().split('.').shift();
const shared = require(`../shared/${jobName}.js`);

//
// Config file prevents this from running again after verification has happened.
// - A version with multiple bots would keep the process running,
// - but change which bots are checked. We'll see what we can do.
//

const path = require('path');
const jobConfigFilePath = path.join(__dirname, `../config/${jobName}.json`);
const jobConfigFile = require(jobConfigFilePath);

let isVerified = jobConfigFile.isVerified;
let didSendMessageThisSession = false;


// Checks every 15 minutes
const job = new CronJob(
    '0 */15 * * * *',
    function() {
        repeatJob();
    });

// Setup
function startJob() {
    // Don't run the job if the bot is already verified
    if (isVerified) return;

    print.log(`Starting "${jobName}" job.`);
    job.start();
}

// Check conditions each time
async function repeatJob() {
    print.log(`Repeating "${jobName}" job.`);
    
    // Check bot verification status
    // TODO: This is mostly copypasta from commands/verified.js
    let bot;
    let isNowVerified = false;
    try {
        // DEBUG
        //bot = await shared.__fetchBot(gl.client, "755520374510321745");
        bot = await shared.fetchBot(gl.client);
        // This should never happen
        if (!bot) throw new Error('Bot object null.');

        isNowVerified = await shared.fetchVerificationStatus(bot);
    } catch (error) {
        if (error instanceof shared.InvalidBotIDError) {
            return print.error(`Couldn't verify bot: ${error}`, 'warn');
        } else if (error instanceof shared.FetchFlagsError) {
            return print.error(`Couldn't fetch verficication status flags: ${error}`);
        } else {
            return print.error(`Couldn't verify bot: ${error}`);
        }
    }

    // NOTE: Uncomment for debug
    // isNowVerified = __debug_deletedStatus();

    // If the bot has been verified, stop the cron job
    if (isNowVerified) {
        prepareToFinishJob(bot);
    }
}

function stopJob() {
    print.log(`Stopping "${jobName}" job.`);
    job.stop();
}

// triggerChannel optional; only used in command form
function prepareToFinishJob(bot, triggerChannel) {
    // Stop checking and alert servers
    print.log('Bot is now verified!', 'success');
    stopJob();
    isVerified = true;
    shared.updateConfig('isVerified');
    sendVerifiedMessage(bot, triggerChannel);
}

// NOTE: This is only for debugging
function __debug_deletedStatus() {
    print.log('Checking channel... DO NOT USE IN PRODUCTION.', 'debug');
    const channel = gl.client.channels.cache.get('00000000000000000');
    let isDeleted = false;
    if (typeof channel === 'undefined'
        || channel.deleted)
        isDeleted = true;
    return isDeleted;
}

// Send message automatically when we finally have success
// triggerChannel is optional, and will not repeat message to channel that called the command, if applicable
function sendVerifiedMessage(bot, triggerChannel) {
    // Make sure this can only be triggered once
    // Local var for current process, json for after reboots
    // Also prevents us accidentally running the job again via job.start()
    //if (didSendMessageThisSession || jobConfigFile.didSendMessage) return;
    if (didSendMessageThisSession) return;
    didSendMessageThisSession = true;

    // Send message to all servers
    print.log('Sending messages out to all subscribers.');
    gl.client.guilds.cache.forEach(guild => {
        // Servers can theorically be unreachable
        if (!guild.available) {
            const name = guild.name ? guild.name : '(unknown)';
            return print.error(`Server "${name}" is unavailable.`, 'warn');
        }

        // Send embed
        // Uncomment for DEBUG
        // const message = 'Channel was deleted, maybe!';
        const embed = shared.createEmbed(bot, true);
        
        const channel = getChannelFromGuild(guild);
        if (channel) {
            if (channel === triggerChannel)
                return print.log('Skipping trigger channel.');
            channel.send(embed)
                .then(() => {
                    print.log(`Sent message to ${guild.name}(#${channel.name}).`);
                })
                .catch(error => {
                    return print.error(`Could not send message to ${guild.name}(#${channel.name}): ${error}`);
                });
        } else {
            // Try to DM guild owner
            return guild.owner.user.send(message)
                .catch(error => {
                    return print.error(`Server "${guild.name}" has no usable channels and we can't DM the owner, so we're giving up.`, 'warn');
                });
        }
    });

    //shared.updateConfig('didSendMessage');
}

function getChannelFromGuild(guild) {
    // Some servers have this disabled
    let channel = guild.systemChannel;
    if (!channel) {
        print.log(`Server "${guild.name}" has no system channel.`);
        // Return the first channel with this name
        channel = guild.channels.cache.find(channel => 
            channel.name === 'general'
        );
    }
    if (!channel) {
        channel = guild.channels.cache.find(channel => 
            channel.name === 'announcements'
        );
    }
    // The default channel for older servers, apparently
    if (!channel)
        channel = guild.channels.cache.get(guild.id);
    // Fallback is to find anywhere we can send a message
    // This appears to message the oldest channel?
    if (!channel) {
        channel = guild.channels.cache.find(channel =>
            channel.type === 'text'
            && channel.permissionsFor(gl.client.user).has('SEND_MESSAGES')
            && channel.permissionsFor(gl.client.user).has('EMBED_LINKS')
        )
    }
    return channel;
}


// Public access
module.exports = {
    name: jobName,
    get isRunning() {
        // Change undefined (if never run) to false
        return job.running ? true : false;
    },
    start() {
        startJob();
    },
    stop() {
        stopJob();
    },
    sendMessageToAll(bot, triggerChannel) {
        prepareToFinishJob(bot, triggerChannel);
    }
}