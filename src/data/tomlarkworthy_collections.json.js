const collections = await (
  await fetch(`https://api.observablehq.com/collections/@tomlarkworthy`)
).json();

await Promise.all(
  collections.map(async (collection) => {
    const content = await (
      await fetch(
        `https://api.observablehq.com/collection/@tomlarkworthy/${collection.slug}`
      )
    ).json();
    collection.content = content;
  })
);
console.log(JSON.stringify(collections));
