require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const prefix = "a!";

const fs   = require("fs");
const path = require("path");

// ── Veri dosyaları ─────────────────────────────────────────────────────────────
const dataDir             = "./data";
const userLevelsFile      = path.join(dataDir, "userLevels.json");
const levelChannelsFile   = path.join(dataDir, "levelChannels.json");
const userCoinsFile       = path.join(dataDir, "userCoins.json");
const dailyCooldownsFile  = path.join(dataDir, "dailyCooldowns.json");
const workCooldownsFile   = path.join(dataDir, "workCooldowns.json");
const userProfilesFile    = path.join(dataDir, "userProfiles.json");
const userInventoryFile   = path.join(dataDir, "userInventory.json");
const userStatsFile       = path.join(dataDir, "userStats.json");
const warningsFile        = path.join(dataDir, "warnings.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return new Map(JSON.parse(data));
    }
  } catch (e) { console.error(`Veri yüklenemedi: ${filePath}`, e); }
  return new Map();
}
function saveData(filePath, map) {
  try { fs.writeFileSync(filePath, JSON.stringify([...map])); }
  catch (e) { console.error(`Veri kaydedilemedi: ${filePath}`, e); }
}

// ── Verileri yükle ─────────────────────────────────────────────────────────────
const userLevels     = loadData(userLevelsFile);
const levelChannels  = loadData(levelChannelsFile);
const userCoinsMap   = loadData(userCoinsFile);
const dailyCooldowns = loadData(dailyCooldownsFile);
const workCooldowns  = loadData(workCooldownsFile);
const userProfiles   = loadData(userProfilesFile);
const userInventory  = loadData(userInventoryFile);
const userStats      = loadData(userStatsFile);
const warningsMap    = loadData(warningsFile);

// Aktif ses oturumları (ram'de tutuluyor — key: guildId_userId, value: joinTimestamp)
const voiceSessions = new Map();

// ── Periyodik kayıt (30 sn) ───────────────────────────────────────────────────
setInterval(() => {
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  saveData(userProfilesFile, userProfiles);
  saveData(userInventoryFile, userInventory);
  saveData(userStatsFile, userStats);
  saveData(warningsFile, warningsMap);
}, 30000);

// ── Mağaza ürünleri ────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  // Renkler
  { id: "color_mavi",      name: "🔵 Mavi",          price: 300,  type: "color", value: "#3498DB", desc: "Profil embed rengi mavi olur" },
  { id: "color_kirmizi",   name: "🔴 Kırmızı",        price: 300,  type: "color", value: "#E74C3C", desc: "Profil embed rengi kırmızı olur" },
  { id: "color_yesil",     name: "🟢 Yeşil",          price: 300,  type: "color", value: "#2ECC71", desc: "Profil embed rengi yeşil olur" },
  { id: "color_mor",       name: "💜 Mor",            price: 500,  type: "color", value: "#9B59B6", desc: "Profil embed rengi mor olur" },
  { id: "color_turuncu",   name: "🟠 Turuncu",        price: 400,  type: "color", value: "#E67E22", desc: "Profil embed rengi turuncu olur" },
  { id: "color_pembe",     name: "🩷 Pembe",           price: 500,  type: "color", value: "#FF69B4", desc: "Profil embed rengi pembe olur" },
  { id: "color_altin",     name: "🟡 Altın",          price: 800,  type: "color", value: "#FFD700", desc: "Profil embed rengi altın olur" },
  { id: "color_lacivert",  name: "🌊 Lacivert",       price: 600,  type: "color", value: "#1A237E", desc: "Profil embed rengi lacivert olur" },
  { id: "color_galaksi",   name: "🌌 Galaksi",        price: 2000, type: "color", value: "#2C003E", desc: "Nadir — galaksi rengi" },
  { id: "color_alev",      name: "🔥 Alev",           price: 1500, type: "color", value: "#FF4500", desc: "Nadir — alev rengi" },
  // Rozetler
  { id: "badge_yildiz",    name: "⭐ Yıldız Rozeti",  price: 200,  type: "badge", value: "⭐", desc: "Profilde yıldız rozeti gösterilir" },
  { id: "badge_kalp",      name: "❤️ Kalp Rozeti",    price: 200,  type: "badge", value: "❤️", desc: "Profilde kalp rozeti gösterilir" },
  { id: "badge_ates",      name: "🔥 Ateş Rozeti",    price: 400,  type: "badge", value: "🔥", desc: "Profilde ateş rozeti gösterilir" },
  { id: "badge_tac",       name: "👑 Taç Rozeti",     price: 1500, type: "badge", value: "👑", desc: "Nadir — taç rozeti" },
  { id: "badge_elmas",     name: "💎 Elmas Rozeti",   price: 2500, type: "badge", value: "💎", desc: "Ultra nadir — elmas rozeti" },
  { id: "badge_simsek",    name: "⚡ Şimşek Rozeti",  price: 700,  type: "badge", value: "⚡", desc: "Profilde şimşek rozeti gösterilir" },
  { id: "badge_muzik",     name: "🎵 Müzik Rozeti",   price: 500,  type: "badge", value: "🎵", desc: "Profilde müzik rozeti gösterilir" },
  { id: "badge_oyun",      name: "🎮 Oyuncu Rozeti",  price: 500,  type: "badge", value: "🎮", desc: "Profilde oyuncu rozeti gösterilir" },
  // Özel
  { id: "bio_unlock",      name: "📝 Bio Kilidi",     price: 250,  type: "bio",   value: true, desc: "Profiline özel bio (tanıtım yazısı) ekleyebilirsin" },
];

function getShopItem(id) { return SHOP_ITEMS.find(i => i.id === id); }

