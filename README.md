# Are We Ver Yet? <img width="40" alt="Bot avatar" src="https://user-images.githubusercontent.com/43363630/97311813-1d4ba080-18a8-11eb-904c-d8eb58e55a11.png">
Check whether (a different) Discord bot is verified or not. [Invite the bot to your server.](https://discord.com/oauth2/authorize?scope=bot&client_id=770471404276547584&permissions=536996864)

**NOTE: [The bot](https://impostor.molenzwiebel.xyz/) which this one checks is currently hard-coded. See [to do](#to-do) for more.**

## Usage
### The easy way
You can [add this bot](https://discord.com/oauth2/authorize?scope=bot&client_id=770471404276547584&permissions=536996864) to your server without any further setup needed. Send the message `##verified` to check the other bot's status, or `##help` to see a little bit more information. Your server will receive a notification automatically when the bot is verified.

### Self-hosted
If you want to host this bot by yourself, keep in mind the following:
* Create a [Discord application](https://discord.com/developers/applications) with a bot
* Rename `example.env` to `.env` and provide the bot's ID, token, and your Discord ID
* Install [dependencies](#dependencies) for node
* Run `index.js`
#### Dependencies
The main requirements are [Node.js](https://nodejs.org/en/) and [discord.js](https://github.com/discordjs/discord.js). More dependencies can be found in the [packages file](https://github.com/CartoonChess/are-we-ver-yet/blob/master/package.json).

## (FA)Q
#### Will this actually work?
Gosh, I hope so. All going well, a message will automatically show up in your *#general*, *#announcements*, oldest, or top-most channel once the bot receives verification.
#### How often is verification checked?
Every fifteen minutes.
#### Can I do *x* with this bot?
Not yet. See the [planned features](#planned-features).
#### Low-quality post.
New coder/first bot/don't love JS/sorry/please contribute.
#### Are you affiliated with *x*?
No. See the [attributions](#attributions) for a list of those with whom this project is unaffiliated.

## Planned features
- [ ] Respond to @mentions
- [ ] Running total of how long you've been waiting for verification
- [ ] Ability to change command prefix
- [ ] Option to disable verification messages from appearing automatically in your server
- [ ] Ability to change which bot to monitor
- [ ] Monitor multiple bots

## Attributions
* [Imposter bot](https://github.com/molenzwiebel/impostor) by (molenzwiebel)[https://github.com/molenzwiebel]
* molenzwiebel's [Discord server](https://discord.gg/fQk7CHx)
* Among Us by [InnerSloth]
* Icons by [Emoji.gg](https://emoji.gg/) and [Icons DB](https://www.iconsdb.com/)

## Points of interest
Once the Imposter bot was announced, I gave up on the first version of this bot, which was a very lacklustre room code announcer. However, I was also spending that time writing an installer to get Among Us going on Mac. If you're interested, check out [Among Us for macOS](https://github.com/cartoonchess/among-us-mac).
