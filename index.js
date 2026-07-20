require("dotenv").config();

// 🌟 REPLIT FFMPEG ÇÖZÜMÜ: Sistemde pkgs aramaya son!
try {
  const ffmpegPath = require('ffmpeg-static');
  process.env.FFMPEG_PATH = ffmpegPath;
  console.log("✅ FFmpeg başarıyla tanımlandı:", ffmpegPath);
} catch (err) {
  console.log("❌ FFmpeg tanımlanırken hata oluştu!");
}

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  Partials,
  AttachmentBuilder,
} = require("discord.js");
const { createCanvas, loadImage, registerFont } = require('canvas');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Global Veritabanı (İsteğe göre quick.db veya veri.json yapısına bağlayabilirsin kanka)
// Yapı: userId -> { chatXp, chatLevel, voiceXp, voiceLevel }
const globalLevels = new Map();

// Ses kanallarındaki kullanıcıların giriş zamanlarını takip etmek için geçici hafıza
const voiceActiveUsers = new Map();

// Seviye atlamak için gereken XP formülü (Abartı olmaması için makul tutuldu)
const getRequiredXp = (level) => (level + 1) * 200;

// Kullanıcı verisini getiren veya yoksa oluşturan yardımcı fonksiyon
function getUserData(userId) {
  if (!globalLevels.has(userId)) {
    globalLevels.set(userId, { chatXp: 0, chatLevel: 0, voiceXp: 0, voiceLevel: 0 });
  }
  return globalLevels.get(userId);
}


const OWNER_ID = "994985345550659614";
const sansCooldown = new Map();
const gachaActive = new Set(); // Gacha animasyon kilidini tutacak

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
const fs = require("fs");
const path = require("path");
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud'); // 👈 SoundCloud eklentisi dahil edildi
const { YouTubePlugin } = require('@distube/youtube');

// 🚀 Replit Dostu Güçlü Müzik Motoru
client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(), // 👈 Replit IP banlarından etkilenmeyen kahramanımız!
    new YouTubePlugin()
  ]
});

// 📢 Şarkı Başladığında Kanala Mesaj Atar
client.distube.on("playSong", (queue, song) => {
  queue.textChannel.send(`🎶 **Şimdi Oynatılıyor:** \`${song.name}\` - \`${song.formattedDuration}\` \n👤 *İsteyen:* ${song.user}`);
});

// 📥 Sıraya Şarkı Eklendiğinde Mesaj Atar
client.distube.on("addSong", (queue, song) => {
  queue.textChannel.send(`✅ \`${song.name}\` sıraya eklendi kanka!`);
});

// ❌ Hata Oluştuğunda Botun Çökmesini Engeller
client.distube.on("error", (channel, error) => {
  console.error("Müzik Hatası:", error);
  channel.send("❌ Şarkı oynatılırken bir hata oluştu!").catch(() => {});
});







// ── Veri dosyaları ─────────────────────────────────────────────────────────────
const dataDir = "./data";
const userLevelsFile = path.join(dataDir, "userLevels.json");
const levelChannelsFile = path.join(dataDir, "levelChannels.json");
const userCoinsFile = path.join(dataDir, "userCoins.json");
const dailyCooldownsFile = path.join(dataDir, "dailyCooldowns.json");
const workCooldownsFile = path.join(dataDir, "workCooldowns.json");
const robCooldownsFile = path.join(dataDir, "robCooldowns.json");
const userProfilesFile = path.join(dataDir, "userProfiles.json");
const userInventoryFile = path.join(dataDir, "userInventory.json");
const userStatsFile = path.join(dataDir, "userStats.json");
const warningsFile = path.join(dataDir, "warnings.json");
const modRolesFile = path.join(dataDir, "modRoles.json");
const logSettingsFile = path.join(dataDir, "logSettings.json");
const pkSettingsFile = path.join(dataDir, "pkSettings.json");
const hbEngelFile = path.join(dataDir, "hbEngel.json");
const levelRolesFile = path.join(dataDir, "levelRoles.json");
const ytSettingsFile = path.join(dataDir, "ytSettings.json");
const userRebirthsFile = "./userRebirths.json";
const userRebirths = fs.existsSync(userRebirthsFile) 
  ? new Map(Object.entries(JSON.parse(fs.readFileSync(userRebirthsFile, "utf8")))) 
  : new Map();


// ── SQUAD VERİ DOSYASI ────────────────────────────────────────────────────────
const userSquadsFile = path.join(dataDir, "userSquads.json");
const userSquads = loadData(userSquadsFile);

if (fs.existsSync(userSquadsFile)) {
  try {
    let data = JSON.parse(fs.readFileSync(userSquadsFile, "utf8"));
    let userSquads = new Map(Object.entries(data));
  } catch (e) {
    console.error("Squad verisi yüklenirken hata oluştu:", e);
  }
}



// Yardımcı Squad Getirme Fonksiyonu
function getSquad(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userSquads.has(key)) userSquads.set(key, []);
  return userSquads.get(key);
}

// ⚔️ GACHA İSTATİSTİK MOTORU (Eşya adına göre benzersiz stat üretir, nadirlikle katlanır)
function getGachaStats(itemName) {
  const item = gachaItems.find(i => i.name === itemName);
  if (!item) return null;

  // İsmin karakter kodlarından benzersiz bir sayı (hash) üretiyoruz (Her eşya farklı olsun diye)
  let hash = 0;
  for (let i = 0; i < itemName.length; i++) {
    hash = itemName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const uniqueMod = Math.abs(hash % 25); // 0-24 arası eşyaya özel değişim payı

  let baseHp = 100, baseDmg = 10;
  const r = item.rarity;

  // Nadirlik çarpanları ve kademeleri
  if (r.includes("KÖTÜ"))        { baseHp = 60 + uniqueMod;       baseDmg = 6 + (uniqueMod % 5); }
  else if (r.includes("YAYGIN"))    { baseHp = 110 + uniqueMod;      baseDmg = 12 + (uniqueMod % 6); }
  else if (r.includes("SIRA DIŞI")) { baseHp = 170 + uniqueMod * 2;  baseDmg = 20 + (uniqueMod % 7); }
  else if (r.includes("ENDER"))     { baseHp = 260 + uniqueMod * 3;  baseDmg = 32 + (uniqueMod % 9); }
  else if (r.includes("DESTANSI"))  { baseHp = 420 + uniqueMod * 5;  baseDmg = 55 + (uniqueMod % 12); }
  else if (r.includes("EFSANEVİ"))  { baseHp = 750 + uniqueMod * 8;  baseDmg = 95 + (uniqueMod % 18); }
  else if (r.includes("MİTİK"))     { baseHp = 1600 + uniqueMod * 15; baseDmg = 220 + (uniqueMod % 30); }
  else if (r.includes("İLAHİ"))     { baseHp = 4800 + uniqueMod * 40; baseDmg = 700 + (uniqueMod % 60); }

  return {
    name: item.name,
    emoji: item.emoji,
    rarity: item.rarity,
    hp: baseHp,
    maxHp: baseHp,
    dmg: baseDmg
  };
}


if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);


function getRebirthData(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userRebirths.has(key)) {
    return { 
      count: 0, 
      rb: 0, 
      upgrades: { speed: 0, luck: 0, inv: 0 } // Varsayılan geliştirme seviyeleri
    };
  }
  const data = userRebirths.get(key);

  // Eğer eski kayıtlarda upgrades objesi yoksa otomatik ekle (çökmeyi önler)
  if (!data.upgrades) {
    data.upgrades = { speed: 0, luck: 0, inv: 0 };
  }
  return data;
}


function saveRebirthData(userId, guildId, data) {
  const key = `${guildId}_${userId}`;
  userRebirths.set(key, data);
  // Map'i nesneye çevirerek JSON olarak kaydediyoruz
  fs.writeFileSync(userRebirthsFile, JSON.stringify(Object.fromEntries(userRebirths), null, 2), "utf8");
}

