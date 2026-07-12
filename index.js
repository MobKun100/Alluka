require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");

const OWNER_ID = "994985345550659614";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
  ],
});

const prefix = "a!";
const fs   = require("fs");
const path = require("path");

// ── Veri dosyaları ─────────────────────────────────────────────────────────────
const dataDir            = "./data";
const userLevelsFile     = path.join(dataDir, "userLevels.json");
const levelChannelsFile  = path.join(dataDir, "levelChannels.json");
const userCoinsFile      = path.join(dataDir, "userCoins.json");
const dailyCooldownsFile = path.join(dataDir, "dailyCooldowns.json");
const workCooldownsFile  = path.join(dataDir, "workCooldowns.json");
const userProfilesFile   = path.join(dataDir, "userProfiles.json");
const userInventoryFile  = path.join(dataDir, "userInventory.json");
const userStatsFile      = path.join(dataDir, "userStats.json");
const warningsFile       = path.join(dataDir, "warnings.json");
const modRolesFile       = path.join(dataDir, "modRoles.json");
const logSettingsFile    = path.join(dataDir, "logSettings.json");
const pkSettingsFile     = path.join(dataDir, "pkSettings.json");
const hbEngelFile        = path.join(dataDir, "hbEngel.json");
const levelRolesFile     = path.join(dataDir, "levelRoles.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) return new Map(JSON.parse(fs.readFileSync(filePath, "utf8")));
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
const modRolesMap    = loadData(modRolesFile);
const logSettingsMap = loadData(logSettingsFile);
const pkSettingsMap  = loadData(pkSettingsFile);
const hbEngelMap     = loadData(hbEngelFile);
const levelRolesMap  = loadData(levelRolesFile);

// RAM-only
const voiceSessions  = new Map();
const inviteCache    = new Map();
const pkTracker      = new Map(); // key: guildId_userId → {deletes,edits,firstTime}

// ── Periyodik kayıt ────────────────────────────────────────────────────────────
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
  saveData(modRolesFile, modRolesMap);
  saveData(logSettingsFile, logSettingsMap);
  saveData(pkSettingsFile, pkSettingsMap);
  saveData(hbEngelFile, hbEngelMap);
  saveData(levelRolesFile, levelRolesMap);
}, 30000);

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
  saveData(modRolesFile, modRolesMap);
  saveData(logSettingsFile, logSettingsMap);
  saveData(pkSettingsFile, pkSettingsMap);
  saveData(hbEngelFile, hbEngelMap);
  saveData(levelRolesFile, levelRolesMap);
}
process.on("SIGINT",  () => { saveAll(); process.exit(0); });
process.on("SIGTERM", () => { saveAll(); process.exit(0); });

// ── Mağaza ürünleri ────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: "color_mavi",      name: "🔵 Mavi",          price: 300,     type: "color",    value: "#3498DB", desc: "Profil embed rengi mavi olur" },
  { id: "color_kirmizi",   name: "🔴 Kırmızı",        price: 300,     type: "color",    value: "#E74C3C", desc: "Profil embed rengi kırmızı olur" },
  { id: "color_yesil",     name: "🟢 Yeşil",          price: 300,     type: "color",    value: "#2ECC71", desc: "Profil embed rengi yeşil olur" },
  { id: "color_mor",       name: "💜 Mor",            price: 500,     type: "color",    value: "#9B59B6", desc: "Profil embed rengi mor olur" },
  { id: "color_turuncu",   name: "🟠 Turuncu",        price: 400,     type: "color",    value: "#E67E22", desc: "Profil embed rengi turuncu olur" },
  { id: "color_pembe",     name: "🩷 Pembe",           price: 500,     type: "color",    value: "#FF69B4", desc: "Profil embed rengi pembe olur" },
  { id: "color_altin",     name: "🟡 Altın",          price: 800,     type: "color",    value: "#FFD700", desc: "Profil embed rengi altın olur" },
  { id: "color_lacivert",  name: "🌊 Lacivert",       price: 600,     type: "color",    value: "#1A237E", desc: "Profil embed rengi lacivert olur" },
  { id: "color_galaksi",   name: "🌌 Galaksi",        price: 2000,    type: "color",    value: "#2C003E", desc: "Nadir — galaksi rengi" },
  { id: "color_alev",      name: "🔥 Alev",           price: 1500,    type: "color",    value: "#FF4500", desc: "Nadir — alev rengi" },
  { id: "badge_yildiz",    name: "⭐ Yıldız Rozeti",  price: 200,     type: "badge",    value: "⭐",      desc: "Profilde yıldız rozeti gösterilir" },
  { id: "badge_kalp",      name: "❤️ Kalp Rozeti",    price: 200,     type: "badge",    value: "❤️",     desc: "Profilde kalp rozeti gösterilir" },
  { id: "badge_ates",      name: "🔥 Ateş Rozeti",    price: 400,     type: "badge",    value: "🔥",      desc: "Profilde ateş rozeti gösterilir" },
  { id: "badge_tac",       name: "👑 Taç Rozeti",     price: 1500,    type: "badge",    value: "👑",      desc: "Nadir — taç rozeti" },
  { id: "badge_elmas",     name: "💎 Elmas Rozeti",   price: 2500,    type: "badge",    value: "💎",      desc: "Ultra nadir — elmas rozeti" },
  { id: "badge_simsek",    name: "⚡ Şimşek Rozeti",  price: 700,     type: "badge",    value: "⚡",      desc: "Profilde şimşek rozeti gösterilir" },
  { id: "badge_muzik",     name: "🎵 Müzik Rozeti",   price: 500,     type: "badge",    value: "🎵",      desc: "Profilde müzik rozeti gösterilir" },
  { id: "badge_oyun",      name: "🎮 Oyuncu Rozeti",  price: 500,     type: "badge",    value: "🎮",      desc: "Profilde oyuncu rozeti gösterilir" },
  { id: "bio_unlock",      name: "📝 Bio Kilidi",     price: 250,     type: "bio",      value: true,      desc: "Profiline özel bio (tanıtım yazısı) ekleyebilirsin" },
  { id: "ozel_rol",        name: "✨ Özel Rol",        price: 1000000, type: "ozel_rol", value: true,      desc: "Sana özel isim ve renkle bir rol oluşturulur!" },
];

function getShopItem(id) { return SHOP_ITEMS.find(i => i.id === id); }

// ── Emoji yardımcısı ───────────────────────────────────────────────────────────
function getEmoji(name, fallback = "") {
  const emoji = client.emojis.cache.find(e => e.name === name);
  return emoji ? emoji.toString() : fallback;
}

// ── Profil yardımcıları ───────────────────────────────────────────────────────
function getProfile(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userProfiles.has(key)) userProfiles.set(key, { color: "#5865F2", badges: [], activeBadge: "", bio: "" });
  return userProfiles.get(key);
}
function getInventory(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userInventory.has(key)) userInventory.set(key, []);
  return userInventory.get(key);
}
function hasItem(userId, guildId, itemId) { return getInventory(userId, guildId).includes(itemId); }

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
  const d = new Date(ts), day = d.getDay(), diff = (day === 0 ? -6 : 1 - day);
  d.setHours(0,0,0,0); d.setDate(d.getDate() + diff); return d.getTime();
}
function getMonthStart(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function checkAndResetStats(stats) {
  const now = Date.now();
  if (stats.weekly.periodStart  < getWeekStart(now))  stats.weekly  = { messages: 0, voiceMinutes: 0, periodStart: getWeekStart(now) };
  if (stats.monthly.periodStart < getMonthStart(now)) stats.monthly = { messages: 0, voiceMinutes: 0, periodStart: getMonthStart(now) };
}
function addMessageStat(userId, guildId) {
  const stats = getStats(userId, guildId); checkAndResetStats(stats);
  stats.weekly.messages++; stats.monthly.messages++;
}
function addVoiceMinutes(userId, guildId, minutes) {
  const stats = getStats(userId, guildId); checkAndResetStats(stats);
  stats.weekly.voiceMinutes += minutes; stats.monthly.voiceMinutes += minutes;
}
function formatDuration(minutes) {
  if (minutes < 1)  return "< 1 dakika";
  if (minutes < 60) return `${Math.floor(minutes)} dakika`;
  const h = Math.floor(minutes/60), m = Math.floor(minutes%60);
  return m > 0 ? `${h} saat ${m} dakika` : `${h} saat`;
}

// ── Coin yardımcıları ─────────────────────────────────────────────────────────
function getCoins(userId, guildId)         { return userCoinsMap.get(`${guildId}_${userId}`) || 0; }
function setCoins(userId, guildId, amount) { userCoinsMap.set(`${guildId}_${userId}`, Math.max(0, amount)); }
function addCoins(userId, guildId, amt)    { const k=`${guildId}_${userId}`; userCoinsMap.set(k,(userCoinsMap.get(k)||0)+amt); }
function removeCoins(userId, guildId, amt) { const k=`${guildId}_${userId}`; const c=userCoinsMap.get(k)||0; userCoinsMap.set(k,Math.max(0,c-amt)); return c>=amt; }
function formatCoins(n) { return `${n.toLocaleString("tr-TR")} HB`; }

// ── Cooldown yardımcıları ─────────────────────────────────────────────────────
function getCooldown(map, userId, guildId) { return map.get(`${guildId}_${userId}`) || 0; }
function setCooldown(map, userId, guildId, dur) { map.set(`${guildId}_${userId}`, Date.now() + dur); }
function formatTime(ms) {
  const s=Math.floor(ms/1000), m=Math.floor(s/60), h=Math.floor(m/60);
  if (h>0) return `${h}s ${m%60}d`; if (m>0) return `${m}d ${s%60}s`; return `${s}s`;
}

// ── HB engel kontrolü ─────────────────────────────────────────────────────────
function isHbEngel(guildId, channelId) {
  const channels = hbEngelMap.get(guildId) || [];
  return channels.includes(channelId);
}

// ── XP & Seviye rol sistemi ───────────────────────────────────────────────────
function addXP(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userLevels.has(key)) userLevels.set(key, { xp: 0, level: 1 });
  const ud = userLevels.get(key);
  ud.xp += Math.floor(Math.random() * 15) + 5;
  if (ud.xp >= ud.level * 100) {
    ud.level++; ud.xp = 0;
    const levelRewards = {};
    for (let i = 1; i <= 50; i++) levelRewards[i] = i * 100;
    addCoins(userId, guildId, levelRewards[ud.level] || 0);
    return true;
  }
  return false;
}

