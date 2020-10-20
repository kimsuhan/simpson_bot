const Discord = require('discord.js');
const client = new Discord.Client();
const setting = require("./setting.json");
const ytdl = require('ytdl-core');
const queue = new Map();

// Client Ready
client.on('ready', () => {
    console.log("================================================================================================================================================================================================")
    console.log(`Logged in as ${client.user.tag}!`);
});

// Client Reconnecting
client.on('reconnecting', () => {
    console.log(`Reconnecting ${client.user.tag}!`);
});

// Client Disconnect
client.on('disconnect', () => {
    console.log(`Disconnect ${client.user.tag}!`);
});

// Client On Message
client.on('message', async msg => {

    // Bot Message Return
    if (msg.author.bot) {
        if(setting.dev_mode === 'Y') {
            console.log('this message author bot [' + msg.content + ']');
        }
        return;
    }

    // None Prefix Return
    if (!msg.content.startsWith(setting.prefix)) {
        if(setting.dev_mode === 'Y') {
            console.log('this message not prefix [' + msg.content + ']');
        }

        return;
    }

    // Song Queue
    const serverQueue = queue.get(msg.guild.id);

    // Ping
    if (msg.content === `${setting.prefix}핑`) {
        msg.reply('퐁!');
    }
    // Song Play
    else if (msg.content.startsWith(`${setting.prefix}play`) || msg.content.startsWith(`${setting.prefix}재생`)) {
        musicExecute(msg, serverQueue);
        return;
    }
    // Song Skip
    else if (msg.content.startsWith(`${setting.prefix}skip`) || msg.content.startsWith(`${setting.prefix}스킵`)) {
        skip(msg, serverQueue);
        return;
    }
    // Song Stop
    else if (msg.content.startsWith(`${setting.prefix}stop`) || msg.content.startsWith(`${setting.prefix}중지`)) {
        stop(msg, serverQueue);
        return;
    }
    else {
        msg.channel.send(`${msg.author} 새기야 명령어 다운걸 쳐라 \`!도와줘\` 라고 해봐!`);
    }
});

// Music Execute
async function musicExecute(msg, serverQueue) {
    const args = msg.content.split(" ");
  
    const voiceChannel = msg.member.voice.channel;
    if (!voiceChannel) {
        return msg.channel.send("야 임마 음성 채팅에 들어가란 말이야!");
    }

    const permissions = voiceChannel.permissionsFor(msg.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return msg.channel.send("나한테 권한이 없는데 ? 접속 권한과 말하기 권한을 달란 말이야");
    }

    const songInfo = await ytdl.getInfo(args[1]);
    await console.log(songInfo.videoDetails);
    
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: msg.channel
            , voiceChannel: voiceChannel
            , connection: null
            , songs: []
            , volume: 5
            , playing: true
        };

        // Setting the queue using our contract
        queue.set(msg.guild.id, queueContruct);
        
        // Pushing the song to our songs array
        queueContruct.songs.push(song);
           
        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;

            // Calling the play function to start a song
            play(msg.guild, queueContruct.songs[0]);
        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
           
    }
    else {
        serverQueue.songs.push(song);
        if(setting.dev_mode === 'Y') {
            console.log(serverQueue.songs);
        }

        return msg.channel.send(`${song.title} 듣고 싶냐? 다음곡에 넣어줄게!`);
    }
}

// Song Play
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`야! **${song.title}** 이거 들려줄게!`);
}

// Song Skip
function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("야 이새꺄 채널에 들어가서 명령 하란말이야!");
    }

    if (!serverQueue) {
        return message.channel.send("스킵할 노래가 없다 ㅠㅠ");
    }

    serverQueue.connection.dispatcher.end();
}

// Song Stop
function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("야 이새꺄 채널에 들어가서 명령 하란말이야!");

    }

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}


client.login(setting.token);