import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('textedit')
    .setDescription('leave arguments blank for help')
    .setDMPermission(true)
    .addStringOption(option =>
        option.setName('text')
            .setDescription('text you want to edit')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('edit')
            .setDescription('how to edit that text')
            .setRequired(false)
    ),
async execute(interaction) {
    let arg0 = interaction.options.getString('text');
    let arg1 = interaction.options.getString('edit');

    if (!arg0 || !arg1) {
      return interaction.reply("r(1,2) = replaces input1 with input2, \n");
    };

    const instr = geninstr(arg1);
    const keys = Object.keys(instr);
    
    // Reverse the keys to process from first to last
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (key[0] == "r") {
        arg0 = arg0.replace(instr[key][0], instr[key][1]);
      }
    };

    return interaction.reply(arg0);
  }
};

function geninstr(input1) {
  let output = {};
  let num = 0;

  while (input1.length != 0) {
    if (input1[0] == " ") {input1.replace(" ", "")};
    output[input1[0]+num] = [`${input1.slice(2, input1.indexOf(",")) }`, `${input1.slice(input1.indexOf(",")+1, input1.indexOf(")"))}`];
    input1 = input1.replace(input1.slice(0, input1.indexOf(")") + 1), "");
    num += 1;
  }
  return output
}
