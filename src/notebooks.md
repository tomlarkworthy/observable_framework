---
title: My Notebooks
---

# My Notebooks


[observablhq/@tomlarkworthy](https://observablehq.com/@tomlarkworthy?tab=notebooks&sort=likes&direction=desc&action=viewed)

```js
const tomlarkworthy_notebooks = await FileAttachment("data/tomlarkworthy_notebooks.json").json()
```

```js
const tomlarkworthy_collections = await FileAttachment("data/tomlarkworthy_collections.json").json()
```
<div>
${
    tomlarkworthy_collections.map(
        collection => htl.html`
            <h2>${collection.title}</h2>
            <p>${collection.description}</p>
            <div class="grid grid-cols-4">
            ${collection.content.listings
                .sort((a, b) => b.likes - a.likes).map(notebook => htl.html`<div class="card">
                    <a href="https://observablehq.com/@tomlarkworthy/${notebook.slug}"><h2>${notebook.title}</h2>
                    <img width="100%" src="https://static.observableusercontent.com/thumbnail/${notebook.thumbnail}.jpg"></img></a>
                    <p>likes: ${notebook.likes}</p>
                </div>`)}
            </div>`
    )
}
</div>
