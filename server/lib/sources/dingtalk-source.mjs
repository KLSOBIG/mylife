function normalizeText(payload) {
  return payload.text?.content || payload.content?.text || payload.msg?.text?.content || payload.message?.text || payload.title || "";
}

function normalizeSender(payload) {
  return payload.senderNick || payload.senderStaffId || payload.senderId || payload.from || "dingtalk";
}

function normalizeTags(payload, source) {
  const tags = new Set(source.config?.tags || []);
  if (payload.chatbotCorpId) {
    tags.add("corp");
  }
  if (payload.atUsers?.length) {
    tags.add("@mention");
  }
  if (/告警|紧急/i.test(normalizeText(payload))) {
    tags.add("告警");
  }
  return [...tags];
}

export function syncDingtalkWebhook(source, payload) {
  const text = normalizeText(payload).trim();
  const title = text.split("\n")[0] || payload.msgtype || "钉钉消息";

  return [
    {
      id: `ev_dingtalk_${source.id}_${Date.now()}`,
      workspaceId: source.workspaceId,
      title,
      source: source.name,
      sender: normalizeSender(payload),
      level: source.config?.level || "L2",
      summary: text,
      happenedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      tags: normalizeTags(payload, source)
    }
  ];
}
