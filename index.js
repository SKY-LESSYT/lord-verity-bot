require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const { status } = require('minecraft-server-util');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const MINECRAFT_SERVER = 'starsoul.industries';
const CHECK_INTERVAL = (5 * 60) * 1000;
const FLETCHER_GIF = "https://tenor.com/view/whiplash-gif-9431479052148052111";

const customCommands = {
    announce: {
        channelId: '1541157826653593603',
        message: 'Something is coming in 3 days.'
    }
};

const questionReplies = [
    '... You called?',
    'Ask me anything!',
    'It better be good...',
    '🙂',
    'Oh really?',
    'Useless.'
];

const responses = {
    'i have a question': questionReplies,
    'i got a question': questionReplies,

    'how do i join the server': [
        'check <#1544091616468271215>!'
    ],

    'whats the capital of france': [
        'oh oui oui oui, it is paris 🥖'
    ],

    'what does the cow say': [
        'oh moo moo moo, i speak that too 🐮'
    ],

    'mod name': [FLETCHER_GIF],
    'mod name?': [FLETCHER_GIF],
};

// MINECRAFT SERVER STATUS
let lastStatus = null;

async function updateMinecraftStatus() {
    let newStatus;

    try {
        const result = await status(MINECRAFT_SERVER, 25565, {
            timeout: 5000
        });

        const playersOnline = result.players.online;

        newStatus = `${playersOnline} Players online`;

    } catch (error) {
        newStatus = 'SMP Offline';
    }

    // Avoid unnecessary Discord presence updates
    if (newStatus === lastStatus) return;

    lastStatus = newStatus;

    client.user.setActivity(newStatus, {
        type: ActivityType.Custom
    });

    console.log(`Minecraft status updated: ${newStatus}`);
}

// BOT READY
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await updateMinecraftStatus();
    setInterval(updateMinecraftStatus, CHECK_INTERVAL);
});

// AUTOMATIC REPLIES
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content
        .toLowerCase()
        .trim()
        .replace(/[?!.,]+$/, '');

    const replyMessages = responses[content];

    if (!replyMessages) return;

    const randomReply = replyMessages[
        Math.floor(Math.random() * replyMessages.length)
    ];

    try {
        await message.reply(randomReply);
    } catch (error) {
        console.error('Failed to send automatic reply:', error);
    }
});

// SLASH COMMANDS
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'announce') {
        if (!interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        )) {
            await interaction.reply({
                content: 'You must be an administrator to use this command.',
                ephemeral: true
            });
            return;
        }

        const command = customCommands.announce;

        try {
            const channel = await client.channels.fetch(
                command.channelId
            );

            if (
                !channel ||
                !channel.isTextBased() ||
                !channel.isSendable()
            ) {
                await interaction.reply({
                    content: 'The configured destination channel is unavailable.',
                    ephemeral: true
                });
                return;
            }

            await channel.send(command.message);

            await interaction.reply({
                content: 'Announcement sent successfully!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Failed to send announcement:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Failed to send the announcement.',
                    ephemeral: true
                });
            }
        }
    }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
