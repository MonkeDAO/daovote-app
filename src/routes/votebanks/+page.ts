import { error } from "@sveltejs/kit";

export async function load({ setHeaders, fetch }) {
    const res = await fetch(`/api/votebanks.json`);
    //const res2 = await fetch(`/api/votebank/${"4BFs2t7H8LeFEq8LNVPoXmNWHat3zqZmaoYW8uZYB5tg"}/proposals.json`);
    // const t = await res2.json();
    // console.log("res2", res2, t);
    // alternate strategy https://www.davidwparker.com/posts/how-to-make-an-rss-feed-in-sveltekit
    // Object.entries(import.meta.glob('./*.md')).map(async ([path, page]) => {
    if (res.status > 400) {
      throw error(res.status, await res.text());
    }
  
    /** @type {import('$lib/types').ContentItem[]} */
    const vbanks = await res.json();
    setHeaders({
      'cache-control': `public, max-age=3600`, // 1 hour
    });
    // return { items: items.slice(0, 10) };
    return { vbanks };
  }
  
