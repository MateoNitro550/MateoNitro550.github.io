---
layout: page
title: Buscar
lang: es
---

<div id="search-container">
    <input type="text" id="search-input" placeholder="Busca Plataforma, Máquina, Vulnerabilidad, Temática, CTF...">
    <ul id="results-container"></ul>
</div>

<script src="{{ site.url }}/assets/js/simple-jekyll-search.min.js"></script>

<script>
    var noResultsText = "No se han encontrado resultados.";

    SimpleJekyllSearch({
        searchInput: document.getElementById('search-input'),  
        resultsContainer: document.getElementById('results-container'),
        searchResultTemplate: '<div style="text-align:right !important;"><a href="{{ site.url }}{url}"><h1 style="text-align:left !important;">{title}</h1></a><span style="text-align:right !important;">{date}</span></div>',
        json: '/es/search.json',
        noResultsText: noResultsText
    });
</script>
