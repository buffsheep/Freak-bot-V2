import { REST, Routes } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const commandModule = await import(`./commands/${file}`);
        const command = commandModule.default;
        
        if (command.data && typeof command.data.toJSON === 'function') {
            commands.push(command.data.toJSON());
            console.log(`Loaded: ${command.data.name}`);
        } else {
            console.log(`Skipping ${file}: missing data or toJSON method`);
        }
    } catch (error) {
        console.log(`Error loading ${file}:`, error.message);
    }
}

console.log(`Preparing to deploy ${commands.length} commands to guild`);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
    console.log('Deploying commands to guild');

    const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, '1430826414776778754'),
        { body: commands }
    );

    console.log(`Successfully deployed ${data.length} commands to guild!`);
} catch (error) {
    console.error('Guild deployment failed:', error);
}