function loadData(filePath) {
  try {
    if (fs.existsSync(filePath))
      return new Map(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch (e) {
    console.error(`Veri yüklenemedi: ${filePath}`, e);
  }
  return new Map();
}
function saveData(filePath, map) {
  try {
    fs.writeFileSync(filePath, JSON.stringify([...map]));
  } catch (e) {
    console.error(`Veri kaydedilemedi: ${filePath}`, e);
  }
}

// ── Verileri yükle ─────────────────────────────────────────────────────────────
const userLevels = loadData(userLevelsFile);
const levelChannels = loadData(levelChannelsFile);
const userCoinsMap = loadData(userCoinsFile);
const dailyCooldowns = loadData(dailyCooldownsFile);
const workCooldowns = loadData(workCooldownsFile);
const robCooldowns = loadData(robCooldownsFile);
const userProfiles = loadData(userProfilesFile);
const userInventory = loadData(userInventoryFile);
const userStats = loadData(userStatsFile);
const warningsMap = loadData(warningsFile);
const modRolesMap = loadData(modRolesFile);
const logSettingsMap = loadData(logSettingsFile);
const pkSettingsMap = loadData(pkSettingsFile);
const hbEngelMap = loadData(hbEngelFile);
const levelRolesMap = loadData(levelRolesFile);
const ytSettingsMap = loadData(ytSettingsFile);

// RAM-only
const voiceSessions = new Map();
const inviteCache = new Map();
const pkTracker = new Map();
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
  saveData(userSquadsFile, userSquads);

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
  saveData(userSquadsFile, userSquads);
}
process.on("SIGINT", () => {
  saveAll();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveAll();
  process.exit(0);
});
//

// Geçici Envanter Hafızası (Kalıcı olmasını istersen DB'ye bağlayabilirsin)
const userInventories = new Map();

// Tam 100 Eşyalık Devasa Gacha Havuzu
const gachaItems = [
  // 🔴 İLAHİ (6 Adet - %0.001 Şans)
  { name: "Kozmik İlahi Yüz", emoji: "🌌", chance: 0.001, rarity: "🔴 İLAHİ" },
  { name: "Kutsal Işık Tacı", emoji: "👑", chance: 0.001, rarity: "🔴 İLAHİ" },
  { name: "Sonsuzluk Elması", emoji: "💎", chance: 0.001, rarity: "🔴 İLAHİ" },
  { name: "Kozmos Gezgini", emoji: "🚀", chance: 0.001, rarity: "🔴 İLAHİ" },
  { name: "Mitolojik Tekboynuz", emoji: "🦄", chance: 0.001, rarity: "🔴 İLAHİ" },
  { name: "Evren Yiyen Canavar", emoji: "👾", chance: 0.001, rarity: "🔴 İLAHİ" },


  // 🔮 MİTİK (12 Adet - %0.05 Şans)
  { name: "Karanlık Derebeyi", emoji: "👺", chance: 0.05, rarity: "🔮 MİTİK" },
  { name: "Kadim Ejderha", emoji: "🐉", chance: 0.03, rarity: "🔮 MİTİK" },
  { name: "Gizemli Kahhin Küresi", emoji: "🔮", chance: 0.04, rarity: "🔮 MİTİK" },
  { name: "Yüce Nazar Muskası", emoji: "🧿", chance: 0.06, rarity: "🔮 MİTİK" },
  { name: "Anka Kuşu", emoji: "🦅", chance: 0.08, rarity: "🔮 MİTİK" },
  { name: "Gecenin Efendisi", emoji: "🧛", chance: 0.04, rarity: "🔮 MİTİK" },
  { name: "Efsanevi Samuray Kılıcı", emoji: "⚔️", chance: 0.05, rarity: "🔮 MİTİK" },
  { name: "Poseidon'un Zıpkını", emoji: "🔱", chance: 0.05, rarity: "🔮 MİTİK" },
  { name: "Kıyamet Volkanı", emoji: "🌋", chance: 0.03, rarity: "🔮 MİTİK" },
  { name: "Kara Delik Girdabı", emoji: "🌪️", chance: 0.07, rarity: "🔮 MİTİK" },
  { name: "İblis Kralı", emoji: "👹", chance: 0.04, rarity: "🔮 MİTİK" },
  { name: "Ölümün Efendisi", emoji: "💀", chance: 0.03, rarity: "🔮 MİTİK" },


  // 🟡 EFSANEVİ (20 Adet - %0.2 Şans)
  { name: "Zengin Mafya Gözlüğü", emoji: "😎", chance: 0.4, rarity: "🟡 EFSANEVİ" },
  { name: "Ağzına Kadar Dolu Para Kesesi", emoji: "💰", chance: 0.3, rarity: "🟡 EFSANEVİ" },
  { name: "Dokuz Kuyruklu Tilki", emoji: "🦊", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Satürn'ün Halkası", emoji: "🪐", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Uzaylı İstila Gemisi", emoji: "🛸", chance: 0.3, rarity: "🟡 EFSANEVİ" },
  { name: "Yıldırım Çarpması", emoji: "⚡", chance: 0.1, rarity: "🟡 EFSANEVİ" },
  { name: "Şampiyonluk Kupası", emoji: "🏆", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Ölümcül Joker Kartı", emoji: "🃏", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Gizemli Venedik Maskesi", emoji: "🎭", chance: 0.3, rarity: "🟡 EFSANEVİ" },
  { name: "Hazine Haritası", emoji: "🗺️", chance: 0.4, rarity: "🟡 EFSANEVİ" },
  { name: "Kayıp Kıta Pusulası", emoji: "🧭", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Zindan Anahtarı", emoji: "🗝️", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Uzak Doğu Tapınağı", emoji: "🏯", chance: 0.4, rarity: "🟡 EFSANEVİ" },  
  { name: "Altın Külçesi", emoji: "💴", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Aslan Kral", emoji: "🦁", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Kristal Küre", emoji: "🔮", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Sonsuzluk", emoji: "♾️", chance: 0.3, rarity: "🟡 EFSANEVİ" },
  { name: "Fatma`nın Eli", emoji: "🪬", chance: 0.2, rarity: "🟡 EFSANEVİ" },
  { name: "Gökkuşağı", emoji: "🌈", chance: 0.4, rarity: "🟡 EFSANEVİ" },
  { name: "Dolunay", emoji: "🌕", chance: 0.2, rarity: "🟡 EFSANEVİ" },


  // 🟣 DESTANSI (25 Adet - %0.8 Şans)
  { name: "Üşümüş Yüz", emoji: "🥶", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "Kuyruklu Yıldız", emoji: "☄️", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Büyük Beyaz Köpekbalığı", emoji: "🦈", chance: 0.7, rarity: "🟣 DESTANSI" },
  { name: "Bozayı", emoji: "🐻", chance: 0.9, rarity: "🟣 DESTANSI" },
  { name: "Alfa Kurt", emoji: "🐺", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Kutup Buzulu", emoji: "🧊", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "Dört Yapraklı Şans Yoncası", emoji: "🍀", chance: 0.7, rarity: "🟣 DESTANSI" },
  { name: "Mutasyon Tüpü", emoji: "🧪", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "Sihirli Asa", emoji: "🪄", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Yörünge Uydusu", emoji: "🛰️", chance: 1, rarity: "🟣 DESTANSI" },
  { name: "Sihirli Mantar", emoji: "🍄", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "Artemis'in Yayı", emoji: "🏹", chance: 0.5, rarity: "🟣 DESTANSI" },
  { name: "Şövalye Kalkanı", emoji: "🛡️", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Değerli Yakut", emoji: "♦️", chance: 0.7, rarity: "🟣 DESTANSI" },
  { name: "Eski Parşömen", emoji: "📜", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Rockstar Gitarı", emoji: "🎸", chance: 1, rarity: "🟣 DESTANSI" },
  { name: "Siberpunk Gözlük", emoji: "🥽", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "F1 Yarış Arabası", emoji: "🏎️", chance: 0.8, rarity: "🟣 DESTANSI" },
  { name: "Yanan Elmas", emoji: "🔥", chance: 0.6, rarity: "🟣 DESTANSI" },
  { name: "Kraliyet Muhafızı", emoji: "💂", chance: 0.7, rarity: "🟣 DESTANSI" },
  { name: "Para Babası", emoji: "🤑", chance: 1, rarity: "🟣 DESTANSI" },
  { name: "Parıltılar", emoji: "✨", chance: 0.9, rarity: "🟣 DESTANSI" },
  { name: "Pırlanta", emoji: "💍", chance: 0.7, rarity: "🟣 DESTANSI" },
  { name: "Altın Disk", emoji: "📀", chance: 0.9, rarity: "🟣 DESTANSI" },
  { name: "Gizemli Lahit", emoji: "⚰️", chance: 0.9, rarity: "🟣 DESTANSI" },


  // 🔵 ENDER (25 Adet - %2.0 Şans)
  { name: "Tonton Panda", emoji: "🐼", chance: 2.2, rarity: "🔵 ENDER" },
  { name: "Uykucu Koala", emoji: "🐨", chance: 2.1, rarity: "🔵 ENDER" },
  { name: "Sibirya Kaplanı", emoji: "🐯", chance: 2.6, rarity: "🔵 ENDER" },
  { name: "Bilge Baykuş", emoji: "🦉", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Dev Ahtapot", emoji: "🐙", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Kral Yengeç", emoji: "🦀", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Mavi Balina", emoji: "🐳", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "T-Rex Dinozor", emoji: "🦖", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Çöl Kaktüsü", emoji: "🌵", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Miami Palmiyesi", emoji: "🌴", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Kanada Çınarı", emoji: "🍁", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Yıldırımlı Fırtına Bulutu", emoji: "⛈️", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Ressam Paleti", emoji: "🎨", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Konsol Oyun Kolu", emoji: "🎮", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Sokak Kaykayı", emoji: "🛹", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "忍者 Ninja Maskesi", emoji: "🥷", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Altın Kulaklık", emoji: "🎧", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Kurdeleli Kalp", emoji: "💝", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Sihirbaz Şapkası", emoji: "🎩", chance: 2.0, rarity: "🔵 ENDER" },
  { name: "Dürbün", emoji: "🔭", chance: 2.6, rarity: "🔵 ENDER" },       
  { name: "Kara Kedi", emoji: "🐈‍⬛", chance: 2.2, rarity: "🔵 ENDER" },
  { name: "Kardan Adam", emoji: "☃️", chance: 2.9, rarity: "🔵 ENDER" }, 
  { name: "Dinozor Yumurtası", emoji: "🪺", chance: 2.2, rarity: "🔵 ENDER" },       
  { name: "Radyoaktif", emoji: "☢️", chance: 2.6, rarity: "🔵 ENDER" },      
  { name: "DNA", emoji: "🧬", chance: 2.6, rarity: "🔵 ENDER" },  


  // 🟢 SIRA DIŞI (20 Adet - %4.5 Şans)
  { name: "Gözleri Parıldayan Yıldız Yüz", emoji: "🤩", chance: 4.2, rarity: "🟢 SIRA DIŞI" },
  { name: "Dil Çıkaran Muzip Yüz", emoji: "😜", chance: 4.6, rarity: "🟢 SIRA DIŞI" },
  { name: "Zıpzıp Kurbağa", emoji: "🐸", chance: 4, rarity: "🟢 SIRA DIŞI" },
  { name: "Şebek Maymun", emoji: "🐵", chance: 4.4, rarity: "🟢 SIRA DIŞI" },
  { name: "Kral Horoz", emoji: "🐔", chance: 4.1, rarity: "🟢 SIRA DIŞI" },
  { name: "Gözlüklü Penguen", emoji: "🐧", chance: 4, rarity: "🟢 SIRA DIŞI" },
  { name: "Bal Arısı", emoji: "🐝", chance: 4.9, rarity: "🟢 SIRA DIŞI" },
  { name: "Monark Kelebeği", emoji: "🦋", chance: 4.5, rarity: "🟢 SIRA DIŞI" },
  { name: "Günebakan Ayçiçeği", emoji: "🌻", chance: 4.5, rarity: "🟢 SIRA DIŞI" },
  { name: "Kırmızı Gül", emoji: "🌹", chance: 4.3, rarity: "🟢 SIRA DIŞI" },
  { name: "İkiz Kiraz", emoji: "🍒", chance: 4.8, rarity: "🟢 SIRA DIŞI" },
  { name: "Dilim Karpuz", emoji: "🍉", chance: 5, rarity: "🟢 SIRA DIŞI" },
  { name: "Büyük boy Pizza", emoji: "🍕", chance: 4.2, rarity: "🟢 SIRA DIŞI" },
  { name: "Double Burger", emoji: "🍔", chance: 4.2, rarity: "🟢 SIRA DIŞI" },
  { name: "Külah Dondurma", emoji: "🍦", chance: 4.3, rarity: "🟢 SIRA DIŞI" },
  { name: "Patlamış Mısır", emoji: "🍿", chance: 4.4, rarity: "🟢 SIRA DIŞI" },
  { name: "Sandviç", emoji: "🌮", chance: 4.1, rarity: "🟢 SIRA DIŞI" },
  { name: "Havalı Güneş Gözlüğü", emoji: "🕶️", chance: 4.1, rarity: "🟢 SIRA DIŞI" },
  { name: "Demlik", emoji: "🫖", chance: 4.7, rarity: "🟢 SIRA DIŞI" },
  { name: "Baloncuk", emoji: "🫧", chance: 4.5, rarity: "🟢 SIRA DIŞI" },


  // ⚪ YAYGIN (15 Adet - %8.0 Şans)
  { name: "Klasik Gülen Yüz", emoji: "🙂", chance: 9.2, rarity: "⚪ YAYGIN" },
  { name: "Göz Kırpan Yüz", emoji: "😉", chance: 7.8, rarity: "⚪ YAYGIN" },
  { name: "Evcil Kedi", emoji: "🐱", chance: 8.6, rarity: "⚪ YAYGIN" },
  { name: "Sadık Köpek", emoji: "🐶", chance: 7.4, rarity: "⚪ YAYGIN" },
  { name: "Pamuk Tavşan", emoji: "🐰", chance: 8.1, rarity: "⚪ YAYGIN" },
  { name: "Amasya Elması", emoji: "🍏", chance: 6.9, rarity: "⚪ YAYGIN" },
  { name: "Yerli Muz", emoji: "🍌", chance: 8.9, rarity: "⚪ YAYGIN" },
  { name: "Tatlı Havuç", emoji: "🥕", chance: 7.2, rarity: "⚪ YAYGIN" },
  { name: "Sinema Patlamış Mısırı", emoji: "🍿", chance: 8.4, rarity: "⚪ YAYGIN" },
  { name: "Uçan Kırmızı Balon", emoji: "🎈", chance: 7.5, rarity: "⚪ YAYGIN" },
  { name: "Gülen Yüz", emoji: "😊", chance: 7.8, rarity: "⚪ YAYGIN" },
  { name: "Sıcak Kahve", emoji: "☕", chance: 7.1, rarity: "⚪ YAYGIN" },
  { name: "Tükenmez Kalem", emoji: "🖊️", chance: 8.8, rarity: "⚪ YAYGIN" },
  { name: "Donat", emoji: "🍩", chance: 7.4, rarity: "⚪ YAYGIN" },
  { name: "Örümcek Ağı", emoji: "🕸️", chance: 8, rarity: "⚪ YAYGIN" },


  // 🟤 KÖTÜ (5 Adet - %12.0 Şans)
  { name: "Hayattan Bezmiş Dümdüz Yüz", emoji: "😐", chance: 11.2, rarity: "🟤 KÖTÜ" },
  { name: "Ağlayan Hüzünlü Yüz", emoji: "😢", chance: 12.0, rarity: "🟤 KÖTÜ" },
  { name: "Sevimli Kaka", emoji: "💩", chance: 10.54, rarity: "🟤 KÖTÜ" },
  { name: "Korkunç Palyaço", emoji: "🤡", chance: 11.0, rarity: "🟤 KÖTÜ" },
  { name: "Paslı Çöp Kutusu", emoji: "🗑️", chance: 12.5, rarity: "🟤 KÖTÜ" }
];

// Matematiksel Seçim Fonksiyonu
function rollGacha() {
  
  const totalChance = gachaItems.reduce((acc, item) => acc + item.chance, 0);
  const rand = Math.random() * totalChance;
  let cumulative = 0;

  for (const item of gachaItems) {
    cumulative += item.chance;
    if (rand <= cumulative) return item;
  }
  return gachaItems[gachaItems.length - 1];
}

// ── Mağaza ürünleri ────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  {
    id: "color_mavi",
    name: "🔵 Mavi",
    price: 300,
    type: "color",
    value: "#3498DB",
    desc: "Profil embed rengi mavi olur",
  },
  {
    id: "color_kirmizi",
    name: "🔴 Kırmızı",
    price: 300,
    type: "color",
    value: "#E74C3C",
    desc: "Profil embed rengi kırmızı olur",
  },
  {
    id: "color_yesil",
    name: "🟢 Yeşil",
    price: 300,
    type: "color",
    value: "#2ECC71",
    desc: "Profil embed rengi yeşil olur",
  },
  {
    id: "color_mor",
    name: "💜 Mor",
    price: 500,
    type: "color",
    value: "#9B59B6",
    desc: "Profil embed rengi mor olur",
  },
  {
    id: "color_turuncu",
    name: "🟠 Turuncu",
    price: 400,
    type: "color",
    value: "#E67E22",
    desc: "Profil embed rengi turuncu olur",
  },
  {
    id: "color_pembe",
    name: "🩷 Pembe",
    price: 500,
    type: "color",
    value: "#FF69B4",
    desc: "Profil embed rengi pembe olur",
  },
  {
    id: "color_altin",
    name: "🟡 Altın",
    price: 800,
    type: "color",
    value: "#FFD700",
    desc: "Profil embed rengi altın olur",
  },
  {
    id: "color_lacivert",
    name: "🌊 Lacivert",
    price: 600,
    type: "color",
    value: "#1A237E",
    desc: "Profil embed rengi lacivert olur",
  },
  {
    id: "color_galaksi",
    name: "🌌 Galaksi",
    price: 2000,
    type: "color",
    value: "#2C003E",
    desc: "Nadir — galaksi rengi",
  },
  {
    id: "color_alev",
    name: "🔥 Alev",
    price: 1500,
    type: "color",
    value: "#FF4500",
    desc: "Nadir — alev rengi",
  },
  {
    id: "badge_yildiz",
    name: "⭐ Yıldız Rozeti",
    price: 200,
    type: "badge",
    value: "⭐",
    desc: "Profilde yıldız rozeti gösterilir",
  },
  {
    id: "badge_kalp",
    name: "❤️ Kalp Rozeti",
    price: 200,
    type: "badge",
    value: "❤️",
    desc: "Profilde kalp rozeti gösterilir",
  },
  {
    id: "badge_ates",
    name: "🔥 Ateş Rozeti",
    price: 400,
    type: "badge",
    value: "🔥",
    desc: "Profilde ateş rozeti gösterilir",
  },
  {
    id: "badge_tac",
    name: "👑 Taç Rozeti",
    price: 1500,
    type: "badge",
    value: "👑",
    desc: "Nadir — taç rozeti",
  },
  {
    id: "badge_elmas",
    name: "💎 Elmas Rozeti",
    price: 2500,
    type: "badge",
    value: "💎",
    desc: "Ultra nadir — elmas rozeti",
  },
  {
    id: "badge_simsek",
    name: "⚡ Şimşek Rozeti",
    price: 700,
    type: "badge",
    value: "⚡",
    desc: "Profilde şimşek rozeti gösterilir",
  },
  {
    id: "badge_muzik",
    name: "🎵 Müzik Rozeti",
    price: 500,
    type: "badge",
    value: "🎵",
    desc: "Profilde müzik rozeti gösterilir",
  },
  {
    id: "badge_oyun",
    name: "🎮 Oyuncu Rozeti",
    price: 500,
    type: "badge",
    value: "🎮",
    desc: "Profilde oyuncu rozeti gösterilir",
  },
  {
    id: "bio_unlock",
    name: "📝 Bio Kilidi",
    price: 250,
    type: "bio",
    value: true,
    desc: "Profiline özel bio (tanıtım yazısı) ekleyebilirsin",
  },
  {
    id: "ozel_rol",
    name: "✨ Özel Rol",
    price: 1000000,
    type: "ozel_rol",
    value: true,
    desc: "Sana özel isim ve renkle bir rol oluşturulur!",
  },
  {
    id: "bg_gece",
    name: "🌙 Gece Arkaplanı",
    price: 800,
    type: "background",
    value: "bg_gece",
    desc: "Profil kartında gece mavisi arkaplan",
  },
  {
    id: "bg_okyanus",
    name: "🌊 Okyanus Arkaplanı",
    price: 1000,
    type: "background",
    value: "bg_okyanus",
    desc: "Profil kartında okyanus arkaplanı",
  },
  {
    id: "bg_alev",
    name: "🔥 Alev Arkaplanı",
    price: 1500,
    type: "background",
    value: "bg_alev",
    desc: "Profil kartında alev arkaplanı",
  },
  {
    id: "bg_orman",
    name: "🌲 Orman Arkaplanı",
    price: 1000,
    type: "background",
    value: "bg_orman",
    desc: "Profil kartında orman arkaplanı",
  },
  {
    id: "bg_sunset",
    name: "🌅 Gün Batımı",
    price: 2000,
    type: "background",
    value: "bg_sunset",
    desc: "Profil kartında gün batımı arkaplanı",
  },
  {
    id: "bg_galaksi",
    name: "✨ Galaksi Arkaplanı",
    price: 3000,
    type: "background",
    value: "bg_galaksi",
    desc: "Nadir — galaksi arkaplanı",
  },
];

function getShopItem(id) {
  return SHOP_ITEMS.find((i) => i.id === id);
}

// ── Canvas profil ─────────────────────────────────────────────────────────────
const BG_GRADIENTS = {
  default: ["#2C3E50", "#34495E"],
  bg_gece: ["#0F0C29", "#302B63"],
  bg_okyanus: ["#1A1A2E", "#0077B6"],
  bg_alev: ["#7B0D1E", "#C0392B"],
  bg_orman: ["#1A2F1A", "#2D6A4F"],
  bg_sunset: ["#C0392B", "#F39C12"],
  bg_galaksi: ["#4B0082", "#1A0033"],
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

async function generateProfileCard(member, ud, coins, prof) {
  const W = 700,
    H = 260;
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
  const AX = 125,
    AY = 130,
    AR = 95;
  ctx.save();
  ctx.beginPath();
  ctx.arc(AX, AY, AR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  try {
    const avatarURL = member.user.displayAvatarURL({
      extension: "png",
      size: 256,
      forceStatic: true,
    });
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
  const uname = member.user.username.slice(0, 20);
  ctx.fillText(uname, textX, 60);

  // Badge
  if (prof.activeBadge) {
    ctx.font = "26px sans-serif";
    ctx.fillText(
      prof.activeBadge,
      textX + ctx.measureText(uname).width + 8,
      60,
    );
  }

  // ── Level bilgisi ─────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Seviye ${ud.level}`, textX, 90);

  // ── XP Bar ───────────────────────────────────────────────────────────────
  const barX = textX,
    barY = 105,
    barW = 415,
    barH = 22;
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
    ctx.fillText(prof.bio.slice(0, 55), textX, 185);
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
  const joinDate = member.joinedAt
    ? member.joinedAt.toLocaleDateString("tr-TR")
    : "?";
  ctx.fillText(`Katılım: ${joinDate}  |  ID: ${member.id}`, textX, 218);

  // ── Sol altta sunucu adı ──────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "11px sans-serif";
  ctx.fillText(member.guild.name, 20, H - 12);

  return canvas.toBuffer("image/png");
}

// ── Emoji yardımcısı ───────────────────────────────────────────────────────────
function getEmoji(name, fallback = "") {
  const emoji = client.emojis.cache.find((e) => e.name === name);
  return emoji ? emoji.toString() : fallback;
}

// ── Profil yardımcıları ───────────────────────────────────────────────────────
function getProfile(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userProfiles.has(key))
    userProfiles.set(key, {
      color: "#5865F2",
      badges: [],
      activeBadge: "",
      bio: "",
      background: "default",
    });
  const p = userProfiles.get(key);
  if (!p.background) p.background = "default";
  return p;
}
function getInventory(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userInventory.has(key)) userInventory.set(key, []);
  return userInventory.get(key);
}
function hasItem(userId, guildId, itemId) {
  return getInventory(userId, guildId).includes(itemId);
}

// Seviye Sistemi

function getUserData(userId) {
  // Eğer hafızada halihazırda yoksa veritabanından veya eski userLevels'tan çekmeyi dene
  if (!globalLevels.has(userId)) {
    // NOT: Eğer quick.db veya replit db kullanıyorsan burayı db.get(`${userId}_chatLevel`) şeklinde bağlayabilirsin.
    // Şimdilik senin eski haritandan veya güvenli bir varsayılandan veri çekiyoruz:
    const eskiVeri = userLevels ? userLevels.get(userId) : null; 

    globalLevels.set(userId, {
      chatXp: eskiVeri ? (eskiVeri.xp || 0) : 0,
      chatLevel: eskiVeri ? (eskiVeri.level || 0) : 0,
      voiceXp: 0, // Ses sistemi yeni başladığı için 0
      voiceLevel: 0
    });
  }
  return globalLevels.get(userId);
}


// ── İstatistik yardımcıları ───────────────────────────────────────────────────
function getStats(userId, guildId) {
  const key = `${guildId}_${userId}`;
  if (!userStats.has(key)) {
    const now = Date.now();
    userStats.set(key, {
      weekly: { messages: 0, voiceMinutes: 0, periodStart: getWeekStart(now) },
      monthly: {
        messages: 0,
        voiceMinutes: 0,
        periodStart: getMonthStart(now),
      },
    });
  }
  return userStats.get(key);
}
function getWeekStart(ts) {
  const d = new Date(ts),
    day = d.getDay(),
    diff = day === 0 ? -6 : 1 - day;
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
  if (stats.weekly.periodStart < getWeekStart(now))
    stats.weekly = {
      messages: 0,
      voiceMinutes: 0,
      periodStart: getWeekStart(now),
    };
  if (stats.monthly.periodStart < getMonthStart(now))
    stats.monthly = {
      messages: 0,
      voiceMinutes: 0,
      periodStart: getMonthStart(now),
    };
}
function addMessageStat(userId, guildId) {
  const s = getStats(userId, guildId);
  checkAndResetStats(s);
  s.weekly.messages++;
  s.monthly.messages++;
}
function addVoiceMinutes(userId, guildId, minutes) {
  const s = getStats(userId, guildId);
  checkAndResetStats(s);
  s.weekly.voiceMinutes += minutes;
  s.monthly.voiceMinutes += minutes;
}
function formatDuration(minutes) {
  if (minutes < 1) return "< 1 dakika";
  if (minutes < 60) return `${Math.floor(minutes)} dakika`;
  const h = Math.floor(minutes / 60),
    m = Math.floor(minutes % 60);
  return m > 0 ? `${h} saat ${m} dakika` : `${h} saat`;
}

// ── Coin yardımcıları ─────────────────────────────────────────────────────────
function getCoins(userId, guildId) {
  return userCoinsMap.get(`${guildId}_${userId}`) || 0;
}
function setCoins(userId, guildId, amount) {
  userCoinsMap.set(`${guildId}_${userId}`, Math.max(0, amount));
}
function addCoins(userId, guildId, amt) {
  const k = `${guildId}_${userId}`;
  userCoinsMap.set(k, (userCoinsMap.get(k) || 0) + amt);
}
function removeCoins(userId, guildId, amt) {
  const k = `${guildId}_${userId}`;
  const c = userCoinsMap.get(k) || 0;
  userCoinsMap.set(k, Math.max(0, c - amt));
  return c >= amt;
}
function formatCoins(n) {
  return `${n.toLocaleString("tr-TR")} HB`;
}

// ── Cooldown yardımcıları ─────────────────────────────────────────────────────
function getCooldown(map, userId, guildId) {
  return map.get(`${guildId}_${userId}`) || 0;
}
function setCooldown(map, userId, guildId, dur) {
  map.set(`${guildId}_${userId}`, Date.now() + dur);
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000),
    m = Math.floor(s / 60),
    h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}d`;
  if (m > 0) return `${m}d ${s % 60}s`;
  return `${s}s`;
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
    ud.level++;
    ud.xp = 0;
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
      channel
        .send({
          content: `${member}`,
          embeds: [
            new EmbedBuilder()
              .setColor("Gold")
              .setTitle("🎉 Tebrikler, Seviye Atladın!")
              .setDescription(
                `${member} artık **${newLevel}. seviye**sin! 🚀\n💰 Ödül: **${coinReward.toLocaleString()} HB**`,
              )
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .addFields(
                { name: "⭐ Yeni Seviye", value: `${newLevel}`, inline: true },
                {
                  name: "💰 Ödül",
                  value: `${coinReward.toLocaleString()} HB`,
                  inline: true,
                },
              )
              .setTimestamp(),
          ],
        })
        .catch(() => {});
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
  if (member.permissions.has(PermissionsBitField.Flags.Administrator))
    return true;
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
      ses: { enabled: false, channelId: null },
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
  if (args[0]) {
    try {
      return await message.guild.members.fetch(args[0]);
    } catch {}
  }
  return null;
}

// ── PK Tracker ────────────────────────────────────────────────────────────────
const PK_WINDOW = 5 * 60 * 1000;
const PK_LIMIT = 3;
function trackPkAction(guild, userId, type) {
  if (!pkSettingsMap.get(guild.id)?.enabled) return;
  const key = `${guild.id}_${userId}`,
    now = Date.now();
  let data = pkTracker.get(key) || { deletes: 0, edits: 0, firstTime: now };
  if (now - data.firstTime > PK_WINDOW)
    data = { deletes: 0, edits: 0, firstTime: now };
  data[type]++;
  pkTracker.set(key, data);
  if (data.deletes + data.edits >= PK_LIMIT) {
    pkTracker.delete(key);
    guild.members
      .fetch(userId)
      .then((m) =>
        m?.ban({
          reason: `[PK] 5dk içinde ${PK_LIMIT}+ kanal silme/düzenleme`,
        }),
      )
      .catch(() => {});
  }
}

// ── Başvuru sistemi ───────────────────────────────────────────────────────────
async function startApplication(guild, member) {
  if (activeApplications.has(member.id)) return;
  const settings = ytSettingsMap.get(guild.id);
  if (!settings) return;
  const questions = settings.questions || {};
  const sortedQs = Object.entries(questions).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0]),
  );
  if (sortedQs.length === 0) return;

  activeApplications.add(member.id);
  let appChannel;

  try {
    appChannel = await guild.channels.create({
      name: `başvuru-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "") || member.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
        {
          id: client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
      ],
    });
  } catch (err) {
    console.error("Başvuru kanalı oluşturulamadı:", err);
    activeApplications.delete(member.id);
    return;
  }

  await appChannel.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("📋 Yetkili Başvurusu")
        .setDescription(
          `Merhaba ${member}! Sana **${sortedQs.length}** soru soracağım.\nHer soru için **2 dakika** süren var. İlk yazdığın mesaj cevap olarak kabul edilecek.\n\nHazır olduğunda bekleyin, hemen başlıyoruz...`,
        )
        .setFooter({ text: "Başvurun otomatik olarak değerlendirilecek." })
        .setTimestamp(),
    ],
  });

  const answers = {};
  let completed = true;

  for (const [num, question] of sortedQs) {
    await appChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle(`❓ Soru ${num} / ${sortedQs.length}`)
          .setDescription(question)
          .setFooter({ text: "2 dakika içinde cevaplayın." }),
      ],
    });

    const filter = (m) => m.author.id === member.id;
    const collected = await appChannel
      .awaitMessages({ filter, max: 1, time: 120000, errors: ["time"] })
      .catch(() => null);

    if (!collected || collected.size === 0) {
      await appChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("⏰ Süre Doldu")
            .setDescription(
              "Cevap vermediğin için başvurun otomatik olarak iptal edildi. Kanal 10 saniye içinde silinecek.",
            ),
        ],
      });
      completed = false;
      break;
    }
    answers[num] = collected.first().content;
  }

  if (completed) {
    await appChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Başvuru Tamamlandı!")
          .setDescription(
            `Tüm soruları yanıtladın! Başvurun değerlendirme kanalına gönderildi. Bu kanal 15 saniye içinde silinecek.`,
          )
          .setTimestamp(),
      ],
    });

    // Değerlendirme kanalına gönder
    if (settings.evalChannelId) {
      const evalChannel = guild.channels.cache.get(settings.evalChannelId);
      if (evalChannel) {
        const answerFields = sortedQs.map(([num]) => ({
          name: `❓ Soru ${num}: ${questions[num]?.slice(0, 80)}`,
          value: answers[num]?.slice(0, 1024) || "*Yanıtsız*",
          inline: false,
        }));
        const ud = userLevels.get(`${guild.id}_${member.id}`) || {
          xp: 0,
          level: 1,
        };
        const coins = getCoins(member.id, guild.id);
        const warns = (warningsMap.get(`${guild.id}_${member.id}`) || [])
          .length;
        evalChannel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle(`📋 Yeni Başvuru — ${member.user.tag}`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${member} kullanıcısının başvurusu`)
                .addFields(
                  {
                    name: "👤 Kullanıcı",
                    value: `${member.user.tag}\n<@${member.id}>`,
                    inline: true,
                  },
                  { name: "⭐ Level", value: `${ud.level}`, inline: true },
                  { name: "💰 HB", value: formatCoins(coins), inline: true },
                  { name: "⚠️ Warn Sayısı", value: `${warns}`, inline: true },
                  {
                    name: "📅 Katılım",
                    value: member.joinedAt?.toLocaleDateString("tr-TR") || "?",
                    inline: true,
                  },
                  {
                    name: "🗓️ Hesap Yaşı",
                    value: member.user.createdAt.toLocaleDateString("tr-TR"),
                    inline: true,
                  },
                  ...answerFields,
                )
                .setFooter({
                  text: `Başvuru ID: ${member.id} • ${new Date().toLocaleString("tr-TR")}`,
                })
                .setTimestamp(),
            ],
          })
          .catch(() => {});
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
      inviteCache.set(guild.id, new Map(invites.map((i) => [i.code, i.uses])));
    } catch {}
  }
});

// ── Reaction: başvuru tetikleyici ────────────────────────: �────────────────────
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }
  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
    } catch {
      return;
    }
  }

  const guild = reaction.message.guild;
  if (!guild) return;
  const settings = ytSettingsMap.get(guild.id);
  if (!settings) return;
  if (reaction.message.id !== settings.messageId) return;

  const emoji = reaction.emoji.name;
  if (emoji !== (settings.emoji || "📝")) return;

  // Kendi reactionını geri al
  try {
    await reaction.users.remove(user.id);
  } catch {}

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  startApplication(guild, member);
});

//

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
  const guild = newState.guild || oldState.guild;
  if (!userId) return;
  const member = newState.member || oldState.member;
  if (member?.user?.bot) return;
  const key = `${guild.id}_${userId}`;
  const joined = !oldState.channelId && newState.channelId;
  const left = oldState.channelId && !newState.channelId;
  const moved =
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId;

  if (joined) {
    voiceSessions.set(key, Date.now());
    sendLog(
      guild,
      "ses",
      new EmbedBuilder()
        .setColor("Green")
        .setTitle("🔊 Ses Kanalına Katıldı")
        .addFields(
          {
            name: "Kullanıcı",
            value: `${member.user.tag} (<@${userId}>)`,
            inline: true,
          },
          { name: "Kanal", value: newState.channel?.name || "?", inline: true },
        )
        .setFooter({ text: `ID: ${userId}` })
        .setTimestamp(),
    );
  } else if (left) {
    const jt = voiceSessions.get(key);
    if (jt) {
      const min = (Date.now() - jt) / 60000;
      if (min > 0) addVoiceMinutes(userId, guild.id, min);
      voiceSessions.delete(key);
    }
    sendLog(
      guild,
      "ses",
      new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔇 Ses Kanalından Çıktı")
        .addFields(
          {
            name: "Kullanıcı",
            value: `${member.user.tag} (<@${userId}>)`,
            inline: true,
          },
          { name: "Kanal", value: oldState.channel?.name || "?", inline: true },
        )
        .setFooter({ text: `ID: ${userId}` })
        .setTimestamp(),
    );
  } else if (moved) {
    if (!voiceSessions.has(key)) voiceSessions.set(key, Date.now());
    sendLog(
      guild,
      "ses",
      new EmbedBuilder()
        .setColor("Blue")
        .setTitle("🔀 Ses Kanalı Değiştirdi")
        .addFields(
          {
            name: "Kullanıcı",
            value: `${member.user.tag} (<@${userId}>)`,
            inline: true,
          },
          { name: "Eski", value: oldState.channel?.name || "?", inline: true },
          { name: "Yeni", value: newState.channel?.name || "?", inline: true },
        )
        .setFooter({ text: `ID: ${userId}` })
        .setTimestamp(),
    );
  }
});

// Ses Yardımcıları

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.member.user.bot) return;

  const userId = newState.id;

  // Kullanıcı bir ses kanalına bağlandıysa veya kanallar arası geçiş yaptıysa
  if (!oldState.channelId && newState.channelId) {
    // Sağır veya susturulmuş değilse süresini başlat (Afk kalıp XP kasılmasın)
    if (!newState.selfDeaf && !newState.selfMute) {
      voiceActiveUsers.set(userId, Date.now());
    }
  } 
  // Kullanıcı ses kanalından tamamen çıktıysa
  else if (oldState.channelId && !newState.channelId) {
    voiceActiveUsers.delete(userId);
  }
  // Susturma/Sağırlaştırma durumları değiştiyse
  else if (oldState.channelId === newState.channelId) {
    if (newState.selfDeaf || newState.selfMute) {
      voiceActiveUsers.delete(userId); // XP kazanımını durdur
    } else if (!voiceActiveUsers.has(userId)) {
      voiceActiveUsers.set(userId, Date.now()); // Yeniden başlat
    }
  }
});

// Her 1 dakikada bir (60000 ms) sestedekileri kontrol edip 5-10 arası makul bir XP veren döngü
setInterval(() => {
  const simdi = Date.now();
  for (const [userId, girisZamani] of voiceActiveUsers.entries()) {
    // 1 dakikadan fazla süre geçmişse
    if (simdi - girisZamani >= 60000) {
      const userData = getUserData(userId);
      const kazanilanXp = Math.floor(Math.random() * 6) + 5; // 5-10 arası az bir XP
      
      userData.voiceXp += kazanilanXp;
      
      // Seviye kontrolü
      let reqXp = getRequiredXp(userData.voiceLevel);
      if (userData.voiceXp >= reqXp) {
        userData.voiceXp -= reqXp;
        userData.voiceLevel++;
        // İsteğe bağlı: Sunucuya ses seviye atlama mesajı tetiklenebilir
      }
      
      // Giriş zamanını güncelle ki sonraki dakikayı saysın
      voiceActiveUsers.set(userId, simdi);
    }
  }
}, 30000); // 30 saniyede bir tarar, dakikası dolana XP basar



// ── Davet log ─────────────────────────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  const guild = member.guild;
  let usedInvite = null;
  try {
    const newInvites = await guild.invites.fetch();
    const cached = inviteCache.get(guild.id) || new Map();
    usedInvite = newInvites.find((i) => (cached.get(i.code) || 0) < i.uses);
    inviteCache.set(guild.id, new Map(newInvites.map((i) => [i.code, i.uses])));
  } catch {}
  const inviteInfo = usedInvite
    ? `**${usedInvite.code}** (davet eden: ${usedInvite.inviter?.tag || "?"}, ${usedInvite.uses} kez)`
    : "Bilinmiyor";
  sendLog(
    guild,
    "davet",
    new EmbedBuilder()
      .setColor("Green")
      .setTitle("📥 Üye Katıldı")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "Kullanıcı",
          value: `${member.user.tag} (<@${member.id}>)`,
          inline: true,
        },
        {
          name: "Hesap",
          value: member.user.createdAt.toLocaleDateString("tr-TR"),
          inline: true,
        },
        { name: "Davet", value: inviteInfo, inline: false },
      )
      .setFooter({ text: `ID: ${member.id} • Üye: ${guild.memberCount}` })
      .setTimestamp(),
  );
});

client.on("guildMemberRemove", (member) => {
  sendLog(
    member.guild,
    "davet",
    new EmbedBuilder()
      .setColor("Red")
      .setTitle("📤 Üye Ayrıldı")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "Kullanıcı",
          value: `${member.user.tag} (<@${member.id}>)`,
          inline: true,
        },
        {
          name: "Katılım",
          value: member.joinedAt?.toLocaleDateString("tr-TR") || "?",
          inline: true,
        },
      )
      .setFooter({
        text: `ID: ${member.id} • Üye: ${member.guild.memberCount}`,
      })
      .setTimestamp(),
  );
});

// ── Mesaj log ─────────────────────────────────────────────────────────────────
client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot || oldMsg.content === newMsg.content)
    return;
  sendLog(
    oldMsg.guild,
    "mesaj",
    new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("✏️ Mesaj Düzenlendi")
      .addFields(
        {
          name: "Kullanıcı",
          value: `${oldMsg.author?.tag || "?"} (<@${oldMsg.author?.id}>)`,
          inline: true,
        },
        { name: "Kanal", value: `<#${oldMsg.channelId}>`, inline: true },
        {
          name: "Önceki",
          value: (oldMsg.content || "*boş*").slice(0, 1024),
          inline: false,
        },
        {
          name: "Yeni",
          value: (newMsg.content || "*boş*").slice(0, 1024),
          inline: false,
        },
      )
      .setFooter({ text: `ID: ${oldMsg.id}` })
      .setTimestamp(),
  );
});

