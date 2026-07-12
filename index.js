require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  Partials,
  AttachmentBuilder,
} = require("discord.js");
const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

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
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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
const robCooldownsFile   = path.join(dataDir, "robCooldowns.json");
const userProfilesFile   = path.join(dataDir, "userProfiles.json");
const userInventoryFile  = path.join(dataDir, "userInventory.json");
const userStatsFile      = path.join(dataDir, "userStats.json");
const warningsFile       = path.join(dataDir, "warnings.json");
const modRolesFile       = path.join(dataDir, "modRoles.json");
const logSettingsFile    = path.join(dataDir, "logSettings.json");
const pkSettingsFile     = path.join(dataDir, "pkSettings.json");
const hbEngelFile        = path.join(dataDir, "hbEngel.json");
const levelRolesFile     = path.join(dataDir, "levelRoles.json");
const ytSettingsFile     = path.join(dataDir, "ytSettings.json");

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
const robCooldowns   = loadData(robCooldownsFile);
const userProfiles   = loadData(userProfilesFile);
const userInventory  = loadData(userInventoryFile);
const userStats      = loadData(userStatsFile);
const warningsMap    = loadData(warningsFile);
const modRolesMap    = loadData(modRolesFile);
const logSettingsMap = loadData(logSettingsFile);
const pkSettingsMap  = loadData(pkSettingsFile);
const hbEngelMap     = loadData(hbEngelFile);
const levelRolesMap  = loadData(levelRolesFile);
const ytSettingsMap  = loadData(ytSettingsFile);

// RAM-only
const voiceSessions  = new Map();
const inviteCache    = new Map();
const pkTracker      = new Map();
const activeApplications = new Set(); // userId — devam eden başvuru

// ── Periyodik kayıt ────────────────────────────────────────────────────────────
setInterval(() => {
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  saveData(robCooldownsFile, robCooldowns);
  saveData(userProfilesFile, userProfiles);
  saveData(userInventoryFile, userInventory);
  saveData(userStatsFile, userStats);
  saveData(warningsFile, warningsMap);
  saveData(modRolesFile, modRolesMap);
  saveData(logSettingsFile, logSettingsMap);
  saveData(pkSettingsFile, pkSettingsMap);
  saveData(hbEngelFile, hbEngelMap);
  saveData(levelRolesFile, levelRolesMap);
  saveData(ytSettingsFile, ytSettingsMap);
}, 30000);

function saveAll() {
  saveData(userLevelsFile, userLevels);
  saveData(levelChannelsFile, levelChannels);
  saveData(userCoinsFile, userCoinsMap);
  saveData(dailyCooldownsFile, dailyCooldowns);
  saveData(workCooldownsFile, workCooldowns);
  saveData(robCooldownsFile, robCooldowns);
  saveData(userProfilesFile, userProfiles);
  saveData(userInventoryFile, userInventory);
  saveData(userStatsFile, userStats);
  saveData(warningsFile, warningsMap);
  saveData(modRolesFile, modRolesMap);
  saveData(logSettingsFile, logSettingsMap);
  saveData(pkSettingsFile, pkSettingsMap);
  saveData(hbEngelFile, hbEngelMap);
  saveData(levelRolesFile, levelRolesMap);
  saveData(ytSettingsFile, ytSettingsMap);
}
process.on("SIGINT",  () => { saveAll(); process.exit(0); });
process.on("SIGTERM", () => { saveAll(); process.exit(0); });

// ── Mağaza ürünleri ────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id: "color_mavi",      name: "🔵 Mavi",               price: 300,     type: "color",      value: "#3498DB", desc: "Profil embed rengi mavi olur" },
  { id: "color_kirmizi",   name: "🔴 Kırmızı",             price: 300,     type: "color",      value: "#E74C3C", desc: "Profil embed rengi kırmızı olur" },
  { id: "color_yesil",     name: "🟢 Yeşil",               price: 300,     type: "color",      value: "#2ECC71", desc: "Profil embed rengi yeşil olur" },
  { id: "color_mor",       name: "💜 Mor",                 price: 500,     type: "color",      value: "#9B59B6", desc: "Profil embed rengi mor olur" },
  { id: "color_turuncu",   name: "🟠 Turuncu",             price: 400,     type: "color",      value: "#E67E22", desc: "Profil embed rengi turuncu olur" },
  { id: "color_pembe",     name: "🩷 Pembe",               price: 500,     type: "color",      value: "#FF69B4", desc: "Profil embed rengi pembe olur" },
  { id: "color_altin",     name: "🟡 Altın",               price: 800,     type: "color",      value: "#FFD700", desc: "Profil embed rengi altın olur" },
  { id: "color_lacivert",  name: "🌊 Lacivert",            price: 600,     type: "color",      value: "#1A237E", desc: "Profil embed rengi lacivert olur" },
  { id: "color_galaksi",   name: "🌌 Galaksi",             price: 2000,    type: "color",      value: "#2C003E", desc: "Nadir — galaksi rengi" },
  { id: "color_alev",      name: "🔥 Alev",                price: 1500,    type: "color",      value: "#FF4500", desc: "Nadir — alev rengi" },
  { id: "badge_yildiz",    name: "⭐ Yıldız Rozeti",       price: 200,     type: "badge",      value: "⭐",      desc: "Profilde yıldız rozeti gösterilir" },
  { id: "badge_kalp",      name: "❤️ Kalp Rozeti",         price: 200,     type: "badge",      value: "❤️",     desc: "Profilde kalp rozeti gösterilir" },
  { id: "badge_ates",      name: "🔥 Ateş Rozeti",         price: 400,     type: "badge",      value: "🔥",      desc: "Profilde ateş rozeti gösterilir" },
  { id: "badge_tac",       name: "👑 Taç Rozeti",          price: 1500,    type: "badge",      value: "👑",      desc: "Nadir — taç rozeti" },
  { id: "badge_elmas",     name: "💎 Elmas Rozeti",        price: 2500,    type: "badge",      value: "💎",      desc: "Ultra nadir — elmas rozeti" },
  { id: "badge_simsek",    name: "⚡ Şimşek Rozeti",       price: 700,     type: "badge",      value: "⚡",      desc: "Profilde şimşek rozeti gösterilir" },
  { id: "badge_muzik",     name: "🎵 Müzik Rozeti",        price: 500,     type: "badge",      value: "🎵",      desc: "Profilde müzik rozeti gösterilir" },
  { id: "badge_oyun",      name: "🎮 Oyuncu Rozeti",       price: 500,     type: "badge",      value: "🎮",      desc: "Profilde oyuncu rozeti gösterilir" },
  { id: "bio_unlock",      name: "📝 Bio Kilidi",          price: 250,     type: "bio",        value: true,      desc: "Profiline özel bio (tanıtım yazısı) ekleyebilirsin" },
  { id: "ozel_rol",        name: "✨ Özel Rol",            price: 1000000, type: "ozel_rol",   value: true,      desc: "Sana özel isim ve renkle bir rol oluşturulur!" },
  { id: "bg_gece",         name: "🌙 Gece Arkaplanı",      price: 800,     type: "background", value: "bg_gece",    desc: "Profil kartında gece mavisi arkaplan" },
  { id: "bg_okyanus",      name: "🌊 Okyanus Arkaplanı",   price: 1000,    type: "background", value: "bg_okyanus", desc: "Profil kartında okyanus arkaplanı" },
  { id: "bg_alev",         name: "🔥 Alev Arkaplanı",      price: 1500,    type: "background", value: "bg_alev",    desc: "Profil kartında alev arkaplanı" },
  { id: "bg_orman",        name: "🌲 Orman Arkaplanı",     price: 1000,    type: "background", value: "bg_orman",   desc: "Profil kartında orman arkaplanı" },
  { id: "bg_sunset",       name: "🌅 Gün Batımı",          price: 2000,    type: "background", value: "bg_sunset",  desc: "Profil kartında gün batımı arkaplanı" },
  { id: "bg_galaksi",      name: "✨ Galaksi Arkaplanı",   price: 3000,    type: "background", value: "bg_galaksi", desc: "Nadir — galaksi arkaplanı" },
];

function getShopItem(id) { return SHOP_ITEMS.find(i => i.id === id); }

// ── Canvas profil ─────────────────────────────────────────────────────────────
const BG_GRADIENTS = {
  default:    ["#2C3E50", "#34495E"],
  bg_gece:    ["#0F0C29", "#302B63"],
  bg_okyanus: ["#1A1A2E", "#0077B6"],
  bg_alev:    ["#7B0D1E", "#C0392B"],
  bg_orman:   ["#1A2F1A", "#2D6A4F"],
  bg_sunset:  ["#C0392B", "#F39C12"],
  bg_galaksi: ["#4B0082", "#1A0033"],
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

async function generateProfileCard(member, ud, coins, prof) {
  const W = 700, H = 260;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Arkaplan ──────────────────────────────────────────────────────────────
  const bgKey = prof.background || "default";
  const [c1, c2] = BG_GRADIENTS[bgKey] || BG_GRADIENTS.default;
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // ── İnce overlay ─────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.closePath();
  ctx.fill();

  // ── Avatar çemberi ────────────────────────────────────────────────────────
  const AX = 125, AY = 130, AR = 95;
  ctx.save();
  ctx.beginPath();
  ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
    const avatar = await loadImage(avatarURL);
    ctx.drawImage(avatar, AX - AR, AY - AR, AR * 2, AR * 2);
  } catch {
    ctx.fillStyle = "#444";
    ctx.fillRect(AX - AR, AY - AR, AR * 2, AR * 2);
  }
  ctx.restore();

  // Avatar border (profil rengiyle)
  ctx.strokeStyle = prof.color || "#5865F2";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.stroke();

  // ── Kullanıcı adı ─────────────────────────────────────────────────────────
  const textX = 250;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 30px sans-serif";
  const uname = member.user.username.slice(0,20);
  ctx.fillText(uname, textX, 60);

  // Badge
  if (prof.activeBadge) {
    ctx.font = "26px sans-serif";
    ctx.fillText(prof.activeBadge, textX + ctx.measureText(uname).width + 8, 60);
  }

  // ── Level bilgisi ─────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Seviye ${ud.level}`, textX, 90);

  // ── XP Bar ───────────────────────────────────────────────────────────────
  const barX = textX, barY = 105, barW = 415, barH = 22;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 11);
  ctx.fill();
  const progress = Math.min(ud.xp / (ud.level * 100), 1);
  if (progress > 0) {
    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, prof.color || "#5865F2");
    fillGrad.addColorStop(1, "#a78bfa");
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 11);
    ctx.fill();
  }
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`${ud.xp} / ${ud.level * 100} XP`, barX + 6, barY + 15);

  // ── Hunter Bucks ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText(`💰 ${coins.toLocaleString("tr-TR")} HB`, textX, 160);

  // ── Bio ───────────────────────────────────────────────────────────────────
  if (prof.bio) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 14px sans-serif";
    ctx.fillText(prof.bio.slice(0,55), textX, 185);
  }

  // ── Ayraç çizgisi ─────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, 198);
  ctx.lineTo(W - 20, 198);
  ctx.stroke();

  // ── Katılım tarihi ────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "12px sans-serif";
  const joinDate = member.joinedAt ? member.joinedAt.toLocaleDateString("tr-TR") : "?";
  ctx.fillText(`Katılım: ${joinDate}  |  ID: ${member.id}`, textX, 218);

  // ── Sol altta sunucu adı ──────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "11px sans-serif";
  ctx.fillText(member.guild.name, 20, H - 12);

  return canvas.toBuffer("image/png");
}

