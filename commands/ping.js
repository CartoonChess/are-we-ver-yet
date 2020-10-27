const { Category } = require('../constants.js');

module.exports = {
	name: __filename.split('/').pop().split('.').shift(),
    aliases: ['pong'],
	description: 'Check that the bot is listening',
    category: Category.ADMIN,
    argsRequired: false,
    dmCompatible: true,
    cooldown: 5,
	execute(msg, args) {
		const userPing = Math.round(new Date().getTime() - msg.createdTimestamp);
        const webSocketPing = Math.round(msg.client.ws.ping);
        const response = `👩‍💻—${userPing}ms—>🤖—${webSocketPing}ms—>🏢`;
        msg.channel.send(response);
	},
};