client.on("messageDelete", (msg) => {
  if (!msg.guild || msg.author?.bot) return;
  sendLog(
    msg.guild,
    "mesaj",
    new EmbedBuilder()
      .setColor("Red")
      .setTitle("🗑️ Mesaj Silindi")
      .addFields(
        {
          name: "Kullanıcı",
          value: msg.author
            ? `${msg.author.tag} (<@${msg.author.id}>)`
            : "Bilinmiyor",
          inline: true,
        },
        { name: "Kanal", value: `<#${msg.channelId}>`, inline: true },
        {
          name: "Mesaj",
          value: (msg.content || "*içerik yok*").slice(0, 1024),
          inline: false,
        },
      )
      .setFooter({ text: `ID: ${msg.id}` })
      .setTimestamp(),
  );
});

// ── Ana mesaj dinleyicisi ─────────────────────────────────────────────────────
// ⏱️ Cooldown (Bekleme Süresi) Hafızası
// Not: Bu satırı index.js içinde messageCreate olayının DIŞINA, en üst kısımlara koyabilirsin.
const cooldowns = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // 📈 Arkada Çalışan Global XP, Coin ve İstatistik Sistemi (Cooldown'dan etkilenmez)
const userData = getUserData(message.author.id);
const chatKazanilanXp = Math.floor(Math.random() * 4) + 2; // 2-5 arası abartısız XP

userData.chatXp += chatKazanilanXp;
const gerekenChatXp = getRequiredXp(userData.chatLevel);

// Seviye Atlama Kontrolü
if (userData.chatXp >= gerekenChatXp) {
  userData.chatXp -= gerekenChatXp;
  userData.chatLevel++;
  
  // Eski kodundaki seviye ödülü mantığı: (Yeni Seviye * 50) kadar Coin/HB ekle
  const ödülCoin = userData.chatLevel * 50;
  addCoins(message.author.id, ödülCoin); 
  
  // Seviye atlama mesajını tetikle
  await sendLevelUpMessage(message.member, userData.chatLevel, ödülCoin);
}

// Mesaj istatistiğini kaydet (Global)
addMessageStat(message.author.id);

