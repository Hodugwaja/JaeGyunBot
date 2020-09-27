const { Client } = require('discord.js')
const ytdl = require('ytdl-core')
const YouTube = require("simple-youtube-api")
const {prefix, token } = require("./config.json");
const client = new Client({ disableEveryone: true })
const youtube = new YouTube('YouTube API Key Token')

const queue = new Map()

client.on('ready', () => console.log('여보세요~ 나야 거기 잘 지내니'))

client.on('message', async message => {
    if(message.author.bot) return
    if(!message.content.startsWith(prefix)) return

    const args = message.content.substring(prefix.length).split(" ")
    const searchString = args.slice(1).join(' ')
    const url = args[1] ? args[1].replace(/<(._)>/g, '$1') : ""
    const serverQueue = queue.get(message.guild.id)

    if(message.content.startsWith(`${prefix}노래틀어`)) {
        const voiceChannel = message.member.voice.channel
        if(!voiceChannel) return message.channel.send("노래를 들으려면 음성 채널에 참가해야 합니다.")
        const permissions = voiceChannel.permissionsFor(message.client.user)
        if(!permissions.has('CONNECT')) return message.channel.send("음성 채널에 들어갈수 없어요")
        if(!permissions.has('SPEAK')) return message.channel.send("음성 채널에 말할 수 없어요")

        try {
            var video = await youtube.getVideoByID(url)
        } catch {
            try {
                var videos = await youtube.searchVideos(searchString, 1)
                var video = await youtube.getVideoByID(videos[0].id)
            } catch {
                return message.channel.send('찾을수 읎어요')
            }
        }

        const song = {
            id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`
        }

        if(!serverQueue) {
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            }
            queue.set(message.guild.id, queueConstruct)
            
            queueConstruct.songs.push(song)

            try {
                var connection = await voiceChannel.join()
                queueConstruct.connection = connection
                play(message.guild, queueConstruct.songs[0])
            } catch (error) {
                console.log(`오류 났어요!: ${error}`)
                queue.delete(message.guild.id)
                return message.channel.send(`오류: ${error}`)
            }
        } else {
            serverQueue.songs.push(song)
            return message.channel.send(`**${song.title}**라는 노래가 추가되었습니다`)
        }
        return undefined

    } else if(message.content.startsWith(`${prefix}정지`)) {
        if(!message.member.voice.channel) return message.channel.send("노래를 멈추려면 음성 채널에 참가해야 합니다.")
        if(!serverQueue) return message.channel.send("노래가 없습니다")
        serverQueue.songs = []
        serverQueue.connection.dispatcher.end()
        message.channel.send("노래를 멈췄습니다")
        return undefined
    } else if(message.content.startsWith(`${prefix}스킵`)) {
        if(!message.member.voice.channel) return message.channel.send("노래를 멈추려면 음성 채널에 참가해야 합니다")
        if(!serverQueue) return message.channel.send("노래가 없습니다")
        serverQueue.connection.dispatcher.end()
        message.channel.send("다음 노래로 넘어갔습니다")
        return undefined
    } else if(message.content.startsWith(`${prefix}소리조정`)) {
        if(!message.member.voice.channel) return message.channel.send("노래를 멈추려면 음성 채널에 참가해야 합니다")
        if(!serverQueue) return message.channel.send("노래가 없어요")
        if(!args[1]) return message.channel.send(`소리는 현재 **${serverQueue.volume}** 입니다`)
        if(isNaN(args[1])) return message.channel.send('크기가 너무 크거나 작습니다')
        serverQueue.volume = args[1]
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5)
        message.channel.send(`**${args[1]}**로 소리 크기 줄입니다`)
        return undefined
    } else if(message.content.startsWith(`${prefix}현재 노래`)) {
        if(!serverQueue) return message.channel.send("노래가 없어요")
        message.channel.send(`**${serverQueue.songs[0].title}라는 노래를 재생중입니다**`)
        return undefined
    } else if(message.content.startsWith(`${prefix}목록`)) {
        if(serverQueue) return message.channel.send("노래가 없어요")
        message.channel.send(`
        __**song Queue**__
        ${serverQueue.songs.map(song => `**-** ${song.title}.join('\n)`)}

        **Now Playing:** ${serverQueue.songs[0].title}
        `, { split: true})
        return undefined
    } else if(message.content.startsWith(`${prefix}pause`)) {
        if(!message.member.voice.channel) return message.channel.send("노래를 일시정지 하려면 음성 채널에 참가해야합니다")
        if(!serverQueue) return message.channel.send("노래가 없어요")
        if(!serverQueue.playing) return message.channel.send("노래가 이미 일시정지 되었습니다")
        serverQueue.playing = false
        serverQueue.connection.dispatcher.pause()
        message.channel.send("노래 일시정지 합니다")
        return undefined
    } else if(message.content.startsWith(`${prefix}재생`)) {
        if(!message.member.voice.channel) return message.channel.send("노래를 다시 재상해라면 음성채널에 참가해야 합니다")
        if(!serverQueue) return message.channel.send("노래가 없어요")
        if(serverQueue.playing) return message.channel.send("노래가 재생중이에요")
        serverQueue.playing = true
        serverQueue.connection.dispatcher.resume()
        message.channel.send("노래를 다시 재생합니다")
        return undefined
    }
})

function play(guild, song) {
    const serverQueue = queue.get(guild.id)

    if(!song) {
        serverQueue.voiceChannel.leave()
        queue.delete(guild.id)
        return
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
    .on('finish', () => {
        serverQueue.songs.shift()
        play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
        console.log(error)
    })
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)

    serverQueue.textChannel.send(`노래를 시작합니다 **${song.title}**`)
}

    

    
client.login(token)