// ── Profil yardımcıları ───────────────────────────────────────────────────────
function getProfile(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userProfiles.has(key)) {
    userProfiles.set(key, { color: "#5865F2", badges: [], activeBadge: "", bio: "" });
  }
  return userProfiles.get(key);
}

function getInventory(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userInventory.has(key)) userInventory.set(key, []);
  return userInventory.get(key);
}

function hasItem(userId, guildId, itemId) {
  return getInventory(userId, guildId).includes(itemId);
}

// ── İstatistik yardımcıları ───────────────────────────────────────────────────
function getStats(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userStats.has(key)) {
    const now = Date.now();
    userStats.set(key, {
      weekly:  { messages: 0, voiceMinutes: 0, periodStart: getWeekStart(now) },
      monthly: { messages: 0, voiceMinutes: 0, periodStart: getMonthStart(now) },
    });
  }
  return userStats.get(key);
}

function getWeekStart(ts) {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Pazar
  const diff = (day === 0 ? -6 : 1 - day); // Pazartesi başlangıç
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function getMonthStart(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function checkAndResetStats(stats) {
  const now = Date.now();
  const currentWeekStart  = getWeekStart(now);
  const currentMonthStart = getMonthStart(now);
  let changed = false;

  if (stats.weekly.periodStart < currentWeekStart) {
    stats.weekly = { messages: 0, voiceMinutes: 0, periodStart: currentWeekStart };
    changed = true;
  }
  if (stats.monthly.periodStart < currentMonthStart) {
    stats.monthly = { messages: 0, voiceMinutes: 0, periodStart: currentMonthStart };
    changed = true;
  }
  return changed;
}

function addMessageStat(userId, guildId) {
  const stats = getStats(userId, guildId);
  checkAndResetStats(stats);
  stats.weekly.messages++;
  stats.monthly.messages++;
}

function addVoiceMinutes(userId, guildId, minutes) {
  const stats = getStats(userId, guildId);
  checkAndResetStats(stats);
  stats.weekly.voiceMinutes  += minutes;
  stats.monthly.voiceMinutes += minutes;
}

function formatDuration(minutes) {
  if (minutes < 1)    return "< 1 dakika";
  if (minutes < 60)   return `${Math.floor(minutes)} dakika`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m > 0 ? `${h} saat ${m} dakika` : `${h} saat`;
}

// ── Coin yardımcıları ─────────────────────────────────────────────────────────
function getCoins(userId, guildId) {
  return userCoinsMap.get(`${guildId}_${userId}`) || 0;
}
function addCoins(userId, guildId, amount) {
  const k = `${guildId}_${userId}`;
  userCoinsMap.set(k, (userCoinsMap.get(k) || 0) + amount);
}
function removeCoins(userId, guildId, amount) {
  const k = `${guildId}_${userId}`;
  const cur = userCoinsMap.get(k) || 0;
  userCoinsMap.set(k, Math.max(0, cur - amount));
  return cur >= amount;
}
function formatCoins(n) { return `${n.toLocaleString()} HB`; }

// ── Cooldown yardımcıları ─────────────────────────────────────────────────────
function getCooldown(map, userId, guildId) { return map.get(`${guildId}_${userId}`) || 0; }
function setCooldown(map, userId, guildId, dur) { map.set(`${guildId}_${userId}`, Date.now() + dur); }
function formatTime(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}d`;
  if (m > 0) return `${m}d ${s % 60}s`;
  return `${s}s`;
}

// ── XP sistemi ────────────────────────────────────────────────────────────────
function addXP(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userLevels.has(key)) userLevels.set(key, { xp: 0, level: 1 });
  const ud = userLevels.get(key);
  ud.xp += Math.floor(Math.random() * 15) + 5;
  if (ud.xp >= ud.level * 100) {
    ud.level++;
    ud.xp = 0;
    const levelRewards = {};
    for (let i = 1; i <= 50; i++) levelRewards[i] = i * 100;
    addCoins(userId, guildId, levelRewards[ud.level] || 0);
    return true;
  }
  return false;
}

function sendLevelUpMessage(member, newLevel, coinReward) {
  const channelId = levelChannels.get(member.guild.id);
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setTitle("🎉 Tebrikler, Seviye Atladın!")
    .setDescription(
      `${member} tebrikler! Artık **${newLevel}. seviye**sin! 🚀\n\n` +
      `💰 Ödül olarak **${coinReward.toLocaleString()} HB** kazandın!`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "👤 Kullanıcı", value: member.user.tag, inline: true },
      { name: "⭐ Yeni Seviye", value: `${newLevel}`, inline: true },
      { name: "💰 Ödül", value: `${coinReward.toLocaleString()} HB`, inline: true },
    )
    .setFooter({ text: "Mesaj atmaya devam et, daha fazla seviye kazan!" })
    .setTimestamp();
  channel.send({ content: `${member}`, embeds: [embed] });
}

// ── Express web sunucusu ──────────────────────────────────────────────────────
const express = require("express");
const app = express();
app.get("/", (_, res) => res.sendStatus(200));
app.listen(5000, () => console.log("Web sunucusu 5000 portunda çalışıyor."));

// ── Hazır ─────────────────────────────────────────────────────────────────────
client.on("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  console.log("Veriler başarıyla yüklendi!");
});

// ── Kapanış kayıt ─────────────────────────────────────────────────────────────
function saveAll() {
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  saveData(userProfilesFile, userProfiles);
  saveData(userInventoryFile, userInventory);
  saveData(userStatsFile, userStats);
  saveData(warningsFile, warningsMap);
}
process.on("SIGINT",  () => { console.log("Kapatılıyor..."); saveAll(); process.exit(0); });
process.on("SIGTERM", () => { console.log("Kapatılıyor..."); saveAll(); process.exit(0); });

// ── Ses oturumu takibi ────────────────────────────────────────────────────────
client.on("voiceStateUpdate", (oldState, newState) => {
  const userId  = newState.member?.id || oldState.member?.id;
  const guildId = (newState.guild || oldState.guild).id;
  if (!userId || !guildId) return;
  // Botu ve botun kendisini atla
  const member = newState.member || oldState.member;
  if (member?.user?.bot) return;

  const key = `${guildId}_${userId}`;

  const joinedChannel = !oldState.channelId && newState.channelId;
  const leftChannel   = oldState.channelId && !newState.channelId;
  const movedChannel  = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

  if (joinedChannel) {
    voiceSessions.set(key, Date.now());
  } else if (leftChannel) {
    const joinTime = voiceSessions.get(key);
    if (joinTime) {
      const minutes = (Date.now() - joinTime) / 60000;
      if (minutes > 0) addVoiceMinutes(userId, guildId, minutes);
      voiceSessions.delete(key);
    }
  } else if (movedChannel) {
    // Kanal değiştirdi — sayacı yoksa başlat, varsa devam et
    if (!voiceSessions.has(key)) voiceSessions.set(key, Date.now());
  }
});

// ── Ana mesaj dinleyicisi ─────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // XP
  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const key = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(key).level;
    const coinReward = newLevel * 50;
    addCoins(message.author.id, message.guild.id, coinReward);
    sendLevelUpMessage(message.member, newLevel, coinReward);
  }

  // Mesaj istatistiği
  addMessageStat(message.author.id, message.guild.id);

  // Rastgele coin
  if (Math.random() < 0.05) addCoins(message.author.id, message.guild.id, Math.floor(Math.random() * 10) + 1);

  // Oto cevaplar
  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();
    if (msg === "sa")           return message.reply("as hg knk");
    if (msg === "selam")        return message.reply("selam canım nasılsın?");
    if (msg === "günaydın")     return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler")  return message.reply("tatlı rüyalar 😴");
    if (msg === "bot")          return message.reply("evet ben botum, yapımcım axel_ey 👑");
    return;
  }

  const args    = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // ── YARDIM ───────────────────────────────────────────────────────────────────
  if (command === "yardım" || command === "yardim" || command === "help") {
    const embed = new EmbedBuilder()
      .setColor("#FF6B6B")
      .setTitle("🎮 Bot Komut Rehberi")
      .setDescription("**Tüm komutlar kategorilere göre ayrılmıştır!**")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "🛡️ **MODERASYON**",
          value: [
            "`a!ban @üye [sebep]` • Banlar",
            "`a!kick @üye [sebep]` • Atar",
            "`a!temizle <1-100>` • Mesaj siler",
            "`a!mute @üye <süre>` • Susturur (10m, 1h, 1d)",
            "`a!unmute @üye` • Susturmayı kaldırır",
            "`a!warn @üye <sebep>` • Warn atar",
            "`a!warnings [@üye]` • Warn geçmişini listeler",
            "`a!unwarn @üye <numara|all>` • Warn siler",
          ].join("\n"), inline: false,
        },
        {
          name: "👤 **PROFİL & MAĞAZA**",
          value: [
            "`a!profil [@üye]` • Profili gösterir",
            "`a!profilayarla renk <id>` • Profil rengini değiştirir",
            "`a!profilayarla rozet <id>` • Aktif rozeti değiştirir",
            "`a!profilayarla bio <metin>` • Bio ayarlar (Bio Kilidi gerekli)",
            "`a!shop` • Mağazayı açar",
            "`a!satinal <ürün_id>` • Ürün satın alır",
            "`a!envanter` • Sahip olduğun ürünleri gösterir",
          ].join("\n"), inline: false,
        },
        {
          name: "📊 **İSTATİSTİK**",
          value: [
            "`a!istatistik [@üye]` • Haftalık/aylık mesaj & ses süresi",
            "`a!sunucubilgi` • Sunucu bilgileri",
            "`a!avatar [@üye]` • Avatar gösterir",
          ].join("\n"), inline: false,
        },
        {
          name: "📈 **LEVEL SİSTEMİ**",
          value: [
            "`a!level [@üye]` • Level & XP bilgisi",
            "`a!seviyekanal #kanal` • Seviye atlama kanalını ayarlar",
            "`a!leaderboard` • Sıralama tablosu",
          ].join("\n"), inline: false,
        },
        {
          name: "💰 **EKONOMİ**",
          value: [
            "`a!bakiye [@üye]` • HB bakiyesi",
            "`a!hbver @üye <miktar>` • HB transfer eder",
            "`a!daily` • Günlük ödül (24 saat)",
            "`a!work` • Çalış, coin kazan (1 saat)",
          ].join("\n"), inline: false,
        },
        {
          name: "🎰 **OYUNLAR**",
          value: [
            "`a!slot <miktar>` • Slot makinesi",
            "`a!coinflip <miktar> <yazı/tura>` • Yazı tura",
            "`a!dice <miktar> <1-6>` • Zar tahmin (5x)",
            "`a!hunt` • Avlanma (%70 şans)",
            "`a!fish` • Balık tutma (%80 şans)",
          ].join("\n"), inline: false,
        },
        {
          name: "⚙️ **GENEL**",
          value: ["`a!ping` • Gecikme", "`a!yardım` • Bu menü"].join("\n"), inline: false,
        },
      )
      .setFooter({ text: `${message.guild.name} • Yapımcı: axel_ey 👑`, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── PING ─────────────────────────────────────────────────────────────────────
  if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    return message.reply({
      embeds: [new EmbedBuilder().setColor("Green")
        .setDescription(`🏓 Gecikme: **${ping}ms** | WebSocket: **${client.ws.ping}ms**`)],
    });
  }

  // ── LEVEL ─────────────────────────────────────────────────────────────────────
  if (command === "level" || command === "xp") {
    const target = message.mentions.members.first() || message.member;
    const key    = `${message.guild.id}_${target.id}`;
    const ud     = userLevels.get(key) || { xp: 0, level: 1 };
    const reqXP  = ud.level * 100;
    const embed  = new EmbedBuilder()
      .setColor(getProfile(target.id, message.guild.id).color || "Purple")
      .setTitle("📊 Level Bilgisi")
      .setDescription(`${target.user.tag} kullanıcısının seviyesi`)
      .addFields(
        { name: "Level", value: `${ud.level}`, inline: true },
        { name: "XP",    value: `${ud.xp}/${reqXP}`, inline: true },
        { name: "Eksik XP", value: `${reqXP - ud.xp}`, inline: true },
      )
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "levelkanal" || command === "seviyekanal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply("🚫 Kanal yönetme yetkin yok!");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply("Bir kanal etiketle! Örnek: `a!seviyekanal #genel`");
    levelChannels.set(message.guild.id, ch.id);
    saveData(levelChannelsFile, levelChannels);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Seviye Kanalı Ayarlandı")
        .setDescription(`Tebrik mesajları artık ${ch} kanalına gönderilecek!`).setTimestamp(),
    ]});
  }

  // ── LEADERBOARD ───────────────────────────────────────────────────────────────
  if (command === "leaderboard" || command === "lb" || command === "sıralama") {
    const guildId  = message.guild.id;
    const lvlData  = [];
    const coinData = [];
    for (const [k, d] of userLevels.entries()) {
      if (!k.startsWith(guildId + "_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); lvlData.push({ username: u.username, level: d.level, xp: d.xp }); } catch {}
    }
    for (const [k, coins] of userCoinsMap.entries()) {
      if (!k.startsWith(guildId + "_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); coinData.push({ username: u.username, coins }); } catch {}
    }
    lvlData.sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
    coinData.sort((a, b) => b.coins - a.coins);
    const medal = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const lvlText  = lvlData.slice(0, 10).map((u, i) => `${medal(i)} **${u.username}** — Level ${u.level} (${u.xp} XP)`).join("\n") || "Henüz veri yok";
    const coinText = coinData.slice(0, 10).map((u, i) => `${medal(i)} **${u.username}** — ${formatCoins(u.coins)}`).join("\n") || "Henüz veri yok";
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("🏆 Liderlik Tablosu")
        .addFields(
          { name: "📊 Level Sıralaması", value: lvlText, inline: false },
          { name: "💰 Hunter Bucks Sıralaması", value: coinText, inline: false },
        )
        .setFooter({ text: message.guild.name }).setTimestamp(),
    ]});
  }

  // ── EKONOMİ ───────────────────────────────────────────────────────────────────
  if (command === "bakiye" || command === "balance" || command === "bal") {
    const target = message.mentions.members.first() || message.member;
    const coins  = getCoins(target.id, message.guild.id);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("💰 Hunter Bucks Bakiye")
        .setDescription(`${target.user.tag} adlı kullanıcının bakiyesi: **${formatCoins(coins)}**`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true })).setTimestamp(),
    ]});
  }

  if (command === "hbver" || command === "transfer") {
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kime HB gönderayım? Birini etiketle. Örnek: `a!hbver @üye 500`");
    if (target.id === message.author.id) return message.reply("Kendine HB gönderemezsin!");
    if (target.user.bot) return message.reply("Botlara HB gönderilemez!");

    const miktar = parseInt(args[1]);
    if (!miktar || miktar < 1) return message.reply("Geçerli bir miktar gir. Örnek: `a!hbver @üye 500`");

    const senderBal = getCoins(message.author.id, message.guild.id);
    if (senderBal < miktar) return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(senderBal)}**`);

    removeCoins(message.author.id, message.guild.id, miktar);
    addCoins(target.id, message.guild.id, miktar);

    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("💸 HB Transfer Edildi")
        .addFields(
          { name: "Gönderen",  value: message.author.tag, inline: true },
          { name: "Alan",      value: target.user.tag,     inline: true },
          { name: "Miktar",    value: formatCoins(miktar), inline: true },
          { name: "Yeni Bakiyen", value: formatCoins(senderBal - miktar), inline: true },
        ).setTimestamp(),
    ]});
  }

  if (command === "daily") {
    const cd = getCooldown(dailyCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd - Date.now())}** sonra tekrar dene.`);
    const amount = Math.floor(Math.random() * 500) + 100;
    addCoins(message.author.id, message.guild.id, amount);
    setCooldown(dailyCooldowns, message.author.id, message.guild.id, 24 * 60 * 60 * 1000);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("🎁 Günlük Ödül!")
        .setDescription(`Günlük ödülün: **${formatCoins(amount)}**`)
        .setFooter({ text: "24 saat sonra tekrar gelebilirsin!" }).setTimestamp(),
    ]});
  }

  if (command === "work") {
    const cd = getCooldown(workCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd - Date.now())}** sonra tekrar çalışabilirsin.`);
    const works = ["🍕 Pizza dağıttın","💻 Kod yazdın","🚗 Uber sürücüsü oldun","📚 Ders verdin","🎵 Müzik yaptın","🎨 Tasarım yaptın","📱 Uygulama geliştirdin","🎮 Oyun test ettin"];
    const work  = works[Math.floor(Math.random() * works.length)];
    const earned = Math.floor(Math.random() * 150) + 50;
    addCoins(message.author.id, message.guild.id, earned);
    setCooldown(workCooldowns, message.author.id, message.guild.id, 60 * 60 * 1000);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue").setTitle("💼 Çalışma Tamamlandı!")
        .setDescription(`${work} ve **${formatCoins(earned)}** kazandın!`)
        .setFooter({ text: "1 saat sonra tekrar çalışabilirsin!" }).setTimestamp(),
    ]});
  }

  // ── MAĞAZA ────────────────────────────────────────────────────────────────────
  if (command === "shop" || command === "mağaza" || command === "magaza") {
    const colors  = SHOP_ITEMS.filter(i => i.type === "color");
    const badges  = SHOP_ITEMS.filter(i => i.type === "badge");
    const specials = SHOP_ITEMS.filter(i => i.type === "bio");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#FFD700").setTitle("🛒 Hunter Bucks Mağazası")
        .setDescription("Satın almak için: `a!satinal <ürün_id>`\nSahip olduklarını görmek için: `a!envanter`")
        .addFields(
          {
            name: "🎨 Profil Renkleri",
            value: colors.map(i => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"),
            inline: false,
          },
          {
            name: "🏅 Rozetler",
            value: badges.map(i => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"),
            inline: false,
          },
          {
            name: "✨ Özel",
            value: specials.map(i => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**\n↳ ${i.desc}`).join("\n"),
            inline: false,
          },
        )
        .setFooter({ text: `Bakiyen: ${formatCoins(getCoins(message.author.id, message.guild.id))}` })
        .setTimestamp(),
    ]});
  }

  if (command === "satinal") {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply("Hangi ürünü almak istiyorsun? Örnek: `a!satinal color_mavi`");
    const item = getShopItem(itemId);
    if (!item) return message.reply(`❌ \`${itemId}\` adlı ürün bulunamadı. Ürünleri görmek için \`a!shop\` yaz.`);
    if (hasItem(message.author.id, message.guild.id, itemId))
      return message.reply(`Bu ürüne zaten sahipsin! Kullanmak için: \`a!profilayarla\``);
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < item.price) return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`);
    removeCoins(message.author.id, message.guild.id, item.price);
    getInventory(message.author.id, message.guild.id).push(itemId);
    saveData(userInventoryFile, userInventory);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Satın Alma Başarılı!")
        .setDescription(`${item.name} satın aldın!\n\n${item.desc}`)
        .addFields(
          { name: "Ödenen", value: formatCoins(item.price), inline: true },
          { name: "Kalan Bakiye", value: formatCoins(bal - item.price), inline: true },
        )
        .setFooter({ text: "Kullanmak için: a!profilayarla" }).setTimestamp(),
    ]});
  }

  if (command === "envanter") {
    const target = message.mentions.members.first() || message.member;
    const inv    = getInventory(target.id, message.guild.id);
    if (inv.length === 0) {
      return message.reply(`${target.user.tag} adlı kullanıcının envanteri boş. Mağazaya göz atmak için: \`a!shop\``);
    }
    const grouped = { color: [], badge: [], bio: [] };
    for (const id of inv) {
      const item = getShopItem(id);
      if (item) grouped[item.type]?.push(item);
    }
    const fields = [];
    if (grouped.color.length)  fields.push({ name: "🎨 Renkler",  value: grouped.color.map(i => `${i.name} (\`${i.id}\`)`).join("\n"),  inline: false });
    if (grouped.badge.length)  fields.push({ name: "🏅 Rozetler", value: grouped.badge.map(i => `${i.name} (\`${i.id}\`)`).join("\n"), inline: false });
    if (grouped.bio.length)    fields.push({ name: "✨ Özel",     value: grouped.bio.map(i => i.name).join("\n"),                          inline: false });
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color || "#5865F2")
        .setTitle(`🎒 ${target.user.tag} — Envanter`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(...fields)
        .setFooter({ text: "Kullanmak için: a!profilayarla renk/rozet/bio <değer>" }).setTimestamp(),
    ]});
  }

  if (command === "profilayarla" || command === "profil-ayarla") {
    const sub  = args[0]?.toLowerCase();
    const val  = args.slice(1).join(" ");
    const prof = getProfile(message.author.id, message.guild.id);
    const inv  = getInventory(message.author.id, message.guild.id);

    if (!sub) {
      return message.reply([
        "Nasıl kullanılır?",
        "`a!profilayarla renk <renk_id>` — Profil rengini değiştirir",
        "`a!profilayarla rozet <rozet_id>` — Aktif rozeti ayarlar",
        "`a!profilayarla bio <metin>` — Bio ayarlar (bio_unlock gerekli)",
      ].join("\n"));
    }

    if (sub === "renk" || sub === "color") {
      const itemId = val.toLowerCase();
      if (!itemId) return message.reply("Hangi rengi aktif etmek istiyorsun? Örnek: `a!profilayarla renk color_mavi`");
      if (!inv.includes(itemId)) return message.reply(`Bu rengi henüz almadın! Almak için: \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "color") return message.reply("Geçerli bir renk ID'si gir.");
      prof.color = item.value;
      saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Profil rengin **${item.name}** olarak ayarlandı!`);
    }

    if (sub === "rozet" || sub === "badge") {
      const itemId = val.toLowerCase();
      if (!itemId) return message.reply("Hangi rozeti aktif etmek istiyorsun? Örnek: `a!profilayarla rozet badge_tac`");
      if (itemId === "kaldır" || itemId === "kaldir") {
        prof.activeBadge = "";
        saveData(userProfilesFile, userProfiles);
        return message.reply("✅ Aktif rozet kaldırıldı.");
      }
      if (!inv.includes(itemId)) return message.reply(`Bu rozeti henüz almadın! Almak için: \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "badge") return message.reply("Geçerli bir rozet ID'si gir.");
      prof.activeBadge = item.value;
      saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Aktif rozetin **${item.name}** olarak ayarlandı!`);
    }

    if (sub === "bio") {
      if (!inv.includes("bio_unlock")) return message.reply("Bio özelliğini açmak için önce `a!satinal bio_unlock` ile Bio Kilidini satın alman gerekiyor!");
      if (!val) return message.reply("Bio metni gir. Örnek: `a!profilayarla bio Merhaba! Ben bir Discord kullanıcısıyım.`");
      if (val.length > 100) return message.reply("Bio en fazla 100 karakter olabilir!");
      prof.bio = val;
      saveData(userProfilesFile, userProfiles);
      return message.reply("✅ Bio'n başarıyla güncellendi!");
    }

    return message.reply("Geçerli seçenekler: `renk`, `rozet`, `bio`");
  }

  // ── PROFİL ────────────────────────────────────────────────────────────────────
  if (command === "profil") {
    const target  = message.mentions.members.first() || message.member;
    const key     = `${message.guild.id}_${target.id}`;
    const ud      = userLevels.get(key) || { xp: 0, level: 1 };
    const coins   = getCoins(target.id, message.guild.id);
    const prof    = getProfile(target.id, message.guild.id);
    const reqXP   = ud.level * 100;
    const inv     = getInventory(target.id, message.guild.id);

    const badgeDisplay = prof.activeBadge || "Yok";
    const bioDisplay   = prof.bio || "Bio yok — `a!satinal bio_unlock` ile aç!";
    const colorItems   = inv.filter(id => getShopItem(id)?.type === "color").length;
    const badgeItems   = inv.filter(id => getShopItem(id)?.type === "badge").length;

    const embed = new EmbedBuilder()
      .setColor(prof.color)
      .setTitle(`${prof.activeBadge ? prof.activeBadge + " " : ""}${target.user.tag} — Profil`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(`*${bioDisplay}*`)
      .addFields(
        { name: "⭐ Level",        value: `${ud.level}`,                 inline: true },
        { name: "✨ XP",           value: `${ud.xp}/${reqXP}`,           inline: true },
        { name: "💰 Hunter Bucks", value: formatCoins(coins),            inline: true },
        { name: "🏅 Aktif Rozet",  value: badgeDisplay,                  inline: true },
        { name: "🎨 Renk Sayısı",  value: `${colorItems} renk`,          inline: true },
        { name: "🏆 Rozet Sayısı", value: `${badgeItems} rozet`,         inline: true },
        { name: "📅 Katılım",      value: target.joinedAt?.toDateString() || "Bilinmiyor", inline: true },
        { name: "🗓️ Hesap",        value: target.user.createdAt.toDateString(), inline: true },
      )
      .setFooter({ text: `ID: ${target.id}` })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── İSTATİSTİK ────────────────────────────────────────────────────────────────
  if (command === "istatistik" || command === "stats") {
    const target = message.mentions.members.first() || message.member;
    const stats  = getStats(target.id, message.guild.id);
    checkAndResetStats(stats);

    const wStart = new Date(stats.weekly.periodStart).toLocaleDateString("tr-TR");
    const mStart = new Date(stats.monthly.periodStart).toLocaleDateString("tr-TR");

    return message.channel.send({ embeds: [
      new EmbedBuilder()
        .setColor(getProfile(target.id, message.guild.id).color || "#5865F2")
        .setTitle(`📊 ${target.user.tag} — İstatistikler`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: `📅 Bu Hafta (${wStart}'den beri)`,
            value: [
              `💬 Mesaj: **${stats.weekly.messages.toLocaleString()}**`,
              `🔊 Ses Süresi: **${formatDuration(stats.weekly.voiceMinutes)}**`,
            ].join("\n"),
            inline: false,
          },
          {
            name: `🗓️ Bu Ay (${mStart}'den beri)`,
            value: [
              `💬 Mesaj: **${stats.monthly.messages.toLocaleString()}**`,
              `🔊 Ses Süresi: **${formatDuration(stats.monthly.voiceMinutes)}**`,
            ].join("\n"),
            inline: false,
          },
        )
        .setFooter({ text: "Haftalık veriler her Pazartesi, aylık veriler her ay 1'inde sıfırlanır." })
        .setTimestamp(),
    ]});
  }

  // ── SUNUCU BİLGİ ─────────────────────────────────────────────────────────────
  if (command === "sunucubilgi") {
    const { guild } = message;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue").setTitle(`📋 ${guild.name} — Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "Üye Sayısı",    value: `${guild.memberCount}`, inline: true },
          { name: "Kanal Sayısı",  value: `${guild.channels.cache.size}`, inline: true },
          { name: "Rol Sayısı",    value: `${guild.roles.cache.size}`, inline: true },
          { name: "Kuruluş",       value: guild.createdAt.toDateString(), inline: true },
          { name: "Sahip",         value: `<@${guild.ownerId}>`, inline: true },
          { name: "Boost",         value: `Seviye ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boost)`, inline: true },
        ).setTimestamp(),
    ]});
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────────
  if (command === "avatar") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue")
        .setTitle(`${target.user.tag} kullanıcısının avatarı`)
        .setImage(target.user.displayAvatarURL({ dynamic: true, size: 512 })),
    ]});
  }

  // ── PROFİL (eski alias) ───────────────────────────────────────────────────────
  if (command === "profil") {
    const target = message.mentions.members.first() || message.member;
    const key    = `${message.guild.id}_${target.id}`;
    const ud     = userLevels.get(key) || { xp: 0, level: 1 };
    const coins  = getCoins(target.id, message.guild.id);
    const prof   = getProfile(target.id, message.guild.id);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(prof.color || "Blue").setTitle(`👤 ${target.user.tag} — Profil`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "Level",  value: `${ud.level}`, inline: true },
          { name: "XP",     value: `${ud.xp}/${ud.level * 100}`, inline: true },
          { name: "HB",     value: formatCoins(coins), inline: true },
        ).setTimestamp(),
    ]});
  }

  // ── OYUNLAR ───────────────────────────────────────────────────────────────────
  if (command === "slot") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Geçerli bir miktar gir! Örnek: `a!slot 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}**`);

    const symbols = ["🍒","🍋","🍊","🍇","⭐","💎"];
    const result  = [0,1,2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2]) {
      multiplier = result[0] === "💎" ? 10 : result[0] === "⭐" ? 5 : 3;
    } else if (result[0]===result[1] || result[1]===result[2] || result[0]===result[2]) {
      multiplier = 1.5;
    }

    let resultText, color;
    if (multiplier > 0) {
      const win = Math.floor(amount * multiplier);
      addCoins(message.author.id, message.guild.id, win - amount);
      resultText = `🎉 Kazandın! **${formatCoins(win)}**`;
      color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      resultText = `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`;
      color = "Red";
    }
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(color).setTitle("🎰 Slot Machine")
        .setDescription(`${result.join(" | ")}\n\n${resultText}`).setTimestamp(),
    ]});
  }

  if (command === "coinflip" || command === "cf") {
    const amount = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();
    if (!amount || amount < 1) return message.reply("Örnek: `a!coinflip 100 yazı`");
    if (!choice || (choice !== "yazı" && choice !== "tura")) return message.reply("Yazı veya tura seç! Örnek: `a!coinflip 100 yazı`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const result = Math.random() < 0.5 ? "yazı" : "tura";
    const won    = choice === result;
    if (won) addCoins(message.author.id, message.guild.id, amount);
    else     removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(won ? "Green" : "Red").setTitle("🪙 Coinflip")
        .setDescription(`Sonuç: **${result}** | Seçimin: **${choice}**\n\n${won ? `🎉 Kazandın! **${formatCoins(amount * 2)}**` : `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`}`)
        .setTimestamp(),
    ]});
  }

  if (command === "dice") {
    const amount = parseInt(args[0]);
    const guess  = parseInt(args[1]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!dice 100 3`");
    if (!guess || guess < 1 || guess > 6) return message.reply("1-6 arası tahmin gir! Örnek: `a!dice 100 3`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const result = Math.floor(Math.random() * 6) + 1;
    const won    = guess === result;
    if (won) addCoins(message.author.id, message.guild.id, amount * 5);
    else     removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(won ? "Green" : "Red").setTitle("🎲 Zar Oyunu")
        .setDescription(`Zar: **${result}** | Tahminin: **${guess}**\n\n${won ? `🎉 Kazandın! **${formatCoins(amount * 5)}**` : `😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`}`)
        .setTimestamp(),
    ]});
  }

  if (command === "hunt") {
    const animals = [
      {name:"🐰 Tavşan",value:50},{name:"🦌 Geyik",value:100},
      {name:"🐗 Domuz",value:150},{name:"🐺 Kurt",value:200},
      {name:"🐻 Ayı",value:300},{name:"🦁 Aslan",value:500},
    ];
    if (Math.random() < 0.7) {
      const a = animals[Math.floor(Math.random() * animals.length)];
      addCoins(message.author.id, message.guild.id, a.value);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("🏹 Avlanma Başarılı!").setDescription(`${a.name} yakaladın! **${formatCoins(a.value)}** kazandın.`).setTimestamp()] });
    }
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setTitle("🏹 Avlanma Başarısız!").setDescription("Hiçbir şey yakalayamadın!").setTimestamp()] });
  }

  if (command === "fish") {
    const fishes = [
      {name:"🐟 Küçük Balık",value:30},{name:"🐠 Renkli Balık",value:60},
      {name:"🦈 Köpekbalığı",value:200},{name:"🐋 Balina",value:400},
      {name:"🦑 Ahtapot",value:100},{name:"🦀 Yengeç",value:80},
    ];
    if (Math.random() < 0.8) {
      const f = fishes[Math.floor(Math.random() * fishes.length)];
      addCoins(message.author.id, message.guild.id, f.value);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Blue").setTitle("🎣 Balık Tutma Başarılı!").setDescription(`${f.name} tuttun! **${formatCoins(f.value)}** kazandın.`).setTimestamp()] });
    }
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Gray").setTitle("🎣 Balık Tutma Başarısız!").setDescription("Hiçbir balık tutamadın!").setTimestamp()] });
  }


  if (command === "yaz") {
    const text = args.join(" ");
    if (!text) return message.reply("Ne yazayım?");
    return message.channel.send(text);
  }

  // ── WARN SİSTEMİ ──────────────────────────────────────────────────────────────
  if (command === "warn") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return message.reply("🚫 Warn atma yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi warn atacağım? Birini etiketle. Örnek: `a!warn @üye sebep`");
    if (target.user.bot) return message.reply("Botlara warn atamazsın!");
    const reason = args.slice(1).join(" ");
    if (!reason) return message.reply("Sebep belirt! Örnek: `a!warn @üye kurallara uymadı`");

    const warnKey = `${message.guild.id}_${target.id}`;
    if (!warningsMap.has(warnKey)) warningsMap.set(warnKey, []);
    const warns = warningsMap.get(warnKey);
    warns.push({ id: warns.length + 1, reason, by: message.author.tag, timestamp: Date.now() });
    saveData(warningsFile, warningsMap);

    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle("⚠️ Warn Atıldı")
        .addFields(
          { name: "Kullanıcı", value: target.user.tag, inline: true },
          { name: "Yetkili",   value: message.author.tag, inline: true },
          { name: "Warn #",    value: `${warns.length}`, inline: true },
          { name: "Sebep",     value: reason },
        ).setFooter({ text: `Toplam ${warns.length} warn` }).setTimestamp(),
    ]});
  }

  if (command === "warnings" || command === "warnlist") {
    const target = message.mentions.members.first() || message.member;
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];

    if (warns.length === 0)
      return message.reply(`${target.user.tag} adlı kullanıcının hiç warni yok.`);

    const warnText = warns.map(w => {
      const tarih = new Date(w.timestamp).toLocaleDateString("tr-TR");
      return `**#${w.id}** — ${w.reason}\n↳ *${w.by}* tarafından, ${tarih}`;
    }).join("\n\n");

    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle(`⚠️ ${target.user.tag} — Warn Geçmişi`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .setDescription(warnText)
        .setFooter({ text: `Toplam ${warns.length} warn` }).setTimestamp(),
    ]});
  }

  if (command === "unwarn") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return message.reply("🚫 Warn silme yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimin warnını sileceğim? Birini etiketle.");
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];
    if (warns.length === 0) return message.reply(`${target.user.tag} adlı kullanıcının hiç warni yok.`);

    const sub = args[1]?.toLowerCase();

    if (sub === "all" || sub === "hepsi") {
      warningsMap.set(warnKey, []);
      saveData(warningsFile, warningsMap);
      return message.channel.send({ embeds: [
        new EmbedBuilder().setColor("Green").setTitle("✅ Tüm Warnlar Silindi")
          .setDescription(`${target.user.tag} adlı kullanıcının **${warns.length}** warni silindi.`)
          .setTimestamp(),
      ]});
    }

    const warnNo = parseInt(sub);
    if (!warnNo || warnNo < 1 || warnNo > warns.length)
      return message.reply(`Geçerli bir warn numarası gir (1-${warns.length}). Tümünü silmek için \`all\` yaz.`);

    const removed = warns.splice(warnNo - 1, 1)[0];
    // ID'leri yeniden numaralandır
    warns.forEach((w, i) => { w.id = i + 1; });
    warningsMap.set(warnKey, warns);
    saveData(warningsFile, warningsMap);

    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Warn Silindi")
        .addFields(
          { name: "Kullanıcı", value: target.user.tag, inline: true },
          { name: "Silinen Warn", value: `#${warnNo} — ${removed.reason}`, inline: false },
          { name: "Kalan Warn", value: `${warns.length}`, inline: true },
        ).setTimestamp(),
    ]});
  }

  // ── GİZLİ: KANAL GİR ─────────────────────────────────────────────────────────
  if (command === "kanalagir") {
    if (message.author.id !== message.guild.ownerId) return;

    const channelId = args[0];
    if (!channelId) return message.reply("Kanal ID'si gir. Örnek: `a!kanalagir 123456789`");
    const voiceChannel = message.guild.channels.cache.get(channelId);

    if (!voiceChannel || voiceChannel.type !== 2)
      return message.reply("Geçerli bir ses kanalı ID'si gir. (Kanal bulunamadı veya ses kanalı değil)");

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId:   message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        message.reply(`✅ **${voiceChannel.name}** kanalına bağlandım.`);
      });

      connection.on("error", (err) => {
        console.error("Ses bağlantısı hatası:", err);
        message.reply("❌ Ses kanalına bağlanırken hata oluştu.");
      });
    } catch (err) {
      console.error("kanalagir hatası:", err);
      return message.reply("❌ Bağlanılamadı.");
    }
    return;
  }

  // ── MODERASYON ────────────────────────────────────────────────────────────────
  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply("🚫 Ban yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi banlayayım?");
    if (!target.bannable) return message.reply("🚫 Bu kullanıcıyı banlayamam!");
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    await target.ban({ reason });
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("DarkRed").setTitle("⛔ Kullanıcı Banlandı")
        .addFields({name:"Kullanıcı",value:target.user.tag,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply("🚫 Kick yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi kickleyeyim?");
    if (!target.kickable) return message.reply("🚫 Bu kullanıcıyı kickleyemem!");
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    await target.kick(reason);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle("👢 Kullanıcı Kicklendi")
        .addFields({name:"Kullanıcı",value:target.user.tag,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "temizle" || command === "clear" || command === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("🚫 Mesaj yönetme yetkin yok!");
    const n = parseInt(args[0]);
    if (!n || n < 1 || n > 100) return message.reply("1-100 arası bir sayı gir.");
    try {
      await message.channel.bulkDelete(n + 1, true);
      const msg = await message.channel.send(`✅ **${n}** mesaj silindi.`);
      setTimeout(() => msg.deletable && msg.delete().catch(()=>{}), 3000);
    } catch { return message.reply("❌ 14 günden eski mesajlar toplu silinemez."); }
  }

  if (command === "mute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi mute yapacağım?");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı mute yapamam!");
    const ms = require("ms");
    const süreArg = args[1];
    if (!süreArg) return message.reply("Süre belirt! Örnek: `a!mute @üye 10m`");
    const süreMs = ms(süreArg);
    if (!süreMs || süreMs < 1000 || süreMs > 28*24*60*60*1000) return message.reply("Geçerli süre: 1s — 28d. Örnek: `10m`, `1h`, `1d`");
    const reason = args.slice(2).join(" ") || "Sebep belirtilmedi";
    await target.timeout(süreMs, reason);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Yellow").setTitle("🔇 Kullanıcı Mute Edildi")
        .addFields({name:"Kullanıcı",value:target.user.tag,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Süre",value:süreArg,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "unmute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout kaldırma yetkin yok!");
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimin mute'unu kaldırayım?");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı düzenleyemem!");
    await target.timeout(null);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("🔊 Mute Kaldırıldı")
        .addFields({name:"Kullanıcı",value:target.user.tag,inline:true},{name:"Yetkili",value:message.author.tag,inline:true}).setTimestamp(),
    ]});
  }
});

client.login(process.env.TOKEN);
