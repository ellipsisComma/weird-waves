/*jshint esversion: 11*/

/*
	schedule module:
		* loads the week's schedule onto welcome area
*/

import {
	addShow,
} from "./player.js?type=module,v=2025-05-11";

// schedule file path builder (date is a Date object)
function schedulePath(date) {
	return `./schedules/schedule-${date.toISOString().slice(0, 10)}.json`;
}

// get date of the current week's Monday
function getWeekStartDate() {
	const date = new Date();
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
	return date;
}

// build schedule onto page
function buildSchedule(schedule) {
	if (!isObject(schedule) || !validateObject(schedule, {
		"title": [`string`, true],
		"blurb": [`string`, true],
		"shows": [`array`, true],
	})) {
		console.error(`Schedule file at "${path}" is invalid.
Required props:
	title (string)
	blurb (string)
	shows (array)
`, schedule);
		return;
	}

	schedule.shows = schedule.shows.filter(ID => {
		const valid = typeof ID === `string`;
		if (!valid) console.warn(`Removed show ID "${ID}" from schedule: this ID is not string data.`);
		return valid;
	});

	document.getElementById(`schedule-title`)?.setContent(schedule.title);
	document.getElementById(`schedule-blurb`)?.setContent(schedule.blurb);
	document.getElementById(`add-schedule-button`)?.addEventListener(`click`, () => {
		for (const ID of schedule.shows) addShow(ID);
		document.getElementById(`schedule-container`).remove();
	});
	document.getElementById(`schedule-container`)?.removeAttribute(`hidden`);
}

// fetch and parse weekly schedule
async function loadSchedule() {
	if (!document.getElementById(`schedule-container`)) return;

	const path = schedulePath(getWeekStartDate());
	const file = await fetch(
		path,
		{"cache": `no-cache`}
	);
	if (!file.ok) {
		console.error(`Failed to fetch schedule file at path "${path}". Status: ${file.status}.`);
		return;
	}

	try {
		buildSchedule(await file.json());
	} catch {
		console.error(`Schedule file at path "${path}" is not valid JSON.`);
	}
}

export {
	loadSchedule,
};
