---
layout: page
title: Search
---

<div id="search-container">
    <input type="text" id="search-input" placeholder="Search through the blog posts...">
    <ul id="results-container"></ul>
</div>

<script src="https://unpkg.com/simple-jekyll-search@latest/dest/simple-jekyll-search.min.js"></script>

<script>
    SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),  
    resultsContainer: document.getElementById('results-container'),
    searchResultTemplate: '<div style="text-align:right !important;"><a href="{{ site.url }}{url}"><h1 style="text-align:left !important;">{title}</h1></a><span style="text-align:right !important;">{date}</span></div>',
    json: '/search.json'
    });
</script>
