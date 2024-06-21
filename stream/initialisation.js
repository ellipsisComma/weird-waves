/*jshint esversion: 11*/

/*
	WARNING: This is an outdated version of Weird Waves that exists ONLY to be used as a 
	browser source in the broadcast app OBS (and similar apps). OBS renders these sources 
	using an old, stripped-down version of Chrome, which lacks various features of modern 
	CSS and JavaScript. I don't know which features exactly (outside of a few, like the 
	:has() selector), because OBS makes it hard to access the browser console for browser 
	sources, so when I realised that Weird Waves was broken in OBS I reverted to the last 
	version I knew worked (from the end of October, 2023) and cut it down into this 
	stream-widget version while making minimal changes to the CSS and JavaScript.

	Because it's slightly outdated, it may have minor bugs or usability problems I later 
	fixed in the web version of Weird Waves. However, the app itself works fine.
*/

// initialise user-selected (or default) site display settings
const styles = JSON.parse(window.localStorage.getItem("styles")) ?? {};
styles.theme ??= "dark";
styles.font ??= "serif";
document.body.removeAttribute("class");
for (const [style, option] of Object.entries(styles)) document.body.classList.add(style + "-" + option);