async function sendLevelUpMessage(member, newLevel, coinReward) {
  const channelId = levelChannels.get(member.guild.id);
  if (channelId) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      const gem = getEmoji("diamond", "💎");
      channel.send({ content: `${member}`, embeds: [
        new EmbedBuilder().setColor("Gold").setTitle("🎉 Tebrikler, Seviye Atladın!")
          .setDescription(`${member} tebrikler! Artık **${newLevel}. seviye**sin! 🚀\n\n${gem} Ödül olarak **${coinReward.toLocaleString()} HB** kazandın!`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "👤 Kullanıcı", value: member.user.tag, inline: true },
            { name: "⭐ Yeni Seviye", value: `${newLevel}`, inline: true },
            { name: "💰 Ödül", value: `${coinReward.toLocaleString()} HB`, inline: true },
          ).setFooter({ text: "Mesaj atmaya devam et, daha fazla seviye kazan!" }).setTimestamp(),
      ]}).catch(() => {});
    }
  }
  // Seviye rolü ver
  try {
    const levelRoles = levelRolesMap.get(member.guild.id) || {};
    const roleId = levelRoles[String(newLevel)];
    if (roleId) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) await member.roles.add(role).catch(() => {});
    }
  } catch {}
}

// ── Mod rol yardımcısı ────────────────────────────────────────────────────────
function hasModPerm(member, command, fallbackPerm) {
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  const guildRoles = modRolesMap.get(member.guild.id) || {};
  const roleId = guildRoles[command];
  if (roleId) return member.roles.cache.has(roleId);
  if (fallbackPerm) return member.permissions.has(fallbackPerm);
  return false;
}

// ── Log yardımcısı ────────────────────────────────────────────────────────────
function getLogSettings(guildId) {
  if (!logSettingsMap.has(guildId))
    logSettingsMap.set(guildId, {
      ses:   { enabled: false, channelId: null },
      davet: { enabled: false, channelId: null },
      mesaj: { enabled: false, channelId: null },
    });
  return logSettingsMap.get(guildId);
}
function sendLog(guild, type, embed) {
  const cfg = getLogSettings(guild.id)[type];
  if (!cfg?.enabled || !cfg.channelId) return;
  const channel = guild.channels.cache.get(cfg.channelId);
  if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

// ── Kullanıcı çözümleyici ─────────────────────────────────────────────────────
async function resolveUser(message, args) {
  const mention = message.mentions.members.first();
  if (mention) return mention;
  if (args[0]) { try { return await message.guild.members.fetch(args[0]); } catch {} }
  return null;
}

// ── PK Tracker ────────────────────────────────────────────────────────────────
const PK_WINDOW = 5 * 60 * 1000; // 5 dakika
const PK_LIMIT  = 3;

function trackPkAction(guild, userId, type) {
  if (!pkSettingsMap.get(guild.id)?.enabled) return;
  const key = `${guild.id}_${userId}`;
  const now = Date.now();
  let data = pkTracker.get(key) || { deletes: 0, edits: 0, firstTime: now };
  if (now - data.firstTime > PK_WINDOW) {
    data = { deletes: 0, edits: 0, firstTime: now };
  }
  data[type]++;
  pkTracker.set(key, data);

  const total = data.deletes + data.edits;
  if (total >= PK_LIMIT) {
    pkTracker.delete(key);
    guild.members.fetch(userId).then(member => {
      if (!member) return;
      member.ban({ reason: `[PK] 5 dakika içinde ${total} kanal silme/düzenleme işlemi yapıldı.` })
        .catch(() => {});
    }).catch(() => {});
  }
}

// ── Express ────────────────────────────────────────────────────────────────────
const express = require("express");
const app = express();
app.get("/", (_, res) => res.sendStatus(200));
app.listen(5000, () => console.log("Web sunucusu 5000 portunda çalışıyor."));

// ── Hazır ─────────────────────────────────────────────────────────────────────
client.on("ready", async () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
    } catch {}
  }
});

// ── PK: Kanal silindi ─────────────────────────────────────────────────────────
client.on("channelDelete", async (channel) => {
  if (!channel.guild) return;
  try {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }); // CHANNEL_DELETE = 12
    const entry = auditLogs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    trackPkAction(channel.guild, entry.executor.id, "deletes");
  } catch {}
});

// ── PK: Kanal düzenlendi ──────────────────────────────────────────────────────
client.on("channelUpdate", async (oldChannel, newChannel) => {
  if (!newChannel.guild) return;
  try {
    const auditLogs = await newChannel.guild.fetchAuditLogs({ type: 11, limit: 1 }); // CHANNEL_UPDATE = 11
    const entry = auditLogs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    trackPkAction(newChannel.guild, entry.executor.id, "edits");
  } catch {}
});

// ── Ses log & stat ────────────────────────────────────────────────────────────
client.on("voiceStateUpdate", (oldState, newState) => {
  const userId = newState.member?.id || oldState.member?.id;
  const guild  = newState.guild || oldState.guild;
  if (!userId) return;
  const member = newState.member || oldState.member;
  if (member?.user?.bot) return;
  const key = `${guild.id}_${userId}`;
  const joined = !oldState.channelId && newState.channelId;
  const left   = oldState.channelId && !newState.channelId;
  const moved  = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

  if (joined) {
    voiceSessions.set(key, Date.now());
    sendLog(guild, "ses", new EmbedBuilder().setColor("Green").setTitle("🔊 Ses Kanalına Katıldı")
      .addFields(
        { name: "Kullanıcı", value: `${member.user.tag} (<@${userId}>)`, inline: true },
        { name: "Kanal", value: newState.channel?.name || "?", inline: true },
      ).setFooter({ text: `ID: ${userId}` }).setTimestamp());
  } else if (left) {
    const joinTime = voiceSessions.get(key);
    if (joinTime) { const min = (Date.now()-joinTime)/60000; if (min>0) addVoiceMinutes(userId,guild.id,min); voiceSessions.delete(key); }
    sendLog(guild, "ses", new EmbedBuilder().setColor("Red").setTitle("🔇 Ses Kanalından Çıktı")
      .addFields(
        { name: "Kullanıcı", value: `${member.user.tag} (<@${userId}>)`, inline: true },
        { name: "Kanal", value: oldState.channel?.name || "?", inline: true },
      ).setFooter({ text: `ID: ${userId}` }).setTimestamp());
  } else if (moved) {
    if (!voiceSessions.has(key)) voiceSessions.set(key, Date.now());
    sendLog(guild, "ses", new EmbedBuilder().setColor("Blue").setTitle("🔀 Ses Kanalı Değiştirdi")
      .addFields(
        { name: "Kullanıcı", value: `${member.user.tag} (<@${userId}>)`, inline: true },
        { name: "Eski Kanal", value: oldState.channel?.name || "?", inline: true },
        { name: "Yeni Kanal", value: newState.channel?.name || "?", inline: true },
      ).setFooter({ text: `ID: ${userId}` }).setTimestamp());
  }
});

// ── Davet log — katılım ───────────────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;
  let usedInvite = null;
  try {
    const newInvites = await guild.invites.fetch();
    const cached = inviteCache.get(guild.id) || new Map();
    usedInvite = newInvites.find(i => (cached.get(i.code)||0) < i.uses);
    inviteCache.set(guild.id, new Map(newInvites.map(i => [i.code, i.uses])));
  } catch {}
  const inviteInfo = usedInvite
    ? `**${usedInvite.code}** (davet eden: ${usedInvite.inviter?.tag || "Bilinmiyor"}, ${usedInvite.uses} kullanım)`
    : "Bilinmiyor";
  sendLog(guild, "davet", new EmbedBuilder().setColor("Green").setTitle("📥 Üye Katıldı")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "Kullanıcı", value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: "Hesap Oluşturma", value: member.user.createdAt.toLocaleDateString("tr-TR"), inline: true },
      { name: "Davet", value: inviteInfo, inline: false },
    ).setFooter({ text: `ID: ${member.id} • Toplam Üye: ${guild.memberCount}` }).setTimestamp());
});

