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
	
	client.on('message', message => {
		//pepegaCather(message);
		
		console.log(new Date().toUTCString(), ': In', message.channel.name, 'user', message.author.username, 'at', message.createdAt, 'wrote\n', message.content);
		
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
			} else if (['support'].includes(params[0].toLowerCase())) {
				console.log('Příkaz !support');
				support(message, params);
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
		if (oldState.channel == null && newState.channel != null) {
			// Připojil se po tom, co nebyl v žádném kanále
			// => nemá oprávnění a potřebuje ho dostat
			
			console.log(newState.member.displayName + ' se připojil do hlasového kanálu ' + newState.channel.name);
			
			member = newState.member;
			textChannel = newState.guild.channels.cache.find(ch => cie(ch.name, 'voice-channel-chat'));
			
			if (textChannel == undefined) {
				console.log('voice-channel-chat neexistuje');
				return;
			}
			
			textChannel.updateOverwrite(
				member,
				{
					'ADD_REACTIONS'       : true,
					'ATTACH_FILES'        : true,
					'EMBED_LINKS'         : true,
					'MENTION_EVERYONE'    : true,
					'READ_MESSAGE_HISTORY': true,
					'SEND_MESSAGES'       : true,
					'VIEW_CHANNEL'        : true,
				}
			);
		} else if (newState.channel == null) {
			// Odpojil se po tom, co byl v nějakém kanále
			// => má oprávnění a má o něj přijít
			
			console.log(newState.member.displayName + ' se odpojil z hlasového kanálu ' + oldState.channel.name);
			
			member = newState.member;
			textChannel = newState.guild.channels.cache.find(ch => cie(ch.name, 'voice-channel-chat'));
			
			if (textChannel == undefined) {
				console.log('voice-channel-chat neexistuje');
				return;
			}
			
			textChannel.updateOverwrite(
				member,
				{
					'ADD_REACTIONS'       : false,
					'ATTACH_FILES'        : false,
					'EMBED_LINKS'         : false,
					'MENTION_EVERYONE'    : false,
					'READ_MESSAGE_HISTORY': false,
					'SEND_MESSAGES'       : false,
					'VIEW_CHANNEL'        : false,
				}
			);
		}
	});
	
	client.on('messageReactionAdd', (reaction, user) => {
		if (user.username == 'SomárBot') {
			return;
		}
		
		console.log(new Date().toUTCString(), 'Add: ' + user.username +
			' přidal reakci ' + reaction.emoji.name +
			' na příspěvek\n' + reaction.message.content);
		
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
			dictionary = new Map([
				['Yes', ' to jde rozjet!'],
				['⛔', ' na to dlabe'],
				['🕑', ' má teď napilno']
			]);
			
			if (dictionary.has(reaction.emoji.name)) {
				msg = reaction.message;
				reactName = reaction.emoji.name;
				author = msg.mentions.users.first();
				msg.channel.send(author.toString() + ' ' +
					reaction.users.cache.last().toString() + dictionary.get(reactName));
			}
		}
	});
	
	client.on('messageReactionRemove', (reaction, user) => {
		if (user.username == 'SomárBot') {
			return;
		}
		
		
		console.log(new Date().toUTCString(), 'Remove: ' + user.username +
			' odebral reakci ' + reaction.emoji.name +
			' z příspěvku\n' + reaction.message.content);
		
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
});

