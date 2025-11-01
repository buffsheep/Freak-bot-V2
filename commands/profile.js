import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

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
    .setDescription('Display your own or someone elses profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to display')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

    const nickname = await getNicknameById(interaction.guild, targetUser.id);

    const exampleEmbed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setAuthor({ name: targetUser.tag, iconURL: avatarURL})
    .setTitle(`${nickname}'s Profile`)
    .setDescription('Some description here')
    .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    .addFields(
        { name: 'Regular field title', value: 'Some value here' },
        { name: '\u200B', value: '\u200B' },
        { name: 'Inline field title', value: 'Some value here', inline: true },
        { name: 'Inline field title', value: 'Some value here', inline: true },
    )
    .setImage('https://i.imgur.com/AfFp7pu.png')
    .setTimestamp()
    .setFooter({ text: 'Some footer text', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

    return await interaction.reply({ embeds: [exampleEmbed] });
  }
};