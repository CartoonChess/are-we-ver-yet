// ================= SOME NOTES ===================

/*
    * Quickly restart Repl (while focus is in editor):
        - CMD + return

    * When switching to public fork, make sure to update the token in .env!
*/

// Make console colourful
const chalk = require('chalk');
const print = require('./print.js');

// ================= INIT WEB SERVER ===================

// This allows us to be pinged and kept alive on servers where necessary

const express = require('express');
const expressApp = express();
const expressPort = 3000;

expressApp.get('/', (req, res) =>
	res.send(`<p>Check whether (a different) Discord bot is verified or not.</p><a href="https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_ID}&permissions=536996864&scope=bot">Invite</a>`)
);
expressApp.listen(expressPort, () =>
	print.log(
		chalk.green(
			`\n\n\nBot server listening at http://localhost:${expressPort}`
		),
		'success'
	)
);

// ================= INIT DISCORD BOT ===================

const Discord = require('discord.js');
// A new Discord requirement. Priveleged intents are members lists and presence
// Those require verification. We'll hold off for now.
const client = new Discord.Client({
	ws: { intents: Discord.Intents.NON_PRIVILEGED }
});

// Get commands
client.allCommands = new Discord.Collection(); // supercharged map()
client.executeCommands = new Discord.Collection();
client.monitorCommands = new Discord.Collection();
const fs = require('fs'); // Node file system
const commandFiles = fs
	.readdirSync('./commands')
	.filter(file => file.endsWith('.js'));

// Get jobs
client.jobs = new Discord.Collection();
const jobFiles = fs.readdirSync('./jobs').filter(file => file.endsWith('.js'));

// Set commands
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.allCommands.set(command.name, command);
	if (command.execute) client.executeCommands.set(command.name, command);
	if (command.monitor) client.monitorCommands.set(command.name, command);
}

// Set jobs
for (const file of jobFiles) {
	const job = require(`./jobs/${file}`);
	client.jobs.set(job.name, job);
}

const cooldowns = new Discord.Collection();

// Let global scripts access the client and msg objects
const gl = require('./global.js');
gl.client = client;

const { prefix, reportErrors } = require('./config.json');

// ================= ERROR HANDLING ===================

client.once('ready', () => {
	print.log(`Logged into Discord as ${client.user.tag} to serve ${client.guilds.cache.size} servers.`, 'success');
    // Show help message in status
    client.user.setActivity(`${prefix}help`, { type: 'LISTENING' });
    // Run jobs
	startJobs();
});

// (testing only)
client.on('ready', () => {
    print.log('Received ready event.', 'debug');
})

client.on('warn', warning => print.error(warning, 'warn'));

client.on('error', err => print.error(err, 'error'));

// client.on('invalidated', () => {
//     // "Emitted when the client's session becomes invalidated. You are expected to handle closing the process gracefully and preventing a boot loop if you are listening to this event.""
// });

// Handle any promise warnings (apparently now required to avoid crashes)
process.on('unhandledRejection', err => {
	const msg = `${chalk.red('Uncaught Promise Rejection:')} ${err}`;
	print.error(msg, 'reject');
});

// ================= RUN ENDLESS JOBS ===================

// Called by client.once('ready')
function startJobs() {
    const count = client.jobs.size;
	print.log(`Starting up ${count} jobs.`);
	client.jobs.forEach(job => {
		job.start();
	});
}

// ================= MONITOR ALL MESSAGES ===================

// Hide the token in .env
client.login(process.env.DISCORD_TOKEN);

// Command handlers
function monitorCommand(cmd, msg) {
	runCommand(cmd.monitor(msg));
}

function executeCommand(cmd, msg, args) {
	runCommand(cmd.execute(msg, args));
}

// Don't call this directly.
function runCommand(func) {
	try {
		func;
	} catch (error) {
		print.error(error, 'warn');
		gl.replyMatchingCase(" I'm having trouble doing that 😓");
		// If reportErrors is `true`, send a DM to the server admin
		if (msg.channel.type !== 'dm' && reportErrors) {
			msg.guild.owner.send(
				`${msg.author} tried to execute \`${cmd.name}\` in ${msg.channel} (${
					msg.guild
				}), but it failed:\n\`${error.message}\``
			);
		}
	}
}

client.on('message', msg => {
	gl.msg = msg;

	// === Error handling, part one ===
	// Only respond to human messages
	if (msg.content === prefix || msg.author.bot || msg.webhookID) return;

	// // === Monitors (automatic commands) ===
	client.monitorCommands.forEach(cmd => {
		monitorCommand(cmd, msg);
	});

	// === Error handling, part two ===

	// Only respond to prefixed messages
	if (!msg.content.startsWith(prefix)) return;

	// Get command and arguments
	// Regex will compress multiple spaces into one
	const userMsg = msg.content.slice(prefix.length).trim();
	const args = userMsg.split(/ +/);
	const userCmd = args.shift().toLowerCase();

	// Check if command exists, is an alias, or neither
	const cmd =
		client.executeCommands.get(userCmd) ||
		client.executeCommands.find(
			command => command.aliases && command.aliases.includes(userCmd)
		);
	if (!cmd) {
		return gl.replyMatchingCase(
			` I don't know what \`${userCmd}\` means 😭 Try \`${prefix}help\``
		);
	}

	// TODO: Check user permissions (PRIVATE, ADMIN, or all others)

	// Check if command can be used in DMs
	if (!cmd.dmCompatible && msg.channel.type === 'dm') {
		return msg.reply("I can't do that in a DM 😭");
	}

	// Check for required arguments
	if (cmd.argsRequired && !args.length) {
		let reply = `Try writing something after \`${prefix}${userCmd}\` 😏`;
		if (cmd.usage) {
			reply = `Try this: \`${prefix}${userCmd} ${cmd.usage}\` 😎`;
		}
		return gl.replyMatchingCase(reply);
	}

	// Check for cooldown
	if (cmd.cooldown > 0) {
		if (!cooldowns.has(cmd.name)) {
			cooldowns.set(cmd.name, new Discord.Collection());
		}

		const now = Date.now();
		const times = cooldowns.get(cmd.name);
		const cooldown = (cmd.cooldown || 3) * 1000;

		if (times.has(msg.author.id)) {
			const expiration = times.get(msg.author.id) + cooldown;

			if (now < expiration) {
				const timeLeft = ((expiration - now) / 1000).toFixed();
				const seconds = timeLeft === '0' ? '1' : timeLeft;
				const unit = seconds === '1' ? 'second' : 'seconds';
				return gl.replyMatchingCase(
					`Wait ${seconds} ${unit} before using \`${userCmd}\` again 😓`
				);
			}
		}

		times.set(msg.author.id, now);
		setTimeout(() => times.delete(msg.author.id), cooldown);
	}

	// === Execute command

	// Check if message content should be split into arguments
	if ('splitIntoArgs' in cmd && !cmd.splitIntoArgs) {
		// Remove command from message
		const trimmedMsg = userMsg.substr(userMsg.indexOf(' ') + 1);
		executeCommand(cmd, msg, trimmedMsg);
	} else {
		executeCommand(cmd, msg, args);
	}
});
