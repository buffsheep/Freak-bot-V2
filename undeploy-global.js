import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.CLIENT_ID;

try {
    console.log('Started removing all global application (/) commands...');

    await rest.put(
        Routes.applicationCommands(clientId),
        { body: [] }
    );

    console.log('Successfully removed all global application (/) commands.');
} catch (error) {
    console.error('Error removing global commands:', error);
}