import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import mc from "minecraftstatuspinger";
import jsonData from '../servers.json' with { type: 'json' };
import util from 'node:util';
import { Worker } from 'node:worker_threads';

export default {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('get available servers!'),

  async execute(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.user || "User";

    let serverData = await getServers();
    serverData.sort((b, a) => a[1] - b[1]).splice(5); // sort in order of current players and get top 5

    let formattedServerData = []
    serverData.forEach((server) => {
      formattedServerData.push(util.format('**%s**\n⤷%s/%s Players - IP: %s\n', server[0], server[1], server[2], server[3]));
    });

    const newEmbed = new EmbedBuilder()
        .setColor([255, 0, 0])
        .setAuthor({ name: targetUser.tag})
        .setTitle(`**Top Servers**`)
        .setDescription(formattedServerData.join("\n"))
        .setTimestamp();

    return interaction.editReply({ embeds: [newEmbed] });
  }
};

async function getServers() {
  let serverinfo = [];
  let temp1 = [];
  for (let index = 0; index < jsonData.servers.length; index++) {
    temp1 = await pingMcServer(jsonData.servers[index].ip, jsonData.servers[index].port);
    if (temp1 !== undefined) {
      serverinfo.push(temp1.concat([jsonData.servers[index].ip]));
    }
  }
  return serverinfo
}

async function pingMcServer(host, port) {
  try {
    let raw = (await mc.lookup({ host, port })).status;
    return [await removeDescriptionFomatting(raw.description), raw.players.online, raw.players.max];
  } catch {}
}

async function removeDescriptionFomatting(input) {
  while (true) {
    if (input.includes("§")) {
      let slice1 = input.indexOf("§")
      input = input.slice(0, slice1).concat(input.slice(slice1 + 2));
    } else {
      break
    }
  }

  return input.split("\n")[0] || input
}