---
layout: default
lang: es
pagination: 
  enabled: true
  collection: es
  per_page: 5
  permalink: "/page/:num/"
date_format: "%d/%m/%Y"
---

<ul>
    {{ paginator.posts | inspect }}
    {% for post in paginator.posts %}
        <li>
            <h2><a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">{{ post.title }}</a></h2>
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: page.date_format }}</time>
            <p>{{ post.content | strip_html | truncatewords:50 }}</p>
        </li>
    {% endfor %}
</ul>
