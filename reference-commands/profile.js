import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MongoClient } from 'mongodb';

async function getNicknameById(guild, userId) {
  try {
    const member = await guild.members.fetch(userId);
    return member.displayName;
  } catch (error) {
    const user = await guild.client.users.fetch(userId);
    return user.username;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a user\'s profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    if (!process.env.MONGODB_URI) {
      return await interaction.editReply({ content: 'Database configuration missing. Please check the .env file in the main folder.' });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    let db;

    try {
      await client.connect();
      db = client.db('freakbot');
      const profiles = db.collection('profiles');

      const targetUser = interaction.options.getUser('user') || interaction.user;
      const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
      const nickname = await getNicknameById(interaction.guild, targetUser.id);

      const profile = await profiles.findOne({ userId: targetUser.id });

      const embedColor = 0x0099FF;
      const embedDescription = (profile?.description && typeof profile.description === 'string') ? profile.description : 'No description set.';
      const embedThumbnail = (profile?.thumbnail && typeof profile.thumbnail === 'string') ? profile.thumbnail : 'https://i.imgur.com/AfFp7pu.png';

      const exampleEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: targetUser.tag, iconURL: avatarURL })
        .setTitle(`${nickname}'s Profile`)
        .setDescription(embedDescription)
        .setThumbnail(embedThumbnail)
        .setTimestamp();

      let components = [];
      if (targetUser.id === interaction.user.id) {
        const actionRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('edit_desc')
              .setLabel('Edit Description')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('edit_thumb')
              .setLabel('Edit Thumbnail')
              .setStyle(ButtonStyle.Primary)
          );
        components = [actionRow];
      }

      return await interaction.editReply({ embeds: [exampleEmbed], components });

    } catch (error) {
      console.error(error);
      return await interaction.editReply({ content: 'An error occurred while processing your request.' });
    } finally {
      await client.close();
    }
  }
};
