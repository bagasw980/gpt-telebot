import express from "express";
import TelegramBot, { Message } from "node-telegram-bot-api";
import axios from "axios";
import * as https from "https";
require("dotenv").config();

// Ensure environment variables are set
const token: string | undefined = process.env.TELEGRAM_TOKEN;
const openaiApiKey: string | undefined = process.env.OPENAI_API_KEY;

if (!token) {
  throw new Error("TELEGRAM_TOKEN environment variable not set");
}

if (!openaiApiKey) {
  throw new Error("OPENAI_API_KEY environment variable not set");
}

// Set up the Express server
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, this is your HTTP server running!");
});

// Start the Express server
app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});

// Create a bot that uses 'polling' to fetch new updates
const bot: TelegramBot = new TelegramBot(token, { polling: true });

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Example: Disable SSL verification, customize as needed
  }),
});

// Function to handle OpenAI chat completions
const chatReq = async (message: Message) => {
  try {
    const response = await axiosInstance.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message.text }],
        temperature: 0,
        max_tokens: 1000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Error in chatReq:', err);
    return 'Error occurred while processing your request';
  }
};

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg: Message, match: RegExpExecArray | null) => {
  if (match === null) return;

  const chatId: number = msg.chat.id;
  const resp: string = match[1];

  bot.sendMessage(chatId, resp).catch(err => {
    console.error('Error sending echo message:', err);
  });
});

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", async (msg: Message) => {
  const chatId: number = msg.chat.id;

  try {
    const response = await chatReq(msg);
    bot.sendMessage(chatId, response).catch(err => {
      console.error('Error sending response message:', err);
    });
  } catch (err) {
    console.error('Error processing message:', err);
    bot.sendMessage(chatId, 'An error occurred while processing your message.').catch(err => {
      console.error('Error sending error message:', err);
    });
  }
});

// Listen for polling errors and log them
bot.on("polling_error", (error) => {
  const pollingError = error;
  console.error('Polling error:', pollingError.message);
});

bot.on("error", (error) => {
  const botError = error as { code: string, message: string };
  console.error('Bot error:', botError.code, botError.message);
});
