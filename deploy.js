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
            console.log(`Loaded command: ${command.data.name}`);
        }
    } catch (error) {
        console.log(`Error loading ${file}:`, error.message);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.CLIENT_ID;

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Starting command deployment for ${client.guilds.cache.size} guilds...`);

    try {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                console.log(`Deploying ${commands.length} commands to guild: ${guild.name} (${guildId})`);
                
                const data = await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                
                console.log(`Successfully deployed ${data.length} commands to ${guild.name}`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to deploy commands to guild ${guild.name}:`, error);
            }
        }
        
        console.log('Finished deploying commands to all guilds.');
        client.destroy();
    } catch (error) {
        console.error('Deployment process failed:', error);
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);