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
  client.commands.set(command.default.data.name, command.default);
  console.log(`Loaded ${command.default.data.name}`);
}

client.once(Events.ClientReady, c => {
  console.log(`${c.user.tag} initiated`);
  c.user.setActivity('the 2nd one');
});
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    // Handle button interactions
    if (interaction.customId === 'edit_desc') {
      await interaction.showModal({
        title: 'Edit Description',
        custom_id: 'edit_desc_modal',
        components: [{
          type: 1,
          components: [{
            type: 4,
            custom_id: 'description',
            label: 'New Description',
            style: 2,
            min_length: 1,
            max_length: 1000,
            required: true
          }]
        }]
      });
    } else if (interaction.customId === 'edit_thumb') {
      await interaction.showModal({
        title: 'Edit Thumbnail',
        custom_id: 'edit_thumb_modal',
        components: [{
          type: 1,
          components: [{
            type: 4,
            custom_id: 'thumbnail',
            label: 'New Thumbnail URL',
            style: 2,
            min_length: 1,
            max_length: 500,
            required: true
          }]
        }]
      });
    }
  } else if (interaction.isModalSubmit()) {
    // Handle modal submissions
    if (interaction.customId === 'edit_desc_modal') {
      const description = interaction.fields.getTextInputValue('description');
      if (!description || typeof description !== 'string') {
        return await interaction.reply({ content: 'Invalid description provided.', ephemeral: true });
      }
      // Update database
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db('freakbot');
        const profiles = db.collection('profiles');
        await profiles.updateOne(
          { userId: interaction.user.id },
          { $set: { description } },
          { upsert: true }
        );
        await interaction.reply({ content: 'Profile description updated!', ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while updating your profile.', ephemeral: true });
      } finally {
        await client.close();
      }
    } else if (interaction.customId === 'edit_thumb_modal') {
      const thumbnail = interaction.fields.getTextInputValue('thumbnail');
      if (!thumbnail || typeof thumbnail !== 'string') {
        return await interaction.reply({ content: 'Invalid thumbnail URL provided.', ephemeral: true });
      }
      try {
        new URL(thumbnail);
      } catch {
        return await interaction.reply({ content: 'Invalid URL.', ephemeral: true });
      }
      // Update database
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db('freakbot');
        const profiles = db.collection('profiles');
        await profiles.updateOne(
          { userId: interaction.user.id },
          { $set: { thumbnail } },
          { upsert: true }
        );
        await interaction.reply({ content: 'Profile thumbnail updated!', ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while updating your profile.', ephemeral: true });
      } finally {
        await client.close();
      }
    }
  } else {
    // Handle slash commands
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

