/**
 * A Bot for Slack!
 */

require("dotenv").config();

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */
let controller;

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}

/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

const getUser = require("./slack_helpers").getUser;
const RCON = require('./RCON').conn;

controller.hears('.*', 'ambient', function (bot, message) {
    getUser(bot, message).then((user) => {
        const text = message.text.replace(/"/g, `\\"`);
        console.log(text);
        RCON.send(`tellraw @a {"text": "<${user}> ${text}"}`);
    })
});

const tail = require("tail").Tail;
const pathToFollow = process.env.MINECRAFT_LOG_LOCATION;
if(!pathToFollow) {
    console.error('Log file not specified! Please set MINECRAFT_LOG_LOCATION');
    process.exit(1);
}

const log_options = {
    fromBeginning: false,
    follow: true,
}

const log = new tail(pathToFollow, log_options);
const pass = [
    "<",
    "[Server]",
    "joined",
    "left",
    "made the advancement",
    "was shot by",
    "was pricked",
    "walked into a cactus",
    "was roasted",
    "drowned",
    "suffocated in a wall",
    "was squished too much",
    "was squashed",
    "experienced kinetic energy",
    "removed an elytra",
    "blew up",
    "blown up",
    "was killed by",
    "hit the ground",
    "fell off",
    "fell from",
    "fell out",
    "fell into",
    "was doomed",
    "fell to far",
    "was shot",
    "was blown",
    "was killed by magic",
    "went up in flames",
    "burned to death",
    "was burnt",
    "walked into fire",
    "went off with",
    "tried to swim",
    "was struct by lightning",
    "discovered the floor was lava",
    "walked into danger zone",
    "was killed by",
    "starved to",
    "was poked to death",
    "was killed",
    "was impaled",
    "was speared",
    "fell out",
    "fell from",
    "didn't want to live",
    "withered away",
    "was pummeled",
    "died",
];

log.on('line', function(data) {
    if (!data) {
        return;
    } else if(pass.some((value) => data.includes(value))) {
        data = data.split(":").slice(3).join(":").slice(1);
    } else {
        return;
    }

    console.log(data);
    let bot = controller.spawn({
        incoming_webhook: {
            url: process.env.SLACK_HOOK,
        } 
    });

    bot.sendWebhook({
        text: data,
        channel: process.env.SLACK_CHANNEL
    }, function(err, res) {
        if(err) {
            console.log(err);
        }
    });
});

/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});
