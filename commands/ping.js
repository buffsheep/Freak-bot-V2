import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('ping freak bot'),

  async execute(interaction) {
    return interaction.reply("Pong!");
  }
};