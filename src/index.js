// Required package imports
require('dotenv').config();
const axios = require('axios');

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();

const hooks = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
  MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
  // GUILD_MEMBER_UPDATE: 'guildMemberUpdate'
};

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.once('ready', () => {
  console.log('Bot connected to server successfully.');
  client.user.setActivity("Halo: Reach - PC Beta", { type: "PLAYING" });
});

client.on('messageReactionAdd', async (reaction, user) => {
  console.log(`${user.username} reacted with ${reaction.emoji.name}`);
});

client.on('messageReactionRemove', async (reaction, user) => {
  console.log(`${user.username} removed their ${reaction.emoji.name} reaction`);
});


client.on('raw', async packet => {
  // We don't want this to run on unrelated packets
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;

  // Grab the channel to check the message from
  const channel = client.channels.get(packet.d.channel_id);

  // There's no need to emit if the message is cached, because the event will fire anyway for that
  if (channel.messages.has(packet.d.message_id)) return;

  // Since we have confirmed the message is not cached, let's fetch it
  channel.fetchMessage(packet.d.message_id).then(message => {

    // Emojis can have identifiers of name:id format, so we have to account for that case as well
    const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

    // This gives us the reaction we need to emit the event properly, in top of the message object
    const reaction = message.reactions.get(emoji);

    // Adds the currently reacting user to the reaction's users collection.
    if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));

    // Check which type of event it is before emitting
    if (packet.t === 'MESSAGE_REACTION_ADD') {
      client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
    }

    if (packet.t === 'MESSAGE_REACTION_REMOVE') {
      client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
    }
  })
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(process.env.BOT_TOKEN);