// ── Davet log — ayrılış ───────────────────────────────────────────────────────
client.on("guildMemberRemove", (member) => {
  sendLog(member.guild, "davet", new EmbedBuilder().setColor("Red").setTitle("📤 Üye Ayrıldı")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "Kullanıcı", value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: "Katılım Tarihi", value: member.joinedAt?.toLocaleDateString("tr-TR") || "Bilinmiyor", inline: true },
    ).setFooter({ text: `ID: ${member.id} • Toplam Üye: ${member.guild.memberCount}` }).setTimestamp());
});

// ── Mesaj log — düzenleme ─────────────────────────────────────────────────────
client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
  sendLog(oldMsg.guild, "mesaj", new EmbedBuilder().setColor("Yellow").setTitle("✏️ Mesaj Düzenlendi")
    .addFields(
      { name: "Kullanıcı", value: `${oldMsg.author?.tag || "?"} (<@${oldMsg.author?.id}>)`, inline: true },
      { name: "Kanal", value: `<#${oldMsg.channelId}>`, inline: true },
      { name: "Önceki Mesaj", value: (oldMsg.content || "*boş*").slice(0,1024), inline: false },
      { name: "Yeni Mesaj",   value: (newMsg.content || "*boş*").slice(0,1024), inline: false },
    ).setFooter({ text: `Mesaj ID: ${oldMsg.id}` }).setTimestamp());
});

// ── Mesaj log — silme ─────────────────────────────────────────────────────────
client.on("messageDelete", (msg) => {
  if (!msg.guild || msg.author?.bot) return;
  sendLog(msg.guild, "mesaj", new EmbedBuilder().setColor("Red").setTitle("🗑️ Mesaj Silindi")
    .addFields(
      { name: "Kullanıcı", value: msg.author ? `${msg.author.tag} (<@${msg.author.id}>)` : "Bilinmiyor", inline: true },
      { name: "Kanal", value: `<#${msg.channelId}>`, inline: true },
      { name: "Silinen Mesaj", value: (msg.content || "*içerik yok*").slice(0,1024), inline: false },
    ).setFooter({ text: `Mesaj ID: ${msg.id}` }).setTimestamp());
});

