import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('errortest')
    .setDescription('Test error handling (owner only)')
    .setDMPermission(true),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER) {
      await interaction.reply({ 
        content: `Owner only command`, 
        flags: 64
      });
      return
    }
    throw new Error('This is a test error!');
  }
};