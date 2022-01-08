---
layout: page
title: Search
---

<div id="search-container">
    <input type="text" id="search-input" placeholder="Busca Plataforma, Máquina, Vulnerabilidad, Temática, CTF...">
    <ul id="results-container"></ul>
</div>

<script src="{{ site.url }}/js/simple-jekyll-search.min.js"></script>
<script src="{{ site.url }}/js/simple-jekyll-search.min.js" type="text/javascript"></script>
<script src="{{ site.newbaseurl }}/simple-jekyll-search.min.js"></script>
<script src="{{ site.newbaseurl }}/simple-jekyll-search.min.js" type="text/javascript"></script>

<script src="https://unpkg.com/simple-jekyll-search@latest/dest/simple-jekyll-search.min.js"></script>

<script>
    SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),  
    resultsContainer: document.getElementById('results-container'),
    searchResultTemplate: '<div style="text-align:right !important;"><a href="{{ site.url }}{url}"><h1 style="text-align:left !important;">{title}</h1></a><span style="text-align:right !important;">{date}</span></div>',
    json: '/search.json'
    });
</script>