// %5 şansla mesaj atarken ekstra 1-10 arası Coin/HB düşürme mantığı
if (Math.random() < 0.05) {
  const rastgeleCoin = Math.floor(Math.random() * 10) + 1;
  addCoins(message.author.id, rastgeleCoin);
}


  // 💬 Prefix Olmayan Otomatik Cevaplar (Cooldown'dan etkilenmez)
  if (!message.content.startsWith(prefix)) {
    const msg = message.content.toLowerCase();
    if (msg === "sa") return message.reply("as hg knk");
    if (msg === "selam") return message.reply("selam canım nasılsın?");
    if (msg === "günaydın") return message.reply("günaydın şampiyon ☀️");
    if (msg === "iyi geceler") return message.reply("tatlı rüyalar 😴");
    return;
  }

  // 🛡️ 2 SANİYE COOLDOWN SİSTEMİ (Sadece komutlar için geçerli)
  const userId = message.author.id;
  const simdi = Date.now();
  const cooldownSuresi = 120; // 2 saniye

  if (cooldowns.has(userId)) {
    const bitisZamani = cooldowns.get(userId) + cooldownSuresi;

    if (simdi < bitisZamani) {
      const kalanSure = ((bitisZamani - simdi) / 1000).toFixed(1);
      return message.reply(`⚠️ Sakin ol kanka! Komutları spamleme amk, **${kalanSure} saniye** bekle.`);
    }
  }

  // Süre temizse zaman damgasını vur ve 2 saniye sonra hafızadan sil
  cooldowns.set(userId, simdi);
  setTimeout(() => cooldowns.delete(userId), cooldownSuresi);

  // ⚙️ Komut Parçalama ve Çalıştırma Kısmı
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  if (!command) return;

  // Bundan sonrası senin mevcut komutlarının (if-else veya switch blokları) devamı...


  // ── YARDIM ─────────────────────────────────────────────────────────────────
  if (command === "yardım" || command === "yardim" || command === "help") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF6B6B")
          .setTitle("🎮 SUNUCU YARDIM VE KOMUT REHBERİ")
          .setDescription(
            "**Botun tüm aktif sistemleri ve komutları aşağıda kategorize edilmiştir.**\n*Parametreleri girerken `<>` zorunlu, `[]` isteğe bağlı alanları temsil eder.*"
          )
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            {
              name: "🛡️ MODERASYON KOMUTLARI",
              value: [
                "› `a!ban @üye / ID` • Kullanıcıyı sunucudan yasaklar.",
                "› `a!unban @üye / ID` • Kullanıcının yasaklamasını kaldırır.",
                "› `a!kick @üye / ID` • Kullanıcıyı sunucudan atar.",
                "› `a!mute @üye / ID` • Kullanıcıyı susturur.",
                "› `a!unmute @üye / ID` • Kullanıcının susturmasını kaldırır.",
                "› `a!warn @üye` • Kullanıcıya uyarı puanı ekler.",
                "› `a!unwarn @üye` • Kullanıcının uyarısını siler.",
                "› `a!warnings @üye` • Kullanıcının aktif uyarılarını listeler.",
                "› `a!temizle <1-100>` • Belirtilen miktarda mesajı kanaldan temizler."
              ].join("\n"),
              inline: false,
            },
            {
              name: "⚙️ YÖNETİM & GÜVENLİK SİSTEMLERİ *(Admin)*",
              value: [
                "› `a!hbengel aç / kapat` • Belirtilen kanalda HB kazanımını engeller.",
                "› `a!seviyerol @rol <seviye>` • Belirli seviyeye ulaşana rol ödülü bağlar.",
                "› `a!rololustur <isim> <#renk>` • Sunucuda hızlıca yeni rol açar.",
                "› `a!warnrol / banrol / kickrol / muterol @rol` • Yetkili rollerini ayarlar."
              ].join("\n"),
              inline: false,
            },
            {
              name: "🌌 GACHA & SQUAD (TAKIM) SİSTEMİ",
              value: [
                "› `a!roll` • Şansına yeni bir gacha kapsülü açıp karakter toplarsın. 🎡",
                "› `a!envanter` • Sahip olduğun tüm gacha karakterlerini listeler.",
                "› `a!squad` • Güncel aktif 3'lü savaş takımını ekrana getirir. 📋",
                "› `a!squad ekle <Gacha Adı>` • Envanterindeki bir gachayı savaş takımına sokar.",
                "› `a!squad çıkar <Gacha Adı>` • Takımdan bir gacha karakterini çıkarır.",
                "› `a!vs` • Güçlendirilmiş Yapay Zekaya karşı dövüşürsün *(2.5K - 5K Ödüllü!)* 🤖",
                  "› `a!vs @üye` • Squad takımınla başka bir oyuncuya meydan okursun ⚔️"
              ].join("\n"),
              inline: false,
            },
            {
              name: "📋 MODERN LOG SİSTEMİ *(Admin)*",
              value: [
                "› `a!logayarla <ses / davet / mesaj> #kanal` • Log kanalını bağlar.",
                "› `a!logac / logkapat <ses / davet / mesaj>` • Log türünü yönetir.",
                "› `a!logdurum` • Aktif log kanallarının listesini gösterir."
              ].join("\n"),
              inline: false,
            },
            {
              name: "📝 BAŞVURU & YETKİLİ ALIM SİSTEMİ *(Admin)*",
              value: [
                "› `a!ytsetup #kanal` • Başvuru formlarının atılacağı kanalı kurar.",
                "› `a!ytdegerlendirme #kanal` • Başvuruların onay/ret panelini kurar.",
                "› `a!ytsoruayarla <no> <soru>` • Form için özel soru havuzu oluşturur.",
                "› `a!ytsorular` • Güncel başvuru sorularını listeler."
              ].join("\n"),
              inline: false,
            },
            {
              name: "👤 PROFİL & KOZMETİK MAĞAZASI",
              value: [
                "› `a!profil [@üye]` • Gelişmiş, resimli profil kartını gösterir.",
                "› `a!profilayarla <renk / rozet / bio / arkaplan> <değer>` • Kartı özelleştirir.",
                "› `a!shop` • Sunucu mağazasındaki arka plan ve rolleri listeler.",
                "› `a!satinal <id>` • Mağazadan ürün veya kozmetik satın almanı sağlar."
              ].join("\n"),
              inline: false,
            },
            {
              name: "💰 EKONOMİ SİSTEMİ",
              value: [
                "› `a!bakiye [@üye]` • Mevcut HB cüzdanınızı ve bankanızı gösterir.",
                "› `a!hbver @üye <miktar>` • Başka bir kullanıcıya güvenli para aktarır.",
                "› `a!daily` • Günlük ücretsiz HB ödülünüzü toplar.",
                "› `a!work` • Bir işte çalışarak HB kazanır *(1 saat bekleme süresi)*."
              ].join("\n"),
              inline: false,
            },
            {
              name: "🎰 EĞLENCE, KUMAR & ARENA",
              value: [
                "› `a!rob @üye` • Hedef oyuncunun cüzdanını soymayı dener *(2 saat cd)*.",
                "› `a!roulette <miktar> <renk>` • Rulet masasına bahis yatırır.",
                "› `a!blackjack <miktar>` • 21 (Blackjack) kart oyunu oynatır.",
                "› `a!sans <miktar>` • Şans çarkını çevirerek katlama dener.",
                "› `a!slot / coinflip / dice / hunt / fish` • Klasik şans ve toplama oyunları."
              ].join("\n"),
              inline: false,
            },
            {
              name: "📊 SUNUCU & İSTATİSTİK BİLGİLERİ",
              value: [
                "› `a!level [@üye]` • Güncel seviye ve XP durumunu gösterir.",
                "› `a!istatistik [@üye]` • Detaylı mesaj ve aktiflik verilerini listeler.",
                "› `a!leaderboard` • Sunucunun en zengin ve en yüksek seviyeli ilk 10 üyesi.",
                "› `a!sunucubilgi` • Sunucu hakkında teknik ve demografik bilgileri verir.",
                "› `a!avatar [@üye]` • Belirtilen kişinin profil fotoğrafını büyütür."
              ].join("\n"),
              inline: false,
            }
          )
          .setFooter({
            text: `${message.guild.name} • Yapımcı: Reign 👑`,
            iconURL: message.guild.iconURL({ dynamic: true }),
          })
          .setTimestamp(),
      ],
    });
  }


  // ── PING ───────────────────────────────────────────────────────────────────
  if (command === "ping") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `🏓 Gecikme: **${Date.now() - message.createdTimestamp}ms** | WS: **${client.ws.ping}ms**`,
          ),
      ],
    });
  }

  // ── GACHA ──────────────────────────────────────────────────────────────

        if (command === "gacha" || command === "roll") {
          if (gachaActive.has(message.author.id)) {
            return message.reply("🎰 **Kapsülün şu an çalkalanıyor!** Önceki ödülünü görmeden yeni bir jeton atamazsın.");
          }

          const cost = 500; 
          const bal = getCoins(message.author.id, message.guild.id);

          if (bal < cost) {
            return message.reply(`❌ Yetersiz bakiye! Gacha roll yapmak için **${formatCoins(cost)}** gerekiyor. Mevcut bakiyen: **${formatCoins(bal)}**`);
          }

          // ⚙️ Rebirth ve Geliştirme Verilerini Çekiyoruz
          const rebData = getRebirthData(message.author.id, message.guild.id);
          const maxSlots = 20 + (rebData.upgrades.inv || 0); // Dinamik limit (20-25 arası)

          // 🛑 Envanter Doluluk Kontrolü
          const inv = getInventory(message.author.id, message.guild.id);
          const gachaCount = inv.filter(id => !getShopItem(id)).length; 

          if (gachaCount >= maxSlots) {
            return message.reply(`⚠️ **Envanterin Dolu!** Geliştirme seviyene göre maksimum **${maxSlots}** gacha eşyası taşıyabilirsin. Yeni roll atabilmek için önce bazı eşyalarını satmalısın!`);
          }

          // 🔓 Kullanıcıyı kilitle
          gachaActive.add(message.author.id);

          try {
            removeCoins(message.author.id, message.guild.id, cost);
            const rolledItem = rollGacha();

            inv.push(rolledItem.name); 
            saveData(userInventoryFile, userInventory);

            // ⚡ DİNAMİK HIZ KONTROLÜ (Müthiş zekice bir matematik kanka!)
            // Seviye 0 ise 1x hız (gecikme aynı kalır)
            // Seviye 4 ise 0.4x gecikme süresi (yani animasyonlar %60 daha hızlı akar)
            const speedLvl = rebData.upgrades.speed || 0;
            const delayFactor = 1 - (speedLvl * 0.15); 

            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms * delayFactor));
            const randomEmoji = () => gachaItems[Math.floor(Math.random() * gachaItems.length)].emoji;

            // ... Buradan sonrası eski gacha animasyonuyla birebir aynı devam ediyor!


        // 🎰 1. AŞAMA: Makineye Jeton Atılması ve Başlangıç
        const animationMsg = await message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#2C3E50")
              .setTitle("🪙 Kapsül Makinesine Jeton Atıldı...")
              .setDescription([
                "```",
                "┌───────────────────────────┐",
                "│  [ ⏳ ]  [ ⏳ ]  [ ⏳ ]  │",
                "└───────────────────────────┘",
                "```",
                "🟥░░░░░░░░░ %10 • *Sistem yükleniyor...*"
              ].join("\n"))
          ]
        });

        await sleep(700);

        // 🎰 2. AŞAMA: Slot Dönüş Döngüsü
        for (let i = 0; i < 3; i++) {
          let progress = 30 + (i * 20); 
          let bars = "🟩".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));

          await animationMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#9B59B6")
                .setTitle("🎰 Kapsül Çılgınca Çalkalanıyor!")
                .setDescription([
                  "```",
                  "┌───────────────────────────┐",
                  `│  [ ${randomEmoji()} ]  [ ${randomEmoji()} ]  [ ${randomEmoji()} ]  │`,
                  "└───────────────────────────┘",
                  "```",
                  `${bars} %${progress} • *Nadir enerji dalgaları taranıyor...*`
                ].join("\n"))
            ]
          }).catch(() => {});
          await sleep(500);
        }

        // 🎰 3. AŞAMA: Sinyal Kilitlenmesi ve Çatlama
        await animationMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor("#E67E22")
              .setTitle("⚡ Sinyal Yakalandı! Kapsül Çatlıyor!")
              .setDescription([
                "```",
                "┌───────────────────────────┐",
                `│  [ ${rolledItem.emoji} ]  [ ${rolledItem.emoji} ]  [ ${rolledItem.emoji} ]  │`,
                "└───────────────────────────┘",
                "```",
                "🟩🟩🟩🟩🟩🟩🟩🟩🟩░ %90 • *💥 Kapsül yüksek basınçtan ortadan ikiye ayrılıyor!*"
              ].join("\n"))
          ]
        }).catch(() => {});

        await sleep(800);

        // 🎰 4. AŞAMA (FİNAL): RPG Tarzı Kart Görünümü
        let embedColor = "#5865F2";
        let rarityBadge = "🛡️ SIRADAN";

        if (rolledItem.rarity.includes("İLAHİ")) { embedColor = "#E74C3C"; rarityBadge = "🔥 İLAHİ 🔥"; }     
        else if (rolledItem.rarity.includes("MİTİK")) { embedColor = "#9B59B6"; rarityBadge = "🔮 MİTİK 🔮"; } 
        else if (rolledItem.rarity.includes("EFSANEVİ")) { embedColor = "#FFD700"; rarityBadge = "👑 EFSANEVİ 👑"; } 
        else if (rolledItem.rarity.includes("DESTANSI")) { embedColor = "#00FFFF"; rarityBadge = "✨ DESTANSI ✨"; }

        const statsSection = (rolledItem.hp || rolledItem.dmg) 
          ? `\n❤️ **Maksimum HP:** \`${rolledItem.hp}\`\n⚔️ **Saldırı Gücü (DMG):** \`${rolledItem.dmg}\``
          : "";

        const finalEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle("✨ KAPSÜL PATLADI! İŞTE YENİ SAVAŞÇIN ✨")
          .setDescription([
            `**${message.author}**, şansına güvenerek kapsülün içindeki kadim gücü serbest bıraktın!`,
            "─".repeat(28),
            `📦 **Karakter:** ${rolledItem.emoji} **${rolledItem.name}**`,
            `💎 **Nadirliği:** \`[ ${rarityBadge} ]\``,
            `📈 **Düşme Oranı:** \`%${rolledItem.chance}\``,
            statsSection,
            "─".repeat(28)
          ].join("\n"))
          .setFooter({ text: `${formatCoins(cost)} HB Harcandı. | Yeni Bakiyen: ${formatCoins(bal - cost)}` })
          .setTimestamp();

        if (rolledItem.image) finalEmbed.setImage(rolledItem.image);

        return await animationMsg.edit({ embeds: [finalEmbed] });

      } catch (error) {
        console.error("Gacha sisteminde hata:", error);
        return message.reply("❌ Kapsül açılırken sistemsel bir arıza meydana geldi, coinlerin iade edildi.");
      } finally {
        // 🔒 Animasyon ne şartta biterse bitsin (başarılı/başarısız) kilidi kaldırıyoruz
        gachaActive.delete(message.author.id);
      }
    }


    if (command === "gsat" || command === "gachasat") {
      const inv = getInventory(message.author.id, message.guild.id);
      const squad = getSquad(message.author.id, message.guild.id);

      if (!inv || inv.length === 0) {
        return message.reply("❌ Envanterinde satacak hiçbir gacha eşyası bulunmuyor!");
      }

      const query = args.join(" ").trim();
      if (!query) {
        return message.reply("❌ Satmak istediğin eşyanın adını yazmalısın! (Örn: `a!sat Evcil Kedi` veya `a!sat hepsi`)");
      }

      const getPrice = (rarity) => {
        if (rarity.includes("İLAHİ")) return 500000;
        if (rarity.includes("MİTİK")) return 50000;
        if (rarity.includes("EFSANEVİ")) return 5000;
        if (rarity.includes("DESTANSI")) return 1000;
        if (rarity.includes("ENDER")) return 750;
        if (rarity.includes("SIRA DIŞI")) return 500;
        if (rarity.includes("YAYGIN")) return 350;
        if (rarity.includes("KÖTÜ")) return 150;
        return 0;
      };

      // ── 1. MOD: TOPLU SATIŞ (Squad Korumalı) ──
      if (query.toLowerCase() === "hepsi" || query.toLowerCase() === "tümü") {
        let totalEarnings = 0;
        let soldCount = 0;
        const keptItems = [];

        let squadCounts = {};
        squad.forEach(x => squadCounts[x] = (squadCounts[x] || 0) + 1);

        for (const itemName of inv) {
          const item = gachaItems.find(i => i.name === itemName);
          if (item && !item.rarity.includes("EFSANEVİ") && !item.rarity.includes("MİTİK") && !item.rarity.includes("İLAHİ")) {
            if (squadCounts[itemName] > 0) {
              squadCounts[itemName]--;
              keptItems.push(itemName);
            } else {
              totalEarnings += getPrice(item.rarity);
              soldCount++;
            }
          } else {
            keptItems.push(itemName);
          }
        }

        if (soldCount === 0) {
          return message.reply("❌ Envanterinde toplu satılabilecek (takımda olmayan veya Efsanevi altı) gacha eşyası kalmamış!");
        }

        userInventory.set(`${message.guild.id}_${message.author.id}`, keptItems);
        saveData(userInventoryFile, userInventory);
        addCoins(message.author.id, message.guild.id, totalEarnings);

        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle("💰 Toplu Gacha Satışı Başarılı!")
              .setDescription(`${message.author}, takımında **takılı olmayan** ve **Efsanevi altı** olan toplam **${soldCount}** adet eşyayı sattın.`)
              .addFields({ name: "Kazanılan Bakiye", value: `**+${formatCoins(totalEarnings)}**` })
              .setTimestamp()
          ]
        });
      }


    // ── 2. MOD: TEKLİ SATIŞ (Squad Korumalı) ──
    const matchedItemName = inv.find(itemName => itemName.toLowerCase() === query.toLowerCase());
    if (!matchedItemName) {
      return message.reply("❌ Envanterinde bu isimde bir eşya bulunamadı!");
    }

    // Envanterdeki toplam adedi ve takımdaki adedi buluyoruz
    const countInInv = inv.filter(x => x === matchedItemName).length;
    const countInSquad = squad.filter(x => x === matchedItemName).length;

    if (countInInv <= countInSquad) {
      return message.reply(`❌ **${matchedItemName}** şu anda savaş takımında (Squad) takılı! Satabilmek için önce \`a!squad çıkar ${matchedItemName}\` yazarak takımdan çıkarmalısın.`);
    }

    const itemDetails = gachaItems.find(i => i.name === matchedItemName);
    const sellPrice = getPrice(itemDetails.rarity);

    const itemIndex = inv.indexOf(matchedItemName);
    inv.splice(itemIndex, 1);
    saveData(userInventoryFile, userInventory);
    addCoins(message.author.id, message.guild.id, sellPrice);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("💰 Eşya Başarıyla Satıldı!")
          .setDescription(`${message.author}, **${itemDetails.emoji} ${itemDetails.name}** eşyasını sattın.\n💰 **Geri Ödeme:** +${formatCoins(sellPrice)}`)
          .setTimestamp()
      ]
    });
  }

  if (command === "squad" || command === "takım" || command === "sq") {
    const inv = getInventory(message.author.id, message.guild.id);
    const squad = getSquad(message.author.id, message.guild.id);
    const subCommand = args[0]?.toLowerCase();

    // ── ALT KOMUT: EKLE (a!squad ekle <eşya adı>) ──
    if (subCommand === "ekle" || subCommand === "add") {
      const itemNameInput = args.slice(1).join(" ").trim();
      if (!itemNameInput) return message.reply("❌ Takıma eklemek istediğin gacha eşyasının tam adını yazmalısın!");

      if (squad.length >= 3) {
        return message.reply("❌ Savaş takımın ağzına kadar dolu! Maksimum **3** gacha eşyası kuşanabilirsin.");
      }

      const matchedItemName = inv.find(x => x.toLowerCase() === itemNameInput.toLowerCase());
      if (!matchedItemName) return message.reply("❌ Envanterinde bu isimde bir gacha bulunamadı!");

      // Kullanılabilir boş kopya var mı kontrolü
      const countInInv = inv.filter(x => x === matchedItemName).length;
      const countInSquad = squad.filter(x => x === matchedItemName).length;

      if (countInInv <= countInSquad) {
        return message.reply("❌ Bu eşyanın envanterindeki tüm kopyalarını zaten takımına eklemişsin!");
      }

      squad.push(matchedItemName);
      saveData(userSquadsFile, Object.fromEntries(userSquads));

      const stats = getGachaStats(matchedItemName);
      return message.reply(`✅ **${stats.emoji} ${stats.name}** başarıyla savaş takımına 3. sıradan eklendi! (❤️ HP: ${stats.hp} | ⚔️ DMG: ${stats.dmg})`);
    }

    // ── ALT KOMUT: ÇIKAR (a!squad çıkar <eşya adı>) ──
    if (subCommand === "çıkar" || subCommand === "remove") {
      const itemNameInput = args.slice(1).join(" ").trim();
      if (!itemNameInput) return message.reply("❌ Takımdan çıkarmak istediğin gacha eşyasının adını yazmalısın!");

      const matchedIdx = squad.findIndex(x => x.toLowerCase() === itemNameInput.toLowerCase());
      if (matchedIdx === -1) return message.reply("❌ Savaş takımında bu isimde bir gacha kuşanılmamış!");

      const removedName = squad[matchedIdx];
      squad.splice(matchedIdx, 1);
      saveData(userSquadsFile, Object.fromEntries(userSquads));

      return message.reply(`✅ **${removedName}** savaş takımından söküldü. Artık güvenle satabilirsin.`);
    }

    // ── ANA MOD: SQUAD LİSTELEME (a!squad) ──
    const embed = new EmbedBuilder()
      .setColor("Blurple")
      .setTitle(`⚔️ ${message.author.username} - Savaş Takımı (Squad)`)
      .setDescription("Maksimum 3 gacha kuşanabilirsin. Buradaki eşyalar satılamaz.\n\n💡 **Ekleme:** `a!squad ekle <ad>` | **Çıkarma:** `a!squad çıkar <ad>`")
      .setTimestamp();

    if (squad.length === 0) {
      embed.addFields({ name: "Takım Durumu", value: "⚠️ Takımın şu an bomboş! Arenaya girmeden önce envanterinden gacha ekle." });
    } else {
      squad.forEach((itemName, index) => {
        const stats = getGachaStats(itemName);
        if (stats) {
          embed.addFields({
            name: `Slot #${index + 1}: ${stats.emoji} ${stats.name}`,
            value: `> **Derece:** ${stats.rarity}\n> **❤️ Can (HP):** \`${stats.hp}\`\n> **⚔️ Hasar (DMG):** \`${stats.dmg}\``
          });
        }
      });
    }

    return message.channel.send({ embeds: [embed] });
  }

  if (command === "dövüş" || command === "vs" || command === "arena") {
    // ⏰ 1 DAKİKALIK COOLDOWN SİSTEMİ
    if (!client.vsCooldowns) client.vsCooldowns = new Map();
    const now = Date.now();
    const cooldownAmount = 60 * 1000; // 60 saniye (1 dakika)

    if (client.vsCooldowns.has(message.author.id)) {
      const expirationTime = client.vsCooldowns.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = Math.round((expirationTime - now) / 1000);
        return message.reply(`⏰ **Sakin ol şampiyon!** Gachalarının dinlenmesi gerekiyor. **${timeLeft} saniye** sonra tekrar arenaya çıkabilirsin.`);
      }
    }

    const target = message.mentions.members.first();

    // Oyuncunun kendi takım verilerini çekiyoruz
    const squad1Names = getSquad(message.author.id, message.guild.id);
    if (squad1Names.length === 0) {
      return message.reply("❌ Senin savaş takımında hiç gacha yok! Önce `a!squad ekle` komutunu kullan.");
    }


    

    // ── ORTAK YARDIMCI FONKSİYONLAR ──────────────────────────────────────────
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const generateHpBar = (current, max) => {
      const cur = Math.max(0, current);
      const totalBars = 8;
      const filled = Math.round((cur / max) * totalBars);
      const empty = totalBars - filled;
      return "🟩".repeat(Math.max(0, filled)) + "⬛".repeat(Math.max(0, empty));
    };

    // ── ANA SAVAŞ MOTORU ─────────────────────────────────────────────────────
    const runBattleSimulation = async (oppName, team2Data, isBotMatch) => {
      // Cooldown'ı savaş kesin olarak başladığı an tetikliyoruz
      client.vsCooldowns.set(message.author.id, now);

      let team1 = squad1Names.map(name => getGachaStats(name));
      let team2 = team2Data;

      let t1Idx = 0; 
      let t2Idx = 0; 
      let round = 1;

      // Savaş Başlangıç Ekranı
      const battleMsg = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#34495E")
            .setTitle(isBotMatch ? "🤖 BOT ARENASI: GÜÇLENDİRİLMİŞ YAPAY ZEKA" : "🏟️ GACHA ARENASI: KAPLANLAR MEYDANI")
            .setDescription(`⚔️ Savaş başlıyor! **${message.author.username}** ve **${oppName}** takımları sahada!\n\n*Savaşçılar pozisyon alıyor, gacha kapsülleri kırılıyor...*`)
            .addFields(
              { name: `🔵 ${message.author.username} Takımı`, value: team1.map(t => `${t.emoji} ${t.name}`).join("\n"), inline: true },
              { name: `🔴 ${oppName} Takımı`, value: team2.map(t => `${t.emoji} ${t.name}`).join("\n"), inline: true }
            )
        ]
      });

      await sleep(2000);

      // DÖVÜŞ ANİMASYON DÖNGÜSÜ
      while (t1Idx < team1.length && t2Idx < team2.length) {
        let p1 = team1[t1Idx];
        let p2 = team2[t2Idx];

        p2.hp -= p1.dmg;
        p1.hp -= p2.dmg;

        let actionText = `🥊 **[RAUNT ${round}]**\n💥 ${p1.emoji} **${p1.name}**, karşıya **${p1.dmg}** vurdu!\n💥 ${p2.emoji} **${p2.name}**, karşıya **${p2.dmg}** vurdu!`;

        const roundEmbed = new EmbedBuilder()
          .setColor("#E74C3C")
          .setTitle(`🏟️ ARENA • AKTİF ÇARPIŞMA`)
          .setDescription(actionText)
          .addFields(
            { 
              name: `🔵 ${message.author.username}`, 
              value: `**${p1.emoji} ${p1.name}**\n${generateHpBar(p1.hp, p1.maxHp)}\n❤️ HP: \`${Math.max(0, p1.hp)}/${p1.maxHp}\``, 
              inline: true 
            },
            { 
              name: `🔴 ${oppName}`, 
              value: `**${p2.emoji} ${p2.name}**\n${generateHpBar(p2.hp, p2.maxHp)}\n❤️ HP: \`${Math.max(0, p2.hp)}/${p2.maxHp}\``, 
              inline: true 
            }
          )
          .setFooter({ text: `Yedekler -> Mavi: ${team1.length - t1Idx - 1} | Kırmızı: ${team2.length - t2Idx - 1}` });

        await battleMsg.edit({ embeds: [roundEmbed] });
        await sleep(1500);

        if (p1.hp <= 0 && p2.hp <= 0) {
          t1Idx++; t2Idx++;
          roundEmbed.setDescription(`💀💥 **ÇİFTE NAKAVT!** ${p1.emoji} \`${p1.name}\` ve ${p2.emoji} \`${p2.name}\` birbirini düşürdü!`);
          await battleMsg.edit({ embeds: [roundEmbed] });
          await sleep(1500);
        } else if (p1.hp <= 0) {
          t1Idx++;
          roundEmbed.setDescription(`💀 **SAVAŞÇI DÜŞTÜ!** 🔵 Savaşçın ${p1.emoji} \`${p1.name}\` elendi!`);
          await battleMsg.edit({ embeds: [roundEmbed] });
          await sleep(1500);
        } else if (p2.hp <= 0) {
          t2Idx++;
          roundEmbed.setDescription(`💀 **SAVAŞÇI DÜŞTÜ!** 🔴 Rakiplerin ${p2.emoji} \`${p2.name}\` elendi!`);
          await battleMsg.edit({ embeds: [roundEmbed] });
          await sleep(1500);
        }

        round++;
        if (round > 25) break;
      }

      // FİNAL AŞAMASI VE ÖDÜLLENDİRME
      let finalEmbed = new EmbedBuilder().setTimestamp();

      if (t1Idx < team1.length && t2Idx >= team2.length) {
        let rewardText = "";
        if (isBotMatch) {
          const rewardAmount = Math.floor(Math.random() * 2501) + 2500; 
          addCoins(message.author.id, message.guild.id, rewardAmount);
          rewardText = `\n\n💰 **Güçlendirilmiş Botu Devirdiğin İçin Ödülün:** \`+${formatCoins(rewardAmount)}\` hesabına aktarıldı!`;
        }

        finalEmbed
          .setColor("Green")
          .setTitle("🏆 ARENADA MUHTEŞEM ZAFER!")
          .setDescription(`🥊 Mücadele bitti! **${oppName}** takımının tüm gachalarını yok eden ${message.author} büyük şampiyon oldu!${rewardText}`)
          .addFields({ name: "Hayatta Kalan Savaşçın", value: `${team1[t1Idx].emoji} **${team1[t1Idx].name}** (❤️ HP: \`${Math.max(0, team1[t1Idx].hp)}/${team1[t1Idx].maxHp}\`)` });

      } else if (t2Idx < team2.length && t1Idx >= team1.length) {
        finalEmbed
          .setColor("Red")
          .setTitle("❌ ARENADA MAĞLUBİYET!")
          .setDescription(`🥊 Güçlü bota karşı tüm gachaların elendi! Mücadeleyi **${oppName}** kazandı. Gachalarını güçlendirip tekrar dene!`);
      } else {
        finalEmbed
          .setColor("Grey")
          .setTitle("🤝 ARENADA BERABERLİK!")
          .setDescription(`İki takımın da tüm gachaları aynı anda yere düştü.`);
      }

      await battleMsg.edit({ embeds: [finalEmbed] });
    };

    // ── MOD AYRIMI: 1. MOD -> 🤖 BOTA KARŞI SAVAŞ (Orta ve Üstü Seviye) ────────
    if (!target) {
      // 🧠 Akıllı Filtreleme: Havuzdaki en güçsüz gachaları (Yaygın/Sıradan/Common) eliyoruz
      const strongPool = gachaItems.filter(item => {
        if (item.rarity) {
          const r = item.rarity.toLowerCase();
          return !(r.includes("yaygın") || r.includes("common") || r.includes("sıradan"));
        }
        return true;
      });

      const finalPool = strongPool.length > 0 ? strongPool : gachaItems;
      let botSquadNames = [];

      for (let i = 0; i < 3; i++) {
        const randomItem = finalPool[Math.floor(Math.random() * finalPool.length)];
        botSquadNames.push(randomItem.name);
      }

      // 📈 ORTA VE ÜSTÜ ZORLUK ÇARPANI
      let botTeamData = botSquadNames.map(name => {
        let stats = getGachaStats(name);
        // Botun canını ve hasarını rastgele %30 ile %60 arasında arttırarak "Zor" modu aktif ediyoruz
        const buffMultiplier = 1 + (Math.random() * 0.3); 
        stats.hp = Math.round(stats.hp * buffMultiplier);
        stats.maxHp = Math.round(stats.maxHp * buffMultiplier);
        stats.dmg = Math.round(stats.dmg * buffMultiplier);
        return stats;
      });

      return runBattleSimulation("Yapay Zeka (Zor)", botTeamData, true);
    }

    // ── MOD AYRIMI: 2. MOD -> ⚔️ OYUNCUYA KARŞI SAVAŞ ──────────────────────────
    if (target.id === message.author.id) return message.reply("❌ Kendi gachalarına karşı dövüşemezsin!");
    if (target.user.bot) return message.reply("❌ Diğer botlara meydan okuyamazsın! Bota karşı oynamak için direkt etiketlemeden `a!vs` yaz!");

    const squad2Names = getSquad(target.id, message.guild.id);
    if (squad2Names.length === 0) {
      return message.reply(`❌ Mücadele etmek istediğin **${target.user.username}** adlı kullanıcının savaş takımı henüz kurulmamış!`);
    }

    const inviteMsg = await message.channel.send({
      content: `⚔️ ${target}, ${message.author} sana gacha takımıyla meydan okuyor!\n💬 Arenaya çıkmak için **onay**, reddetmek için **red** yazmalısın. *(Süre: 30 saniye)*`
    });

    const filter = m => m.author.id === target.id && ["onay", "red"].includes(m.content.toLowerCase().trim());
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on("collect", async m => {
      const reply = m.content.toLowerCase().trim();

      if (reply === "red") {
        return message.channel.send(`❌ ${message.author}, **${target.user.username}** meydan okumanı reddetti! Savaş iptal edildi.`);
      }

      if (reply === "onay") {
        let player2TeamData = squad2Names.map(name => getGachaStats(name));
        await runBattleSimulation(target.user.username, player2TeamData, false);
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        inviteMsg.edit({
          content: `⏰ ${message.author}, gönderdiğin savaş daveti zaman aşımına uğradı. ${target} zamanında cevap vermedi.`
        }).catch(() => {});
      }
    });
  }



  if (command === "upgrade" || command === "geliştir" || command === "gelistir") {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const rebData = getRebirthData(userId, guildId);

    // Geliştirme Konfigürasyonları
    const config = {
      envanter: {
        key: "inv",
        max: 5,
        name: "🎒 Envanter Kapasitesi",
        desc: "Maksimum gacha taşıma sınırını artırır (Sınır: 25).",
        getCost: (lvl) => lvl + 1, // Her seviyede maliyet 1 artar (1, 2, 3, 4, 5 RB)
        getEffect: (lvl) => `${20 + lvl} Eşya Yuvası`
      },
      hiz: {
        key: "speed",
        max: 4,
        name: "⚡ Kapsül Açılış Hızı",
        desc: "Gacha animasyon sürelerini kısaltır.",
        getCost: (lvl) => lvl + 1, // 1, 2, 3, 4 RB
        getEffect: (lvl) => lvl === 0 ? "Normal Hız" : `%${lvl * 15} Daha Hızlı!`
      },
      sans: {
        key: "luck",
        max: 3,
        name: "🍀 Gacha Şansı",
        desc: "Gacha açarken nadir karakter bulma ihtimalini artırır.",
        getCost: (lvl) => (lvl + 1) * 2, // 2, 4, 6 RB
        getEffect: (lvl) => lvl === 0 ? "Normal Şans" : `+%${lvl * 10} Şans Bonusu!`
      }
    };

    const subCommand = args[0]?.toLowerCase();

    // ── 1. MOD: DURUM MENÜSÜ (Eğer alt komut yazılmadıysa) ──
    if (!subCommand) {
      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle("🧪 Geliştirme & Modifikasyon Laboratuvarı")
        .setDescription([
          `Hey ${message.author}, Rebirth yaparak kazandığın **Rebirth Bucks (RB)** puanları ile gacha sistemini kalıcı olarak modifiye edebilirsin!\n`,
          `🔮 **Mevcut Bakiyen:** \`${rebData.rb} RB\``,
          "─".repeat(35)
        ].join("\n"))
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      // Geliştirmeleri listeleme
      Object.entries(config).forEach(([cmdName, item]) => {
        const currentLvl = rebData.upgrades[item.key];
        const isMax = currentLvl >= item.max;
        const costText = isMax ? "🔴 MAKSİMUM" : `🪙 \`${item.getCost(currentLvl)} RB\``;

        embed.addFields({
          name: `${item.name} (Seviye: ${currentLvl}/${item.max})`,
          value: [
            `*${item.desc}*`,
            `📈 **Şu Anki Etki:** \`${item.getEffect(currentLvl)}\``,
            `💰 **Geliştirme Bedeli:** ${costText}`,
            `🔧 \`a!upgrade ${cmdName}\``
          ].join("\n"),
          inline: false
        });
      });

      return message.channel.send({ embeds: [embed] });
    }

    // ── 2. MOD: SATIN ALMA İŞLEMİ ──
    // Türkçe veya İngilizce yazımları eşleştiriyoruz
    let selected = null;
    if (["envanter", "inv", "inventory"].includes(subCommand)) selected = config.envanter;
    if (["hiz", "hız", "speed"].includes(subCommand)) selected = config.hiz;
    if (["sans", "şans", "luck"].includes(subCommand)) selected = config.sans;

    if (!selected) {
      return message.reply("❌ Bilinmeyen geliştirme! Geçerli seçenekler: `envanter`, `hız`, `şans` (Örn: `a!upgrade hız`)");
    }

    const currentLvl = rebData.upgrades[selected.key];

    // Maks seviye kontrolü
    if (currentLvl >= selected.max) {
      return message.reply(`❌ **${selected.name}** geliştirmesi zaten maksimum seviyede! (\`${currentLvl}/${selected.max}\`)`);
    }

    const cost = selected.getCost(currentLvl);

    // RB Bakiye kontrolü
    if (rebData.rb < cost) {
      return message.reply(`❌ Yetersiz Rebirth Bucks! Bu geliştirme için **${cost} RB** gerekiyor. Sende olan: **${rebData.rb} RB**`);
    }

    // 🔥 Geliştirmeyi Uygula ve Kaydet
    rebData.rb -= cost;
    rebData.upgrades[selected.key] += 1;
    saveRebirthData(userId, guildId, rebData);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("⚙️ Geliştirme Başarılı!")
          .setDescription([
            `🎉 **${selected.name}** başarıyla yükseltildi!`,
            "─".repeat(30),
            `📈 **Yeni Seviye:** \`${rebData.upgrades[selected.key]}/${selected.max}\``,
            `⚡ **Yeni Etki:** \`${selected.getEffect(rebData.upgrades[selected.key])}\``,
            `🔮 **Kalan RB Bakiyen:** \`${rebData.rb} RB\``,
            "─".repeat(30)
          ].join("\n"))
          .setTimestamp()
      ]
    });
  }

