---
layout: page
title: Search
lang: en
---

<div id="search-container">
    <input type="text" id="search-input" placeholder="Search Platform, Machine, Vulnerability, Topic, CTF...">
    <ul id="results-container"></ul>
</div>

<script src="{{ site.url }}/assets/js/simple-jekyll-search.min.js"></script>

<script>
    var noResultsText = "No results found.";

    SimpleJekyllSearch({
        searchInput: document.getElementById('search-input'),  
        resultsContainer: document.getElementById('results-container'),
        searchResultTemplate: '<div style="text-align:right !important;"><a href="{{ site.url }}{url}"><h1 style="text-align:left !important;">{title}</h1></a><span style="text-align:right !important;">{date}</span></div>',
        json: '/en/search.json',
        noResultsText: noResultsText
    });
</script>
