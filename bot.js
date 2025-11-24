import { Client, Events, GatewayIntentBits, Collection} from 'discord.js';
import fs from 'fs';
import 'dotenv/config';

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

client.commands = new Collection();

const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of files) {
  const command = await import(`./commands/${file}`);
  if (command.default && command.default.data) {
    client.commands.set(command.default.data.name, command.default);
    console.log(`Loaded ${command.default.data.name}`);
  }
}

client.once(Events.ClientReady, c => {
  console.log(`${c.user.tag} initiated`);
  c.user.setActivity('Watching servers...');
});

client.on('interactionCreate', async interaction => {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!interaction.isChatInputCommand()) return;

  if (!command) return;

  try {
    await command.execute(interaction);
    console.log("Command executed: "+interaction.commandName+" By "+interaction.user.tag)
  } catch (error) {
    console.error("Command error: "+interaction.commandName+" By "+interaction.user.tag);
    saveError(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Something went wrong.',
        flags: 64
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

function saveError(content) { 
  let date = String(new Date()).replaceAll(" ", "_").slice(0,24).replaceAll(":", "_");
  fs.writeFile(date+'.txt', content.toString(), 'utf8', (err) => {
   if (err) {
   console.error('Error writing file:', err);
   return;
   }
   console.log('Saved error as '+date+'.txt')
  });
}

