<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
<xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat" />

<!--manual variables-->
<xsl:variable name="latest-updates-count" select="6" />



<!--convert atom timestamp to valid HTML id-->
<xsl:template match="atom:published | atom:updated" mode="timestamp-to-id">
<xsl:value-of select="translate(., ':+', '--')" />
</xsl:template>

<!--remove time part of atom timestamp-->
<xsl:template match="atom:published | atom:updated" mode="timestamp-to-date">
<time><xsl:value-of select="substring-before(., 'T')" /></time>
</xsl:template>



<!--
render all posts from a category, each including:
	* a hash-link in the heading
	* post title and content
	* published/updated timestamps (only published timestamp if they're the same)

append an HTML id if the template's applied to all news, so hash-links on all copies of a post point to the copy of the post in the all-news section
-->
<xsl:template match="atom:entry" mode="list-posts">
<xsl:param name="all-news" />
<li><article>
	<xsl:if test="$all-news = 'true'">
		<xsl:attribute name="id">
			<xsl:text>post-</xsl:text>
			<xsl:apply-templates select="atom:updated" mode="timestamp-to-id" />
		</xsl:attribute>
	</xsl:if>
	<header>
		<h3>
			<span class="may-contain-html">
				<xsl:value-of select="atom:title" />
			</span>
			<xsl:text> </xsl:text>
			<a>
				<xsl:attribute name="href">
					<xsl:text>#post-</xsl:text>
					<xsl:apply-templates select="atom:updated" mode="timestamp-to-id" />
				</xsl:attribute>
			</a>
		</h3>
		<div class="post-times">
			<xsl:text>posted </xsl:text>
			<xsl:apply-templates select="atom:published" mode="timestamp-to-date" />
			<xsl:if test="atom:published != atom:updated">
				<xsl:text> / last updated </xsl:text>
				<xsl:apply-templates select="atom:updated" mode="timestamp-to-date" />
			</xsl:if>
		</div>
	</header>
	<div class="may-contain-html">
		<xsl:value-of select="atom:content" />
	</div>
</article></li>
</xsl:template>

<!--list updated-timestamps and post headings for most recent posts-->
<xsl:template match="atom:entry" mode="list-latest-updates">
<dt>
	<a>
		<xsl:attribute name="href">
			<xsl:text>#post-</xsl:text>
			<xsl:apply-templates select="atom:updated" mode="timestamp-to-id" />
		</xsl:attribute>
		<xsl:apply-templates select="atom:updated" mode="timestamp-to-date" />
	</a>
</dt>
<dd class="may-contain-html">
	<xsl:value-of select="atom:title" />
</dd>
</xsl:template>



<!--main output template-->
<xsl:template match="atom:feed">
<html lang="en-GB" data-theme="dark" data-font="serif">
<head>
	<title><xsl:value-of select="concat(atom:title, ' Feed')" /></title>

	<link rel="preload" type="font/woff2" href="./fonts/bitter-regular-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-italic-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-italic-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />

	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="stylesheet" type="text/css" media="all" href="./main.css?v=2024-07-30" />

	<link rel="icon" href="./images/default-favicon.ico?v=2022-09-27" sizes="48x48" />
	<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2026%2026%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20vector-effect%3D%22non-scaling-stroke%22%3E%3Canimate%20attributeName%3D%22opacity%22%20values%3D%221%3B%200%3B%200%3B%201%22%20keyTimes%3D%220%3B%200%3B%201%3B%201%22%20dur%3D%221s%22%20repeatCount%3D%221%22%2F%3E%3Crect%20x%3D%22-1%22%20y%3D%22-1%22%20width%3D%2228%22%20height%3D%2228%22%20fill%3D%22%23000627%22%2F%3E%3Cpath%20stroke%3D%22%23ff6767%22%20d%3D%22M7%2011a3%203%200%200%201%203%203a3%203%200%200%201%206%200a3%203%200%200%201%203-3%22%2F%3E%3Cpath%20stroke%3D%22%23b9ab00%22%20d%3D%22M7%208a6%206%200%200%201%2012%200v4a6%206%200%200%201-12%200zm12%203h3v1a9%209%200%200%201-18%200v-1h3m6%2010v3m-4%200h8%22%2F%3E%3C%2Fsvg%3E" sizes="any" />

	<script src="./utilities.js?v=2024-07-28b"></script>
	<script src="./initialisation.js?v=2024-08-02"></script>
</head>



<body>
<svg xmlns="http://www.w3.org/2000/svg" id="svg-defs">
<!--menu icons-->
	<symbol id="svg-about">
		<path d="M15 2v6l2 15m1 0h-12m5 0v-4a1 1 0 0 1 2 0v4m-7 0m1 0l2-15v-6m-1 0a10 10 0 0 1 8 0zm0 6h8" />
		<g class="svg-hot-stroke">
			<path d="M1 2l22 6m0-6l-22 6" />
			<circle cx="12" cy="5" r="1" />
		</g>
	</symbol>
	<symbol id="svg-all-news">
		<path d="M1 13a10 10 0 0 0 10 10zm2 2h6v6m-3-3l3-3" />
		<path class="svg-hot-stroke" d="M9 12a3 3 0 0 1 3 3m5 0a8 8 0 0 0 -8-8m0-5a13 13 0 0 1 13 13" />
	</symbol>
	<symbol id="svg-return">
		<path d="M8 22h-1a4 4 0 0 1 0-8zm-5-4l-1-8a10 9 0 0 1 20 0h-3a7 6 0 0 0-14 0h-3m20 0l-1 8m-5 4h1a4 4 0 0 0 0-8z" />
		<path d="M6 18l7-2-2 4 7-2" />
	</symbol>
	<symbol id="svg-bulletins">
		<path d="M4 20v-11a8-8 0 0 1 16 0v11m2 0v2h-20v-2z" />
		<path class="svg-hot-stroke" d="M6 15v-6h2a2 2 0 0 1 0 4a2 2 0 0 1 2 2m2 0v-6m2 6v-6h2a2 2 0 0 1 0 4" />
	</symbol>
	<symbol id="svg-features">
		<g id="svg-bulb">
			<circle cx="7" cy="7" r="4" />
			<g class="svg-hot-stroke">
				<circle cx="7" cy="7" r="1" />
				<path d="M4 4l6 6m-6 0l6-6" />
			</g>
		</g>
		<use href="#svg-bulb" x="10" />
		<path d="M3 7h-2v12h6m0-2v4m2 1v-6m2 1v4m2 1v-6m2 1v4m2 1v-6m0 3h6v-12h-2" />
	</symbol>
	<symbol id="svg-history">
		<path class="svg-hot-stroke" d="M7 14l-2 6m4-6l-3 9m5-9l-2 6m4-6l-3 9m5-9l-2 6m4-6l-3 9m5-9l-2 6" />
		<path d="M11 9a5 5 0 1 0-5 5h14a3 3 0 1 0 0-6a8 8 0 0 0-14-4" />
	</symbol>

<!--other-->
	<symbol id="svg-waveform">
		<path d="M1 12h94" />
		<path class="svg-hot-stroke" d="M12 12l3,1 3,-2 3,2 3,-3 3,4 3,-5 3,6 3,-8 3,12 3,-15 3,19 3,-22 3,22 3,-19 3,15 3,-12 3,8 3,-6 3,5 3,-4 3,3 3,-2 3,2 3,-1" />
	</symbol>
</svg><!--#svg-defs end-->



<div id="container">
<header>
	<h1><xsl:value-of select="atom:title" /></h1>
	<noscript>Sorry, this feed requires JavaScript to display properly! Without it, post titles and content will appear as raw markup, among other minor changes.</noscript>
</header>



<aside id="sidebar">
	<section id="feed-info">
		<h2 class="visually-hidden">Using this Feed</h2>
		<p>This is a preview of the Weird Waves news feed. Read in your browser or subscribe by copying its <abbr>URL</abbr> into your feed reader:</p>
		<p id="feed-url"><code>https://weirdwaves.net/feed.xml</code></p>
		<p>New to feeds? They let you follow sites! Read <a href="https://aboutfeeds.com/" rel="external">About Feeds</a> for more info.</p>
	</section><!--#feed-info end-->
</aside><!--#sidebar end-->



<nav id="main-nav">
	<ul>
		<li>
			<a href="#all-news">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-all-news" /></svg>
				<span>All News</span>
			</a>
		</li>
		<li>
			<a href="#about">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" ><use href="#svg-about" /></svg>
				<span>About</span>
			</a>
		</li>
		<li>
			<a href="./index.html">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-return" /></svg>
				<span>Return</span>
			</a>
		</li>
	</ul>

	<ul>
		<li>
			<a href="#bulletins">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-bulletins" /></svg>
				<span>Bulletins</span>
			</a>
		</li>
		<li>
			<a href="#features">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-features" /></svg>
				<span>Features</span>
			</a>
		</li>
		<li>
			<a href="#history">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-history" /></svg>
				<span>History</span>
			</a>
		</li>
	</ul>
</nav><!--#main-nav end-->



<main>
<section id="all-news">
	<h2>All News</h2>
	<p>All the news, all in one place.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:apply-templates select="atom:entry" mode="list-posts">
			<xsl:with-param name="all-news" select="'true'" />
		</xsl:apply-templates>
	</ol>
</section><!--#all-news end-->



<section id="about">
	<h2>About</h2>
	<p>The Weird Waves Feed provides the station's old and current news! You can find all the posts in <a href="#all-news">All News</a>, or read by category in <a href="#bulletins">Bulletins</a>, <a href="#features">Features</a>, and <a href="#history">History</a>.</p>
	<p>This latest version of the news is an <a href="https://en.wikipedia.org/wiki/Atom_(web_standard)" rel="external">Atom</a> feed that's converted into a web page in your browser using the niche, obscure templating language <a href="https://www.w3schools.com/xml/xml_xslt.asp" rel="external"><abbr>XSLT</abbr> (eXtensible Stylesheet Language Transformations)</a>.</p>
	<p>The Feed contains:</p>
	<dl id="stats-list">
		<div>
			<dt>posts in total</dt>
			<dd><xsl:value-of select="count(atom:entry)" /></dd>
		</div>
		<div>
			<dt>bulletins</dt>
			<dd><xsl:value-of select="count(atom:entry[atom:category/@term = 'bulletins'])" /></dd>
		</div>
		<div>
			<dt>feature alerts</dt>
			<dd><xsl:value-of select="count(atom:entry[atom:category/@term = 'features'])" /></dd>
		</div>
		<div>
			<dt>blog posts</dt>
			<dd><xsl:value-of select="count(atom:entry[atom:category/@term = 'history'])" /></dd>
		</div>
	</dl><!--#stats-list end-->
</section><!--#about end-->



<section id="bulletins">
	<h2>Bulletins</h2>
	<p>Milestones, show announcements, and major decisions in the site's development.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:apply-templates select="atom:entry[atom:category/@term = 'bulletins']" mode="list-posts" />
	</ol>
</section><!--#bulletins end-->



<section id="features">
	<h2>Features</h2>
	<p>All the info on new features, bug fixes, and other tweaks to the site.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:apply-templates select="atom:entry[atom:category/@term = 'features']" mode="list-posts" />
	</ol>
</section><!--#features end-->



<section id="history">
	<h2>History</h2>
	<p>Blog posts (from a now-defunct blog) published before Weird Waves even had a News section or Feed.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:apply-templates select="atom:entry[atom:category/@term = 'history']" mode="list-posts" />
	</ol>
</section><!--#history end-->



<section id="welcome">
	<h2>Welcome to the News Archive!</h2>
	<p>This is a collection of announcements, features and bug-fixes, and even copies of blog posts from the earliest stages of Weird Waves.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<h3>Latest updates</h3>
	<dl id="latest-updates">
		<xsl:apply-templates select="atom:entry[position() &lt;= $latest-updates-count]" mode="list-latest-updates" />
	</dl><!--#latest-updates end-->
</section><!--#welcome end-->
</main>
</div><!--#container end-->



<script><![CDATA[
// HTML element references
const page = (() => {
	const elements = {};
	return {
		"setElement": (key, query) => elements[key] ??= document.querySelector(query),
		"getElement": (key) => elements[key],
	};
})();

page.setElement(`title`, `title`);
page.setElement(`SVGFavicon`, `[rel="icon"][type="image/svg+xml"]`);

page.getElement(`title`).dataset.original = document.title;
if (location.hash) navigateToSection();

// raw favicon template
const faviconRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
	<rect x="-1" y="-1" width="28" height="28" fill="--back-colour" />
	<path stroke="--hot-colour" d="M7 11a3 3 0 0 1 3 3a3 3 0 0 1 6 0a3 3 0 0 1 3-3" />
	<path stroke="--cold-colour" d="M7 8a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0zm12 3h3v1a9 9 0 0 1-18 0v-1h3m6 10v3m-4 0h8" />
</svg>`;

// update setting and its buttons according to chosen value
function updateStyle(name, option) {
	document.documentElement.dataset[name] = option;
}

// switch between different colour themes
function switchTheme(theme) {
	updateStyle(`theme`, theme);

	let faviconNew = faviconRaw;
	[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getStyle(`:root`, `--${type}-colour`)));
	page.getElement(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
}

// switch between different fonts
function switchFont(font) {
	updateStyle(`font`, font);
}

// update favicons according to theme
setTimeout(() => switchTheme(document.documentElement.dataset.theme), 100);

// re-parse elements from the parsed file that contain HTML (or SVG)
const HTMLRegex = /<|>|&#?\w+;/;
for (const content of document.querySelectorAll(`.may-contain-html`)) if (HTMLRegex.test(content.innerText)) content.innerHTML = content.innerText;
]]>

// update styles if styles change in another browsing context
window.addEventListener(`storage`, () => {
	const newValue = JSON.parse(event.newValue);
	if (event.key === `styles`) {
		if (document.documentElement.dataset.theme !== newValue.theme) switchTheme(newValue.theme);
		if (document.documentElement.dataset.font !== newValue.font) switchFont(newValue.font);
		console.info(`automatically matched style change in another browsing context`);
	}
});
</script>
</body>
</html>

</xsl:template>
</xsl:transform>