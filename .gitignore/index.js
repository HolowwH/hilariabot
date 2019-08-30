const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('database.json');
const db = low(adapter);
const ytdl = require("ytdl-core");

var queue = new Map();

global.servers = {};

db.defaults({ histoires: [], xp: []}).write()

client.login("NjE1NTg5NDQzNTk5OTkwNzg4.XWQOhw.Sg1TRCwqS1y7aACq8zKB8d_hFLI");

client.commands = new Discord.Collection();

client.on("guildMemberAdd", user =>{

    user.guild.channels.get("613336765733797898").send("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ \n :cc: **Salut jeune joueur**, \n Bienvenue à toi sur le serveur Hilaria, faites un tonnerre d'applaudissement pour " + user + "minia maker  :tada: :hugging: \n ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

});

client.on("guildMemberRemove", user =>{

    user.guild.channels.get("613336830540251137").send("**" + user + "**" + " à quitté le serveur nous espérons te revoir bientôt !");

});

client.on("message", async message =>{

    if(message.author.bot) return;
    if(message.channel.type === "dm") return;

    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    const serverQueue = queue.get(message.guild.id);

    if(cmd === `!report`){

        let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
        if(!rUser) return message.channel.send("Impossible de trouver un joueur, veuillez réessayer.");
        let reason = args.join(" ").slice(22);
        if(!reason) return message.channel.send("Vous devez préciser une raison pour rapporter un joueur.");

        let reportEmbed = new Discord.RichEmbed()
        .setDescription("Hilaria | Rapport")
        .setColor("#15f153")
        .addField("Informations sur le joueur report:", `Joueur report: ${rUser} | Avec l'ID: ${rUser.id} \nReport par: ${message.author} | Avec l'ID: ${message.author.id}`)
        .addField("Date: ", message.createdAt)
        .addField("Raison: ", reason);

        let reportschannel = message.guild.channels.find(`name`, "〚❌〛reports")
        if (!reportschannel) return message.channel.send("Impossible de trouver le channel Reports.");

        message.delete().catch(O_o=>{});
        reportschannel.send(reportEmbed);
        return;

    }

    if(cmd === `!ticket`){

        var channel;
        var Member;

        channel = await message.guild.createChannel(`${message.author.username}`, "text").catch(ex => console.error);
        var newMessage = await channel.send(`Executer la commande !fin pour fermer le ticket.`);
        var Roles = await message.member.roles.array();
        var AuthorRole = await message.guild.createRole({

            name: message.author.username

        }).catch(ex => console.error(ex));

        Roles.forEach(async(role) => {

            await channel.overwritePermissions(role, {

                READ_MESSAGE: false,
                VIEW_CHANNEL: false

            });

        });

        channel.overwritePermissions(AuthorRole, {

            READ_MESSAGE: true,
            VIEW_CHANNEL: true

        });

        await message.member.addRole(AuthorRole);
        message.channel.send("Le channel du ticket a été crée !");
        setTimeout(function(){

            channel.delete();
            message.member.removeRole(AuthorRole);
            message.guild.roles.find("name", AuthorRole.name).delete();

        }, 7200000);

    }

    if(cmd === `!fin`){

        message.channel.send(message.channel.name == message.author.username);

        message.member.send("Votre ticket est fermé !");
        message.channel.delete();

    }

    if(cmd === '!play') {
        
        let url = args.join(" ").slice(22);

        if(!url) return message.channel.send("Veuillez préciser un URL valide.");

        play(message, serverQueue);

    }

})

async function play(message, serverQueue) {
    const args = message.content.split(" ");
 
    const voiceChannel = message.client.channels.get("613806718836539393");
    if(!voiceChannel) return message.channel.send("Vous devez être dans un channel vocal spécifique à la musique.");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if(!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("Je dois avoir la permission de rejoindre et de parler dans ce channel.")
    }
 
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };
 
    if(!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };
        queue.set(message.guild.id, queueConstruct);
 
        queueConstruct.songs.push(song);
 
        try{
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id)
            return message.channel.send("Il y a une erreur, la musique s'est arrêté. " + err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} vient d'être ajouté à la file d'attente.`);
    }
}
 
function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
 
    if(!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
 
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', () => {
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.log(error);
        })
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

fs.readdir("./Commandes/", (error, f) => {

    if(error) console.log(error);

    let commandes = f.filter(f => f.split(".").pop() === "js");

    if(commandes.length <= 0) return console.log("Aucune commande trouvée.");

    commandes.forEach((f) => {

        let commande = require(`./Commandes/${f}`);
        console.log(`${f} commande chargé.`);

    client.commands.set(commande.help.name, commande);

    });

});

fs.readdir("./Events/", (error, f) => {

    if(error) console.log(error);

    console.log(`${f.length} events en chargement.`);

    f.forEach((f) => {

        const events = require(`./Events/${f}`);

        const event = f.split(".")[0];

    client.on(event, events.bind(null, client));

    });

});

client.on('message', message => {
   
    var msgauthor = message.author.id
 
    if(message.author.bot)return;
 
    if(!db.get("xp").find({user : msgauthor}).value()){
        db.get("xp").push({user : msgauthor, xp: 1}).write();
    }else{
        var userxpdb = db.get("xp").filter({user : msgauthor}).find("xp").value();
        console.log(userxpdb)
        var userxp = Object.values(userxpdb)
        console.log(userxp)
        console.log(`Nombre d'xp: ${userxp[1]}`)
 
        db.get("xp").find({user: msgauthor}).assign({user: msgauthor, xp: userxp[1] += 1}).write();
 
        if(message.content === "!xp"){
            var xp = db.get("xp").filter({user: msgauthor}).find('xp').value()
            var xpfinal = Object.values(xp);
            var xp_embed = new Discord.RichEmbed()
                .setTitle(`Quantité d'XP de **${message.author.username}**`)
                .setColor('#15f153')
                .addField("━━━━━━━━━━━━━━━━━━━━", `**XP:** ${xpfinal[1]}`)
                .setFooter("Hilaria | XP")
            message.channel.send({embed : xp_embed})
        }
    }
})
