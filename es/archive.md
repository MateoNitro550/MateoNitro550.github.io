---
layout: page
title: Archivo
lang: es
---

<section>
  {% if site.es[0] %}

    {% capture currentyear %}{{ 'now' | date: "%Y" }}{% endcapture %}
    {% capture firstpostyear %}{{ site.es.last.date | date: '%Y' }}{% endcapture %}
    {% if currentyear == firstpostyear %}
      <h3>Publicaciones de este año</h3>
    {{ mont }}
    {% else %}  
      <h3>{{ firstpostyear }}</h3>
    {% endif %}

    {% for post in site.es reversed %}
      {% unless post.next %}
        {% capture month %}{% assign m = post.date | date: "%-m" | minus: 1 %}{{ site.data.es.short[m] }}{% endcapture %}
        <ul>
      {% else %}
        {% capture year %}{{ post.date | date: '%Y' }}{% endcapture %}
        {% capture nyear %}{{ post.next.date | date: '%Y' }}{% endcapture %}
        {% capture month %}{% assign m = post.date | date: "%-m" | minus: 1 %}{{ site.data.es.short[m] }}{% endcapture %}
        {% if year != nyear %}
          </ul>
          <h3>{{ post.date | date: '%Y' }}</h3>
          <ul>
        {% endif %}
      {% endunless %}
        <li><time>{{ post.date | date:month }} {{ post.date | date:"%d" }} - </time>
          <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
            {{ post.title }}
          </a>
        </li>
    {% endfor %}
    </ul>

  {% endif %}
</section>
