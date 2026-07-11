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

const fs = require("fs");
const path = require("path");

// Veri dosyalarının yolları
const dataDir = "./data";
const userLevelsFile = path.join(dataDir, "userLevels.json");
const levelChannelsFile = path.join(dataDir, "levelChannels.json");
const userCoinsFile = path.join(dataDir, "userCoins.json");
const dailyCooldownsFile = path.join(dataDir, "dailyCooldowns.json");
const workCooldownsFile = path.join(dataDir, "workCooldowns.json");

// Data klasörünü oluştur
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Veri yükleme fonksiyonu
function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (error) {
    console.error(`Veri yüklenirken hata: ${filePath}`, error);
  }
  return new Map();
}

// Veri kaydetme fonksiyonu
function saveData(filePath, map) {
  try {
    fs.writeFileSync(filePath, JSON.stringify([...map]));
  } catch (error) {
    console.error(`Veri kaydedilirken hata: ${filePath}`, error);
  }
}

// Level sistemi için veri
const userLevels = loadData(userLevelsFile);
const levelChannels = loadData(levelChannelsFile);

// Hunter Bucks coin sistemi
const userCoinsMap = loadData(userCoinsFile);
const dailyCooldowns = loadData(dailyCooldownsFile);
const workCooldowns = loadData(workCooldownsFile);

// Periyodik kaydetme (her 30 saniyede bir)
setInterval(() => {
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
}, 30000);

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
  console.log("Veriler başarıyla yüklendi!");
});

// Bot kapanırken verileri kaydet
process.on("SIGINT", () => {
  console.log("Bot kapatılıyor, veriler kaydediliyor...");
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  console.log("Veriler kaydedildi!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Bot kapatılıyor, veriler kaydediliyor...");
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  console.log("Veriler kaydedildi!");
  process.exit(0);
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

    const rewards = {
      1: 100, 2: 200, 3: 300, 4: 400, 5: 500,
      6: 600, 7: 700, 8: 800, 9: 900, 10: 1000,
      11: 1100, 12: 1200, 13: 1300, 14: 1400, 15: 1500,
      16: 1600, 17: 1700, 18: 1800, 19: 1900, 20: 2000,
      21: 2100, 22: 2200, 23: 2300, 24: 2400, 25: 2500,
      26: 2600, 27: 2700, 28: 2800, 29: 2900, 30: 3000,
      31: 3100, 32: 3200, 33: 3300, 34: 3400, 35: 3500,
      36: 3600, 37: 3700, 38: 3800, 39: 3900, 40: 4000,
      41: 4100, 42: 4200, 43: 4300, 44: 4400, 45: 4500,
      46: 4600, 47: 4700, 48: 4800, 49: 4900, 50: 5000,
    };
    const reward = rewards[userData.level] || 0;
    addCoins(userId, guildId, reward);
    return true;
  }
  return false;
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
  return userCoinsMap.get(userKey) || 0;
}

function addCoins(userId, guildId, amount) {
  const userKey = `${guildId}_${userId}`;
  const current = getCoins(userId, guildId);
  userCoinsMap.set(userKey, current + amount);
}

function removeCoins(userId, guildId, amount) {
  const userKey = `${guildId}_${userId}`;
  const current = getCoins(userId, guildId);
  const newAmount = Math.max(0, current - amount);
  userCoinsMap.set(userKey, newAmount);
  return current >= amount;
}

function formatCoins(amount) {
  return `${amount.toLocaleString()} HB`;
}

