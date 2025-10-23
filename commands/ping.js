import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('ping freak bot')
    .setDMPermission(true),

  async execute(interaction) {
    interaction.reply("Pong!");
    return
  }
};