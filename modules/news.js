/*jshint esversion: 11*/

/*
	news module:
		* loads news feed onto page
		* handles resetting the hash if hash points to a news item
*/

import {
	cloneTemplate,
} from "./templates.js?type=module,v=2025-05-13";

// build HTML for news item
function buildNewsItem(item) {
	const newsItemProps = {
		"ID": item.querySelector(`link[rel="alternate"]`)?.getAttribute(`href`)?.split(`#`)[1],
		"title": item.querySelector(`title`)?.textContent,
		"published": item.querySelector(`published`)?.textContent,
		"content": item.querySelector(`content`)?.textContent,
	};

	if (!validateObject(newsItemProps, {
		"ID": [`string`, true],
		"title": [`string`, true],
		"published": [`string`, true],
		"content": [`string`, true],
	})) {
		console.warn(`Removed invalid news entry from feed.
Required props:
	ID (string, from link[rel="alternate"].href)
	title (string)
	published date (string)
	content (string)
`, newsItemProps);
		return ``;
	}

	const templatedNews = cloneTemplate(`newsItem`);

	templatedNews.querySelector(`h3`)?.setContent(newsItemProps.title);
	templatedNews.querySelector(`.news-item-published`)?.setContent(newsItemProps.published.split(`T`)[0]);
	templatedNews.querySelector(`.news-item-content`)?.setContent(newsItemProps.content);

	return templatedNews;
}

// build news feed onto page
function buildNewsFeed(news) {
	document.getElementById(`news-list`).replaceChildren(...[...news.querySelectorAll(`entry`)].map(buildNewsItem));
	document.getElementById(`news-list`).dataset.empty = `News feed is empty.`;

	// must reset hash so navigateToSection() will apply if the hash is for a news item
	// (as news items are loaded onto page asynchronously, the browser won't recognise that they exist when navigateToSection() is called on DOMContentLoaded)
	if (location.hash) {
		const storedHash = location.hash;
		location.hash = ``;
		location.hash = storedHash;
	}
}

// fetch news feed file and, if available and valid, build news list onto page
async function loadNews() {
	const file = await fetch(
		`./feed.xml`,
		{"cache": `no-cache`},
	);
	if (!file.ok) {
		document.getElementById(`news-list`).dataset.empty = `Error: Couldn't load news feed. Try refreshing the page.`;
		console.error(`Failed to fetch news feed file. Status: ${file.status}.`);
		return;
	}

	try {
		const XML = await file.text();
		const news = new DOMParser().parseFromString(XML, `text/xml`);
		buildNewsFeed(news);
	} catch {
		console.error(`News feed is not a text file.`);
	}
}

export {
	loadNews,
};