function getCooldownTime(cooldownMap, userId, guildId) {
  const userKey = `${guildId}_${userId}`;
  return cooldownMap.get(userKey) || 0;
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

// Ana mesaj dinleyicisi
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // Level sistemi - Her mesajda XP ver
  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const userKey = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(userKey).level;
    const coinReward = newLevel * 50;
    addCoins(message.author.id, message.guild.id, coinReward);
    sendLevelUpMessage(message.member, newLevel);
  }

  // Rastgele coin kazanma
  if (Math.random() < 0.05) {
    const randomCoins = Math.floor(Math.random() * 10) + 1;
    addCoins(message.author.id, message.guild.id, randomCoins);
  }

  // Oto cevaplar
  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();
    if (msg === "sa") return message.reply("as hg knk");
    if (msg === "selam") return message.reply("selam canım nasılsın?");
    if (msg === "günaydın") return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler") return message.reply("tatlı rüyalar 😴");
    if (msg === "bot") return message.reply("evet ben botum, yapımcım axel_ey 👑");
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // ─── YARDIM ────────────────────────────────────────────────────────────────
  if (command === "yardım" || command === "yardim" || command === "help") {
    const yardımEmbed = new EmbedBuilder()
      .setColor("#FF6B6B")
      .setTitle("🎮 Bot Komut Rehberi")
      .setDescription("**Tüm komutlar ve açıklamaları kategorilere göre ayrılmıştır!**")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "🛡️ **MODERASYON KOMUTLARI**",
          value: [
            "`🔨 !ban @kullanıcı [sebep]` • Kullanıcıyı sunucudan banlar",
            "`👢 !kick @kullanıcı [sebep]` • Kullanıcıyı sunucudan atar",
            "`🧹 !temizle <1-100>` • Belirtilen sayıda mesaj siler",
            "`🔇 !mute @kullanıcı <süre>` • Kullanıcıyı belirli süre susturur (ör: 10m, 1h)",
            "`🔊 !unmute @kullanıcı` • Kullanıcının susturmasını kaldırır",
          ].join("\n"),
          inline: false,
        },
        {
          name: "📊 **İSTATİSTİK KOMUTLARI**",
          value: [
            "`📊 !sunucubilgi` • Sunucu hakkında detaylı bilgi verir",
            "`📈 !istatistik` • Sunucu istatistiklerini gösterir",
            "`👤 !profil [@kullanıcı]` • Kullanıcı profil bilgilerini gösterir",
            "`🖼️ !avatar [@kullanıcı]` • Profil fotoğrafını gösterir",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🎉 **EĞLENCE KOMUTLARI**",
          value: [
            "`🎲 !roll <sayı>` • 1 ile belirtilen sayı arasında zar atar",
            "`💬 !yaz <metin>` • Bot belirtilen metni yazar",
            "`💑 !ship @kullanıcı` • İki kullanıcı arasındaki uyumu ölçer",
          ].join("\n"),
          inline: false,
        },
        {
          name: "📈 **LEVEL SİSTEMİ**",
          value: [
            "`⭐ !level` • Mevcut level ve XP bilginizi gösterir",
            "`📢 !levelkanal #kanal` • Level atlama mesaj kanalını ayarlar",
            "`🏆 !leaderboard` • Level ve coin sıralamasını gösterir",
          ].join("\n"),
          inline: false,
        },
        {
          name: "💰 **HUNTER BUCKS EKONOMİ SİSTEMİ**",
          value: [
            "`💳 !bakiye` • Hunter Bucks bakiyenizi gösterir",
            "`🎁 !daily` • Günlük ödülünüzü alın (24 saat)",
            "`💼 !work` • Çalışarak coin kazanın (1 saat)",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🎰 **KUMAR VE OYUNLAR**",
          value: [
            "`🎰 !slot <miktar>` • Slot makinesi oyunu",
            "`🪙 !coinflip <miktar> <yazı/tura>` • Yazı tura oyunu",
            "`🎲 !dice <miktar> <1-6>` • Zar tahmin oyunu (5x kazanç)",
            "`🏹 !hunt` • Avlanarak coin kazanın (%70 şans)",
            "`🎣 !fish` • Balık tutarak coin kazanın (%80 şans)",
          ].join("\n"),
          inline: false,
        },
        {
          name: "⚙️ **GENEL KOMUTLAR**",
          value: [
            "`🏓 !ping` • Botun gecikme süresini gösterir",
            "`❓ !yardım` • Bu yardım menüsünü gösterir",
          ].join("\n"),
          inline: false,
        },
      )
      .setFooter({
        text: `${message.guild.name} • Yapımcı: axel_ey 👑`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.channel.send({ embeds: [yardımEmbed] });
  }

  // ─── PING ───────────────────────────────────────────────────────────────────
  if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(`🏓 Gecikme: **${ping}ms** | WebSocket: **${client.ws.ping}ms**`),
      ],
    });
  }

  // ─── LEVEL ──────────────────────────────────────────────────────────────────
  if (command === "level" || command === "xp") {
    const target = message.mentions.members.first() || message.member;
    const userKey = `${message.guild.id}_${target.id}`;
    const userData = userLevels.get(userKey) || { xp: 0, level: 1 };
    const requiredXP = userData.level * 100;

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setTitle("📊 Level Bilgisi")
      .setDescription(`${target.user.tag} kullanıcısının seviyesi`)
      .addFields(
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "XP", value: `${userData.xp}/${requiredXP}`, inline: true },
        { name: "Eksik XP", value: `${requiredXP - userData.xp}`, inline: true },
      )
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
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

  // ─── LEADERBOARD ────────────────────────────────────────────────────────────
  if (command === "leaderboard" || command === "lb" || command === "sıralama") {
    const guildId = message.guild.id;

    const levelData = [];
    for (const [userKey, data] of userLevels.entries()) {
      if (userKey.startsWith(guildId + "_")) {
        const userId = userKey.split("_")[1];
        try {
          const user = await client.users.fetch(userId);
          levelData.push({ username: user.username, level: data.level, xp: data.xp });
        } catch {}
      }
    }

    const coinData = [];
    for (const [userKey, coins] of userCoinsMap.entries()) {
      if (userKey.startsWith(guildId + "_")) {
        const userId = userKey.split("_")[1];
        try {
          const user = await client.users.fetch(userId);
          coinData.push({ username: user.username, coins });
        } catch {}
      }
    }

    levelData.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
    coinData.sort((a, b) => b.coins - a.coins);

    let levelText = "";
    for (let i = 0; i < Math.min(10, levelData.length); i++) {
      const u = levelData[i];
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      levelText += `${medal} **${u.username}** - Level ${u.level} (${u.xp} XP)\n`;
    }

    let coinText = "";
    for (let i = 0; i < Math.min(10, coinData.length); i++) {
      const u = coinData[i];
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      coinText += `${medal} **${u.username}** - ${formatCoins(u.coins)}\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("🏆 Liderlik Tablosu")
      .addFields(
        { name: "📊 Level Sıralaması", value: levelText || "Henüz veri yok", inline: false },
        { name: "💰 Hunter Bucks Sıralaması", value: coinText || "Henüz veri yok", inline: false },
      )
      .setFooter({ text: `${message.guild.name} sunucusu` })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // ─── HUNTER BUCKS ───────────────────────────────────────────────────────────
  if (command === "bakiye" || command === "balance" || command === "bal") {
    const target = message.mentions.members.first() || message.member;
    const coins = getCoins(target.id, message.guild.id);
    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle("💰 Hunter Bucks Bakiye")
      .setDescription(`${target.user.tag} adlı kullanıcının bakiyesi: **${formatCoins(coins)}**`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "daily") {
    const cooldownTime = getCooldownTime(dailyCooldowns, message.author.id, message.guild.id);
    if (cooldownTime > Date.now()) {
      const timeLeft = formatTime(cooldownTime - Date.now());
      return message.reply(`⏰ Günlük ödülünü zaten aldın! **${timeLeft}** sonra tekrar dene.`);
    }
    const dailyAmount = Math.floor(Math.random() * 500) + 100;
    addCoins(message.author.id, message.guild.id, dailyAmount);
    setCooldown(dailyCooldowns, message.author.id, message.guild.id, 24 * 60 * 60 * 1000);

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
      "🍕 Pizza dağıttın",
      "💻 Kod yazdın",
      "🚗 Uber sürücüsü oldun",
      "📚 Ders verdin",
      "🎵 Müzik yaptın",
      "🎨 Tasarım yaptın",
      "📱 Uygulama geliştirdin",
      "🎮 Oyun test ettin",
    ];
    const selectedWork = works[Math.floor(Math.random() * works.length)];
    const earnedAmount = Math.floor(Math.random() * 150) + 50;
    addCoins(message.author.id, message.guild.id, earnedAmount);
    setCooldown(workCooldowns, message.author.id, message.guild.id, 60 * 60 * 1000);

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("💼 Çalışma Tamamlandı!")
      .setDescription(`${selectedWork} ve **${formatCoins(earnedAmount)}** kazandın!`)
      .setFooter({ text: "1 saat sonra tekrar çalışabilirsin!" })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ─── KUMAR VE OYUNLAR ───────────────────────────────────────────────────────
  if (command === "slot") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) {
      return message.reply("Geçerli bir miktar gir! Örnek: `!slot 100`");
    }
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}**`);
    }

    const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      if (result[0] === "💎") multiplier = 10;
      else if (result[0] === "⭐") multiplier = 5;
      else multiplier = 3;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      multiplier = 1.5;
    }

    let resultText, color;
    if (multiplier > 0) {
      const winAmount = Math.floor(amount * multiplier);
      addCoins(message.author.id, message.guild.id, winAmount - amount);
      resultText = `🎉 Kazandın! **${formatCoins(winAmount)}** kazandın!`;
      color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      color = "Red";
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
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}**`);
    }

    const result = Math.random() < 0.5 ? "yazı" : "tura";
    const won = choice === result;

    let resultText, color;
    if (won) {
      addCoins(message.author.id, message.guild.id, amount);
      resultText = `🎉 Kazandın! **${formatCoins(amount * 2)}** kazandın!`;
      color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      color = "Red";
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
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) {
      return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}**`);
    }

    const result = Math.floor(Math.random() * 6) + 1;
    const won = guess === result;

    let resultText, color;
    if (won) {
      const winAmount = amount * 5;
      addCoins(message.author.id, message.guild.id, winAmount);
      resultText = `🎉 Kazandın! **${formatCoins(winAmount)}** kazandın!`;
      color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      color = "Red";
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
      { name: "🦁 Aslan", value: 500 },
    ];
    const success = Math.random() < 0.7;

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
      { name: "🦀 Yengeç", value: 80 },
    ];
    const success = Math.random() < 0.8;

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

  // ─── EĞLENCE ────────────────────────────────────────────────────────────────
  if (command === "ship") {
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      return message.reply("Kimi ile shipleyelim? Birini etiketle! Örnek: `!ship @kullanıcı`");
    }
    if (mentionedUser.id === message.author.id) {
      return message.reply("Kendini kendine shipliyemezsin! 😅");
    }
    const shipPercentage = Math.floor(Math.random() * 101);
    let shipStatus;
    if (shipPercentage >= 90) shipStatus = "💖 Mükemmel Eşleşme!";
    else if (shipPercentage >= 80) shipStatus = "💕 Çok Uyumlu!";
    else if (shipPercentage >= 70) shipStatus = "💗 İyi Eşleşme!";
    else if (shipPercentage >= 60) shipStatus = "💓 Fena Değil!";
    else if (shipPercentage >= 40) shipStatus = "💛 Orta Düzey";
    else if (shipPercentage >= 20) shipStatus = "💙 Zayıf Bağ";
    else shipStatus = "💔 Uyumsuz";

    const embed = new EmbedBuilder()
      .setColor("Pink")
      .setTitle("💑 Ship Sonucu")
      .setDescription(
        `**${message.author.username}** ❤️ **${mentionedUser.username}**\n\nUyum oranı: **${shipPercentage}%** — ${shipStatus}`
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "roll") {
    const max = parseInt(args[0]) || 100;
    if (max < 1) return message.reply("Sayı en az 1 olmalı.");
    const sayi = Math.floor(Math.random() * max) + 1;
    return message.channel.send(`🎲 Attığın sayı: **${sayi}** (1-${max})`);
  }

  if (command === "yaz") {
    const text = args.join(" ");
    if (!text) return message.reply("Ne yazayım?");
    return message.channel.send(text);
  }

  // ─── İSTATİSTİK KOMUTLARI ───────────────────────────────────────────────────
  if (command === "avatar") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`${target.user.tag} kullanıcısının avatarı`)
          .setImage(target.user.displayAvatarURL({ dynamic: true, size: 512 })),
      ],
    });
  }

  if (command === "sunucubilgi") {
    const { guild } = message;
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`📋 ${guild.name} — Sunucu Bilgileri`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Sunucu Adı", value: guild.name, inline: true },
        { name: "Sunucu ID", value: guild.id, inline: true },
        { name: "Üye Sayısı", value: `${guild.memberCount}`, inline: true },
        { name: "Kuruluş Tarihi", value: guild.createdAt.toDateString(), inline: true },
        { name: "Sahip", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Kanal Sayısı", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Rol Sayısı", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Boost Seviyesi", value: `${guild.premiumTier}`, inline: true },
        { name: "Boost Sayısı", value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "istatistik" || command === "stats") {
    const { guild } = message;
    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const humanCount = totalMembers - botCount;
    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;

    // Bu sunucudaki toplam XP
    const guildId = guild.id;
    let totalXP = 0;
    let totalRegistered = 0;
    for (const [userKey, data] of userLevels.entries()) {
      if (userKey.startsWith(guildId + "_")) {
        totalXP += data.xp + (data.level - 1) * 100;
        totalRegistered++;
      }
    }

    let totalCoins = 0;
    for (const [userKey, coins] of userCoinsMap.entries()) {
      if (userKey.startsWith(guildId + "_")) {
        totalCoins += coins;
      }
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`📈 ${guild.name} — Sunucu İstatistikleri`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "👥 Toplam Üye", value: `${totalMembers}`, inline: true },
        { name: "🧑 İnsan", value: `${humanCount}`, inline: true },
        { name: "🤖 Bot", value: `${botCount}`, inline: true },
        { name: "💬 Yazı Kanalı", value: `${textChannels}`, inline: true },
        { name: "🔊 Ses Kanalı", value: `${voiceChannels}`, inline: true },
        { name: "🎭 Rol Sayısı", value: `${guild.roles.cache.size}`, inline: true },
        { name: "📊 Kayıtlı Kullanıcı", value: `${totalRegistered}`, inline: true },
        { name: "⭐ Toplam Kazanılan XP", value: `${totalXP.toLocaleString()}`, inline: true },
        { name: "💰 Dolaşımdaki HB", value: `${formatCoins(totalCoins)}`, inline: true },
      )
      .setFooter({ text: `${guild.name} sunucusu` })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "profil") {
    const target = message.mentions.members.first() || message.member;
    const userKey = `${message.guild.id}_${target.id}`;
    const userData = userLevels.get(userKey) || { xp: 0, level: 1 };
    const coins = getCoins(target.id, message.guild.id);
    const requiredXP = userData.level * 100;

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`👤 ${target.user.tag} — Profil`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Kullanıcı", value: target.user.tag, inline: true },
        { name: "ID", value: target.id, inline: true },
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "XP", value: `${userData.xp}/${requiredXP}`, inline: true },
        { name: "Hunter Bucks", value: formatCoins(coins), inline: true },
        { name: "Hesap Oluşturma", value: target.user.createdAt.toDateString(), inline: true },
        { name: "Sunucuya Katılım", value: target.joinedAt?.toDateString() || "Bilinmiyor", inline: true },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ─── MODERASYON KOMUTLARI ───────────────────────────────────────────────────
  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("🚫 Ban yetkin yok!");
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi banlayayım? Birini etiketle.");
    if (!target.bannable) return message.reply("🚫 Bu kullanıcıyı banlayamam! Yetkim yetersiz.");
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    await target.ban({ reason });
    const embed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTitle("⛔ Kullanıcı Banlandı")
      .addFields(
        { name: "Kullanıcı", value: target.user.tag, inline: true },
        { name: "Yetkili", value: message.author.tag, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply("🚫 Kick yetkin yok!");
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi kickleyeyim? Birini etiketle.");
    if (!target.kickable) return message.reply("🚫 Bu kullanıcıyı kickleyemem! Yetkim yetersiz.");
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    await target.kick(reason);
    const embed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle("👢 Kullanıcı Kicklendi")
      .addFields(
        { name: "Kullanıcı", value: target.user.tag, inline: true },
        { name: "Yetkili", value: message.author.tag, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "temizle" || command === "clear" || command === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("🚫 Mesaj yönetme yetkin yok!");
    }
    const miktar = parseInt(args[0]);
    if (!miktar || miktar < 1 || miktar > 100) {
      return message.reply("1-100 arası bir sayı gir. Örnek: `!temizle 10`");
    }
    try {
      await message.channel.bulkDelete(miktar + 1, true);
      const msg = await message.channel.send(`✅ **${miktar}** mesaj silindi.`);
      setTimeout(() => {
        if (msg.deletable) msg.delete().catch(() => {});
      }, 3000);
    } catch (error) {
      return message.reply("❌ Mesajlar silinemedi. 14 günden eski mesajlar toplu silinemez.");
    }
  }

  if (command === "mute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("🚫 Timeout (mute) yetkin yok!");
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi mute yapacağım? Birini etiketle.");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı mute yapamam! Yetkim yetersiz.");

    const ms = require("ms");
    const süreArg = args[1];
    if (!süreArg) return message.reply("Süre belirt! Örnek: `!mute @kullanıcı 10m`");
    const süreMs = ms(süreArg);
    if (!süreMs || süreMs < 1000 || süreMs > 28 * 24 * 60 * 60 * 1000) {
      return message.reply("Geçerli bir süre gir (en az 1s, en fazla 28 gün). Örnek: `10m`, `1h`, `1d`");
    }

    const reason = args.slice(2).join(" ") || "Sebep belirtilmedi";
    await target.timeout(süreMs, reason);

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("🔇 Kullanıcı Mute Edildi")
      .addFields(
        { name: "Kullanıcı", value: target.user.tag, inline: true },
        { name: "Yetkili", value: message.author.tag, inline: true },
        { name: "Süre", value: süreArg, inline: true },
        { name: "Sebep", value: reason, inline: false },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "unmute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("🚫 Timeout kaldırma yetkin yok!");
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimin mute'unu kaldırayım? Birini etiketle.");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı düzenleyemem! Yetkim yetersiz.");

    await target.timeout(null);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🔊 Mute Kaldırıldı")
      .addFields(
        { name: "Kullanıcı", value: target.user.tag, inline: true },
        { name: "Yetkili", value: message.author.tag, inline: true },
      )
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
