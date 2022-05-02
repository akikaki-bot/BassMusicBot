const { ShardingManager } = require('discord.js');
const { Client, Intents} = require("discord.js");
const option = {
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
  }
const client = new Client(option);

// Create your ShardingManger instance
const manager = new ShardingManager('./index.js', {
    // for ShardingManager options see:https://discord.js.org/#/docs/main/v12/class/ShardingManager
    // 
    token: process.env.token
});

const shards = 20;

// Emitted when a shard is created
manager.on('shardCreate', async (shard) => {
console.log(`Shard ${shard.id} launched`);
});

// Spawn your shards
manager.spawn(shards);