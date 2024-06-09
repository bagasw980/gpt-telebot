import TelegramBot, { Message } from "node-telegram-bot-api";
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// replace the value below with the Telegram token you receive from @BotFather
const token: string = process.env.TELEGRAM_TOKEN ?? ''; // it's better to use environment variables

// Create a bot that uses 'polling' to fetch new updates
const bot: TelegramBot = new TelegramBot(token, { polling: true });

// Function to handle OpenAI chat completions
const chatReq = async (message: Message) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message.text }],
      temperature: 0,
      max_tokens: 1000,
    });
    return response.choices[0].message.content;
  } catch (err) {
    return 'Error occurred while processing your request';
  }
};

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg: Message, match: RegExpExecArray | null) => {
  if (match === null) return;

  const chatId: number = msg.chat.id;
  const resp: string = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", async (msg: Message) => {
  const chatId: number = msg.chat.id;

  // Call chatReq function and await its response
  const response = await chatReq(msg);

  // Send the response back to the chat
  bot.sendMessage(chatId, response);
});
