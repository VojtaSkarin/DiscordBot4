module.exports = {
	subject: async function(interaction) {
		action = interaction.options.getString('action');
		channelName = interaction.options.getString('channel');
		channel = interaction.guild.channels.cache.find(channel =>
			channel.name == channelName);

		if (channel == undefined) {
			await interaction.reply({ content: 'Kanál `' + channelName + '` neexistuje', ephemeral: true });
			return;
		}

		if (['join', 'leave'].includes(action)) {
			status = action == 'join';
			
			channel.permissionOverwrites.create(interaction.member,
			{
				VIEW_CHANNEL: status,
			});
			
			await interaction.reply({ content: 'Kanál `' + channelName + '` byl zpřístupněn', ephemeral: true });
			return;
			
		} else if (action == 'create') {
			
		} else if (action == 'delete') {
			
		}
		
		await interaction.reply({ content: 'Something went wrong...', ephemeral: true });
	}
};