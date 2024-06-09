import TelegramBot, { Message } from "node-telegram-bot-api";
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// replace the value below with the Telegram token you receive from @BotFather
const token: string = process.env.TELEGRAM_TOKEN ?? ""; // it's better to use environment variables

// Create a bot that uses 'polling' to fetch new updates
const bot: TelegramBot = new TelegramBot(token, {
  polling: true,
  request: {
    url: "https://api.openai.com/v1/chat/completions",
    family: 4,
  },
});

// Store chat sessions
const chatSessions: { [key: number]: { role: string; content: string }[] } = {};

// Function to handle OpenAI chat completions
const chatReq = async (message: Message, chatId: number) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatSessions[chatId],
      temperature: 0,
      max_tokens: 1000,
    });
    return response.choices[0].message.content;
  } catch (err) {
    return "Error occurred while processing your request";
  }
};

// Matches "/newchat" command
bot.onText(/\/new-chat/, (msg: Message) => {
  const chatId: number = msg.chat.id;
  // Reset the chat session for this user
  chatSessions[chatId] = [];
  bot.sendMessage(chatId, "New chat session started.");
});

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", async (msg: Message) => {
  const chatId: number = msg.chat.id;

  // Initialize the chat session if it doesn't exist
  if (!chatSessions[chatId]) {
    chatSessions[chatId] = [];
  }

  // Add the user's message to the chat session
  chatSessions[chatId].push({ role: "user", content: msg.text ?? '' });

  // Call chatReq function and await its response
  const response = await chatReq(msg, chatId);

  // Add the bot's response to the chat session
  chatSessions[chatId].push({ role: "assistant", content: response });

  // Send the response back to the chat
  bot.sendMessage(chatId, response);
});
