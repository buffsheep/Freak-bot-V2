import { MongoClient } from 'mongodb';

export async function handleProfileInteractions(interaction) {
  if (interaction.isButton()) {
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
    if (interaction.customId === 'edit_desc_modal') {
      const description = interaction.fields.getTextInputValue('description');
      if (!description || typeof description !== 'string') {
        return await interaction.reply({ content: 'Invalid description provided.', ephemeral: true });
      }
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
  }
}
