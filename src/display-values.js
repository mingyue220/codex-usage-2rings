function quotaTone(percent) {
  return !Number.isFinite(percent) ? 'muted' : percent < 10 ? 'danger' : percent <= 50 ? 'warning' : 'normal';
}
function unavailableValue(_current, title = 'Codex 用量暂不可用，正在重试') {
  return {
    mode: 'dual', stale: true, title,
    rings: ['5h', 'Week'].map((label, index) => ({
      key: index ? 'weekly' : 'five-hour', label, percent: null, tone: 'muted', title: `${label}：暂不可用`
    }))
  };
}
function formatRateLimits(response) {
  const snapshot = pickCodexSnapshot(response);
  const windows = [snapshot?.primary, snapshot?.secondary].filter(Boolean);
  function ring(key, label, match) {
    const window = windows.find(match);
    const percent = validWindow(window) ? remainingPercent(window.usedPercent) : null;
    const reset = formatResetTime(window?.resetsAt);
    return {
      key, label, percent, tone: quotaTone(percent),
      title: `${label}：${percent === null ? '暂不可用' : `剩余 ${percent}%`}${reset ? `，${reset} 重置` : ''}`
    };
  }
  const rings = [
    ring('five-hour', '5h', w => w.windowDurationMins === 300),
    ring('weekly', 'Week', w => w.windowDurationMins === 10080)
  ];
  return { mode: 'dual', rings, title: rings.map(r => r.title).join('\n') };
}