function cie(a, b) {
	// console.log('Porovnávání `' + a + '` a `' + b + '`');
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
				   
				   '\n\t\toption - list_categories|new_category|delete_category|add_subcategory|remove_subcategory|add_room|remove_room|send_table' +
				   
				   '\n\t\t\tlist_categories - vypíše seznam monitorovaných kategorií' +
				   
				   '\n\t\t\tnew_category [kanál] - přidá místnost [kanál] mezi monitorované kanály' +
				   
				   '\n\t\t\tdelete_category - není implementováno' +
				   
				   '\n\t\t\tadd_subcategory [kategorie] [podkategorie] [zkratka] [jméno] - vytvoří podkategorii [jméno] se zkratkou [zkratka] v kategorii [kategorie]' +
				   '\n\t\t\tremove_subcategory [kategorie] [zkratka] - smaže podkategorii se zkratkou [zkratka] v kategorii [kategorie]' +
				   
				   '\n\t\t\tadd_room [kategorie] <podkategorie> [kanál] - vytvoří místnost [kanál] v kategorii [kategorie] a podkategorii <podkategorie>, pokud není podkategorie zadána, použijí se jako podkategorie první dva znaky z názvu místnosti' +
				   
				   '\n\t\t\tremove_room [kategorie] [kanál] - smaže místnost [kanál] v kategorii [kategorie]' +
				   
				   '\n\t\t\tsend_table [kanál] - smaže místnost [kanál] a vloží do něj tabulku pro výběr předmětů' +
				   '\n\tPříklady:' +
				   '\n\tChci vytvořit kategorii škola' +
				   '\n\t\t!access new_category škola' +
				   
				   '\n\tChci vytvořit podkategorii \'Pokročilé informatické předměty\' (kód IA) v kategorii škola' +
				   '\n\t\t!access add_subcategory škola ia pokročilé_informatické_předměty' +
				   
				   '\n\tChci smazat podkategorii \'Špatná podkategorie\' (kód XD) v kategorii škola' +
				   '\n\t\t!access remove_subcategory škola xd' +
				   
				   '\n\tChci vytvořit kanál pb156-sítě v kategorii pb' +
				   '\n\t\t!access add_room škola pb pb156-sítě' +
				   
				   '\n\tChci vytvořit kanál kurs-vaření v kategorii ostatní' +
				   '\n\t\t!access add_room škola ostatní kurs-vaření');
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
hint.set('module', '!m[odule] [list|add|new_category|show|new] <param>' +
			'\n\tSlouží k načítání a přidávání emoji. Emoji v databázi lze načíst pomocí !module add; emoji jež v databázi není lze do databáze přidat pomocí !module new. Náš server má limit 50 emoji. Jelikož emotů používáme víc (teď cca 80), je potřeba mezi aktivními emoji *přepínat* (načítat neaktivní emoji). Pokud tedy chci použít emoji, které právě není *aktivní*, musím si v seznamu najít jeho jméno a pak jej *přidat* příkazem add.' +
			'\n\t\tlist <oddíl> - vypíše seznam oddílů' +
			'\n\t\t\toddíl - pokud je zadáno, vypíše seznam emoji v oddílu' +
			'\n\t\tadd [emoji] - načte emoji [emoji], které je již v databázi' +
			'\n\t\tnew_category [category] - vytvoří novou kategorii emoji [category]' +
			'\n\t\tshow [emoji] - zobrazí emoji [emoji]' +
			'\n\t\tnew [oddíl] [name] - z obrázku přiloženého ke zprávě vytvoří nové emoji s názvem [name] v oddílu [oddíl] a přidá jej do databáze; pro použití musí být nasledně toto emoji explicitně načteno' +
			'\n\tPříklady:' +
			'\n\t\tChci do databáze přidat nové emoji PepeF a zařadit jej do oddílu žáby' +
			'\n\t\t\t!module new žáby PepeF' +
			'\n\t\t\t\ta ke zprávě přiložím obrázek PepeF' +
			'\n\t\tChci načíst emoji CringeHarold z databáze' +
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
hint.set('support', '!support' +
					'\n\tNa 3 hodiny (tedy dočasně) zobrazí místnost všem IT Studentům.' +
					'\n\tPříklady:' +
					'\n\t\tPíšu zkoušku a potřebuji pomoc ostatních' +
					'\n\t\t\t!support')
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
					'\n\tmodule - přidávání emoji' +
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
			msg.channel.send('**WhatsNew v .2.20**' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: !game už funguje, i když je přidána nová reakce');
		}
		
		if (params.length == 1) {
			last();
		} else if (params.length == 2 && params[1] == 'all') {
			last();
			
			msg.channel.send('**WhatsNew v .2.19**' +
			'\n\t__Major changes__' +
			'\n\t\t⚡ Přidáno !support' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidáno !access update' +
			'\n\t__Bug fixes__' +
			'\n\t\t:bulb: Opraveno !access add_room');
			
			function last() {
			msg.channel.send('**WhatsNew v .2.18**' +
			'\n\t__Minor changes__' +
			'\n\t\t⛏ Přidáno !access add_subcategory' +
			'\n\t\t⛏ !access add_room nyní upravuje odpovídající tabulku předmětů');
		}
			
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
	
	permanent = ['Yes', 'Tarded', 'Kekw', 'CringeHarold', 'KingPepega', 'SadKek'];
	
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
		
		} else if (cie(params[1], 'new category')) {
		// !module new_category
		
			if (params.length != 3) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
			fs.mkdir(emoji_dir + '/' + params[2], () => {});
		
		} else if (params[1] == 'add') {
		// !module add
			
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
			// !module show
			
			if (params.length != 3) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
			name = params[2]
			
			if (! existsSomewhere(name)) {
				msg.channel.send('Emoji ' + name + ' neexistuje');
				return;
			}
			
			result = expandName(name);
			
			msg.channel.send('**' + result[1] + '**', {
				files: [
					result[0]
				]
			});
		} else if (params[1] == 'new') {
		// !module new
		
			console.log('Přepínač !module new');
			if (params.length != 4) {
				msg.channel.send('Špatný počet parametrů');
				return;
			}
			
			name = params[3][0].toUpperCase() + params[3].slice(1);
			attachment = msg.attachments.first();
			
			if (attachment == undefined) {
				msg.channel.send('Musíš přiložit přidávané emoji jako obrázek do zprávy');
				return;
			}
			
			at_url = attachment.url;
			console.log('URL: ' + at_url);
			
			dirs = fs.readdirSync(emoji_dir)
			found = dirs.find(dir => cie(unifyName(dir), unifyName(params[2])));
			if (found == undefined) {
				msg.channel.send('Oddíl `' + params[2] + '` neexistuje');
				return;
			}
			
			request = https.get(at_url, response => response.pipe(fs.createWriteStream(
					emoji_dir + '/' + params[2] + '/' + name + '.' +
						at_url.split('.').pop())));
		} else {
			msg.channel.send('Neexistující volba `' + params[1] + '`');
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
	
	function update(msg, category, subcategory) {
		channel = msg.guild.channels.cache.find(ch => ch.name.startsWith('výběr') && ch.parent != undefined && cie(category, ch.parent.name));
		
		if (channel == undefined) {
			msg.channel.send('Kategorie `' + category + '` neexistuje');
			return;
		}
		
		message = channel.messages.cache.find(m => m.content.substring(2).toLowerCase().startsWith(subcategory.toLowerCase()));
		
		if (message == undefined) {
			msg.channel.send('Podkategorie `' + subcategory + '` neexistuje');
			return;
		}
		
		names = msg.guild.channels.cache.filter(ch => ch.type == 'text')
			.filter(ch => ch.parent != null)
			.filter(ch => cie(ch.parent.name, category))
			.filter(ch => ! ch.name.toLowerCase().startsWith('výběr'))
			.map(ch => ch.name)
			.sort();
			
		names = names.map(name => name.replace(/-/g, ' '));
		tuples = zip(names, colors);
		
		newText = message.content.split('\n')[0] +
			tuples.reduce((acc, value) => {
				return acc + '\n\t' + value[1] + ' `' + value[0] + '`';
			}, '');
		
		message.edit(newText);			
		colors.slice(0, names.length).forEach(c => message.react(c));
	};
	
	if (! checkAdmin(msg)) {
		return;
	}
	
	msg.delete().then(async () => {
		if (params[1] == 'new category') {
			// !access new_category 'kategorie'
			
			if (params.length != 3) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
			ch_id = msg.guild.channels.cache.find(ch => ch.name == params[2]).id;
			addMonitoredChannel(ch_id);
			msg.guild.channels.cache.find(ch => ch.name == params[2])
				.fetch({ limit: 20 });
				
		} else if (params[1] == 'remove category') {
			// Není potřeba
			console.log('access remove_category není implementováno');
		
		} else if (cie(params[1], 'add subcategory')) {
			// !access add_subcategory 'category' 'code' 'subcategory'
			
			if (params.length != 5) {
				msg.channel.send('Špatný počet argumentů' + '\nSprávná syntaxe je !access add_subcategory \'category\' \'code\' \'category\'');
				return;
			}
			
			categoryName = params[2]
			code = params[3];
			subcategory = params[4]
			
			choiceChannel = msg.guild.channels.cache.filter(ch => ch.name.startsWith('výběr'))
				.find(ch => cie(ch.parent.name, categoryName));
				
			if (choiceChannel == undefined) {
				msg.channel.send('Kategorie ' + categoryName + ' neexistuje');
				return;
			}
			
			choiceChannel.send('**' + code.toUpperCase() + ': ' +
				subcategory[0].toUpperCase() +
				subcategory.slice(1).replace(/-/g, ' ') + '**');
			
		} else if (cie(params[1], 'add room')) {
			// !access add_room 'category' <subcategory> 'name'
			
			if (params.length != 4 && params.length != 5) {
				msg.channel.send('Špatný počet argumentů' + '\nSprávná syntaxe je !access add_toom \'category\' \'subcategory_code\' \'name\'');
				return;
			}
			
			console.log('!access add_room');
			
			category = params[2];
			subcategory = params.length == 5 ? params[3] : params[3].substring(0, 2);
			name = params.length == 5 ? params[4] : params[3];
			
			maybeExists = msg.guild.channels.cache.find(ch => cie(ch.name, name));
			
			if (maybeExists != undefined) {
				msg.channel.send('Místnost tohoto jména již existuje');
				return;
			}
			
			channel = msg.guild.channels.cache.find(ch => {
				return ch.name.startsWith('výběr') && ch.parent != undefined &&
					cie(category, ch.parent.name);
			});
		
			if (channel == undefined) {
				msg.channel.send('Kategorie `' + category + '` neexistuje');
				return;
			}
			
			message = channel.messages.cache.find(m => {
				return m.content.substring(2).toLowerCase()
					.startsWith(subcategory.toLowerCase());
			});
		
			if (message == undefined) {
				msg.channel.send('Podkategorie `' + subcategory + '` neexistuje');
				return;
			}
			
			await msg.guild.channels.create(name, {
				type: 'text',
				topic: subcategory,
				parent: msg.guild.channels.cache.find(ch => cie(ch.name, category)),
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
				]
			});
			
			update(msg, category, subcategory);
		
		} else if (cie(params[1], 'remove subcategory')) {
			// !access remove_subcategory 'category' 'code'
			
			if (params.length != 4) {
				msg.channel.send('Špatný počet argumentů' +
				'\nSprávná syntaxe je !access remove_subcategory \'category\' \'code\'');
				return
			}
			
			categoryName = params[2];
			subcategoryCode = params[3];
			
			choiceChannel = msg.guild.channels.cache.find(ch => ch.name.startsWith('výběr') && ch.parent != undefined && cie(ch.parent.name, categoryName));
			
			if (choiceChannel == undefined) {
				msg.channel.send('Kategorie ' + categoryName + ' neexistuje');
				return;
			}
			
			msgToDelete = choiceChannel.messages.cache.find(m => m.content.startsWith('**' + subcategoryCode.toUpperCase()));
			
			if (msgToDelete == undefined) {
				msg.channel.send('Podkategorie s kódem ' + subcategoryCode + ' neexistuje');
				return;
			}
			
			msgToDelete.delete();
			
		} else if (cie(params[1], 'remove room')) {
			// !access remove_room 'category' 'subcategory' 'name'
			
			if (params.length != 5) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
			console.log('!access remove_room');
			
			category = params[2];
			subcategory = params[3];
			name = params[4];
			
			channel = msg.guild.channels.cache.find(ch => ch.name.startsWith('výběr') && ch.parent != undefined && cie(category, ch.parent.name));
		
			if (channel == undefined) {
				msg.channel.send('Kategorie `' + category + '` neexistuje');
				return;
			}
			
			message = channel.messages.cache.find(m => m.content.substring(2).toLowerCase().startsWith(subcategory.toLowerCase()));
		
			if (message == undefined) {
				msg.channel.send('Podkategorie `' + subcategory + '` neexistuje');
				return;
			}
			
			maybeDoesntExists = msg.guild.channels.cache.find(ch => cie(ch.name, name));
			
			if (maybeDoesntExists == undefined) {
				msg.channel.send('Místnost tohoto jména neexistuje');
				return;
			}
			
			subcategory = maybeDoesntExists.topic;
			
			await maybeDoesntExists.delete();
			
			setTimeout(() => update(msg, category, subcategory), 3000);
			
		} else if (cie(params[1], 'update')) {
			// !access update 'category' 'subcategory'
			
			if (params.length != 4) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
			category = params[2]
			subcategory = params[3]
			
			update(msg, category, subcategory);
			
		} else if (params[1] == 'list categories') {
			msg.channel.send('**Monitorované kanály jsou:**\n\t' +
				monitoredChannelsIDs.join('\n\t'));
				
		} else if (params[1] == 'send table') {
			// !access send_table *channel*
			
			if (params.length != 3) {
				msg.channel.send('Špatný počet argumentů');
				return;
			}
			
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
			
		} else {
			console.log('!access nemá přepínač `' + params[1] + '`');
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
	row = rows.find(row => row.startsWith(emoji));
	
	if (row == undefined) { // reakce navíc
		console.log('zadána reakci, pro kterou neexistuje místnost');
		return;
	}
	
	startIndex = row.indexOf('`');
	endIndex = row.indexOf('`', startIndex + 1);
	
	channelName = row.substring(startIndex + 1, endIndex).toLowerCase()
		.replaceAll(' ', '-');
	channel = reaction.message.guild.channels.cache.find(ch =>
		cie(ch.name, channelName));
		
	if (channel == undefined) {
		console.log('Kanál s kódem `' + channelName + '` neexistuje, ale je ve výběru');
		return;
	}
	
	value = mode ? true : null;
	
	channel.updateOverwrite(user,
	{
		'ADD_REACTIONS'       : value,
		'ATTACH_FILES'        : value,
		'EMBED_LINKS'         : value,
		'MENTION_EVERYONE'    : value,
		'READ_MESSAGE_HISTORY': value,
		'SEND_MESSAGES'       : value,
		'VIEW_CHANNEL'        : value,
	});
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
		// Reakce se netýká breakoutrooms
		return;
	}
	
	emoji = reaction.emoji.name;
	
	row = reaction.message.content.split('\n')
		.find(r => r.startsWith(emoji));
	
	if (row == undefined) {
		console.log('Skupina ' + emoji + ' neexistuje');
		return;
	}
	
	groupName = row.substring(emoji.length + 1);
	
	groupRole = reaction.message.guild.roles.cache.find(r => cie(r.name, groupName));
	
	if (groupRole == undefined) {
		console.log('Role cvičení `' + groupName + '` neexistuje')
		return;
	}
	
	member = reaction.message.guild.members.cache
		.find(m => {
			console.log(m.id, user.id);
			return m.id == user.id;
		});
		
	if (member == undefined) {
		console.log('Id problém - there is no member with id of reactiong user')
		console.log('user', user);
		console.log('member', member);
		return;
	}
	
	nickname = (member.nickname != null) ? member.nickname : user.username;
	
	parentChannel = reaction.message.guild.channels.cache.find(ch => cie(ch.name, groupName));
	
	if (parentChannel == undefined) {
		console.log('Skupina ' + groupName + ' neexistuje')
		return;
	}
	
	if (mode) {
		// mode = true
	
		member.roles.add(groupRole);
		
		reaction.message.guild.channels.create(nickname, {
			type: 'voice',
			parent: parentChannel,
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
			]
		});
	} else {
		// mode = false
	
		member.roles.remove(groupRole);

		channel = reaction.message.guild.channels.cache
			.find(ch => ch.parent != undefined && ch.parent == parentChannel &&
				cie(ch.name, nickname));
		
		if (channel != undefined) {
			channel.delete().then(() => {
				console.log('Kanál ' + channel.name + ' smazán');				
			});
		}
	}
}

function support(msg, params) {
	msg.channel.updateOverwrite(
		msg.guild.roles.cache.find(r => cie(r.name, 'it student')),
		{
			'ADD_REACTIONS'       : true,
			'ATTACH_FILES'        : true,
			'EMBED_LINKS'         : true,
			'MENTION_EVERYONE'    : true,
			'READ_MESSAGE_HISTORY': true,
			'SEND_MESSAGES'       : true,
			'VIEW_CHANNEL'        : true,
		}
	);
	
	setTimeout(() => {
		console.log('odebirání role `it student` z kanálu `' + msg.channel.name + '`');
		msg.channel.updateOverwrite(
			msg.guild.roles.cache.find(r => cie(r.name, 'it student')),
			{
				'ADD_REACTIONS'       : null,
				'ATTACH_FILES'        : null,
				'EMBED_LINKS'         : null,
				'MENTION_EVERYONE'    : null,
				'READ_MESSAGE_HISTORY': null,
				'SEND_MESSAGES'       : null,
				'VIEW_CHANNEL'        : null,
			}
		);
	}, 3 * 60 * 60 * 1000); // 2 h
}

function log(msg) {
	channel = msg.guild.channels.cache.find(ch => ch.name == 'výběr-her');
	message = channel.messages.cache.first();
	console.log(message);
	message.edit('**DH: Dostupné hry**');
}