// ── Emoji yardımcısı ───────────────────────────────────────────────────────────
function getEmoji(name, fallback = "") {
  const emoji = client.emojis.cache.find(e => e.name === name);
  return emoji ? emoji.toString() : fallback;
}

// ── Profil yardımcıları ───────────────────────────────────────────────────────
function getProfile(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userProfiles.has(key)) userProfiles.set(key, { color: "#5865F2", badges: [], activeBadge: "", bio: "", background: "default" });
  const p = userProfiles.get(key);
  if (!p.background) p.background = "default";
  return p;
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
  const s = getStats(userId, guildId); checkAndResetStats(s);
  s.weekly.messages++; s.monthly.messages++;
}
function addVoiceMinutes(userId, guildId, minutes) {
  const s = getStats(userId, guildId); checkAndResetStats(s);
  s.weekly.voiceMinutes += minutes; s.monthly.voiceMinutes += minutes;
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
  return (hbEngelMap.get(guildId) || []).includes(channelId);
}

// ── XP & Seviye rol sistemi ───────────────────────────────────────────────────
function addXP(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userLevels.has(key)) userLevels.set(key, { xp: 0, level: 1 });
  const ud = userLevels.get(key);
  ud.xp += Math.floor(Math.random() * 15) + 5;
  if (ud.xp >= ud.level * 100) {
    ud.level++; ud.xp = 0;
    const reward = ud.level * 100;
    addCoins(userId, guildId, reward);
    return true;
  }
  return false;
}

async function sendLevelUpMessage(member, newLevel, coinReward) {
  const channelId = levelChannels.get(member.guild.id);
  if (channelId) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      channel.send({ content: `${member}`, embeds: [
        new EmbedBuilder().setColor("Gold").setTitle("🎉 Tebrikler, Seviye Atladın!")
          .setDescription(`${member} artık **${newLevel}. seviye**sin! 🚀\n💰 Ödül: **${coinReward.toLocaleString()} HB**`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "⭐ Yeni Seviye", value: `${newLevel}`, inline: true },
            { name: "💰 Ödül",        value: `${coinReward.toLocaleString()} HB`, inline: true },
          ).setTimestamp(),
      ]}).catch(() => {});
    }
  }
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
const PK_WINDOW = 5 * 60 * 1000;
const PK_LIMIT  = 3;
function trackPkAction(guild, userId, type) {
  if (!pkSettingsMap.get(guild.id)?.enabled) return;
  const key = `${guild.id}_${userId}`, now = Date.now();
  let data = pkTracker.get(key) || { deletes: 0, edits: 0, firstTime: now };
  if (now - data.firstTime > PK_WINDOW) data = { deletes: 0, edits: 0, firstTime: now };
  data[type]++;
  pkTracker.set(key, data);
  if (data.deletes + data.edits >= PK_LIMIT) {
    pkTracker.delete(key);
    guild.members.fetch(userId).then(m => m?.ban({ reason: `[PK] 5dk içinde ${PK_LIMIT}+ kanal silme/düzenleme` })).catch(() => {});
  }
}

