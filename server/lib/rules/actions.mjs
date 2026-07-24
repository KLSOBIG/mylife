function renderTemplate(template, event) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => String(event?.[key] || ""));
}

export function materializeActions(rule, event) {
  return (rule.then || []).map((action) => {
    if (action.type === "create_task" && action.titleTemplate) {
      return {
        ...action,
        title: renderTemplate(action.titleTemplate, event)
      };
    }

    if (action.type === "append_note" && action.noteTemplate) {
      return {
        ...action,
        note: renderTemplate(action.noteTemplate, event)
      };
    }

    return { ...action };
  });
}
