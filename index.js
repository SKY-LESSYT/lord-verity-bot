
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

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
        'check <#1544091616468271215 > !'
    ],

    'whats the capital of france': [
        'oh oui oui oui, it is paris 🥖'
    ]
};

client.once('ready', () => {
    client.user.setActivity('🙂 Answering Questions', {
        type: ActivityType.Custom
    });

    console.log(`Logged in as ${client.user.tag}!`);
});

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

// ========================================
// LOGIN
// ========================================

client.login(process.env.DISCORD_TOKEN);
