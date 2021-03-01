// npm install discord.js ffmpeg fluent-ffmpeg @discordjs/opus ytdl-core --save

// require the discord.js module
const Discord = require('discord.js');
// require ytdl module
const ytdl = require('ytdl-core');
// require http module
const https = require('https');

// require the filesystem.js module
const fs = require('fs');
// read from file
// fs.readFile('/etc/passwd', 'utf8', (err, data) => { data });
// write to file
// fs.writeFile('mynewfile3.txt', 'Hello content!', nothing => {});
// append to file
// fs.appendFile(gameListPath, '\n' + params[2], function(err) {});

// create the Discord client
const client = new Discord.Client();

const bot_path = process.env.BOT_PATH;

const monitored_path = bot_path + '/monitored';
config = require(bot_path + '/config.json');

interval = setInterval(async () =>
	await client.login(config.token).then(nothing => {
			console.log("Sucesfully connected to server!");
			clearInterval(interval);
		}, err => console.log('Failed to connect to server!'))
		, 10000);

const tmp = bot_path + '/_temp.mp3';
const img_url = 'https://www.fi.muni.cz/~xskarou1/images/';

const emoji_dir = bot_path + '/emoji_data';
const image_dir = bot_path + '/images';

// When the app is ready it will write out Ready using this
client.once('ready', () => {
    console.log('Ready!');
	
	client.user.setActivity('Use !help for info', {
		type: "PLAYING",
		//url: "https://www.youtube.com/watch?v=YnopHCL1Jk8"
	});
	
	// Cashování zpráv, na kterých probíhá výběr předmětů, her...
	cacheMonitored();
	
	// Cache PB007 room
	client.guilds.cache.each(guild => {
		guild.channels.cache.each(ch => {
			if (ch.type != 'category' && ch.parent != null && ch.parent.name == 'ŠKOLA') {
				ch.messages.fetch({ limit: 50 });
			}
		});
	});

	loadDictionary();
});

client.on('message', message => {
	//pepegaCather(message);
	
	console.log('In', message.channel.name, 'user', message.author.username, 'at', message.createdAt, 'wrote\n', message.content);
	
    params = message.content.substr(1).split(' ')
		.map(string => string.replace('_', ' '));

	if (message.channel.name == 'drill') {
		drill(message, params);
		return;
	}
	
    if (message.content.startsWith('!')) {
		console.log(message.content);
	
		if (['access'].includes(params[0].toLowerCase())) {
			console.log('Příkaz access');
			access(message, params);
		} else if (['b', 'breakoutrooms'].includes(params[0].toLowerCase())) {
			console.log('Příkaz !breakoutrooms');
			breakOutRooms(message, params);
		} else if (['c', 'clear'].includes(params[0].toLowerCase())) {
			console.log(1);
			clear(message, params);
		} else if (['e', 'emoji'].includes(params[0].toLowerCase())) {
			console.log(2);
			emoji_function(message, params);
		} else if (['g', 'game'].includes(params[0].toLowerCase())) {
			console.log(3);
			game(message);
		} else if (['h', 'help'].includes(params[0].toLowerCase())) {
			console.log(4);
			help(message, params);
		} else if (['imback'].includes(params[0])) {
			console.log('Calling !imback command')
			imback(message, params);
		} else if (['i', 'iplay'].includes(params[0].toLowerCase())) {
			console.log(5);
			iplay(message, params);
		} else if (['k', 'kill'].includes(params[0].toLowerCase())) {
			console.log(6);
			kill(message);
		} else if (['leave'].includes(params[0].toLowerCase())) {
			console.log(7);
			// leave(message);
		} else if (['m', 'module'].includes(params[0].toLowerCase())) {
			console.log('Calling !module command');
			module(message, params);
		} else if (['n', 'nickname'].includes(params[0].toLowerCase())) {
			console.log(9);
			nickname(message);
		} else if (['play'].includes(params[0].toLowerCase())) {
			console.log(10);
			newstyle(message, ['play', 'play'].concat(params.slice(1)));
		} else if (['p', 'plesk'].includes(params[0].toLowerCase())) {
			console.log(11);
			plesk(message);
		} else if (['rangers'].includes(params[0].toLowerCase())) {
			console.log(12);
			rangers(message, params);
		} else if (['r', 'role'].includes(params[0].toLowerCase())) {
			console.log(13);
			role_(message, params);
		} else if (['spam'].includes(params[0].toLowerCase())) {
			console.log(14);
			spam(message, params);
		} else if (['s', 'stop'].includes(params[0].toLowerCase())) {
			console.log(15);
			newstyle(message, ['play', 'stop']);
		} else if (['v', 'volume'].includes(params[0].toLowerCase())) {
			console.log(17);
			newstyle(message, ['play', 'volume'].concat(params.slice(1)));
		} else if (['whatsnew'].includes(params[0].toLowerCase())) {
			console.log(18);
			whatsnew(message, params);
		} else if (['z', 'zadani'].includes(params[0].toLowerCase())) {
			console.log(19);
			task(message);
		} else if (['l', 'log'].includes(params[0].toLowerCase())) {
			console.log(20);
			log(message);
		} else {console.log(21);
			invalid_command(message, params);
		}
	}
});

client.on('messageUpdate', (oldMessage, newMessage) => {
	console.log('In', oldMessage.channel.name, 'user', oldMessage.author.username, 'at', newMessage.editedAt, 'changed from\n', oldMessage.content, '\nto\n', newMessage.content);
});

client.on('voiceStateUpdate', (oldState, newState) => {
	role = newState.guild.roles.cache.find(role =>
		role.name == 'Člen hlasového kanálu');
	/* bude se mazat
	if (oldState.channel == null) {
		// Připojil se k hlasovému kanálu
		oldState.member.roles.add(role);
	} else if (newState.channel == null) {
		// Odpojil se z hlasového kanálu
		oldState.member.roles.remove(role);
	}
	*/
});

