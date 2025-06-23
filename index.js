
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = "!";

// Level sistemi için veri
const userLevels = new Map();
const levelChannels = new Map(); // Sunucu ID -> Kanal ID

const express = require("express");
const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Web sunucusu ${port} portunda çalışıyor.`);
});

client.on("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

// XP hesaplama ve level atlatma fonksiyonu
function addXP(userId, guildId) {
  const userKey = `${guildId}_${userId}`;
  
  if (!userLevels.has(userKey)) {
    userLevels.set(userKey, { xp: 0, level: 1 });
  }
  
  const userData = userLevels.get(userKey);
  userData.xp += Math.floor(Math.random() * 15) + 5; // 5-20 XP arası
  
  const requiredXP = userData.level * 100;
  
  if (userData.xp >= requiredXP) {
    userData.level++;
    userData.xp = 0;
    return true; // Level atladı
  }
  
  return false; // Level atlamadı
}

// Level atlama mesajı gönderme
function sendLevelUpMessage(member, newLevel) {
  const guildId = member.guild.id;
  const levelChannelId = levelChannels.get(guildId);
  
  if (!levelChannelId) return;
  
  const channel = member.guild.channels.cache.get(levelChannelId);
  if (!channel) return;
  
  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("🎉 Level Atladı!")
    .setDescription(`${member.user.tag} artık **Level ${newLevel}**!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
    
  channel.send({ embeds: [embed] });
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // Level sistemi - Her mesajda XP ver
  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const userKey = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(userKey).level;
    sendLevelUpMessage(message.member, newLevel);
  }

  // Oto cevaplar
  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();

    if (msg === "sa") return message.reply("as hg knk");
    if (msg === "selam") return message.reply("selam canım nasılsın?");
    if (msg === "günaydın") return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler") return message.reply("tatlı rüyalar 😴");
    if (msg === "bot")
      return message.reply("evet ben botum, yapımcım axel_ey 👑");
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  const sendHelpEmbed = () => {
    const yardımEmbed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Komut Listesi")
      .addFields(
        { name: "!ban @kullanıcı", value: "Kullanıcıyı banlar" },
        { name: "!kick @kullanıcı", value: "Kullanıcıyı sunucudan atar" },
        { name: "!temizle <sayı>", value: "Mesajları siler (1-100)" },
        { name: "!ping", value: "Botun pingini gösterir" },
        { name: "!avatar @kullanıcı", value: "Avatarını gösterir" },
        { name: "!sunucubilgi", value: "Sunucu bilgisini gösterir" },
        { name: "!roll <sayı>", value: "1 ile sayı arasında sayı atar" },
        { name: "!yaz <metin>", value: "Bot metni yazar" },
        { name: "!profil", value: "Profil bilgisi gösterir" },
        { name: "!mute @kullanıcı 10m", value: "Belirli süreli mute atar" },
        { name: "!unmute @kullanıcı", value: "Mute kaldırır" },
        { name: "!level", value: "Level bilginizi gösterir" },
        { name: "!levelkanal #kanal", value: "Level mesaj kanalını ayarlar" },
      )
      .setFooter({ text: "Bot Yardım Menüsü" });
    message.channel.send({ embeds: [yardımEmbed] });
  };

  if (command === "level") {
    const userKey = `${message.guild.id}_${message.author.id}`;
    const userData = userLevels.get(userKey) || { xp: 0, level: 1 };
    const requiredXP = userData.level * 100;
    
    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("📊 Level Bilgisi")
      .setDescription(`${message.author.tag} kullanıcısının seviyesi`)
      .addFields(
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "XP", value: `${userData.xp}/${requiredXP}`, inline: true },
        { name: "Eksik XP", value: `${requiredXP - userData.xp}`, inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "levelkanal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply("🚫 Kanal yönetme yetkin yok!");
    }
    
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply("Bir kanal etiketle! Örnek: `!levelkanal #genel`");
    }
    
    levelChannels.set(message.guild.id, channel.id);
    
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Level Kanalı Ayarlandı")
      .setDescription(`Level atlama mesajları artık ${channel} kanalına gönderilecek!`)
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(`🏓 Gecikme: ${ping}ms`),
      ],
    });
  }

  if (command === "yardım") return sendHelpEmbed();

  if (command === "avatar") {
    const member = message.mentions.members.first() || message.member;
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`${member.user.tag} kullanıcısının avatarı`)
          .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 })),
      ],
    });
  }

  if (command === "sunucubilgi") {
    const { guild } = message;
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Sunucu Bilgileri")
      .addFields(
        { name: "Sunucu Adı", value: guild.name, inline: true },
        { name: "Sunucu ID", value: guild.id, inline: true },
        { name: "Üye Sayısı", value: `${guild.memberCount}`, inline: true },
        {
          name: "Kuruluş Tarihi",
          value: guild.createdAt.toDateString(),
          inline: true,
        },
        { name: "Sahip", value: `<@${guild.ownerId}>`, inline: true },
      );
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply("🚫 Ban yetkin yok!");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Kimi banlayayım?");
    await member.ban();
    return message.channel.send(`${member.user.tag} sunucudan banlandı ✅`);
  }

  if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply("🚫 Kick yetkin yok!");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Kimi kickleyeyim?");
    await member.kick();
    return message.channel.send(`${member.user.tag} kicklendi ✅`);
  }

  if (command === "temizle") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    )
      return message.reply("Yetkin yok.");
    const miktar = parseInt(args[0]);
    if (!miktar || miktar < 1 || miktar > 100)
      return message.reply("1-100 arası sayı gir.");
    await message.channel.bulkDelete(miktar + 1, true);
    const msg = await message.channel.send(`✅ ${miktar} mesaj silindi.`);
    setTimeout(() => msg.delete(), 3000);
  }

  if (command === "roll") {
    const max = parseInt(args[0]) || 100;
    if (max < 1) return message.reply("Sayı en az 1 olmalı.");
    const sayı = Math.floor(Math.random() * max) + 1;
    return message.channel.send(`🎲 Attığın sayı: ${sayı}`);
  }

  if (command === "yaz") {
    const text = args.join(" ");
    if (!text) return message.reply("Ne yazayım?");
    return message.channel.send(text);
  }

  if (command === "profil") {
    const member = message.member;
    const userKey = `${message.guild.id}_${member.id}`;
    const userData = userLevels.get(userKey) || { xp: 0, level: 1 };
    
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Profil Bilgisi")
      .addFields(
        { name: "Kullanıcı", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: true },
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "XP", value: `${userData.xp}`, inline: true },
        {
          name: "Hesap Oluşturma",
          value: member.user.createdAt.toDateString(),
          inline: true,
        },
        {
          name: "Sunucuya Katılım",
          value: member.joinedAt.toDateString(),
          inline: true,
        },
      );
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "mute") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    )
      return message.reply("🚫 Mute yetkin yok!");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Kimi muteleyeceğim?");
    const ms = require("ms");
    const süreArg = args[1];
    const süreMs = ms(süreArg);
    if (!süreMs) return message.reply("Geçerli bir süre gir. Örnek: 10m, 1h");
    const muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");
    if (!muteRole) return message.reply("'Muted' rolü bulunamadı.");
    await member.roles.add(muteRole);
    message.channel.send(`${member.user.tag} ${süreArg} boyunca mute'lendi.`);
    setTimeout(async () => {
      await member.roles.remove(muteRole);
      message.channel.send(`${member.user.tag} artık mute değil.`);

    }, süreMs);
  }

  if (command === "unmute") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    )
      return message.reply("🚫 Unmute yetkin yok!");
    const member = message.mentions.members.first();
    if (!member) return message.reply("Kimi unmute yapacağım?");
    const muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");
    if (!muteRole) return message.reply("'Muted' rolü bulunamadı.");
    await member.roles.remove(muteRole);
    return message.channel.send(`${member.user.tag} artık mute değil.`);
  }
});

client.login(process.env.TOKEN);
