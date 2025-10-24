import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('forwardall')
    .setDescription('Forward all messages in channel to target channel')
    .setContexts([0])
    .addChannelOption(option =>
      option
        .setName('target')
        .setDescription('The channel to forward messages to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('target');
    const sourceChannel = interaction.channel;

    // Defer the reply since this operation might take time
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if bot has permissions in both channels
      const sourcePermissions = sourceChannel.permissionsFor(interaction.client.user);
      const targetPermissions = targetChannel.permissionsFor(interaction.client.user);

      if (!sourcePermissions.has(PermissionFlagsBits.ReadMessageHistory)) {
        return await interaction.editReply('I need "Read Message History" permission in this channel.');
      }

      if (!targetPermissions.has(PermissionFlagsBits.SendMessages)) {
        return await interaction.editReply(`I need "Send Messages" permission in ${targetChannel}.`);
      }

      if (!targetPermissions.has(PermissionFlagsBits.AttachFiles)) {
        return await interaction.editReply(`I need "Attach Files" permission in ${targetChannel}.`);
      }

      let messageCount = 0;
      let lastId = null;

      // Fetch messages in batches
      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await sourceChannel.messages.fetch(options);
        if (messages.size === 0) break;

        // Sort messages by creation date (oldest first for proper ordering)
        const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        for (const message of sortedMessages.values()) {
          // Skip bot messages and empty messages
          if (message.author.bot) continue;
          if (!message.content && message.attachments.size === 0) continue;

          try {
            const content = message.content || '';
            const files = Array.from(message.attachments.values());

            // Send message to target channel
            await targetChannel.send({
              content: content ? `**${message.author.tag}:** ${content}` : `**${message.author.tag}**`,
              files: files,
              embeds: message.embeds
            });

            messageCount++;
          } catch (error) {
            console.error('Error forwarding message:', error);
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        lastId = messages.last().id;

        // Break if we've fetched all messages
        if (messages.size < 100) break;
      }

      await interaction.editReply(`Successfully forwarded ${messageCount} messages from ${sourceChannel} to ${targetChannel}.`);
      
    } catch (error) {
      console.error('Error forwarding messages:', error);
      await interaction.editReply('An error occurred while forwarding messages. Please try again later.');
    }
  }
};