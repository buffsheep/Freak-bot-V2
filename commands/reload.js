import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all commands (owner only)')
    .setDMPermission(true),
  
  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      await interaction.reply({ 
        content: `Owner only command`, 
        flags: 64
      });
      return
    }

    const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    let reloaded = 0;
    
    for (const file of files) {
      try {
        const newCommand = (await import(`./${file}?update=${Date.now()}`)).default;
        interaction.client.commands.set(newCommand.data.name, newCommand);
        reloaded++;
      } catch (error) {
        throw new Error(`Failed to reload ${file}:`, error);
      }
    }
    
    await interaction.reply({ 
      content: `Reloaded ${reloaded}/${files.length} commands!`, 
      flags: 64
    });
  }
};