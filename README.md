# Weird Waves

Audio horror broadcasting online!

Weird Waves is a client-side playlist-maker and audio player for a curated collection of horror, weird fiction, and SFF audiobooks and radio plays. It has no dependencies/is built on the web platform.

It's also a sort of baseline web dev whetstone for me.

**Note:** This repository doesn't contain the full audio library used on [Weird Waves](https://weirdwaves.net).

## Adding audio

Add data for series and shows to `./modules/archive-data.js`. All shows taken from a given series should ideally be taken from the same source (website, collection, etc.), and that location should ideally be publicly available. A series on Weird Waves does *not* need to be complete; most of them are curated selections.

The archive as a whole is an array of series objects, each of which contains an array of show objects. For example, the series object for "Quiet, Please", including the show object for the first episode, "Nothing Behind the Door":

```js
{
"code": `QP`,
"heading": `<cite>Quiet, Please</cite>`,
"blurb": `A 1947&ndash;49 radio horror anthology written by Wyllis Cooper. It starred radio announcer Ernest Chappell (his only acting role), who often spoke informally and directly to the audience.`,
"source": `<a href="https://www.quietplease.org">quietplease.org</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `001-Nothing`,
	"heading": `#1: <cite>Nothing Behind the Door</cite>`,
	"blurb": `Bank robbers try to hide the money in a mountain shed that contains&mdash;literally&mdash;nothing.`,
	"banger": true,
	},
],
},
```

### Codes

Each series has a code that must be unique among all series, and each show has a code that must be unique among all shows within the same series. Each show has an ID consisting of the series and show code connected by a hyphen, and the codes are also used to create the show audio filepath. For example:

* Series code: `QP` ("Quiet, Please")
* Show code: `001-Nothing` (episode 1, "Nothing Behind the Door")
* Show ID: `QP-001-Nothing`
* Show filepath: `./audio/shows/QP/001-Nothing.mp3`

The show ID must be a valid HTML `id` and all characters must be valid in filepaths. The series code must not contain a hyphen, but hyphens are allowed in the show code.

### Filepaths

The functions `showPath()` in `./modules/player.js` and `schedulePath()` in `./modules/schedule.js` return paths for show audio files and schedule files respectively.

### Series properties

|Key|Type|Required?|Description|
|-|-|-|-|
|`code`|string|yes|a unique alphanumeric code for the series, e.g. the code for "Quiet, Please" is "QP"|
|`heading`|string|yes|plaintext or phrasing HTML series name|
|`blurb`|string|yes|plaintext or phrasing HTML description|
|`source`|string|yes|plaintext or phrasing HTML naming or linking to the source for the show audio files|
|`copyrightSafe`|boolean|no|`true` if the series has no risk of copyright claims when played on livestream platforms (e.g. illegitimate claims through automated systems)|
|`shows`|array|yes|an array of show objects|

### Show properties

|Key|Type|Required?|Description|
|-|-|-|-|
|`code`|string|yes|a unique text code for the show, e.g. the code for "Quiet, Please" #1, "Nothing Behind the Door", is "001-Nothing"|
|`heading`|string|yes|plaintext or phrasing HTML show name|
|`blurb`|string|yes|plaintext or phrasing HTML show description|
|`notes`|string|no|plaintext or phrasing HTML content notes|
|`banger`|boolean|no|`true` if the show is recommended|

The "+ Show" button in the Booth section adds a randomly-selected show to the queue; the "+ Banger" button does the same, but only picks from shows for which `banger` is set to `true`.

## Adding schedules

Schedules are themed (or just random) groups of shows that vary week by week, with each new schedule appearing in the landing/welcome section on Monday at 00:00 (UTC+0). The shows on the schedule can be added to the end of the queue by clicking the "+ Schedule" button. The schedule section only displays if the schedule file exists, loads, and parses (as JSON), otherwise it remains hidden.

Each schedule file is a JSON file whose name should by default be `schedule-[date].json`, e.g. `schedule-2024-12-30.json`. The `[date]` is the ISO format date string for that week's Monday. The file is fetched in a way that busts the browser's cache, so you don't need to use any further cache-busting in the file's URL. The file should contain an object with three properties:

```json
{
	"title": "Mechanical Monstrosities",
	"blurb": "Tales of robotic nightmares, technological progress, and its hidden&mdash;or not-so-hidden&mdash;costs.",
	"shows": [
		"DX-36-Nightmare",
		"QP-083-Murder",
		"XMO-068-Lifeboat",
		"Mw-071-Mask",
		"LV-07-Wire"
	]
}
```

Unlike the archive file, this is restricted to the JSON format (e.g. no template literals, so doublequotes or singlequotes must be escaped).

### Schedule properties

|Key|Type|Required?|Description|
|-|-|-|-|
|`title`|string|yes|plaintext or phrasing HTML schedule title|
|`blurb`|string|yes|plaintext or phrasing HTML schedule description|
|`shows`|array|yes|an array of show ID strings|

## Adding news

The news feed is an Atom feed of updates that can be previewed on the site or read independently using a feed reader. The file is fetched in a way that busts the browser's cache, so you don't need to use any further cache-busting in the file's URL.

Text from the Atom entries (specifically, in `<title>` or `<content>` elements) is written to the page using `.innerHTML` if it contains any HTML elements, entities, or comments.

## HTML content

Various properties in the archive array and in schedule files are written to the page as HTML, including headings, blurbs, series sources, and show content notes. These can be pure text or include phrasing HTML elements. They can't contain block-level HTML. The elements these properties are inserted into are as follows:

|Property|Element|
|-|-|
|series heading|`<h3>`|
|series blurb|`<p>`|
|series source|`<p>`|
|show heading|`<h4>`|
|show blurb|`<p>`|
|show content notes|`<span>`|
|schedule title|`<h3>`|
|schedule blurb|`<p>`|
|news title|`<h3><a>`|
|news timestamp|`<time>`|
|news content|`<div>`|

## Removed/rejected features

These are features I've considered and decided not to implement, or implemented and removed.

### Download links

Links to download individual shows, present in any or all of: the Archive, the Booth, and the Radio. These could allow users to download shows for later listening. However:

1. The audio used in Weird Waves is optimised for small filesizes rather than quality; better-quality versions can be found at the sources.
2. Show info is tightly laid out and adding a download link in such a small space tends to complicate it or obstruct other content.

A determined user could still download all audio files using a combination of the browser inspector (to find the `<audio>` element), queue export (to get IDs for show audio paths), and `wget` in terminal.

### Sync all instances of a show's content notes

Synchronising a show's content notes in the Archive, Booth, and Radio, so that when you open/close its notes in one place, they change in any other places the show info exists.

Tested, but I couldn't see a clear value.

### Recording audio volume in `localStorage`

Adding volume to settings so a listener can effectively set a personal volume that's re-applied on pageload.

The levels of the show audio files aren't consistent enough (due to their separate origins) for this to be set automatically, and can't easily be evened out due to the degradation of many of the older audio before it was digitised (baseline noise is too high to compress-and-amplify quieter files without using professional noise reduction plugins).

### Increase seek bar resolution

Setting the seek bar's maximum to equal the audio's duration in seconds (rounded up) would increase the resolution to perfect 1-second intervals for every show of any length, and would simplify any script where the seek bar is updated (instead of having to calculate the time as a percentage, all values would just be the audio's current time).

This has limited benefit when seeking with pointer controls, because the seek bar's resolution is partly limited by the screen resolution. For example, the show audio may be 1800 seconds long, but the seek bar may only be 300 pixels wide and therefore can't represent all possible timepoints (in seconds) through pointer interactions alone.

Increasing the resolution also makes seeking with keyboard controls *much* slower. An extra keyboard control could be added, e.g. holding Shift to change from 1-second intervals to 10-second intervals, but no other part of the app deviates from expected keyboard controls and the extra control would have to be clearly explained to all users.

### Livestream widget

A livestreamer-friendly widget version of the site was previously available at `./stream/widget.html`. The widget only included the Booth, Archive, and Settings sections (including the copyright-safe setting, copied from the index's Streaming section). The main reason for having a separate page was due to the open-source broadcast software, OBS, treating all media as infinitely-long streaming media. This prevented it from properly retrieving time-related data about audio files and exposing that data through Media Element API properties like `.duration` and `.currentTime`.

This problem with OBS now seems to be fixed (aside from when viewing a local copy of Weird Waves in OBS), so the stream widget has been removed. The downside is that the main site isn't as focused as the stream widget was, but there are two further upsides:

* no longer any need to include show audio durations in `archive-data.js`
* browser source CSS recommendations can be made consistent with the main page's CSS