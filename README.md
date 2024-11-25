# Weird Waves

Audio horror broadcasting online!

Weird Waves is a client-side library, playlist-maker, and player for a curated collection of horror, weird fiction, and SFF audiobooks and radio plays. It has no dependencies/is built on the web platform.

The app is relatively mature and shouldn't receive large updates in future.

**Note:** This repository doesn't contain the full audio library used on [Weird Waves](https://weirdwaves.net).

## What does this model work best for?

It works best if:
* you have a collection of separate pieces of audio
* each piece has a significant amount of metadata that's useful for a listener (e.g. a description, content notes, and so on)
* the collection can be divided into (more-or-less) mutually exclusive sets

## Adding audio

Add data for series and shows to `archive.js`. All shows from a given series should ideally be taken from the same location (e.g. a single Internet Archive collection).

The archive as a whole is an array of series objects, each of which contains an array of show objects:

```js
{
"code": `QP`,
"heading": `<cite>Quiet, Please</cite>`,
"blurb": `A 1947&ndash;49 radio horror anthology written by Wyllis Cooper. It starred radio announcer Ernest Chappell (his only acting role), who often spoke informally and directly to the audience.`,
"source": `<a href="https://www.quietplease.org" rel="external">quietplease.org</a>`,
"copyrightSafe": true,
"shows": [
	{
	"code": `001-Nothing`,
	"heading": `#1: <cite>Nothing Behind the Door</cite>`,
	"blurb": `Bank robbers try to hide the money in a mountain shed that contains&mdash;literally&mdash;nothing.`,
	"duration": 1770,
	"banger": true,
	},
],
},
```

### Series properties

|Key|Type|Required?|Description|
|-|-|-|-|
|`code`|string|yes|a unique alphanumeric code for the series, e.g. the code for "Quiet, Please" is "QP"|
|`heading`|string|yes|plaintext or HTML series name|
|`blurb`|string|yes|plaintext or HTML description (**note:** any HTML in the blurb must be *phrasing content only*, no block-level elements)|
|`source`|string|yes|plaintext or HTML naming or linking to the source for the show audio files|
|`copyrightSafe`|boolean|no|`true` if the series has no risk of copyright claims when played on livestream platforms (e.g. illegitimate claims through automated systems)|
|`shows`|array|yes|an array of show objects|

### Show properties

|Key|Type|Required?|Description|
|-|-|-|-|
|`code`|string|yes|a unique text code for the show, e.g. the code for "Quiet, Please" #1, "Nothing Behind the Door", is "001-Nothing"|
|`heading`|string|yes|plaintext or HTML show name|
|`blurb`|string|yes|plaintext or HTML show description (**note:** see above)|
|`notes`|string|no|plaintext or HTML content notes|
|`banger`|boolean|no|`true` if you would recommend this show to a visitor|
|`duration`|integer|yes|length of the show in seconds, rounded up|

## Livestream widget

A livestreamer-friendly widget version of the site is available at `./stream/widget.html`. The widget only includes the Booth, Archive, and Settings sections (including the copyright-safe setting, copied from the index's Streaming section).

The widget differs from the main version in several key ways:

* It uses an outdated stylesheet and outdated scripts.
* It requires audio durations to be stored in `archive.js` instead of being retrieved from the files themselves.

These changes are necessary due to the outdated browser/rendering engine used by popular free broadcasting software (OBS and Streamlabs OBS). In particular, this engine treats all media as streaming media of infinite length, so audio durations must be provided separately from the files.

## Notes

### Codes

Series and show codes are used in HTML `id` attributes and in DOM queries, so they should consist only of valid characters for those purposes, except that the series code must not include a hyphen.

### Series and show filepaths

The default filepath for show audio files, relative to the index page, is `./audio/shows/[series code]/[show code].mp3`. For example, the filepath from the index page to the show file for "Quiet, Please" #1, "Nothing Behind the Door", is `./audio/shows/QP/001-Nothing.mp3`.

By default, all files are assumed to be MP3 and end in the extension `.mp3`.

Both the path and the filetype can be modified in the `showPath()` function in `main.js`.

### Bangers

Marking a show as with `"banger": true` lets the show be selected at random when pressing the "+ Banger" button in the Booth, and be featured on the welcome section.