// ── Başvuru sistemi ───────────────────────────────────────────────────────────
async function startApplication(guild, member) {
  if (activeApplications.has(member.id)) return;
  const settings = ytSettingsMap.get(guild.id);
  if (!settings) return;
  const questions = settings.questions || {};
  const sortedQs  = Object.entries(questions).sort((a,b) => parseInt(a[0])-parseInt(b[0]));
  if (sortedQs.length === 0) return;

  activeApplications.add(member.id);
  let appChannel;

  try {
    appChannel = await guild.channels.create({
      name: `başvuru-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g,"")||member.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
      ],
    });
  } catch (err) {
    console.error("Başvuru kanalı oluşturulamadı:", err);
    activeApplications.delete(member.id);
    return;
  }

  await appChannel.send({ embeds: [
    new EmbedBuilder().setColor("#5865F2").setTitle("📋 Yetkili Başvurusu")
      .setDescription(`Merhaba ${member}! Sana **${sortedQs.length}** soru soracağım.\nHer soru için **2 dakika** süren var. İlk yazdığın mesaj cevap olarak kabul edilecek.\n\nHazır olduğunda bekleyin, hemen başlıyoruz...`)
      .setFooter({ text: "Başvurun otomatik olarak değerlendirilecek." }).setTimestamp(),
  ]});

  const answers = {};
  let completed = true;

  for (const [num, question] of sortedQs) {
    await appChannel.send({ embeds: [
      new EmbedBuilder().setColor("#FFD700")
        .setTitle(`❓ Soru ${num} / ${sortedQs.length}`)
        .setDescription(question)
        .setFooter({ text: "2 dakika içinde cevaplayın." }),
    ]});

    const filter = m => m.author.id === member.id;
    const collected = await appChannel.awaitMessages({ filter, max: 1, time: 120000, errors: ["time"] }).catch(() => null);

    if (!collected || collected.size === 0) {
      await appChannel.send({ embeds: [
        new EmbedBuilder().setColor("Red").setTitle("⏰ Süre Doldu")
          .setDescription("Cevap vermediğin için başvurun otomatik olarak iptal edildi. Kanal 10 saniye içinde silinecek."),
      ]});
      completed = false;
      break;
    }
    answers[num] = collected.first().content;
  }

  if (completed) {
    await appChannel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Başvuru Tamamlandı!")
        .setDescription(`Tüm soruları yanıtladın! Başvurun değerlendirme kanalına gönderildi. Bu kanal 15 saniye içinde silinecek.`)
        .setTimestamp(),
    ]});

    // Değerlendirme kanalına gönder
    if (settings.evalChannelId) {
      const evalChannel = guild.channels.cache.get(settings.evalChannelId);
      if (evalChannel) {
        const answerFields = sortedQs.map(([num]) => ({
          name: `❓ Soru ${num}: ${questions[num]?.slice(0,80)}`,
          value: answers[num]?.slice(0,1024) || "*Yanıtsız*",
          inline: false,
        }));
        const ud     = userLevels.get(`${guild.id}_${member.id}`) || { xp: 0, level: 1 };
        const coins  = getCoins(member.id, guild.id);
        const warns  = (warningsMap.get(`${guild.id}_${member.id}`) || []).length;
        evalChannel.send({ embeds: [
          new EmbedBuilder().setColor("#5865F2").setTitle(`📋 Yeni Başvuru — ${member.user.tag}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${member} kullanıcısının başvurusu`)
            .addFields(
              { name: "👤 Kullanıcı",   value: `${member.user.tag}\n<@${member.id}>`, inline: true },
              { name: "⭐ Level",        value: `${ud.level}`, inline: true },
              { name: "💰 HB",           value: formatCoins(coins), inline: true },
              { name: "⚠️ Warn Sayısı", value: `${warns}`, inline: true },
              { name: "📅 Katılım",      value: member.joinedAt?.toLocaleDateString("tr-TR") || "?", inline: true },
              { name: "🗓️ Hesap Yaşı",  value: member.user.createdAt.toLocaleDateString("tr-TR"), inline: true },
              ...answerFields,
            )
            .setFooter({ text: `Başvuru ID: ${member.id} • ${new Date().toLocaleString("tr-TR")}` }).setTimestamp(),
        ]}).catch(() => {});
      }
    }

    setTimeout(() => appChannel.delete().catch(() => {}), 15000);
  } else {
    setTimeout(() => appChannel.delete().catch(() => {}), 10000);
  }

  activeApplications.delete(member.id);
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

// ── Reaction: başvuru tetikleyici ─────────────────────────────────────────────
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  if (reaction.message.partial) {
    try { await reaction.message.fetch(); } catch { return; }
  }

  const guild = reaction.message.guild;
  if (!guild) return;
  const settings = ytSettingsMap.get(guild.id);
  if (!settings) return;
  if (reaction.message.id !== settings.messageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== (settings.emoji || "📝")) return;

  // Kendi reactionını geri al
  try { await reaction.users.remove(user.id); } catch {}

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  startApplication(guild, member);
});

// ── PK: Kanal silindi ─────────────────────────────────────────────────────────
client.on("channelDelete", async (channel) => {
  if (!channel.guild) return;
  try {
    const logs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    trackPkAction(channel.guild, entry.executor.id, "deletes");
  } catch {}
});

// ── PK: Kanal düzenlendi ──────────────────────────────────────────────────────
client.on("channelUpdate", async (_, newChannel) => {
  if (!newChannel.guild) return;
  try {
    const logs = await newChannel.guild.fetchAuditLogs({ type: 11, limit: 1 });
    const entry = logs.entries.first();
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
      .addFields({ name:"Kullanıcı",value:`${member.user.tag} (<@${userId}>)`,inline:true},{ name:"Kanal",value:newState.channel?.name||"?",inline:true})
      .setFooter({text:`ID: ${userId}`}).setTimestamp());
  } else if (left) {
    const jt = voiceSessions.get(key);
    if (jt) { const min=(Date.now()-jt)/60000; if(min>0) addVoiceMinutes(userId,guild.id,min); voiceSessions.delete(key); }
    sendLog(guild,"ses",new EmbedBuilder().setColor("Red").setTitle("🔇 Ses Kanalından Çıktı")
      .addFields({name:"Kullanıcı",value:`${member.user.tag} (<@${userId}>)`,inline:true},{name:"Kanal",value:oldState.channel?.name||"?",inline:true})
      .setFooter({text:`ID: ${userId}`}).setTimestamp());
  } else if (moved) {
    if (!voiceSessions.has(key)) voiceSessions.set(key, Date.now());
    sendLog(guild,"ses",new EmbedBuilder().setColor("Blue").setTitle("🔀 Ses Kanalı Değiştirdi")
      .addFields({name:"Kullanıcı",value:`${member.user.tag} (<@${userId}>)`,inline:true},{name:"Eski",value:oldState.channel?.name||"?",inline:true},{name:"Yeni",value:newState.channel?.name||"?",inline:true})
      .setFooter({text:`ID: ${userId}`}).setTimestamp());
  }
});

// ── Davet log ─────────────────────────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;
  let usedInvite = null;
  try {
    const newInvites = await guild.invites.fetch();
    const cached = inviteCache.get(guild.id) || new Map();
    usedInvite = newInvites.find(i => (cached.get(i.code)||0) < i.uses);
    inviteCache.set(guild.id, new Map(newInvites.map(i => [i.code, i.uses])));
  } catch {}
  const inviteInfo = usedInvite ? `**${usedInvite.code}** (davet eden: ${usedInvite.inviter?.tag||"?"}, ${usedInvite.uses} kez)` : "Bilinmiyor";
  sendLog(guild, "davet", new EmbedBuilder().setColor("Green").setTitle("📥 Üye Katıldı")
    .setThumbnail(member.user.displayAvatarURL({dynamic:true}))
    .addFields({name:"Kullanıcı",value:`${member.user.tag} (<@${member.id}>)`,inline:true},{name:"Hesap",value:member.user.createdAt.toLocaleDateString("tr-TR"),inline:true},{name:"Davet",value:inviteInfo,inline:false})
    .setFooter({text:`ID: ${member.id} • Üye: ${guild.memberCount}`}).setTimestamp());
});

client.on("guildMemberRemove", (member) => {
  sendLog(member.guild, "davet", new EmbedBuilder().setColor("Red").setTitle("📤 Üye Ayrıldı")
    .setThumbnail(member.user.displayAvatarURL({dynamic:true}))
    .addFields({name:"Kullanıcı",value:`${member.user.tag} (<@${member.id}>)`,inline:true},{name:"Katılım",value:member.joinedAt?.toLocaleDateString("tr-TR")||"?",inline:true})
    .setFooter({text:`ID: ${member.id} • Üye: ${member.guild.memberCount}`}).setTimestamp());
});

// ── Mesaj log ─────────────────────────────────────────────────────────────────
client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
  sendLog(oldMsg.guild, "mesaj", new EmbedBuilder().setColor("Yellow").setTitle("✏️ Mesaj Düzenlendi")
    .addFields({name:"Kullanıcı",value:`${oldMsg.author?.tag||"?"} (<@${oldMsg.author?.id}>)`,inline:true},{name:"Kanal",value:`<#${oldMsg.channelId}>`,inline:true},{name:"Önceki",value:(oldMsg.content||"*boş*").slice(0,1024),inline:false},{name:"Yeni",value:(newMsg.content||"*boş*").slice(0,1024),inline:false})
    .setFooter({text:`ID: ${oldMsg.id}`}).setTimestamp());
});

client.on("messageDelete", (msg) => {
  if (!msg.guild || msg.author?.bot) return;
  sendLog(msg.guild, "mesaj", new EmbedBuilder().setColor("Red").setTitle("🗑️ Mesaj Silindi")
    .addFields({name:"Kullanıcı",value:msg.author?`${msg.author.tag} (<@${msg.author.id}>)`:"Bilinmiyor",inline:true},{name:"Kanal",value:`<#${msg.channelId}>`,inline:true},{name:"Mesaj",value:(msg.content||"*içerik yok*").slice(0,1024),inline:false})
    .setFooter({text:`ID: ${msg.id}`}).setTimestamp());
});

// ── Ana mesaj dinleyicisi ─────────────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const leveledUp = addXP(message.author.id, message.guild.id);
  if (leveledUp) {
    const key = `${message.guild.id}_${message.author.id}`;
    const newLevel = userLevels.get(key).level;
    addCoins(message.author.id, message.guild.id, newLevel * 50);
    await sendLevelUpMessage(message.member, newLevel, newLevel * 50);
  }
  addMessageStat(message.author.id, message.guild.id);
  if (Math.random() < 0.05) addCoins(message.author.id, message.guild.id, Math.floor(Math.random()*10)+1);

  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();
    if (msg === "sa")          return message.reply("as hg knk");
    if (msg === "selam")       return message.reply("selam canım nasılsın?");
    if (msg === "günaydın")    return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler") return message.reply("tatlı rüyalar 😴");
    if (msg === "bot")         return message.reply("evet ben botum, yapımcım axel_ey 👑");
    return;
  }

  const args    = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // ── YARDIM ─────────────────────────────────────────────────────────────────
  if (command === "yardım" || command === "yardim" || command === "help") {
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#FF6B6B").setTitle("🎮 Bot Komut Rehberi")
        .setDescription("**Tüm komutlar kategorilere göre ayrılmıştır!**")
        .setThumbnail(client.user.displayAvatarURL({dynamic:true}))
        .addFields(
          { name:"🛡️ MODERASYON", value:["`a!ban/kick/mute/unmute @üye/ID`","`a!warn/warnings/unwarn @üye/ID`","`a!temizle <1-100>`"].join("\n"), inline:false },
          { name:"⚙️ SİSTEM *(Admin)*", value:["`a!pk aç/kapat` • Patlama koruma","`a!hbengel aç/kapat` • Bu kanalda HB engeli","`a!seviyerol @rol <seviye>` • Seviye rolü","`a!rololustur <isim> <#renk>` • Rol oluştur","`a!warnrol/banrol/kickrol/muterol @rol`"].join("\n"), inline:false },
          { name:"📋 LOG *(Admin)*", value:["`a!logayarla ses/davet/mesaj #kanal`","`a!logkapat/logac ses/davet/mesaj`","`a!logdurum`"].join("\n"), inline:false },
          { name:"📝 BAŞVURU SİSTEMİ *(Admin)*", value:["`a!ytsetup #kanal` • Başvuru kanalı kur","`a!ytsoruayarla <no> <soru>` • Soru ekle","`a!ytdegerlendirme #kanal` • Değerlendirme kanalı","`a!ytsorular` • Soruları göster"].join("\n"), inline:false },
          { name:"👤 PROFİL & MAĞAZA", value:["`a!profil [@üye]` • Profil kartı (resim)","`a!profilayarla renk/rozet/bio/arkaplan <değer>`","`a!shop` • Mağaza","`a!satinal <id>` • Satın al","`a!envanter` • Envanter"].join("\n"), inline:false },
          { name:"💰 EKONOMİ", value:["`a!bakiye [@üye]`","`a!hbver @üye <miktar>`","`a!daily` • Günlük ödül","`a!work` • Çalış (1s)"].join("\n"), inline:false },
          { name:"🎰 OYUNLAR", value:["`a!slot/coinflip/dice/hunt/fish`","`a!rob @üye` • Soy (2s cd)","`a!roulette <miktar> <k/s/y>` • Rulet","`a!blackjack <miktar>` • Blackjack","`a!sans <miktar>` • Şans çarkı"].join("\n"), inline:false },
          { name:"📊 İSTATİSTİK", value:["`a!level [@üye]`","`a!istatistik [@üye]`","`a!leaderboard`","`a!sunucubilgi`","`a!avatar [@üye]`"].join("\n"), inline:false },
        )
        .setFooter({text:`${message.guild.name} • Yapımcı: axel_ey 👑`, iconURL:message.guild.iconURL({dynamic:true})})
        .setTimestamp(),
    ]});
  }

  // ── PING ───────────────────────────────────────────────────────────────────
  if (command === "ping") {
    return message.reply({ embeds: [new EmbedBuilder().setColor("Green")
      .setDescription(`🏓 Gecikme: **${Date.now()-message.createdTimestamp}ms** | WS: **${client.ws.ping}ms**`)] });
  }

  // ── LEVEL ──────────────────────────────────────────────────────────────────
  if (command === "level" || command === "xp") {
    const target = message.mentions.members.first() || message.member;
    const key    = `${message.guild.id}_${target.id}`;
    const ud     = userLevels.get(key) || { xp: 0, level: 1 };
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color || "Purple")
        .setTitle("📊 Level Bilgisi")
        .addFields({name:"Level",value:`${ud.level}`,inline:true},{name:"XP",value:`${ud.xp}/${ud.level*100}`,inline:true},{name:"Eksik",value:`${ud.level*100-ud.xp}`,inline:true})
        .setThumbnail(target.user.displayAvatarURL({dynamic:true})).setTimestamp(),
    ]});
  }

  if (command === "levelkanal" || command === "seviyekanal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("🚫 Yetkin yok!");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply("Kanal etiketle!");
    levelChannels.set(message.guild.id, ch.id); saveData(levelChannelsFile, levelChannels);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Seviye Kanalı Ayarlandı").setDescription(`Tebrik mesajları artık ${ch} kanalına gönderilecek!`).setTimestamp()] });
  }

  // ── SEVİYE ROL SİSTEMİ ─────────────────────────────────────────────────────
  if (command === "seviyerol") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const role = message.mentions.roles.first(), level = parseInt(args[1]);
    if (!role||!level||level<1) return message.reply("Kullanım: `a!seviyerol @rol <seviye>`");
    const gr = levelRolesMap.get(message.guild.id) || {};
    gr[String(level)] = role.id; levelRolesMap.set(message.guild.id, gr); saveData(levelRolesFile, levelRolesMap);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Seviye Rolü Ayarlandı").setDescription(`**${level}. seviye**ye ulaşanlar ${role} alacak!`).setTimestamp()] });
  }

  if (command === "seviyeroller") {
    const gr = levelRolesMap.get(message.guild.id) || {};
    const entries = Object.entries(gr).sort((a,b)=>parseInt(a[0])-parseInt(b[0]));
    if (entries.length === 0) return message.reply("Seviye rolü ayarlanmamış.");
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("#5865F2").setTitle("📋 Seviye Rolleri").setDescription(entries.map(([l,r])=>`**Seviye ${l}** → <@&${r}>`).join("\n")).setTimestamp()] });
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (command === "leaderboard" || command === "lb" || command === "sıralama") {
    const guildId = message.guild.id, lvlData = [], coinData = [];
    for (const [k,d] of userLevels.entries()) {
      if (!k.startsWith(guildId+"_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); lvlData.push({username:u.username,level:d.level,xp:d.xp}); } catch {}
    }
    for (const [k,coins] of userCoinsMap.entries()) {
      if (!k.startsWith(guildId+"_")) continue;
      try { const u = await client.users.fetch(k.split("_")[1]); coinData.push({username:u.username,coins}); } catch {}
    }
    lvlData.sort((a,b)=>b.level!==a.level?b.level-a.level:b.xp-a.xp);
    coinData.sort((a,b)=>b.coins-a.coins);
    const medal = i=>i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("🏆 Liderlik Tablosu")
        .addFields(
          {name:"📊 Level", value:lvlData.slice(0,10).map((u,i)=>`${medal(i)} **${u.username}** — Lv${u.level} (${u.xp}XP)`).join("\n")||"Veri yok", inline:false},
          {name:"💰 Hunter Bucks", value:coinData.slice(0,10).map((u,i)=>`${medal(i)} **${u.username}** — ${formatCoins(u.coins)}`).join("\n")||"Veri yok", inline:false},
        ).setFooter({text:message.guild.name}).setTimestamp(),
    ]});
  }

  // ── EKONOMİ ────────────────────────────────────────────────────────────────
  const econCmds = ["bakiye","balance","bal","hbver","transfer","daily","work"];
  if (econCmds.includes(command) && isHbEngel(message.guild.id, message.channel.id))
    return message.reply("🚫 Bu kanalda ekonomi komutları devre dışı!");

  if (command === "bakiye" || command === "balance" || command === "bal") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Gold").setTitle("💰 Hunter Bucks Bakiye")
        .setDescription(`${target.user.tag}: **${formatCoins(getCoins(target.id, message.guild.id))}**`)
        .setThumbnail(target.user.displayAvatarURL({dynamic:true})).setTimestamp(),
    ]});
  }

  if (command === "hbver" || command === "transfer") {
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi etiketle!");
    if (target.id === message.author.id) return message.reply("Kendine HB gönderemezsin!");
    if (target.user.bot) return message.reply("Botlara HB gönderilemez!");
    const miktar = parseInt(args[1]);
    if (!miktar||miktar<1) return message.reply("Geçerli miktar gir.");
    const senderBal = getCoins(message.author.id, message.guild.id);
    if (senderBal < miktar) return message.reply(`Yetersiz! Bakiyen: **${formatCoins(senderBal)}**`);
    removeCoins(message.author.id, message.guild.id, miktar);
    addCoins(target.id, message.guild.id, miktar);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("💸 HB Transfer")
        .addFields({name:"Gönderen",value:message.author.tag,inline:true},{name:"Alan",value:target.user.tag,inline:true},{name:"Miktar",value:formatCoins(miktar),inline:true},{name:"Yeni Bakiyen",value:formatCoins(senderBal-miktar),inline:true}).setTimestamp(),
    ]});
  }

  if (command === "daily") {
    const cd = getCooldown(dailyCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd-Date.now())}** sonra tekrar dene.`);
    const amount = Math.floor(Math.random()*500)+100;
    addCoins(message.author.id, message.guild.id, amount);
    setCooldown(dailyCooldowns, message.author.id, message.guild.id, 24*60*60*1000);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Green").setTitle("🎁 Günlük Ödül!").setDescription(`Günlük ödülün: **${formatCoins(amount)}**`).setFooter({text:"24 saat sonra tekrar gelebilirsin!"}).setTimestamp()] });
  }

  if (command === "work") {
    const cd = getCooldown(workCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ **${formatTime(cd-Date.now())}** sonra tekrar çalışabilirsin.`);
    const works = ["🍕 Pizza dağıttın","💻 Kod yazdın","🚗 Uber sürücüsü oldun","📚 Ders verdin","🎵 Müzik yaptın","🎨 Tasarım yaptın","📱 Uygulama geliştirdin","🎮 Oyun test ettin","🏪 Kasiyerlik yaptın","🧹 Temizlik yaptın"];
    const work = works[Math.floor(Math.random()*works.length)];
    const earned = Math.floor(Math.random()*150)+50;
    addCoins(message.author.id, message.guild.id, earned);
    setCooldown(workCooldowns, message.author.id, message.guild.id, 60*60*1000);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Blue").setTitle("💼 Çalışma Tamamlandı!").setDescription(`${work} ve **${formatCoins(earned)}** kazandın!`).setFooter({text:"1 saat sonra tekrar çalışabilirsin!"}).setTimestamp()] });
  }

  if (command === "hbayarla") {
    if (message.author.id !== OWNER_ID) return;
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const miktar = parseInt(message.mentions.users.size > 0 ? args[1] : args[1]);
    if (isNaN(miktar)||miktar<0) return message.reply("Geçerli miktar gir.");
    setCoins(target.id, message.guild.id, miktar);
    saveData(userCoinsFile, userCoinsMap);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Gold").setTitle("✅ HB Ayarlandı").setDescription(`${target.user.tag} kullanıcısının bakiyesi **${formatCoins(miktar)}** oldu.`).setTimestamp()] });
  }

  // ── MAĞAZA ─────────────────────────────────────────────────────────────────
  if (command === "shop" || command === "mağaza" || command === "magaza") {
    const colors   = SHOP_ITEMS.filter(i=>i.type==="color");
    const badges   = SHOP_ITEMS.filter(i=>i.type==="badge");
    const bgs      = SHOP_ITEMS.filter(i=>i.type==="background");
    const specials = SHOP_ITEMS.filter(i=>i.type==="bio"||i.type==="ozel_rol");
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("#FFD700").setTitle("🛒 Hunter Bucks Mağazası")
        .setDescription("Satın almak için: `a!satinal <ürün_id>`\nEnvanter: `a!envanter`")
        .addFields(
          {name:"🎨 Profil Renkleri", value:colors.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"), inline:false},
          {name:"🏅 Rozetler",        value:badges.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"), inline:false},
          {name:"🖼️ Arkaplanlar",    value:bgs.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`).join("\n"), inline:false},
          {name:"✨ Özel",            value:specials.map(i=>`\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**\n↳ ${i.desc}`).join("\n"), inline:false},
        ).setFooter({text:`Bakiyen: ${formatCoins(getCoins(message.author.id, message.guild.id))}`}).setTimestamp(),
    ]});
  }

  if (command === "satinal") {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply("Ürün ID gir. `a!shop` ile bak.");
    const item = getShopItem(itemId);
    if (!item) return message.reply(`❌ \`${itemId}\` adlı ürün bulunamadı.`);

    if (item.type === "ozel_rol") {
      if (hasItem(message.author.id, message.guild.id, itemId)) return message.reply("Zaten özel rolüne sahipsin!");
      const bal = getCoins(message.author.id, message.guild.id);
      if (bal < item.price) return message.reply(`Yetersiz! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`);
      await message.channel.send({ embeds: [new EmbedBuilder().setColor("#FFD700").setTitle("✨ Özel Rol").setDescription(`${message.author} rolünün **adı** ne olsun? *(30sn)*`).setTimestamp()] });
      const nameFilter = m => m.author.id === message.author.id;
      const nameColl = await message.channel.awaitMessages({filter:nameFilter,max:1,time:30000,errors:["time"]}).catch(()=>null);
      if (!nameColl||nameColl.size===0) return message.channel.send("⏰ Süre doldu, satın alma iptal.");
      const roleName = nameColl.first().content.slice(0,50);
      const ROLE_COLORS = {"kırmızı":"#E74C3C","mavi":"#3498DB","yeşil":"#2ECC71","sarı":"#FFD700","mor":"#9B59B6","turuncu":"#E67E22","pembe":"#FF69B4","siyah":"#23272A","beyaz":"#ECEFF1","turkuaz":"#1ABC9C","lacivert":"#1A237E","gri":"#95A5A6"};
      await message.channel.send({ embeds: [new EmbedBuilder().setColor("#FFD700").setDescription(`Rol adı: **${roleName}**\n\nRengi ne olsun?\n${Object.keys(ROLE_COLORS).join(", ")}`)] });
      const colorColl = await message.channel.awaitMessages({filter:nameFilter,max:1,time:30000,errors:["time"]}).catch(()=>null);
      if (!colorColl||colorColl.size===0) return message.channel.send("⏰ Süre doldu, satın alma iptal.");
      const colorKey = colorColl.first().content.toLowerCase().trim(), colorHex = ROLE_COLORS[colorKey];
      if (!colorHex) return message.channel.send(`❌ \`${colorKey}\` geçerli renk değil. İptal edildi.`);
      try {
        const newRole = await message.guild.roles.create({name:roleName,color:colorHex,reason:`Özel rol — ${message.author.tag}`});
        await message.member.roles.add(newRole);
        removeCoins(message.author.id, message.guild.id, item.price);
        getInventory(message.author.id, message.guild.id).push(itemId);
        saveData(userInventoryFile, userInventory);
        return message.channel.send({ embeds: [new EmbedBuilder().setColor(colorHex).setTitle("✨ Özel Rol Oluşturuldu!").setDescription(`${message.author} artık **${roleName}** rolüne sahip!`).setFooter({text:`${formatCoins(item.price)} harcandı.`}).setTimestamp()] });
      } catch { return message.channel.send("❌ Rol oluşturulamadı."); }
    }

    if (hasItem(message.author.id, message.guild.id, itemId)) return message.reply("Bu ürüne zaten sahipsin!");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < item.price) return message.reply(`Yetersiz! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`);
    removeCoins(message.author.id, message.guild.id, item.price);
    getInventory(message.author.id, message.guild.id).push(itemId);
    saveData(userInventoryFile, userInventory);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Green").setTitle("✅ Satın Alma Başarılı!").setDescription(`${item.name} satın aldın!\n${item.desc}`)
        .addFields({name:"Ödenen",value:formatCoins(item.price),inline:true},{name:"Kalan",value:formatCoins(bal-item.price),inline:true})
        .setFooter({text:"Kullanmak için: a!profilayarla"}).setTimestamp(),
    ]});
  }

  if (command === "envanter") {
    const target = message.mentions.members.first() || message.member;
    const inv    = getInventory(target.id, message.guild.id);
    if (inv.length === 0) return message.reply(`${target.user.tag} adlı kullanıcının envanteri boş.`);
    const grouped = {color:[],badge:[],bio:[],ozel_rol:[],background:[]};
    for (const id of inv) { const item=getShopItem(id); if(item) grouped[item.type]?.push(item); }
    const fields = [];
    if (grouped.color.length)      fields.push({name:"🎨 Renkler",     value:grouped.color.map(i=>`${i.name} (\`${i.id}\`)`).join("\n"),      inline:false});
    if (grouped.badge.length)      fields.push({name:"🏅 Rozetler",    value:grouped.badge.map(i=>`${i.name} (\`${i.id}\`)`).join("\n"),      inline:false});
    if (grouped.background.length) fields.push({name:"🖼️ Arkaplanlar", value:grouped.background.map(i=>`${i.name} (\`${i.id}\`)`).join("\n"), inline:false});
    if (grouped.bio.length)        fields.push({name:"✨ Özel",        value:"Bio kilidi aktif",                                               inline:false});
    if (grouped.ozel_rol.length)   fields.push({name:"👑 Özel Rol",    value:"Özel role sahipsin!",                                            inline:false});
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color||"#5865F2")
        .setTitle(`🎒 ${target.user.tag} — Envanter`).setThumbnail(target.user.displayAvatarURL({dynamic:true}))
        .addFields(...fields).setFooter({text:"Kullanmak için: a!profilayarla renk/rozet/bio/arkaplan <değer>"}).setTimestamp(),
    ]});
  }

  if (command === "profilayarla" || command === "profil-ayarla") {
    const sub  = args[0]?.toLowerCase();
    const val  = args.slice(1).join(" ");
    const prof = getProfile(message.author.id, message.guild.id);
    const inv  = getInventory(message.author.id, message.guild.id);
    if (!sub) return message.reply(["`a!profilayarla renk <id>`","`a!profilayarla rozet <id>`","`a!profilayarla bio <metin>`","`a!profilayarla arkaplan <id>`"].join("\n"));
    if (sub==="renk"||sub==="color") {
      const itemId=val.toLowerCase();
      if (!inv.includes(itemId)) return message.reply(`Bu rengi almadın! \`a!satinal ${itemId}\``);
      const item=getShopItem(itemId); if(!item||item.type!=="color") return message.reply("Geçerli renk ID gir.");
      prof.color=item.value; saveData(userProfilesFile,userProfiles); return message.reply(`✅ Profil rengin **${item.name}** oldu!`);
    }
    if (sub==="rozet"||sub==="badge") {
      const itemId=val.toLowerCase();
      if (itemId==="kaldır"||itemId==="kaldir") { prof.activeBadge=""; saveData(userProfilesFile,userProfiles); return message.reply("✅ Rozet kaldırıldı."); }
      if (!inv.includes(itemId)) return message.reply(`Bu rozeti almadın! \`a!satinal ${itemId}\``);
      const item=getShopItem(itemId); if(!item||item.type!=="badge") return message.reply("Geçerli rozet ID gir.");
      prof.activeBadge=item.value; saveData(userProfilesFile,userProfiles); return message.reply(`✅ Aktif rozetin **${item.name}** oldu!`);
    }
    if (sub==="bio") {
      if (!inv.includes("bio_unlock")) return message.reply("Bio için önce `a!satinal bio_unlock` satın al!");
      if (!val) return message.reply("Bio metni gir.");
      if (val.length>100) return message.reply("Bio en fazla 100 karakter!");
      prof.bio=val; saveData(userProfilesFile,userProfiles); return message.reply("✅ Bio güncellendi!");
    }
    if (sub==="arkaplan"||sub==="bg"||sub==="background") {
      const itemId=val.toLowerCase();
      if (!inv.includes(itemId)) return message.reply(`Bu arkaplanı almadın! \`a!satinal ${itemId}\``);
      const item=getShopItem(itemId); if(!item||item.type!=="background") return message.reply("Geçerli arkaplan ID gir.");
      prof.background=item.value; saveData(userProfilesFile,userProfiles); return message.reply(`✅ Arkaplanın **${item.name}** oldu!`);
    }
    return message.reply("Geçerli seçenekler: `renk`, `rozet`, `bio`, `arkaplan`");
  }

  // ── PROFİL (Canvas) ────────────────────────────────────────────────────────
  if (command === "profil") {
    const target  = message.mentions.members.first() || message.member;
    const key     = `${message.guild.id}_${target.id}`;
    const ud      = userLevels.get(key) || { xp: 0, level: 1 };
    const coins   = getCoins(target.id, message.guild.id);
    const prof    = getProfile(target.id, message.guild.id);
    const loading = await message.channel.send("🎨 Profil kartı oluşturuluyor...");
    try {
      const imageBuffer = await generateProfileCard(target, ud, coins, prof);
      const attachment  = new AttachmentBuilder(imageBuffer, { name: "profil.png" });
      await loading.delete().catch(() => {});
      return message.channel.send({ files: [attachment] });
    } catch (err) {
      console.error("Profil canvas hatası:", err);
      await loading.delete().catch(() => {});
      // Embed fallback
      return message.channel.send({ embeds: [
        new EmbedBuilder().setColor(prof.color||"#5865F2")
          .setTitle(`${prof.activeBadge ? prof.activeBadge+" ":""}${target.user.tag} — Profil`)
          .setThumbnail(target.user.displayAvatarURL({dynamic:true,size:256}))
          .setDescription(`*${prof.bio||"Bio yok"}*`)
          .addFields(
            {name:"⭐ Level",value:`${ud.level}`,inline:true},{name:"✨ XP",value:`${ud.xp}/${ud.level*100}`,inline:true},
            {name:"💰 HB",value:formatCoins(coins),inline:true},{name:"🏅 Rozet",value:prof.activeBadge||"Yok",inline:true},
          ).setTimestamp(),
      ]});
    }
  }

  // ── İSTATİSTİK ────────────────────────────────────────────────────────────
  if (command === "istatistik" || command === "stats") {
    const target = message.mentions.members.first() || message.member;
    const stats  = getStats(target.id, message.guild.id);
    checkAndResetStats(stats);
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor(getProfile(target.id, message.guild.id).color||"#5865F2")
        .setTitle(`📊 ${target.user.tag} — İstatistikler`).setThumbnail(target.user.displayAvatarURL({dynamic:true}))
        .addFields(
          {name:`📅 Bu Hafta`,value:[`💬 ${stats.weekly.messages.toLocaleString()} mesaj`,`🔊 ${formatDuration(stats.weekly.voiceMinutes)}`].join("\n"),inline:true},
          {name:`🗓️ Bu Ay`,value:[`💬 ${stats.monthly.messages.toLocaleString()} mesaj`,`🔊 ${formatDuration(stats.monthly.voiceMinutes)}`].join("\n"),inline:true},
        ).setTimestamp(),
    ]});
  }

  // ── SUNUCU BİLGİ ──────────────────────────────────────────────────────────
  if (command === "sunucubilgi") {
    const { guild } = message;
    return message.channel.send({ embeds: [
      new EmbedBuilder().setColor("Blue").setTitle(`📋 ${guild.name}`)
        .setThumbnail(guild.iconURL({dynamic:true}))
        .addFields({name:"Üye",value:`${guild.memberCount}`,inline:true},{name:"Kanal",value:`${guild.channels.cache.size}`,inline:true},{name:"Rol",value:`${guild.roles.cache.size}`,inline:true},{name:"Kuruluş",value:guild.createdAt.toDateString(),inline:true},{name:"Sahip",value:`<@${guild.ownerId}>`,inline:true},{name:"Boost",value:`Lv${guild.premiumTier} (${guild.premiumSubscriptionCount||0})`,inline:true})
        .setTimestamp(),
    ]});
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  if (command === "avatar") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("Blue").setTitle(`${target.user.tag} — Avatar`).setImage(target.user.displayAvatarURL({dynamic:true,size:512}))] });
  }

  // ── OYUNLAR ────────────────────────────────────────────────────────────────
  const gameCmds = ["slot","coinflip","cf","dice","hunt","fish","rob","roulette","blackjack","bj","sans","şans"];
  if (gameCmds.includes(command) && isHbEngel(message.guild.id, message.channel.id))
    return message.reply("🚫 Bu kanalda oyunlar devre dışı!");

  if (command === "slot") {
    const amount=parseInt(args[0]);
    if (!amount||amount<1) return message.reply("Örnek: `a!slot 100`");
    const bal=getCoins(message.author.id,message.guild.id);
    if (bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const symbols=["🍒","🍋","🍊","🍇","⭐","💎"];
    const result=[0,1,2].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);
    let multiplier=0;
    if(result[0]===result[1]&&result[1]===result[2]) multiplier=result[0]==="💎"?10:result[0]==="⭐"?5:3;
    else if(result[0]===result[1]||result[1]===result[2]||result[0]===result[2]) multiplier=1.5;
    let resultText,color;
    if(multiplier>0){const win=Math.floor(amount*multiplier);addCoins(message.author.id,message.guild.id,win-amount);resultText=`🎉 Kazandın! **${formatCoins(win)}**`;color="Green";}
    else{removeCoins(message.author.id,message.guild.id,amount);resultText=`😢 Kaybettin! **${formatCoins(amount)}** gitti.`;color="Red";}
    return message.channel.send({embeds:[new EmbedBuilder().setColor(color).setTitle("🎰 Slot Machine").setDescription(`${result.join(" | ")}\n\n${resultText}`).setTimestamp()]});
  }

  if (command==="coinflip"||command==="cf") {
    const amount=parseInt(args[0]),choice=args[1]?.toLowerCase();
    if(!amount||amount<1) return message.reply("Örnek: `a!coinflip 100 yazı`");
    if(!choice||(choice!=="yazı"&&choice!=="tura")) return message.reply("Yazı veya tura seç!");
    const bal=getCoins(message.author.id,message.guild.id);
    if(bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const result=Math.random()<0.5?"yazı":"tura";const won=choice===result;
    if(won) addCoins(message.author.id,message.guild.id,amount);
    else removeCoins(message.author.id,message.guild.id,amount);
    return message.channel.send({embeds:[new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🪙 Coinflip").setDescription(`Sonuç: **${result}** | Seçimin: **${choice}**\n\n${won?`🎉 Kazandın! **${formatCoins(amount*2)}**`:`😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`).setTimestamp()]});
  }

  if (command==="dice") {
    const amount=parseInt(args[0]),guess=parseInt(args[1]);
    if(!amount||amount<1) return message.reply("Örnek: `a!dice 100 3`");
    if(!guess||guess<1||guess>6) return message.reply("1-6 arası tahmin gir!");
    const bal=getCoins(message.author.id,message.guild.id);
    if(bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const result=Math.floor(Math.random()*6)+1;const won=guess===result;
    if(won) addCoins(message.author.id,message.guild.id,amount*5);
    else removeCoins(message.author.id,message.guild.id,amount);
    return message.channel.send({embeds:[new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🎲 Zar").setDescription(`Zar: **${result}** | Tahmin: **${guess}**\n\n${won?`🎉 Kazandın! **${formatCoins(amount*5)}**`:`😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`).setTimestamp()]});
  }

  if (command==="hunt") {
    const animals=[{name:"🐰 Tavşan",value:50},{name:"🦌 Geyik",value:100},{name:"🐗 Domuz",value:150},{name:"🐺 Kurt",value:200},{name:"🐻 Ayı",value:300},{name:"🦁 Aslan",value:500},{name:"🐉 Ejderha",value:1000}];
    if(Math.random()<0.7){const a=animals[Math.floor(Math.random()*animals.length)];addCoins(message.author.id,message.guild.id,a.value);return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("🏹 Avlanma Başarılı!").setDescription(`${a.name} yakaladın! **${formatCoins(a.value)}** kazandın.`).setTimestamp()]});}
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Red").setTitle("🏹 Avlanma Başarısız!").setDescription("Hiçbir şey yakalayamadın!").setTimestamp()]});
  }

  if (command==="fish") {
    const fishes=[{name:"🐟 Küçük Balık",value:30},{name:"🐠 Renkli Balık",value:60},{name:"🦈 Köpekbalığı",value:200},{name:"🐋 Balina",value:400},{name:"🦑 Ahtapot",value:100},{name:"🦀 Yengeç",value:80},{name:"🐙 Dev Ahtapot",value:600}];
    if(Math.random()<0.8){const f=fishes[Math.floor(Math.random()*fishes.length)];addCoins(message.author.id,message.guild.id,f.value);return message.channel.send({embeds:[new EmbedBuilder().setColor("Blue").setTitle("🎣 Balık Tutma Başarılı!").setDescription(`${f.name} tuttun! **${formatCoins(f.value)}** kazandın.`).setTimestamp()]});}
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Gray").setTitle("🎣 Balık Tutma Başarısız!").setDescription("Hiçbir balık tutamadın!").setTimestamp()]});
  }

  if (command==="rob") {
    const cd = getCooldown(robCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now()) return message.reply(`⏰ Soygun için **${formatTime(cd-Date.now())}** bekle.`);
    const target=message.mentions.members.first();
    if(!target) return message.reply("Kimi soyacaksın? Etiketle!");
    if(target.id===message.author.id) return message.reply("Kendini soyamazsın!");
    if(target.user.bot) return message.reply("Botları soyamazsın!");
    const targetBal=getCoins(target.id,message.guild.id);
    if(targetBal<50) return message.reply(`${target.user.tag} adlı kullanıcının soymaya değer parası yok!`);
    setCooldown(robCooldowns, message.author.id, message.guild.id, 2*60*60*1000);
    if(Math.random()<0.35){
      const stolen=Math.floor(targetBal*(Math.random()*0.3+0.1));
      removeCoins(target.id,message.guild.id,stolen);addCoins(message.author.id,message.guild.id,stolen);
      return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("🦹 Soygun Başarılı!").setDescription(`${target.user.tag} kullanıcısından **${formatCoins(stolen)}** çaldın!`).setFooter({text:"Sonraki soygun: 2 saat sonra"}).setTimestamp()]});
    } else {
      const fine=Math.floor(Math.min(getCoins(message.author.id,message.guild.id)*0.2,500));
      removeCoins(message.author.id,message.guild.id,fine);addCoins(target.id,message.guild.id,fine);
      return message.channel.send({embeds:[new EmbedBuilder().setColor("Red").setTitle("🚔 Yakalandın!").setDescription(`Soygun başarısız! Ceza: **${formatCoins(fine)}** ${target.user.tag} adlı kullanıcıya gitti.`).setFooter({text:"Sonraki soygun: 2 saat sonra"}).setTimestamp()]});
    }
  }

  if (command==="roulette") {
    const amount=parseInt(args[0]),bet=args[1]?.toLowerCase();
    if(!amount||amount<1) return message.reply("Örnek: `a!roulette 100 kırmızı`");
    if(!bet||!["kırmızı","siyah","yeşil"].includes(bet)) return message.reply("Seçenekler: `kırmızı`, `siyah`, `yeşil`");
    const bal=getCoins(message.author.id,message.guild.id);
    if(bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const num=Math.floor(Math.random()*37);
    const resultColor=num===0?"yeşil":num%2===0?"siyah":"kırmızı";
    const won=bet===resultColor,multiplier=bet==="yeşil"?14:2;
    const colorEmoji={"kırmızı":"🔴","siyah":"⚫","yeşil":"🟢"};
    if(won) addCoins(message.author.id,message.guild.id,amount*(multiplier-1));
    else removeCoins(message.author.id,message.guild.id,amount);
    return message.channel.send({embeds:[new EmbedBuilder().setColor(won?"Green":"Red").setTitle("🎡 Rulet")
      .addFields({name:"Sonuç",value:`${colorEmoji[resultColor]} **${num}** (${resultColor})`,inline:true},{name:"Seçimin",value:`${colorEmoji[bet]} ${bet}`,inline:true},{name:won?"Kazandın!":"Kaybettin!",value:won?`**+${formatCoins(amount*(multiplier-1))}**`:`**-${formatCoins(amount)}**`,inline:true})
      .setFooter({text:"Yeşil seçersen 14x kazanırsın!"}).setTimestamp()]});
  }

  if (command==="blackjack"||command==="bj") {
    const amount=parseInt(args[0]);
    if(!amount||amount<1) return message.reply("Örnek: `a!blackjack 100`");
    const bal=getCoins(message.author.id,message.guild.id);
    if(bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const deck=()=>{const cards=[2,3,4,5,6,7,8,9,10,10,10,10,11];return cards[Math.floor(Math.random()*cards.length)];};
    const handValue=hand=>{let s=hand.reduce((a,b)=>a+b,0),a=hand.filter(c=>c===11).length;while(s>21&&a>0){s-=10;a--;}return s;};
    const ph=[deck(),deck()],dh=[deck(),deck()];
    while(handValue(dh)<17) dh.push(deck());
    const pv=handValue(ph),dv=handValue(dh);
    let result,color;
    if(pv>21){result=`😢 Battın! (${pv}) **-${formatCoins(amount)}**`;removeCoins(message.author.id,message.guild.id,amount);color="Red";}
    else if(dv>21||pv>dv){result=`🎉 Kazandın! (${pv} vs ${dv}) **+${formatCoins(amount)}**`;addCoins(message.author.id,message.guild.id,amount);color="Green";}
    else if(pv===dv){result=`🤝 Beraberlik! (${pv}) Bakiyen iade edildi.`;color="Yellow";}
    else{result=`😢 Kaybettin! (${pv} vs ${dv}) **-${formatCoins(amount)}**`;removeCoins(message.author.id,message.guild.id,amount);color="Red";}
    return message.channel.send({embeds:[new EmbedBuilder().setColor(color).setTitle("🃏 Blackjack")
      .addFields({name:"Senin El",value:`${ph.join("+")} = **${pv}**`,inline:true},{name:"Dealer El",value:`${dh.join("+")} = **${dv}**`,inline:true},{name:"Sonuç",value:result,inline:false})
      .setTimestamp()]});
  }

  if (command==="sans"||command==="şans") {
    const amount=parseInt(args[0]);
    if(!amount||amount<1) return message.reply("Örnek: `a!sans 100`");
    const bal=getCoins(message.author.id,message.guild.id);
    if(bal<amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const segments=[{label:"💀 Hepsini Kaybettin!",multiplier:0,color:"DarkRed"},{label:"😢 Yarısını Kaybettin",multiplier:0.5,color:"Red"},{label:"🤝 Başa Baş",multiplier:1,color:"Yellow"},{label:"✨ 1.5x!",multiplier:1.5,color:"Green"},{label:"🎉 2x!",multiplier:2,color:"Green"},{label:"🔥 3x!",multiplier:3,color:"Gold"},{label:"💎 5x!",multiplier:5,color:"Aqua"},{label:"👑 10x JACKPOT!",multiplier:10,color:"Gold"}];
    const weights=[15,20,20,20,12,7,4,2];
    let rand=Math.random()*100,cum=0,chosen=segments[0];
    for(let i=0;i<segments.length;i++){cum+=weights[i];if(rand<cum){chosen=segments[i];break;}}
    const payout=Math.floor(amount*chosen.multiplier),diff=payout-amount;
    if(diff>=0) addCoins(message.author.id,message.guild.id,diff);
    else removeCoins(message.author.id,message.guild.id,Math.abs(diff));
    return message.channel.send({embeds:[new EmbedBuilder().setColor(chosen.color).setTitle("🎡 Şans Çarkı")
      .addFields({name:"Sonuç",value:chosen.label,inline:true},{name:"Bahis",value:formatCoins(amount),inline:true},{name:diff>=0?"Kazandın":"Kaybettin",value:`**${diff>=0?"+":""}${formatCoins(Math.abs(diff))}**`,inline:true})
      .setTimestamp()]});
  }

  // ── YAZ (sadece owner) ─────────────────────────────────────────────────────
  if (command === "yaz") {
    if (message.author.id !== OWNER_ID) return;
    let targetChannel = message.mentions.channels.first();
    const text = targetChannel ? args.slice(1).join(" ") : args.join(" ");
    if (!targetChannel) targetChannel = message.channel;
    if (!text) return message.reply("Ne yazayım?");
    try { await message.delete().catch(()=>{}); await targetChannel.send(text); } catch { return message.reply("❌ Mesaj gönderilemedi."); }
    return;
  }

  // ── MOD ROL AYARLARI ────────────────────────────────────────────────────────
  const modRolCommands = {warnrol:"warn",banrol:"ban",kickrol:"kick",muterol:"mute",temizlerol:"temizle"};
  if (modRolCommands[command]) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const role=message.mentions.roles.first();
    if(!role) return message.reply(`Rol etiketle! Örnek: \`a!${command} @Moderatör\``);
    const gr=modRolesMap.get(message.guild.id)||{};
    gr[modRolCommands[command]]=role.id; modRolesMap.set(message.guild.id,gr); saveData(modRolesFile,modRolesMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Mod Rolü Ayarlandı").setDescription(`**${modRolCommands[command]}** komutu artık ${role} tarafından kullanılabilir.`).setTimestamp()]});
  }

  if (command==="modroller") {
    const gr=modRolesMap.get(message.guild.id)||{};
    const lines=["ban","kick","mute","warn","temizle"].map(k=>`**${k}** → ${gr[k]?`<@&${gr[k]}>`:"*Ayarlanmadı*"}`);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("#5865F2").setTitle("⚙️ Mod Rolleri").setDescription(lines.join("\n")).setTimestamp()]});
  }

  // ── LOG AYARLARI ────────────────────────────────────────────────────────────
  const logTypes = {ses:"🔊 Ses Logu",davet:"📥 Davet Logu",mesaj:"✏️ Mesaj Logu"};

  if (command==="logayarla") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const type=args[0]?.toLowerCase();
    if(!logTypes[type]) return message.reply("Geçerli türler: `ses`, `davet`, `mesaj`");
    const ch=message.mentions.channels.first();
    if(!ch) return message.reply(`Kanal etiketle! \`a!logayarla ${type} #kanal\``);
    const settings=getLogSettings(message.guild.id);
    settings[type]={enabled:true,channelId:ch.id}; logSettingsMap.set(message.guild.id,settings); saveData(logSettingsFile,logSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Log Ayarlandı").setDescription(`${logTypes[type]} artık ${ch} kanalına gidiyor.`).setTimestamp()]});
  }
  if (command==="logkapat") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const type=args[0]?.toLowerCase(); if(!logTypes[type]) return message.reply("Geçerli: `ses`, `davet`, `mesaj`");
    const settings=getLogSettings(message.guild.id); settings[type].enabled=false; logSettingsMap.set(message.guild.id,settings); saveData(logSettingsFile,logSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Red").setTitle("🔕 Log Kapatıldı").setDescription(`${logTypes[type]} kapalı.`).setTimestamp()]});
  }
  if (command==="logac"||command==="logaç") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const type=args[0]?.toLowerCase(); if(!logTypes[type]) return message.reply("Geçerli: `ses`, `davet`, `mesaj`");
    const settings=getLogSettings(message.guild.id);
    if(!settings[type].channelId) return message.reply(`Önce kanal ayarla: \`a!logayarla ${type} #kanal\``);
    settings[type].enabled=true; logSettingsMap.set(message.guild.id,settings); saveData(logSettingsFile,logSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("🔔 Log Açıldı").setDescription(`${logTypes[type]} açık.`).setTimestamp()]});
  }
  if (command==="logdurum") {
    const settings=getLogSettings(message.guild.id);
    const lines=Object.entries(logTypes).map(([k,l])=>`${l}\n↳ ${settings[k].enabled?"✅ Açık":"❌ Kapalı"} | ${settings[k].channelId?`<#${settings[k].channelId}>`:"*Kanal yok*"}`);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("#5865F2").setTitle("📋 Log Durumu").setDescription(lines.join("\n\n")).setTimestamp()]});
  }

  // ── PK SİSTEMİ ─────────────────────────────────────────────────────────────
  if (command==="pk") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const sub=args[0]?.toLowerCase();
    if(!sub||!["aç","ac","kapat"].includes(sub)) return message.reply("Kullanım: `a!pk aç` veya `a!pk kapat`");
    const enabled=sub==="aç"||sub==="ac";
    pkSettingsMap.set(message.guild.id,{enabled}); saveData(pkSettingsFile,pkSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor(enabled?"Green":"Red").setTitle(enabled?"🛡️ Patlama Koruması Açıldı":"🛡️ Patlama Koruması Kapatıldı").setDescription(enabled?"5dk içinde 3+ kanal silen/düzenleyen otomatik banlanır.":"Devre dışı bırakıldı.").setTimestamp()]});
  }

  // ── HB ENGEL ────────────────────────────────────────────────────────────────
  if (command==="hbengel") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const sub=args[0]?.toLowerCase();
    if(!sub||!["aç","ac","kapat"].includes(sub)) return message.reply("Kullanım: `a!hbengel aç` veya `a!hbengel kapat`");
    const channels=hbEngelMap.get(message.guild.id)||[];
    const channelId=message.channel.id;
    if(sub==="aç"||sub==="ac"){
      if(!channels.includes(channelId)){channels.push(channelId);hbEngelMap.set(message.guild.id,channels);saveData(hbEngelFile,hbEngelMap);}
      return message.channel.send({embeds:[new EmbedBuilder().setColor("Red").setTitle("🚫 HB Engeli Açıldı").setDescription("Bu kanalda ekonomi ve oyun komutları devre dışı.").setTimestamp()]});
    } else {
      hbEngelMap.set(message.guild.id,channels.filter(c=>c!==channelId)); saveData(hbEngelFile,hbEngelMap);
      return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ HB Engeli Kaldırıldı").setDescription("Bu kanalda ekonomi ve oyun komutları tekrar aktif.").setTimestamp()]});
    }
  }

  // ── ROL OLUŞTUR ─────────────────────────────────────────────────────────────
  if (command==="rololustur") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const colorArg=args[args.length-1], isHex=/^#[0-9A-Fa-f]{6}$/.test(colorArg);
    const roleName=isHex?args.slice(0,-1).join(" "):args.join(" ");
    if(!roleName) return message.reply("Kullanım: `a!rololustur <rol adı> <#renk>` Örnek: `a!rololustur Moderatör #E74C3C`");
    try {
      const newRole=await message.guild.roles.create({name:roleName,color:isHex?colorArg:"#99AAB5",reason:`${message.author.tag} tarafından`});
      return message.channel.send({embeds:[new EmbedBuilder().setColor(isHex?colorArg:"#99AAB5").setTitle("✅ Rol Oluşturuldu").addFields({name:"Rol",value:`${newRole}`,inline:true},{name:"Renk",value:isHex?colorArg:"#99AAB5",inline:true}).setTimestamp()]});
    } catch { return message.reply("❌ Rol oluşturulamadı."); }
  }

  // ── BAŞVURU SİSTEMİ KOMUTları ─────────────────────────────────────────────
  if (command==="ytsetup") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const ch=message.mentions.channels.first();
    if(!ch) return message.reply("Kanal etiketle! Örnek: `a!ytsetup #başvurular`");
    const current=ytSettingsMap.get(message.guild.id)||{};
    const embed=new EmbedBuilder().setColor("#5865F2").setTitle("📋 Yetkili Başvurusu")
      .setDescription("Yetkili olmak istiyorsan aşağıdaki 📝 emojisine tıkla!\n\nSana özel bir kanal açılacak ve sorular sorulacak.")
      .setFooter({text:"Başvurun gizli tutulacaktır."}).setTimestamp();
    const appMsg=await ch.send({embeds:[embed]});
    await appMsg.react("📝");
    current.channelId=ch.id; current.messageId=appMsg.id; current.emoji="📝";
    if(!current.questions) current.questions={};
    ytSettingsMap.set(message.guild.id,current); saveData(ytSettingsFile,ytSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Başvuru Kanalı Kuruldu").setDescription(`${ch} kanalına başvuru mesajı gönderildi!\n\nSırada ne yapmalısın:\n1. \`a!ytsoruayarla 1 <ilk soru>\` ile soruları ekle\n2. \`a!ytdegerlendirme #kanal\` ile değerlendirme kanalını ayarla`).setTimestamp()]});
  }

  if (command==="ytsoruayarla") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const num=parseInt(args[0]), question=args.slice(1).join(" ");
    if(!num||num<1||num>20) return message.reply("Soru numarası 1-20 arası olmalı!");
    if(!question) return message.reply("Soruyu yaz! Örnek: `a!ytsoruayarla 1 Kendinizi tanıtır mısınız?`");
    const current=ytSettingsMap.get(message.guild.id)||{questions:{}};
    if(!current.questions) current.questions={};
    current.questions[String(num)]=question;
    ytSettingsMap.set(message.guild.id,current); saveData(ytSettingsFile,ytSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle(`✅ Soru ${num} Ayarlandı`).setDescription(`**Soru ${num}:** ${question}`).setTimestamp()]});
  }

  if (command==="ytdegerlendirme") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("🚫 Sadece yöneticiler!");
    const ch=message.mentions.channels.first();
    if(!ch) return message.reply("Kanal etiketle! Örnek: `a!ytdegerlendirme #değerlendirme`");
    const current=ytSettingsMap.get(message.guild.id)||{questions:{}};
    current.evalChannelId=ch.id;
    ytSettingsMap.set(message.guild.id,current); saveData(ytSettingsFile,ytSettingsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Değerlendirme Kanalı Ayarlandı").setDescription(`Başvuru sonuçları artık ${ch} kanalına gönderilecek!`).setTimestamp()]});
  }

  if (command==="ytsorular") {
    const current=ytSettingsMap.get(message.guild.id);
    if(!current||!current.questions||Object.keys(current.questions).length===0) return message.reply("Henüz soru eklenmemiş. `a!ytsoruayarla <no> <soru>` ile ekle.");
    const sorted=Object.entries(current.questions).sort((a,b)=>parseInt(a[0])-parseInt(b[0]));
    const lines=sorted.map(([n,q])=>`**Soru ${n}:** ${q}`).join("\n\n");
    return message.channel.send({embeds:[new EmbedBuilder().setColor("#5865F2").setTitle("📋 Başvuru Soruları").setDescription(lines)
      .addFields({name:"Değerlendirme Kanalı",value:current.evalChannelId?`<#${current.evalChannelId}>`:"*Ayarlanmadı*",inline:true},{name:"Başvuru Kanalı",value:current.channelId?`<#${current.channelId}>`:"*Ayarlanmadı*",inline:true})
      .setTimestamp()]});
  }

  // ── WARN SİSTEMİ ────────────────────────────────────────────────────────────
  if (command==="warn") {
    if(!hasModPerm(message.member,"warn",PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Warn yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    if(target.user.bot) return message.reply("Botlara warn atamazsın!");
    const reason=args.slice(message.mentions.users.size>0?1:1).join(" ");
    if(!reason) return message.reply("Sebep belirt!");
    const warnKey=`${message.guild.id}_${target.id}`;
    if(!warningsMap.has(warnKey)) warningsMap.set(warnKey,[]);
    const warns=warningsMap.get(warnKey);
    warns.push({id:warns.length+1,reason,by:message.author.tag,timestamp:Date.now()});
    saveData(warningsFile,warningsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Orange").setTitle("⚠️ Warn Atıldı")
      .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Warn #",value:`${warns.length}`,inline:true},{name:"Sebep",value:reason})
      .setFooter({text:`Toplam ${warns.length} warn`}).setTimestamp()]});
  }

  if (command==="warnings"||command==="warnlist") {
    const target=await resolveUser(message,args)||message.member;
    const warnKey=`${message.guild.id}_${target.id}`;
    const warns=warningsMap.get(warnKey)||[];
    if(warns.length===0) return message.reply(`${target.user.tag} adlı kullanıcının hiç warni yok.`);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Orange").setTitle(`⚠️ ${target.user.tag} — Warnlar`)
      .setThumbnail(target.user.displayAvatarURL({dynamic:true}))
      .setDescription(warns.map(w=>`**#${w.id}** — ${w.reason}\n↳ *${w.by}* — ${new Date(w.timestamp).toLocaleDateString("tr-TR")}`).join("\n\n"))
      .setFooter({text:`Toplam ${warns.length} warn`}).setTimestamp()]});
  }

  if (command==="unwarn") {
    if(!hasModPerm(message.member,"warn",PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Warn silme yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    const warnKey=`${message.guild.id}_${target.id}`;
    const warns=warningsMap.get(warnKey)||[];
    if(warns.length===0) return message.reply("Bu kullanıcının warni yok.");
    const sub=args[message.mentions.users.size>0?1:1]?.toLowerCase();
    if(sub==="all"||sub==="hepsi"){warningsMap.set(warnKey,[]);saveData(warningsFile,warningsMap);return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Tüm Warnlar Silindi").setDescription(`${target.user.tag} — **${warns.length}** warn silindi.`).setTimestamp()]});}
    const warnNo=parseInt(sub);
    if(!warnNo||warnNo<1||warnNo>warns.length) return message.reply(`1-${warns.length} arası warn numarası gir veya \`all\` yaz.`);
    const removed=warns.splice(warnNo-1,1)[0];
    warns.forEach((w,i)=>{w.id=i+1;});
    warningsMap.set(warnKey,warns); saveData(warningsFile,warningsMap);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("✅ Warn Silindi")
      .addFields({name:"Kullanıcı",value:target.user.tag,inline:true},{name:"Silinen",value:`#${warnNo} — ${removed.reason}`,inline:false},{name:"Kalan",value:`${warns.length}`,inline:true}).setTimestamp()]});
  }

  // ── MODERASYON ──────────────────────────────────────────────────────────────
  if (command==="ban") {
    if(!hasModPerm(message.member,"ban",PermissionsBitField.Flags.BanMembers)) return message.reply("🚫 Ban yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    if(!target.bannable) return message.reply("🚫 Bu kullanıcıyı banlayamam!");
    const reason=args.slice(message.mentions.users.size>0?1:1).join(" ")||"Sebep belirtilmedi";
    await target.ban({reason});
    return message.channel.send({embeds:[new EmbedBuilder().setColor("DarkRed").setTitle("⛔ Kullanıcı Banlandı")
      .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp()]});
  }

  if (command==="kick") {
    if(!hasModPerm(message.member,"kick",PermissionsBitField.Flags.KickMembers)) return message.reply("🚫 Kick yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    if(!target.kickable) return message.reply("🚫 Bu kullanıcıyı kickleyemem!");
    const reason=args.slice(message.mentions.users.size>0?1:1).join(" ")||"Sebep belirtilmedi";
    await target.kick(reason);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Orange").setTitle("👢 Kullanıcı Kicklendi")
      .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Sebep",value:reason}).setTimestamp()]});
  }

  if (command==="temizle"||command==="clear"||command==="purge") {
    if(!hasModPerm(message.member,"temizle",PermissionsBitField.Flags.ManageMessages)) return message.reply("🚫 Mesaj yönetme yetkin yok!");
    const n=parseInt(args[0]);
    if(!n||n<1||n>100) return message.reply("1-100 arası sayı gir.");
    try { await message.channel.bulkDelete(n+1,true); const msg=await message.channel.send(`✅ **${n}** mesaj silindi.`); setTimeout(()=>msg.deletable&&msg.delete().catch(()=>{}),3000); }
    catch { return message.reply("❌ 14 günden eski mesajlar toplu silinemez."); }
  }

  if (command==="mute") {
    if(!hasModPerm(message.member,"mute",PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    if(!target.moderatable) return message.reply("🚫 Bu kullanıcıyı mute yapamam!");
    const ms=require("ms"), süreArg=message.mentions.users.size>0?args[1]:args[1];
    if(!süreArg) return message.reply("Süre belirt! Örnek: `a!mute @üye 10m`");
    const süreMs=ms(süreArg);
    if(!süreMs||süreMs<1000||süreMs>28*24*60*60*1000) return message.reply("Geçerli süre: 1s — 28d.");
    const reason=args.slice(message.mentions.users.size>0?2:2).join(" ")||"Sebep belirtilmedi";
    await target.timeout(süreMs,reason);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Yellow").setTitle("🔇 Mute Edildi")
      .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true},{name:"Süre",value:süreArg,inline:true},{name:"Sebep",value:reason}).setTimestamp()]});
  }

  if (command==="unmute") {
    if(!hasModPerm(message.member,"mute",PermissionsBitField.Flags.ModerateMembers)) return message.reply("🚫 Timeout kaldırma yetkin yok!");
    const target=await resolveUser(message,args);
    if(!target) return message.reply("Kullanıcı bulunamadı!");
    if(!target.moderatable) return message.reply("🚫 Bu kullanıcıyı düzenleyemem!");
    await target.timeout(null);
    return message.channel.send({embeds:[new EmbedBuilder().setColor("Green").setTitle("🔊 Mute Kaldırıldı")
      .addFields({name:"Kullanıcı",value:`${target.user.tag} (<@${target.id}>)`,inline:true},{name:"Yetkili",value:message.author.tag,inline:true}).setTimestamp()]});
  }

  // ── KANAL GİR (gizli, admin) ───────────────────────────────────────────────
  if (command==="kanalagir") {
    if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const voiceChannel=message.member.voice.channel;
    if(!voiceChannel) return message.reply("Önce ses kanalına gir!");
    try {
      const connection=joinVoiceChannel({channelId:voiceChannel.id,guildId:message.guild.id,adapterCreator:message.guild.voiceAdapterCreator,selfDeaf:true,selfMute:true});
      connection.on(VoiceConnectionStatus.Ready,()=>{message.reply(`✅ **${voiceChannel.name}** kanalına bağlandım.`);});
      connection.on("error",()=>{message.reply("❌ Ses kanalına bağlanamadım.");});
    } catch { return message.reply("❌ Bağlanılamadı."); }
    return;
  }
});

client.login(process.env.TOKEN);
