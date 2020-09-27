const Discord = require("discord.js");

module.exports = {
    name : '노래틀어',
    async execute(message, args){    
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
        return;
    }
}



