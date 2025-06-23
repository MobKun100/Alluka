const { EmbedBuilder, Events, AuditLogEvent } = require("discord.js");

module.exports = (client) => {
  const logChannelId = client.logChannelId;

  // Yardımcı fonksiyon log kanalını almak için
  function getLogChannel(guild) {
    return guild.channels.cache.get(logChannelId);
  }

  // Üye giriş
  client.on(Events.GuildMemberAdd, member => {
    const logChannel = getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("✅ Üye Katıldı")
      .setColor("Green")
      .setDescription(`${member.user.tag} sunucuya katıldı.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Üye çıkış
  client.on(Events.GuildMemberRemove, async member => {
    const logChannel = getLogChannel(member.guild);
    if (!logChannel) return;

    // Kick mi, yoksa normal çıkış mı kontrol et
    try {
      const auditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick,
      });
      const kickLog = auditLogs.entries.first();

      if (kickLog && kickLog.target.id === member.id && (Date.now() - kickLog.createdTimestamp) < 5000) {
        const { executor, reason } = kickLog;

        const embed = new EmbedBuilder()
          .setTitle("⚠️ Üye Atıldı (Kick)")
          .setColor("Orange")
          .setDescription(`${member.user.tag} sunucudan atıldı.`)
          .addFields(
            { name: "Atan Kişi", value: executor.tag, inline: true },
            { name: "Sebep", value: reason || "Belirtilmemiş", inline: true }
          )
          .setTimestamp();

        return logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Kick log alınamadı:", error);
    }

    // Normal ayrılma
    const embed = new EmbedBuilder()
      .setTitle("❌ Üye Ayrıldı")
      .setColor("Red")
      .setDescription(`${member.user.tag} sunucudan ayrıldı.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Ban logu
  client.on(Events.GuildBanAdd, ban => {
    const logChannel = getLogChannel(ban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("⛔ Üye Banlandı")
      .setColor("DarkRed")
      .setDescription(`${ban.user.tag} sunucudan banlandı.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Unban logu
  client.on(Events.GuildBanRemove, unban => {
    const logChannel = getLogChannel(unban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("✅ Ban Kaldırıldı")
      .setColor("Green")
      .setDescription(`${unban.user.tag} üzerindeki ban kaldırıldı.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Mute / Unmute (rol değişikliği) — Muted rolü takip et
  client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    const logChannel = getLogChannel(newMember.guild);
    if (!logChannel) return;

    const muteRole = newMember.guild.roles.cache.find(r => r.name === "Muted");
    if (!muteRole) return;

    if (!oldMember.roles.cache.has(muteRole.id) && newMember.roles.cache.has(muteRole.id)) {
      const embed = new EmbedBuilder()
        .setTitle("🔇 Üye Mutelandı")
        .setColor("Yellow")
        .setDescription(`${newMember.user.tag} mute rolü verildi.`)
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    } else if (oldMember.roles.cache.has(muteRole.id) && !newMember.roles.cache.has(muteRole.id)) {
      const embed = new EmbedBuilder()
        .setTitle("🔊 Üye Unmute Edildi")
        .setColor("Green")
        .setDescription(`${newMember.user.tag} mute rolü kaldırıldı.`)
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  });

  // Mesaj silme
  client.on(Events.MessageDelete, message => {
    if (!message.guild) return;
    const logChannel = getLogChannel(message.guild);
    if (!logChannel) return;

    if (message.author.bot) return; // bot mesajlarını görmezden gel

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Mesaj Silindi")
      .setColor("DarkRed")
      .addFields(
        { name: "Kullanıcı", value: message.author.tag, inline: true },
        { name: "Kanal", value: message.channel.toString(), inline: true },
        { name: "Mesaj", value: message.content || "Mesaj içeriği yok" }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Mesaj güncelleme (edit)
  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (!oldMessage.guild) return;
    const logChannel = getLogChannel(oldMessage.guild);
    if (!logChannel) return;

    if (oldMessage.author.bot) return; // bot mesajları

    if (oldMessage.content === newMessage.content) return; // embed, sticker vs. değişmiş olabilir

    const embed = new EmbedBuilder()
      .setTitle("✏️ Mesaj Düzenlendi")
      .setColor("Gold")
      .addFields(
        { name: "Kullanıcı", value: oldMessage.author.tag, inline: true },
        { name: "Kanal", value: oldMessage.channel.toString(), inline: true },
        { name: "Eski Mesaj", value: oldMessage.content || "Yok" },
        { name: "Yeni Mesaj", value: newMessage.content || "Yok" }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Kanal oluşturma
  client.on(Events.ChannelCreate, channel => {
    const logChannel = getLogChannel(channel.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("📁 Kanal Oluşturuldu")
      .setColor("Green")
      .setDescription(`${channel.name} kanalı oluşturuldu.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Kanal silme
  client.on(Events.ChannelDelete, channel => {
    const logChannel = getLogChannel(channel.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Kanal Silindi")
      .setColor("Red")
      .setDescription(`${channel.name} kanalı silindi.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Kanal güncelleme (isim, izinler vs.)
  client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
    const logChannel = getLogChannel(oldChannel.guild);
    if (!logChannel) return;

    const changes = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push(`**İsim:** ${oldChannel.name} → ${newChannel.name}`);
    }

    if (changes.length === 0) return; // önemli değişiklik yoksa loglama

    const embed = new EmbedBuilder()
      .setTitle("📝 Kanal Güncellendi")
      .setColor("Yellow")
      .setDescription(changes.join("\n"))
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Rol oluşturma
  client.on(Events.RoleCreate, role => {
    const logChannel = getLogChannel(role.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🆕 Rol Oluşturuldu")
      .setColor("Green")
      .setDescription(`${role.name} rolü oluşturuldu.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Rol silme
  client.on(Events.RoleDelete, role => {
    const logChannel = getLogChannel(role.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Rol Silindi")
      .setColor("Red")
      .setDescription(`${role.name} rolü silindi.`)
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Rol güncelleme (isim, renk, izinler)
  client.on(Events.RoleUpdate, (oldRole, newRole) => {
    const logChannel = getLogChannel(oldRole.guild);
    if (!logChannel) return;

    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`**İsim:** ${oldRole.name} → ${newRole.name}`);
    if (oldRole.color !== newRole.color) changes.push(`**Renk:** ${oldRole.color} → ${newRole.color}`);

    if (changes.length === 0) return;

    const embed = new EmbedBuilder()
      .setTitle("📝 Rol Güncellendi")
      .setColor("Yellow")
      .setDescription(changes.join("\n"))
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Sunucu güncelleme (isim, ikon, vs)
  client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
    const logChannel = getLogChannel(newGuild);
    if (!logChannel) return;

    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`**İsim:** ${oldGuild.name} → ${newGuild.name}`);
    if (oldGuild.iconURL() !== newGuild.iconURL()) changes.push(`**Icon Değişti**`);

    if (changes.length === 0) return;

    const embed = new EmbedBuilder()
      .setTitle("🛠️ Sunucu Güncellendi")
      .setColor("Blue")
      .setDescription(changes.join("\n"))
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Daha fazla event eklenecekse buraya yazılabilir
};
