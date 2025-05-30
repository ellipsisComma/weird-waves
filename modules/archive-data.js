/*jshint esversion: 11*/

/*
	archive data module:
		* contains series and show metadata
		* performs basic processing before export
*/

// bitrate: constant 24kbps
// sample rate: max of  22050Hz or existing sample rate

// banger = good show, but in a multi-show run only first part will be marked as a banger

const archiveData = [
{
"code": `ByM`,
"heading": `<cite>Beyond Midnight</cite>`,
"blurb": `A 1968–70 anthology of supernatural dramas and horror stories adapted by the writer Michael McCabe and broadcast by South Africa's Springbok Radio.`,
"source": `<a href="https://radioechoes.com/?page=series&genre=OTR-Thriller&series=Beyond%20Midnight">Radio Echoes</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `13-Lanceford`,
	"heading": `13: <cite>Lanceford House</cite><!--episode name on Radio Echoes is incorrect-->`,
	"blurb": `A writer seeking solitude moves to a country house and discovers a malign force obsessed with an ugly green vase. Adapted from a story by Dennis Roidt.`,
	},
	{
	"code": `20-Dream`,
	"heading": `20: <cite>The Dream</cite>`,
	"blurb": `A physicist suffers recurring nightmares of being hunted by sinister warriors outside an ancient city. Adapted from a story by Basil Copper.`,
	"notes": `institutionalisation, racism`,
	},
	{
	"code": `41-Return`,
	"heading": `41: <cite>The Happy Return</cite>`,
	"blurb": `A man's fiancée is lost at sea; months later he finds the wreck, its calendar set to that very day. Adapted from a story by William Hope Hodgson.`,
	},
],
},
{
"code": `BC`,
"heading": `<cite>The Black Chapel</cite>`,
"blurb": `A 1937–39 horror series hosted and narrated by the insane organist of a derelict church (played by Ted Osbourne); only two episodes survive.`,
"source": `<a href="https://www.radioechoes.com/?page=series&genre=OTR-Thriller&series=The%20Black%20Chapel">Radio Echoes</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `X-Coffin`,
	"heading": `X: <cite>The Mahogany Coffin</cite>`,
	"blurb": `A gravedigger makes lavish preparations for his own burial… and an unlikely graveyard friend of his takes ghoulish revenge when a rival thwarts his plans.`,
	"notes": `entombment`,
	"banger": true,
	},
],
},
{
"code": `BkM`,
"heading": `<cite>The Black Mass</cite>`,
"blurb": `A 1963–67 anthology of mostly gothic and cosmic horror stories adapted for radio, largely performed by Erik Bauersfeld.`,
"source": `<a href="https://web.archive.org/web/20240812113659/http://www.kpfahistory.info/black_mass_home.html"><abbr>KPFA</abbr> History</a> (via Wayback)<!--the site of John Whiting, technical producer-->`,
"copyrightSafe": true,
"shows": [
	{
	"code": `01-Hallows`,
	"heading": `1: <cite>All Hallows</cite>`,
	"blurb": `A traveller meets a verger in a derelict cathedral that the Christian believes is being invaded by evil. Adapted from a story by Walter de la Mare.`,
	},
	{
	"code": `02-Ash`,
	"heading": `2: <cite>The Ash Tree</cite>`,
	"blurb": `A monstrous ash tree bears a terrible secret—when the “witch” who tends it is hanged, its “curse” falls on her accusers. Adapted from a story by M.&nbsp;R.&nbsp;James.`,
	"notes": `execution, spiders`,
	},
	{
	"code": `04-Nightmare`,
	"heading": `4: <cite>Nightmare</cite>`,
	"blurb": `A paranoid man recounts how the helpful Dr. Fraser cured his illness, only to replace it with something much worse. Adapted from a story by Alan Wykes.`,
	"notes": `institutionalisation, public mockery`,
	},
	{
	"code": `07-Oil`,
	"heading": `7: <cite>Oil of Dog</cite>`,
	"blurb": `A young man helps his father make dog oil and his mother dispose of unwanted babies—and combines his duties to disastrous effect. Adapted from a story by Ambrose Bierce.`,
	"notes": `animal abuse, infanticide, kidnapping, murder-suicide`,
	"banger": true,
	},
	{
	"code": `08-Halpin`,
	"heading": `8: <cite>The Death of Halpin Frayser</cite>`,
	"blurb": `Halpin Frayser wakes from dream and dies with the name Catherine LaRue on his lips. He was murdered. But how? Adapted from a story by Ambrose Bierce.`,
	"notes": `becoming lost, gore, domestic abuse, incest, strangulation, torture`,
	},
	{
	"code": `09-House`,
	"heading": `9: <cite>A Haunted House</cite>`,
	"blurb": `A house is haunted by the memory of the lovers who lived there. Adapted from a story by Virginia Woolf.`,
	},
	{
	"code": `11-Predicament_Heart`,
	"heading": `11: <cite>A Predicament</cite> + <cite>The Tell-Tale Heart</cite>`,
	"blurb": `A murderer hears his victim's still-beating heart. A wealthy woman finds herself in a… predicament. Adapted from stories by Edgar Allen Poe.`,
	"notes": `animal death, gore, obsession`,
	},
	{
	"code": `12-Disillusionment_Feeder`,
	"heading": `12: <cite>Disillusionment</cite> + <cite>The Feeder</cite>`,
	"blurb": `A man lays out his philosophy of disenchantment. A patient's trapped in the void of his mind. Adapted from stories by Thomas Mann and Carl Linder.`,
	"notes": `coma, homophobia, life support, sexual harassment`,
	},
	{
	"code": `14-Imp_MS`,
	"heading": `14: <cite>The Imp of the Perverse</cite> + <cite><abbr>MS.</abbr> Found in a Bottle</cite>`,
	"blurb": `A prisoner explains his philosophy of temptation. A sea-traveller writes a manuscript (<abbr>MS.</abbr>) detailing his strange and deadly final journey. Adapted from stories by Edgar Allen Poe.`,
	"notes": `being stranded at sea, darkness, drowning`,
	},
	{
	"code": `15-Doctor`,
	"heading": `15: <cite>A Country Doctor</cite>`,
	"blurb": `A doctor makes a surreal journey through winter weather for a patient on his deathbed. Adapted from a story by Franz Kafka.`,
	"notes": `abduction, bite injury, description of open wound, insects, rape`,
	},
	{
	"code": `16-Willows`,
	"heading": `16: <cite>The Witch of the Willows</cite>`,
	"blurb": `A traveller seeking wonder and danger finds it in an eerie willow-marsh and its resident witch. Adapted from a story by Lord Dunsany.`,
	},
	{
	"code": `17-Atrophy`,
	"heading": `17: <cite>Atrophy</cite>`,
	"blurb": `A man's bodily strength withers from his toes to his head. Adapted from a story by John Anthony West.`,
	"notes": `food, gunshots (2:04)`,
	},
	{
	"code": `20-Diary`,
	"heading": `20: <cite>Diary of a Madman</cite>`,
	"blurb": `The diary of a civil servant who slips into a world of delusion when his romantic desires are frustrated. Adapted from a story by Nikolai Gogol.`,
	"notes": `institutionalisation, obsession, sanism, social humiliation`,
	},
	{
	"code": `21-Outsider`,
	"heading": `21: <cite>The Outsider</cite>`,
	"blurb": `A lonely man in a deep, dark forest ponders what lies beyond—and one day makes his desperate escape. Adapted from a story by H.&nbsp;P.&nbsp;Lovecraft.`,
	},
	{
	"code": `22-Moonlit`,
	"heading": `22: <cite>The Moonlit Road</cite>`,
	"blurb": `A man's mother is murdered; his father disappears. An outcast dreams of vile acts; a ghost returns to its beloved. Adapted from a story by Ambrose Bierce.`,
	"notes": `mental breakdown, strangulation, suspicion of cheating`,
	},
	{
	"code": `X1-Haunter_pt1`,
	"heading": `X1: <cite>The Haunter of the Dark</cite>, part&nbsp;1`,
	"blurb": `A young writer seeks inspiration from an old cult's derelict church—he finds more than he bargained for. Adapted from a story by H.&nbsp;P.&nbsp;Lovecraft.`,
	},
	{
	"code": `X2-Haunter_pt2`,
	"heading": `X2: <cite>The Haunter of the Dark</cite>, part&nbsp;2`,
	"blurb": `A young writer seeks inspiration from an old cult's derelict church—he finds more than he bargained for. Adapted from a story by H.&nbsp;P.&nbsp;Lovecraft.`,
	},
	{
	"code": `X5-Proof_Crowd`,
	"heading": `X5: <cite>Proof Positive</cite> + <cite>The Man in the Crowd</cite>`,
	"blurb": `An esoteric researcher shows proof positive of life after death. A people-watcher stalks an unreadable man. Adapted from stories by Graham Greene and Edgar Allen Poe.`,
	},
],
},
{
"code": `CAS`,
"heading": `<abbr>CAS</abbr> selection`,
"blurb": `Collected readings of the weird fiction of Clark Ashton Smith.`,
"source": `<a href="http://www.eldritchdark.com/writings/spoken-word/">The Eldritch Dark</a>`,
"shows": [
	{
	"code": `1-Flame_pt1`,
	"heading": `1: <cite>The City of the Singing Flame</cite>, part&nbsp;1`,
	"blurb": `A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.`,
	"notes": `self-destructive urges`,
	},
	{
	"code": `2-Flame_pt2`,
	"heading": `2: <cite>The City of the Singing Flame</cite>, part&nbsp;2`,
	"blurb": `A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.`,
	"notes": `self-destructive urges`,
	},
	{
	"code": `3-Flame_pt3`,
	"heading": `3: <cite>The City of the Singing Flame</cite>, part&nbsp;3`,
	"blurb": `A writer walks between worlds to a city where people sacrifice themselves to a vast, singing flame. Read by Mike Cothran.`,
	"notes": `self-destructive urges`,
	},
	{
	"code": `4-Saturn_pt1`,
	"heading": `4: <cite>The Door to Saturn</cite>, part&nbsp;1`,
	"blurb": `An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.`,
	},
	{
	"code": `5-Saturn_pt2`,
	"heading": `5: <cite>The Door to Saturn</cite>, part&nbsp;2`,
	"blurb": `An inquisitor and his occult quarry must unite to survive on an alien world. Read by Zilbethicus.`,
	"notes": `alcohol`,
	},
	{
	"code": `6-Maze`,
	"heading": `6: <cite>The Maze of Maâl Dweb</cite>`,
	"blurb": `A hunter intrudes in the palace-maze of the sorcerer Maâl Dweb to rescue his beloved from the cruel lord. Read by Mike Cothran.`,
	},
	{
	"code": `7-Eidolon_pt1`,
	"heading": `7: <cite>The Dark Eidolon</cite>, part&nbsp;1`,
	"blurb": `A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.`,
	},
	{
	"code": `8-Eidolon_pt2`,
	"heading": `8: <cite>The Dark Eidolon</cite>, part&nbsp;2`,
	"blurb": `A necromancer takes exquisite revenge upon the ruler who wronged him. Read by Mike Cothran.`,
	"notes": `crush death, descriptions of gore, horse trampling, poisoning, possession`,
	},
	{
	"code": `9-Poems`,
	"heading": `poems`,
	"blurb": `Seven of Smith's poems, read by the author himself: <cite>High Surf</cite>, <cite>Malediction</cite>, <cite>Desert Dweller</cite>, <cite>Seeker</cite>, <cite>Moly</cite>, <cite>Nada</cite>, and <cite>Don Quixote on Market Street</cite>.`,
	},
],
},
{
"code": `CRW`,
"heading": `<cite><abbr>CBS</abbr> Radio Workshop</cite>`,
"blurb": `A brief 1956–57 revival of the <cite>Columbia Workshop</cite> series' experimental radio tradition, by the Columbia Broadcasting System.`,
"source": `<a href="https://archive.org/details/OTRR_CBS_Radio_Workshop_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `66-Nightmare`,
	"heading": `66: <cite>Nightmare</cite>`,
	"blurb": `A tired, sick man has a surreal nightmare that shifts from memory to memory around him.`,
	"notes": `gaslighting, mob violence, parental death, seizure`,
	"banger": true,
	},
],
},
{
"code": `CW`,
"heading": `<cite>Columbia Workshop</cite>`,
"blurb": `A 1936–47 anthology of experimental radio plays organised by Irving Reis to push the boundaries of the medium; succeeded by the <cite><abbr>CBS</abbr> Radio Workshop</cite>.`,
"source": `<a href="https://www.radioechoes.com/?page=series&genre=OTR-Drama&series=Columbia%20Workshop">Radio Echoes</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `A031-Macabre`,
	"heading": `A31: <cite>Danse Macabre</cite>`,
	"blurb": `Death stalks the land figuratively, as plague brings a kingdom to its knees, and literally, as a lonely fiddler seeking someone to dance to his tune.`,
	},
	{
	"code": `A034-Fall`,
	"heading": `A34: <cite>The Fall of the City</cite>`,
	"blurb": `Prophets, hierophants, and generals give grandiose speeches while the master of war descends on their “free” city. Featuring a young Orson Welles.`,
	"notes": `human sacrifice, mass panic`,
	"banger": true,
	},
	{
	"code": `D27-Slouch`,
	"heading": `D27: <cite>The City Wears a Slouch Hat</cite>`,
	"blurb": `An omniscient man slips from surreal scene to scene in a city under cacophonous downpour. Scored by John Cage, for household objects.`,
	"notes": `car crash, kidnapping, mugging`,
	"banger": true,
	},
],
},
{
"code": `DF`,
"heading": `<cite>Dark Fantasy</cite>`,
"blurb": `A 1941–42 anthology of original horror stories and thrillers written by Scott Bishop, who also wrote for <cite>The Mysterious Traveler</cite>.`,
"source": `<a href="https://archive.org/details/OTRR_Dark_Fantasy_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `04-Tree`,
	"heading": `4: <cite>The Demon Tree</cite>`,
	"blurb": `Bored travellers at a holiday resort seek an infamous, murderous tree.`,
	"notes": `fall death, quicksand, strangulation`,
	},
	{
	"code": `18-Turnpike`,
	"heading": `18: <cite>Pennsylvania Turnpike</cite>`,
	"blurb": `An ancient man waits at a turnpike gas station to help a fated traveller find the lost town of Pine Knob.`,
	"notes": `car crash, gunshot (22:41)`,
	},
],
},
{
"code": `DX`,
"heading": `<cite>Dimension X</cite>`,
"blurb": `(X X x x x…) A 1950–51 sci-fi series of adaptations and originals mostly scripted by George Lefferts and Ernest Kinoy; fore-runner to <cite>X Minus One</cite>.`,
"source": `<a href="https://archive.org/details/OTRR_Dimension_X_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `11-Rains_Zero`,
	"heading": `11: <cite>There Will Come Soft Rains</cite> + <cite>Zero Hour</cite>`,
	"blurb": `An automated house goes through the motions after nuclear holocaust. Children play “invasion”, a game with deadly consequences. Adapted from stories by Ray Bradbury.`,
	"notes": `animal death, mentions of corporal punishment, fire, high-pitched sounds`,
	},
	{
	"code": `14-Heaven`,
	"heading": `14: <cite>Mars Is Heaven!</cite>`,
	"blurb": `The first humans on Mars find the alien world is a lot more familiar—a lot more like home—than anyone expected. Adapted from a story by Ray Bradbury.`,
	"notes": `alcohol, betrayal, food adverts, gunshots (8:50–8:53), Holocaust mention, uncanny valley`,
	},
	{
	"code": `15-Moon`,
	"heading": `15: <cite>The Man in the Moon</cite>`,
	"blurb": `The Missing Persons Bureau receives calls for help—beamed straight from the moon.`,
	"notes": `abduction, betrayal, food adverts, gunshots (20:00), sanism`,
	},
	{
	"code": `17-Potters`,
	"heading": `17: <cite>The Potters of Firsk</cite>`,
	"blurb": `A space colonist learns the secret of planet Firsk's exquisite pottery, made with the aid of its ancestors. Adapted from a story by Jack Vance.`,
	"notes": `food adverts, gunshot (12:58), kidnapping, racism`,
	},
	{
	"code": `21-Parade`,
	"heading": `21: <cite>The Parade</cite>`,
	"blurb": `A wealthy client hires an ad firm to announce an alien invasion—ending in a Martian military parade.`,
	"notes": `food adverts, gunshot? (26:54), panic`,
	},
	{
	"code": `25-Sanitorium`,
	"heading": `25: <cite>Dr. Grimshaw's Sanitorium</cite>`,
	"blurb": `A patient vanishes from a sanitorium—the doctors say he's dead, but a detective's not so sure. Adapted from a story by Fletcher Pratt.`,
	"notes": `ableism, alcoholism, betrayal, animal attack, car crash, human experiments, injection, mention of suicide, Naziism, non-consensual surgery, sanism`,
	},
	{
	"code": `26-Bright`,
	"heading": `26: <cite>And the Moon be Still as Bright</cite>`,
	"blurb": `The final human expedition to Mars discovers why the red planet is dead; one man abandons humanity in turn. Adapted from a story by Ray Bradbury.`,
	"notes": `alcohol, genocide, gunshots (17:20, 17:54, 19:46, 20:06, 25:47, 26:50)`,
	"banger": true,
	},
	{
	"code": `28-Professor`,
	"heading": `28: <cite>The Professor Was a Thief</cite>`,
	"blurb": `An eccentric professor causes chaos in New York by stealing landmarks, city blocks, skyscrapers. Adapted from a story by L.&nbsp;Ron Hubbard.`,
	"notes": `alcohol`,
	},
	{
	"code": `31-Universe`,
	"heading": `31: <cite>Universe</cite>`,
	"blurb": `The warring peoples of a universe 25 kilometers wide and 100 levels deep must unite to avert disaster. Adapted from a story by Robert A.&nbsp;Heinlein.`,
	"notes": `ableism, cult behaviour, gunshots (8:41–8:42, 26:01, 26:07–26:10, 27:19, lynching)`,
	},
	{
	"code": `36-Nightmare`,
	"heading": `36: <cite>Nightmare</cite>`,
	"blurb": `All technology, from computers to door handles, conspires against its human masters. Adapted from a poem by Stephen Vincent Benét.`,
	"notes": `industrial deaths, institutionalisation, paranoia, traffic deaths`,
	},
	{
	"code": `48-Kaleidoscope`,
	"heading": `48: <cite>Kaleidoscope</cite>`,
	"blurb": `A spaceship is destroyed, leaving the survivors to drift apart with nothing to do but talk, think, and die. Adapted from a story by Ray Bradbury.`,
	"notes": `isolation, parental negligence, suicide`,
	},
	{
	"code": `50-Nightfall`,
	"heading": `50: <cite>Nightfall</cite>`,
	"blurb": `Astronomers on a world ringed by six suns declare a doomsday prophecy: night will fall and cities will burn. Adapted from a story by Isaac Asimov.`,
	"notes": `alcohol, cult belief, mental breakdown`,
	"banger": true,
	},
],
},
{
"code": `DQ`,
"heading": `<cite>The Dream-Quest</cite>`,
"blurb": `Randolph Carter journeys through the Dreamlands in search of a sublime city. Written by H.&nbsp;P.&nbsp;Lovecraft, published in 1926, read by Maureen S.&nbsp;O'Brien.`,
"source": `<a href="https://archive.org/details/LovecraftKadath">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `01-Search`,
	"heading": `part&nbsp;1`,
	"blurb": `<cite>The search for the sunset city</cite>.`,
	},
	{
	"code": `02-Caravan`,
	"heading": `part&nbsp;2`,
	"blurb": `<cite>Caravan to the sea</cite>.`,
	},
	{
	"code": `03-Face`,
	"heading": `part&nbsp;3`,
	"blurb": `<cite>The face on Ngranek</cite>.`,
	},
	{
	"code": `04-Ghouls`,
	"heading": `part&nbsp;4`,
	"blurb": `<cite>Dholes. Ghouls. Gugs. Ghasts.</cite>`,
	},
	{
	"code": `05-Thran`,
	"heading": `part&nbsp;5`,
	"blurb": `<cite>Traveling to Thran</cite>.`,
	},
	{
	"code": `06-Kuranes`,
	"heading": `part&nbsp;6`,
	"blurb": `<cite>Reunion with Kuranes</cite>.`,
	},
	{
	"code": `07-Inquanok`,
	"heading": `part&nbsp;7`,
	"blurb": `<cite>Inquanok</cite>.`,
	},
	{
	"code": `08-Onyx`,
	"heading": `part&nbsp;8`,
	"blurb": `<cite>Onyx not quarried by men</cite>.`,
	},
	{
	"code": `09-Sarkomand`,
	"heading": `part&nbsp;9`,
	"blurb": `<cite>Raid on Sarkomand</cite>.`,
	},
	{
	"code": `10-Island`,
	"heading": `part&nbsp;10`,
	"blurb": `<cite>Raid on the moonbeast island</cite>.`,
	},
	{
	"code": `11-Army`,
	"heading": `part&nbsp;11`,
	"blurb": `<cite>The Ghoulish army escort</cite>.`,
	},
	{
	"code": `12-Northward`,
	"heading": `part&nbsp;12`,
	"blurb": `<cite>The rush Northward</cite>.`,
	},
	{
	"code": `13-Directions`,
	"heading": `part&nbsp;13`,
	"blurb": `<cite>Directions</cite>.`,
	},
	{
	"code": `14-City`,
	"heading": `part&nbsp;14`,
	"blurb": `<cite>To the sunset city</cite>.`,
	},
],
},
{
"code": `Esc`,
"heading": `<cite>Escape</cite>`,
"blurb": `A 1947–54 anthology of escapist radio plays that shared its talent with <cite>Suspense</cite>, and more often delved into horror and science fiction.`,
"source": `<a href="https://archive.org/details/OTRR_Escape_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `006-Thoth`,
	"heading": `6: <cite>The Ring of Thoth</cite>`,
	"blurb": `An Egyptologist has a chance encounter with the subjects of an ancient tragedy. Adapted from a story by Arthur Conan Doyle, starring Jack Webb.`,
	"notes": `plague`,
	},
	{
	"code": `015-Runes`,
	"heading": `15: <cite>Casting the Runes</cite>`,
	"blurb": `A scholar pens a scathing review of a crackpot's work, inciting arcane revenge. Adapted from a story by M.&nbsp;R.&nbsp;James.`,
	"notes": `food poisoning, stalking`,
	"banger": true,
	},
	{
	"code": `052-Armageddon`,
	"heading": `52: <cite>A Dream of Armageddon</cite>`,
	"blurb": `A man dreams of a world rolling inevitably towards annihilation. Adapted from a story by H.&nbsp;G.&nbsp;Wells.`,
	"notes": `being eaten while conscious, explosions (13:56–14:08), gunshots (14:43, 19:48–50, 22:47–50), poison gas, stab death, starvation`,
	"banger": true,
	},
	{
	"code": `053-Primrose`,
	"heading": `53: <cite>Evening Primrose</cite>`,
	"blurb": `A poet rejects society to live unseen in a department store—but he's not the first. Adapted from a story by John Collier, starring William Conrad.`,
	},
	{
	"code": `117-Bath`,
	"heading": `117: <cite>Blood Bath</cite>`,
	"blurb": `Five men find a trillion-dollar deposit of Amazonian uranium, but greed gets the better of them. Starring Vincent Price.`,
	"notes": `betrayal, malaria, eaten by piranhas`,
	},
	{
	"code": `217-Birds`,
	"heading": `217: <cite>The Birds</cite>`,
	"blurb": `Disaster circles an English family as birds run amok. Adapted from a short story by Daphne du Maurier.`,
	"notes": `child endangerment`,
	},
],
},
{
"code": `FOT`,
"heading": `<cite>Fifty-One Tales</cite>`,
"blurb": `Short myths and fables by Lord Dunsany, published in 1915, read by Rosslyn Carlyle.`,
"source": `<a href="https://librivox.org/fifty-one-tales-by-lord-dunsany">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `1-starts_Assignation`,
	"heading": `part&nbsp;1`,
	"blurb": `From <cite>The Assignation</cite> to <cite>The Unpasturable Fields</cite>.`,
	"notes": `fall death, poisoning, suicide`,
	"banger": true,
	},
	{
	"code": `2-starts_Angel`,
	"heading": `part&nbsp;2`,
	"blurb": `From <cite>The Worm and the Angel</cite> to <cite>Spring in Town</cite>.`,
	},
	{
	"code": `3-starts_Enemy`,
	"heading": `part&nbsp;3`,
	"blurb": `From <cite>How the Enemy Came to Thlunrana</cite> to <cite>The Reward</cite>.`,
	},
	{
	"code": `4-starts_Trouble`,
	"heading": `part&nbsp;4`,
	"blurb": `From <cite>The Trouble in Leafy Green Street</cite> to <cite>The Tomb of Pan</cite>.`,
	"notes": `animal sacrifice, lynching`,
	},
],
},
{
"code": `GGP`,
"heading": `<cite>The Great God Pan</cite>`,
"blurb": `A doctor opens a woman's brain to the cosmos, with dire results. Written by Arthur Machen, published in 1894, read by Ethan Rampton.`,
"source": `<a href="https://librivox.org/the-great-god-pan-by-arthur-machen">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `1-Experiment_Memoirs`,
	"heading": `part&nbsp;1`,
	"blurb": `Chapters 1 and 2: <cite>The Experiment</cite> + <cite>Mr. Clarke's Memoirs</cite>.`,
	"notes": `ableism, brain surgery, child death?, child endangerment`,
	},
	{
	"code": `2-City_Street`,
	"heading": `part&nbsp;2`,
	"blurb": `Chapters 3 and 4: <cite>The City of Resurrections</cite> + <cite>The Discovery in Paul Street</cite>.`,
	},
	{
	"code": `3-Letter_Suicides`,
	"heading": `part&nbsp;3`,
	"blurb": `Chapters 5 and 6: <cite>The Letter of Advice</cite> + <cite>The Suicides</cite>.`,
	},
	{
	"code": `4-Soho_Fragments`,
	"heading": `part&nbsp;4`,
	"blurb": `Chapters 7 and 8: <cite>The Encounter in Soho</cite> + <cite>The Fragments</cite>.`,
	"notes": `body horror`,
	},
],
},
{
"code": `HF`,
"heading": `<cite>The Hall of Fantasy</cite>`,
"blurb": `A series of supernatural stories broadcast in Utah in 1949 and nationally in 1952–53. The series was written and directed by Richard Thorne.`,
"source": `<a href="https://archive.org/details/470213ThePerfectScript">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `A21-Judge`,
	"heading": `A21: <cite>The Judge's House</cite>`,
	"blurb": `An exam student rents a malignant old house and comes face to face with the hanging judge who once lived there. Adapted from a story by Bram Stoker.`,
	"notes": `animal swarm`,
	"banger": true,
	},
	{
	"code": `B3-Shadow`,
	"heading": `B3: <cite>The Shadow People</cite>`,
	"blurb": `A young woman is targeted by murderous living shadows that extinguish her family one by one.`,
	"banger": true,
	},
	{
	"code": `C10-Masks`,
	"heading": `C10: <cite>The Masks of Ashor</cite>`,
	"blurb": `A couple receive a curio from their world-travelling uncle—two golden masks belonging to an ancient devil of death.`,
	"notes": `animal attack`,
	},
	{
	"code": `C12-Fog`,
	"heading": `C12: <cite>The Night the Fog Came</cite>`,
	"blurb": `Scientists discover microbes that spread by fog and drown anyone they touch—and the fog is spreading in a wave of death.`,
	},
	{
	"code": `C27-Black`,
	"heading": `C27: <cite>The Man in Black</cite>`,
	"blurb": `Two friends catch the eye of the nocturnal evil, the “man in black”.`,
	"banger": true,
	},
	{
	"code": `C43-Follows`,
	"heading": `C43: <cite>He Who Follows Me</cite>`,
	"blurb": `A couple disturb a sleeping evil in the grounds of an abandoned mansion—the “Death That Walks”.`,
	"notes": `stalking`,
	},
],
},
{
"code": `KY`,
"heading": `<cite>The King in Yellow</cite>`,
"blurb": `Horror stories revolving around a bizarre play and lost Carcosa. Written by Robert W.&nbsp;Chambers, published in 1895, read by Eva Staes.`,
"source": `<a href="https://librivox.org/king-in-yellow-version-2-by-robert-w-chambers">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `0-Poems`,
	"heading": `poems`,
	"blurb": `Two poems from the collection: the dedication (a fragment of the play) and <cite>The Prophet's Paradise</cite>.`,
	},
	{
	"code": `1-Repairer_pt1`,
	"heading": `1: <cite>The Repairer of Reputations</cite>, part&nbsp;1`,
	"blurb": `A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.`,
	"notes": `hallucination?, institutionalisation, mention of suicide`,
	},
	{
	"code": `2-Repairer_pt2`,
	"heading": `1: <cite>The Repairer of Reputations</cite>, part&nbsp;2`,
	"blurb": `A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.`,
	"notes": `ableism, hallucination, suicide`,
	},
	{
	"code": `3-Repairer_pt3`,
	"heading": `1: <cite>The Repairer of Reputations</cite>, part&nbsp;3`,
	"blurb": `A man losing touch with reality plots to overthrow the aristocratic-fascist government and declare himself supreme leader.`,
	"notes": `animal attack, hallucination?, institutionalisation`,
	},
	{
	"code": `4-Mask`,
	"heading": `2: <cite>The Mask</cite>`,
	"blurb": `Bohemians experiment with drugs, art, and a concoction that turns anything into solid marble.`,
	"notes": `suicide`,
	},
	{
	"code": `5-Court`,
	"heading": `3: <cite>The Court of the Dragon</cite>`,
	"blurb": `After reading the banned play <cite>The King in Yellow</cite>, a man is haunted by a sinister organist and visions of the living god.`,
	"banger": true,
	},
	{
	"code": `6-Sign`,
	"heading": `4: <cite>The Yellow Sign</cite>`,
	"blurb": `A painter and his model encounter an abomination after reading the banned play <cite>The King in Yellow</cite>.`,
	},
],
},
{
"code": `LV`,
"heading": `LibriVox selection`,
"blurb": `LibriVox is a catalogue of public domain audiobook readings, including many weird fiction and horror classics from decades and centuries ago.`,
"source": `<a href="https://librivox.org">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `01-Nameless`,
	"heading": `1: <cite>The Nameless City</cite>`,
	"blurb": `An archaeologist journeys to, and within, an ancient, nameless city not built to human proportions. Written by H.&nbsp;P.&nbsp;Lovecraft, read by Dean Delp.`,
	"notes": `claustrophobia, darkness`,
	},
	{
	"code": `02-Occurrence`,
	"heading": `2: <cite>An Occurrence at Owl Creek Bridge</cite>`,
	"blurb": `A Confederate slave owner and attempted saboteur has a miraculous, harrowing escape from execution. Written by Ambrose Bierce, read by Elise Sauer.`,
	"notes": `entrapment, facial wounds, hallucination?, hanging, near-drowning`,
	"banger": true,
	},
	{
	"code": `03-Ship`,
	"heading": `3: <cite>The White Ship</cite>`,
	"blurb": `A lighthouse keeper fantasises of visiting wondrous islands on a white ship—but his daydream may be more real than he thinks. Written by H.&nbsp;P.&nbsp;Lovecraft, read by D.&nbsp;E.&nbsp;Wittkower.`,
	"notes": `animal death, disease, near-drowning, shipwreck`,
	"banger": true,
	},
	{
	"code": `04-Heights`,
	"heading": `4: <cite>The Horror of the Heights</cite>`,
	"blurb": `An aviator investigates the unsolved deaths of pilots who broke the altitude record—and discovers an ecosystem in the sky. Written by Arthur Conan Doyle, read by Mike Harris.`,
	"notes": `being hunted, decapitation, isolation, jellyfish`,
	},
	{
	"code": `05-Moon_Dagon_Nyarlathotep`,
	"heading": `5: Gods and Monsters (short works by Lovecraft)`,
	"blurb": `Three short pieces by H.&nbsp;P.&nbsp;Lovecraft: <cite>What the Moon Brings</cite> (read by Dan Gurzynski), <cite>Dagon</cite> (read by Selim Jamil), and <cite>Nyarlathotep</cite> (read by Tom Hackett).<!--"Nyarlathotep" reader's name on LibriVox site (Tom Hackett) is different to the one given in the file (Peter Bianzo(?))-->`,
	"notes": `being stranded at sea, drowning, drugs, isolation, near-drowning, nightmares, racism, suicide planning, worms`,
	},
	{
	"code": `07-Wire`,
	"heading": `7: <cite>The Night Wire</cite>`,
	"blurb": `Graveyard shift telegram operators receive reports from an unknown town beset by mist and monsters. Written by H.&nbsp;F.&nbsp;Arnold, read by Dan Gurzynski.`,
	"banger": true,
	},
	{
	"code": `08-Naught`,
	"heading": `8: <cite><abbr>2 B R 0 2 B</abbr></cite>`,
	"blurb": `In a future of immortality and severe population control, a father must find three people willing to die so his newborn triplets can be permitted to live. Written by Kurt Vonnegut, read by Alex Clarke.`,
	"notes": `gun death, suicide, suicide ideation`,
	},
	{
	"code": `09-Cities`,
	"heading": `9: <cite>The Lord of Cities</cite>`,
	"blurb": `A human traveller, the road and the river, and the earth itself ruminate on life, beauty, and purpose. Written by Lord Dunsany, read by Ed Humpal.`,
	},
	{
	"code": `10-Masque_Amontillado`,
	"heading": `10: Gothic Origins (short works by Poe)`,
	"blurb": `Two short pieces by Edgar Allen Poe: <cite>The Masque of the Red Death</cite> (read by Elise Dee) and <cite>The Cask of Amontillado</cite> (read by Caveat).`,
	"notes": `betrayal, darkness, entombment`,
	},
	{
	"code": `12-Blagdaross_Unhappy_Madness`,
	"heading": `12: Things That Talk (short works by Dunsany)`,
	"blurb": `Three short pieces by Lord Dunsany: <cite>Blagdaross</cite> (read by Michele Fry), <cite>The Unhappy Body</cite> (read by Andrew Gaunce), and <cite>The Madness of Andlesprutz</cite> (read by Michele Fry).`,
	"notes": `abandonment, overwork`,
	},
	{
	"code": `13-Paw`,
	"heading": `13: <cite>The Monkey's Paw</cite>`,
	"blurb": `A mummified monkey's paw grants three wishes—with dread consequences. Written by W.&nbsp;W.&nbsp;Jacobs, read by Travis Baldree.`,
	},
	{
	"code": `15-Disappearances`,
	"heading": `15: <cite>Mysterious Disappearances</cite>`,
	"blurb": `Three accounts of unexplained disappearances. Written by Ambrose Bierce, read by Piotr Nater.`,
	},
	{
	"code": `17-What`,
	"heading": `17: <cite>What Was It?</cite>`,
	"blurb": `Lodgers at a supposedly-haunted house discover an invisible supernumerary resident. Written by Fitz-James O'Brien, read by Rafe Ball.`,
	"notes": `being trapped, starvation, strangulation`,
	},
	{
	"code": `18-Dreams_Nightmares`,
	"heading": `18: Dreams and Nightmares (poems)`,
	"blurb": `Collected poems on dreams and nightmares. Written by Seigfried Sassoon, Samuel Taylor Coleridge, Helen Hunt Jackson, Clark Ashton Smith, William Danby, and John James Piatt; read by Nemo, Algy Pug, Newgatenovelist, and Colleen McMahon.`,
	},
	{
	"code": `19-Carcassonne`,
	"heading": `19: <cite>Carcassonne</cite>`,
	"blurb": `A young king and his warriors attempt to conquer the unconquerable. Written by Lord Dunsany, read by Daniel Davison.`,
	"banger": true,
	},
	{
	"code": `20-Facts`,
	"heading": `20: <cite>The Facts in the Case of M. Valdemar</cite>`,
	"blurb": `A mesmerist preserves a man beyond death. Written by Edgar Allen Poe, read by Tony Scheinman.`,
	"notes": `extensive descriptions of gore, suicide`,
	},
	{
	"code": `21-Pharoahs_pt1`,
	"heading": `21: <cite>Imprisoned with the Pharoahs</cite>, part&nbsp;1`,
	"blurb": `A “true” story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&nbsp;P.&nbsp;Lovecraft with Houdini, read by Ben Tucker.`,
	"notes": `betrayal, darkness, kidnapping, racism`,
	},
	{
	"code": `22-Pharoahs_pt2`,
	"heading": `22: <cite>Imprisoned with the Pharoahs</cite>, part&nbsp;2`,
	"blurb": `A “true” story of escape artist Harry Houdini's dark encounter under the Sphinx of Giza. Written by H.&nbsp;P.&nbsp;Lovecraft with Houdini, read by Ben Tucker.`,
	"notes": `betrayal, darkness, kidnapping, racism`,
	},
	{
	"code": `23-Hunger`,
	"heading": `23: <cite>A Hunger Artist</cite>`,
	"blurb": `The life of a performer who starves themself for the crowd. Written by Franz Kafka, read by Cori Samuel.`,
	},
	{
	"code": `25-Stroller`,
	"heading": `25: <cite>The Stroller</cite>`,
	"blurb": `A bickering couple have a near-deadly doppelganger encounter. Written by Margaret St. Clair, read by quartertone.`,
	"notes": `betrayal`,
	},
	{
	"code": `27-Idle_Dreams`,
	"heading": `27: Tales of Cities`,
	"blurb": `<cite>The Idle City</cite> (written by Lord Dunsany, read by Daniel Davison) and <cite>The City of My Dreams</cite> (written by Theodore Dreiser, read by Phil Schempf).`,
	},
	{
	"code": `30-Sarnath`,
	"heading": `30: <cite>The Doom That Came to Sarnath</cite>`,
	"blurb": `A young city rises by exterminating its neighbours, until doom descends upon it in turn. Written by H.&nbsp;P.&nbsp;Lovecraft, read by Glen Hallstrom.`,
	},
	{
	"code": `31-Valley`,
	"heading": `31: <cite>The Valley of Spiders</cite>`,
	"blurb": `A lord and his servants pursue a girl into a most deadly valley. Written by H.&nbsp;G.&nbsp;Wells, read by Robert Dixon.`,
	"notes": `being trapped, betrayal, foot injury`,
	},
	{
	"code": `32-Chaos`,
	"heading": `32: <cite>The Crawling Chaos</cite>`,
	"blurb": `A man in an opium abyss has a beautiful vision of apocalypse. Written by H.&nbsp;P.&nbsp;Lovecraft, read by D.&nbsp;E.&nbsp;Wittkower.`,
	},
	{
	"code": `33-Caterpillars`,
	"heading": `33: <cite>Caterpillars</cite>`,
	"blurb": `Monstrous caterpillars haunt the visitor to an isolated villa—in dream, then reality. Written by E.&nbsp;F.&nbsp;Benson, read by Andy Minter.`,
	"notes": `cancer`,
	},
	{
	"code": `34-Fog`,
	"heading": `34: <cite>Fog</cite>`,
	"blurb": `A sickly boy and ethereal girl long for each other over the gulf of fog, sea, and time. Written by Dana Burnet, read by Colleen McMahon.`,
	},
	{
	"code": `35-Ancient`,
	"heading": `35: <cite>Ancient Lights</cite>`,
	"blurb": `A surveyor hired to help clear a fey wood gets lost in illusion after walking between the trees. Written by Algernon Blackwood, read by Samanem.`,
	},
	{
	"code": `36-Kingdom`,
	"heading": `36: <cite>The Kingdom of the Worm</cite>`,
	"blurb": `A travelling knight offends the king of worms and is imprisoned in its kingdom. Written by Clark Ashton Smith, read by Ben Tucker.`,
	"notes": `claustrophobia, darkness`,
	},
	{
	"code": `38-Primal`,
	"heading": `38: <cite>The Primal City</cite>`,
	"blurb": `An expedition to an ancient mountain city finds its denizens gone, but its sentinels on alert. Written by Clark Ashton Smith, read by Ben Tucker.`,
	},
	{
	"code": `39-Gift_Archive_Postman`,
	"heading": `39: Forgotten Gods (short works by Dunsany)`,
	"blurb": `Three short pieces by Lord Dunsany, read by Sandra Cullum: <cite>The Gift of the Gods</cite>, <cite>An Archive of the Older Mysteries</cite>, and <cite>How the Office of Postman Fell Vacant in Otford-under-the-Wold</cite>.`,
	},
	{
	"code": `40-Spook_Greeting_Carcosa`,
	"heading": `40: Haunts and Hollows (short works by Bierce)`,
	"blurb": `Three short pieces by Ambrose Bierce: <cite>The Spook House</cite> (read by Paul Sigel), <cite>A Cold Greeting</cite> (read by Steve Karafit), and <cite>An Inhabitant of Carcosa</cite> (read by G.&nbsp;C.&nbsp;Fournier).`,
	"notes": `entombment`,
	},
	{
	"code": `41-Zann`,
	"heading": `41: <cite>The Music of Erich Zann</cite>`,
	"blurb": `A musician plays nightly eldritch harmonies for the void beyond his window. Written by H.&nbsp;P.&nbsp;Lovecraft, read by Cameron Halket.`,
	"notes": `ableism`,
	},
	{
	"code": `42-Polaris_Outer`,
	"heading": `42: Ancient Man (short works by Lovecraft)`,
	"blurb": `Two short pieces by H.&nbsp;P.&nbsp;Lovecraft: <cite>Polaris</cite> (read by jpontoli) and <cite>The Outer Gods</cite> (read by Peter Yearsley).`,
	"notes": `racism`,
	"banger": true,
	},
	{
	"code": `43-Powder`,
	"heading": `43: <cite>Novel of the White Powder</cite>`,
	"blurb": `An excerpt from the occult horror novel <cite>The Three Impostors; or, The Transmutations</cite>: a mourner relates how a medicine transfigured her brother. Written by Arthur Machen, read by Tony Oliva.`,
	"notes": `body horror`,
	},
	{
	"code": `44-Babbulkund`,
	"heading": `44: <cite>The Fall of Babbulkund</cite>`,
	"blurb": `Babbulkund, City of Marvel, city of wonders, city on travellers' lips—Babbulkund has fallen, decayed, died. Written by Lord Dunsany, read by Alex Clarke.`,
	"banger": true,
	},
	{
	"code": `45-Law_Gallery_Message`,
	"heading": `45: Power and Spectacle (short works by Kafka)`,
	"blurb": `Three short pieces by Franz Kafka: <cite>Before the Law</cite> (read by Availle), <cite>Up in the Gallery</cite> (read by Adam Whybray), and <cite>An Imperial Message</cite> (read by SBE Iyyerwal).`,
	},
	{
	"code": `46-Welleran`,
	"heading": `46: <cite>The Sword of Welleran</cite>`,
	"blurb": `The city of Merimna mourns its heroes, heedless of the foes approaching now its guardians are dead. Written by Lord Dunsany, read by Ed Humpal.`,
	"banger": true,
	},
	{
	"code": `47-Whirlpool_Hurricane_Dry`,
	"heading": `47: Great and Small (short works by Dunsany)`,
	"blurb": `Three short pieces by Lord Dunsany: <cite>The Whirlpool</cite> (read by James Koss), <cite>The Hurricane</cite> (read by Rosslyn Carlyle), and <cite>On the Dry Land</cite> (read by Rosslyn Carlyle).`,
	},
	{
	"code": `48-Gaffer`,
	"heading": `48: <cite>Gaffer Death</cite>`,
	"blurb": `The German folktale telling of a doctor whose godfather is Death himself. Compiled by Charles John Tibbitts, read by Craig Campbell.`,
	},
	{
	"code": `49-Yondo`,
	"heading": `49: <cite>The Abominations of Yondo</cite>`,
	"blurb": `A prisoner is released into a wasteland haunted by wild demons and grotesques. Written by Clark Ashton Smith, read by Ben Tucker.`,
	"banger": true,
	},
	{
	"code": `50-Chair_Blood`,
	"heading": `50: Human Brutality`,
	"blurb": `<cite>The Chair</cite> (written by Harry E.&nbsp;Mereness, read by Desearls) and <cite>The City of Blood</cite> (written by Anna Bonus Kingsford, read by Claudia Caldi).`,
	"notes": `domestic abuse, electrocution`,
	},
	{
	"code": `51-Safe`,
	"heading": `51: <cite>The Man Who Wanted To Be Safe</cite>`,
	"blurb": `A man builds a safe and quiet paradise in his own home. Written by Alice Brown, read by Aileen.`,
	},
	{
	"code": `52-Beyond`,
	"heading": `52: <cite>From Beyond</cite>`,
	"blurb": `An unstable scientist builds a machine to let humans see the unfathomable. Written by H.&nbsp;P.&nbsp;Lovecraft, read by Andrew Busto.`,
	"notes": `betrayal`,
	},
	{
	"code": `53-Moonstone`,
	"heading": `53: <cite>The Moonstone Mass</cite>`,
	"blurb": `Dark heavens and brilliant ice drive a polar explorer to madness. Written by Harriet Prescott Spofford, read by Ben Tucker.`,
	"notes": `animal death, isolation`,
	},
	{
	"code": `54-Over`,
	"heading": `54: <cite>Over the Wire</cite>`,
	"blurb": `A trio of telegraph operators guide a gold-laden train through a blizzard, while dangers wait in the storm. Written by Eugene Jones, read by Dan Gurzynski.`,
	},
	{
	"code": `55-Dark`,
	"heading": `55: <cite>In the Dark</cite>`,
	"blurb": `An industrialist sneaks into his chemical plant in the dead of night to make a deadly confession. Written by Dale Clark<!--under the name Ronal Kayser-->, read by sdlavender.`,
	"notes": `adultery, blackmail, disfigurement, suicide`,
	},
],
},
{
"code": `LO`,
"heading": `<cite>Lights Out</cite>`,
"blurb": `A foundational horror series, began by Wyllis Cooper in 1934, headed by Arch Oboler until 1947.`,
"source": `<a href="https://archive.org/details/LightsOutoldTimeRadio">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `A009-Money`,
	"heading": `A9: <cite>Money, Money, Money</cite>`,
	"blurb": `A sailor murders his colleague for a winning lottery ticket and takes an offshore salvage-diving job to escape the law—but he can't escape revenge.`,
	"notes": `narcosis`,
	},
	{
	"code": `A040_A072_C09-Chicken_Dark_Exploded`,
	"heading": `A40, A72, and C9: <cite>Lights Out</cite> fragments`,
	"blurb": `A trio of short pieces: <cite>Chicken Heart</cite>, <cite>The Dark</cite>, and <cite>The Day the Sun Exploded</cite>.`,
	"notes": `body horror, plane crash, racism`,
	"banger": true,
	},
	{
	"code": `A071-Christmas`,
	"heading": `A71: <cite>Christmas Story</cite>`,
	"blurb": `Three soldiers meet in a train on Christmas Eve, 1918, but they feel like they've met before…`,
	},
	{
	"code": `A076-Oxychloride`,
	"heading": `A76: <cite>Oxychloride X</cite>`,
	"blurb": `A put-upon and rejected chemistry student makes a miracle to spite his tormentors.`,
	"notes": `falling death`,
	},
	{
	"code": `B02-Worms`,
	"heading": `B2: <cite>Revolt of the Worms</cite>`,
	"blurb": `A chemist carelessly disposes of a growth formula, with disastrous consequences.`,
	"notes": `crushing death`,
	},
	{
	"code": `B07-Bank`,
	"heading": `B7: <cite>Come to the Bank</cite>`,
	"blurb": `A man walks through a bank wall using mental power—but gets trapped halfway, to his colleague's mounting terror.`,
	"notes": `institutionalisation, mental breakdown`,
	},
	{
	"code": `B23-Paris`,
	"heading": `B23: <cite>Paris Macabre</cite>`,
	"blurb": `Two tourists in Paris pay to attend an increasingly strange masque ball.`,
	"notes": `beheading, traffic death`,
	},
	{
	"code": `B25-Flame`,
	"heading": `B25: <cite>The Flame</cite>`,
	"blurb": `A man with an affinity for flames summons a pyromaniac demon to his fireplace.`,
	"notes": `arson, fire deaths, obsession`,
	},
	{
	"code": `C06-Newsreel`,
	"heading": `C6: <cite>The Ghost on the Newsreel Negative</cite>`,
	"blurb": `Two reporters interview a ghost.`,
	"notes": `darkness`,
	},
],
},
{
"code": `MS`,
"heading": `<cite>The Machine Stops</cite>`,
"blurb": `A mother and son's bond is tested by the Machine that governs life in the future. Written by E.&nbsp;M.&nbsp;Forster, published in 1909, read by Elizabeth Klett.`,
"source": `<a href="https://librivox.org/the-machine-stops-version-3-by-e-m-forster/">LibriVox</a>`,
"shows": [
	{
	"code": `1-Ship`,
	"heading": `part&nbsp;1`,
	"blurb": `<cite>The Air-Ship</cite>.`,
	"banger": true,
	},
	{
	"code": `2-Mending`,
	"heading": `part&nbsp;2`,
	"blurb": `<cite>The Mending Apparatus</cite>.`,
	"notes": `familial breakdown`,
	},
	{
	"code": `3-Homeless`,
	"heading": `part&nbsp;3`,
	"blurb": `<cite>The Homeless</cite>.`,
	},
],
},
{
"code": `McT`,
"heading": `<cite>The Mercury Theatre</cite>`,
"blurb": `A 1938 extension of Orson Welles' Mercury Theatre; adapted classic fiction to the airwaves, with Welles starring in each show.`,
"source": `<a href="https://archive.org/details/OrsonWelles_MercuryTheatre">Internet Archive</a>`,
"shows": [
	{
	"code": `01a-Dracula_pt1`,
	"heading": `1: <cite>Dracula</cite>, part&nbsp;1`,
	"blurb": `A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.`,
	"notes": `confinement`,
	},
	{
	"code": `01b-Dracula_pt2`,
	"heading": `1: <cite>Dracula</cite>, part&nbsp;2`,
	"blurb": `A solicitor, his wife, and her suitors band together with a vampire hunter to slay Count Dracula. Adapted from a story by Bram Stoker.`,
	"notes": `mind control`,
	},
	{
	"code": `17a-Worlds_pt1`,
	"heading": `17: <cite>The War of the Worlds</cite>, part&nbsp;1`,
	"blurb": `An adaptation of H.&nbsp;G.&nbsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.`,
	"notes": `asphyxiation, cannon-fire (30:39, 30:55, 31:15, 31:49), poison-gassing`,
	"banger": true,
	},
	{
	"code": `17b-Worlds_pt2`,
	"heading": `17: <cite>The War of the Worlds</cite>, part&nbsp;2`,
	"blurb": `An adaptation of H.&nbsp;G.&nbsp;Wells' story of Martians invading Earth; some listeners infamously believed it was a description of real current events.`,
	"notes": `asphyxiation, plane crash, poison-gassing`,
	},
],
},
{
"code": `Mw`,
"heading": `<cite>Mindwebs</cite>`,
"blurb": `A 1975–84 series of sci-fi, fantasy, and horror short story readings by Michael Hanson, who also chose the often-jazzy musical accompaniment.`,
"source": `<a href="https://archive.org/details/MindWebs_201410">Internet Archive</a>`,
"shows": [
	{
	"code": `001-Carcinoma`,
	"heading": `1: <cite>Carcinoma Angels</cite>`,
	"blurb": `A genius billionaire with unnatural luck desperately uses a cocktail of hallucinogens to cure his cancer. Written by Norman Spinrad.`,
	"notes": `injection, institutionalisation, racism, sterilisation`,
	"banger": true,
	},
	{
	"code": `003-Descending`,
	"heading": `3: <cite>Descending</cite>`,
	"blurb": `A bullshit artist on a department store spending spree winds up in a never-ending escalator ride… Written by Thomas M.&nbsp;Disch.`,
	"notes": `head injury, mental breakdown, starvation`,
	"banger": true,
	},
	{
	"code": `007-Ball`,
	"heading": `7: <cite>Roller Ball Murder</cite>`,
	"blurb": `The bloodsport of the future grows more deadly by the year, and its most lauded champions are shells of human beings. Written by William Harrison.`,
	"banger": true,
	},
	{
	"code": `012-Swimmer`,
	"heading": `12: <cite>The Swimmer</cite>`,
	"blurb": `A man lounging in a friend's garden pool decides on a whim to swim home through his neighbours' pools. Written by John Cheever.`,
	"notes": `alcohol, dementia?, foot injury, humiliation`,
	"banger": true,
	},
	{
	"code": `025-Garden`,
	"heading": `25: <cite>The Garden of Time</cite>`,
	"blurb": `A nobleman and his wife cut the flowers of time to set back the vast waves of humanity that press down on their villa. Written by J.&nbsp;G.&nbsp;Ballard.`,
	},
	{
	"code": `026-Test_Names`,
	"heading": `26: <cite>Test</cite> + <cite>The Nine Billion Names of God</cite>`,
	"blurb": `A man passes, then fails, a driving test. Technology helps Tibetan monks write the many names of god. Written by Theodore Thomas and Arthur C.&nbsp;Clarke.`,
	"notes": `car crash, institutionalisation`,
	"banger": true,
	},
	{
	"code": `031-Abyss`,
	"heading": `31: <cite>In the Abyss</cite>`,
	"blurb": `Wondrous and deadly secrets await the first human explorer to the ocean floor. Written by H.&nbsp;G.&nbsp;Wells.`,
	"notes": `claustrophobia, darkness, drowning`,
	},
	{
	"code": `032-Elf`,
	"heading": `32: <cite>A Night in Elf Hill</cite>`,
	"blurb": `An ancient alien pleasure dome is hungry to serve anyone it can since its makers abandoned it aeons ago. Written by Norman Spinrad.`,
	"notes": `abandonment, cannibalism?`,
	},
	{
	"code": `033-Top`,
	"heading": `33: <cite>The Top</cite>`,
	"blurb": `An advertiser for a colossal corporation discovers the secret at the summit of its pyramidal headquarters. Written by George Sumner Albee.`,
	"notes": `overwork death`,
	"banger": true,
	},
	{
	"code": `051-Evergreen`,
	"heading": `51: <cite>The Evergreen Library</cite>`,
	"blurb": `A lawyer visiting a dead client's estate loses himself in the old man's library. Written by Bill Pronzini and Jeffrey Wallmann.`,
	"notes": `derealisation`,
	"banger": true,
	},
	{
	"code": `057-End`,
	"heading": `57: <cite>The End</cite>`,
	"blurb": `One man keeps building, at the end of all things. Written by Ursula K.&nbsp;Le Guin.`,
	"banger": true,
	},
	{
	"code": `066-Desertion`,
	"heading": `66: <cite>Desertion</cite>`,
	"blurb": `Human minds are transposed into Jupiter's fauna to explore and colonise the planet—but they all desert the mission. Written by Clifford Simak.`,
	"banger": true,
	},
	{
	"code": `071-Mask`,
	"heading": `71: <cite>Gas Mask</cite>`,
	"blurb": `A massive city descends into total merciless gridlock. Written by James Houston.`,
	"banger": true,
	},
	{
	"code": `075-Walk`,
	"heading": `75: <cite>A Walk in the Dark</cite>`,
	"blurb": `A lost astronaut takes a six mile walk back to base on a dark dead planet. How dangerous could it be? Written by Arthur C.&nbsp;Clarke.`,
	},
	{
	"code": `076-See`,
	"heading": `76: <cite>When We Went To See The End Of The World</cite>`,
	"blurb": `Time-travelling tourists boast about seeing the end of the world—until they realise they didn't all see the <em>same</em> end… Written by Robert Silverberg.`,
	},
	{
	"code": `082-Plot_Express`,
	"heading": `82: <cite>The Plot is the Thing</cite> + <cite>Midnight Express</cite>`,
	"blurb": `Doctors lobotomise a film-obsessed woman, with bizarre results. A young man meets his childhood terror. Written by Robert Block and Alfred Noyes.`,
	"notes": `derealisation, injection, institutionalisation, lobotomy, nightmares, racism`,
	"banger": true,
	},
	{
	"code": `088-Nackles`,
	"heading": `88: <cite>Nackles</cite>`,
	"blurb": `An abusive father invents an evil opposite to Santa Claus to terrify his kids, with severe consequences. Written by Curt Clark.`,
	"banger": true,
	},
	{
	"code": `094-Soldier`,
	"heading": `94: <cite>But As a Soldier, for His Country</cite>`,
	"blurb": `The state refuses to let its best soldier die, no matter how many wars he wins. Written by Stephen Goldin.`,
	"banger": true,
	},
	{
	"code": `095-Winter_Hating`,
	"heading": `95: <cite>Winter Housekeeping</cite> + <cite>The Public Hating</cite>`,
	"blurb": `A woman takes heavy measures against the poison of ageing. Mass telekinesis is used in horrific new executions. Written by Molly Daniel and Steve Allen.`,
	"notes": `asphyxiation, obsession`,
	},
	{
	"code": `099-Ghosts_Diggers`,
	"heading": `99: <cite>Ghosts</cite> + <cite>The Diggers</cite>`,
	"blurb": `Robots struggle with reproduction. A woman seeks the mysterious Diggers for love of mystery itself. Written by Robert F.&nbsp;Young and Don Stern.`,
	"notes": `suicide`,
	},
	{
	"code": `105-Silenzia`,
	"heading": `105: <cite>Silenzia</cite>`,
	"blurb": `A man discovers an air-spray that eats sound; he slowly gives in to the temptation of silence. Written by Alan Nelson.`,
	},
	{
	"code": `106-Listener_Dust`,
	"heading": `106: <cite>Deaf Listener</cite> + <cite>Shall the Dust Praise Thee?</cite>`,
	"blurb": `A telepath employed to detect alien life makes a critical error. The Day of Reckoning suffers a hitch. Written by Rachel Payes and Damon Knight.`,
	},
	{
	"code": `110-Noon_Quandary`,
	"heading": `110: <cite>Appointment at Noon</cite> + <cite>Man in a Quandary</cite>`,
	"blurb": `A suspicious man has a suspicious visitor. Someone writes to an advice column for help with a unique problem. Written by Eric Russell and L.&nbsp;J.&nbsp;Stecher.`,
	"notes": `ableism`,
	},
	{
	"code": `115-Horn`,
	"heading": `115: <cite>The Fog Horn</cite>`,
	"blurb": `An old fog horn's deafening cry calls forth an ancient titan. Written by Ray Bradbury.`,
	},
	{
	"code": `117-Petrified`,
	"heading": `117: <cite>The Petrified World</cite>`,
	"blurb": `A nervous man shifts between surreal dream and real nightmare. Written by Robert Sheckley.`,
	"notes": `near-drowning, nightmares`,
	},
	{
	"code": `118-Island`,
	"heading": `118: <cite>Island of Fear</cite>`,
	"blurb": `An art collector obsesses over the perfect statuary beyond the monolithic wall on a tiny Greek island. Written by William Sambrot.`,
	"notes": `near-drowning`,
	"banger": true,
	},
	{
	"code": `124-Myths`,
	"heading": `124: <cite>After the Myths Went Home</cite>`,
	"blurb": `Humanity calls forth old heroes and gods, only to decide they're more trouble than they're worth. Written by Robert Silverberg.`,
	},
	{
	"code": `125-Rules`,
	"heading": `125: <cite>The Rules of the Road</cite>`,
	"blurb": `An alien ship lands in the desert. None who enter survive—until one man finds within it the awful secrets of the universe. Written by Norman Spinrad.`,
	"notes": `imprisonment, psychological torture`,
	"banger": true,
	},
	{
	"code": `131-Racer`,
	"heading": `131: <cite>The Racer</cite>`,
	"blurb": `One of the greatest drivers of a near-future death race comes to grips with how people really feel about his murderous deeds. Written by Ib Melchior.`,
	"notes": `animal deaths, car crash`,
	},
	{
	"code": `133-None`,
	"heading": `133: <cite>None Before Me</cite>`,
	"blurb": `A collector of the very best of everything obsesses over an exquisitely life-like dollhouse. Written by Sidney Carroll.`,
	"notes": `fatphobia`,
	"banger": true,
	},
	{
	"code": `139-Eternal`,
	"heading": `139: <cite>The Eternal Machines</cite>`,
	"blurb": `The lonely warden of a scrap planet builds a museum of machines he intends to outlast humanity. Written by William Spencer.`,
	},
	{
	"code": `147-Maze`,
	"heading": `147: <cite>The Maze</cite>`,
	"blurb": `A stranded scientist experimenting on mice finds herself slipping into the centre of the maze. Written by Stuart Dybek.`,
	"notes": `animal cannibalism, bestiality, imprisonment, rape, rotting animals, torture`,
	"banger": true,
	},
	{
	"code": `149-Worm`,
	"heading": `149: <cite>The Worm</cite>`,
	"blurb": `An old man refuses to leave his home even as it's crushed by a giant worm. Written by David Keller.`,
	"banger": true,
	},
	{
	"code": `160-Phoenix`,
	"heading": `160: <cite>Letter to a Phoenix</cite>`,
	"blurb": `An immortal writes a letter of advice from over a hundred millennia of solitude and thought. Written by Fredric Brown.`,
	"banger": true,
	},
	{
	"code": `162-Ladder`,
	"heading": `162: <cite>The Vertical Ladder</cite>`,
	"blurb": `A young boy, dared by his peers, climbs the ladder of a towering gasometer. Written by William Sansom.`,
	"notes": `abandonment, ableism, child endangered`,
	"banger": true,
	},
	{
	"code": `165-Restricted`,
	"heading": `165: <cite>Restricted Area</cite>`,
	"blurb": `A spaceship crew scientifically investigate an eerily perfect planet. Written by Robert Sheckley.`,
	},
	{
	"code": `169-Worp`,
	"heading": `169: <cite>The Available Data on the Worp Reaction</cite>`,
	"blurb": `An intellectually disabled boy gathers scrap from the city junkyard and builds a machine that confounds all observers. Written by Lion Miller.`,
	},
	{
	"code": `176-Transformer`,
	"heading": `176: <cite>Transformer</cite>`,
	"blurb": `The quaint railway town of Elm Point is switched off, boxed away, and sold on. Written by Chad Oliver.`,
	},
	{
	"code": `237-Star_Gift`,
	"heading": `237: <cite>The Star</cite> + <cite>The Gift</cite>`,
	"blurb": `An apocalyptic blaze—a guiding star. A boy receives a wondrous Christmas gift. Written by Arthur C.&nbsp;Clarke and Ray Bradbury.`,
	},
],
},
{
"code": `MsT`,
"heading": `<cite>The Mysterious Traveler</cite>`,
"blurb": `A 1943–52 anthology of horror stories hosted and narrated by the titular traveler riding a train racing through the night.`,
"source": `<a href="https://archive.org/details/OTRR_Mysterious_Traveler_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `111-Locomotive`,
	"heading": `111: <cite>The Locomotive Ghost</cite>`,
	"blurb": `Two men derail and rob a payday train, only to suffer the wrath of the Judgement Special—a ghostly train that hunts those who defile the railways.`,
	"notes": `asphyxiation, gunshots (6:44, 7:28), rail crash, paranoia`,
	"banger": true,
	},
	{
	"code": `256-Red`,
	"heading": `256: <cite>The Lady in Red</cite>`,
	"blurb": `A reporter follows a trail of mob murders attended by a mysterious woman in a striking red dress.`,
	"notes": `alcohol, fall death, gunshots (4:38–40, 4:50–53, 24:06)`,
	},
],
},
{
"code": `Nf`,
"heading": `<cite>Nightfall</cite>`,
"blurb": `A 1980–83 Canadian series of original and adapted horror stories created by Bill Howell.`,
"source": `<a href="https://archive.org/details/CBC_NightfallOTR">Internet Archive</a>`,
"shows": [
	{
	"code": `003-Homerville`,
	"heading": `3: <cite>Welcome to Homerville</cite>`,
	"blurb": `A trucker follows a sinister radio siren's call.`,
	"notes": `truck crash`,
	},
	{
	"code": `014-Ship`,
	"heading": `14: <cite>The Stone Ship</cite>`,
	"blurb": `A ship finds a massive vessel of stone out on the open sea, full of treasures and monsters. Adapted from a story by William Hope Hodgson.`,
	"notes": `drowning, gunshots (19:24–29)`,
	},
	{
	"code": `018-Ringing`,
	"heading": `18: <cite>Ringing the Changes</cite>`,
	"blurb": `Honeymooners in tiny coastal town find the ocean missing, the people unwelcoming, and the bells all ringing louder every hour.`,
	"notes": `break-in, forced stripping, mob attack, sexual assault (themes?)`,
	"banger": true,
	},
	{
	"code": `034-Hell`,
	"heading": `34: <cite>The Book of Hell</cite>`,
	"blurb": `Three publishers read the “Book of Hell”, an account of infernal torment written by a man who's been dead for years.`,
	"notes": `explosion (24:56), injections, involuntary medical experiments`,
	"banger": true,
	},
	{
	"code": `042-Father`,
	"heading": `42: <cite>In the Name of the Father</cite>`,
	"blurb": `A grieving writer recovers in an old fishing town with a deep link to the sharks that swim its waters.`,
	"notes": `implied bestiality, parental death, pregnancy`,
	},
	{
	"code": `062-Sea`,
	"heading": `62: <cite>The Road Ends at the Sea</cite><!--title listed in the Internet Archive collection appears to be incorrect-->`,
	"blurb": `A couple of lighthouse keepers' solitude is broken by the arrival of an old “friend”—and romantic rival—and a massive black freighter just offshore.`,
	},
	{
	"code": `075-Lazarus`,
	"heading": `75: <cite>Lazarus Rising</cite>`,
	"blurb": `A reporter investigates a small-town resurrection and slowly uncovers the festering truth.`,
	"notes": `arson, phone eavesdropping`,
	},
],
},
{
"code": `PC`,
"heading": `The Pegāna Cycle`,
"blurb": `Lord Dunsany's myth cycle of weird gods: <cite>The Gods of Pegāna</cite> (1905), <cite>Time and the Gods</cite> (1906), and the dream-stories in <cite>Tales of Three Hemispheres</cite> (1919).`,
"source": `<a href="https://librivox.org">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `01-GoP_1`,
	"heading": `book 1: <cite>The Gods of Pegāna</cite>, part&nbsp;1`,
	"blurb": `From the preface to <cite>Revolt of the Home Gods</cite>. Read by Jason Mills.`,
	},
	{
	"code": `02-GoP_2`,
	"heading": `book 1: <cite>The Gods of Pegāna</cite>, part&nbsp;2`,
	"blurb": `From <cite>Of Dorozhand</cite> to <cite>Of How the Gods Whelmed Sidith</cite>. Read by Jason Mills.`,
	},
	{
	"code": `03-GoP_3`,
	"heading": `book 1: <cite>The Gods of Pegāna</cite>, part&nbsp;3`,
	"blurb": `From <cite>Of How Imbaun Became High Prophet in Aradec of All the Gods Save One</cite> to <cite>The Bird of Doom and the End</cite>. Read by Jason Mills.`,
	},
	{
	"code": `04-TG_1`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;1`,
	"blurb": `From the preface to <cite>A Legend of the Dawn</cite>. Read by KentF.`,
	},
	{
	"code": `05-TG_2`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;2`,
	"blurb": `From <cite>The Vengeance of Men</cite> to <cite>The Caves of Kai</cite>. Read by KentF, RedToby, and hefyd.`,
	},
	{
	"code": `06-TG_3`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;3`,
	"blurb": `From <cite>The Sorrow of Search</cite> to <cite>For the Honour of the Gods</cite>. Read by Le Scal and hefyd.`,
	},
	{
	"code": `07-TG_4`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;4`,
	"blurb": `From <cite>Night and Morning</cite> to <cite>The South Wind</cite>. Read by Måns Broo.`,
	},
	{
	"code": `08-TG_5`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;5`,
	"blurb": `From <cite>In the Land of Time</cite> to <cite>The Dreams of the Prophet</cite>. Read by RedToby and hefyd.`,
	},
	{
	"code": `09-TG_6`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;6`,
	"blurb": `<cite>The Journey of the King</cite>, parts &#x2160;–&#x2166;. Read by Kevin McAsh, Måns Broo, and Robin Cotter.`,
	"notes": `alcohol`,
	},
	{
	"code": `10-TG_7`,
	"heading": `book 2: <cite>Time and the Gods</cite>, part&nbsp;7`,
	"blurb": `<cite>The Journey of the King</cite>, parts &#x2167;–&#x216a;. Readings by Robin Cotter and Elmensdorp.`,
	"notes": `alcohol`,
	},
	{
	"code": `11-Yann`,
	"heading": `dreams: <cite>Idle Days on the Yann</cite>`,
	"blurb": `A dreamer travels the river Yann aboard the ship <i>Bird of the River</i>, stopping in bizarre cities of wonders and monsters along the way. Read by Alex Clarke.`,
	"notes": `alcohol`,
	"banger": true,
	},
	{
	"code": `12-Shop`,
	"heading": `dreams: <cite>A Shop in Go-By Street</cite>`,
	"blurb": `The dreamer returns to the Yann via a strange shop of myths and rareties, seeking his friends on the <i>Bird of the River</i>. Read by Ed Humpal.`,
	"notes": `alcohol`,
	},
	{
	"code": `13-Avenger`,
	"heading": `dreams: <cite>The Avenger of Perdóndaris</cite>`,
	"blurb": `The dreamer returns once more and visits the palace of Singanee, avenger of ruined Perdóndaris, and grows weary of dreams. Read by Ed Humpal.`,
	},
],
},
{
"code": `QP`,
"heading": `<cite>Quiet, Please</cite>`,
"blurb": `A 1947–49 radio horror anthology written by Wyllis Cooper, starring radio announcer Ernest Chappell in roles speaking directly to the audience.`,
"source": `<a href="https://www.quietplease.org">quietplease.org</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `001-Nothing`,
	"heading": `1: <cite>Nothing Behind the Door</cite>`,
	"blurb": `Bank robbers try to hide the money in a mountain shed that contains—literally—nothing.`,
	"banger": true,
	},
	{
	"code": `006-Tomorrow`,
	"heading": `6: <cite>I Remember Tomorrow</cite>`,
	"blurb": `A time-traveller explains why three criminals must be stopped—and why <em>you</em> will stop them.`,
	"notes": `alcohol, betrayal, gunshots (26:16)`,
	},
	{
	"code": `007-Inquest`,
	"heading": `7: <cite>Inquest</cite>`,
	"blurb": `A heartless man faces a murder inquest like no other—a jury in costume, an audience of millions, and the mysterious Coroner…`,
	"notes": `ableism, broken arm (poorly healed), domestic abuse, financial abuse`,
	},
	{
	"code": `009-Mile`,
	"heading": `9: <cite>A Mile High and a Mile Deep</cite> (script read)`,
	"blurb": `The Earth takes its due in the mines far below Butte, Montana—the city a mile high and a mile deep. An amateur reading of this lost episode's script.`,
	"notes": `claustrophobia, darkness`,
	},
	{
	"code": `019-Obscura`,
	"heading": `19: <cite>Camera Obscura</cite>`,
	"blurb": `A remorseless killer's victim haunts him through the miniature world of the camera obscura.`,
	"notes": `abandonment, drowning`,
	},
	{
	"code": `022-Graveyard`,
	"heading": `22: <cite>Take Me Out to the Graveyard</cite>`,
	"blurb": `A taxi driver tells how all his passengers want to go to the graveyard—and how they die along the way.`,
	"banger": true,
	},
	{
	"code": `024-Kill`,
	"heading": `24: <cite>Kill Me Again</cite>`,
	"blurb": `A decent man finds himself being murdered over and over again after making a deal with the devil.`,
	"notes": `gunshots (2:16)`,
	},
	{
	"code": `027-Die`,
	"heading": `27: <cite>Some People Don't Die</cite>`,
	"blurb": `Archaeologists seek the ruins of an ancient society in a desert mesa, only to find the people aren't entirely dead.`,
	"notes": `desiccation, imprisonment, racism, snake bite`,
	"banger": true,
	},
	{
	"code": `030-Rain`,
	"heading": `30: <cite>Rain on New Year's Eve</cite>`,
	"blurb": `An overworked horror screenwriter makes monsters for his micro-managing, incompetent director.`,
	},
	{
	"code": `034-Light`,
	"heading": `34: <cite>Green Light</cite>`,
	"blurb": `A railwayman tells the tale of how he lost his leg in an impossible train crash.`,
	},
	{
	"code": `037-Whence`,
	"heading": `37: <cite>Whence Came You?</cite>`,
	"blurb": `An archaeologist meets the past in Cairo and entombed below the desert.`,
	"notes": `bite injury, claustrophobia, darkness`,
	"banger": true,
	},
	{
	"code": `038-Coat`,
	"heading": `38: <cite>Wear the Dead Man's Coat</cite>`,
	"blurb": `A homeless beggar kills a man for his coat, then remembers a saying: “Wear the dead man's coat, none will take note”.`,
	"notes": `alcohol, betrayal`,
	"banger": true,
	},
	{
	"code": `040-Send`,
	"heading": `40: <cite>Never Send to Know</cite>`,
	"blurb": `A ghost hires a detective to solve his own murder.`,
	"notes": `blood, gunshot (2:20), implied suicide`,
	},
	{
	"code": `042-Forget`,
	"heading": `42: <cite>A Night to Forget</cite>`,
	"blurb": `A radio actor has nightmares of his impending death that slowly seep into reality.`,
	"notes": `funeral arrangements, gunshots (26:10–26:16), murder`,
	},
	{
	"code": `045-Twelve`,
	"heading": `45: <cite>12 to 5</cite>`,
	"blurb": `A graveyard shift radio <abbr>DJ</abbr> has an unusual visitor—a news-reader who reads the future.`,
	},
	{
	"code": `046-Clarissa`,
	"heading": `46: <cite>Clarissa</cite>`,
	"blurb": `A man seeks lodging at a decrepit house inhabited by an ancient father and his unseen daughter.`,
	},
	{
	"code": `047-Thirteen`,
	"heading": `47: <cite>Thirteen and Eight</cite>`,
	"blurb": `An opportunistic news photographer is plagued by a photobomber only he can see.`,
	"notes": `fall injury, gunshots (7:47), traffic death`,
	},
	{
	"code": `048-Mountain`,
	"heading": `48: <cite>How Beautiful Upon the Mountain</cite>`,
	"blurb": `Two men seek to summit Everest—giant mountain—home of the gods—beautiful, deadly bride.`,
	},
	{
	"code": `050-Ray`,
	"heading": `50: <cite>Gem of Purest Ray</cite>`,
	"blurb": `A murderer explains his motive: his victims were agents of an apocalyptic Atlantean conspiracy.`,
	"notes": `betrayal, conspiracism, paranoia`,
	},
	{
	"code": `055-Lilies`,
	"heading": `55: <cite>Let the Lilies Consider</cite>`,
	"blurb": `A suspected murderer recounts the triangle of love and hate between he, his wife, and his beloved lilies.`,
	"notes": `gunshot (19:01), neglect, suicide`,
	},
	{
	"code": `058-Planet`,
	"heading": `58: <cite>The Man Who Stole a Planet</cite>`,
	"blurb": `Archaeologists find the planet Earth in an ancient Mayan temple.`,
	"notes": `domestic abuse, natural disaster`,
	},
	{
	"code": `060-Fourble`,
	"heading": `60: <cite>The Thing on the Fourble Board</cite>`,
	"blurb": `An oil derrick pulls an invisible creature from the depths of the earth.`,
	"notes": `betrayal, gunshots (18:58–18:59), spiders?`,
	"banger": true,
	},
	{
	"code": `065-Symphony`,
	"heading": `65: <cite>Symphony in D Minor</cite>`,
	"blurb": `A vengeful hypnotist uses Cesar Franck's <cite>Symphony in D Minor</cite>, the series' theme music, to wreak revenge on his adulterous wife and her lover.`,
	"notes": `fall death, stab death`,
	"banger": true,
	},
	{
	"code": `067-Lamp`,
	"heading": `67: <cite>Light the Lamp for Me</cite>`,
	"blurb": `An old man's oil lamp lets him travel to the past as often as he likes—but only once to the future.`,
	"notes": `disease, loneliness`,
	},
	{
	"code": `068-Meet`,
	"heading": `68: <cite>Meet John Smith, John</cite>`,
	"blurb": `A man gives to a beggar who just so happens to share his name—a lot more than his name, in fact.`,
	"notes": `adultery, alcohol, murder`,
	},
	{
	"code": `069-Cellar`,
	"heading": `69: <cite>Beezer's Cellar</cite>`,
	"blurb": `Bank robbers hide the loot in an allegedly haunted cellar, betting the legend will keep prying eyes away.`,
	},
	{
	"code": `072-Souls`,
	"heading": `72: <cite>Calling All Souls</cite>`,
	"blurb": `Halloween: the dead rise to give a death row inmate one last chance to prove his innocence.`,
	"notes": `betrayal`,
	},
	{
	"code": `076-John`,
	"heading": `76: <cite>My Son, John</cite>`,
	"blurb": `A bereaved father begs a wise woman for any way to bring his son back—no matter the danger, the cost.`,
	"notes": `animal attacks, bite injury`,
	"banger": true,
	},
	{
	"code": `081-Snow`,
	"heading": `81: <cite>The Time of the Big Snow</cite>`,
	"blurb": `Two young children lose their way in a blizzard and discover the truth behind the old saying about snow: “The old woman's picking her geese”.`,
	},
	{
	"code": `083-Murder`,
	"heading": `83: <cite>Is This Murder?</cite>`,
	"blurb": `An expert on prosthetic limbs struggles to reason with his assistant, who's obsessed with making an artificial man.`,
	"notes": `alcohol, betrayal, murder?`,
	},
	{
	"code": `084-Summer`,
	"heading": `84: <cite>Summer Goodbye</cite>`,
	"blurb": `Robbers escape from the police—but can't seem to escape the hitch-hiker they see over and over again.`,
	"notes": `brushfire, gunshots (22:20, 23:48, 24:17), unhealthy romantic relationship`,
	},
	{
	"code": `085-Northern`,
	"heading": `85: <cite>Northern Lights</cite>`,
	"blurb": `Inventors of a time machine discover the monstrous song of the aurora borealis.`,
	"notes": `caterpillars, mind control`,
	"banger": true,
	},
	{
	"code": `088-Ideas`,
	"heading": `88: <cite>Where Do You Get Your Ideas?</cite>`,
	"blurb": `Wyllis Cooper, the series' writer, meets a barfly who wonders where he gets his ideas—and insists Cooper listens to his own strange story.`,
	"notes": `gunshot (12:25)`,
	},
	{
	"code": `092-Wines`,
	"heading": `92: <cite>The Smell of High Wines</cite>`,
	"blurb": `A distillery worker recalls the dark moments of his life where the smell of high wines presaged death.`,
	"notes": `blood, stab death, strangulation, suicide?`,
	"banger": true,
	},
	{
	"code": `099-Stars`,
	"heading": `99: <cite>The Other Side of the Stars</cite>`,
	"blurb": `A treasure hunter and his companion investigate an ancient well and find music from beyond the stars.`,
	"notes": `animal deaths, gunshots (13:07), possession?`,
	},
	{
	"code": `100-Morning`,
	"heading": `100: <cite>The Little Morning</cite>`,
	"blurb": `A hitch-hiker returns to his old home that burnt down with his beloved inside to sing the song they promised to duet on every birthday.`,
	"notes": `drowning, suicide`,
	},
	{
	"code": `103-Tanglefoot`,
	"heading": `103: <cite>Tanglefoot</cite>`,
	"blurb": `A man breeds giant flies whose hunger grows in proportion… and out of control.`,
	"notes": `animal death, betrayal`,
	},
	{
	"code": `106-Quiet`,
	"heading": `106: <cite>Quiet, Please</cite>`,
	"blurb": `The last man alive tells a story of love, hate, bigotry, supremacism, and war—all-consuming war.`,
	},
],
},
{
"code": `RCP`,
"heading": `<cite>Radio City Playhouse</cite>`,
"blurb": `A 1948–50 anthology of original radio dramas and adaptations, including a few with a touch of the supernatural.`,
"source": `<a href="https://archive.org/details/radio_city_playhouse_202008">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `58-Wind`,
	"heading": `58: <cite>The Wind</cite>`,
	"blurb": `A former pilot is deathly afraid of the wind, which he believes is out to kill him, but his friends can't—or won't—help. Adapted from a story by Ray Bradbury.`,
	"notes": `sanism`,
	"banger": true,
	},
],
},
{
"code": `SET`,
"heading": `<cite>Seeing Ear Theater</cite>`,
"blurb": `A turn-of-the-millennium online sci-fi and horror radio play revival that produced both originals and adaptations.<!--episode numbers are taken from the internet archive (from actual file names, not the numbers in the audio player's file list), but may be incorrect-->`,
"source": `<a href="https://archive.org/details/SETheater">Internet Archive</a>`,
"shows": [
	{
	"code": `12-Pole_pt1`,
	"heading": `12: <cite>An Elevator and a Pole</cite>, part&nbsp;1`,
	"blurb": `One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.`,
	"notes": `broken neck, mental breakdown, falling elevator`,
	"banger": true,
	},
	{
	"code": `13-Pole_pt2`,
	"heading": `13: <cite>An Elevator and a Pole</cite>, part&nbsp;2`,
	"blurb": `One group gathers round a weird pole in the middle of nowhere; another's stuck in an elevator. They all struggle to understand and control their fates.`,
	"notes": `descriptions of gore, fall death, vomiting, suicide`,
	},
	{
	"code": `18-Titanic`,
	"heading": `18: <cite>Titanic Dreams</cite>`,
	"blurb": `A survivor of the Titanic drifts into the future, where she contemplates her regrets of that disastrous night. Adapted from a story by Robert Olen Butler.`,
	"notes": `suicide?`,
	},
	{
	"code": `29-Facade`,
	"heading": `29: <cite>Facade</cite>`,
	"blurb": `Young hotshot advertisers snort their dead friend's ashes to receive creative inspiration, to bring her back, to help their pitches, to take over their lives.`,
	"notes": `ableism, addiction, car accident, human sacrifice, possession, sexual exploitation`,
	"banger": true,
	},
	{
	"code": `36-Shade`,
	"heading": `36: <cite>In the Shade of the Slowboat Man</cite>`,
	"blurb": `A vampire returns to her mortal love on his nursing-home deathbed to reminisce and say goodbye. Adapted from a story by Dean Wesley Smith.`,
	"notes": `abandonment, infertility`,
	"banger": true,
	},
	{
	"code": `37-Choke`,
	"heading": `37: <cite>Greedy Choke Puppy</cite>`,
	"blurb": `A fiery student of Trinidadian folklore investigates the tale of the soucouyant, a skin-stealing vampire her grandma warns about. Adapted from a story by Nalo Hopkinson.`,
	"notes": `infanticide`,
	},
	{
	"code": `43_44-Emily`,
	"heading": `43 and 44: <cite>Emily 501</cite>`,
	"blurb": `An exo-archaeologist discovers that the ancient language she's found isn't as dead as it seems.`,
	"notes": `body horror, language loss, mental breakdown`,
	"banger": true,
	},
	{
	"code": `53_54-Propagation`,
	"heading": `53 and 54: <cite>Propagation of Light in a Vacuum</cite>`,
	"blurb": `A space traveller struggles to stay sane in the world beyond the speed of light—with the help of his imaginary wife.`,
	"notes": `drug overdose, murder-suicide, stabbing, starvation`,
	},
	{
	"code": `85-Syndrome`,
	"heading": `85: <cite>The Oblivion Syndrome</cite>`,
	"blurb": `A void-cartographer gives up on survival when his ship is damaged, leaving it to the ship's <abbr>AI</abbr> and an interstellar freakshow to restore his will to live.`,
	"notes": `ableism, voice removal`,
	},
	{
	"code": `88-Sun`,
	"heading": `88: <cite>Into The Sun</cite>`,
	"blurb": `A starship doctor finds himself alone as his vessel races into the closest star. Starring Mark Hamill.`,
	"notes": `helplessness, live burial`,
	},
],
},
{
"code": `SNM`,
"heading": `<cite>Sleep No More</cite>`,
"blurb": `A 1956–57 anthology of short horror stories read by actor Nelson Olmsted after tightening budgets started to make full radio dramas infeasible.`,
"source": `<a href="https://archive.org/details/sleep_no_more_radio">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `05-Hill_Hat`,
	"heading": `5: <cite>Over the Hill</cite> + <cite>The Man in the Black Hat</cite>`,
	"blurb": `A delusional man “escapes” his nagging wife. A gambler meets a stranger who gives him unnatural luck. Written by Michael Fessier.`,
	"notes": `guillotine death, implied domestic violence`,
	},
	{
	"code": `15-Beelzy_Book`,
	"heading": `15: <cite>Thus I Refute Beelzy</cite><!--Note: show title in source uses the wrong name ("Bealsley" instead of "Beelzy")--> + <cite>The Bookshop</cite>`,
	"blurb": `A boy's imaginary friend takes offense at his cruel father. A struggling writer finds a shop of impossible books. Written by John Collier and Nelson S.&nbsp;Bond.`,
	"notes": `child abuse, dismemberment, traffic accident`,
	"banger": true,
	},
	{
	"code": `17-Gray_Gift`,
	"heading": `17: <cite>The Woman in Gray</cite> + <cite>A Suspicious Gift</cite>`,
	"blurb": `A man invents a spectre of hatred. A stranger gives a too-perfect gift. Written by Walker G.&nbsp;Everett and Algernon Blackwood.`,
	"notes": `apparent suicide, fall death, traffic accidents`,
	},
],
},
{
"code": `Sus`,
"heading": `<cite>Suspense</cite>`,
"blurb": `A 1940–62 anthology made by a bevy of talent. Most shows featured ordinary people thrust into suspenseful—even supernatural—situations.`,
"source": `<a href="https://archive.org/details/OTRR_Suspense_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `011-Hitch`,
	"heading": `11: <cite>The Hitch-Hiker</cite>`,
	"blurb": `A man sees the same hitch-hiker calling for him again and again… and again… Written by Lucille Fletcher, introduction by and starring Orson Welles.`,
	"notes": `car crash, obsession, traffic death`,
	"banger": true,
	},
	{
	"code": `059-Game`,
	"heading": `59: <cite>The Most Dangerous Game</cite>`,
	"blurb": `A big-game hunter has the tables turned when he washes up on an island owned by a man-hunter. Starring Orson Welles.`,
	"notes": `ableism, animal death, man devoured by dogs, racism, stab death`,
	"banger": true,
	},
	{
	"code": `087-Barastro`,
	"heading": `87: <cite>The Marvellous Barastro</cite>`,
	"blurb": `The world's second-greatest magician announces his plan to take revenge on the first—his mirror image. Starring Orson Welles.`,
	"notes": `alcohol adverts, betrayal, stalking, strangulation`,
	},
	{
	"code": `092-Donovan_pt1`,
	"heading": `92: <cite>Donovan's Brain</cite>, part&nbsp;1`,
	"blurb": `A scientist rescues a wealthy businessman's life by preserving his brain—only to fall under its malign sway. Starring Orson Welles.`,
	"notes": `alcohol adverts, animal bite, animal death, animal experimentation, betrayal, human experimentation, institutionalisation, mind control, paranoia`,
	},
	{
	"code": `093-Donovan_pt2`,
	"heading": `93: <cite>Donovan's Brain</cite>, part&nbsp;2`,
	"blurb": `A scientist rescues a wealthy businessman's life by preserving his brain—only to fall under its malign sway. Starring Orson Welles.`,
	"notes": `alcohol adverts, betrayal, human experimentation, institutionalisation, mind control, injection, non-consensual surgery, strangulation, suicide?`,
	},
	{
	"code": `094-Fugue`,
	"heading": `94: <cite>Fugue in C Minor</cite>`,
	"blurb": `A music-loving widower remarries a woman who shares his passion… his children have other ideas. Written by Lucille Fletcher, starring Vincent Price and Ida Lupino.`,
	"notes": `alcohol adverts, asphyxiation, claustrophobia, heart attack`,
	"banger": true,
	},
	{
	"code": `143-August`,
	"heading": `143: <cite>August Heat</cite>`,
	"blurb": `Two strangers share premonitions of their fates on a brutally hot August day. Starring Ronald Colman.`,
	"notes": `alcohol adverts`,
	},
	{
	"code": `165-Dunwich`,
	"heading": `165: <cite>The Dunwich Horror</cite>`,
	"blurb": `A union of human woman and alien god produces terrible, eldritch offspring. Adapted from a story by H.&nbsp;P.&nbsp;Lovecraft, starring Robert Colman.`,
	"notes": `ableism, alcohol adverts, animal attack, body horror, cattle mutilation`,
	},
	{
	"code": `222-Cypress`,
	"heading": `222: <cite>The House in Cypress Canyon</cite>`,
	"blurb": `A couple takes possession of a renovated house, only to find a dark presence taking possession of <em>them</em>.`,
	"notes": `alcohol adverts, bite injury, blood, murder-suicide`,
	"banger": true,
	},
	{
	"code": `224-Window`,
	"heading": `224: <cite>The Thing in the Window</cite>`,
	"blurb": `An actor claims he sees a dead body in the flat across the road; everyone else thinks he's mad. Written by Lucille Fletcher, starring Joseph Cotton.`,
	"notes": `alcohol adverts, betrayal, gaslighting, harassment, suicide`,
	},
	{
	"code": `259-Alphabet`,
	"heading": `259: <cite>Murder Aboard the Alphabet</cite>`,
	"blurb": `A ship's crew find their captain's obsession with orderliness harmless until they start disappearing—in alphabetical order.`,
	"notes": `alcohol adverts, disappearance at sea, implied execution, imprisonment, sanism`,
	},
	{
	"code": `300-Wallpaper`,
	"heading": `300: <cite>The Yellow Wallpaper</cite>`,
	"blurb": `A woman confined by her husband after a nervous breakdown starts to see things behind the wallpaper. Adapted from a story by Charlotte Perkins Gilman.`,
	"notes": `domestic abuse, mental breakdown`,
	},
	{
	"code": `346-Ghost`,
	"heading": `346: <cite>Ghost Hunt</cite>`,
	"blurb": `A skeptical radio <abbr>DJ</abbr> and a psychic investigator spend a night in a house nicknamed the “Death Trap”.`,
	"notes": `blood, hallucination?, suicide?`,
	"banger": true,
	},
	{
	"code": `379-Salvage`,
	"heading": `379: <cite>Salvage</cite>`,
	"blurb": `A pilot, his ex, and her husband get tangled in a fraught expedition to recover sunken gold from the Caribbean. Starring Van Johnson.`,
	"notes": `betrayal, gunshots (15:23, 20:05, 20:34–20:40), plane crash`,
	},
	{
	"code": `625-Classified`,
	"heading": `625: <cite>Classified Secret</cite>`,
	"blurb": `Spies match money, wits, and steel on an interstate bus, with deadly military secrets in the balance.`,
	"notes": `gunshots (21:36–37, 21:48)`,
	"banger": true,
	},
	{
	"code": `648-Waxwork`,
	"heading": `648: <cite>The Waxwork</cite>`,
	"blurb": `A nervy, desperate freelance journalist resolves to write about spending the night in a museum of wax serial killers. Starring William Conrad.`,
	"notes": `anxiety, claustrophobia, hallucinations?, hypnosis, panic attack, paranoia`,
	"banger": true,
	},
	{
	"code": `673-Key`,
	"heading": `673: <cite>Three Skeleton Key</cite>`,
	"blurb": `Three lighthouse keepers fall under siege from a terrifying swarm of rats. Starring Vincent Price.`,
	"notes": `ableism, animal deaths, bite injury, claustrophobia, isolation, mental breakdown`,
	},
	{
	"code": `674-Night`,
	"heading": `674: <cite>The Long Night</cite>`,
	"blurb": `A night shift air traffic controller must help a lost, scared, untested pilot who's running out of fuel and trapped above the clouds. Starring Frank Lovejoy.`,
	"notes": `implied child death, parental recklessness, smoking`,
	"banger": true,
	},
	{
	"code": `688-Present`,
	"heading": `688: <cite>Present Tense</cite>`,
	"blurb": `A death row inmate escapes execution via clock-stopping delusion. Starring Vincent Price.`,
	"notes": `axe murder, gas chamber, hijacking, home invasion, train derailment`,
	},
	{
	"code": `689-Peralta`,
	"heading": `689: <cite>The Peralta Map</cite>`,
	"blurb": `Treasure hunters contract a local guide to help them find an ancient, legendary, <em>haunted</em> gold mine.`,
	"notes": `abandonment, betrayal, fall injury, gunshots (25:25–25:27, 27:29–27:32)`,
	},
	{
	"code": `799-Deep`,
	"heading": `799: <cite>Deep, Deep is My Love</cite>`,
	"blurb": `A diver seeks solitude from his wife in the embrace of a golden lady under the sea.`,
	"notes": `animal death, asphyxiation, hallucination?, narcosis`,
	},
	{
	"code": `878-Lorelei`,
	"heading": `878: <cite>The Green Lorelei</cite>`,
	"blurb": `A writer becomes obsessed with a woman singing in the apartment upstairs, though the old man living there swears his wife is dead.`,
	"notes": `deceptively gaining entry to another person's home, eviction, institutionalisation, ransacking`,
	},
	{
	"code": `901-Door`,
	"heading": `901: <cite>The Black Door</cite>`,
	"blurb": `An archaeologist and his local guide seek an ancient Central American city and carelessly disturb what lies beyond the black door at its heart.`,
	"notes": `gunshots (16:41, 16:59, 17:43), racism`,
	},
	{
	"code": `916-Heads`,
	"heading": `916: <cite>Heads You Lose</cite>`,
	"blurb": `Detectives take a lucrative case to find a terminally-ill embezzler years after he should've died, and find themselves in over their heads.`,
	"notes": `cigarette ads, gunshots (19:08–19:29), entombment, suicide`,
	},
	{
	"code": `927-Infinity`,
	"heading": `927: <cite>That Real Crazy Infinity</cite>`,
	"blurb": `Two beatniks out of money take on a simple delivery job that ends up involving esoteric electronics and the voices of the past.`,
	"notes": `explosion (20:02–20:09)`,
	},
],
},
{
"code": `TF`,
"heading": `<cite>Theater 5</cite>`,
"blurb": `A 1964–65 anthology of radio dramas made in an attempt to revive the tradition after the rise of television.`,
"source": `<a href="https://archive.org/details/OTRR_Theater_Five_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `106-Strangers`,
	"heading": `106: <cite>Five Strangers</cite>`,
	"blurb": `Five stranded strangers use a cargo plane to beat flight delays when dense fog grounds all other craft, unaware of the fate awaiting them.`,
	"notes": `plane crash`,
	},
	{
	"code": `154-Honey`,
	"heading": `154: <cite>The Land of Milk and Honey</cite>`,
	"blurb": `A sinner ends up in heaven, where he gets all he ever wanted—an exasperating paradise.`,
	"notes": `alcohol, betrayal, gunshots (5:32, 17:08)`,
	"banger": true,
	},
],
},
{
"code": `WC`,
"heading": `<cite>The Weird Circle</cite>`,
"blurb": `A 1943–45 anthology that adapted classic horror and supernatural tales to the airwaves, with low budgets limiting the use of music and sound effects.`,
"source": `<a href="https://archive.org/details/OTRR_Weird_Circle_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `43-Bell`,
	"heading": `43: <cite>The Bell Tower</cite>`,
	"blurb": `An arrogant architect brings doom upon himself in the creation of an “impossible” bell tower. Adapted from a story by Herman Melville.`,
	"notes": `bludgeon death, crush death`,
	"banger": true,
	},
	{
	"code": `63-Mariner`,
	"heading": `63: <cite>The Ancient Mariner</cite>`,
	"blurb": `An old mariner recounts how slaying an albatross brought a fatal curse upon his crew. Adapted from a poem by Samuel Taylor Coleridge.`,
	"notes": `animal death, starvation`,
	},
],
},
{
"code": `Wil`,
"heading": `<cite>The Willows</cite>`,
"blurb": `Two travellers find a place where the world's walls are weak and thin. Written by Algernon Blackwood, published in 1907, read by Phil Chenevart.`,
"source": `<a href="https://librivox.org/the-willows-by-algernon-blackwood-2">LibriVox</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `1-pt1`,
	"heading": `part&nbsp;1`,
	"blurb": `The narrator and his companion arrive at the island and shrug off warnings to leave.`,
	},
	{
	"code": `2-pt2`,
	"heading": `part&nbsp;2`,
	"blurb": `Night falls and premonitions of eerie doom begin.`,
	},
	{
	"code": `3-pt3`,
	"heading": `part&nbsp;3`,
	"blurb": `Disaster as the travellers' supplies go missing and their boat is damaged by unknown forces.`,
	},
	{
	"code": `4-pt4`,
	"heading": `part&nbsp;4`,
	"blurb": `The horror strikes directly and the travellers confront a world beyond their own.`,
	},
],
},
{
"code": `WT`,
"heading": `<cite>The Witch's Tale</cite>`,
"blurb": `The first broadcast horror anthology (from 1931–38), written by Alonzo Deen Cole and hosted by the witch “Old Nancy” and her black cat, Satan.`,
"source": `<a href="https://radioechoes.com/?page=series&genre=OTR-Thriller&series=The%20Witchs%20Tale">Radio Echoes</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `041-Bottle`,
	"heading": `41: <cite>The Wonderful Bottle</cite>`,
	"blurb": `A tramp buys a bottle that grants any wish—but his soul's forfeit unless he sells it for less than he paid. Adapted from a story by Robert Louis Stevenson.`,
	"notes": `leprosy, parental death`,
	},
	{
	"code": `116-Mannequinne`,
	"heading": `116: <cite>Le Mannequinne</cite>`,
	"blurb": `A woman becomes paranoid that her husband's new artistic mannequin wants to replace her.`,
	"notes": `head wound, obsession, stab death`,
	},
],
},
{
"code": `WBP`,
"heading": `<cite>With Book and Pipe</cite>`,
"blurb": `A mostly-lost anthology of radio stories probably broadcast in the 1940s, narrated by “the Man with Book and Pipe”; only one episode survives.`,
"source": `<a href="https://archive.org/details/UniqueOldTimeRadioEpisodes/With+Book+and+Pipe+1943.mp3">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `X-Rats`,
	"heading": `X: <cite>The Graveyard Rats</cite>`,
	"blurb": `A grave robber's work takes him into the burrows of a swarm of unnaturally large and intelligent rats. Adapted from a story by Henry Kuttner.`,
	"notes": `animal bite, asphyxiation, claustrophobia, entombment`,
	"banger": true,
	},
],
},
{
"code": `XMO`,
"heading": `<cite>X Minus One</cite>`,
"blurb": `5, 4, 3, 2… x minus 1. A 1955–58 sci-fi series of adaptions and originals mostly scripted by George Lefferts and Ernest Kinoy; successor to <cite>Dimension X</cite>.`,
"source": `<a href="https://archive.org/details/OTRR_X_Minus_One_Singles">Internet Archive</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `037-Cave`,
	"heading": `37: <cite>The Cave of Night</cite>`,
	"blurb": `The world unites to rescue an astronaut adrift in the void—but he may not want to return. Adapted from a story by James E.&nbsp;Gunn.`,
	"notes": `suicide`,
	"banger": true,
	},
	{
	"code": `039-Skulking`,
	"heading": `39: <cite>Skulking Permit</cite>`,
	"blurb": `A utopian space colony cut off from Earth proves it's a model of Earth culture, including an official criminal. Adapted from a story by Robert Sheckley.`,
	"notes": `gunshots (12:31, 22:07)`,
	"banger": true,
	},
	{
	"code": `042-Dinosaur`,
	"heading": `42: <cite>A Gun for Dinosaur</cite>`,
	"blurb": `A time-travelling hunting guide explains why he's so selective about who he helps hunt dinosaur. Adapted from a story by L.&nbsp;Sprague de Camp.`,
	"notes": `adultery, brawl, gunshots (7:17, 11:02, 13:18–13:20, 15:29, 18:17, 19:36–38, 20:05)`,
	},
	{
	"code": `043-Tunnel`,
	"heading": `43: <cite>Tunnel Under the World</cite>`,
	"blurb": `A man wakes up on the 15th of June over and over—in a silent town utterly dominated by advertising. Adapted from a story by Frederik Pohl.`,
	"notes": `bludgeoning death, paranoia, surveillance`,
	},
	{
	"code": `063-Student`,
	"heading": `63: <cite>Student Body</cite>`,
	"blurb": `An all-consuming, rapidly-evolving species of alien mice poses an existential challenge to humanity. Adapted from a story by F.&nbsp;L.&nbsp;Wallace.`,
	"notes": `gunshots (21:55–57)`,
	},
	{
	"code": `065-Surface`,
	"heading": `65: <cite>Surface Tension</cite>`,
	"blurb": `Scientists invent a microscopic solution so humanity can live out its days before the apocalypse. Adapted from a story by James Blish.`,
	},
	{
	"code": `068-Lifeboat`,
	"heading": `68: <cite>The Lifeboat Mutiny</cite>`,
	"blurb": `Two planetary surveyors buy an <abbr>AI</abbr> lifeboat that once belonged to an alien navy—and doesn't know the war's over. Adapted from a story by Robert Sheckley.`,
	"notes": `confinement, suicide threat`,
	"banger": true,
	},
	{
	"code": `071-Colony`,
	"heading": `71: <cite>Colony</cite>`,
	"blurb": `Everyday objects turn deadly against colonists on an alien planet. Adapted from a story by Philip K.&nbsp;Dick.`,
	"notes": `being digested alive, gunshots (10:28, 15:24–34, 19:16), strangulation`,
	"banger": true,
	},
	{
	"code": `092-Victim`,
	"heading": `92: <cite>The Seventh Victim</cite>`,
	"blurb": `After the last World War, peace is kept via man-hunt bloodsport, but not every contender is up to the task. Adapted from a story by Robert Sheckley.`,
	"notes": `betrayal, gunshots (2:32–52, 4:25–26, 11:46–48, 20:56)`,
	},
	{
	"code": `101-Category`,
	"heading": `101: <cite>The Category Inventor</cite>`,
	"blurb": `A musician replaced by a robot scrambles to invent a unique new job—just like everyone else. Adapted from a story by Arthur Sellings.`,
	},
	{
	"code": `118-Light`,
	"heading": `118: <cite>The Light</cite>`,
	"blurb": `The first astronauts on the moon find old footprints in the dust. Adapted from a story by Poul Anderson.`,
	},
],
},
]
// remove invalid series data
.filter(series => {
	const valid = isObject(series) && validateObject(series, {
		"code": [`string`, true],
		"heading": [`string`, true],
		"blurb": [`string`, true],
		"source": [`string`, true],
		"copyrightSafe": [`boolean`, false],
		"shows": [`array`, true],
	});

	if (!valid) console.warn(`Invalid series filtered out of archive.
Required props:
	code (string)
	heading (string)
	blurb (string)
	source (string)
	shows (array)
Optional props:
	copyrightSafe (boolean)
`, series);

	return valid;
})
// remove invalid show data
.map(series => {
	series.shows = series.shows.filter(show => {
		const valid = isObject(show) && validateObject(show, {
			"code": [`string`, true],
			"heading": [`string`, true],
			"blurb": [`string`, true],
			"notes": [`string`, false],
			"banger": [`boolean`, false],
		});

		if (!valid) console.warn(`Invalid show filtered out of archive series "${series.code}".
Required props:
	code (string)
	heading (string)
	blurb (string)
Optional props:
	notes (string)
	banger (boolean)
`, show);

		return valid;
	});
	return series;
});

// build series element ID for linking
// build show ID for each show (helps during archive-building, because all relevant data is inside each show object instead of split between show object and series metadata)
// add negatives for series.copyrightSafe, show.notes, and show.banger
for (const series of archiveData) {
	series.elementId = `archive-${series.code}`;
	if (typeof series.copyrightSafe === `undefined`) series.copyrightSafe = false;

	for (const show of series.shows) {
		show.ID = `${series.code}-${show.code}`;
		if (typeof show.notes === `undefined`) show.notes = ``;
		if (typeof show.banger === `undefined`) show.banger = false;
	}
}

export {
	archiveData,
};
