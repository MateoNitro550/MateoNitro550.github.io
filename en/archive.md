---
layout: page
title: Archive
lang: en
---

<section>
  {% if site.en[0] %}

    {% capture currentyear %}{{ 'now' | date: "%Y" }}{% endcapture %}
    {% capture firstpostyear %}{{ site.en.last.date | date: '%Y' }}{% endcapture %}
    {% if currentyear == firstpostyear %}
      <h3>Posts from this year</h3>
    {{ mont }}
    {% else %}  
      <h3>{{ firstpostyear }}</h3>
    {% endif %}

    {% for post in site.en reversed %}
      {% unless post.next %}
        {% capture month %}{% assign m = post.date | date: "%-m" | minus: 1 %}{{ site.data.en.short[m] }}{% endcapture %}
        <ul>
      {% else %}
        {% capture year %}{{ post.date | date: '%Y' }}{% endcapture %}
        {% capture nyear %}{{ post.next.date | date: '%Y' }}{% endcapture %}
        {% capture month %}{% assign m = post.date | date: "%-m" | minus: 1 %}{{ site.data.en.short[m] }}{% endcapture %}
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
