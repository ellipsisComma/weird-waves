<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat" />

<!--manual variables-->
<xsl:variable name="latest-updates-count" select="6" />



<!--get post id-->
<xsl:template match="atom:link[@rel='alternate']">
<xsl:value-of select="substring-after(@href, '#')" />
</xsl:template>

<!--remove time part of atom timestamp-->
<xsl:template match="atom:published | atom:updated" mode="timestamp-to-date">
<time><xsl:value-of select="substring-before(., 'T')" /></time>
</xsl:template>

<!--deep copy of an xhtml-container's grandchildren while excluding the inner container div-->
<xsl:template match="*[@type = 'xhtml']">
<xsl:copy-of select="xhtml:div/node()" />
</xsl:template>



<!--
render all posts from a category, each including:
	* a hash-link in the heading
	* post title and content
	* published/updated timestamps (only published timestamp if they're the same)

append an HTML id matching hash-link
-->
<xsl:template match="atom:entry" mode="list-posts">
<li><article>
	<xsl:attribute name="id">
		<xsl:apply-templates select="atom:link[@rel='alternate']" />
	</xsl:attribute>
	<header>
		<h3>
			<xsl:apply-templates select="atom:title" />
			<xsl:text> [</xsl:text>
			<a>
				<xsl:attribute name="href">
					<xsl:text>#</xsl:text>
					<xsl:apply-templates select="atom:link[@rel='alternate']" />
				</xsl:attribute>
				<xsl:attribute name="aria-label">link to this post</xsl:attribute>
				<xsl:text>link</xsl:text>
			</a>
			<xsl:text>]</xsl:text>
		</h3>
		<div class="post-times">
			<xsl:if test="atom:category">
				<xsl:text>#</xsl:text>
				<xsl:value-of select="atom:category/@term" />
				<xsl:text>, </xsl:text>
			</xsl:if>
			<xsl:text>posted </xsl:text>
			<xsl:apply-templates select="atom:published" mode="timestamp-to-date" />
			<xsl:if test="atom:published != atom:updated">
				<xsl:text> / last updated </xsl:text>
				<xsl:apply-templates select="atom:updated" mode="timestamp-to-date" />
			</xsl:if>
		</div>
	</header>
	<div>
		<xsl:apply-templates select="atom:content" />
	</div>
</article></li>
</xsl:template>

<!--list updated-timestamps and post headings for most recent posts-->
<xsl:template match="atom:entry" mode="list-latest-updates">
<div>
	<dt>
		<a>
			<xsl:attribute name="href">
				<xsl:text>#</xsl:text>
				<xsl:apply-templates select="atom:link[@rel='alternate']" />
			</xsl:attribute>
			<xsl:apply-templates select="atom:updated" mode="timestamp-to-date" />
		</a>
	</dt>
	<dd>
		<xsl:apply-templates select="atom:title" />
	</dd>
</div>
</xsl:template>



<!--main output template-->
<xsl:template match="atom:feed">
<html lang="en-GB" data-theme="dark" data-font="serif" dir="auto">
<head>
	<title><xsl:value-of select="concat(atom:title, ' Feed')" /></title>
	<meta name="description" content="The news feed for Weird Waves: Audio horror broadcasting online" />

	<link rel="preload" type="font/woff2" href="./fonts/bitter-regular-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-italic-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-italic-weirdwaves.woff2?v=2024-06-07" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/fira-mono-regular-weirdwaves.woff2?v=2024-12-18" as="font" crossorigin="" />

	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="stylesheet" type="text/css" media="screen" href="./main.css?v=2025-02-01" />

	<link rel="icon" href="./images/default-favicon.ico?v=2022-09-27" sizes="48x48" />
	<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2026%2026%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20vector-effect%3D%22non-scaling-stroke%22%3E%3Canimate%20attributeName%3D%22opacity%22%20values%3D%221%3B%200%3B%200%3B%201%22%20keyTimes%3D%220%3B%200%3B%201%3B%201%22%20dur%3D%221s%22%20repeatCount%3D%221%22%2F%3E%3Crect%20x%3D%22-1%22%20y%3D%22-1%22%20width%3D%2228%22%20height%3D%2228%22%20fill%3D%22%23000627%22%2F%3E%3Cpath%20stroke%3D%22%23ff6767%22%20d%3D%22M7%2011a3%203%200%200%201%203%203a3%203%200%200%201%206%200a3%203%200%200%201%203-3%22%2F%3E%3Cpath%20stroke%3D%22%23b9ab00%22%20d%3D%22M7%208a6%206%200%200%201%2012%200v4a6%206%200%200%201-12%200zm12%203h3v1a9%209%200%200%201-18%200v-1h3m6%2010v3m-4%200h8%22%2F%3E%3C%2Fsvg%3E" sizes="any" />

	<script src="./utilities.js?v=2025-01-29"></script>
	<script src="./initialisation.js?v=2024-12-17"></script>
</head>



<body>
<svg xmlns="http://www.w3.org/2000/svg" id="svg-defs" aria-hidden="true">
<!--menu icons-->
	<symbol id="svg-about">
		<path d="M15 2v6l2 15m1 0h-12m5 0v-4a1 1 0 0 1 2 0v4m-7 0m1 0l2-15v-6m-1 0a10 10 0 0 1 8 0zm0 6h8" />
		<g class="svg-hot-stroke">
			<path d="M1 2l22 6m0-6l-22 6" />
			<circle cx="12" cy="5" r="1" />
		</g>
	</symbol>
	<symbol id="svg-news">
		<path d="M4 20v-11a8-8 0 0 1 16 0v11m2 0v2h-20v-2z" />
		<path class="svg-hot-stroke" d="M6 15v-6h2a2 2 0 0 1 0 4a2 2 0 0 1 2 2m2 0v-6m2 6v-6h2a2 2 0 0 1 0 4" />
	</symbol>
	<symbol id="svg-return">
		<path d="M8 22h-1a4 4 0 0 1 0-8zm-5-4l-1-8a10 9 0 0 1 20 0h-3a7 6 0 0 0-14 0h-3m20 0l-1 8m-5 4h1a4 4 0 0 0 0-8z" />
		<path d="M6 18l7-2-2 4 7-2" />
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
</header>



<aside id="sidebar" aria-label="Using this Feed">
	<div id="feed-info">
		<p>This is a preview of the Weird Waves news feed. Read in your browser or subscribe by copying its <abbr>URL</abbr> into your feed reader:</p>
		<p id="feed-url"><code>https://weirdwaves.net/feed.xml</code></p>
		<p>New to feeds? They let you follow sites! Read <a href="https://aboutfeeds.com/">About Feeds</a> for more info.</p>
	</div><!--#feed-info end-->
</aside><!--#sidebar end-->



<nav id="main-nav">
	<ul>
		<li>
			<a href="#news">
				<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24"><use href="#svg-news" /></svg>
				<span>News</span>
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
</nav><!--#main-nav end-->



<main>
<section id="about">
	<h2>About</h2>
	<p>The Weird Waves Feed provides the station's old and current news! You can find all the posts in <a href="#news">News</a>.</p>
	<p>This latest version of the news is an <a href="https://en.wikipedia.org/wiki/Atom_(web_standard)">Atom</a> feed that's converted into a web page in your browser using the niche, obscure templating language <a href="https://www.w3schools.com/xml/xml_xslt.asp"><abbr>XSLT</abbr> (eXtensible Stylesheet Language Transformations)</a>.</p>
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



<section id="news">
	<h2>News</h2>
	<p>All the news, all in one place.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" role="separator" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:apply-templates select="atom:entry" mode="list-posts" />
	</ol>
</section><!--#news end-->



<section id="welcome">
	<h2>Welcome to the News Archive!</h2>
	<p>This is a collection of announcements, features and bug-fixes, and even copies of blog posts from the earliest stages of Weird Waves.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" role="separator" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
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
	updateFavicon();
}

// switch favicon
function updateFavicon() {
	let faviconNew = faviconRaw;
	[`fore`, `back`, `hot`, `cold`].forEach(type => faviconNew = faviconNew.replaceAll(`--${type}-colour`, getStyle(`:root`, `--${type}-colour`)));
	page.getElement(`SVGFavicon`).href = `data:image/svg+xml,${encodeURIComponent(faviconNew)}`;
}

// perform actions that should be performed on DOMContentLoaded, but aren't
setTimeout(() => {
	updateFavicon();
	if (location.hash.length > 0) location.hash = location.hash;
}, 10);

// update styles if styles change in another browsing context
window.addEventListener(`storage`, () => {
	const newValue = JSON.parse(event.newValue);
	if (event.key === `styles`) {
		if (document.documentElement.dataset.theme !== newValue.theme) updateStyle(`theme`, newValue.theme);
		if (document.documentElement.dataset.font !== newValue.font) updateStyle(`font`, newValue.font);
		console.info(`automatically matched style change in another browsing context`);
	}
});
]]></script>
</body>
</html>

</xsl:template>
</xsl:transform>