client.on('messageReactionAdd', (reaction, user) => {
	if (user.username == 'SomárBot') {
		return;
	}
	
	console.log('Reakce přidána');
	
	// Volba předmětů, her...
	if (monitoredChannelsIDs.includes(reaction.message.channel.id)) {
		access_reaction(reaction, user, true);
		breakOutRoomsReaction(reaction, user, true);
		return;
	}
	
	// Pin
	name = reaction.emoji.name;
	if (name == '📌') { // :pushpin:
		if (isStudent(reaction, user)) {
			reaction.message.pin();
		}
		return;
	}
	
	// Někdo se přidal ke !game
	if (reaction.message.content.includes('Ve své ponížené maličkosti si vás dovoluji uctivě požádat, abyste milostivě račili přijít')) {
		message = new Map([
			['Yes', ' to jde rozjet!'],
			['⛔', ' na to dlabe'],
			['🕑', ' má teď napilno']
		]);
		msg = reaction.message;
		reactName = reaction.emoji.name;
		author = msg.mentions.users.first();
		msg.channel.send(author.toString() + ' ' +
			reaction.users.cache.last().toString() + message.get(reactName));
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	if (user.username == 'SomárBot') {
		return;
	}
	
	console.log('Reakce odebrána');
	
	// Volba předmětů, her...
	if (monitoredChannelsIDs.includes(reaction.message.channel.id)) {
		access_reaction(reaction, user, false);
		breakOutRoomsReaction(reaction, user, false);
		return;
	}
	
	name = reaction.emoji.name;
	if (name == '📌') { // :pushpin:
		if (isStudent(reaction, user)) {
			reaction.message.unpin();
		}
	}
});

function cie(a, b) {
	return a.toLowerCase() == b.toLowerCase();
}

function zip(a, b) {
	if (a.length > b.length) {
		throw 'Zip: First array is longer, then second one!';
	}
	return a.map((value, index) => {
		//console.log(value, index);
		return [value, b[index]];
	});
}

monitoredChannelsIDs = []

// Cashování zpráv, na kterých probíhá výběr předmětů, her...
function cacheMonitored() {
	console.log('Caching monitored channels');
	fs.readFile(monitored_path, 'utf8', (_, data) => {
		monitoredChannelsIDs = data.split('\n')
			.filter(string => string.length > 0);
		client.guilds.cache.each(guild => {
			guild.channels.cache.each(ch => {
				if (monitoredChannelsIDs.includes(ch.id)) {
					ch.messages.fetch({ limit: 20 });
				}
			});
		});
		console.log('Monitored channels: ', monitoredChannelsIDs);
	})
}

function isStudent(reaction, user) {
		return reaction.message.guild.members.cache
			.find(member => member.id == user.id)
			.roles.cache.has('710420028821864488');
};

function status(msg) {
	msg.delete().then(nothing =>
		msg.channel.send('Linux je bullshit'));
}

function task(msg) {
	msg.delete().then(nothing =>
		msg.channel.send('Kdo by v roce 2020 četl zadání?'));
}

function version(msg) {
	msg.delete().then(nothing =>
		msg.channel.send('Stav 2.0.0'));
}

names = { '566713842264965181': 'Štěpánovi',
		  '488744442346602496': 'Vojtovi',
		  '481562596496113674': 'Filipovi',
		  '343814652012265472': 'Tomčimu',
		  '251058442456793088': 'Jančimu',
		  '204213865687285760': 'Domčimu' };

function plesk(msg) {
	msg.delete().then(nothing => {
		users = msg.mentions.users.array()
		if (users.length == 0) {
			users.push(client.users.cache
				.find(u => u.username == 'Tomáš'));
		}
		users.forEach(user => msg.channel.send('<@' + user.id + '> Plesk ' +
			names[user.id] + ' <:MrsCringeHarold:' +
			msg.guild.emojis.cache.find(e => e.name == 'MrsCringeHarold') + '>'))
	});
}

hint = new Map();
hint.set('access', '!access [option] [params]*' +
				   '\n\tSpráva výběru místností. Místnosti se nepřidávají tímto příkazem, ale reakcí v odpovídajícím kanále.' +
				   '\n\t\toption - list_categories|add_room|new_category|delete_category|send_table' +
				   '\n\t\t\tlist_categories - vypíše seznam monitorovaných kategorií' +
				   '\n\t\t\tadd_room [kategorie] [kanál] - vytvoří místnost [kanál] v kategorii [kategorie]' +
				   '\n\t\t\tnew_category [kanál] - přidá místnost [kanál] mezi monitorované kanály' +
				   '\n\t\t\tdelete_category - není implementováno' +
				   '\n\t\t\tsend_table [kanál] - smaže místnost [kanál] a vloží do něj tabulku pro výběr předmětů');
hint.set('clear', '!c[lear] n|all' +
			'\n\tMaže zprávy' +
			'\n\t\tn - počet zpráv ke smazání,' +
			'\n\t\t\tnejvýše však 100' +
			'\n\t\tall - smaže všechny zprávy,' +
			'\n\t\t\tdostupné pouze ve voice_channel_chatu');
hint.set('drill', '!d[rill] [start|leaderboard]' +
				  '\n\tObsluhuje procvičovací místnost. Příkazy jsou dostupné pouze v procvičovací místnosti.' +
				  '\n\t\tstart - zahájí procvičování' +
				  '\n\t\tleaderboard - zobrazí pět slovíček, jež dělají největší problémy');
hint.set('emoji', '!e[moji] [list|emoji]' +
				  '\n\tSomárek pošle velký obrázek emoji se jménem odesílatele v popisku' +
				  '\n\t\tlist - vypíše seznam dostupných obrázků' +
				  '\n\t\temoji - jméno emoji' +
				  '\n\tPříklady:' +
				  '\n\t\tChci vypsat seznam dostupných obrázků' +
				  '\n\t\t\t!emoji list' +
				  '\n\t\tChci poslat velké emoji CringeHarold' +
				  '\n\t\t\t!emoji CringeHarold');
hint.set('game', '!g[ame] <text>' +
			  '\n\tSvolává všechny pařany k herní seanci' +
			  '\n\t\ttext - pokud zadáno, bude text opsán ve svolávající zprávě' +
			  '\n\tPříklady:' +
			  '\n\t\tChci svolat ostatní se zprávou \"SpellBreak ve 22:30\"' +
			  '\n\t\t\t!game SpellBreak ve 22:30');
hint.set('help', '!h[elp] [command]' +
			'\n\tVypíše nápovědu' +
			'\n\tcommand - příkaz, k němuž se má vypsat nápověda' +
			'\n\t\t(Všechny příkazy, pokud je vynecháno)');
hint.set('imback', '!imback' +
			'\n\tSomárek oznámí, že je opět v provozu');
/*hint.set('iplay', '!i[play] [option] [game]* [red green blue]' +
			'\n\tSpravuje hráčské role' +
			'\n\toption - list|get|drop|add|remove' +
			'\n\t\tlist - vypíše seznam dostupných her' +
			'\n\t\tget - přidělí ti roli hráče hry/her [game]' +
			'\n\t\tdrop - odebere ti roli hráče hry/her [game]' +
			'\n\t\tadd - vytvoří roli [game]Player' +
			'\n\t\t\t[red green blue] - barva role v RGB,' +
			'\n\t\t\t\tnáhodná barva, pokud vynecháno' +
			'\n\t\tremove - smaže roli [game]Player');*/
hint.set('module', '!m[odule] [list|add|show|new] <param>' +
			'\n\tSlouží ke správě emoji. Náš server má limit emoji 50. Jelikož emotů používáme víc (teď cca 80), je potřeba mezi aktivními emoji *přepínat*. Pokud tedy chci použít emoji, které právě není *aktivní*, musím si v seznamu najít jeho jméno a pak jej *přidat* příkazem add.' +
			'\n\t\tlist <oddíl> - vypíše seznam oddílů' +
			'\n\t\t\toddíl - pokud je zadáno, vypíše seznam emoji v oddílu' +
			'\n\t\tadd [emoji] - přidá emoji [emoji]' +
			'\n\t\tshow [emoji] - zobrazí emoji [emoji]' +
			'\n\t\tnew [oddíl] [name] - z obrázku přiloženého ke zprávě vytvoří nové emoji s názvem [name] v oddílu [oddíl]' +
			'\n\tPříklady:' +
			'\n\t\tChci vytvořit nové emoji PepeF a zařadit jej do oddílu žáby' +
			'\n\t\t\t!module new žáby PepeF' +
			'\n\t\t\t\ta ke zprávě přiložím obrázek PepeF' +
			'\n\t\tChci přidat emoji CringeHarold' +
			'\n\t\t\t!module add CringeHarold' +
			'\n\t\tChci vypsat seznam oddílů emoji' +
			'\n\t\t\t!module list' +
			'\n\t\tChci vypsat seznam emoji v oddílu vlastní' +
			'\n\t\t\t!module list vlastní' +
			'\n\t\tChci vidět, jak vypadá emoji CringeHarold' +
			'\n\t\t\t!module show CringeHarold');
hint.set('newstyle', 'Rodina newstyle:' +
			'\n\tSpravuje jukebox' +
			'\n\t!play [url] - přehraje písničku na [url]' +
			'\n\t!volume [number] - změní hlasitost na [number]%' +
			'\n\t!stop - zastaví přehrávání');
hint.set('nickname', '!n[ickname] [přezdívka]' +
					 '\n\tSlouží k nastavení přezdívky pro SomárBota. Z technických dúvodů' +
						' totiž přezdívka nejde nastavit v GUI' +
					 '\n\t(Dostupné pouze pro Údržbáře)' +
					 '\n\t\t[přezdívka] - přezdívka, která bude SomárBotovi nastavena' +
					 '\n\tPříklady:' +
					 '\n\t\tChci SomárBotovi nastavit přezdívku \'Můj cukroušek\'' +
					 '\n\t\t\t!nickname Můj cukroušek');
hint.set('pin', '*nevolá se příkazem*' +
				'\n\tSlouží k připínání správ. Pro připnutí označ zprávu reakcí :pushpin:' +
				'\n\t(Dostupné pouze pro IT Studenty)');
hint.set('plesk', '!p[lesk] [@user]' +
			'\n\tPropleská toho, koho je právě potřeba' +
			'\n\tuser - uživatelé k propleskání (Tomči, pokud je vynecháno)');
hint.set('rangers', '!rangers [option]' +
			'\n\tVkládá gify a čaká, pokud se sejde všech 5 barev, pokud ano --> pošle gif se všemi rangerami.' +
			'\n\toption - abort|color*' +
			'\n\t\tabort - ukončí čekání na všech 5 barev :( (někdo je somár)' +
			'\n\t\tcolor - přidá rangera s barvou [white|black|red|blue|yellow]');
hint.set('role', '!r[ole] [option] [role]' +
			'\n\tSpravuje role (dostupné pouze pro IT Studenty)' +
			'\n\t\tTip: Místo mezery použij podtržítko' +
			'\n\toption - list|get|drop' +
			'\n\t\tlist - vypíše seznam dostupných rolí' +
			'\n\t\tget - přidá ti roli [role]' +
			'\n\t\tdrop - odebere ti roli [role]');
hint.set('status', '!s[tatus]' +
			'\n\tVypíše největší pravdu');
hint.set('subject', '*nevolá se příkazem*' +
					'\n\tPředměty se přidávají a odebírají v kanálu #výběr-předmětů.' +
					' Pro přidání nebo odebrání předmětu je třeba zakliknout odpovídající' +
					' reakci na příspěvku se seznamem předmětů.');
hint.set('version', '!v[ersion]' +
			'\n\tVypíše současnou verzi');
hint.set('whatsnew', '!whatsnew <all>' +
					 '\n\tVypisuje seznam změn' +
					 '\n\t\tall - vypíše seznam všech změn, pokud nezadáno, vypisuje pouze změny v poslední verzi' +
					 '\n\tPříklady:' +
					 '\n\t\tChci vypsat změny v poslední verzi' +
					 '\n\t\t\t!whatsnew' +
					 '\n\t\tChci vypsat všechny změny' +
					 '\n\t\t\t!whatsnew all');
hint.set('zadani', '!z[adani]' +
			'\n\tAle vážně, kdo?');

function help(msg, params) {
	msg.delete().then(nothing => {
		text = '\`\`\`';
		if (params.length > 1) {
			text += hint.get(params[1]);
		} else {
			text += 'Když se chceš dozvědět, jak funguje některý z příkazů,' +
					' napiš !help [příkaz]' +
					'\n\nPříkazy, bez kterých se neobejdeš:' +
					'\n\tiplay' +
					'\n\tmodule' +
					'\n\taccess' +
					'\nSeznam všech příkazů:';
			hint.forEach((_, key) => text += '\n\t' + key);
		}
		text += '\`\`\`';
		msg.channel.send(text);
	});
}

function kill(msg) {
	failureString = ''
	failures.forEach((v, k) => {
		failureString += k + ':' + v + '\n';
	});

	msg.delete().then(nothing =>	
		msg.channel.send('See you later!')).then(nothing =>
			console.log('Shutting down...')).then(nothing =>
			fs.writeFile(process.env.BOT_PATH + '/failures',
				failureString, () => client.destroy()));
}

function clear(msg, params) {
	msg.delete().then(nothing => {
		if (params.length < 2) {
			return;
		}
	
		if (msg.member.roles.cache.find(r => r.name == 'Údržbář') == undefined) {
			msg.channel.send('Untermenschen nemohou mazat zprávy!');
			return;
		}
	
		if (params[1] == 'all') {
			if (msg.channel.name != '_voice-channel-chat') {
				return;
			}
		
			msg.channel.messages.fetch({
				before: msg.id
			}).then(load => load.each(message => message.delete()));
		
			return;
		}
	
		number = Math.min(parseInt(params[1]), 100);
		msg.channel.messages.fetch({ limit: number }).then(messages =>
			msg.channel.bulkDelete(messages));
	});
}

// Admin
function isAdmin(member) {
	return member.roles.cache.has('710427377024630895');
}

function checkAdmin(msg) {
	state = isAdmin(msg.member)
	if (! state) {
		msg.channel.send("Pro tuto akci nemáš oprávnění");
	}
	return state;
}

url = new Map();
url.set('kekw', 'https://www.fi.muni.cz/~xskarou1/images/kekw.jpg');
url.set('facepalm', 'https://www.fi.muni.cz/~xskarou1/images/facepalm.jpg');
url.set('brandejx', 'https://www.fi.muni.cz/~xskarou1/images/brandejx.png');
url.set('really', 'https://www.fi.muni.cz/~xskarou1/images/really.png');
url.set('cringeharold', 'https://www.fi.muni.cz/~xskarou1/images/cringeharold.png');
url.set('spejbl', 'https://www.fi.muni.cz/~xskarou1/images/spejbl.png');
url.set('spoko', 'https://www.fi.muni.cz/~xskarou1/images/spoko.png');
url.set('pedo', 'https://www.fi.muni.cz/~xskarou1/images/pedo.jpg');

function emoji_function(msg, params) {
	msg.delete().then(nothing => {
		if (params.length < 2) {
			return;
		}
		if (params[1] == 'list') {
			list = '';
			url.forEach((_, key) => list += '\n\t' + key);
			msg.channel.send('**Seznam obrázků:**' + list);
		} else {
			name = params[1].toLowerCase();
			if (! url.has(name)) {
				msg.channel.send('Neznámé emoji: ' + params[1]);
			} else {
				msg.channel.send('**' + msg.author.username + '** na to říká:',
					{files: [url.get(name)]});
			}
		}
	});
}

function pepegaCather(msg) {
	if (msg.author.username == 'Tomáš') {
		msg.react('685961264559685683'); // pepega
	}
}

function insert_emoji(name, guild) {
	emoji = guild.emojis.cache.find(e => e.name == name);
	return '<:' + emoji.name + ':' + emoji.id + '>';
}

function game(msg) {
	console.log('Příkaz !game');
	msg.delete().then(async () => {
		new_text = msg.content.replace('!g ', '').replace('!game ', '');
			// maže i mezeru za příkazem
		console.log(new_text);
		agressive = 'Pojďte kurva sem vy zasraní zmrdi!!!';
		assertive = 'Ve své ponížené maličkosti si vás dovoluji uctivě požádat, abyste milostivě račili přijít ' + insert_emoji('Tarded', msg.guild);
		reply = await msg.channel.send('@here ' + assertive +
			'\n' + msg.author.toString() + ' říká: **' + new_text + '**');
		reply.react(msg.guild.emojis.cache.find(e => e.name == 'Yes')); // vote_yes
		reply.react('⛔'); // no_entry
		reply.react('🕑'); // clock1
	});
}

function iplay(msg, params) {
	msg.delete().then(nothing => {
		if (params.length == 2 && params[1] == 'list') {
			games = [];
			msg.guild.roles.cache.each(role => {
				name = role.name;
				if (name.endsWith('Player')) {
					games.push(name.slice(0, name.length - 6));
				}
			});
			games.sort();
			msg.channel.send('Dostupné hry:\n\t'
				+ games.join('\n\t'));
			return;
		}		
		
		if (params.length < 3) {
			return;
		}
		
		if (['get', 'drop'].includes(params[1])) {
			for (i = 2; i < params.length; i++) {
				role = msg.guild.roles.cache.find(role => role.name.toLowerCase() ==
					params[i].toLowerCase() + 'player');
			
				if (role == undefined) {
					msg.channel.send('Tato hra neexistuje!');
					return;
				}
			
				if (params[1] == 'get') {
					msg.member.roles.add(role);
				} else if (params[1] == 'drop') {
					msg.member.roles.remove(role);
				}
			}
		}
		
		if (['add', 'remove'].includes(params[1])) {
			if (!isAdmin(msg.member)) {
				msg.channel.send('Untermenschen nemohou přidávat'
					+ ' ani odebírat hry');
			}
			
			if (params[1] == 'add') {
				console.log('Adding player role ' + params[2]);
				
				color = undefined;
				if (params.length == 6) {
					color = [parseInt(params[3]), parseInt(params[4]),
						parseInt(params[5])]
				}
				
				msg.guild.roles.create({
					data: {
						name: params[2] + 'Player',
						color: (color != undefined) ? color : "RANDOM"
					},
					reason: "coz why not :D"
				});
			} else if (params[1] == 'remove') {
				console.log('Removing player role ' + params[2]);
				
				role = msg.guild.roles.cache.find(role => role.name ==
					params[2] + 'Player');
				if (role != undefined) {
					role.delete()
				}
			}
		}
		
	});
}

function spam(msg, params) {
	for (i = 0; i < parseInt(params[1]); i++) {
		msg.channel.send(i + 'Jenom si tu spamuji...');
	}
	msg.channel.send('Dospamováno');
}

function role_(msg, params) {
	msg.delete().then(nothing => {
		if (msg.member.roles.cache.find(r => r.name == 'Údržbář') == undefined) {
			//msg.channel.send('Nemáš oprávnění');
			return;
		}
		
		if (params.length == 2 && params[1] == 'list') {
			roles = msg.guild.roles.cache.map(role => role.name).filter(
				name => !['@everyone', 'SomárBot', 'Člen hlasového kanálu']
					.includes(name)).sort();
			msg.channel.send('Dostupné role:\n\t' + roles.join('\n\t'));
			return;
		}
		
		if (params.length < 3) {
			return;
		}
	
		if (['get', 'drop'].includes(params[1])) {
			name = params[2].replace('_', ' ');
			role = msg.guild.roles.cache.find(role =>
				role.name.toLowerCase() == name.toLowerCase());
			if (params[1] == 'get') {
				// Přidávání role
				msg.member.roles.add(role);
			} else if (params[1] == 'drop') {
				// Odebírání role
				msg.member.roles.remove(role);
			}
		}
	});
}

function leave(msg) {
	if (msg.author.username != 'NirakŠatjov') {
		console.log(1);
		return;
	}
	msg.channel.send('Leaving...');
	msg.guild.leave();
}

dispatcher = null;
						
connection = null;
//playing = false;

async function newstyle(msg, params) {
	console.log(params);
	
	if (params.length < 2) {
		return;
	}
	
	if (params[1] == 'stop') {
		console.log('Disconnecting');
		dispatcher.end();
		return
	}
	
	if (params.length < 3) {
		return;
	}
	
	if (params[1] == 'volume') {
		volume = parseFloat(params[2]) / 100;
		console.log(volume);
		dispatcher.setVolumeLogarithmic(volume);
	}
	
	if (params[1] == 'play') {
		/*if (playing) {
			await dispatcher.end();
		}*/
		
		console.log('Connecting');
		playing = true;
		channel = msg.guild.channels.cache.find(channel =>
			channel.name == 'Games Kútik');
		channel.join().then(con => {
			connection = con;
			if (!params[2].startsWith('http')) {
				console.log(1);
				// TODO
			} else {
				link = params[2];
			}		
	
			ytdl(link, {option: 'highest'}).pipe(
				fs.createWriteStream(tmp)).on(
					'finish', () => {
						console.log('Downloaded');
						dispatcher = connection.play(tmp);
						dispatcher.setVolumeLogarithmic(0.50);
						
						/*dispatcher.on('finish', () => {
							console.log('Finished');
							connection.disconnect();
							playing = false;
						});*/
					});
		});
	}
}

ranger_col = new Map();
ranger_col.set('white', false);
ranger_col.set('green', false);
ranger_col.set('blue', false);
ranger_col.set('red', false);
ranger_col.set('black', false);

function rangers(msg, params) {
	function set_all_rangers(new_value) {
		ranger_col.forEach((_, key) => ranger_col.set(key, new_value));
	};
	
	msg.delete().then(nothing => {		
		if (params.length > 1 && ['abort', 'list'].includes(params[1])) {
			if (params[1] == 'abort') {
				set_all_rangers(false);
				msg.channel.send(new Discord.MessageAttachment(
					img_url + 'ranger_' + 'abort.gif'));
			}
			
			if (params[1] == 'list') {
				console.log(ranger_col);
			}
			
			return;
		}
		
		if (params.length == 2 && params[1] == '*') {
			set_all_rangers(true);
		} else {		
			params.slice(1).forEach(color => {
				if (ranger_col.has(color)) {
					ranger_col.set(color, true);
					msg.channel.send(new Discord.MessageAttachment(
						img_url + 'ranger_' + color + '.gif'));
				}
			});
		}
		
		if (Array.from(ranger_col).every(item => item[1])) {
			msg.channel.send(new Discord.MessageAttachment(
				img_url + 'ranger_' + 'all.gif'));
			set_all_rangers(false);
		}
	});
}

function getChannel(msg, channelName) {
	return msg.guild.channels.cache.find(channel => channel.name == channelName).toString();
}

function whatsnew(msg, params) {
	msg.delete().then(() =>
	{
		function last() {
			msg.channel.send('**WhatsNew v .2.18**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidáno !access add_subcategory' +
			'\n\t\t⛏ !access add_room nyní upravuje odpovídající tabulku předmětů');
		}
		
		if (params.length == 1) {
			last();
		} else if (params.length == 2 && params[1] == 'all') {
			last();
			
			msg.channel.send('**WhatsNew v .2.17**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: !module už funguje, ikdyž není emoji plný počet' +
			'\n\t\t:bulb: !module new už používá správnou adresu');
			
			msg.channel.send('**WhatsNew v .2.16**' +
			'\n\t__Major changes__' +
			'\n\t\t⚡ Přidáno !imback' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: V !game přidána chybějící mezera mezi výpisem jména autora a reagujícího');
			
			msg.channel.send('**WhatsNew v .2.15**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: Opraveno !game (chybějící emoji)' +
			'\n\t\t:bulb: Opraveno !emoji (url)');
			
			msg.channel.send('**WhatsNew v .2.14**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: Již nejde přidat víc stejných emoji najednou' +
			'\n\t\t:bulb: Opraveno !emoji (emoji)');
			
			msg.channel.send('**WhatsNew v .2.13**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidán přepínač !emoji list, podívej se do nápovědy k !emoji' +
			'\n\t\t⛏ Připnuté zprávy již lze i odepínat' +
			'\n\t\t⛏ !game teď při reakci označuje vyzyvatele' +
			'\n\t\t⛏ První písmeno nově vytvořeného emoji bude vždy velké' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: Opraveno !game (přepracováno !module add)' +
			'\n\t\t:bulb: Opravena chyba při přidávání více emoji najednou' +
			'\n\t\t:bulb: Již nemůže být znovu přidán smajlík, který je aktivní' +
			'\n\t\t:bulb: !module list již funguje i při zadání neexistujícího oddílu' +
			'\n\t\t:bulb: Ve školních kanálech již lze tagovat @ everyone a @ here. Pro opravu si předmět znovu přidej ve ' + getChannel(msg, 'výběr-předmětů') +
			'\n\t\t:bulb: !help už místo !subject ukazuje !access');
			
			msg.channel.send('**WhatsNew v .2.12**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Pomocí !module add lze nyní přidat více emoji najednou' +
			'\n\t\t⛏ Hry se již nepřidávají přes iplay, ale přes ' + getChannel(msg, 'výběr-her') +
			'\n\t\t⛏ !clear nyní maže zprávy rychleji' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: Výběr předmětů je opět v provozu');
			
			msg.channel.send('**WhatsNew v .2.11**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:V předmětových kanálech již jdou posílat gify, pro opravu si kanál znovu přidej ve '
				+ getChannel(msg, 'výběr-předmětů'));
			
			msg.channel.send('**WhatsNew v .2.10**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Nyní lze v kategorii škola připínat i staré zprávy');
			
			msg.channel.send('**WhatsNew v .2.9**' +
			'\n\t__Major changes__' +
			'\n\t\t⚡ Přidán výběr předmětů, nakoukni do ' + getChannel(msg, 'výběr-předmětů') +
			'\n\t\t⚡ Přidán příkaz !nickname, zavolej \'!help nickname\' pro víc informací' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ !help má rozšířený popisek' +
			'\n\t\t☀ Přidáno velké emoji Spejbl' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:!role get/drop už funguje i pro roli admin');
			
			msg.channel.send('**WhatsNew v .2.8**' + 
				'\n\t__Minor changes__' +
				'\n\t\t⛏ !help má nový popisek');
			
			msg.channel.send('**WhatsNew v .2.7**' + 
				'\n\t__Minor changes__' +
				'\n\t\t⛏ Změna chování při zadání neplatného příkazu');
			
			msg.channel.send('**WhatsNew v .2.6**' + 
				'\n\t__Minor changes__' +
				'\n\t\t⛏ !game nyní vypisuje i autora zprávy' +
				'\n\t\t⛏ V popisku bota je teď nápověda k použití' +
				'\n\t__Bug fixes__' +
				'\n\t\t:bulb: IT Studenti již mohou připínat zprávy' +
				'\n\t\t:bulb: !help již funguje i bez argumentu');
			
			msg.channel.send('**WhatsNew v .2.5**' +
			'\n\t__Major changes__' +
			'\n\t\t⚡ Přidán drill, nakoukni do ' +
			msg.guild.channels.cache.find(ch => ch.name == 'drill').toString());

			msg.channel.send('**WhatsNew v .2.4**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přepracován příkaz !game' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:Opravena chyba při spouštění' +
			'\n\t\t:bulb:Quickfix přidávání stavových reakcí při !game');
			
			msg.channel.send('**WhatsNew v .2.3**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidán přepínač !module new' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:!module add již nevytváří emoji se zadanou velikostí písmen, ale se správnou' +
			'\n\t\t:bulb:!module add již nepřidává duplicitní emoji při zadání jiné velikosti písmen' +
			'\n\t\t:bulb:!plesk již nepoužívá statickou sněhovou vločku emoji');
			
			msg.channel.send('**WhatsNew v .2.2**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:!game již nemaže původní zprávu' +
			'\n\t\t:bulb:Opraven text !game');
			
			msg.channel.send('**WhatsNew v .2.1**' +
			'\n\t__Major changes__' +
			'\n\t\t⚡ Přidán příkaz !g' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidán přepínač !whatsnew all' +
			'\n\t\t⛏ Přidán přepínač !module show' +
			'\n\t\t⛏ Přidána nápověda k !emoji' +
			'\n\t\t☀ Přidáno emoji PepePopcorn <:PepePopcorn:741994455787110531> [žáby]' +
			'\n\t\t☀ Přidáno emoji BrandejsWine <:BrandejsWine:741999817554919435> [škola]' +
			'\n\t\t☀ Přidáno emoji Noice <:Noice:742008540155084832> [ostatní]' +
			'\n\t\t☀ Přidáno emoji Stonks <:Stonks:742012618855678012> [ostatní]' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb:!iplay role jsou nyní case insensitive' +
			'\n\t\t:bulb:!clear je nyní dostupné i IT Studentům' +
			'\n\t\t:bulb:Opravena nápověda k !module');
			
			msg.channel.send('**WhatsNew v .2.0**' + 
				'\n\t__Major changes__' +
				'\n\t\t⚡ Přidán příkaz !whatsnew' +
				'\n\t\t⚡ Přidán příkaz !module' +
				'\n\t__Minor changes__' +
				'\n\t\t⛏ Přidána nápověda k !module' +
				'\n\t\t☀ Přidáno emoji Obdy <:Obdy:737718679319347231>' +
				'\n\t\t☀ Přidáno emoji KingPepega <:KingPepega:737732861863526492>' +
				'\n\t__Bug fixes__' +
				'\n\t\t:bulb: Whut má teď průhledné pozadí <:Whut:737722023362428980>' +
				'\n\t\t:bulb: DomciOut má teď průhledné pozadí <:DomciOut:737720985788088380>');
		}
	});
}

async function module(msg, params) {
	withoutDiacritic = new Map([
		['á', 'a'],
		['č', 'c'],
		['é', 'e'],
		['ě', 'e'],
		['í', 'i'],
		['ř', 'r'],
		['š', 's'],
		['ú', 'u'],
		['ů', 'u'],
		['ý', 'y'],
		['ž', 'z']
	]);
	
	permanent = ['Yes', 'Tarded', 'Kekw', 'CringeHarold', 'KingPepega'];
	
	function unifyName(name) {
		lower = name.toLowerCase();
		res = '';
		for (l = 0; l < lower.length; l++) {
			if (withoutDiacritic.has(lower[l])) {
				res += withoutDiacritic.get(lower[l]);
			} else {
				res += lower[l];
			}
		}
		return res;
	};
	
	function expandName(name) {
		folders = fs.readdirSync(emoji_dir);
		for (i = 0; i < folders.length; i++) {
			path = emoji_dir + '/' + folders[i];
			files = fs.readdirSync(path);
			for (j = 0; j < files.length; j++) {
				if (unifyName(name) == unifyName(files[j].slice(0, -4))) {
					return [path + '/' + files[j], files[j].slice(0, -4)];
				}
			}
		}
	};
	
	console.log('Funkce !module');
	
	//msg.delete().then(async () =>
	{		
		if (params.length < 2) {
			return;
		}
		if (params[1] == 'list') {
		// !module list
			if (params.length == 2) {
				msg.channel.send('**Oddíly emoji:**\n\t' +
					fs.readdirSync(emoji_dir).sort().join('\n\t'));
			} else {
				folders = fs.readdirSync(emoji_dir);
				
				broken = false;
				for (i = 0; i < folders.length; i++) {
					if (unifyName(folders[i]) == unifyName(params[2])) {
						msg.channel.send('**Oddíl ' + folders[i] + ':**\n\t' +
							fs.readdirSync(emoji_dir + '/' + folders[i]).sort()
							.map(name => name.substr(0, name.length - 4)).join('\n\t'));						
						
						broken = true;
						break;
					}
				}
				if (! broken) {
					console.log('Oddíl **' + params[2] + '** nenalezen');
					msg.channel.send('Oddíl ' + params[2] + ' neexistuje');
				}
			}
		} else if (params[1] == 'add') {
		// !module add
			
			function existsSomewhere(name) {
				dirs = fs.readdirSync(emoji_dir);
				for (j = 0; j < dirs.length; j++) {
					files = fs.readdirSync(emoji_dir + '/' + dirs[j]);
					for (k = 0; k < files.length; k++) {
						if (unifyName(name) == unifyName(files[k].slice(0, -4))) {
							console.log('Soubor ' + name + ' existuje');
							return true;
						}
					}
				}
				return false;
			};
			
			console.log('Větev !module add');
			
			toAdd = params.slice(2)
				.map(unifyName)
				.filter((val, index, array) =>
					array.indexOf(val) == index)
				.filter(name => msg.guild.emojis.cache.find(
					e => e.name.toLowerCase() == name.toLowerCase()) == undefined)
				.filter(existsSomewhere);
			console.log(toAdd);
			
			console.log('Mazání starých emoji');
			currentSize = msg.guild.emojis.cache.size;
			toDelete = toAdd.length - 50 + currentSize;
			console.log(toAdd.length - 50 + currentSize);
			await Promise.all(msg.guild.emojis.cache
				.filter(e => ! permanent.includes(e.name))
				.first(toDelete > 0 ? toDelete : 0) // Záporné číslo bere prvky od konce
				.map(async emoji => {
					console.log('Maže se emoji ' + emoji.name);
					await emoji.delete();
				}));
			
			console.log('Přidávání nových emoji');
			toAdd.forEach(async name => {
				r = expandName(name);
				console.log('Přidává se ' + name);
				await msg.guild.emojis.create(r[0], r[1]);
			});
			console.log('Emoji přidána');
			
		} else if (params[1] == 'show') {
			if (params.length < 3) {
				return;
			}
			
			msg.channel.send('**' + params[2] + '**', {
				files: [
					await find_in_folder(params[2])
				]
			});
		} else if (params[1] == 'new') {
		// !module new
			console.log('Přepínač !module new');
			if (params.length < 4) {
				return;
			}
			name = params[3][0].toUpperCase() + params[3].slice(1);
			at_url = msg.attachments.first().url;
			console.log('URL: ' + at_url);
			request = https.get(at_url, response => response.pipe(fs.createWriteStream(
					emoji_dir + '/' + params[2] + '/' + name + '.' +
						at_url.split('.').pop())));
		}
	}
	if (params[1] != 'new') {
		msg.delete();
	}
}

czechToRussian = new Map();
failures = new Map();
sequence = [];
position = 0;

function loadDictionary() {
	fs.readFile(process.env.BOT_PATH + '/dictionary', 'utf8', (err, data) => {
		skip = false;
		data.split('\n').forEach(row => {
			if (row == '#') {
				skip = true;
			} else if (row == '*') {
				skip = false;
			} else if (row.length != 0 && !skip) {
				words = row.split(':');
				czechToRussian.set(words[0], words[1]);
				sequence.push([words[0], words[1]]);
			}
		});
		console.log(sequence);
	});

	fs.readFile(process.env.BOT_PATH + '/failures', 'utf8', (_, data) => {
		data.split('\n').forEach(row => {
			if (row.length != 0) {
				content = row.split(':');
				failures.set(content[0], content[1]);
			}
		});
	});
}

function drill(msg, params) {
	if (msg.author.username == 'SomárBot') {
		return;
	}

	function randomShuffle(array) {
		//return array.sort((a, b) => Math.random() < 0.5); // Isnt random enough :(

		for (i = array.length - 1; i > 0 ; i--) {
			j = Math.floor(Math.random() * i);
			[array[i], array[j]] = [array[j], array[i]];
		}

		return array;
	}
	
	function editMessage(msg, task, result) {
		msg.edit('Slovo: ' + task +
				 '\nVýsledek: ' + result);
	}
	

	msg.delete().then(async () => {
		if (params.length == 2) {
			if (params[1] == 'start') {
				sequence = randomShuffle(sequence);
				msg.channel.send('Slovo: ' + sequence[0][0] +
								 '\nVýsledek: nezodpovězeno');
			} else if (params[1] == 'leaderboard') {
				content = '';
				msg.channel.messages.fetch({ limit: 2 }).then(msgs => {
					task = msgs.array()[0];
					content = task.content;
					task.delete();
				}).then(() => {
					array = [];
					failures.forEach((v, k) => array.push([v, k]));
					array.sort();
					winners = array.slice(0, Math.min(5, array.length));
					msg.channel.send('Leaderboard:' +
						winners.reduceRight((acc, v) =>
							acc + v[1] + ': ' + v[0] + '\n\t', '\n\t'));
				}).then(() => {
					msg.channel.send(content);
				});
			}
			return;
		}

		taskMessage = (await msg.channel.messages.fetch({ limit: 2 }))
			.array()[0];
		state = taskMessage.content.split('\n')
			.map(t => t.split(':')[1].substring(1));

		if (sequence[position][1] == msg.content) {
			position++;
			if (position >= sequence.length) {
				position = 0;
				sequence = randomShuffle(sequence);
			}

			state[0] = sequence[position][0];
			state[1] = 'nezodpovězeno';
		} else {
			state[1] = 'špatně';
			if (failures.has(state[0])) {
				failures.set(state[0], failures.get(state[0]) + 1);
			} else {
				failures.set(state[0], 1);
			}
			console.log(failures);
		}
		
		editMessage(taskMessage, state[0], state[1]);
	});
}

function invalid_command(msg, params) {
	msg.delete().then(() => {
		msg.channel.send('```' + msg.content + '```Tento příkaz neexistuje');
	});
}

function nickname(msg) {
	msg.delete().then(() => {
		if (! checkAdmin(msg)) {
			return;
		}
		msg.guild.members.cache.find(m => m.user.username == "SomárBot")
			.setNickname(msg.content.substring(msg.content.indexOf(' ') + 1));
	});
}

codePrefixToCategoryName = new Map([
	['pb', 'Praktické bakalářské předměty'],
	['pv', 'Praktické volitelné předměty'],
	['ib', 'Informatické bakalářské předměty'],
	['mb', 'Matematické bakalářské předměty'],
	['os', 'Ostatní'],
	
	[1, 'Dostupné hry']
]);

function addMonitoredChannel(channel_id) {
	monitoredChannelsIDs.push(channel_id);
	fs.appendFile(monitored_path, '\n' + channel_id, () => {});
}

const colors = ['⚫', '🔵', '🟤', '🟢', '🟠', '🟣', '🔴', '⚪', '🟡',
				'⬜', '🟧', '🟦', '🟥', '🟫', '🟪', '🟩', '🟨', '⬛'];

function access(msg, params) {
	function reactColors(msg, count) {
		colors.slice(0, count)
			.forEach(emoji => msg.react(emoji));
	};
	
	if (! checkAdmin(msg)) {
		return;
	}
	
	msg.delete().then(() => {
		if (params[1] == 'new_category') {
			ch_id = msg.guild.channels.cache.find(ch => ch.name == params[2]).id;
			addMonitoredChannel(ch_id);
			msg.guild.channels.cache.find(ch => ch.name == params[2])
				.fetch({ limit: 20 });
				
		} else if (params[1] == 'remove_category') {
			// Není potřeba
			console.log('access remove_category není implementováno');
		
		} else if (cie(params[1], 'add_subcategory')) {
			// !access add_subcategory 'category' 'code' 'subcategory'
			
			category = params[2]
			code = params[3];
			subcategory = params[4]
			
			channel = msg.guild.channels.cache.filter(ch => ch.name.startsWith('výběr'))
				.find(ch => cie(ch.parent.name, category));
			
			channel.send('**' + code.toUpperCase() + ': ' +
				subcategory[0].toUpperCase() +
				subcategory.slice(1).replace(/-/g, ' ') + '**');
			
		} else if (params[1] == 'add_room') {
			// !access add_room 'category' 'name'
			
			category = params[2];
			name = params[3];
			
			names = msg.guild.channels.cache.filter(ch => ch.type == 'text')
				.filter(ch => cie(ch.parent.name, category))
				.map(ch => ch.name);
			names.push(name);
			names.sort();
			index = names.lastIndexOf(name);
			
			msg.guild.channels.create(params[3], {
				type: 'text',
				parent: msg.guild.channels.cache.find(ch => cie(ch.name, params[2])),
				permissionOverwrites: [
					{
						id: msg.guild.roles.cache.find(r => r.name == '@everyone'),
						deny: [
							'CREATE_INSTANT_INVITE',
							'ADD_REACTIONS',
							'VIEW_CHANNEL',,
							'SEND_MESSAGES',
							'SEND_TTS_MESSAGES',
							'EMBED_LINKS',
							'ATTACH_FILES',
							'READ_MESSAGE_HISTORY',
							'MENTION_EVERYONE',
							'USE_EXTERNAL_EMOJIS',
						]
					}
				],
				position: index
			});
			
			subjectType = name.slice(0, 2);
			
			channel = msg.guild.channels.cache.find(ch => {
				return ch.name.startsWith('výběr') && cie(category, ch.parent.name);
			});
			message = channel.messages.cache.find(m => {
				return cie(m.content.substring(2, 4), subjectType);
			});
			
			names = names.filter(name => name.startsWith(subjectType))
				.map(name => name.replace(/-/g, ' '));
			tuples = zip(names, colors);
			
			newText = message.content.split('\n')[0] +
				tuples.reduce((acc, value) => {
					return acc + '\n\t' + value[1] + ' `' + value[0] + '`';
				}, '');
			
			message.edit(newText);			
			colors.slice(0, names.length).forEach(c => message.react(c));
			
		} else if (params[1] == 'list_categories') {
			msg.channel.send('**Monitorované kanály jsou:**\n\t' +
				monitoredChannelsIDs.join('\n\t'));
				
		} else if (params[1] == 'send_table') {
			// !access send_table *channel*
			
			channel = msg.guild.channels.cache.find(ch => ch.name == params[2]);
			category = channel.parent.name;
			// console.log(channel.name);
			channel.messages.fetch({ limit: 20 }).then(messages =>
				channel.bulkDelete(messages));
			
			categories = new Map();
			// console.log(channel.parent.name);
			names = msg.guild.channels.cache
				.filter(ch => ch.type == 'text' && ! ch.name.startsWith('výběr'))
				.filter(ch => {
					return ch.parent.name == category;
				})
				.map(ch => ch.name);
			
			
			if (category == 'GAMES') { // HRY
				console.log('Kategorie hry');
				
				act = 1;
				do {
					categories.set(act, names.slice(0, 10));
					names = names.slice(10);
					act++;
				} while (names.length > 18);
			} else if (category == 'ŠKOLA') {
				console.log('Kategorie škola');
				
				names.forEach(name => {
					start = name.substring(0, 2);
					if (categories.has(start)) {
						categories.get(start).push(name);
					} else {
						categories.set(start, [name]);
					}
				});
				
				others = []
				categories.forEach((value, key) => {
					if (value.length == 1) {
						others.push(value[0]);
						categories.delete(key);
					}
				});
				categories.set('os', others);
			}

			// console.log(categories);
			
			categories.forEach((value, key) => {
				value.sort();
				i = -1;
				channel.send('**' + codePrefixToCategoryName.get(key) + '**' +
					value.reduce((acc, cur) => {
						i++;
						return acc + '\n\t' + colors[i] + ' `' +
							cur.replace(new RegExp('-', 'g'), ' ') + '`';
					}, ''))
					.then(m => { reactColors(m, value.length);
				});
			});
		}
	});
}

function access_reaction(reaction, user, mode) {
	/* mode
		true  - reactionAdd
		false - reactionRemove
	*/
	
	if (! reaction.message.channel.name.startsWith('výběr')) {
		// je to breakout
		return;
	}
	
	emoji = reaction.emoji.toString();
	
	rows = reaction.message.content.split('\n\t').slice(1);
	row = rows.find(row => {
		return row.split(' ')[0] == emoji;
	});	
	index = row.indexOf('`');
	
	channelCode = row.substring(index + 1, index + 6).toLowerCase()
		.replace(' ', '-');
	channel = reaction.message.guild.channels.cache.find(ch =>
		ch.name.startsWith(channelCode));
		
	if (mode) {
		channel.updateOverwrite(user,
		{
			'ADD_REACTIONS'       : true,
			'ATTACH_FILES'        : true,
			'EMBED_LINKS'         : true,
			'MENTION_EVERYONE'    : true,
			'READ_MESSAGE_HISTORY': true,
			'SEND_MESSAGES'       : true,
			'VIEW_CHANNEL'        : true,
		});
	} else {
		channel.updateOverwrite(user,
		{
			'ADD_REACTIONS'       : false,
			'ATTACH_FILES'        : false,
			'EMBED_LINKS'         : false,
			'MENTION_EVERYONE'    : false,
			'READ_MESSAGE_HISTORY': false,
			'SEND_MESSAGES'       : false,
			'VIEW_CHANNEL'        : false
		});
	}
}

function imback(msg, params) {
	msg.delete().then(() => {
		msg.channel.send({
			files: [{
				attachment: image_dir + '/imback.png'
			}]
		});
	});
}

async function breakOutRooms(msg, params) {
	if (msg.member.roles.cache.find(r => cie(r.name, 'Cvičící') == undefined)) {
		return;
	}
	
	if (cie(params[1], 'init')) {
		// !breakoutrooms init
		
		categoryName = params[2];
		category = msg.guild.channels.cache.find(ch => cie(ch.name, categoryName));
	
		newChannel = await msg.guild.channels.create('breakoutrooms', {
			type: 'text',
			topic: 'Tvorba breakout místností',
			parent: category,
			permissionOverwrites: [
				{
					id: msg.guild.roles.cache.find(r => cie(r.name, '@everyone')),
					deny: [
						'SEND_MESSAGES',
						'SEND_TTS_MESSAGES'
					]
				}			
			]
		});
		
		addMonitoredChannel(newChannel.id);
		
		message = await newChannel.send('Přidej reakci pro vytvoření místnosti');

		message.react('👍');
	}
}

function breakOutRoomsReaction(reaction, user, mode) {
	/* mode
		true  - reactionAdd
		false - reactionRemove
	*/
	
	if (! reaction.message.channel.name.startsWith('breakoutrooms')) {
		// výběr
		return;
	}
		
	if (mode) {
		// mode = true
			
		channelNames = reaction.message.guild.channels.cache
			.filter(ch => cie(ch.type, 'voice'))
			.map(ch => ch.name);
		channelNames.push(user.username);
		channelNames.sort();
		channelPosition = channelNames.indexOf(user.username);
		
		reaction.message.guild.channels.create(user.username, {
			type: 'voice',
			parent: reaction.message.guild.channels.cache
				.find(ch => cie(ch.name, 'hlasové kanály')),
			permissionOverwrites: [
				{
					id: reaction.message.guild.roles.cache
						.find(r => cie(r.name, '@everyone')),
					deny: [
						'VIEW_CHANNEL'
					]
				},
				{
					id: user,
					allow: [
						'VIEW_CHANNEL'
					]
				},
				{
					id: reaction.message.guild.roles.cache
						.find(r => cie(r.name, 'cvičící')),
					allow: [
						'VIEW_CHANNEL'
					]
				}
			],
			position: channelPosition
		});
	} else {
		// mode = false
		
		channel = reaction.message.guild.channels.cache
			.find(ch => cie(ch.name, user.username));
		
		if (channel != undefined) {
			channel.delete();
		}
	}
}

async function log(msg) {
	console.log(msg.guild.channels.cache.map(ch => ch.name));
}














