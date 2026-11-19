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
    'Useless.',
    'About my husband? :heart: :ring:'
];

const duhhhhhHowJoinServer = [
    'check <#1544091616468271215>!',
    { stickers: ['1570226654855430358']}
]


const responses = [
    {
    words: [['have', 'got'], 'question'],
    replies: questionReplies,
    },
    {
    words: ['how', 'join'],
    replies: duhhhhhHowJoinServer,
    },
    {
    words: ['what', 'ip'],
    replies: duhhhhhHowJoinServer,
    },
    {
    words: ['mod', ['pack', 'list']],
    replies: duhhhhhHowJoinServer,
    },
    {
    words: ['capital', 'france'],
    replies: ['oh oui oui oui, it is paris 🥖'],
    },
    {
    words: ['cow', 'say'],
    replies: ['oh moo moo moo, i speak that too 🐮'],
    },
    {
    words: [['modpack', 'modlist']],
    replies: duhhhhhHowJoinServer,
    },
];

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

        const content = message.content.toLowerCase();
        const tokens = content.match(/\b\w+\b/g) ?? [];

    const replyMessages = responses.find(response => {
        let position = 0;
        return response.words.every(word => {
            const alternatives = Array.isArray(word) ? word : [word];

        const index = tokens.findIndex((token, i) =>
       i >= position && alternatives.includes(token)
        );

        if (index === -1) return false;

        position = index + 1;
        return true;

    });
    });

    if (!replyMessages) return;

    const randomReply = replyMessages.replies[
        Math.floor(Math.random() * replyMessages.replies.length)
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

    if (interaction.commandName === 'mcinfo') {
    await interaction.deferReply({ephemeral: true});

    await interaction.channel.send({
        content: 'check <#1544091616468271215>!',
        stickers: ['1570226654855430358']
    });

    await interaction.deleteReply();

    }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
