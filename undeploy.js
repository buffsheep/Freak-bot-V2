import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.CLIENT_ID;

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Starting command removal for ${client.guilds.cache.size} guilds...`);

    try {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                console.log(`Removing commands from guild: ${guild.name} (${guildId})`);
                
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: [] }
                );
                
                console.log(`Successfully removed all commands from ${guild.name}`);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to remove commands from guild ${guild.name}:`, error);
            }
        }
        
        console.log('Finished removing commands from all guilds.');
        client.destroy();
    } catch (error) {
        console.error('Undeployment process failed:', error);
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);