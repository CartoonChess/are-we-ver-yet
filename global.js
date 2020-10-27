//
// Yeah, yeah. I know.
//
// Anyway, it still needs to be imported on every file:
// const gl = require('./global.js');
//
// Also make some objects available globally:
// msg
//

// TODO: Move mention funcs to own module
// TODO: Pass msg+client so gl.msg/client is available everywhere e.g. print
// - or perhaps move this to constants

const { MentionType } = require('./constants.js');
const print = require('./print.js');


// Private funcs
function getFromMention(mention, type) {
    // Don't try this if we didn't set the msg
    if (!module.exports.msg) {
        return print.error('Make sure to set `gl.msg = msg`!');
    }
    const matches = mention.match(type);
    // [1] = ID number without <* >
    if (matches) return matches[1];
}


// Public funcs
module.exports = {
    // Specify the case of the first letter of a string
    changeCaseOfFirstCharacter: function(content, capitalize) {
        let firstLetter = content.charAt(0);
        if (capitalize) {
            firstLetter = firstLetter.toUpperCase();
        } else {
            firstLetter = firstLetter.toLowerCase();
        }
        return firstLetter + content.slice(1);
    },

    // Use appropriate letter case depending on @mentioning or not
    replyMatchingCase: function(content, options) {
        if (!this.msg) {
            return print.error('Make sure to set `gl.msg`!');
        }
        let newContent = content;
        // We can force the first letter to remain capitalized (e.g. proper noun)
        if (content.charAt(0) !== ' ') {
            const capitalize = (this.msg.channel.type === 'dm') ? true : false;
            newContent = this.changeCaseOfFirstCharacter(content, capitalize);
        } else {
            newContent = content.slice(1);
        }
        this.msg.reply(newContent, options)
            .catch(error =>
                print.error('Failed to reply using replyMatchingCase.', 'warn')
            )
    },

    getUserFromMention: function(mention) {
        const user = getFromMention(mention, MentionType.USER);
        if (!user) return;
        return this.msg.client.users.cache.get(user);
    },

    getChannelFromMention: function(mention) {
        const channel = getFromMention(mention, MentionType.CHANNEL);
        if (!channel) return;
        return this.msg.client.channels.cache.get(channel);
    }
}