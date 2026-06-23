export async function fetchGithubContributions(username: string): Promise<number> {
  if (!username) return 0;
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      console.error(`Failed to fetch contributions page for ${username}:`, res.statusText);
      return 0;
    }
    const html = await res.text();
    const match = html.match(/(\d[\d,]*)\s+contributions/i);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return 0;
  } catch (err) {
    console.error("Error scraping github contributions:", err);
    return 0;
  }
}
