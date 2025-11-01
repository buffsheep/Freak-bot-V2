import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('emojicount')
    .setDescription('see how many times a emoji has been used')
    .addStringOption(option =>
        option.setName('emoji')
            .setDescription('emoji you want to count')
            .setRequired(true)
    ),  
  async execute(interaction) {
    const emoji = interaction.options.getString('emoji');
    await interaction.deferReply();

    const channels = interaction.guild.channels.cache.filter(c => c.type === 0);
    let messages = [];
    
    for (const channel of channels.values()) {
      try {
        const channelMessages = await channel.messages.fetch({ limit: 100 });
        messages = messages.concat(Array.from(channelMessages.values()));
      } catch (error) {
        console.error(`Could not fetch messages from channel ${channel.name}: ${error}`);
      }
    }

    let count = 0;
    let firstUse = null;

    for (const message of messages) {
      const regex = new RegExp(emoji, 'g');
      const contentMatches = (message.content.match(regex) || []).length;
      count += contentMatches;

      const reaction = message.reactions.cache.find(r => r.emoji.toString() === emoji);
      if (reaction) {
        count += reaction.count;
      }

      if ((contentMatches > 0 || reaction) && (!firstUse || message.createdTimestamp < firstUse)) {
        firstUse = message.createdTimestamp;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Emoji Stats for ${emoji}`);

    if (count === 0) {
      embed.setDescription('This emoji has not been used yet.');
    } else {
      const daysSinceFirst = Math.max(1, (Date.now() - firstUse) / (1000 * 60 * 60 * 24));
      const averagePerDay = (count / daysSinceFirst).toFixed(2);
      const firstUseDate = new Date(firstUse).toLocaleDateString();

      embed.addFields(
        { name: 'Total Uses', value: count.toString(), inline: true },
        { name: 'First Used', value: firstUseDate, inline: true },
        { name: 'Average Uses per Day', value: averagePerDay.toString(), inline: true }
      );
    }

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending emoji stats:', error);
      await interaction.editReply('There was an error getting emoji statistics.');
    }
  }
};