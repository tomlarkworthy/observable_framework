const results = [];
let hasMore = true;
let page = 1;
while (hasMore) {
  const batch = await (
    await fetch(
      `https://api.observablehq.com/documents/@endpointservices?page=${page++}`
    )
  ).json();
  hasMore = batch.results && batch.results.length > 0;
  if (hasMore) results.push(...batch.results);
}

console.log(JSON.stringify(results));
