const { prefix } = require('../config.json');
const { Category } = require('../constants.js');

module.exports = {
	name: __filename.split('/').pop().split('.').shift(),
    aliases: ['man', 'helpme', 'info'],
	description: 'More about this bot and its commands',
    category: Category.OTHER,
    argsRequired: false,
    usage: '[command]',
    dmCompatible: true,
    cooldown: 3,
	execute(msg, args) {
        const data = [];
        const { allCommands } = msg.client;

        // Help with specific command
        if (args.length) {
            const cmdName = args[0].toLowerCase();
            const cmd = allCommands.get(cmdName) || allCommands.find(c => c.aliases && c.aliases.includes(cmdName));

            // Explain command if it exists, otherwise fall back to general help
            if (cmd) {
                data.push(`**Name:** ${cmd.name}`);

                if (cmd.aliases) data.push(`**Aliases:** ${cmd.aliases.join(', ')}`);
                if (cmd.description) data.push(`**Description:** ${cmd.description}`);
                if (cmd.usage) data.push(`**Usage:** ${prefix}${cmd.name} ${cmd.usage}`);
                // if (cmd.adminUsage) data.push(`**Admin Usage:** ${prefix}${cmd.name} ${cmd.adminUsage}`);

                // const modes = [];
                // if (cmd.execute) modes.push('manual');
                // if (cmd.monitor) modes.push('automatic');
                // data.push(`**Mode:** ${modes.join(' and ')}`);

                // const category = cmd.category || 'uncategorized';
                // data.push(`**Category:** ${category}`);

                return msg.channel.send(data, { split: true });
            }

            data.push(`I don't know what \`${cmdName}\` means 😭\n`);
        }

        // General help
        data.push('Here\'s a list of all my commands:');
        const joinedCommands = allCommands.map(cmd => cmd.name).join(', ');
        data.push(`\`${joinedCommands}\``);
        data.push(`\nYou can send \`${prefix}help command-name\` to get info on a specific command!`);
        // GitHub link
        data.push(`\n*More info at https://github.com/CartoonChess/are-we-ver-yet*`);

        return msg.author.send(data, { split: true })
            .then(() => {
                if (msg.channel.type === 'dm') return;
                msg.reply('check the direct message I sent you ☺️');
            })
            .catch(error => {
                print.error(`Could not send help DM to ${msg.author.tag}: ${error}`, 'warn');
                // Attempt to send message directly in channel
                msg.channel.send(data, { split: true });

            });
	},
};