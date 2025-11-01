import { REST, Routes } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

// sanitize environment values and wrap in async IIFE so older Node versions work
function stripQuotes(v) {
  return typeof v === 'string' ? v.replace(/^"(.*)"$/, '$1') : v;
}

const DISCORD_TOKEN = stripQuotes(process.env.DISCORD_TOKEN);
const CLIENT_ID = stripQuotes(process.env.CLIENT_ID);

(async () => {
  if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env file');
    process.exit(1);
  }

  const commands = [];
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
      try {
          const commandModule = await import(`./commands/${file}`);
          const command = commandModule.default;
          
          if (command.data && typeof command.data.toJSON === 'function') {
              commands.push(command.data.toJSON());
              console.log(`Loaded command: ${command.data.name}`);
          }
      } catch (error) {
          console.log(`Error loading ${file}:`, error.message);
      }
  }

  const rest = new REST().setToken(DISCORD_TOKEN);
  const clientId = CLIENT_ID;

  try {
      console.log(`Started refreshing ${commands.length} application (/) commands globally...`);
      const data = await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands },
      );
      console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
  } catch (error) {
      console.error('Error deploying global commands:', error);
      console.error(error);
      process.exit(1);
  }
})();