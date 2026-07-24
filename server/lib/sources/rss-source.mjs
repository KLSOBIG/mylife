export async function syncRssSource(source) {
  const response = await fetch(source.config.url, {
    headers: {
      "user-agent": "nexus-local-source-sync"
    }
  });

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const items = parseRssItems(xml).slice(0, source.config.limit || 5);
  return items.map((item, index) => ({
    id: `ev_sync_${source.id}_${Date.now()}_${index}`,
    workspaceId: source.workspaceId,
    title: item.title,
    source: source.name,
    sender: source.config.sender || source.name,
    level: source.config.level || "L1",
    summary: item.summary,
    happenedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    tags: source.config.tags || []
  }));
}

function parseRssItems(xml) {
  const chunks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  return chunks.map((chunk) => ({
    title: decodeXml(readTag(chunk, "title") || "未命名条目"),
    summary: decodeXml(stripCdata(readTag(chunk, "description") || readTag(chunk, "summary") || ""))
  }));
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim();
}

function stripCdata(value) {
  return value.replace(/^<!\\[CDATA\\[/, "").replace(/\\]\\]>$/, "");
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}
