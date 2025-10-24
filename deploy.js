import { REST, Routes } from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

const commands = [];
const globalCommands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const commandModule = await import(`./commands/${file}`);
        const command = commandModule.default;
        
        if (command.data && typeof command.data.toJSON === 'function') {
            if (command.data.name === 'fowardall') {
                globalCommands.push(command.data.toJSON());
                console.log(`Loaded for global deployment: ${command.data.name}`);
            } else {
                commands.push(command.data.toJSON());
                console.log(`Loaded for guild deployment: ${command.data.name}`);
            }
        } else {
            console.log(`Skipping ${file}: missing data or toJSON method`);
        }
    } catch (error) {
        console.log(`Error loading ${file}:`, error.message);
    }
}

console.log(`Preparing to deploy ${commands.length} commands to guild and ${globalCommands.length} global commands`);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
    // Deploy guild commands
    console.log('Deploying commands to guild');
    const guildData = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, '1430826414776778754'),
        { body: commands }
    );
    console.log(`Successfully deployed ${guildData.length} commands to guild!`);

    // Deploy global command (only for "fowardall")
    if (globalCommands.length > 0) {
        console.log('Deploying global commands');
        const globalData = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: globalCommands }
        );
        console.log(`Successfully deployed ${globalData.length} commands globally!`);
    }
} catch (error) {
    console.error('Deployment failed:', error);
}