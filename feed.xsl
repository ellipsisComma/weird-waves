<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
<xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat" />

<!--manual variables-->
<xsl:variable name="latest-updates-count" select="6" />



<!--convert atom timestamp to valid HTML id-->
<xsl:template name="timestamp-to-id">
<xsl:param name="timestamp" />
<xsl:value-of select="translate($timestamp, ':+', '--')" />
</xsl:template>

<!--remove time part of atom timestamp-->
<xsl:template name="timestamp-to-date">
<xsl:param name="timestamp" />
<xsl:value-of select="substring-before($timestamp, 'T')" />
</xsl:template>

<!--count posts with a given category (allows multiple category elements per post)-->
<xsl:template name="count-posts-in-category">
<xsl:param name="category" />
<xsl:value-of select="count(atom:entry[atom:category/@term = $category])" />
</xsl:template>

<!--
render all posts from a category, each including:
	* a hash-link in the heading
	* post title and content
	* published/updated timestamps (only published timestamp if they're the same)

append an HTML id if the category (passed as an argument) is "all", so hash-links on all copies of a post point to the copy of hte post in the all-news section
-->
<xsl:template name="list-posts">
<xsl:param name="category" />
<xsl:for-each select="atom:entry">
	<xsl:if test="$category = 'all' or atom:category/@term = $category">
		<li><article>
			<xsl:if test="$category = 'all'">
				<xsl:attribute name="id">
					<xsl:text>post-</xsl:text>
					<xsl:call-template name="timestamp-to-id">
						<xsl:with-param name="timestamp" select="atom:updated" />
					</xsl:call-template>
				</xsl:attribute>
			</xsl:if>
			<header>
				<h3>
					<span class="contains-html">
						<xsl:value-of select="atom:title" />
					</span>
					<xsl:text> </xsl:text>
					<a>
						<xsl:attribute name="href">
							<xsl:text>#post-</xsl:text>
							<xsl:call-template name="timestamp-to-id">
								<xsl:with-param name="timestamp" select="atom:updated" />
							</xsl:call-template>
						</xsl:attribute>
					</a>
				</h3>
				<div class="post-times">
					<xsl:text>posted </xsl:text>
					<time>
						<xsl:call-template name="timestamp-to-date">
							<xsl:with-param name="timestamp" select="atom:published" />
						</xsl:call-template>
					</time>
					<xsl:if test="atom:published != atom:updated">
						<xsl:text> / last updated </xsl:text>
						<time>
							<xsl:call-template name="timestamp-to-date">
								<xsl:with-param name="timestamp" select="atom:updated" />
							</xsl:call-template>
						</time>
					</xsl:if>
				</div>
			</header>
			<div class="contains-html">
				<xsl:value-of select="atom:content" />
			</div>
		</article></li>
	</xsl:if>
</xsl:for-each>
</xsl:template>

<!--list updated-timestamps and post headings for most recent posts-->
<xsl:template name="latest-updated-posts-list">
<xsl:for-each select="atom:entry[position() &lt;= $latest-updates-count]">
	<dt>
		<a>
			<xsl:attribute name="href">
				<xsl:text>#post-</xsl:text>
				<xsl:call-template name="timestamp-to-id">
					<xsl:with-param name="timestamp" select="atom:updated" />
				</xsl:call-template>
			</xsl:attribute>
			<xsl:call-template name="timestamp-to-date">
				<xsl:with-param name="timestamp" select="atom:updated" />
			</xsl:call-template>
		</a>
	</dt>
	<dd><xsl:value-of select="atom:title" /></dd>
</xsl:for-each>
</xsl:template>



<!--main output template-->
<xsl:template match="atom:feed">
<html lang="en-GB" data-theme="dark" data-font="sans">
<head>
	<title>
		<xsl:value-of select="atom:title" />
		<xsl:text> Feed</xsl:text>
	</title>

	<link rel="preload" type="font/woff2" href="./fonts/bitter-regular-weirdwaves.woff2" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-weirdwaves.woff2" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-italic-weirdwaves.woff2" as="font" crossorigin="" />
	<link rel="preload" type="font/woff2" href="./fonts/bitter-bold-italic-weirdwaves.woff2" as="font" crossorigin="" />

	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="stylesheet" type="text/css" media="all" href="./main.css?v=2024-07-02" />
	<link rel="stylesheet" type="text/css" media="all" href="./feed.css?v=2024-07-01" />

	<link rel="icon" type="image/svg+xml" href="./images/favicons/dark.svg" />
	<link rel="shortcut icon" href="./images/favicons/dark.ico" />

	<script src="./initialisation.js?v=2024-06-28"></script>
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
</header>



<aside id="sidebar">
	<div id="feed-info">
		<p>This is a preview of the Weird Waves news feed. Read in your browser or subscribe by copying its <abbr title="Universal Resource Locator">URL</abbr> into your feed reader:</p>
		<p id="feed-url"><code>https://weirdwaves.net/feed.xml</code></p>
		<p>New to feeds? They let you follow sites! Read <a href="https://aboutfeeds.com/" rel="external">About Feeds</a> for more info.</p>
	</div>
</aside><!--#sidebar end-->



<nav>
	<ul id="general-sections">
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
	</ul><!--#general-sections end-->
	<ul id="category-sections">
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
	</ul><!--#category-sections end-->
</nav>



<main>
<div id="all-news">
	<h2>All News</h2>
	<p>All the news, all in one place.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:call-template name="list-posts">
			<xsl:with-param name="category" select="'all'" />
		</xsl:call-template>
	</ol>
</div><!--#all-new end-->



<div id="about">
	<h2>About</h2>
	<p>The Weird Waves Feed provides the station's old and current news! You can find all the posts in <a href="#all-news">All News</a>, or read by category in <a href="#bulletins">Bulletins</a>, <a href="#features">Features</a>, and <a href="#history">History</a>.</p>
	<p>This latest version of the news is an <a href="https://en.wikipedia.org/wiki/Atom_(web_standard)" rel="external">Atom</a> feed that's converted into a web page in your browser using the niche, obscure templating language <a href="https://www.w3schools.com/xml/xml_xslt.asp" rel="external"><abbr title="eXtensible Stylesheet Language Transformations">XSLT</abbr></a>.</p>
	<p>The Feed contains:</p>
	<dl id="stats-list">
		<div>
			<dt>posts in total</dt>
			<dd><xsl:value-of select="count(atom:entry)" /></dd>
		</div>
		<div>
			<dt>bulletins</dt>
			<dd>
				<xsl:call-template name="count-posts-in-category">
					<xsl:with-param name="category" select="'bulletins'" />
				</xsl:call-template>
			</dd>
		</div>
		<div>
			<dt>feature alerts</dt>
			<dd>
				<xsl:call-template name="count-posts-in-category">
					<xsl:with-param name="category" select="'features'" />
				</xsl:call-template>
			</dd>
		</div>
		<div>
			<dt>blog posts</dt>
			<dd>
				<xsl:call-template name="count-posts-in-category">
					<xsl:with-param name="category" select="'history'" />
				</xsl:call-template>
			</dd>
		</div>
	</dl>
	<noscript>Sorry, this feed requires JavaScript to display properly! Without it, post titles and content will appear as raw markup, among other minor changes.</noscript>
</div><!--#about end-->



<div id="bulletins">
	<h2>Bulletins</h2>
	<p>Milestones, show announcements, and major decisions in the site's development.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:call-template name="list-posts">
			<xsl:with-param name="category" select="'bulletins'" />
		</xsl:call-template>
	</ol>
</div><!--#bulletins end-->



<div id="features">
	<h2>Features</h2>
	<p>All the info on new features, bug fixes, and other tweaks to the site.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:call-template name="list-posts">
			<xsl:with-param name="category" select="'features'" />
		</xsl:call-template>
	</ol>
</div><!--#features end-->



<div id="history">
	<h2>History</h2>
	<p>Blog posts (from a now-defunct blog) published before Weird Waves even had a News section or Feed.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<ol class="post-list" reversed="">
		<xsl:call-template name="list-posts">
			<xsl:with-param name="category" select="'history'" />
		</xsl:call-template>
	</ol>
</div><!--#history end-->



<div id="welcome">
	<h2>Welcome to the News Archive!</h2>
	<p>This is a collection of announcements, features and bug-fixes, and even copies of blog posts from the earliest stages of Weird Waves.</p>
	<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon waveform-spacer" viewBox="0 0 96 24"><use href="#svg-waveform" /></svg>
	<h3>Latest updates</h3>
	<dl id="latest-updates">
		<xsl:call-template name="latest-updated-posts-list" />
	</dl>
</div><!--#welcome end-->
</main>
</div><!--#container end-->



<script src="./feed.js?V=2024-06-29b"></script>
</body>
</html>
</xsl:template>
</xsl:transform>