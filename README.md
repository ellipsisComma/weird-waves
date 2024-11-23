# Weird Waves

Audio horror broadcasting online!

Weird Waves is a client-side library, playlist-maker, and player for a curated collection of horror, weird fiction, and SFF audiobooks and radio plays. It has no dependencies/is built on the web platform.

**Note:** This repository doesn't contain the full audio library.

## What does this model work best for?

It works best if you have a collection of audio, the collection can be divided into (more-or-less) mutually exclusive sets, and each piece of audio has significant amounts of metadata (not just title, artist, etc., but a description and optionally content notes).

## Adding audio

Add data for new series and shows to `archive.js`. All shows from a given series should ideally be taken from the same location or set of files (e.g. a single Internet Archive collection).

The archive as a whole is an array of series objects. Series properties:

* `code`: a simple, unique alphanumeric code for the series, e.g. the code used for "Quiet, Please" is "QP"
* `heading`: plaintext or HTML series name
* `blurb`: plaintext or HTML description (**note:** any HTML must be *phrasing content only*, no natively block-level elements)
* `source`: plaintext or HTML naming or linking to the source for the show audio
* `copyrightSafe` (optional): boolean `true` if the series has no risk of copyright claims (e.g. illegitimate copyright claims through automated systems), otherwise do not set this property
* `shows`: an array of show objects

Show properties:

* `code`: a simple, unique alphanumeric code for the show composed of a show number, then a hyphen, then a show keyword, e.g. the code used for "Quiet, Please" episode 1, "Nothing Behind the Door", is "001-Nothing"
* `heading`: plaintext or HTML show name
* `blurb`: plaintext or HTML show description (**note:** see above)
* `notes` (optional): plaintext or HTML content notes
* `banger` (optional): boolean `true` if you would recommend this show
* `duration`: integer of the length of the show in seconds, rounded up

### Shows

"Show" is a catch-all for a self-contained piece of audio (e.g. in Weird Waves' case, a single play or audiobook usually 20&ndash;30 minutes long), but you could split longer files apart or join smaller ones together.

### Codes

Series and show codes are used in HTML `id` attributes and in DOM queries, so they should consist only of valid characters for those purposes, and neither code should include a hyphen except for the single hyphen separating a show's number and keyword.

Show numbers don't need to be (only) actual numbers, e.g. "X" is fine for an unknown-numbered show, and "A1" is fine to indicate the first episode ("1") of the first syndication ("A"). Show codes must be unique, but multiple shows could share the same number or keyword (e.g. for different parts of a multi-part story).

### Series and show filepaths

The default filepath for show audio files, relative to the index, is `./audio/shows/[series code]/[show code].mp3`. For example, the filepath from the index page to the show file for "Quiet, Please" episode 1, "Nothing Behind the Door", is `./audio/shows/QP/001-Nothing.mp3`.

By default, all files are assumed to be MP3 and end in the extension `.mp3`.

### Content notes

Content notes should be used for subject matter not covered by `heading` or `blurb` as well as for loud noises (e.g. gunshots, explosions, loud and high-pitched whirs or whines).

### Bangers

Marking a show as with `"banger": true` has two effects: first, it allows the show to be selected at random by pressing the "+ Banger" button in the Booth section, and second, it allows the show to be selected at random as the featured show on the Welcome section.

### Durations

Durations are strictly only necessary for the livestreamer widget, due to the limitations of the browser rendering engine used by popular open broadcasting software (OBS, Streamlabs OBS), which treats all audio as streaming audio and doesn't retrieve duration metadata.
