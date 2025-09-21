require("dotenv").config();
import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import QueueManager from "./queueManager";

// Load environment variables
const BOT_TOKEN = process.env.DISCORD_LLM_BOT_TOKEN; 

// Create an instance of Client and set the intents to listen for messages.
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
    ],
});

const queue = new QueueManager();

// Once the WebSocket is connected, log a message to the console.
client.once(Events.ClientReady, () => {
    console.log('Bot is online!');
});

// Handle @ mentions
client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Check if the bot is mentioned
    if (!message.mentions.has(client.user!)) return;
    
    // Get the content after the mention
    const content = message.content.replace(/<@!?\d+>/g, '').trim();
    
    if (!content) {
        await message.reply('Please provide a prompt after mentioning me!');
        return;
    }
    
    // Create a mock interaction object for the queue
    const mockInteraction = {
        id: message.id,
        user: message.author,
        options: {
            getString: () => content
        },
        editReply: async (content: string) => {
            const sentMessage = await message.reply(content);
            return sentMessage;
        },
        deleteReply: async () => {
            // Don't delete anything for @ mentions
        }
    };
    
    // Add to queue
    queue.addItem(mockInteraction as any);
});

// Log in with the bot's token.
client.login(BOT_TOKEN);
