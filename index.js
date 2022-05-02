const http = require('http');
http.createServer(function (req, res) {
  res.write('Shard'+'s'+'started.')
  res.end();
}).listen(8080);

const {
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} = require("discord.js");//なんでdiscord.jsを2回もRequestしてるの？MessageButtonとかを1-4のとこにかけばDiscord.MessageButtonじゃなくそのままMessageButtonで書ける

const {
  Player,
  RepeatMode
} = require("discord-music-player");

const lyricsFinder = require('lyrics-finder');

const option = {
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
}

const client = new Client(option);

const settings = {
  prefix: ']',
  token: process.env.token //脆弱性大(環境変数に入れろ)
};

const player = new Player(client, {
  leaveOnEmpty: false,
});

client.player = player;
client.on("ready", () => {
  console.log("Rythm.");
  client.user.setActivity({
    name: `${settings.prefix}help`
  })
});

const { servers,status,help } = require('./lib/files.js')


client.on('messageCreate', async(message) => {
  if (message.author.bot || message.channel.type === "dm" || message.content.indexOf(settings.prefix) !== 0) return;
  
  const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  let guildQueue = client.player.getQueue(message.guild.id);
  
  if (command === "status") { //コマンド毎にif使うなswitch使うとかファイルで分けるとか工夫しろ読みにくい
    status(message,client,MessageEmbed)
  }
  
  if (command === "servers") {
    servers(message,client,MessageEmbed)
  }

  if(command === "help") {
    help(message,MessageButton,MessageEmbed,MessageActionRow)
  }
  
  try {
    
    if (command === 'play' || command === "pl" || command === "p") {
      
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      
      let queue = client.player.createQueue(message.guild.id);
      await queue.join(message.member.voice.channel);
      
      message.channel.send('🔍Searching **' + args.join(" ") + '**')
      let song = await queue.play(args.join(' ')).then(() => {
        const embed = new MessageEmbed().setTitle('Add to Queue').setColor('BLUE')
        const row = new MessageActionRow().addComponents(new MessageButton().setStyle('SECONDARY').setCustomId('stop').setEmoji('⏸'), new MessageButton().setStyle('SECONDARY').setCustomId('resume').setEmoji('▶'), new MessageButton().setStyle('SECONDARY').setCustomId('skip').setEmoji('⏩'), new MessageButton().setStyle('SECONDARY').setCustomId('Loop').setEmoji('🔂'), new MessageButton().setStyle('SECONDARY').setEmoji('🔀').setCustomId('Loopend'), )
        message.channel.send({
          embeds: [embed],
          components: [row]
        })
      })
    }
    

    //timeが経過したら音楽止めるコマンド
    if(command === "timer"){
      if(args === null || isNaN(args)) return message.reply(':x: 内容が不十分です。')
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      message.channel.send(args+'時間後に音楽を止める設定にしました。')
      let h = ""
      h = args * 1000 * 60 * 60
      setTimeout(() => {
      message.channel.send('Bye!')
      guildQueue.stop();
      }, h)
      
    }

    if (command === "queue") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      
     let songs = ""
      for(var i of guildQueue.songs){
        songs += `[${i.name}](${i.url})\n\n`
      }
      const embed = new MessageEmbed().setTitle(message.guild.name + ' Queue').setDescription(`**Now Playing** : ${guildQueue.nowPlaying} \n\n >>> Queues : \n NowPlaying >${songs}`).setColor('YELLOW')
      message.channel.send({
        embeds: [embed]
      })
    }
    
    if (command === 'pll') {
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      
      let queue = client.player.createQueue(message.guild.id);
      await queue.join(message.member.voice.channel);
      let song = await queue.playlist(args.join(' ')).catch(_ => {
        if (!guildQueue) queue.stop();
      });
    }
    
    if (command === 'skip' || command === "s") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.skip();
      message.channel.send('✅**Successfully Skip**')
    }
    if (command === 'dc' || command === "d") {
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.stop();
      message.channel.send('✅**Successfully disconnet**')
    }
    if (command === 'remloop' || command === "rl") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
      message.channel.send('✅**Successfully Remove all loop**')
    }
    if (command === 'loop' || command === "l") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
      message.channel.send('✅**Successfully toggle loop!**')
    }
    if (command === 'toggleQueueLoop' || command === "ql") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
      message.channel.send('✅**Successfully toggle queueloop!**')
    }
    if (command === 'setVolume' || command === "v") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setVolume(parseInt(args[0]));
      message.channel.send('✅**Successfully setVolume' + args[0])
    }
    if (command === 'seek' || command === "sk") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.seek(parseInt(args[0]) * 1000);
      message.channel.send('✅**Successfully seek**')
    }
    if (command === 'clearQueue' || command === "cq") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.clearQueue();
      message.channel.send('✅**Successfully clear queue!**')
    }
    if (command === 'shuffle' || command === "sf") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.shuffle();
      message.channel.send('✅**Successfully Shuffle**')
    }
    if (command === 'getVolume' || command === "gv") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      console.log(guildQueue.volume)
      message.channel.send('**Volume ' + guildQueue.volume + '**')
    }
    if (command === 'nowPlaying' || command === "np") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      const ProgressBar = guildQueue.createProgressBar(); // [======>              ][00:35/2:20]
      const embed = new Discord.MessageEmbed()
      embed.setTitle('再生中🎵 - NowPlaying🎵').setDescription(`Playing : **${guildQueue.nowPlaying}**\n(Requestedby ${guildQueue.requestedBy})\n\nTime : ${ProgressBar.prettier}`).setImage(guildQueue.thumbnail).setColor('RED')
      message.channel.send({
        embeds: [embed]
      })
    }
    if (command === 'pause' || command === "pa") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setPaused(true);
      message.channel.send('✅**Successfully Pause**')
    }
    if (command === 'resume' || command === "re") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.setPaused(false);
      message.channel.send('✅**Successfully Resume**')
    }
    if (command === 'remove' || command === "rev") {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      guildQueue.remove(parseInt(args[0]));
      message.channel.send('✅Successfully Remove ' + args[0])
    }
    if (command === 'createProgressBar') {
      if(!guildQueue) return message.reply(':x: Queueが空です！')
      const voice_channel = message.member.voice.channel;
      if (!voice_channel) return message.channel.send(':x: **You need to be in a channel to execute this command!**');
      const ProgressBar = guildQueue.createProgressBar();
      // [======>              ][00:35/2:20]
      message.channel.send(ProgressBar.prettier);
    }
    if(command === "err"){
      message.channel.sead('errrrr!!')
    }
    if(command === "restart"){
      client.user.setActivity({
    name: `再起動処理中....`
  })
    }
  } catch (err) {
    message.channel.send(':x: **Play Error** '+'```js\n' + err + '\n```')
    console.warn("ERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRORRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR           Ohhhhhhhhhhhhhhhhhhhhhhhhhhhhhssssssssssssssssssssssssssssshiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiitttttttttttttttttttttt")
    return
  }
  //ここからclient.player関係です。普段はいじらないでください。
  client.player
    // Emitted when channel was empty.
    .on('channelEmpty', (queue) => console.log(`Everyone left the Voice Channel, queue ended.`))
    // Emitted when a song was added to the queue.
    .on('songAdd', (queue, song) => console.log(`Song ${song} was added to the queue.`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd', (queue, playlist) => console.log(`Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`))
    // Emitted when there was no more music to play.
    .on('queueEnd', (queue) => console.log(`The queue has ended.`))
    // Emitted when a song changed.
    .on('songChanged', (queue, newSong, oldSong) => console.log(`${newSong} is now playing.`))
    // Emitted when a first song in the queue started playing.
    .on('songFirst', (queue, song) => console.log(`Started playing ${song}.`))
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) => console.log(`I was kicked from the Voice Channel, queue ended.`))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) => console.log(`I got undefeanded.`))
    // Emitted when there was an error in runtime
    .on('error', (err) => console.log('**ERR!** ' + err))
})
client.on('interactionCreate', async(interaction) => {
  let guildQueue = client.player.getQueue(interaction.guild.id);
  if (!interaction.isButton()) return
  await interaction.deferReply({
    ephemeral: true
  });
  if (interaction.customId === "player") {
    const p = new Discord.MessageEmbed()
    p.setTitle('Player Help🎵').addField('play (abb : p)', 'Play the song.').addField('skip (abb : s)', 'Skip the song.').addField('pll ', 'Play the playlist.').setColor('RED')
    await interaction.editReply({
      embeds: [p]
    })
  }
  if (interaction.customId === "queue") {
    const q = new Discord.MessageEmbed()
    q.setTitle('Queue Help:question:').addField('queue', 'queue').addField('shuffle (abb : sf)', 'shuffle the queue.').addField('clearQueue (abb : cq)', 'clear the queue.').setColor('GREEN')
    await interaction.editReply({
      embeds: [q]
    })
  }
  if (interaction.customId === "loop") {
    const l = new Discord.MessageEmbed()
    l.setTitle('Loop Help :loop:').addField('toggleloop(abb : l)', 'loop the song.').addField('remloop(abb : rl)', 'remove the loop.').addField('toggleQueueLoop(abb : ql)', 'toggle the queue loop.').setColor('BLUE')
    await interaction.editReply({
      embeds: [l]
    })
  }
  if (interaction.customId === "bot") {
    const embed = new Discord.MessageEmbed()
    embed.setTitle('Bot help :robot:').addField('status', 'Check the bassbot Status o_o')
    await interaction.editReply({
      embeds: [embed]
    })
  }
  try {
 if (interaction.customId === "stop") {
   if(!guildQueue) return interaction.editReply(':x: Queueが空です！')
   const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) return interaction.editReply(':x: ボイスチャンネルに入ってください。')
    guildQueue.setPaused(true);
    await interaction.editReply('Paused.')
  }
  if (interaction.customId === "resume") {
    if(!guildQueue) return interaction.editReply(':x: Queueが空です！')
    const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) return interaction.editReply(':x: ボイスチャンネルに入ってください。')
    guildQueue.setPaused(false);
    await interaction.editReply('Resume.')
  }
  if (interaction.customId === "skip") {
    if(!guildQueue) return interaction.editReply(':x: Queueが空です！')
    const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) return interaction.editReply(':x: ボイスチャンネルに入ってください。')
    guildQueue.skip();
    await interaction.editReply('Skip!')
  }
  if (interaction.customId === "Loop") {
    if(!guildQueue) return interaction.editReply(':x: Queueが空です！')
    const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) return interaction.editReply(':x: ボイスチャンネルに入ってください。')
    guildQueue.setRepeatMode(RepeatMode.SONG)
    await interaction.editReply('Loop!')
  }
  if (interaction.customId === "Loopend") {
    if(!guildQueue) return interaction.editReply(':x: Queueが空です！')
    const voice_channel = interaction.member.voice.channel;
    if (!voice_channel) return interaction.editReply(':x: ボイスチャンネルに入ってください。')
    guildQueue.setRepeatMode(RepeatMode.DISABLED);
    await interaction.editReply('Disabled Loop!')
  }
  }catch(err){
    interaction.editReply(':x: Queueが空です！')
    return;
  }
})
client.login(settings.token);