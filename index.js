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

/* Export */

// Sunucu oluşturma ve proje aktivitesi sağlama.
const express = require("express");
const app = express();
const port = 5000;

// Web sunucu
app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Sunucu ${port} numaralı bağlantı noktasında yürütülüyor.`);
});

client.on("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Yardım embed fonksiyonu (daha kolay olsun diye)
  const sendHelpEmbed = () => {
    const yardımEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Bot Komutları")
      .setDescription("İşte kullanabileceğin komutlar:")
      .addFields(
        {
          name: "!ban @kullanıcı",
          value: "Birini sunucudan banlar.",
          inline: true,
        },
        {
          name: "!kick @kullanıcı",
          value: "Birini sunucudan atar.",
          inline: true,
        },
        {
          name: "!temizle <sayı>",
          value: "Belirtilen sayı kadar mesaj siler (max 100).",
          inline: true,
        },
        { name: "!ping", value: "Botun gecikmesini gösterir.", inline: true },
        {
          name: "!avatar @kullanıcı",
          value: "Kullanıcının avatarını gösterir.",
          inline: true,
        },
        {
          name: "!sunucubilgi",
          value: "Sunucu hakkında bilgi verir.",
          inline: true,
        },
        {
          name: "!roll <sayı>",
          value: "1 ile belirttiğin sayı arasında rastgele sayı atar.",
          inline: true,
        },
        {
          name: "!yaz <metin>",
          value: "Bot istediğin metni yazar.",
          inline: true,
        },
        {
          name: "!profil",
          value: "Kendi profil bilgilerini gösterir.",
          inline: true,
        },
      )
      .setFooter({ text: "Bot tarafından sağlanmıştır" })
      .setTimestamp();

    message.channel.send({ embeds: [yardımEmbed] });
  };

  // Komutlar
  if (command === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("🚫 Ban yetkin yok knk 😅"),
        ],
      });
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Kimi banlayacağımı etiketlemedin knk."),
        ],
      });
    }

    try {
      await member.ban();
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(`✅ ${member.user.tag} sunucudan banlandı.`),
        ],
      });
    } catch {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ Banlayamadım knk. Yetkim yetmedi galiba."),
        ],
      });
    }
  } else if (command === "kick") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("🚫 Kick yetkin yok dostum."),
        ],
      });
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Kimi kickleyeceğimi etiketlemedin."),
        ],
      });
    }

    try {
      await member.kick();
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(`✅ ${member.user.tag} sunucudan atıldı.`),
        ],
      });
    } catch {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ Kick atamadım knk. Bi hata oldu."),
        ],
      });
    }
  } else if (command === "temizle") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("🚫 Mesajları temizlemek için yetkin yok."),
        ],
      });
    }

    const miktar = parseInt(args[0]);
    if (!miktar || miktar < 1 || miktar > 100) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ 1 ile 100 arasında bir sayı yazmalısın."),
        ],
      });
    }

    try {
      await message.channel.bulkDelete(miktar + 1, true);
      const msg = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(`✅ ${miktar} mesaj silindi.`),
        ],
      });
      setTimeout(() => msg.delete(), 3000);
    } catch {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ Mesajları silemedim knk."),
        ],
      });
    }
  } else if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#0099ff")
          .setDescription(`🏓 Pong! Gecikme: ${ping} ms`),
      ],
    });
  } else if (command === "yardım") {
    sendHelpEmbed();
  } else if (command === "avatar") {
    const member = message.mentions.members.first() || message.member;
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(`${member.user.tag} kullanıcısının avatarı`)
          .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
          .setTimestamp(),
      ],
    });
  } else if (command === "sunucubilgi") {
    const { guild } = message;
    const sunucuEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Sunucu Bilgileri")
      .addFields(
        { name: "Sunucu Adı", value: guild.name, inline: true },
        { name: "Sunucu ID", value: guild.id, inline: true },
        { name: "Sunucu Sahibi", value: `<@${guild.ownerId}>`, inline: true },
        {
          name: "Üye Sayısı",
          value: guild.memberCount.toString(),
          inline: true,
        },
        {
          name: "Oluşturulma Tarihi",
          value: guild.createdAt.toDateString(),
          inline: true,
        },
      )
      .setTimestamp();

    message.channel.send({ embeds: [sunucuEmbed] });
  } else if (command === "roll") {
    const max = parseInt(args[0]) || 100;
    if (max < 1) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ En az 1 olmalı knk."),
        ],
      });
    }
    const sayı = Math.floor(Math.random() * max) + 1;
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#0099ff")
          .setDescription(
            `${message.author}, 1 ile ${max} arasında ${sayı} sayısını attın! 🎲`,
          ),
      ],
    });
  } else if (command === "yaz") {
    const yazı = args.join(" ");
    if (!yazı) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Ne yazmamı istiyorsun knk?"),
        ],
      });
    }
    message.channel.send({
      embeds: [new EmbedBuilder().setColor("#0099ff").setDescription(yazı)],
    });
  } else if (command === "profil") {
    const member = message.member;
    const profilEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Kullanıcı Profili")
      .addFields(
        { name: "İsim", value: member.user.tag, inline: true },
        { name: "ID", value: member.id, inline: true },
        {
          name: "Hesap Oluşturulma",
          value: member.user.createdAt.toDateString(),
          inline: true,
        },
        {
          name: "Sunucuya Katılma",
          value: member.joinedAt.toDateString(),
          inline: true,
        },
      )
      .setTimestamp();

    message.channel.send({ embeds: [profilEmbed] });
  }
  // Süreli mute komutu: !mute @kullanıcı 10m
  if (command === "mute") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("🚫 Mute yetkin yok knk!"),
        ],
      });
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Kimi mute edeceğimi etiketlemedin."),
        ],
      });
    }

    const muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");
    if (!muteRole) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`🚫 Sunucuda "Muted" rolü bulunamadı!`),
        ],
      });
    }

    if (member.roles.cache.has(muteRole.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("Bu kullanıcı zaten mute’lu!"),
        ],
      });
    }

    // Süre argümanı (örn: 10m, 1h, 30s)
    const süreArg = args[1];
    if (!süreArg) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription(
              "❗ Süre belirtmedin. Örnek: `!mute @kullanıcı 10m`",
            ),
        ],
      });
    }

    // Süreyi ms cinsine çevirelim
    const ms = require("ms");
    const süreMs = ms(süreArg);
    if (!süreMs) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Süre formatı geçersiz. Örnek: 10m, 1h, 30s"),
        ],
      });
    }

    try {
      await member.roles.add(muteRole);
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(
              `${member.user.tag} ${süreArg} boyunca mute’landı.`,
            ),
        ],
      });

      // Süre sonunda mute rolünü kaldır
      setTimeout(async () => {
        if (member.roles.cache.has(muteRole.id)) {
          await member.roles.remove(muteRole);
          message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setDescription(
                  `${member.user.tag} artık unmute edildi (süre doldu).`,
                ),
            ],
          });
        }
      }, süreMs);
    } catch {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("Mute atamadım knk. Yetkim yetmiyor olabilir."),
        ],
      });
    }
  }

  // !unmute @kullanıcı komutu aynen kalsın:
  else if (command === "unmute") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("🚫 Unmute yetkin yok knk!"),
        ],
      });
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("❗ Kimi unmute edeceğimi etiketlemedin."),
        ],
      });
    }

    const muteRole = message.guild.roles.cache.find((r) => r.name === "Muted");
    if (!muteRole) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`🚫 Sunucuda "Muted" rolü bulunamadı!`),
        ],
      });
    }

    if (!member.roles.cache.has(muteRole.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Yellow")
            .setDescription("Bu kullanıcı mute’lu değil!"),
        ],
      });
    }

    try {
      await member.roles.remove(muteRole);
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setDescription(`${member.user.tag} unmute edildi.`),
        ],
      });
    } catch {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("Unmute yapamadım knk. Yetkim yetmiyor olabilir."),
        ],
      });
    }
    }

  // Otomatik cevaplar
  const autoResponses = {
    "sa": "as hg avcı",
    "selam": "selam canım nasılsın?",
    "merhaba": "merhaba! hoş geldin",
    "günaydın": "günaydın, güzel günler!",
    "iyi geceler": "iyi geceler, tatlı rüyalar ✨",
    "naber": "iyilik senden naber?",
    "nasılsın": "iyiyim sen nasılsın?",
    "bb": "görüşürüz bay bay 👋",
    "bye": "görüşürüz! 👋",
    "teşekkürler": "rica ederim! 😊",
    "sağol": "ne demek canım!",
    "bot": "evet ben botum, nasıl yardımcı olabilirim?",
    "help": "Komutları görmek için !yardım yazabilirsin",
    "discord": "Discord'da sohbet etmeyi seviyorum! 💬"
  };

  // Mesaj içeriği kontrolü (komut değilse)
  if (!message.content.startsWith(prefix)) {
    const messageContent = message.content.toLowerCase();
    
    // Otomatik cevaplarda kontrol et
    for (const [trigger, response] of Object.entries(autoResponses)) {
      if (messageContent.includes(trigger)) {
        message.reply(response);
        break; // İlk bulunan cevabı ver
      }
    }
  }
});

client.login(process.env.TOKEN);
