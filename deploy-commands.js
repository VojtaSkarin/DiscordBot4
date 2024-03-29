const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder()
		.setName('subject')
		.setDescription('Slouží pro správu předmětových místností')
		.addStringOption(option =>
			option.setName('action')
				  .setDescription('Typ akce')
				  .setRequired(true)
				  .addChoice('join', 'join')
				  .addChoice('leave', 'leave')
				  .addChoice('create', 'create')
				  .addChoice('delete', 'delete'))
		.addStringOption(option =>
			option.setName('channel')
				  .setDescription('Kýžený kanál')
				  .setRequired(true)),
		
/*	new SlashCommandBuilder()
		.setName('whatsnew')
		.setDescription('Vypisuje seznam změn')
		.addStringOption(option =>
			option.setName('input')
			.setDescription('\'last\' pro nejnovější a \'all\' pro všechny')),*/
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
	