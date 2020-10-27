//
// Pretty console output
//

const chalk = require('chalk');
const gl = require('./global.js');


// TODO: Use multiple funcs instead of trailing string arg:
// = https://developer.mozilla.org/en-US/docs/Web/API/console
// TODO: Make them embeds instead (get colour from ANSI and parse label as title or similar)

// Private funcs
async function print(msg, type) {
    const typeLabel = ` ${type.toUpperCase()} `;
    let label = chalk.inverse;

    switch (type) {
        case 'success':
            label = label.green(typeLabel);
            console.log(label, msg);
            break;
        case 'warn':
            label = label.yellow(typeLabel);
            console.warn(label, msg);
            break;
        case 'reject':
        case 'error':
            label = label.red(typeLabel);
            console.error(label, msg);
            break;
        case 'debug':
            label = label.cyan(typeLabel);
            console.log(label, msg);
            break;
        default:
            label = chalk.inverse(typeLabel);
            console.log(label, msg);
    }

    // Only for internal testing
    // Need to check each time in case it was changed
    if (require('./config.json').debugMode) {
        sendToDiscord(label, msg);
    }
}

// Send print logs to Discord user DM
async function sendToDiscord(label, msg) {
        const client = gl.client;
        if (!client)
            return console.error(chalk.red('Make sure to set `gl.client = client`!'));

        // Don't send a message if bot isn't ready
        if (!client.uptime) return;

        // Remove colour formatting (unsupported by Discord)
        const strip = require('strip-ansi');
        const strippedMsg = strip(`\`${label} ${msg}\``);

        const devUser = await client.users.fetch(process.env.PRIVATE_ID);
        devUser.send(strippedMsg, { split: true })
            .catch(error => {
                const errMsg = `Could not send debug message to ${devUser.tag}.\n`;
                console.warn(chalk.yellow(errMsg));
            });
}

// Public funcs
module.exports = {
    log(msg, type) {
        if (!type)
            type = 'info';
        print(msg, type);
    },
    error(msg, type) {
        if (!type)
            type = 'error';
        print(msg, type);
    },
    // getLabel(type) {
    //     if (!type)
    //         type = 'info';
        
    // }
}