// ── Ana mesaj dinleyicisi ─────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const key = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(key).level;
    const coinReward = newLevel * 50;
    addCoins(message.author.id, message.guild.id, coinReward);
    await sendLevelUpMessage(message.member, newLevel, coinReward);
  }
  addMessageStat(message.author.id, message.guild.id);
  if (Math.random() < 0.05) addCoins(message.author.id, message.guild.id, Math.floor(Math.random()*10)+1);

  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();
    if (msg === "sa")           return message.reply("as hg knk");
    if (msg === "selam")        return message.reply("selam canım nasılsın?");
    if (msg === "günaydın")     return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler")  return message.reply("tatlı rüyalar 😴");
    if (msg === "bot")          return message.reply(`evet ben botum, yapımcım axel_ey 👑 ${getEmoji("crown","")}`);
    return;
  }

  const args    = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // ── YARDIM ─────────────────────────────────────────────────────────────────
  if (command === "yardım" || command === "yardim" || command === "help") {
    const coin = getEmoji("coin", "💰");
    const embed = new EmbedBuilder().setColor("#FF6B6B").setTitle("🎮 Bot Komut Rehberi")
      .setDescription(`**Tüm komutlar kategorilere göre ayrılmıştır!** ${coin}`)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "🛡️ **MODERASYON**", value: [
          "`a!ban @üye/ID [sebep]` • Banlar",
          "`a!kick @üye/ID [sebep]` • Atar",
          "`a!temizle <1-100>` • Mesaj siler",
          "`a!mute @üye/ID <süre> [sebep]` • Susturur",
          "`a!unmute @üye/ID` • Susturmayı kaldırır",
          "`a!warn @üye/ID <sebep>` • Warn atar",
          "`a!warnings [@üye/ID]` • Warn listesi",
          "`a!unwarn @üye/ID <#|all>` • Warn siler",
        ].join("\n"), inline: false },
        { name: "⚙️ **SİSTEM AYARLARI** *(Admin)*", value: [
          "`a!pk aç/kapat` • Patlama koruma",
          "`a!hbengel aç/kapat` • Bu kanalda HB engeli",
          "`a!seviyerol @rol <seviye>` • Seviyeye rol ata",
          "`a!seviyeroller` • Seviye rollerini göster",
          "`a!rololustur <isim> <#renk>` • Sunucuya rol oluştur",
          "`a!warnrol/banrol/kickrol/muterol/temizlerol @rol` • Mod rolleri",
          "`a!modroller` • Mod rollerini göster",
        ].join("\n"), inline: false },
        { name: "📋 **LOG SİSTEMİ** *(Admin)*", value: [
          "`a!logayarla ses/davet/mesaj #kanal`",
          "`a!logkapat ses/davet/mesaj`",
          "`a!logac ses/davet/mesaj`",
          "`a!logdurum`",
        ].join("\n"), inline: false },
        { name: "👤 **PROFİL & MAĞAZA**", value: [
          "`a!profil [@üye]` • Profili gösterir",
          "`a!profilayarla renk/rozet/bio <değer>`",
          "`a!shop` • Mağaza",
          "`a!satinal <ürün_id>` • Satın al",
          "`a!envanter` • Envanter",
        ].join("\n"), inline: false },
        { name: "📊 **İSTATİSTİK**", value: [
          "`a!istatistik [@üye]` • Haftalık/aylık",
          "`a!level [@üye]` • Level & XP",
          "`a!leaderboard` • Sıralama",
          "`a!sunucubilgi` • Sunucu bilgileri",
          "`a!avatar [@üye]` • Avatar",
        ].join("\n"), inline: false },
        { name: "💰 **EKONOMİ**", value: [
          "`a!bakiye [@üye]` • Bakiye",
          "`a!hbver @üye <miktar>` • Transfer",
          "`a!daily` • Günlük ödül",
          "`a!work` • Çalış",
        ].join("\n"), inline: false },
        { name: "🎰 **OYUNLAR**", value: [
          "`a!slot <miktar>` • Slot",
          "`a!coinflip <miktar> <yazı/tura>` • Yazı tura",
          "`a!dice <miktar> <1-6>` • Zar (5x)",
          "`a!hunt` • Avlanma (%70)",
          "`a!fish` • Balık (%80)",
          "`a!rob @üye` • Soy (%35 şans)",
          "`a!roulette <miktar> <kırmızı/siyah/yeşil>` • Rulet",
          "`a!blackjack <miktar>` • Blackjack",
          "`a!sans <miktar>` • Şans çarkı",
        ].join("\n"), inline: false },
        { name: "⚙️ **GENEL**", value: ["`a!ping` • Gecikme", "`a!yardım` • Bu menü"].join("\n"), inline: false },
      )
      .setFooter({ text: `${message.guild.name} • Yapımcı: axel_ey 👑`, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ── PING ───────────────────────────────────────────────────────────────────
  if (command === "ping") {
    return message.reply({ embeds: [new EmbedBuilder().setColor("Green")
      .setDescription(`🏓 Gecikme: **${Date.now()-message.createdTimestamp}ms** | WebSocket: **${client.ws.ping}ms**`)] });
  }

  // ── LEVEL ──────────────────────────────────────────────────────────────────
  if (command === "level" || command === "xp") {
    const target = message.mentions.members.first() || message.member;
    const key    = `${message.guild.id}_${target.id}`;
    const ud     = userLevels.get(key) || { xp: 0, level: 1 };
    const reqXP  = ud.level * 100;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color || "Purple")
        .setTitle("📊 Level Bilgisi")
        .addFields(
          { name: "Level",    value: `${ud.level}`,        inline: true },
          { name: "XP",       value: `${ud.xp}/${reqXP}`, inline: true },
          { name: "Eksik XP", value: `${reqXP-ud.xp}`,    inline: true },
        ).setThumbnail(target.user.displayAvatarURL({ dynamic: true })).setTimestamp(),
    ]});
  }

  if (command === "levelkanal" || command === "seviyekanal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply("🚫 Kanal yönetme yetkin yok!");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply("Bir kanal etiketle!");
    levelChannels.set(message.guild.id, ch.id);
    saveData(levelChannelsFile, levelChannels);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Seviye Kanalı Ayarlandı")
        .setDescription(`Tebrik mesajları artık ${ch} kanalına gönderilecek!`).setTimestamp(),
    ]});
  }

  // ── SEVİYE ROL SİSTEMİ ─────────────────────────────────────────────────────
  if (command === "seviyerol") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const role  = message.mentions.roles.first();
    const level = parseInt(args[1]);
    if (!role || !level || level < 1)
      return message.reply("Kullanım: `a!seviyerol @rol <seviye>`\nÖrnek: `a!seviyerol @Aktif 5`");
    const guildRoles = levelRolesMap.get(message.guild.id) || {};
    guildRoles[String(level)] = role.id;
    levelRolesMap.set(message.guild.id, guildRoles);
    saveData(levelRolesFile, levelRolesMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Seviye Rolü Ayarlandı")
        .setDescription(`**${level}. seviye**ye ulaşan herkese ${role} rolü verilecek!`).setTimestamp(),
    ]});
  }

  if (command === "seviyeroller") {
    const guildRoles = levelRolesMap.get(message.guild.id) || {};
    const entries = Object.entries(guildRoles);
    if (entries.length === 0) return message.reply("Henüz seviye rolü ayarlanmamış. `a!seviyerol @rol <seviye>` kullan.");
    entries.sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
    const lines = entries.map(([lvl,rId]) => `**Seviye ${lvl}** → <@&${rId}>`).join("\n");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#5865F2").setTitle("📋 Seviye Rolleri").setDescription(lines).setTimestamp(),
    ]});
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (command === "leaderboard" || command === "lb" || command === "sıralama") {
    const guildId = message.guild.id;
    const lvlData = [], coinData = [];
    for (const [k, d] of userLevels.entries()) {
      if (!k.startsWith(guildId+"_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); lvlData.push({ username: u.username, level: d.level, xp: d.xp }); } catch {}
    }
    for (const [k, coins] of userCoinsMap.entries()) {
      if (!k.startsWith(guildId+"_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); coinData.push({ username: u.username, coins }); } catch {}
    }
    lvlData.sort((a,b) => b.level!==a.level ? b.level-a.level : b.xp-a.xp);
    coinData.sort((a,b) => b.coins-a.coins);
    const medal = i => i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("🏆 Liderlik Tablosu")
        .addFields(
          { name: "📊 Level", value: lvlData.slice(0,10).map((u,i)=>`${medal(i)} **${u.username}** — Level ${u.level} (${u.xp} XP)`).join("\n") || "Henüz veri yok", inline: false },
          { name: "💰 Hunter Bucks", value: coinData.slice(0,10).map((u,i)=>`${medal(i)} **${u.username}** — ${formatCoins(u.coins)}`).join("\n") || "Henüz veri yok", inline: false },
        ).setFooter({ text: message.guild.name }).setTimestamp(),
    ]});
  }

  // ── EKONOMİ ────────────────────────────────────────────────────────────────
  const econCommands = ["bakiye","balance","bal","hbver","transfer","daily","work"];
  if (econCommands.includes(command) && isHbEngel(message.guild.id, message.channel.id)) {
    return message.reply("🚫 Bu kanalda ekonomi komutları devre dışı!");
  }

  if (command === "bakiye" || command === "balance" || command === "bal") {
    const target = message.mentions.members.first() || message.member;
    const coin = getEmoji("coin", "💰");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle(`${coin} Hunter Bucks Bakiye`)
        .setDescription(`${target.user.tag} adlı kullanıcının bakiyesi: **${formatCoins(getCoins(target.id, message.guild.id))}**`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true })).setTimestamp(),
    ]});
  }

  if (command === "hbver" || command === "transfer") {
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kime HB gönderayım? Birini etiketle.");
    if (target.id === message.author.id) return message.reply("Kendine HB gönderemezsin!");
    if (target.user.bot) return message.reply("Botlara HB gönderilemez!");
    const miktar = parseInt(args[1]);
    if (!miktar || miktar < 1) return message.reply("Geçerli bir miktar gir.");
    const senderBal = getCoins(message.author.id, message.guild.id);
    if (senderBal < miktar) return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(senderBal)}**`);
    removeCoins(message.author.id, message.guild.id, miktar);
    addCoins(target.id, message.guild.id, miktar);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("💸 HB Transfer Edildi")
        .addFields(
          { name: "Gönderen", value: message.author.tag, inline: true },
          { name: "Alan", value: target.user.tag, inline: true },
          { name: "Miktar", value: formatCoins(miktar), inline: true },
          { name: "Yeni Bakiyen", value: formatCoins(senderBal-miktar), inline: true },
        ).setTimestamp(),
    ]});
  }

  if (command === "daily") {
    const cd = getCooldown(dailyCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd-Date.now())}** sonra tekrar dene.`);
    const amount = Math.floor(Math.random()*500)+100;
    addCoins(message.author.id, message.guild.id, amount);
    setCooldown(dailyCooldowns, message.author.id, message.guild.id, 24*60*60*1000);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("🎁 Günlük Ödül!")
        .setDescription(`Günlük ödülün: **${formatCoins(amount)}**`)
        .setFooter({ text: "24 saat sonra tekrar gelebilirsin!" }).setTimestamp(),
    ]});
  }

  if (command === "work") {
    const cd = getCooldown(workCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd-Date.now())}** sonra tekrar çalışabilirsin.`);
    const works = ["🍕 Pizza dağıttın","💻 Kod yazdın","🚗 Uber sürücüsü oldun","📚 Ders verdin","🎵 Müzik yaptın","🎨 Tasarım yaptın","📱 Uygulama geliştirdin","🎮 Oyun test ettin","🏪 Kasiyerlik yaptın","🧹 Temizlik yaptın"];
    const work   = works[Math.floor(Math.random()*works.length)];
    const earned = Math.floor(Math.random()*150)+50;
    addCoins(message.author.id, message.guild.id, earned);
    setCooldown(workCooldowns, message.author.id, message.guild.id, 60*60*1000);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue").setTitle("💼 Çalışma Tamamlandı!")
        .setDescription(`${work} ve **${formatCoins(earned)}** kazandın!`)
        .setFooter({ text: "1 saat sonra tekrar çalışabilirsin!" }).setTimestamp(),
    ]});
  }

  // ── HB AYARLA (sadece owner) ───────────────────────────────────────────────
  if (command === "hbayarla") {
    if (message.author.id !== OWNER_ID) return;
    const target = message.mentions.members.first() || await (async() => { try { return await message.guild.members.fetch(args[0]); } catch {} return null; })();
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const miktar = parseInt(message.mentions.users.size > 0 ? args[1] : args[1]);
    if (isNaN(miktar) || miktar < 0) return message.reply("Geçerli bir miktar gir.");
    setCoins(target.id, message.guild.id, miktar);
    saveData(userCoinsFile, userCoinsMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("✅ HB Ayarlandı")
        .setDescription(`${target.user.tag} kullanıcısının bakiyesi **${formatCoins(miktar)}** olarak ayarlandı.`).setTimestamp(),
    ]});
  }

  // ── MAĞAZA ─────────────────────────────────────────────────────────────────
  if (command === "shop" || command === "mağaza" || command === "magaza") {
    const colors   = SHOP_ITEMS.filter(i=>i.type==="color");
    const badges   = SHOP_ITEMS.filter(i=>i.type==="badge");
    const specials = SHOP_ITEMS.filter(i=>i.type==="bio"||i.type==="ozel_rol");
    const gem = getEmoji("diamond","💎");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#FFD700").setTitle(`🛒 Hunter Bucks Mağazası ${gem}`)
        .setDescription("Satın almak için: `a!satinal <ürün_id>`\nSahip olduklarını görmek için: `a!envanter`")
        .addFields(
          { name: "🎨 Profil Renkleri", value: colors.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"), inline: false },
          { name: "🏅 Rozetler",        value: badges.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"), inline: false },
          { name: "✨ Özel",            value: specials.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**\n↳ ${i.desc}`).join("\n"), inline: false },
        ).setFooter({ text: `Bakiyen: ${formatCoins(getCoins(message.author.id, message.guild.id))}` }).setTimestamp(),
    ]});
  }

  if (command === "satinal") {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply("Hangi ürünü almak istiyorsun? `a!shop` ile ürünlere bak.");
    const item = getShopItem(itemId);
    if (!item) return message.reply(`❌ \`${itemId}\` adlı ürün bulunamadı.`);

    // Özel rol akışı
    if (item.type === "ozel_rol") {
      if (hasItem(message.author.id, message.guild.id, itemId))
        return message.reply("Zaten özel rolüne sahipsin!");
      const bal = getCoins(message.author.id, message.guild.id);
      if (bal < item.price)
        return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`);

      const promptMsg = await message.channel.send({ embeds: [
        new EmbedBuilder().setColor("#FFD700").setTitle("✨ Özel Rol Oluşturuluyor")
          .setDescription(`${message.author} rolünün adı ne olsun? *(30 saniye içinde yaz)*`).setTimestamp(),
      ]});

      const nameFilter = m => m.author.id === message.author.id;
      const nameColl = await message.channel.awaitMessages({ filter: nameFilter, max: 1, time: 30000, errors: ["time"] }).catch(() => null);
      if (!nameColl || nameColl.size === 0) return promptMsg.edit({ content: "⏰ Süre doldu.", embeds: [] });
      const roleName = nameColl.first().content.slice(0,50);

      const ROLE_COLORS = {
        "kırmızı": "#E74C3C", "mavi": "#3498DB", "yeşil": "#2ECC71",
        "sarı": "#FFD700", "mor": "#9B59B6", "turuncu": "#E67E22",
        "pembe": "#FF69B4", "siyah": "#23272A", "beyaz": "#ECEFF1",
        "turkuaz": "#1ABC9C", "lacivert": "#1A237E", "gri": "#95A5A6",
      };
      const colorList = Object.keys(ROLE_COLORS).join(", ");
      await message.channel.send({ embeds: [
        new EmbedBuilder().setColor("#FFD700")
          .setDescription(`Rol adı: **${roleName}**\n\nHangi renk? Şu renklerden birini yaz:\n${colorList}`),
      ]});
      const colorColl = await message.channel.awaitMessages({ filter: nameFilter, max: 1, time: 30000, errors: ["time"] }).catch(() => null);
      if (!colorColl || colorColl.size === 0) return message.channel.send("⏰ Süre doldu, satın alma iptal edildi.");
      const colorKey = colorColl.first().content.toLowerCase().trim();
      const colorHex = ROLE_COLORS[colorKey];
      if (!colorHex) return message.channel.send(`❌ \`${colorKey}\` geçerli bir renk değil. Satın alma iptal edildi.`);

      try {
        const newRole = await message.guild.roles.create({ name: roleName, color: colorHex, reason: `Özel rol — ${message.author.tag}` });
        await message.member.roles.add(newRole);
        removeCoins(message.author.id, message.guild.id, item.price);
        getInventory(message.author.id, message.guild.id).push(itemId);
        saveData(userInventoryFile, userInventory);
        return message.channel.send({ embeds: [
          new EmbedBuilder().setColor(colorHex).setTitle("✨ Özel Rol Oluşturuldu!")
            .setDescription(`${message.author} artık **${roleName}** rolüne sahip! Renk: \`${colorHex}\``)
            .setFooter({ text: `${formatCoins(item.price)} harcandı.` }).setTimestamp(),
        ]});
      } catch {
        return message.channel.send("❌ Rol oluşturulamadı. Botun yeterli yetkisi var mı?");
      }
    }

    if (hasItem(message.author.id, message.guild.id, itemId))
      return message.reply("Bu ürüne zaten sahipsin!");
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
          { name: "Kalan Bakiye", value: formatCoins(bal-item.price), inline: true },
        ).setFooter({ text: "Kullanmak için: a!profilayarla" }).setTimestamp(),
    ]});
  }

  if (command === "envanter") {
    const target = message.mentions.members.first() || message.member;
    const inv    = getInventory(target.id, message.guild.id);
    if (inv.length === 0) return message.reply(`${target.user.tag} adlı kullanıcının envanteri boş.`);
    const grouped = { color: [], badge: [], bio: [], ozel_rol: [] };
    for (const id of inv) { const item = getShopItem(id); if (item) grouped[item.type]?.push(item); }
    const fields = [];
    if (grouped.color.length)    fields.push({ name: "🎨 Renkler",  value: grouped.color.map(i=>`${i.name} (\`${i.id}\`)`).join("\n"),  inline: false });
    if (grouped.badge.length)    fields.push({ name: "🏅 Rozetler", value: grouped.badge.map(i=>`${i.name} (\`${i.id}\`)`).join("\n"),  inline: false });
    if (grouped.bio.length)      fields.push({ name: "✨ Özel",     value: grouped.bio.map(i=>i.name).join("\n"),                         inline: false });
    if (grouped.ozel_rol.length) fields.push({ name: "👑 Özel Rol", value: "Özel rolüne sahipsin!",                                       inline: false });
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
    if (!sub) return message.reply(["`a!profilayarla renk <renk_id>`", "`a!profilayarla rozet <rozet_id>`", "`a!profilayarla bio <metin>`"].join("\n"));
    if (sub === "renk" || sub === "color") {
      const itemId = val.toLowerCase();
      if (!itemId) return message.reply("Hangi rengi aktif etmek istiyorsun?");
      if (!inv.includes(itemId)) return message.reply(`Bu rengi henüz almadın! Almak için: \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "color") return message.reply("Geçerli bir renk ID'si gir.");
      prof.color = item.value; saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Profil rengin **${item.name}** olarak ayarlandı!`);
    }
    if (sub === "rozet" || sub === "badge") {
      const itemId = val.toLowerCase();
      if (!itemId) return message.reply("Hangi rozeti aktif etmek istiyorsun?");
      if (itemId === "kaldır" || itemId === "kaldir") { prof.activeBadge = ""; saveData(userProfilesFile, userProfiles); return message.reply("✅ Aktif rozet kaldırıldı."); }
      if (!inv.includes(itemId)) return message.reply(`Bu rozeti henüz almadın! Almak için: \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "badge") return message.reply("Geçerli bir rozet ID'si gir.");
      prof.activeBadge = item.value; saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Aktif rozetin **${item.name}** olarak ayarlandı!`);
    }
    if (sub === "bio") {
      if (!inv.includes("bio_unlock")) return message.reply("Bio özelliğini açmak için önce `a!satinal bio_unlock` ile Bio Kilidini satın al!");
      if (!val) return message.reply("Bio metni gir.");
      if (val.length > 100) return message.reply("Bio en fazla 100 karakter olabilir!");
      prof.bio = val; saveData(userProfilesFile, userProfiles);
      return message.reply("✅ Bio'n başarıyla güncellendi!");
    }
    return message.reply("Geçerli seçenekler: `renk`, `rozet`, `bio`");
  }

  // ── PROFİL ────────────────────────────────────────────────────────────────
  if (command === "profil") {
    const target  = message.mentions.members.first() || message.member;
    const key     = `${message.guild.id}_${target.id}`;
    const ud      = userLevels.get(key) || { xp: 0, level: 1 };
    const coins   = getCoins(target.id, message.guild.id);
    const prof    = getProfile(target.id, message.guild.id);
    const inv     = getInventory(target.id, message.guild.id);
    const colorItems = inv.filter(id=>getShopItem(id)?.type==="color").length;
    const badgeItems = inv.filter(id=>getShopItem(id)?.type==="badge").length;
    // Özel emoji rozetleri dene
    const activeBadgeDisplay = prof.activeBadge
      ? (getEmoji(prof.activeBadge, prof.activeBadge) || prof.activeBadge)
      : "Yok";
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(prof.color)
        .setTitle(`${prof.activeBadge ? prof.activeBadge+" " : ""}${target.user.tag} — Profil`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`*${prof.bio || "Bio yok — `a!satinal bio_unlock` ile aç!"}*`)
        .addFields(
          { name: "⭐ Level",        value: `${ud.level}`,        inline: true },
          { name: "✨ XP",           value: `${ud.xp}/${ud.level*100}`, inline: true },
          { name: "💰 Hunter Bucks", value: formatCoins(coins),   inline: true },
          { name: "🏅 Aktif Rozet",  value: activeBadgeDisplay,   inline: true },
          { name: "🎨 Renk Sayısı",  value: `${colorItems} renk`, inline: true },
          { name: "🏆 Rozet Sayısı", value: `${badgeItems} rozet`, inline: true },
          { name: "📅 Katılım",      value: target.joinedAt?.toDateString() || "Bilinmiyor", inline: true },
          { name: "🗓️ Hesap",        value: target.user.createdAt.toDateString(), inline: true },
        ).setFooter({ text: `ID: ${target.id}` }).setTimestamp(),
    ]});
  }

  // ── İSTATİSTİK ────────────────────────────────────────────────────────────
  if (command === "istatistik" || command === "stats") {
    const target = message.mentions.members.first() || message.member;
    const stats  = getStats(target.id, message.guild.id);
    checkAndResetStats(stats);
    const wStart = new Date(stats.weekly.periodStart).toLocaleDateString("tr-TR");
    const mStart = new Date(stats.monthly.periodStart).toLocaleDateString("tr-TR");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color || "#5865F2")
        .setTitle(`📊 ${target.user.tag} — İstatistikler`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: `📅 Bu Hafta (${wStart}'den beri)`, value: [`💬 Mesaj: **${stats.weekly.messages.toLocaleString()}**`,`🔊 Ses: **${formatDuration(stats.weekly.voiceMinutes)}**`].join("\n"), inline: false },
          { name: `🗓️ Bu Ay (${mStart}'den beri)`,    value: [`💬 Mesaj: **${stats.monthly.messages.toLocaleString()}**`,`🔊 Ses: **${formatDuration(stats.monthly.voiceMinutes)}**`].join("\n"), inline: false },
        ).setFooter({ text: "Haftalık veriler her Pazartesi, aylık veriler her ay 1'inde sıfırlanır." }).setTimestamp(),
    ]});
  }

  // ── SUNUCU BİLGİ ──────────────────────────────────────────────────────────
  if (command === "sunucubilgi") {
    const { guild } = message;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue").setTitle(`📋 ${guild.name} — Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: "Üye Sayısı",   value: `${guild.memberCount}`, inline: true },
          { name: "Kanal Sayısı", value: `${guild.channels.cache.size}`, inline: true },
          { name: "Rol Sayısı",   value: `${guild.roles.cache.size}`, inline: true },
          { name: "Kuruluş",      value: guild.createdAt.toDateString(), inline: true },
          { name: "Sahip",        value: `<@${guild.ownerId}>`, inline: true },
          { name: "Boost",        value: `Seviye ${guild.premiumTier} (${guild.premiumSubscriptionCount||0} boost)`, inline: true },
        ).setTimestamp(),
    ]});
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  if (command === "avatar") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue")
        .setTitle(`${target.user.tag} kullanıcısının avatarı`)
        .setImage(target.user.displayAvatarURL({ dynamic: true, size: 512 })),
    ]});
  }

  // ── OYUNLAR ────────────────────────────────────────────────────────────────
  const gameCommands = ["slot","coinflip","cf","dice","hunt","fish","rob","roulette","blackjack","sans"];
  if (gameCommands.includes(command) && isHbEngel(message.guild.id, message.channel.id)) {
    return message.reply("🚫 Bu kanalda oyunlar devre dışı!");
  }

  if (command === "slot") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Geçerli bir miktar gir! Örnek: `a!slot 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! Bakiyen: **${formatCoins(bal)}**`);
    const symbols = ["🍒","🍋","🍊","🍇","⭐","💎"];
    const result  = [0,1,2].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);
    let multiplier = 0;
    if (result[0]===result[1]&&result[1]===result[2]) multiplier=result[0]==="💎"?10:result[0]==="⭐"?5:3;
    else if (result[0]===result[1]||result[1]===result[2]||result[0]===result[2]) multiplier=1.5;
    let resultText, color;
    if (multiplier>0) { const win=Math.floor(amount*multiplier); addCoins(message.author.id,message.guild.id,win-amount); resultText=`🎉 Kazandın! **${formatCoins(win)}**`; color="Green"; }
    else { removeCoins(message.author.id,message.guild.id,amount); resultText=`😢 Kaybettin! **${formatCoins(amount)}** kaybettin.`; color="Red"; }
    return message.channel.send({ embeds: [new EmbedBuilder().setColor(color).setTitle("🎰 Slot Machine").setDescription(`${result.join(" | ")}\n\n${resultText}`).setTimestamp()] });
  }

  if (command === "coinflip" || command === "cf") {
    const amount=parseInt(args[0]), choice=args[1]?.toLowerCase();
    if (!amount||amount<1) return message.reply("Örnek: `a!coinflip 100 yazı`");
    if (!choice||(choice!=="yazı"&&choice!=="tura")) return message.reply("Yazı veya tura seç!");
    const bal=getCoins(message.author.id,message.guild.id);
    if (bal<amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const result=Math.random()<0.5?"yazı":"tura"; const won=choice===result;
    if (won) addCoins(message.author.id,message.guild.id,amount);
    else removeCoins(message.author.id,message.guild.id,amount);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🪙 Coinflip").setDescription(`Sonuç: **${result}** | Seçimin: **${choice}**\n\n${won?`🎉 Kazandın! **${formatCoins(amount*2)}**`:`😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`).setTimestamp()] });
  }

  if (command === "dice") {
    const amount=parseInt(args[0]), guess=parseInt(args[1]);
    if (!amount||amount<1) return message.reply("Örnek: `a!dice 100 3`");
    if (!guess||guess<1||guess>6) return message.reply("1-6 arası tahmin gir!");
    const bal=getCoins(message.author.id,message.guild.id);
    if (bal<amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const result=Math.floor(Math.random()*6)+1; const won=guess===result;
    if (won) addCoins(message.author.id,message.guild.id,amount*5);
    else removeCoins(message.author.id,message.guild.id,amount);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🎲 Zar Oyunu").setDescription(`Zar: **${result}** | Tahminin: **${guess}**\n\n${won?`🎉 Kazandın! **${formatCoins(amount*5)}**`:`😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`).setTimestamp()] });
  }

  if (command === "hunt") {
    const animals=[{name:"🐰 Tavşan",value:50},{name:"🦌 Geyik",value:100},{name:"🐗 Domuz",value:150},{name:"🐺 Kurt",value:200},{name:"🐻 Ayı",value:300},{name:"🦁 Aslan",value:500},{name:"🐉 Ejderha",value:1000}];
    if (Math.random()<0.7) { const a=animals[Math.floor(Math.random()*animals.length)]; addCoins(message.author.id,message.guild.id,a.value); return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("🏹 Avlanma Başarılı!").setDescription(`${a.name} yakaladın! **${formatCoins(a.value)}** kazandın.`).setTimestamp()] }); }
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setTitle("🏹 Avlanma Başarısız!").setDescription("Hiçbir şey yakalayamadın!").setTimestamp()] });
  }

  if (command === "fish") {
    const fishes=[{name:"🐟 Küçük Balık",value:30},{name:"🐠 Renkli Balık",value:60},{name:"🦈 Köpekbalığı",value:200},{name:"🐋 Balina",value:400},{name:"🦑 Ahtapot",value:100},{name:"🦀 Yengeç",value:80},{name:"🐙 Dev Ahtapot",value:600}];
    if (Math.random()<0.8) { const f=fishes[Math.floor(Math.random()*fishes.length)]; addCoins(message.author.id,message.guild.id,f.value); return message.channel.send({ embeds: [new EmbedBuilder().setColor("Blue").setTitle("🎣 Balık Tutma Başarılı!").setDescription(`${f.name} tuttun! **${formatCoins(f.value)}** kazandın.`).setTimestamp()] }); }
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Gray").setTitle("🎣 Balık Tutma Başarısız!").setDescription("Hiçbir balık tutamadın!").setTimestamp()] });
  }

  // ── ROB ───────────────────────────────────────────────────────────────────
  if (command === "rob") {
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi soymak istiyorsun? Bir üye etiketle!");
    if (target.id === message.author.id) return message.reply("Kendini soyamazsın!");
    if (target.user.bot) return message.reply("Botları soyamazsın!");
    const targetBal = getCoins(target.id, message.guild.id);
    if (targetBal < 50) return message.reply(`${target.user.tag} adlı kullanıcının soymaya değer parası yok!`);
    const success = Math.random() < 0.35;
    if (success) {
      const stolen = Math.floor(targetBal * (Math.random() * 0.3 + 0.1));
      removeCoins(target.id, message.guild.id, stolen);
      addCoins(message.author.id, message.guild.id, stolen);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("🦹 Soygun Başarılı!")
        .setDescription(`${target.user.tag} kullanıcısından **${formatCoins(stolen)}** çaldın!`).setTimestamp()] });
    } else {
      const fine = Math.floor(Math.min(getCoins(message.author.id,message.guild.id)*0.2, 500));
      removeCoins(message.author.id, message.guild.id, fine);
      addCoins(target.id, message.guild.id, fine);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setTitle("🚔 Yakalandın!")
        .setDescription(`Soygun başarısız! Ceza olarak **${formatCoins(fine)}** ödedi ve ${target.user.tag} adlı kullanıcıya gitti.`).setTimestamp()] });
    }
  }

  // ── ROULETTE ──────────────────────────────────────────────────────────────
  if (command === "roulette") {
    const amount = parseInt(args[0]);
    const bet    = args[1]?.toLowerCase();
    if (!amount || amount < 1) return message.reply("Örnek: `a!roulette 100 kırmızı`");
    if (!bet || !["kırmızı","siyah","yeşil"].includes(bet)) return message.reply("Seçenekler: `kırmızı`, `siyah`, `yeşil`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const num = Math.floor(Math.random() * 37);
    const resultColor = num === 0 ? "yeşil" : num % 2 === 0 ? "siyah" : "kırmızı";
    const won = bet === resultColor;
    const multiplier = bet === "yeşil" ? 14 : 2;
    const colorEmoji = { "kırmızı": "🔴", "siyah": "⚫", "yeşil": "🟢" };
    if (won) addCoins(message.author.id, message.guild.id, amount * (multiplier-1));
    else     removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🎡 Rulet")
        .addFields(
          { name: "Sonuç", value: `${colorEmoji[resultColor]} **${num}** (${resultColor})`, inline: true },
          { name: "Seçimin", value: `${colorEmoji[bet]} ${bet}`, inline: true },
          { name: won ? "Kazandın!" : "Kaybettin!", value: won ? `**+${formatCoins(amount*(multiplier-1))}**` : `**-${formatCoins(amount)}**`, inline: true },
        ).setFooter({ text: "Yeşil seçersen 14x kazanırsın!" }).setTimestamp(),
    ]});
  }

  // ── BLACKJACK ─────────────────────────────────────────────────────────────
  if (command === "blackjack" || command === "bj") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!blackjack 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const deck = () => {
      const cards = [2,3,4,5,6,7,8,9,10,10,10,10,11];
      return cards[Math.floor(Math.random()*cards.length)];
    };
    const handValue = (hand) => {
      let sum = hand.reduce((a,b)=>a+b, 0);
      let aces = hand.filter(c=>c===11).length;
      while (sum > 21 && aces > 0) { sum -= 10; aces--; }
      return sum;
    };
    const playerHand = [deck(), deck()];
    const dealerHand = [deck(), deck()];
    // Dealer kartları 17'ye kadar çeker
    while (handValue(dealerHand) < 17) dealerHand.push(deck());
    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);
    let result, color;
    if (playerVal > 21) { result = `😢 Battın! (${playerVal}) **-${formatCoins(amount)}**`; removeCoins(message.author.id,message.guild.id,amount); color="Red"; }
    else if (dealerVal > 21 || playerVal > dealerVal) { result = `🎉 Kazandın! (${playerVal} vs ${dealerVal}) **+${formatCoins(amount)}**`; addCoins(message.author.id,message.guild.id,amount); color="Green"; }
    else if (playerVal === dealerVal) { result = `🤝 Beraberlik! (${playerVal} vs ${dealerVal}) Bakiyen iade edildi.`; color="Yellow"; }
    else { result = `😢 Kaybettin! (${playerVal} vs ${dealerVal}) **-${formatCoins(amount)}**`; removeCoins(message.author.id,message.guild.id,amount); color="Red"; }
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(color).setTitle("🃏 Blackjack")
        .addFields(
          { name: "Senin Elin", value: `${playerHand.join(" + ")} = **${playerVal}**`, inline: true },
          { name: "Dealer Eli", value: `${dealerHand.join(" + ")} = **${dealerVal}**`, inline: true },
          { name: "Sonuç", value: result, inline: false },
        ).setTimestamp(),
    ]});
  }

  // ── ŞANS ÇARKI ────────────────────────────────────────────────────────────
  if (command === "sans" || command === "şans") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!sans 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz bakiye! **${formatCoins(bal)}**`);
    const segments = [
      { label: "💀 Hepsini Kaybettin!", multiplier: 0, color: "DarkRed" },
      { label: "😢 Yarısını Kaybettin", multiplier: 0.5, color: "Red" },
      { label: "🤝 Başa Baş",           multiplier: 1, color: "Yellow" },
      { label: "✨ 1.5x Kazandın!",     multiplier: 1.5, color: "Green" },
      { label: "🎉 2x Kazandın!",       multiplier: 2, color: "Green" },
      { label: "🔥 3x Kazandın!",       multiplier: 3, color: "Gold" },
      { label: "💎 5x Kazandın!",       multiplier: 5, color: "Aqua" },
      { label: "👑 10x JACKPOT!",       multiplier: 10, color: "Gold" },
    ];
    const weights = [15,20,20,20,12,7,4,2]; // Toplam 100
    let rand = Math.random() * 100, cumulative = 0, chosen = segments[0];
    for (let i = 0; i < segments.length; i++) { cumulative += weights[i]; if (rand < cumulative) { chosen = segments[i]; break; } }
    const payout = Math.floor(amount * chosen.multiplier);
    const diff   = payout - amount;
    if (diff >= 0) addCoins(message.author.id, message.guild.id, diff);
    else removeCoins(message.author.id, message.guild.id, Math.abs(diff));
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(chosen.color).setTitle("🎡 Şans Çarkı")
        .addFields(
          { name: "Sonuç", value: chosen.label, inline: true },
          { name: "Bahis", value: formatCoins(amount), inline: true },
          { name: diff >= 0 ? "Kazandın" : "Kaybettin", value: `**${diff >= 0 ? "+" : ""}${formatCoins(Math.abs(diff))}**`, inline: true },
        ).setTimestamp(),
    ]});
  }

  if (command === "yaz") {
    if (message.author.id !== OWNER_ID) return;
    let targetChannel = message.mentions.channels.first();
    let text;
    if (targetChannel) {
      text = args.slice(1).join(" ");
    } else {
      targetChannel = message.channel;
      text = args.join(" ");
    }
    if (!text) return message.reply("Yazacak bir şey belirt!");
    try {
      await message.delete().catch(() => {});
      await targetChannel.send(text);
    } catch { return message.reply("❌ Mesaj gönderilemedi."); }
    return;
  }

  // ── MOD ROL AYARLARI ────────────────────────────────────────────────────────
  const modRolCommands = { warnrol: "warn", banrol: "ban", kickrol: "kick", muterol: "mute", temizlerol: "temizle" };
  if (modRolCommands[command]) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const role = message.mentions.roles.first();
    if (!role) return message.reply(`Bir rol etiketle! Örnek: \`a!${command} @Moderatör\``);
    const guildRoles = modRolesMap.get(message.guild.id) || {};
    guildRoles[modRolCommands[command]] = role.id;
    modRolesMap.set(message.guild.id, guildRoles);
    saveData(modRolesFile, modRolesMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Mod Rolü Ayarlandı")
        .setDescription(`**${modRolCommands[command]}** komutu artık ${role} rolü tarafından kullanılabilir.`)
        .setFooter({ text: "Yöneticiler her zaman tüm komutlara erişebilir." }).setTimestamp(),
    ]});
  }

  if (command === "modroller") {
    const guildRoles = modRolesMap.get(message.guild.id) || {};
    const keys = ["ban","kick","mute","warn","temizle"];
    const lines = keys.map(k => `**${k}** → ${guildRoles[k] ? `<@&${guildRoles[k]}>` : "*Ayarlanmadı*"}`);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#5865F2").setTitle("⚙️ Mod Rolleri").setDescription(lines.join("\n"))
        .setFooter({ text: "a!warnrol / a!banrol / a!kickrol / a!muterol / a!temizlerol ile ayarla" }).setTimestamp(),
    ]});
  }

  // ── LOG AYARLARI ────────────────────────────────────────────────────────────
  const logTypes = { ses: "🔊 Ses Logu", davet: "📥 Davet Logu", mesaj: "✏️ Mesaj Logu" };

  if (command === "logayarla") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type]) return message.reply("Geçerli türler: `ses`, `davet`, `mesaj`");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply(`Kanal etiketle! Örnek: \`a!logayarla ${type} #log-kanalı\``);
    const settings = getLogSettings(message.guild.id);
    settings[type] = { enabled: true, channelId: ch.id };
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Log Ayarlandı").setDescription(`${logTypes[type]} artık ${ch} kanalına gönderilecek ve **açık**.`).setTimestamp()] });
  }

  if (command === "logkapat") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type]) return message.reply("Geçerli türler: `ses`, `davet`, `mesaj`");
    const settings = getLogSettings(message.guild.id);
    settings[type].enabled = false;
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setTitle("🔕 Log Kapatıldı").setDescription(`${logTypes[type]} artık **kapalı**.`).setTimestamp()] });
  }

  if (command === "logac" || command === "logaç") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type]) return message.reply("Geçerli türler: `ses`, `davet`, `mesaj`");
    const settings = getLogSettings(message.guild.id);
    if (!settings[type].channelId) return message.reply(`Önce kanal ayarla: \`a!logayarla ${type} #kanal\``);
    settings[type].enabled = true;
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("🔔 Log Açıldı").setDescription(`${logTypes[type]} artık **açık**.`).setTimestamp()] });
  }

  if (command === "logdurum") {
    const settings = getLogSettings(message.guild.id);
    const lines = Object.entries(logTypes).map(([key, label]) => {
      const cfg = settings[key];
      return `${label}\n↳ ${cfg.enabled?"✅ Açık":"❌ Kapalı"} | Kanal: ${cfg.channelId?`<#${cfg.channelId}>`:"*Kanal ayarlanmadı*"}`;
    });
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#5865F2").setTitle("📋 Log Sistemi Durumu").setDescription(lines.join("\n\n"))
        .setFooter({ text: "a!logayarla <tür> #kanal | a!logkapat <tür> | a!logac <tür>" }).setTimestamp(),
    ]});
  }

  // ── PK SİSTEMİ ─────────────────────────────────────────────────────────────
  if (command === "pk") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const sub = args[0]?.toLowerCase();
    if (!sub || !["aç","ac","kapat"].includes(sub)) return message.reply("Kullanım: `a!pk aç` veya `a!pk kapat`");
    const enabled = (sub === "aç" || sub === "ac");
    pkSettingsMap.set(message.guild.id, { enabled });
    saveData(pkSettingsFile, pkSettingsMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(enabled?"Green":"Red")
        .setTitle(enabled?"🛡️ Patlama Koruması Açıldı":"🛡️ Patlama Koruması Kapatıldı")
        .setDescription(enabled
          ? "5 dakika içinde 3 veya daha fazla kanal silen/düzenleyen kişi otomatik banlanacak."
          : "Patlama koruması devre dışı bırakıldı.").setTimestamp(),
    ]});
  }

  // ── HB ENGEL ────────────────────────────────────────────────────────────────
  if (command === "hbengel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const sub = args[0]?.toLowerCase();
    if (!sub || !["aç","ac","kapat"].includes(sub)) return message.reply("Kullanım: `a!hbengel aç` veya `a!hbengel kapat`");
    const channels = hbEngelMap.get(message.guild.id) || [];
    const channelId = message.channel.id;
    if (sub === "aç" || sub === "ac") {
      if (!channels.includes(channelId)) { channels.push(channelId); hbEngelMap.set(message.guild.id, channels); saveData(hbEngelFile, hbEngelMap); }
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Red").setTitle("🚫 HB Engeli Açıldı").setDescription(`Bu kanalda artık ekonomi ve oyun komutları kullanılamaz.`).setTimestamp()] });
    } else {
      const filtered = channels.filter(c => c !== channelId);
      hbEngelMap.set(message.guild.id, filtered);
      saveData(hbEngelFile, hbEngelMap);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ HB Engeli Kaldırıldı").setDescription(`Bu kanalda ekonomi ve oyun komutları tekrar kullanılabilir.`).setTimestamp()] });
    }
  }

  // ── ROL OLUŞTUR ─────────────────────────────────────────────────────────────
  if (command === "rololustur") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler kullanabilir!");
    const colorArg = args[args.length - 1];
    const isHex = /^#[0-9A-Fa-f]{6}$/.test(colorArg);
    const roleName = isHex ? args.slice(0,-1).join(" ") : args.join(" ");
    if (!roleName) return message.reply("Kullanım: `a!rololustur <rol adı> <#renk kodu>`\nÖrnek: `a!rololustur Moderatör #E74C3C`");
    const roleColor = isHex ? colorArg : "#99AAB5";
    try {
      const newRole = await message.guild.roles.create({ name: roleName, color: roleColor, reason: `${message.author.tag} tarafından oluşturuldu` });
      return message.channel.send({ embeds: [
        new EmbedBuilder().setColor(roleColor).setTitle("✅ Rol Oluşturuldu")
          .addFields(
            { name: "Rol", value: `${newRole} (${newRole.name})`, inline: true },
            { name: "Renk", value: roleColor, inline: true },
          ).setTimestamp(),
      ]});
    } catch {
      return message.reply("❌ Rol oluşturulamadı. Botun yeterli yetkisi var mı?");
    }
  }

  // ── WARN SİSTEMİ ────────────────────────────────────────────────────────────
  if (command === "warn") {
    if (!hasModPerm(message.member, "warn", PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Warn atma yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı! Mention veya ID gir.");
    if (target.user.bot) return message.reply("Botlara warn atamazsın!");
    const reason = args.slice(message.mentions.users.size > 0 ? 1 : 1).join(" ");
    if (!reason) return message.reply("Sebep belirt! Örnek: `a!warn @üye kurallara uymadı`");
    const warnKey = `${message.guild.id}_${target.id}`;
    if (!warningsMap.has(warnKey)) warningsMap.set(warnKey, []);
    const warns = warningsMap.get(warnKey);
    warns.push({ id: warns.length+1, reason, by: message.author.tag, timestamp: Date.now() });
    saveData(warningsFile, warningsMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle("⚠️ Warn Atıldı")
        .addFields(
          { name: "Kullanıcı", value: `${target.user.tag} (<@${target.id}>)`, inline: true },
          { name: "Yetkili",   value: message.author.tag, inline: true },
          { name: "Warn #",    value: `${warns.length}`, inline: true },
          { name: "Sebep",     value: reason },
        ).setFooter({ text: `Toplam ${warns.length} warn` }).setTimestamp(),
    ]});
  }

  if (command === "warnings" || command === "warnlist") {
    const target = await resolveUser(message, args) || message.member;
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];
    if (warns.length === 0) return message.reply(`${target.user.tag} adlı kullanıcının hiç warni yok.`);
    const warnText = warns.map(w => `**#${w.id}** — ${w.reason}\n↳ *${w.by}* tarafından, ${new Date(w.timestamp).toLocaleDateString("tr-TR")}`).join("\n\n");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle(`⚠️ ${target.user.tag} — Warn Geçmişi`)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .setDescription(warnText)
        .setFooter({ text: `Toplam ${warns.length} warn` }).setTimestamp(),
    ]});
  }

  if (command === "unwarn") {
    if (!hasModPerm(message.member, "warn", PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Warn silme yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];
    if (warns.length === 0) return message.reply(`${target.user.tag} adlı kullanıcının hiç warni yok.`);
    const sub = args[message.mentions.users.size > 0 ? 1 : 1]?.toLowerCase();
    if (sub === "all" || sub === "hepsi") {
      warningsMap.set(warnKey, []); saveData(warningsFile, warningsMap);
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Tüm Warnlar Silindi").setDescription(`${target.user.tag} adlı kullanıcının **${warns.length}** warni silindi.`).setTimestamp()] });
    }
    const warnNo = parseInt(sub);
    if (!warnNo||warnNo<1||warnNo>warns.length) return message.reply(`Geçerli warn numarası gir (1-${warns.length}). Tümünü silmek için \`all\` yaz.`);
    const removed = warns.splice(warnNo-1, 1)[0];
    warns.forEach((w,i) => { w.id = i+1; });
    warningsMap.set(warnKey, warns); saveData(warningsFile, warningsMap);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Warn Silindi")
        .addFields(
          { name: "Kullanıcı",   value: target.user.tag, inline: true },
          { name: "Silinen Warn", value: `#${warnNo} — ${removed.reason}`, inline: false },
          { name: "Kalan Warn",  value: `${warns.length}`, inline: true },
        ).setTimestamp(),
    ]});
  }

  // ── MODERASYON ──────────────────────────────────────────────────────────────
  if (command === "ban") {
    if (!hasModPerm(message.member, "ban", PermissionsBitField.Flags.BanMembers)) return message.reply("🚫 Ban yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.bannable) return message.reply("🚫 Bu kullanıcıyı banlayamam!");
    const reason = args.slice(message.mentions.users.size>0?1:1).join(" ") || "Sebep belirtilmedi";
    await target.ban({ reason });
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("DarkRed").setTitle("⛔ Kullanıcı Banlandı")
        .addFields({ name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "kick") {
    if (!hasModPerm(message.member, "kick", PermissionsBitField.Flags.KickMembers)) return message.reply("🚫 Kick yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.kickable) return message.reply("🚫 Bu kullanıcıyı kickleyemem!");
    const reason = args.slice(message.mentions.users.size>0?1:1).join(" ") || "Sebep belirtilmedi";
    await target.kick(reason);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Orange").setTitle("👢 Kullanıcı Kicklendi")
        .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "temizle" || command === "clear" || command === "purge") {
    if (!hasModPerm(message.member, "temizle", PermissionsBitField.Flags.ManageMessages)) return message.reply("🚫 Mesaj yönetme yetkin yok!");
    const n = parseInt(args[0]);
    if (!n||n<1||n>100) return message.reply("1-100 arası bir sayı gir.");
    try {
      await message.channel.bulkDelete(n+1, true);
      const msg = await message.channel.send(`✅ **${n}** mesaj silindi.`);
      setTimeout(()=>msg.deletable&&msg.delete().catch(()=>{}), 3000);
    } catch { return message.reply("❌ 14 günden eski mesajlar toplu silinemez."); }
  }

  if (command === "mute") {
    if (!hasModPerm(message.member, "mute", PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı mute yapamam!");
    const ms = require("ms");
    const süreArg = message.mentions.users.size>0 ? args[1] : args[1];
    if (!süreArg) return message.reply("Süre belirt! Örnek: `a!mute @üye 10m`");
    const süreMs = ms(süreArg);
    if (!süreMs||süreMs<1000||süreMs>28*24*60*60*1000) return message.reply("Geçerli süre: 1s — 28d.");
    const reason = args.slice(message.mentions.users.size>0?2:2).join(" ") || "Sebep belirtilmedi";
    await target.timeout(süreMs, reason);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Yellow").setTitle("🔇 Kullanıcı Mute Edildi")
        .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Süre",value:süreArg,inline:true},{name:"Sebep",value:reason}).setTimestamp(),
    ]});
  }

  if (command === "unmute") {
    if (!hasModPerm(message.member, "mute", PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout kaldırma yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.moderatable) return message.reply("🚫 Bu kullanıcıyı düzenleyemem!");
    await target.timeout(null);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("🔊 Mute Kaldırıldı")
        .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true}).setTimestamp(),
    ]});
  }

  // ── GİZLİ: KANAL GİR ────────────────────────────────────────────────────────
  if (command === "kanalagir") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("Önce bir ses kanalına gir, sonra bu komutu kullan.");
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId:   message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      connection.on(VoiceConnectionStatus.Ready, () => { message.reply(`✅ **${voiceChannel.name}** kanalına bağlandım.`); });
      connection.on("error", () => { message.reply("❌ Ses kanalına bağlanırken hata oluştu."); });
    } catch { return message.reply("❌ Bağlanılamadı."); }
    return;
  }
});

client.login(process.env.TOKEN);
