
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

// Hunter Bucks coin sistemi
const userCoins = new Map();
const dailyCooldowns = new Map();
const workCooldowns = new Map();

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

// Coin sistemi fonksiyonları
function getCoins(userId, guildId) {
  const userKey = `${guildId}_${userId}`;
  return userCoins.get(userKey) || 0;
}

function addCoins(userId, guildId, amount) {
  const userKey = `${guildId}_${userId}`;
  const currentCoins = getCoins(userId, guildId);
  userCoins.set(userKey, currentCoins + amount);
}

function removeCoins(userId, guildId, amount) {
  const userKey = `${guildId}_${userId}`;
  const currentCoins = getCoins(userId, guildId);
  const newAmount = Math.max(0, currentCoins - amount);
  userCoins.set(userKey, newAmount);
  return currentCoins >= amount;
}

function formatCoins(amount) {
  return `${amount.toLocaleString()} HB`;
}

function getCooldownTime(cooldownMap, userId, guildId) {
  const userKey = `${guildId}_${userId}`;
  const lastUsed = cooldownMap.get(userKey);
  if (!lastUsed) return 0;
  return lastUsed;
}

function setCooldown(cooldownMap, userId, guildId, duration) {
  const userKey = `${guildId}_${userId}`;
  cooldownMap.set(userKey, Date.now() + duration);
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}s ${minutes % 60}d`;
  if (minutes > 0) return `${minutes}d ${seconds % 60}s`;
  return `${seconds}s`;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // Level sistemi - Her mesajda XP ver
  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const userKey = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(userKey).level;
    const coinReward = newLevel * 50; // Her level için 50 HB
    addCoins(message.author.id, message.guild.id, coinReward);
    sendLevelUpMessage(message.member, newLevel);
  }

  // Rastgele coin kazanma (her 20 mesajda bir şans)
  if (Math.random() < 0.05) { // %5 şans
    const randomCoins = Math.floor(Math.random() * 10) + 1; // 1-10 HB
    addCoins(message.author.id, message.guild.id, randomCoins);
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
        { name: "!bakiye", value: "Hunter Bucks bakiyenizi gösterir" },
        { name: "!daily", value: "Günlük ödülünüzü alın" },
        { name: "!work", value: "Çalışarak coin kazanın" },
        { name: "!slot <miktar>", value: "Slot oyunu oynayın" },
        { name: "!coinflip <miktar> <yazı/tura>", value: "Yazı tura oynayın" },
        { name: "!dice <miktar> <1-6>", value: "Zar oyunu oynayın" },
        { name: "!hunt", value: "Avlanarak coin kazanın" },
        { name: "!fish", value: "Balık tutarak coin kazanın" },
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

  // HUNTER BUCKS SİSTEMİ
  if (command === "bakiye" || command === "balance" || command === "bal") {
    const coins = getCoins(message.author.id, message.guild.id);
    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("💰 Hunter Bucks Bakiye")
      .setDescription(`${message.author.tag} adlı kullanıcının bakiyesi: **${formatCoins(coins)}**`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "daily") {
    const cooldownTime = getCooldownTime(dailyCooldowns, message.author.id, message.guild.id);
    
    if (cooldownTime > Date.now()) {
      const timeLeft = formatTime(cooldownTime - Date.now());
      return message.reply(`⏰ Günlük ödülünü zaten aldın! **${timeLeft}** sonra tekrar dene.`);
    }
    
    const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100-600 HB
    addCoins(message.author.id, message.guild.id, dailyAmount);
    setCooldown(dailyCooldowns, message.author.id, message.guild.id, 24 * 60 * 60 * 1000); // 24 saat
    
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎁 Günlük Ödül!")
      .setDescription(`Günlük ödülün: **${formatCoins(dailyAmount)}**`)
      .setFooter({ text: "24 saat sonra tekrar gelebilirsin!" })
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "work") {
    const cooldownTime = getCooldownTime(workCooldowns, message.author.id, message.guild.id);
    
    if (cooldownTime > Date.now()) {
      const timeLeft = formatTime(cooldownTime - Date.now());
      return message.reply(`⏰ Henüz çalışamazsın! **${timeLeft}** sonra tekrar dene.`);
    }
    
    const works = [
      "🍕 Pizza dağıttın", "💻 Kod yazdın", "🚗 Uber sürücüsü oldun", 
      "📚 Ders verdin", "🎵 Müzik yaptın", "🎨 Tasarım yaptın",
      "📱 Uygulama geliştirdin", "🎮 Oyun test ettin"
    ];
    
    const selectedWork = works[Math.floor(Math.random() * works.length)];
    const earnedAmount = Math.floor(Math.random() * 150) + 50; // 50-200 HB
    
    addCoins(message.author.id, message.guild.id, earnedAmount);
    setCooldown(workCooldowns, message.author.id, message.guild.id, 60 * 60 * 1000); // 1 saat
    
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("💼 Çalışma Tamamlandı!")
      .setDescription(`${selectedWork} ve **${formatCoins(earnedAmount)}** kazandın!`)
      .setFooter({ text: "1 saat sonra tekrar çalışabilirsin!" })
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "slot") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) {
      return message.reply("Geçerli bir miktar gir! Örnek: `!slot 100`");
    }
    
    const userCoins = getCoins(message.author.id, message.guild.id);
    if (userCoins < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(userCoins)}**`);
    }
    
    const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      if (result[0] === "💎") multiplier = 10;
      else if (result[0] === "⭐") multiplier = 5;
      else multiplier = 3;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      multiplier = 1.5;
    }
    
    const winAmount = Math.floor(amount * multiplier);
    
    if (multiplier > 0) {
      addCoins(message.author.id, message.guild.id, winAmount - amount);
      var resultText = `🎉 Kazandın! **${formatCoins(winAmount)}** kazandın!`;
      var color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      var resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      var color = "Red";
    }
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🎰 Slot Machine")
      .setDescription(`${result.join(" | ")}\n\n${resultText}`)
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "coinflip" || command === "cf") {
    const amount = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();
    
    if (!amount || amount < 1) {
      return message.reply("Geçerli bir miktar gir! Örnek: `!coinflip 100 yazı`");
    }
    
    if (!choice || (choice !== "yazı" && choice !== "tura")) {
      return message.reply("Yazı veya tura seç! Örnek: `!coinflip 100 yazı`");
    }
    
    const userCoins = getCoins(message.author.id, message.guild.id);
    if (userCoins < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(userCoins)}**`);
    }
    
    const result = Math.random() < 0.5 ? "yazı" : "tura";
    const won = choice === result;
    
    if (won) {
      addCoins(message.author.id, message.guild.id, amount);
      var resultText = `🎉 Kazandın! **${formatCoins(amount * 2)}** kazandın!`;
      var color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      var resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      var color = "Red";
    }
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🪙 Coinflip")
      .setDescription(`Sonuç: **${result}**\nSeçimin: **${choice}**\n\n${resultText}`)
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "dice") {
    const amount = parseInt(args[0]);
    const guess = parseInt(args[1]);
    
    if (!amount || amount < 1) {
      return message.reply("Geçerli bir miktar gir! Örnek: `!dice 100 3`");
    }
    
    if (!guess || guess < 1 || guess > 6) {
      return message.reply("1-6 arası bir sayı tahmin et! Örnek: `!dice 100 3`");
    }
    
    const userCoins = getCoins(message.author.id, message.guild.id);
    if (userCoins < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(userCoins)}**`);
    }
    
    const result = Math.floor(Math.random() * 6) + 1;
    const won = guess === result;
    
    if (won) {
      const winAmount = amount * 5;
      addCoins(message.author.id, message.guild.id, winAmount);
      var resultText = `🎉 Kazandın! **${formatCoins(winAmount)}** kazandın!`;
      var color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      var resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      var color = "Red";
    }
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🎲 Zar Oyunu")
      .setDescription(`Zar: **${result}**\nTahminin: **${guess}**\n\n${resultText}`)
      .setTimestamp();
      
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "hunt") {
    const animals = [
      { name: "🐰 Tavşan", value: 50 },
      { name: "🦌 Geyik", value: 100 },
      { name: "🐗 Domuz", value: 150 },
      { name: "🐺 Kurt", value: 200 },
      { name: "🐻 Ayı", value: 300 },
      { name: "🦁 Aslan", value: 500 }
    ];
    
    const success = Math.random() < 0.7; // %70 başarı şansı
    
    if (success) {
      const caughtAnimal = animals[Math.floor(Math.random() * animals.length)];
      addCoins(message.author.id, message.guild.id, caughtAnimal.value);
      
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🏹 Avlanma Başarılı!")
        .setDescription(`${caughtAnimal.name} yakaladın ve **${formatCoins(caughtAnimal.value)}** kazandın!`)
        .setTimestamp();
        
      return message.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🏹 Avlanma Başarısız!")
        .setDescription("Hiçbir şey yakalayamadın! Daha sonra tekrar dene.")
        .setTimestamp();
        
      return message.channel.send({ embeds: [embed] });
    }
  }

  if (command === "fish") {
    const fishes = [
      { name: "🐟 Küçük Balık", value: 30 },
      { name: "🐠 Renkli Balık", value: 60 },
      { name: "🦈 Köpekbalığı", value: 200 },
      { name: "🐋 Balina", value: 400 },
      { name: "🦑 Ahtapot", value: 100 },
      { name: "🦀 Yengeç", value: 80 }
    ];
    
    const success = Math.random() < 0.8; // %80 başarı şansı
    
    if (success) {
      const caughtFish = fishes[Math.floor(Math.random() * fishes.length)];
      addCoins(message.author.id, message.guild.id, caughtFish.value);
      
      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("🎣 Balık Tutma Başarılı!")
        .setDescription(`${caughtFish.name} tuttun ve **${formatCoins(caughtFish.value)}** kazandın!`)
        .setTimestamp();
        
      return message.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor("Gray")
        .setTitle("🎣 Balık Tutma Başarısız!")
        .setDescription("Hiçbir balık tutamadın! Daha sonra tekrar dene.")
        .setTimestamp();
        
      return message.channel.send({ embeds: [embed] });
    }
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
    const coins = getCoins(member.id, message.guild.id);
    
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Profil Bilgisi")
      .addFields(
        { name: "Kullanıcı", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: true },
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "XP", value: `${userData.xp}`, inline: true },
        { name: "Hunter Bucks", value: formatCoins(coins), inline: true },
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
