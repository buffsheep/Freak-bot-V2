import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('forwardall')
    .setDescription('Forward all media in channel to target channel as raw files/links')
    .addStringOption(option =>
      option
        .setName('target')
        .setDescription('The target channel ID to forward media to')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    // Defer the reply since this operation might take time
    await interaction.deferReply({ ephemeral: true });

    const targetChannelId = interaction.options.getString('target');
    const sourceChannel = interaction.channel;

    try {
      // Fetch the target channel
      let targetChannel;
      try {
        targetChannel = await interaction.client.channels.fetch(targetChannelId);
      } catch (error) {
        return await interaction.editReply('The specified channel ID is invalid or I cannot access that channel.');
      }

      // Check if the channel is a text-based channel
      if (!targetChannel.isTextBased()) {
        return await interaction.editReply('The target channel must be a text-based channel.');
      }

      // Check if source and target are the same channel
      if (targetChannel.id === sourceChannel.id) {
        return await interaction.editReply('Source and target channels cannot be the same.');
      }

      // Check if bot has permissions in source channel
      const sourcePermissions = sourceChannel.permissionsFor(interaction.client.user);
      if (!sourcePermissions.has(PermissionFlagsBits.ReadMessageHistory) || 
          !sourcePermissions.has(PermissionFlagsBits.ViewChannel)) {
        return await interaction.editReply('I need Read Message History and View Channel permissions in this channel.');
      }

      // Check if bot has permissions in target channel
      const targetPermissions = targetChannel.permissionsFor(interaction.client.user);
      if (!targetPermissions.has(PermissionFlagsBits.SendMessages) || 
          !targetPermissions.has(PermissionFlagsBits.AttachFiles) ||
          !targetPermissions.has(PermissionFlagsBits.ViewChannel)) {
        return await interaction.editReply('I need Send Messages, Attach Files, and View Channel permissions in the target channel.');
      }

      let mediaCount = 0;
      let lastId = null;
      let forwardCount = 0;

      // Send initial progress message
      await interaction.editReply(`Starting to forward media from this channel to the target channel as raw files/links...`);

      // Fetch messages in batches
      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await sourceChannel.messages.fetch(options);
        if (messages.size === 0) break;

        // Sort messages by creation date (oldest first for proper ordering)
        const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        for (const message of sortedMessages.values()) {
          // Skip messages without any media content
          const hasMediaAttachments = message.attachments.size > 0 && 
            Array.from(message.attachments.values()).some(attachment => 
              attachment.contentType?.startsWith('image/') || 
              attachment.contentType?.startsWith('video/') ||
              attachment.contentType?.startsWith('audio/')
            );
          
          const hasMediaEmbeds = message.embeds.length > 0 && 
            message.embeds.some(embed => 
              embed.type === 'image' || 
              embed.type === 'video' || 
              embed.type === 'gifv' ||
              embed.thumbnail ||
              embed.image ||
              embed.video
            );

          if (!hasMediaAttachments && !hasMediaEmbeds) continue;

          try {
            // Process media attachments - send as raw files
            if (hasMediaAttachments) {
              const mediaAttachments = Array.from(message.attachments.values()).filter(attachment => 
                attachment.contentType?.startsWith('image/') || 
                attachment.contentType?.startsWith('video/') ||
                attachment.contentType?.startsWith('audio/')
              );

              for (const attachment of mediaAttachments) {
                // Send as raw file attachment
                await targetChannel.send({
                  files: [attachment.url]
                });

                mediaCount++;
                forwardCount++;

                // Update progress every 10 items
                if (forwardCount % 10 === 0) {
                  await interaction.editReply(`Forwarded ${forwardCount} media items so far...`);
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            // Process embeds - send as raw URLs
            if (hasMediaEmbeds) {
              for (const embed of message.embeds) {
                let mediaUrl = null;

                // Extract media URL based on embed type
                if (embed.type === 'image' && embed.url) {
                  mediaUrl = embed.url;
                } else if (embed.type === 'video' && embed.url) {
                  mediaUrl = embed.url;
                } else if (embed.type === 'gifv' && embed.url) {
                  mediaUrl = embed.url;
                } else if (embed.image && embed.image.url) {
                  mediaUrl = embed.image.url;
                } else if (embed.thumbnail && embed.thumbnail.url) {
                  mediaUrl = embed.thumbnail.url;
                } else if (embed.video && embed.video.url) {
                  mediaUrl = embed.video.url;
                }

                if (mediaUrl) {
                  // Send as raw URL message
                  await targetChannel.send(mediaUrl);

                  mediaCount++;
                  forwardCount++;

                  // Update progress every 10 items
                  if (forwardCount % 10 === 0) {
                    await interaction.editReply(`Forwarded ${forwardCount} media items so far...`);
                  }

                  // Small delay to avoid rate limits
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            }

          } catch (error) {
            console.error('Error forwarding media:', error);
            // Continue with next media instead of stopping entirely
            continue;
          }
        }

        lastId = messages.last().id;

        // Break if we've fetched all messages
        if (messages.size < 100) break;
      }

      await interaction.editReply(`Successfully forwarded ${mediaCount} media items from this channel to the target channel as raw files/links.`);
      
    } catch (error) {
      console.error('Error forwarding media:', error);
      
      if (error.code === 50001) {
        await interaction.editReply('I do not have access to one of the channels. Please check my permissions.');
      } else if (error.code === 50013) {
        await interaction.editReply('I do not have the required permissions in one of the channels.');
      } else {
        await interaction.editReply('An unexpected error occurred while forwarding media. Please try again later.');
      }
    }
  }
};