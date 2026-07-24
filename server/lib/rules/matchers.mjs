function readFieldValue(field, event, workspaceId) {
  if (field === "workspaceId") {
    return workspaceId;
  }
  return event?.[field];
}

function includesMatch(actual, expected) {
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  return String(actual || "").includes(String(expected || ""));
}

function equalsMatch(actual, expected) {
  return String(actual || "") === String(expected || "");
}

export function matchCondition(condition, event, workspaceId) {
  if (!condition) {
    return true;
  }

  if (Array.isArray(condition.all)) {
    return condition.all.every((item) => matchCondition(item, event, workspaceId));
  }

  if (Array.isArray(condition.any)) {
    return condition.any.some((item) => matchCondition(item, event, workspaceId));
  }

  const actual = readFieldValue(condition.field, event, workspaceId);
  if (condition.op === "includes") {
    return includesMatch(actual, condition.value);
  }
  if (condition.op === "equals") {
    return equalsMatch(actual, condition.value);
  }

  return false;
}