// ── REBIRT ────────────────────────────────────────────────────────────────

  if (command === "rebirt" || command === "rebirth") {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const rebData = getRebirthData(userId, guildId);

    // 💰 Ücret Hesaplama: 10000 * 10^count (Her seferinde bir sıfır eklenir)
    const cost = 10000 * Math.pow(10, rebData.count);
    const bal = getCoins(userId, guildId);

    if (bal < cost) {
      return message.reply(`❌ Rebirth atmak için yeterli coinin yok!\nRequired: **${formatCoins(cost)}**\nMevcut Bakiyen: **${formatCoins(bal)}**`);
    }

    // 🔥 REBIRTH İŞLEMİ BAŞLIYOR

    // 1. Rebirth ve RB puanlarını güncelle
    rebData.count += 1;
    rebData.rb += 1; // Her rebirth başına 1 Rebirth Bucks veriyoruz
    saveRebirthData(userId, guildId, rebData);

    // 2. Parayı Tamamen Sıfırla
    removeCoins(userId, guildId, bal);

    // 3. Envanteri Tamamen Sıfırla
    userInventory.set(`${guildId}_${userId}`, []);
    saveData(userInventoryFile, userInventory);

    // 4. Eğer varsa Squad'ı (Takımı) da Sıfırla (Hata vermemesi için kontrolle)
    if (typeof userSquads !== "undefined" && userSquads.has(`${guildId}_${userId}`)) {
      userSquads.set(`${guildId}_${userId}`, []);
      saveData(userSquadsFile, userSquads);
    }

    // 5. Tebrik Embed Mesajı
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("🌌 KÜLLERİNDEN YENİDEN DOĞDUN!")
          .setDescription([
            `${message.author}, büyük bir fedakarlık yaparak ruhunu arındırdın!`,
            "Tüm coinin ve envanterin tamamen sıfırlandı.",
            "─".repeat(30),
            `📈 **Yeni Rebirth Seviyen:** \`${rebData.count}\``,
            `🔮 **Kazanılan Para (Rebirth Bucks):** \`+1 RB\` (Toplam: \`${rebData.rb} RB\`)`,
            `💸 **Sonraki Rebirth Maliyeti:** \`${formatCoins(10000 * Math.pow(10, rebData.count))}\``,
            "─".repeat(30)
          ].join("\n"))
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
      ]
    });
  }

  // ── ÜYE PANEL──────────────────────────────────────────────────────────────────
  if (command === "üyepanel" || command === "uyepanel" || command === "panel") {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Bu komutu kullanabilmek için **Yönetici** yetkisine sahip olmalısın!");
    }

    const subCommand = args[0]?.toLowerCase();
    const categoryName = "📊 SUNUCU İSTATİSTİKLERİ 📊";

    if (!subCommand || (subCommand !== "aç" && subCommand !== "ac" && subCommand !== "kapat")) {
      return message.reply("❓ Doğru kullanım: `a!üyepanel aç` veya `a!üyepanel kapat`");
    }

    // ── 1. PANELİ KURMA MODU ──
    if (subCommand === "aç" || subCommand === "ac") {
      const existingCategory = message.guild.channels.cache.find(c => c.name === categoryName && c.type === 4);
      if (existingCategory) {
        return message.reply("⚠️ Sunucuda zaten bir istatistik paneli kurulu!");
      }

      const loading = await message.channel.send("🛠️ Üyeler taranıyor ve panel oluşturuluyor...");

      try {
        // 🔥 ÖNEMLİ: Sunucudaki tüm üyeleri ve botları Discord API'den zorla çekiyoruz
        const allMembers = await message.guild.members.fetch();

        // Kategori oluştur (4 = GuildCategory)
        const category = await message.guild.channels.create({
          name: categoryName,
          type: 4 
        });

        const perms = [{
          id: message.guild.roles.everyone.id,
          deny: ["Connect"],
          allow: ["ViewChannel"]
        }];

        const total = message.guild.memberCount;
        const bots = allMembers.filter(m => m.user.bot).size; // Artık tüm botları görecek!
        const members = total - bots;

        // Ses kanallarını oluştur (2 = GuildVoice)
        await message.guild.channels.create({ name: `👤 Tüm Üyeler: ${total}`, type: 2, parent: category.id, permissionOverwrites: perms });
        await message.guild.channels.create({ name: `👨 Üyeler: ${members}`, type: 2, parent: category.id, permissionOverwrites: perms });
        await message.guild.channels.create({ name: `🤖 Botlar: ${bots}`, type: 2, parent: category.id, permissionOverwrites: perms });

        await loading.delete().catch(() => {});
        return message.reply("✅ Üye paneli başarıyla kuruldu ve kilitlendi!");

      } catch (err) {
        console.error(err);
        await loading.delete().catch(() => {});
        return message.reply("❌ Panel kanalları oluşturulurken bir hata oluştu!");
      }
    }

    // ── 2. PANELİ SİLME/KAPATMA MODU ──
    if (subCommand === "kapat") {
      const category = message.guild.channels.cache.find(c => c.name === categoryName && c.type === 4);
      if (!category) {
        return message.reply("⚠️ Sunucuda kurulu bir panel bulunamadı!");
      }

      const loading = await message.channel.send("🧹 Panel kanalları temizleniyor...");

      try {
        const childChannels = message.guild.channels.cache.filter(c => c.parentId === category.id);
        for (const [id, chan] of childChannels) {
          await chan.delete().catch(() => {});
        }
        await category.delete().catch(() => {});

        await loading.delete().catch(() => {});
        return message.reply("🗑️ Üye paneli başarıyla kaldırıldı!");
      } catch (err) {
        console.error(err);
        await loading.delete().catch(() => {});
        return message.reply("❌ Panel kaldırılırken bir hata oluştu!");
      }
    }
  }

  
  // ── LEVEL ──────────────────────────────────────────────────────────────────
  if (command === "level" || command === "xp") {
    const target = message.mentions.members.first() || message.member;
    const key = `${message.guild.id}_${target.id}`;
    const ud = userLevels.get(key) || { xp: 0, level: 1 };
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(getProfile(target.id, message.guild.id).color || "Purple")
          .setTitle("📊 Level Bilgisi")
          .addFields(
            { name: "Level", value: `${ud.level}`, inline: true },
            { name: "XP", value: `${ud.xp}/${ud.level * 100}`, inline: true },
            { name: "Eksik", value: `${ud.level * 100 - ud.xp}`, inline: true },
          )
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp(),
      ],
    });
  }

  if (command === "levelkanal" || command === "seviyekanal") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    )
      return message.reply("🚫 Yetkin yok!");
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply("Kanal etiketle!");
    levelChannels.set(message.guild.id, ch.id);
    saveData(levelChannelsFile, levelChannels);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Seviye Kanalı Ayarlandı")
          .setDescription(`Tebrik mesajları artık ${ch} kanalına gönderilecek!`)
          .setTimestamp(),
      ],
    });
  }

  // ── SEVİYE ROL SİSTEMİ ─────────────────────────────────────────────────────
  if (command === "seviyerol") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const role = message.mentions.roles.first(),
      level = parseInt(args[1]);
    if (!role || !level || level < 1)
      return message.reply("Kullanım: `a!seviyerol @rol <seviye>`");
    const gr = levelRolesMap.get(message.guild.id) || {};
    gr[String(level)] = role.id;
    levelRolesMap.set(message.guild.id, gr);
    saveData(levelRolesFile, levelRolesMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Seviye Rolü Ayarlandı")
          .setDescription(`**${level}. seviye**ye ulaşanlar ${role} alacak!`)
          .setTimestamp(),
      ],
    });
  }

  if (command === "seviyeroller") {
    const gr = levelRolesMap.get(message.guild.id) || {};
    const entries = Object.entries(gr).sort(
      (a, b) => parseInt(a[0]) - parseInt(b[0]),
    );
    if (entries.length === 0) return message.reply("Seviye rolü ayarlanmamış.");
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("📋 Seviye Rolleri")
          .setDescription(
            entries.map(([l, r]) => `**Seviye ${l}** → <@&${r}>`).join("\n"),
          )
          .setTimestamp(),
      ],
    });
  }
  //

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (command === "leaderboard" || command === "lb" || command === "sıralama") {
    const guildId = message.guild.id,
      lvlData = [],
      coinData = [];
    for (const [k, d] of userLevels.entries()) {
      if (!k.startsWith(guildId + "_")) continue;
      try {
        const u = await client.users.fetch(k.split("_")[1]);
        lvlData.push({ username: u.username, level: d.level, xp: d.xp });
      } catch {}
    }
    for (const [k, coins] of userCoinsMap.entries()) {
      if (!k.startsWith(guildId + "_")) continue;
      try {
        const u = await client.users.fetch(k.split("_")[1]);
        coinData.push({ username: u.username, coins });
      } catch {}
    }
    lvlData.sort((a, b) =>
      b.level !== a.level ? b.level - a.level : b.xp - a.xp,
    );
    coinData.sort((a, b) => b.coins - a.coins);
    const medal = (i) =>
      i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("🏆 Liderlik Tablosu")
          .addFields(
            {
              name: "📊 Level",
              value:
                lvlData
                  .slice(0, 10)
                  .map(
                    (u, i) =>
                      `${medal(i)} **${u.username}** — Lv${u.level} (${u.xp}XP)`,
                  )
                  .join("\n") || "Veri yok",
              inline: false,
            },
            {
              name: "💰 Hunter Bucks",
              value:
                coinData
                  .slice(0, 10)
                  .map(
                    (u, i) =>
                      `${medal(i)} **${u.username}** — ${formatCoins(u.coins)}`,
                  )
                  .join("\n") || "Veri yok",
              inline: false,
            },
          )
          .setFooter({ text: message.guild.name })
          .setTimestamp(),
      ],
    });
  }

  // ── EKONOMİ ────────────────────────────────────────────────────────────────
  const econCmds = [
    "bakiye",
    "balance",
    "bal",
    "hbver",
    "transfer",
    "daily",
    "work",
  ];
  if (
    econCmds.includes(command) &&
    isHbEngel(message.guild.id, message.channel.id)
  )
    return message.reply("🚫 Bu kanalda ekonomi komutları devre dışı!");

  if (command === "bakiye" || command === "balance" || command === "bal") {
    const target = message.mentions.members.first() || message.member;

    // Rebirth verilerini çekiyoruz
    const rebData = getRebirthData(target.id, message.guild.id);
    const rb = rebData ? rebData.rb : 0;
    const coins = getCoins(target.id, message.guild.id);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("💰 Hunter Bucks Bakiye")
          .setDescription([
            `👤 **Kullanıcı:** ${target.user.tag}`,
            `💵 **Hunter Bucks:** **${formatCoins(coins)}**`,
            `🔮 **Rebirth Bucks:** \`${rb} RB\``
          ].join("\n"))
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp(),
      ],
    });
  }


  if (command === "hbver" || command === "transfer") {
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi etiketle!");
    if (target.id === message.author.id)
      return message.reply("Kendine HB gönderemezsin!");
    if (target.user.bot) return message.reply("Botlara HB gönderilemez!");
    const miktar = parseInt(args[1]);
    if (!miktar || miktar < 1) return message.reply("Geçerli miktar gir.");
    const senderBal = getCoins(message.author.id, message.guild.id);
    if (senderBal < miktar)
      return message.reply(`Yetersiz! Bakiyen: **${formatCoins(senderBal)}**`);
    removeCoins(message.author.id, message.guild.id, miktar);
    addCoins(target.id, message.guild.id, miktar);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("💸 HB Transfer")
          .addFields(
            { name: "Gönderen", value: message.author.tag, inline: true },
            { name: "Alan", value: target.user.tag, inline: true },
            { name: "Miktar", value: formatCoins(miktar), inline: true },
            {
              name: "Yeni Bakiyen",
              value: formatCoins(senderBal - miktar),
              inline: true,
            },
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "daily") {
    const cd = getCooldown(dailyCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now())
      return message.reply(
        `⏰ **${formatTime(cd - Date.now())}** sonra tekrar dene.`,
      );
    const amount = Math.floor(Math.random() * 500) + 100;
    addCoins(message.author.id, message.guild.id, amount);
    setCooldown(
      dailyCooldowns,
      message.author.id,
      message.guild.id,
      24 * 60 * 60 * 1000,
    );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("🎁 Günlük Ödül!")
          .setDescription(`Günlük ödülün: **${formatCoins(amount)}**`)
          .setFooter({ text: "24 saat sonra tekrar gelebilirsin!" })
          .setTimestamp(),
      ],
    });
  }

  if (command === "work") {
    const cd = getCooldown(workCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now())
      return message.reply(
        `⏰ **${formatTime(cd - Date.now())}** sonra tekrar çalışabilirsin.`,
      );
    const works = [
      "🍕 Pizza dağıttın",
      "💻 Kod yazdın",
      "🚗 Uber sürücüsü oldun",
      "📚 Ders verdin",
      "🎵 Müzik yaptın",
      "🎨 Tasarım yaptın",
      "📱 Uygulama geliştirdin",
      "🎮 Oyun test ettin",
      "🏪 Kasiyerlik yaptın",
      "🧹 Temizlik yaptın",
    ];
    const work = works[Math.floor(Math.random() * works.length)];
    const earned = Math.floor(Math.random() * 150) + 50;
    addCoins(message.author.id, message.guild.id, earned);
    setCooldown(
      workCooldowns,
      message.author.id,
      message.guild.id,
      60 * 60 * 1000,
    );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle("💼 Çalışma Tamamlandı!")
          .setDescription(`${work} ve **${formatCoins(earned)}** kazandın!`)
          .setFooter({ text: "1 saat sonra tekrar çalışabilirsin!" })
          .setTimestamp(),
      ],
    });
  }

  if (command === "hbayarla") {
    if (message.author.id !== OWNER_ID) return;
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const miktar = parseInt(
      message.mentions.users.size > 0 ? args[1] : args[1],
    );
    if (isNaN(miktar) || miktar < 0)
      return message.reply("Geçerli miktar gir.");
    setCoins(target.id, message.guild.id, miktar);
    saveData(userCoinsFile, userCoinsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("✅ HB Ayarlandı")
          .setDescription(
            `${target.user.tag} kullanıcısının bakiyesi **${formatCoins(miktar)}** oldu.`,
          )
          .setTimestamp(),
      ],
    });
  }


  
  // ── MAĞAZA ─────────────────────────────────────────────────────────────────
  if (command === "shop" || command === "mağaza" || command === "magaza") {
    const colors = SHOP_ITEMS.filter((i) => i.type === "color");
    const badges = SHOP_ITEMS.filter((i) => i.type === "badge");
    const bgs = SHOP_ITEMS.filter((i) => i.type === "background");
    const specials = SHOP_ITEMS.filter(
      (i) => i.type === "bio" || i.type === "ozel_rol",
    );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle("🛒 Hunter Bucks Mağazası")
          .setDescription(
            "Satın almak için: `a!satinal <ürün_id>`\nEnvanter: `a!envanter`",
          )
          .addFields(
            {
              name: "🎨 Profil Renkleri",
              value: colors
                .map(
                  (i) => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`,
                )
                .join("\n"),
              inline: false,
            },
            {
              name: "🏅 Rozetler",
              value: badges
                .map(
                  (i) => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`,
                )
                .join("\n"),
              inline: false,
            },
            {
              name: "🖼️ Arkaplanlar",
              value: bgs
                .map(
                  (i) => `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**`,
                )
                .join("\n"),
              inline: false,
            },
            {
              name: "✨ Özel",
              value: specials
                .map(
                  (i) =>
                    `\`${i.id}\` ${i.name} — **${formatCoins(i.price)}**\n↳ ${i.desc}`,
                )
                .join("\n"),
              inline: false,
            },
          )
          .setFooter({
            text: `Bakiyen: ${formatCoins(getCoins(message.author.id, message.guild.id))}`,
          })
          .setTimestamp(),
      ],
    });
  }

  if (command === "satinal") {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return message.reply("Ürün ID gir. `a!shop` ile bak.");
    const item = getShopItem(itemId);
    if (!item) return message.reply(`❌ \`${itemId}\` adlı ürün bulunamadı.`);

    if (item.type === "ozel_rol") {
      if (hasItem(message.author.id, message.guild.id, itemId))
        return message.reply("Zaten özel rolüne sahipsin!");
      const bal = getCoins(message.author.id, message.guild.id);
      if (bal < item.price)
        return message.reply(
          `Yetersiz! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`,
        );
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("✨ Özel Rol")
            .setDescription(
              `${message.author} rolünün **adı** ne olsun? *(30sn)*`,
            )
            .setTimestamp(),
        ],
      });
      const nameFilter = (m) => m.author.id === message.author.id;
      const nameColl = await message.channel
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        })
        .catch(() => null);
      if (!nameColl || nameColl.size === 0)
        return message.channel.send("⏰ Süre doldu, satın alma iptal.");
      const roleName = nameColl.first().content.slice(0, 50);
      const ROLE_COLORS = {
        kırmızı: "#E74C3C",
        mavi: "#3498DB",
        yeşil: "#2ECC71",
        sarı: "#FFD700",
        mor: "#9B59B6",
        turuncu: "#E67E22",
        pembe: "#FF69B4",
        siyah: "#23272A",
        beyaz: "#ECEFF1",
        turkuaz: "#1ABC9C",
        lacivert: "#1A237E",
        gri: "#95A5A6",
      };
      await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFD700")
            .setDescription(
              `Rol adı: **${roleName}**\n\nRengi ne olsun?\n${Object.keys(ROLE_COLORS).join(", ")}`,
            ),
        ],
      });
      const colorColl = await message.channel
        .awaitMessages({
          filter: nameFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        })
        .catch(() => null);
      if (!colorColl || colorColl.size === 0)
        return message.channel.send("⏰ Süre doldu, satın alma iptal.");
      const colorKey = colorColl.first().content.toLowerCase().trim(),
        colorHex = ROLE_COLORS[colorKey];
      if (!colorHex)
        return message.channel.send(
          `❌ \`${colorKey}\` geçerli renk değil. İptal edildi.`,
        );
      try {
        const newRole = await message.guild.roles.create({
          name: roleName,
          color: colorHex,
          reason: `Özel rol — ${message.author.tag}`,
        });
        await message.member.roles.add(newRole);
        removeCoins(message.author.id, message.guild.id, item.price);
        getInventory(message.author.id, message.guild.id).push(itemId);
        saveData(userInventoryFile, userInventory);
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(colorHex)
              .setTitle("✨ Özel Rol Oluşturuldu!")
              .setDescription(
                `${message.author} artık **${roleName}** rolüne sahip!`,
              )
              .setFooter({ text: `${formatCoins(item.price)} harcandı.` })
              .setTimestamp(),
          ],
        });
      } catch {
        return message.channel.send("❌ Rol oluşturulamadı.");
      }
    }

    if (hasItem(message.author.id, message.guild.id, itemId))
      return message.reply("Bu ürüne zaten sahipsin!");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < item.price)
      return message.reply(
        `Yetersiz! Bakiyen: **${formatCoins(bal)}** — Gerekli: **${formatCoins(item.price)}**`,
      );
    removeCoins(message.author.id, message.guild.id, item.price);
    getInventory(message.author.id, message.guild.id).push(itemId);
    saveData(userInventoryFile, userInventory);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Satın Alma Başarılı!")
          .setDescription(`${item.name} satın aldın!\n${item.desc}`)
          .addFields(
            { name: "Ödenen", value: formatCoins(item.price), inline: true },
            {
              name: "Kalan",
              value: formatCoins(bal - item.price),
              inline: true,
            },
          )
          .setFooter({ text: "Kullanmak için: a!profilayarla" })
          .setTimestamp(),
      ],
    });
  }

  if (command === "envanter") {
    const target = message.mentions.members.first() || message.member;
    const inv = getInventory(target.id, message.guild.id);

    if (inv.length === 0)
      return message.reply(`${target.user.tag} adlı kullanıcının envanteri boş.`);

    const grouped = {
      color: [],
      badge: [],
      bio: [],
      ozel_rol: [],
      background: [],
    };

    const gachaItemsCollected = [];

    for (const id of inv) {
      const item = getShopItem(id);
      if (item) {
        grouped[item.type]?.push(item);
      } else {
        // Mağazada yoksa gacha eşyasıdır
        gachaItemsCollected.push(id);
      }
    }

    const fields = [];
    if (grouped.color.length)
      fields.push({
        name: "🎨 Renkler",
        value: grouped.color.map((i) => `${i.name} (\`${i.id}\`)`).join("\n"),
        inline: false,
      });
    if (grouped.badge.length)
      fields.push({
        name: "🏅 Rozetler",
        value: grouped.badge.map((i) => `${i.name} (\`${i.id}\`)`).join("\n"),
        inline: false,
      });
    if (grouped.background.length)
      fields.push({
        name: "🖼️ Arkaplanlar",
        value: grouped.background.map((i) => `${i.name} (\`${i.id}\`)`).join("\n"),
        inline: false,
      });
    if (grouped.bio.length)
      fields.push({ name: "✨ Özel", value: "Bio kilidi aktif", inline: false });
    if (grouped.ozel_rol.length)
      fields.push({ name: "👑 Özel Rol", value: "Özel role sahipsin!", inline: false });

    // 🎰 GACHA EŞYALARINI ŞANS DEĞERLERİYLE GÖSTERME ALANI
    if (gachaItemsCollected.length) {
      // Eşyaları grupluyoruz (Örn: Evcil Kedi'den kaç tane var)
      const counts = {};
      gachaItemsCollected.forEach(x => counts[x] = (counts[x] || 0) + 1);

      const gachaValueText = Object.entries(counts)
        .map(([name, count]) => {
          // Eşyanın orijinal gacha bilgisini listeden buluyoruz
          const original = gachaItems.find(g => g.name === name);
          const emoji = original ? original.emoji : "📦";

          let chanceText = "";
          if (original) {
            // Listede yazdığın şans değerini direkt çeker (%8.0, %0.001 vb.)
            chanceText = ` \`(%${original.chance})\``; 
          }

          return `${emoji} **${name}**${chanceText} ${count > 1 ? `x${count}` : ""}`;
        })
        .join("\n");

      // 🎒 DOLULUK KONTROLÜ VE GÖRSEL REHBER
      const rebData = getRebirthData(target.id, message.guild.id);
      const maxSlots = 20 + (rebData.upgrades.inv || 0); // Satın alınan envanter geliştirmesini ekledik (Maks 25)

      const isFull = gachaItemsCollected.length >= maxSlots;
      const statusEmoji = isFull ? "🔴" : "🎰";
      const titleSuffix = isFull ? " **(DOLU!)**" : "";

      fields.push({
        name: `${statusEmoji} Kazanılan Gacha Eşyaları (${gachaItemsCollected.length}/${maxSlots})${titleSuffix}`,
        value: gachaValueText + (isFull ? `\n\n⚠️ **Envanterin tamamen dolu! Yeni gacha rolleri atabilmek için bazı eşyalarını satman gerekiyor.**` : ""),
        inline: false
      });

    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(getProfile(target.id, message.guild.id).color || "#5865F2")
          .setTitle(`🎒 ${target.user.tag} — Envanter`)
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .addFields(...fields)
          .setTimestamp(),
      ],
    });
  }



  if (command === "profilayarla" || command === "profil-ayarla") {
    const sub = args[0]?.toLowerCase();
    const val = args.slice(1).join(" ");
    const prof = getProfile(message.author.id, message.guild.id);
    const inv = getInventory(message.author.id, message.guild.id);
    if (!sub)
      return message.reply(
        [
          "`a!profilayarla renk <id>`",
          "`a!profilayarla rozet <id>`",
          "`a!profilayarla bio <metin>`",
          "`a!profilayarla arkaplan <id>`",
        ].join("\n"),
      );
    if (sub === "renk" || sub === "color") {
      const itemId = val.toLowerCase();
      if (!inv.includes(itemId))
        return message.reply(`Bu rengi almadın! \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "color")
        return message.reply("Geçerli renk ID gir.");
      prof.color = item.value;
      saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Profil rengin **${item.name}** oldu!`);
    }
    if (sub === "rozet" || sub === "badge") {
      const itemId = val.toLowerCase();
      if (itemId === "kaldır" || itemId === "kaldir") {
        prof.activeBadge = "";
        saveData(userProfilesFile, userProfiles);
        return message.reply("✅ Rozet kaldırıldı.");
      }
      if (!inv.includes(itemId))
        return message.reply(`Bu rozeti almadın! \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "badge")
        return message.reply("Geçerli rozet ID gir.");
      prof.activeBadge = item.value;
      saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Aktif rozetin **${item.name}** oldu!`);
    }
    if (sub === "bio") {
      if (!inv.includes("bio_unlock"))
        return message.reply("Bio için önce `a!satinal bio_unlock` satın al!");
      if (!val) return message.reply("Bio metni gir.");
      if (val.length > 100) return message.reply("Bio en fazla 100 karakter!");
      prof.bio = val;
      saveData(userProfilesFile, userProfiles);
      return message.reply("✅ Bio güncellendi!");
    }
    if (sub === "arkaplan" || sub === "bg" || sub === "background") {
      const itemId = val.toLowerCase();
      if (!inv.includes(itemId))
        return message.reply(`Bu arkaplanı almadın! \`a!satinal ${itemId}\``);
      const item = getShopItem(itemId);
      if (!item || item.type !== "background")
        return message.reply("Geçerli arkaplan ID gir.");
      prof.background = item.value;
      saveData(userProfilesFile, userProfiles);
      return message.reply(`✅ Arkaplanın **${item.name}** oldu!`);
    }
    return message.reply(
      "Geçerli seçenekler: `renk`, `rozet`, `bio`, `arkaplan`",
    );
  }

  // ── PROFİL (Canvas) ────────────────────────────────────────────────────────
  if (command === "profil") {
  const hedefKullanici = message.mentions.users.first() || message.author;
  const userData = getUserData(hedefKullanici.id);

  // Canvas boyutlarını belirle (Geniş profil formatı)
  const canvas = createCanvas(900, 300);
  const ctx = canvas.getContext('2d');

  // 1. Arka Plan Resmi (Kullanıcının Bannerını Discord API'den çekme)
  let bannerUrl = null;
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || client.token);
    const userRes = await rest.get(Routes.user(hedefKullanici.id));
    if (userRes.banner) {
      bannerUrl = `https://cdn.discordapp.com/banners/${hedefKullanici.id}/${userRes.banner}.png?size=1024`;
    }
  } catch (err) {
    console.log("Banner çekilirken hata oluştu, varsayılan renk kullanılacak.");
  }

  if (bannerUrl) {
    const bannerImg = await loadImage(bannerUrl);
    ctx.drawImage(bannerImg, 0, 0, canvas.width, canvas.height);
    // Bannerın üzerine koyu bir katman atalım ki yazılar okunsun
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Banner yoksa özgün koyu mor/siyah degrade arka plan
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f0c20');
    grad.addColorStop(1, '#15102a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Tasarımdaki ince mor dış çerçeve çizgisi
  ctx.strokeStyle = '#6a1b9a';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // 2. Kullanıcı Adı ve Unvanı Yazma
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(hedefKullanici.username, 270, 75);

  ctx.fillStyle = '#8e24aa';
  ctx.font = '20px sans-serif';
  ctx.fillText('#Sokak Şövalyesi', 270, 105); // Sana özel minimal simge havası

  // Matematiksel Değerler
  const reqChatXp = getRequiredXp(userData.chatLevel);
  const reqVoiceXp = getRequiredXp(userData.voiceLevel);

  const chatYuzde = Math.min(userData.chatXp / reqChatXp, 1);
  const voiceYuzde = Math.min(userData.voiceXp / reqVoiceXp, 1);

  // 3. MESAJ SEVİYESİ BARI VE METİNLERİ
  ctx.fillStyle = '#b0bec5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('MESAJ SEVİYESİ', 270, 150);

  ctx.fillStyle = '#8e24aa';
  ctx.fillText(`LVL ${userData.chatLevel}`, 750, 150);

  // Barın Arka Planı (Koyu gri şerit)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(270, 160, 550, 25, 12.5);
  ctx.fill();

  // Aktif İlerleme Barı (Mor)
  if (chatYuzde > 0) {
    ctx.fillStyle = '#7b1fa2';
    ctx.beginPath();
    ctx.roundRect(270, 160, 550 * chatYuzde, 25, 12.5);
    ctx.fill();
  }

  // Bar İçi Yazı
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${userData.chatXp.toLocaleString()} / ${reqChatXp.toLocaleString()} XP`, 270 + 275, 177);
  ctx.textAlign = 'start'; // Hizalamayı sıfırla

  // 4. SES SEVİYESİ BARI VE METİNLERİ
  ctx.fillStyle = '#b0bec5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('SES SEVİYESİ', 270, 220);

  ctx.fillStyle = '#8e24aa';
  ctx.fillText(`LVL ${userData.voiceLevel}`, 750, 220);

  // Barın Arka Planı
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(270, 230, 550, 25, 12.5);
  ctx.fill();

  // Aktif İlerleme Barı (Mor)
  if (voiceYuzde > 0) {
    ctx.fillStyle = '#7b1fa2';
    ctx.beginPath();
    ctx.roundRect(270, 230, 550 * voiceYuzde, 25, 12.5);
    ctx.fill();
  }

  // Bar İçi Yazı
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${userData.voiceXp.toLocaleString()} / ${reqVoiceXp.toLocaleString()} XP`, 270 + 275, 247);
  ctx.textAlign = 'start';

  // 5. YUVARLAK AVATAR ÇİZİMİ
  const avatarUrl = hedefKullanici.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(avatarUrl);

  ctx.save();
  ctx.beginPath();
  ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, 50, 60, 180, 180);
  ctx.restore();

  // Avatar Dış Çerçevesi (Şık beyaz çizgi)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
  ctx.stroke();

  // Dosya Olarak Discord'a Gönderme İşlemi
  const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profil-karti.png' });
  return message.reply({ files: [attachment] });
}



  // ── İSTATİSTİK ────────────────────────────────────────────────────────────
  if (command === "istatistik" || command === "stats") {
    const target = message.mentions.members.first() || message.member;
    const stats = getStats(target.id, message.guild.id);
    checkAndResetStats(stats);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(getProfile(target.id, message.guild.id).color || "#5865F2")
          .setTitle(`📊 ${target.user.tag} — İstatistikler`)
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            {
              name: `📅 Bu Hafta`,
              value: [
                `💬 ${stats.weekly.messages.toLocaleString()} mesaj`,
                `🔊 ${formatDuration(stats.weekly.voiceMinutes)}`,
              ].join("\n"),
              inline: true,
            },
            {
              name: `🗓️ Bu Ay`,
              value: [
                `💬 ${stats.monthly.messages.toLocaleString()} mesaj`,
                `🔊 ${formatDuration(stats.monthly.voiceMinutes)}`,
              ].join("\n"),
              inline: true,
            },
          )
          .setTimestamp(),
      ],
    });
  }

  // ── SUNUCU BİLGİ ──────────────────────────────────────────────────────────
  if (command === "sunucubilgi") {
    const { guild } = message;
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`📋 ${guild.name}`)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: "Üye", value: `${guild.memberCount}`, inline: true },
            {
              name: "Kanal",
              value: `${guild.channels.cache.size}`,
              inline: true,
            },
            { name: "Rol", value: `${guild.roles.cache.size}`, inline: true },
            {
              name: "Kuruluş",
              value: guild.createdAt.toDateString(),
              inline: true,
            },
            { name: "Sahip", value: `<@${guild.ownerId}>`, inline: true },
            {
              name: "Boost",
              value: `Lv${guild.premiumTier} (${guild.premiumSubscriptionCount || 0})`,
              inline: true,
            },
          )
          .setTimestamp(),
      ],
    });
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  if (command === "avatar") {
    const target = message.mentions.members.first() || message.member;
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`${target.user.tag} — Avatar`)
          .setImage(target.user.displayAvatarURL({ dynamic: true, size: 512 })),
      ],
    });
  }
  

  // ── OYUNLAR ────────────────────────────────────────────────────────────────
  const gameCmds = [
    "slot",
    "coinflip",
    "cf",
    "dice",
    "hunt",
    "fish",
    "rob",
    "roulette",
    "blackjack",
    "bj",
    "sans",
    "şans",
  ];
  if (
    gameCmds.includes(command) &&
    isHbEngel(message.guild.id, message.channel.id)
  )
    return message.reply("🚫 Bu kanalda oyunlar devre dışı!");

  if (command === "slot") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!slot 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
    const result = [0, 1, 2].map(
      () => symbols[Math.floor(Math.random() * symbols.length)],
    );
    let multiplier = 0;
    if (result[0] === result[1] && result[1] === result[2])
      multiplier = result[0] === "💎" ? 10 : result[0] === "⭐" ? 5 : 3;
    else if (
      result[0] === result[1] ||
      result[1] === result[2] ||
      result[0] === result[2]
    )
      multiplier = 1.5;
    let resultText, color;
    if (multiplier > 0) {
      const win = Math.floor(amount * multiplier);
      addCoins(message.author.id, message.guild.id, win - amount);
      resultText = `🎉 Kazandın! **${formatCoins(win)}**`;
      color = "Green";
    } else {
      removeCoins(message.author.id, message.guild.id, amount);
      resultText = `😢 Kaybettin! **${formatCoins(amount)}** gitti.`;
      color = "Red";
    }
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle("🎰 Slot Machine")
          .setDescription(`${result.join(" | ")}\n\n${resultText}`)
          .setTimestamp(),
      ],
    });
  }

  if (command === "coinflip" || command === "cf") {
    const amount = parseInt(args[0]),
      choice = args[1]?.toLowerCase();
    if (!amount || amount < 1)
      return message.reply("Örnek: `a!coinflip 100 yazı`");
    if (!choice || (choice !== "yazı" && choice !== "tura"))
      return message.reply("Yazı veya tura seç!");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const result = Math.random() < 0.5 ? "yazı" : "tura";
    const won = choice === result;
    if (won) addCoins(message.author.id, message.guild.id, amount);
    else removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(won ? "Green" : "Red")
          .setTitle("🪙 Coinflip")
          .setDescription(
            `Sonuç: **${result}** | Seçimin: **${choice}**\n\n${won ? `🎉 Kazandın! **${formatCoins(amount * 2)}**` : `😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`,
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "dice") {
    const amount = parseInt(args[0]),
      guess = parseInt(args[1]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!dice 100 3`");
    if (!guess || guess < 1 || guess > 6)
      return message.reply("1-6 arası tahmin gir!");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const result = Math.floor(Math.random() * 6) + 1;
    const won = guess === result;
    if (won) addCoins(message.author.id, message.guild.id, amount * 5);
    else removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(won ? "Green" : "Red")
          .setTitle("🎲 Zar")
          .setDescription(
            `Zar: **${result}** | Tahmin: **${guess}**\n\n${won ? `🎉 Kazandın! **${formatCoins(amount * 5)}**` : `😢 Kaybettin! **${formatCoins(amount)}** gitti.`}`,
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "hunt") {
    const animals = [
      { name: "🐰 Tavşan", value: 50 },
      { name: "🦌 Geyik", value: 100 },
      { name: "🐗 Domuz", value: 150 },
      { name: "🐺 Kurt", value: 200 },
      { name: "🐻 Ayı", value: 300 },
      { name: "🦁 Aslan", value: 500 },
      { name: "🐉 Ejderha", value: 1000 },
    ];
    if (Math.random() < 0.7) {
      const a = animals[Math.floor(Math.random() * animals.length)];
      addCoins(message.author.id, message.guild.id, a.value);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("🏹 Avlanma Başarılı!")
            .setDescription(
              `${a.name} yakaladın! **${formatCoins(a.value)}** kazandın.`,
            )
            .setTimestamp(),
        ],
      });
    }
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("🏹 Avlanma Başarısız!")
          .setDescription("Hiçbir şey yakalayamadın!")
          .setTimestamp(),
      ],
    });
  }

  if (command === "fish") {
    const fishes = [
      { name: "🐟 Küçük Balık", value: 30 },
      { name: "🐠 Renkli Balık", value: 60 },
      { name: "🦈 Köpekbalığı", value: 200 },
      { name: "🐋 Balina", value: 400 },
      { name: "🦑 Ahtapot", value: 100 },
      { name: "🦀 Yengeç", value: 80 },
      { name: "🐙 Dev Ahtapot", value: 600 },
    ];
    if (Math.random() < 0.8) {
      const f = fishes[Math.floor(Math.random() * fishes.length)];
      addCoins(message.author.id, message.guild.id, f.value);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🎣 Balık Tutma Başarılı!")
            .setDescription(
              `${f.name} tuttun! **${formatCoins(f.value)}** kazandın.`,
            )
            .setTimestamp(),
        ],
      });
    }
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Gray")
          .setTitle("🎣 Balık Tutma Başarısız!")
          .setDescription("Hiçbir balık tutamadın!")
          .setTimestamp(),
      ],
    });
  }

  if (command === "rob") {
    const cd = getCooldown(robCooldowns, message.author.id, message.guild.id);
    if (cd > Date.now())
      return message.reply(
        `⏰ Soygun için **${formatTime(cd - Date.now())}** bekle.`,
      );
    const target = message.mentions.members.first();
    if (!target) return message.reply("Kimi soyacaksın? Etiketle!");
    if (target.id === message.author.id)
      return message.reply("Kendini soyamazsın!");
    if (target.user.bot) return message.reply("Botları soyamazsın!");
    const targetBal = getCoins(target.id, message.guild.id);
    if (targetBal < 50)
      return message.reply(
        `${target.user.tag} adlı kullanıcının soymaya değer parası yok!`,
      );
    setCooldown(
      robCooldowns,
      message.author.id,
      message.guild.id,
      2 * 60 * 60 * 1000,
    );
    if (Math.random() < 0.35) {
      const stolen = Math.floor(targetBal * (Math.random() * 0.3 + 0.1));
      removeCoins(target.id, message.guild.id, stolen);
      addCoins(message.author.id, message.guild.id, stolen);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("🦹 Soygun Başarılı!")
            .setDescription(
              `${target.user.tag} kullanıcısından **${formatCoins(stolen)}** çaldın!`,
            )
            .setFooter({ text: "Sonraki soygun: 2 saat sonra" })
            .setTimestamp(),
        ],
      });
    } else {
      const fine = Math.floor(
        Math.min(getCoins(message.author.id, message.guild.id) * 0.2, 500),
      );
      removeCoins(message.author.id, message.guild.id, fine);
      addCoins(target.id, message.guild.id, fine);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚔 Yakalandın!")
            .setDescription(
              `Soygun başarısız! Ceza: **${formatCoins(fine)}** ${target.user.tag} adlı kullanıcıya gitti.`,
            )
            .setFooter({ text: "Sonraki soygun: 2 saat sonra" })
            .setTimestamp(),
        ],
      });
    }
  }

  if (command === "roulette") {
    const amount = parseInt(args[0]),
      bet = args[1]?.toLowerCase();
    if (!amount || amount < 1)
      return message.reply("Örnek: `a!roulette 100 kırmızı`");
    if (!bet || !["kırmızı", "siyah", "yeşil"].includes(bet))
      return message.reply("Seçenekler: `kırmızı`, `siyah`, `yeşil`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const num = Math.floor(Math.random() * 37);
    const resultColor =
      num === 0 ? "yeşil" : num % 2 === 0 ? "siyah" : "kırmızı";
    const won = bet === resultColor,
      multiplier = bet === "yeşil" ? 14 : 2;
    const colorEmoji = { kırmızı: "🔴", siyah: "⚫", yeşil: "🟢" };
    if (won)
      addCoins(message.author.id, message.guild.id, amount * (multiplier - 1));
    else removeCoins(message.author.id, message.guild.id, amount);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(won ? "Green" : "Red")
          .setTitle("🎡 Rulet")
          .addFields(
            {
              name: "Sonuç",
              value: `${colorEmoji[resultColor]} **${num}** (${resultColor})`,
              inline: true,
            },
            {
              name: "Seçimin",
              value: `${colorEmoji[bet]} ${bet}`,
              inline: true,
            },
            {
              name: won ? "Kazandın!" : "Kaybettin!",
              value: won
                ? `**+${formatCoins(amount * (multiplier - 1))}**`
                : `**-${formatCoins(amount)}**`,
              inline: true,
            },
          )
          .setFooter({ text: "Yeşil seçersen 14x kazanırsın!" })
          .setTimestamp(),
      ],
    });
  }

  if (command === "blackjack" || command === "bj") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!blackjack 100`");
    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);
    const deck = () => {
      const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
      return cards[Math.floor(Math.random() * cards.length)];
    };
    const handValue = (hand) => {
      let s = hand.reduce((a, b) => a + b, 0),
        a = hand.filter((c) => c === 11).length;
      while (s > 21 && a > 0) {
        s -= 10;
        a--;
      }
      return s;
    };
    const ph = [deck(), deck()],
      dh = [deck(), deck()];
    while (handValue(dh) < 17) dh.push(deck());
    const pv = handValue(ph),
      dv = handValue(dh);
    let result, color;
    if (pv > 21) {
      result = `😢 Battın! (${pv}) **-${formatCoins(amount)}**`;
      removeCoins(message.author.id, message.guild.id, amount);
      color = "Red";
    } else if (dv > 21 || pv > dv) {
      result = `🎉 Kazandın! (${pv} vs ${dv}) **+${formatCoins(amount)}**`;
      addCoins(message.author.id, message.guild.id, amount);
      color = "Green";
    } else if (pv === dv) {
      result = `🤝 Beraberlik! (${pv}) Bakiyen iade edildi.`;
      color = "Yellow";
    } else {
      result = `😢 Kaybettin! (${pv} vs ${dv}) **-${formatCoins(amount)}**`;
      removeCoins(message.author.id, message.guild.id, amount);
      color = "Red";
    }
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle("🃏 Blackjack")
          .addFields(
            {
              name: "Senin El",
              value: `${ph.join("+")} = **${pv}**`,
              inline: true,
            },
            {
              name: "Dealer El",
              value: `${dh.join("+")} = **${dv}**`,
              inline: true,
            },
            { name: "Sonuç", value: result, inline: false },
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "sans" || command === "şans") {
    const amount = parseInt(args[0]);
    if (!amount || amount < 1) return message.reply("Örnek: `a!sans 100`");

    const bal = getCoins(message.author.id, message.guild.id);
    if (bal < amount) return message.reply(`Yetersiz! **${formatCoins(bal)}**`);

    // ⏱️ 10 Saniyelik Cooldown Kontrolü
    const userId = message.author.id;
    const now = Date.now();
    const cooldownAmount = 10 * 1000;

    if (sansCooldown.has(userId)) {
      const expirationTime = sansCooldown.get(userId) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);

        // Uyarı mesajını gönderip 4 saniye (4000ms) sonra otomatik siliyoruz
        return message.reply(`🛑 Çok hızlısın! Bu komutu tekrar kullanabilmek için **${timeLeft}** saniye beklemelisin.`)
          .then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 4000);
          });
      }
    }

    // Tüm kontrolleri geçti, cooldown süresini başlatıyoruz
    sansCooldown.set(userId, now);
    setTimeout(() => sansCooldown.delete(userId), cooldownAmount);

    // 🎡 YENİ NERFLENMİŞ ÇARK MANTIĞI (Maksimum 3x)
    const segments = [
      { label: "💀 Hepsini Kaybettin!", multiplier: 0, color: "DarkRed" },
      { label: "😢 Yarısını Kaybettin", multiplier: 0.5, color: "Red" },
      { label: "🤝 Başa Baş (Paranı Geri Aldın)", multiplier: 1, color: "Yellow" },
      { label: "✨ 1.5x!", multiplier: 1.5, color: "Green" },
      { label: "🎉 2x!", multiplier: 2, color: "Green" },
      { label: "🔥 3x MEGAPOT!", multiplier: 3, color: "Gold" },
    ];

    // 🎰 ACIMASIZ KUMARHANE ORANLARI (Toplamı tam 100 yapar)
    // - Kaybetme ihtimali (0x ve 0.5x toplamı): %56! (Oynayanların yarısından fazlası direkt zararla ayrılacak)
    // - En yüksek ödül olan 3x ihtimali: Sadece %2!
    const weights = [20, 20, 30, 15, 10, 5];

    let rand = Math.random() * 100,
      cum = 0,
      chosen = segments[0];

    for (let i = 0; i < segments.length; i++) {
      cum += weights[i];
      if (rand < cum) {
        chosen = segments[i];
        break;
      }
    }

    const payout = Math.floor(amount * chosen.multiplier),
      diff = payout - amount;

    if (diff >= 0) addCoins(message.author.id, message.guild.id, diff);
    else removeCoins(message.author.id, message.guild.id, Math.abs(diff));

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(chosen.color)
          .setTitle("🎡 Şans Çarkı")
          .addFields(
            { name: "Sonuç", value: chosen.label, inline: true },
            { name: "Bahis", value: formatCoins(amount), inline: true },
            {
              name: diff >= 0 ? "Kazandın" : "Kaybettin",
              value: `**${diff >= 0 ? "+" : ""}${formatCoins(Math.abs(diff))}**`,
              inline: true,
            },
          )
          .setTimestamp(),
      ],
    });
  }




  // ── MOD ROL AYARLARI ────────────────────────────────────────────────────────
  const modRolCommands = {
    warnrol: "warn",
    banrol: "ban",
    kickrol: "kick",
    muterol: "mute",
    temizlerol: "temizle",
  };
  if (modRolCommands[command]) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const role = message.mentions.roles.first();
    if (!role)
      return message.reply(`Rol etiketle! Örnek: \`a!${command} @Moderatör\``);
    const gr = modRolesMap.get(message.guild.id) || {};
    gr[modRolCommands[command]] = role.id;
    modRolesMap.set(message.guild.id, gr);
    saveData(modRolesFile, modRolesMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Mod Rolü Ayarlandı")
          .setDescription(
            `**${modRolCommands[command]}** komutu artık ${role} tarafından kullanılabilir.`,
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "modroller") {
    const gr = modRolesMap.get(message.guild.id) || {};
    const lines = ["ban", "kick", "mute", "warn", "temizle"].map(
      (k) => `**${k}** → ${gr[k] ? `<@&${gr[k]}>` : "*Ayarlanmadı*"}`,
    );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("⚙️ Mod Rolleri")
          .setDescription(lines.join("\n"))
          .setTimestamp(),
      ],
    });
  }

  // ── LOG AYARLARI ────────────────────────────────────────────────────────────
  const logTypes = {
    ses: "🔊 Ses Logu",
    davet: "📥 Davet Logu",
    mesaj: "✏️ Mesaj Logu",
  };

  if (command === "logayarla") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type])
      return message.reply("Geçerli türler: `ses`, `davet`, `mesaj`");
    const ch = message.mentions.channels.first();
    if (!ch)
      return message.reply(`Kanal etiketle! \`a!logayarla ${type} #kanal\``);
    const settings = getLogSettings(message.guild.id);
    settings[type] = { enabled: true, channelId: ch.id };
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Log Ayarlandı")
          .setDescription(`${logTypes[type]} artık ${ch} kanalına gidiyor.`)
          .setTimestamp(),
      ],
    });
  }
  if (command === "logkapat") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type])
      return message.reply("Geçerli: `ses`, `davet`, `mesaj`");
    const settings = getLogSettings(message.guild.id);
    settings[type].enabled = false;
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("🔕 Log Kapatıldı")
          .setDescription(`${logTypes[type]} kapalı.`)
          .setTimestamp(),
      ],
    });
  }
  if (command === "logac" || command === "logaç") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const type = args[0]?.toLowerCase();
    if (!logTypes[type])
      return message.reply("Geçerli: `ses`, `davet`, `mesaj`");
    const settings = getLogSettings(message.guild.id);
    if (!settings[type].channelId)
      return message.reply(`Önce kanal ayarla: \`a!logayarla ${type} #kanal\``);
    settings[type].enabled = true;
    logSettingsMap.set(message.guild.id, settings);
    saveData(logSettingsFile, logSettingsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("🔔 Log Açıldı")
          .setDescription(`${logTypes[type]} açık.`)
          .setTimestamp(),
      ],
    });
  }
  if (command === "logdurum") {
    const settings = getLogSettings(message.guild.id);
    const lines = Object.entries(logTypes).map(
      ([k, l]) =>
        `${l}\n↳ ${settings[k].enabled ? "✅ Açık" : "❌ Kapalı"} | ${settings[k].channelId ? `<#${settings[k].channelId}>` : "*Kanal yok*"}`,
    );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("📋 Log Durumu")
          .setDescription(lines.join("\n\n"))
          .setTimestamp(),
      ],
    });
  }

  // ── PK SİSTEMİ ─────────────────────────────────────────────────────────────
  if (command === "pk") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const sub = args[0]?.toLowerCase();
    if (!sub || !["aç", "ac", "kapat"].includes(sub))
      return message.reply("Kullanım: `a!pk aç` veya `a!pk kapat`");
    const enabled = sub === "aç" || sub === "ac";
    pkSettingsMap.set(message.guild.id, { enabled });
    saveData(pkSettingsFile, pkSettingsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(enabled ? "Green" : "Red")
          .setTitle(
            enabled
              ? "🛡️ Patlama Koruması Açıldı"
              : "🛡️ Patlama Koruması Kapatıldı",
          )
          .setDescription(
            enabled
              ? "5dk içinde 3+ kanal silen/düzenleyen otomatik banlanır."
              : "Devre dışı bırakıldı.",
          )
          .setTimestamp(),
      ],
    });
  }

  // ── HB ENGEL ────────────────────────────────────────────────────────────────
  if (command === "hbengel") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const sub = args[0]?.toLowerCase();
    if (!sub || !["aç", "ac", "kapat"].includes(sub))
      return message.reply("Kullanım: `a!hbengel aç` veya `a!hbengel kapat`");
    const channels = hbEngelMap.get(message.guild.id) || [];
    const channelId = message.channel.id;
    if (sub === "aç" || sub === "ac") {
      if (!channels.includes(channelId)) {
        channels.push(channelId);
        hbEngelMap.set(message.guild.id, channels);
        saveData(hbEngelFile, hbEngelMap);
      }
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("🚫 HB Engeli Açıldı")
            .setDescription("Bu kanalda ekonomi ve oyun komutları devre dışı.")
            .setTimestamp(),
        ],
      });
    } else {
      hbEngelMap.set(
        message.guild.id,
        channels.filter((c) => c !== channelId),
      );
      saveData(hbEngelFile, hbEngelMap);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ HB Engeli Kaldırıldı")
            .setDescription(
              "Bu kanalda ekonomi ve oyun komutları tekrar aktif.",
            )
            .setTimestamp(),
        ],
      });
    }
  }

  // ── ROL OLUŞTUR ─────────────────────────────────────────────────────────────
  if (command === "rololustur") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const colorArg = args[args.length - 1],
      isHex = /^#[0-9A-Fa-f]{6}$/.test(colorArg);
    const roleName = isHex ? args.slice(0, -1).join(" ") : args.join(" ");
    if (!roleName)
      return message.reply(
        "Kullanım: `a!rololustur <rol adı> <#renk>` Örnek: `a!rololustur Moderatör #E74C3C`",
      );
    try {
      const newRole = await message.guild.roles.create({
        name: roleName,
        color: isHex ? colorArg : "#99AAB5",
        reason: `${message.author.tag} tarafından`,
      });
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(isHex ? colorArg : "#99AAB5")
            .setTitle("✅ Rol Oluşturuldu")
            .addFields(
              { name: "Rol", value: `${newRole}`, inline: true },
              {
                name: "Renk",
                value: isHex ? colorArg : "#99AAB5",
                inline: true,
              },
            )
            .setTimestamp(),
        ],
      });
    } catch {
      return message.reply("❌ Rol oluşturulamadı.");
    }
  }

  // ── BAŞVURU SİSTEMİ KOMUTLARI ─────────────────────────────────────────────

  // 1. KURULUM KOMUTU
  if (command === "ytsetup") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const ch = message.mentions.channels.first();
    if (!ch)
      return message.reply("Kanal etiketle! Örnek: `a!ytsetup #başvurular`");

    const current = ytSettingsMap.get(message.guild.id) || {};
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📋 Yetkili Başvurusu")
      .setDescription(
        "Yetkili olmak istiyorsan aşağıdaki 📝 emojisine tıkla!\n\nSana özel bir kanal açılacak ve sorular sorulacak.",
      )
      .setFooter({ text: "Başvurun gizli tutulacaktır." })
      .setTimestamp();

    const appMsg = await ch.send({ embeds: [embed] });
    await appMsg.react("📝");

    current.channelId = ch.id;
    current.messageId = appMsg.id;
    current.emoji = "📝";
    if (!current.questions) current.questions = {};

    ytSettingsMap.set(message.guild.id, current);
    saveData(ytSettingsFile, ytSettingsMap);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Başvuru Kanalı Kuruldu")
          .setDescription(
            `${ch} kanalına başvuru mesajı gönderildi!\n\nSırada ne yapmalısın:\n1. \`a!ytsoruayarla 1 <ilk soru>\` ile soruları ekle\n2. \`a!ytdegerlendirme #kanal\` ile değerlendirme kanalını ayarla`,
          )
          .setTimestamp(),
      ],
    });
  }

  // 2. SORU AYARLAMA KOMUTU
  if (command === "ytsoruayarla") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const num = parseInt(args[0]),
      question = args.slice(1).join(" ");
    if (!num || num < 1 || num > 20)
      return message.reply("Soru numarası 1-20 arası olmalı!");
    if (!question)
      return message.reply(
        "Soruyu yaz! Örnek: `a!ytsoruayarla 1 Kendinizi tanıtır mısınız?`",
      );

    const current = ytSettingsMap.get(message.guild.id) || { questions: {} };
    if (!current.questions) current.questions = {};
    current.questions[String(num)] = question;

    ytSettingsMap.set(message.guild.id, current);
    saveData(ytSettingsFile, ytSettingsMap);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(`✅ Soru ${num} Ayarlandı`)
          .setDescription(`**Soru ${num}:** ${question}`)
          .setTimestamp(),
      ],
    });
  }

  // 3. SORU SİLME KOMUTU (YENİ)
  if (command === "ytsorusil") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const num = args[0];
    if (!num)
      return message.reply(
        "Silmek istediğin soru numarasını belirtmelisin! Örnek: `a!ytsorusil 1`",
      );

    const current = ytSettingsMap.get(message.guild.id);
    if (!current || !current.questions || !current.questions[String(num)]) {
      return message.reply("Bu numaraya ait ayarlanmış bir soru bulunamadı!");
    }

    // Soruyu sistemden siliyoruz
    delete current.questions[String(num)];

    ytSettingsMap.set(message.guild.id, current);
    saveData(ytSettingsFile, ytSettingsMap);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle(`✅ Soru ${num} Silindi`)
          .setDescription(`Soru ${num} başarıyla sistemden kaldırıldı.`)
          .setTimestamp(),
      ],
    });
  }

  // 4. DEĞERLENDİRME KANALI AYARLAMA KOMUTU
  if (command === "ytdegerlendirme") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return message.reply("🚫 Sadece yöneticiler!");
    const ch = message.mentions.channels.first();
    if (!ch)
      return message.reply(
        "Kanal etiketle! Örnek: `a!ytdegerlendirme #değerlendirme`",
      );

    const current = ytSettingsMap.get(message.guild.id) || { questions: {} };
    current.evalChannelId = ch.id;

    ytSettingsMap.set(message.guild.id, current);
    saveData(ytSettingsFile, ytSettingsMap);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Değerlendirme Kanalı Ayarlandı")
          .setDescription(
            `Başvuru sonuçları artık ${ch} kanalına gönderilecek!`,
          )
          .setTimestamp(),
      ],
    });
  }

  // 5. SORULARI LİSTELEME KOMUTU
  if (command === "ytsorular") {
    const current = ytSettingsMap.get(message.guild.id);
    if (
      !current ||
      !current.questions ||
      Object.keys(current.questions).length === 0
    )
      return message.reply(
        "Henüz soru eklenmemiş. `a!ytsoruayarla <no> <soru>` ile ekle.",
      );

    const sorted = Object.entries(current.questions).sort(
      (a, b) => parseInt(a[0]) - parseInt(b[0]),
    );
    const lines = sorted.map(([n, q]) => `**Soru ${n}:** ${q}`).join("\n\n");

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("📋 Başvuru Soruları")
          .setDescription(lines)
          .addFields(
            {
              name: "Değerlendirme Kanalı",
              value: current.evalChannelId
                ? `<#${current.evalChannelId}>`
                : "*Ayarlanmadı*",
              inline: true,
            },
            {
              name: "Başvuru Kanalı",
              value: current.channelId
                ? `<#${current.channelId}>`
                : "*Ayarlanmadı*",
              inline: true,
            },
          )
          .setTimestamp(),
      ],
    });
  }

  // ── WARN SİSTEMİ ────────────────────────────────────────────────────────────
  if (command === "warn") {
    if (
      !hasModPerm(
        message.member,
        "warn",
        PermissionsBitField.Flags.ModerateMembers,
      )
    )
      return message.reply("🚫 Warn yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (target.user.bot) return message.reply("Botlara warn atamazsın!");
    const reason = args
      .slice(message.mentions.users.size > 0 ? 1 : 1)
      .join(" ");
    if (!reason) return message.reply("Sebep belirt!");
    const warnKey = `${message.guild.id}_${target.id}`;
    if (!warningsMap.has(warnKey)) warningsMap.set(warnKey, []);
    const warns = warningsMap.get(warnKey);
    warns.push({
      id: warns.length + 1,
      reason,
      by: message.author.tag,
      timestamp: Date.now(),
    });
    saveData(warningsFile, warningsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Orange")
          .setTitle("⚠️ Warn Atıldı")
          .addFields(
            {
              name: "Kullanıcı",
              value: `${target.user.tag} (<@${target.id}>)`,
              inline: true,
            },
            { name: "Yetkili", value: message.author.tag, inline: true },
            { name: "Warn #", value: `${warns.length}`, inline: true },
            { name: "Sebep", value: reason },
          )
          .setFooter({ text: `Toplam ${warns.length} warn` })
          .setTimestamp(),
      ],
    });
  }

  if (command === "warnings" || command === "warnlist") {
    const target = (await resolveUser(message, args)) || message.member;
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];
    if (warns.length === 0)
      return message.reply(
        `${target.user.tag} adlı kullanıcının hiç warni yok.`,
      );
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Orange")
          .setTitle(`⚠️ ${target.user.tag} — Warnlar`)
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .setDescription(
            warns
              .map(
                (w) =>
                  `**#${w.id}** — ${w.reason}\n↳ *${w.by}* — ${new Date(w.timestamp).toLocaleDateString("tr-TR")}`,
              )
              .join("\n\n"),
          )
          .setFooter({ text: `Toplam ${warns.length} warn` })
          .setTimestamp(),
      ],
    });
  }

  if (command === "unwarn") {
    if (
      !hasModPerm(
        message.member,
        "warn",
        PermissionsBitField.Flags.ModerateMembers,
      )
    )
      return message.reply("🚫 Warn silme yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    const warnKey = `${message.guild.id}_${target.id}`;
    const warns = warningsMap.get(warnKey) || [];
    if (warns.length === 0) return message.reply("Bu kullanıcının warni yok.");
    const sub = args[message.mentions.users.size > 0 ? 1 : 1]?.toLowerCase();
    if (sub === "all" || sub === "hepsi") {
      warningsMap.set(warnKey, []);
      saveData(warningsFile, warningsMap);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ Tüm Warnlar Silindi")
            .setDescription(
              `${target.user.tag} — **${warns.length}** warn silindi.`,
            )
            .setTimestamp(),
        ],
      });
    }
    const warnNo = parseInt(sub);
    if (!warnNo || warnNo < 1 || warnNo > warns.length)
      return message.reply(
        `1-${warns.length} arası warn numarası gir veya \`all\` yaz.`,
      );
    const removed = warns.splice(warnNo - 1, 1)[0];
    warns.forEach((w, i) => {
      w.id = i + 1;
    });
    warningsMap.set(warnKey, warns);
    saveData(warningsFile, warningsMap);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Warn Silindi")
          .addFields(
            { name: "Kullanıcı", value: target.user.tag, inline: true },
            {
              name: "Silinen",
              value: `#${warnNo} — ${removed.reason}`,
              inline: false,
            },
            { name: "Kalan", value: `${warns.length}`, inline: true },
          )
          .setTimestamp(),
      ],
    });
  }

  // ── MODERASYON ──────────────────────────────────────────────────────────────
  if (command === "ban") {
    if (
      !hasModPerm(message.member, "ban", PermissionsBitField.Flags.BanMembers)
    )
      return message.reply("🚫 Ban yetkin yok!");

    // Argümandan gelen ID'yi veya Etiketi temizleyerek sadece ID'yi alalım
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId || isNaN(targetId))
      return message.reply(
        "Lütfen geçerli bir kullanıcı ID'si veya etiket belirtin!",
      );

    // Sebep kısmını temizleyelim (args.slice(1) ilk argümandan sonrasını alır)
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";

    // Kullanıcı sunucuda var mı diye kontrol edelim
    const targetMember =
      message.guild.members.cache.get(targetId) ||
      (await message.guild.members.fetch(targetId).catch(() => null));

    if (targetMember) {
      // 1. DURUM: Kullanıcı sunucudaysa
      if (!targetMember.bannable)
        return message.reply(
          "🚫 Bu kullanıcıyı banlayamam! (Yetkisi benden yüksek olabilir)",
        );
      await targetMember.ban({ reason });

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("DarkRed")
            .setTitle("⛔ Kullanıcı Banlandı")
            .addFields(
              {
                name: "Kullanıcı",
                value: `${targetMember.user.tag} (<@${targetMember.id}>)`,
                inline: true,
              },
              { name: "Yetkili", value: message.author.tag, inline: true },
              { name: "Sebep", value: reason },
            )
            .setTimestamp(),
        ],
      });
    } else {
      // 2. DURUM: Kullanıcı sunucuda değilse (ID Ban)
      try {
        // Embed'de ismi düzgün gözüksün diye Discord API'den kullanıcı adını çekmeye çalışalım
        const targetUser = await message.client.users
          .fetch(targetId)
          .catch(() => null);
        const userTag = targetUser ? targetUser.tag : "Bilinmeyen Kullanıcı";

        // Sunucuda olmayan kişiyi ID ile banlama (Discord.js v14)
        await message.guild.bans.create(targetId, { reason });

        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("DarkRed")
              .setTitle("⛔ Kullanıcı Sunucuda Yokken Banlandı (ID Ban)")
              .addFields(
                {
                  name: "Kullanıcı",
                  value: `${userTag} (<@${targetId}>)`,
                  inline: true,
                },
                { name: "Yetkili", value: message.author.tag, inline: true },
                { name: "Sebep", value: reason },
              )
              .setTimestamp(),
          ],
        });
      } catch (error) {
        // Eğer ID tamamen geçersizse veya Discord'da böyle bir kullanıcı yoksa hata verir
        return message.reply(
          "🚫 Kullanıcı bulunamadı veya girilen ID geçersiz!",
        );
      }
    }
  }

  if (command === "unban") {
    if (
      !hasModPerm(message.member, "unban", PermissionsBitField.Flags.BanMembers)
    )
      return message.reply("🚫 Ban kaldırma yetkin yok!");

    // Argümandan gelen ID'yi veya Etiketi temizleyerek sadece ID'yi alalım
    const targetId = args[0]?.replace(/[<@!>]/g, "");
    if (!targetId || isNaN(targetId))
      return message.reply(
        "Lütfen banını kaldırmak istediğiniz kişinin geçerli bir ID'sini girin!",
      );

    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";

    try {
      // Kullanıcının sunucuda banlı olup olmadığını kontrol edelim
      const banCheck = await message.guild.bans
        .fetch(targetId)
        .catch(() => null);

      if (!banCheck) {
        return message.reply("🚫 Bu kullanıcı sunucuda zaten banlı değil!");
      }

      // Ban listesinden gelen hazır kullanıcı verisini çekelim (Embed için)
      const userTag = banCheck.user.tag;

      // Kullanıcının banını kaldırıyoruz
      await message.guild.bans.remove(targetId, reason);

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("🔓 Kullanıcı Banı Kaldırıldı")
            .addFields(
              {
                name: "Kullanıcı",
                value: `${userTag} (<@${targetId}>)`,
                inline: true,
              },
              { name: "Yetkili", value: message.author.tag, inline: true },
              { name: "Sebep", value: reason },
            )
            .setTimestamp(),
        ],
      });
    } catch (error) {
      // Beklenmedik bir Discord API hatası oluşursa devreye girer
      return message.reply("🚫 Ban kaldırma işlemi sırasında bir hata oluştu!");
    }
  }

  if (command === "kick") {
    if (
      !hasModPerm(message.member, "kick", PermissionsBitField.Flags.KickMembers)
    )
      return message.reply("🚫 Kick yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.kickable)
      return message.reply("🚫 Bu kullanıcıyı kickleyemem!");
    const reason =
      args.slice(message.mentions.users.size > 0 ? 1 : 1).join(" ") ||
      "Sebep belirtilmedi";
    await target.kick(reason);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Orange")
          .setTitle("👢 Kullanıcı Kicklendi")
          .addFields(
            {
              name: "Kullanıcı",
              value: `${target.user.tag} (<@${target.id}>)`,
              inline: true,
            },
            { name: "Yetkili", value: message.author.tag, inline: true },
            { name: "Sebep", value: reason },
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "temizle" || command === "clear" || command === "purge") {
    if (
      !hasModPerm(
        message.member,
        "temizle",
        PermissionsBitField.Flags.ManageMessages,
      )
    )
      return message.reply("🚫 Mesaj yönetme yetkin yok!");
    const n = parseInt(args[0]);
    if (!n || n < 1 || n > 100) return message.reply("1-100 arası sayı gir.");
    try {
      await message.channel.bulkDelete(n + 1, true);
      const msg = await message.channel.send(`✅ **${n}** mesaj silindi.`);
      setTimeout(() => msg.deletable && msg.delete().catch(() => {}), 3000);
    } catch {
      return message.reply("❌ 14 günden eski mesajlar toplu silinemez.");
    }
  }

  if (command === "mute") {
    if (
      !hasModPerm(
        message.member,
        "mute",
        PermissionsBitField.Flags.ModerateMembers,
      )
    )
      return message.reply("🚫 Timeout yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.moderatable)
      return message.reply("🚫 Bu kullanıcıyı mute yapamam!");
    const ms = require("ms"),
      süreArg = message.mentions.users.size > 0 ? args[1] : args[1];
    if (!süreArg) return message.reply("Süre belirt! Örnek: `a!mute @üye 10m`");
    const süreMs = ms(süreArg);
    if (!süreMs || süreMs < 1000 || süreMs > 28 * 24 * 60 * 60 * 1000)
      return message.reply("Geçerli süre: 1s — 28d.");
    const reason =
      args.slice(message.mentions.users.size > 0 ? 2 : 2).join(" ") ||
      "Sebep belirtilmedi";
    await target.timeout(süreMs, reason);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("🔇 Mute Edildi")
          .addFields(
            {
              name: "Kullanıcı",
              value: `${target.user.tag} (<@${target.id}>)`,
              inline: true,
            },
            { name: "Yetkili", value: message.author.tag, inline: true },
            { name: "Süre", value: süreArg, inline: true },
            { name: "Sebep", value: reason },
          )
          .setTimestamp(),
      ],
    });
  }

  if (command === "unmute") {
    if (
      !hasModPerm(
        message.member,
        "mute",
        PermissionsBitField.Flags.ModerateMembers,
      )
    )
      return message.reply("🚫 Timeout kaldırma yetkin yok!");
    const target = await resolveUser(message, args);
    if (!target) return message.reply("Kullanıcı bulunamadı!");
    if (!target.moderatable)
      return message.reply("🚫 Bu kullanıcıyı düzenleyemem!");
    await target.timeout(null);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("🔊 Mute Kaldırıldı")
          .addFields(
            {
              name: "Kullanıcı",
              value: `${target.user.tag} (<@${target.id}>)`,
              inline: true,
            },
            { name: "Yetkili", value: message.author.tag, inline: true },
          )
          .setTimestamp(),
      ],
    });
  }


  if (command === "botkapat" || command === "kapat" || command === "shutdown") {
    const efeId = "1485551692924588123";

    // 🔒 GÜVENLİK KONTROLÜ: Sadece senin ID'ne izin veriyoruz
    if (message.author.id !== efeId) {
      return message.reply("❌ Bu komut sadece **Belirtilen Kişiler** tarafından kullanılabilir!");
    }

    // Kapatma mesajını gönderiyoruz
    await message.channel.send("🔌 **Bot kapatılıyor...** Bağlantılar kesildi. Görüşmek üzere kanka! 👋");

    // Discord API bağlantısını güvenli bir şekilde kopar
    client.destroy();

    // Node.js sürecini (process) sıfır hatayla sonlandır
    setTimeout(() => {
      process.exit(0);
    }, 1000); // Mesajın Discord'a ulaştığından emin olmak için 1 saniye bekletiyoruz
  }


  if (command === "kilit") {
    // 🛡️ Yetki Kontrolü: Sadece Kanalları Yönet yetkisi olanlar kullanabilsin
    if (!message.member.permissions.has("ManageChannels")) {
      return message.reply("❌ Bu komutu kullanabilmek için **Kanalları Yönet** yetkisine sahip olmalısın!");
    }

    const subCommand = args[0]?.toLowerCase();

    if (!subCommand || (subCommand !== "aç" && subCommand !== "ac" && subCommand !== "kapat")) {
      return message.reply("❓ Doğru kullanım: `a!kilit kapat` (kilitlemek için) veya `a!kilit aç` (açmak için)");
    }

    // Sunucudaki herkesi temsil eden @everyone rolü
    const everyoneRole = message.guild.roles.everyone;

    // ── 1. KANALI KİLİTLEME (kapat) ──
    if (subCommand === "kapat") {
      try {
        // @everyone rolünün bu kanala mesaj göndermesini engelliyoruz
        await message.channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false
        });

        // Eğer varsa mevcut loading/bilgilendirme mesajlarını temiz tutmak için direkt embed atıyoruz
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("🔒 Kanal Kilitlendi!")
              .setDescription("Bu kanal geçici olarak yazışmaya kapatılmıştır. Artık kimse buraya yazamaz.")
              .setFooter({ text: `${message.author.tag} tarafından kilitlendi.`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp()
          ]
        });
      } catch (err) {
        console.error("Kanal kilitlenirken hata oluştu:", err);
        return message.reply("❌ Kanal kilitlenirken sistemsel bir hata meydana geldi!");
      }
    }

    // ── 2. KANAL KİLİDİNİ AÇMA (aç) ──
    if (subCommand === "aç" || subCommand === "ac") {
      try {
        // @everyone rolünün mesaj gönderme engelini kaldırıyoruz (nötrlüyoruz)
        // 'null' yapmak izni tamamen sıfırlar ve sunucunun/kategorinin varsayılan ayarlarına geri döndürür.
        await message.channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null
        });

        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle("🔓 Kanal Kilidi Açıldı!")
              .setDescription("Bu kanal başarıyla tekrar yazışmaya açılmıştır. Herkes mesaj gönderebilir.")
              .setFooter({ text: `${message.author.tag} tarafından açıldı.`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp()
          ]
        });
      } catch (err) {
        console.error("Kanal kilidi açılırken hata oluştu:", err);
        return message.reply("❌ Kanal kilidi açılırken sistemsel bir hata meydana geldi!");
      }
    }
  }

  // yaz

  
  if (command === "yaz" || command === "say") {
    const allowedId = "994985345550659614";

    // 🔒 GÜVENLİK KONTROLÜ: Sadece senin ID'ne izin veriyoruz
    if (message.author.id !== allowedId) {
      return message.reply("❌ Alluka'yı sadece gerçek sahibi konuşturabilir kanka!");
    }

    // Yazılacak metni birleştiriyoruz (tüm argümanları tek satır yapıyoruz)
    const textToSay = args.join(" ");

    // Eğer yazılacak hiçbir şey girilmemişse boş mesaj hatası vermesini engelliyoruz
    if (!textToSay) {
      await message.delete().catch(() => {}); // Orijinal mesajı sil
      const tempMsg = await message.channel.send("❌ Alluka'nın ne yazacağını da belirtmelisin kanka!");
      // 3 saniye sonra bu hata uyarısını silerek kanalı temiz tutuyoruz
      return setTimeout(() => tempMsg.delete().catch(() => {}), 3000);
    }

    // 🧹 Öncelikle senin yazdığın "a!yaz ..." mesajını siliyoruz
    await message.delete().catch(() => {});

    // 📣 Alluka kendi mesajıymış gibi metni kanala gönderiyor
    return message.channel.send(textToSay);
  }


  //duyuru

  if (command === "duyuru") {
    // 🛡️ Yetki Kontrolü: Sadece Yönetici yetkisi olanlar bu tehlikeli komutu kullanabilsin
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Bu komutu kullanabilmek için **Yönetici** yetkisine sahip olmalısın!");
    }

    const targetArg = args[0];
    const announcementText = args.slice(1).join(" ");

    if (!targetArg || !announcementText) {
      return message.reply("❓ **Doğru Kullanım:** `a!duyuru [@Kullanıcı / everyone] [Mesajınız]`\n*Örnek: `a!duyuru @Emir Selam kanka` veya `a!duyuru everyone Sunucu aktif!`*");
    }

    // Komut kirliliği olmasın diye orijinal mesajı siliyoruz
    await message.delete().catch(() => {});

    // ── 1. HERKESE DM GÖNDERME SİSTEMİ (everyone) ──
    if (targetArg === "everyone" || targetArg === "@everyone" || message.mentions.everyone) {
      const statusMsg = await message.channel.send("⏳ Sunucudaki tüm üyelere DM duyurusu gönderiliyor... Güvenlik amacıyla aralara gecikme koyulduğu için bu işlem biraz sürebilir.");

      try {
        // Sunucudaki tüm üyeleri çekiyoruz
        const allMembers = await message.guild.members.fetch();
        const targetMembers = allMembers.filter(m => !m.user.bot); // Botları hariç tutuyoruz

        let successCount = 0;
        let failCount = 0;

        // Her üyeye sırayla DM gönderen güvenli döngü
        for (const [id, member] of targetMembers) {
          try {
            await member.send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Gold")
                  .setTitle(`📢 ${message.guild.name} Sunucusundan Genel Duyuru!`)
                  .setDescription(announcementText)
                  .setTimestamp()
              ]
            });
            successCount++;
          } catch (err) {
            // DM'si kapalı olanlar veya bota engel atanlar buraya düşer
            failCount++;
          }

          // 🔥 Discord spam filtresine takılmamak için her mesaj arası 1 saniye (1000ms) bekletiyoruz
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return statusMsg.edit(`✅ **Toplu Duyuru Tamamlandı!**\n📬 Başarıyla Gönderilen: \`${successCount}\` | ❌ Gönderilemeyen (DM Kapalı vb.): \`${failCount}\``);

      } catch (err) {
        console.error("Toplu duyuru hatası:", err);
        return message.channel.send("❌ Duyuru işlemi başlatılırken sistemsel bir hata oluştu.");
      }
    }

    // ── 2. TEK BİR KİŞİYE DM GÖNDERME SİSTEMİ ──
    const targetUser = message.mentions.members.first() || message.guild.members.cache.get(targetArg);

    if (!targetUser) {
      return message.channel.send("❌ Geçerli bir kullanıcı etiketlemelisin ya da tüm sunucu için `everyone` yazmalısın!");
    }

    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`📢 ${message.guild.name} Sunucusundan Sana Özel Bir Duyuru Var!`)
            .setDescription(announcementText)
            .setFooter({ text: `Duyuruyu Gönderen Yönetici: ${message.author.tag}` })
            .setTimestamp()
        ]
      });
      return message.channel.send(`✅ **${targetUser.user.tag}** kullanıcısına özel DM duyurusu başarıyla iletildi!`);
    } catch (err) {
      return message.channel.send(`❌ **${targetUser.user.tag}** kullanıcısına DM gönderilemedi! (Muhtemelen DM kutusu arkadaşı olmayanlara kapalı.)`);
    }
  }

  //üye temizle

  if (command === "ütemizle" || command === "uyetemizle" || command === "üsil") {
    // 🛡️ Yetki Kontrolü: Sadece Mesajları Yönet yetkisi olanlar kullanabilsin
    if (!message.member.permissions.has("ManageMessages")) {
      return message.reply("❌ Bu komutu kullanabilmek için **Mesajları Yönet** yetkisine sahip olmalısın!");
    }

    // Hedef kullanıcıyı etiketlemeden veya ID ile buluyoruz
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      return message.reply("❓ **Doğru Kullanım:** `a!ütemizle [@Kullanıcı/ID] [Miktar]`\n*Örnek: `a!ütemizle @Emir 15`*");
    }

    // Discord API'si tek seferde en fazla 100 mesaj silmeye izin verir
    if (amount > 100) {
      return message.reply("⚠️ Tek seferde en fazla **100** mesaj silebilirsin kanka!");
    }

    // Komut mesajını hemen siliyoruz ki kirlilik yaratmasın
    await message.delete().catch(() => {});

    const loading = await message.channel.send(`🧹 **${target.user.tag}** kullanıcısının son mesajları taranıyor...`);

    try {
      // Kanaldaki son 100 mesajı çekiyoruz (Discord en yeniden eskiye doğru getirir)
      const messages = await message.channel.messages.fetch({ limit: 100 });

      // Sadece hedef kullanıcının attığı mesajları filtrele ve istenen miktar kadarını seç (en yeni olanlar seçilir)
      const userMessages = messages.filter(m => m.author.id === target.id).first(amount);

      if (userMessages.length === 0) {
        await loading.delete().catch(() => {});
        const failMsg = await message.channel.send(`⚠️ Son 100 mesaj içerisinde **${target.user.username}** kullanıcısına ait mesaj bulunamadı.`);
        return setTimeout(() => failMsg.delete().catch(() => {}), 4000);
      }

      // Discord'un 14 gün sınırını kontrol ediyoruz (Bulk delete 14 günden eski mesajları silemez)
      const now = Date.now();
      const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
      const deletableMessages = userMessages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (deletableMessages.length === 0) {
        await loading.delete().catch(() => {});
        const oldMsg = await message.channel.send(`❌ Bulunan mesajlar 14 günden daha eski olduğu için Discord kuralları gereği silinemedi.`);
        return setTimeout(() => oldMsg.delete().catch(() => {}), 4000);
      }

      // Seçilen mesajları tek hamlede uçuruyoruz
      await message.channel.bulkDelete(deletableMessages, true);
      await loading.delete().catch(() => {});

      // Başarılı bildirimini gönderip 3 saniye sonra kendi kendini yok etmesini sağlıyoruz
      const successMsg = await message.channel.send(`✅ **${target.user.username}** kullanıcısının son **${deletableMessages.length}** mesajı başarıyla temizlendi!`);
      setTimeout(() => successMsg.delete().catch(() => {}), 3000);

    } catch (err) {
      console.error("Üye temizleme hatası:", err);
      await loading.delete().catch(() => {});
      return message.channel.send("❌ Mesajlar silinirken sistemsel bir hata oluştu.");
    }
  }

  //şarkı

  


  // ── KANAL GİR (gizli, admin) ───────────────────────────────────────────────
  if (command === "kanalagir") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    )
      return;
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("Önce ses kanalına gir!");
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      connection.on(VoiceConnectionStatus.Ready, () => {
        message.reply(`✅ **${voiceChannel.name}** kanalına bağlandım.`);
      });
      connection.on("error", () => {
        message.reply("❌ Ses kanalına bağlanamadım.");
      });
    } catch {
      return message.reply("❌ Bağlanılamadı.");
    }
    return;
  }

  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Alluka tıkır tıkır çalışıyor kanka! 🚀');
  });

  app.listen(5000, () => {
    console.log('Web sunucusu 5000 portunda hazır.');
  });

});



client.login(process.env.TOKEN);

 