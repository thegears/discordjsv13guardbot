//TANIMLAR
const config = require("./config.json");
const express = require("express");
const app = new express();
const bodyParser = require("body-parser");
const { Client , MessageEmbed } = require('discord.js');
const client = new Client({ intents: 32767 });
client.login(config.token);
client.on("ready",async () => { console.log("Hazır"); });
const cors=require('cors');
const { Database } = require("ark.db");
const db = new Database();
//TANIMLAR


//EXPRESS SERVER AYARLAR
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({origin:true,credentials: true}));
app.use(express.static(__dirname + "/out"))
//EXPRESS SERVER AYARLAR

// BOT
let kufurliste = ["aq","amk","sik","sg","oç"];
let reklamliste = ["https","http","com","www"];

client.on("messageCreate",message => {
	if(kufurliste.some(k => message.content.toLowerCase().split(" ").includes(k)) && db.get("kufurEngel")) message.delete().catch(err => {  });
	else if(reklamliste.some(k => message.content.toLowerCase().split(" ").includes(k)) && db.get("reklamEngel")) message.delete().catch(err => {  });
});

client.on("channelDelete",async channel => {
	let fetchedLogs = await channel.guild.fetchAuditLogs({
		limit: 1,
		type: 'CHANNEL_DELETE',
	});

	let deletionLog = fetchedLogs.entries.first();

	let m = `${String(new Date()).split(" ")[4]} ${channel.name} isimli kanal silindi.`;

	if(!deletionLog) m += `Kimin sildiği bilinmiyor`;
	else {
		let { executor, target } = deletionLog;
		m += `Silen kişi : ${executor.tag}`;
	};

	db.push("logs",m);

	if(db.get("kanalKoruma")){
		channel.clone();
	};
});

client.on("roleDelete",async role => {
	let fetchedLogs = await role.guild.fetchAuditLogs({
		limit: 1,
		type: 'ROLE_DELETE',
	});

	let deletionLog = fetchedLogs.entries.first();

	let m = `${String(new Date()).split(" ")[4]} ${role.name} isimli rol silindi.`;

	if(!deletionLog) m += `Kimin sildiği bilinmiyor`;
	else {
		let { executor, target } = deletionLog;
		m += `Silen kişi : ${executor.tag}`;
	};

	db.push("logs",m);

	if(db.get("rolKoruma")){
		role.guild.roles.create({ name : role.name , reason : "Rol silindi." ,  permissions : role.permissions , color : role.color });
	};
});
// BOT


//SERVER 
app.get("/isBotLogined",(req,res) => {
	res.status(200).send({
		status : (client.user) ? true : false
	});
});

app.get("/getInfo",(req,res) => {
	res.status(200).send({
		info : {
			kufurEngel : db.get("kufurEngel") || false,
			reklamEngel : db.get("reklamEngel") || false,
			kanalKoruma : db.get("kanalKoruma") || false,
			rolKoruma : db.get("rolKoruma") || false,
			logs : db.get("logs") || [],
			channels : client.guilds.cache.get(config.guild).channels.cache.map(r => r).filter(c => c.type == "GUILD_TEXT").filter(c => c.guild.me.permissionsIn(c.id).toArray().includes("MANAGE_CHANNELS")),
			members : client.guilds.cache.get(config.guild).members.cache,
			guild : config.guild,
			token : config.token
		}
	});
});

app.get("/changeKufurEngel",(req,res) => {
	let k ;

	if(db.get("kufurEngel")) k = !db.get("kufurEngel");
	else k = true;

	db.set("kufurEngel",k);

	res.status(200).send();
});

app.get("/changeReklamEngel",(req,res) => {
	let k ;

	if(db.get("reklamEngel")) k = !db.get("reklamEngel");
	else k = true;

	db.set("reklamEngel",k);

	res.status(200).send();
});

app.get("/changeKanalKoruma",(req,res) => {
	let k ;

	if(db.get("kanalKoruma")) k = !db.get("kanalKoruma");
	else k = true;

	db.set("kanalKoruma",k);

	res.status(200).send();
});

app.get("/changeRolKoruma",(req,res) => {
	let k ;

	if(db.get("rolKoruma")) k = !db.get("rolKoruma");
	else k = true;

	db.set("rolKoruma",k);

	res.status(200).send();
});

app.post("/setSlowMode",async (req,res) => {
	let { channel , time } = req.body;

	try {
		await client.channels.cache.get(channel).setRateLimitPerUser(parseInt(time), "Yavaş Mod");
		db.push("logs",`${String(new Date()).split(" ")[4]} ${channel} ID'li kanala ${time} saniye yavaş mod uygulandı.`);
		res.status(200).send({ status : "Başarılı" });
	}catch(err){
		res.status(200).send({ status : "Bir hata oluştu. Konsolda görebilirsiniz" , err});
	};
});

app.post("/setTimeOut",async(req,res) => {
	let { user , time } = req.body;

	try {
		await client.guilds.cache.get(config.guild).members.cache.get(user).timeout(parseInt(time),'Zaman Aşımı');
		res.status(200).send({ status : "Başarılı" });
	}catch(err){
		res.status(200).send({ status : "Bir hata oluştu. Konsolda görebilirsiniz" , err});
	}
});
//SERVER 


app.listen(5555);