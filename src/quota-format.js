function remainingPercent(used) {
  return Math.max(0, Math.min(100, Math.round(100 - used)));
}
function validWindow(value) {
  return value != null && Number.isFinite(value.usedPercent);
}
function isCodexLimit(value) {
  return value?.limitId == null || value.limitId === 'codex';
}
function formatResetTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}
