import { useEffect, useRef } from "react";

const CYCLE_DURATION = 12000;
const COMPACT_BREAKPOINT = 980;

const COLORS = ["red", "orange", "yellow", "green", "lightblue", "blue", "white", "black"];

const COLOR_MAP = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  lightblue: "#38bdf8",
  blue: "#3b82f6",
  white: "#f8fafc",
  black: "#111827",
};

const COLOR_LABELS = {
  red: "Красный",
  orange: "Оранжевый",
  yellow: "Жёлтый",
  green: "Зелёный",
  lightblue: "Голубой",
  blue: "Синий",
  white: "Белый",
  black: "Чёрный",
};

const STATUS_LABELS = {
  idle: "Ожидание",
  closed: "Закрыт",
  open: "Готов",
  feed: "Подача",
  check: "Проверка",
  fix: "Коррекция",
  move: "Движение",
  burn: "Нагрев",
  detect: "Анализ",
  sort: "Сортировка",
  success: "Цель",
  reject: "Отброс",
  jam: "Затор",
  broken: "Авария",
};

function colorValue(colorKey) {
  return COLOR_MAP[colorKey] || "#64748b";
}

function colorLabel(colorKey) {
  return COLOR_LABELS[colorKey] || colorKey || "—";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function mixPoint(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),
    y: lerp(start.y, end.y, progress),
  };
}

function smooth(progress) {
  const value = clamp(progress, 0, 1);
  return value * value * (3 - 2 * value);
}

function blink(time, speed = 260) {
  return 0.45 + 0.55 * ((Math.sin(time / speed) + 1) / 2);
}

function getCanvasHeight(width) {
  if (width < 620) {
    return clamp(width * 1.18, 620, 760);
  }

  if (width < COMPACT_BREAKPOINT) {
    return clamp(width * 0.66, 520, 640);
  }

  return clamp(width * 0.32, 340, 400);
}

function getScale(width) {
  return clamp(width / 1180, 0.78, 1);
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function setFont(ctx, weight, size, scale = 1) {
  ctx.font = `${weight} ${Math.round(size * scale)}px Arial, Helvetica, sans-serif`;
}

function truncateText(ctx, text, maxWidth) {
  const value = String(text ?? "");

  if (ctx.measureText(value).width <= maxWidth) {
    return value;
  }

  let next = value;

  while (next.length > 1 && ctx.measureText(`${next}…`).width > maxWidth) {
    next = next.slice(0, -1);
  }

  return `${next}…`;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      return;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  });

  if (current) {
    lines.push(current);
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function drawPanel(ctx, x, y, width, height, radius = 22, fill = "#ffffff", stroke = "#d7e2ef") {
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.09)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.restore();
}

function drawPill(ctx, x, y, text, fill, color = "#0f172a", scale = 1) {
  ctx.save();
  setFont(ctx, "800", 10.5, scale);
  const width = ctx.measureText(text).width + 18 * scale;
  const height = 21 * scale;

  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + height / 2 + 0.5);
  ctx.restore();

  return width;
}

function getStatusVisual(status, time) {
  if (status === "jam" || status === "broken") {
    return {
      fill: `rgba(254, 226, 226, ${blink(time)})`,
      stroke: "#ef4444",
      accent: "#ef4444",
      pillFill: "#fecaca",
      pillColor: "#991b1b",
      active: true,
    };
  }

  if (status === "success") {
    return {
      fill: "#f0fdf4",
      stroke: "#86efac",
      accent: "#22c55e",
      pillFill: "#dcfce7",
      pillColor: "#166534",
      active: true,
    };
  }

  if (status === "reject") {
    return {
      fill: "#fff7ed",
      stroke: "#fed7aa",
      accent: "#f97316",
      pillFill: "#ffedd5",
      pillColor: "#9a3412",
      active: true,
    };
  }

  const activeStatuses = ["feed", "check", "fix", "move", "burn", "detect", "sort", "open"];

  if (activeStatuses.includes(status)) {
    return {
      fill: "#ffffff",
      stroke: "#bfdbfe",
      accent: "#3b82f6",
      pillFill: "#dbeafe",
      pillColor: "#1d4ed8",
      active: true,
    };
  }

  return {
    fill: "#ffffff",
    stroke: "#d7e2ef",
    accent: "#64748b",
    pillFill: "#e2e8f0",
    pillColor: "#334155",
    active: false,
  };
}

function drawProgressBar(ctx, x, y, width, height, value, color) {
  const percent = clamp(value, 0, 100);

  ctx.save();
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = "#e8eef6";
  ctx.fill();

  if (percent > 0) {
    roundedRect(ctx, x, y, Math.max(height, (width * percent) / 100), height, height / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();
}

function drawArrowHead(ctx, previous, last, headLength = 8) {
  const angle = Math.atan2(last.y - previous.y, last.x - previous.x);

  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(last.x - headLength * Math.cos(angle - Math.PI / 6), last.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(last.x - headLength * Math.cos(angle + Math.PI / 6), last.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawPolylineArrow(ctx, points, color = "#94a3b8", width = 3) {
  if (!points || points.length < 2) {
    return;
  }

  const last = points[points.length - 1];
  const previous = points[points.length - 2];

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.stroke();
  drawArrowHead(ctx, previous, last, 7.5 * Math.max(0.8, width / 3));
  ctx.restore();
}

function drawCap(ctx, x, y, options) {
  const {
    colorKey,
    edge = false,
    label = true,
    labelOpacity = 1,
    rotation = 0,
    scale = 1,
  } = options;

  const fill = colorValue(colorKey);
  const stroke = colorKey === "white" ? "#64748b" : "#111827";
  const mark = colorKey === "black" ? "#f8fafc" : "#0f172a";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  if (edge) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 5 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 13 * scale, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 7 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5 * scale, 0);
    ctx.lineTo(5 * scale, 0);
    ctx.strokeStyle = mark;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  if (label) {
    ctx.globalAlpha = labelOpacity;
    roundedRect(ctx, -8 * scale, -21 * scale, 16 * scale, 7 * scale, 3 * scale);
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawIcon(ctx, x, y, icon, color, active, scale) {
  const radius = active ? 22 * scale : 20 * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = active ? color : "#eef4fb";
  ctx.fill();
  ctx.strokeStyle = active ? "rgba(255,255,255,0.86)" : "#d7e2ef";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = active ? "#ffffff" : "#334155";
  setFont(ctx, "900", 17, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, x, y + 0.5);
  ctx.restore();
}

function getLayout(width, height) {
  const scale = getScale(width);
  const compact = width < COMPACT_BREAKPOINT;
  const pad = clamp(width * 0.022, 16, 28);
  const headerH = compact ? 68 : 60;
  const footerH = compact ? 54 : 42;

  if (compact) {
    const gap = 14;
    const panelY = headerH + 10;
    const panelH = height - panelY - footerH - 14;
    const inputH = 134;
    const lineH = 184;
    const inputW = (width - pad * 2 - gap) / 2;

    return {
      compact,
      scale,
      pad,
      headerH,
      footerH,
      input: { x: pad, y: panelY, w: inputW, h: inputH },
      output: { x: pad + inputW + gap, y: panelY, w: inputW, h: inputH },
      line: { x: pad, y: panelY + inputH + gap, w: width - pad * 2, h: Math.max(lineH, panelH - inputH - gap) },
    };
  }

  const gap = clamp(width * 0.018, 16, 24);
  const panelY = headerH + 12;
  const panelH = height - panelY - footerH - 14;
  const inputW = clamp(width * 0.17, 178, 212);
  const outputW = clamp(width * 0.23, 245, 292);
  const inputX = pad;
  const outputX = width - pad - outputW;
  const lineX = inputX + inputW + gap;
  const lineW = outputX - lineX - gap;

  return {
    compact,
    scale,
    pad,
    headerH,
    footerH,
    input: { x: inputX, y: panelY, w: inputW, h: panelH },
    line: { x: lineX, y: panelY, w: lineW, h: panelH },
    output: { x: outputX, y: panelY, w: outputW, h: panelH },
  };
}

function getDesktopParts(layout) {
  const { line, output, scale } = layout;
  const belt = {
    x: line.x + 28 * scale,
    y: line.y + line.h * 0.6,
    w: line.w - 56 * scale,
    h: 34 * scale,
  };

  const moduleW = clamp(line.w * 0.24, 116 * scale, 142 * scale);
  const moduleH = 62 * scale;
  const moduleY = line.y + 54 * scale;

  const camera1 = {
    x: line.x + 24 * scale,
    y: moduleY,
    w: moduleW,
    h: moduleH,
    title: "Камера 1",
    subtitle: "Ориентация",
  };

  const thermal = {
    x: line.x + line.w / 2 - moduleW / 2,
    y: moduleY,
    w: moduleW,
    h: moduleH,
    title: "Термоблок",
    subtitle: "Этикетка",
  };

  const camera2 = {
    x: line.x + line.w - moduleW - 24 * scale,
    y: moduleY,
    w: moduleW,
    h: moduleH,
    title: "Камера 2",
    subtitle: "Цвет",
  };

  const separator = {
    x: output.x + 16 * scale,
    y: output.y + 54 * scale,
    w: output.w - 32 * scale,
    h: 58 * scale,
  };

  const targetBin = {
    x: output.x + 16 * scale,
    y: output.y + 128 * scale,
    w: output.w - 32 * scale,
    h: 48 * scale,
  };

  const rejectBin = {
    x: output.x + 16 * scale,
    y: output.y + 184 * scale,
    w: output.w - 32 * scale,
    h: 48 * scale,
  };

  return {
    belt,
    camera1,
    thermal,
    camera2,
    separator,
    targetBin,
    rejectBin,
  };
}

function getCompactParts(layout) {
  const { input, output, line, scale } = layout;
  const belt = {
    x: line.x + 22 * scale,
    y: line.y + line.h * 0.6,
    w: line.w - 44 * scale,
    h: 32 * scale,
  };

  const moduleW = (line.w - 56 * scale) / 3;
  const moduleH = 58 * scale;
  const moduleY = line.y + 48 * scale;

  return {
    belt,
    camera1: {
      x: line.x + 16 * scale,
      y: moduleY,
      w: moduleW,
      h: moduleH,
      title: "Камера 1",
      subtitle: "Положение",
    },
    thermal: {
      x: line.x + 28 * scale + moduleW,
      y: moduleY,
      w: moduleW,
      h: moduleH,
      title: "Термоблок",
      subtitle: "Этикетка",
    },
    camera2: {
      x: line.x + 40 * scale + moduleW * 2,
      y: moduleY,
      w: moduleW,
      h: moduleH,
      title: "Камера 2",
      subtitle: "Цвет",
    },
    separator: {
      x: output.x + 12 * scale,
      y: output.y + 48 * scale,
      w: output.w - 24 * scale,
      h: 42 * scale,
    },
    targetBin: {
      x: output.x + 12 * scale,
      y: output.y + 96 * scale,
      w: output.w - 24 * scale,
      h: 34 * scale,
    },
    rejectBin: {
      x: output.x + 12 * scale,
      y: output.y + 136 * scale,
      w: output.w - 24 * scale,
      h: 34 * scale,
    },
    inputLevel: {
      x: input.x + 12 * scale,
      y: input.y + 70 * scale,
      w: input.w - 24 * scale,
      h: input.h - 108 * scale,
    },
  };
}

function getParts(layout) {
  return layout.compact ? getCompactParts(layout) : getDesktopParts(layout);
}

function getPoints(layout) {
  const parts = getParts(layout);
  const { input, output, line, scale } = layout;
  const { belt, camera1, thermal, camera2, separator, targetBin, rejectBin } = parts;

  if (layout.compact) {
    return {
      feedStart: { x: input.x + input.w, y: input.y + input.h * 0.54 },
      beltStart: { x: belt.x + 18 * scale, y: belt.y + belt.h / 2 },
      camera1: { x: camera1.x + camera1.w / 2, y: belt.y + belt.h / 2 },
      thermal: { x: thermal.x + thermal.w / 2, y: belt.y + belt.h / 2 },
      camera2: { x: camera2.x + camera2.w / 2, y: belt.y + belt.h / 2 },
      separator: { x: output.x, y: output.y + output.h * 0.54 },
      target: { x: targetBin.x + targetBin.w / 2, y: targetBin.y + targetBin.h / 2 },
      reject: { x: rejectBin.x + rejectBin.w / 2, y: rejectBin.y + rejectBin.h / 2 },
    };
  }

  return {
    feedStart: { x: input.x + input.w, y: input.y + input.h * 0.58 },
    beltStart: { x: belt.x + 18 * scale, y: belt.y + belt.h / 2 },
    camera1: { x: camera1.x + camera1.w / 2, y: belt.y + belt.h / 2 },
    thermal: { x: thermal.x + thermal.w / 2, y: belt.y + belt.h / 2 },
    camera2: { x: camera2.x + camera2.w / 2, y: belt.y + belt.h / 2 },
    beltEnd: { x: belt.x + belt.w - 16 * scale, y: belt.y + belt.h / 2 },
    separator: { x: separator.x + separator.w / 2, y: separator.y + separator.h / 2 },
    target: { x: targetBin.x + 26 * scale, y: targetBin.y + targetBin.h / 2 },
    reject: { x: rejectBin.x + 26 * scale, y: rejectBin.y + rejectBin.h / 2 },
    lineExit: { x: line.x + line.w, y: belt.y + belt.h / 2 },
  };
}

function phaseByTime(cycleTime) {
  if (cycleTime < 1500) return { name: "feed", progress: cycleTime / 1500 };
  if (cycleTime < 3100) return { name: "orientation", progress: (cycleTime - 1500) / 1600 };
  if (cycleTime < 5600) return { name: "move", progress: (cycleTime - 3100) / 2500 };
  if (cycleTime < 7200) return { name: "burn", progress: (cycleTime - 5600) / 1600 };
  if (cycleTime < 8800) return { name: "detect", progress: (cycleTime - 7200) / 1600 };
  if (cycleTime < 10300) return { name: "sort", progress: (cycleTime - 8800) / 1500 };
  return { name: "drop", progress: (cycleTime - 10300) / 1700 };
}

function cyclePayload(selectedColor, cycleIndex) {
  const sequence = [selectedColor, ...COLORS.filter((color) => color !== selectedColor)];
  const detectedColor = sequence[cycleIndex % sequence.length];

  return {
    detectedColor,
    success: detectedColor === selectedColor,
    needsFix: cycleIndex % 3 === 1,
  };
}

function getDerivedState(rawState, time, sessionRef, layout) {
  const selectedColor = rawState.selectedColor || "blue";
  const mode = rawState.mode || "idle";

  if (sessionRef.current.prevMode !== mode || sessionRef.current.prevColor !== selectedColor) {
    sessionRef.current.prevMode = mode;
    sessionRef.current.prevColor = selectedColor;
    sessionRef.current.success = 0;
    sessionRef.current.reject = 0;
    sessionRef.current.lastCycle = -1;
  }

  const error =
    rawState.hopper === "jam" ? "hopper" :
    rawState.conveyor === "broken" ? "conveyor" :
    rawState.pusher === "broken" ? "separator" :
    rawState.vision === "broken" ? "camera2" :
    null;

  const points = getPoints(layout);

  if (mode !== "running" || error) {
    const errorText = {
      hopper: "Затор во входном баке",
      conveyor: "Авария конвейера",
      separator: "Неисправность разделителя",
      camera2: "Ошибка машинного зрения",
    };

    return {
      selectedColor,
      currentStage: error ? errorText[error] : "Ожидание запуска",
      currentCapColor: "—",
      detectedColor: error === "camera2" ? "Ошибка" : "—",
      orientation: "—",
      error,
      phaseName: "idle",
      payload: { detectedColor: selectedColor, success: true, needsFix: false },
      cap: error === "conveyor" ? { ...points.camera1, colorKey: selectedColor, label: true } : null,
      counts: {
        input: error ? 96 : 120,
        success: sessionRef.current.success,
        reject: sessionRef.current.reject,
      },
      temp: error ? 62 : 24,
      message: error ? "Требуется вмешательство оператора" : "Система остановлена",
    };
  }

  const cycleIndex = Math.floor(time / CYCLE_DURATION);
  const cycleTime = time % CYCLE_DURATION;
  const phase = phaseByTime(cycleTime);
  const payload = cyclePayload(selectedColor, cycleIndex);

  if (sessionRef.current.lastCycle !== cycleIndex) {
    if (sessionRef.current.lastCycle !== -1) {
      const previous = cyclePayload(selectedColor, cycleIndex - 1);

      if (previous.success) {
        sessionRef.current.success += 1;
      } else {
        sessionRef.current.reject += 1;
      }
    }

    sessionRef.current.lastCycle = cycleIndex;
  }

  let cap = null;
  let currentStage = "Идёт сортировка";
  let orientation = "Горизонтально";
  let detectedColor = "—";
  let temp = 84;

  if (phase.name === "feed") {
    cap = {
      ...mixPoint(points.feedStart, points.beltStart, smooth(phase.progress)),
      colorKey: payload.detectedColor,
      label: true,
    };
    currentStage = "Входной бак подаёт одну крышку";
  }

  if (phase.name === "orientation") {
    const edge = payload.needsFix && phase.progress < 0.55;
    cap = {
      ...points.camera1,
      colorKey: payload.detectedColor,
      edge,
      label: true,
    };
    currentStage = edge ? "Камера 1 обнаружила крышку на ребре" : "Крышка лежит правильно";
    orientation = edge ? "На ребре" : "Горизонтально";
  }

  if (phase.name === "move") {
    cap = {
      ...mixPoint(points.camera1, points.thermal, smooth(phase.progress)),
      colorKey: payload.detectedColor,
      label: true,
      rotation: time / 180,
    };
    currentStage = "Крышка движется по конвейеру";
  }

  if (phase.name === "burn") {
    cap = {
      ...points.thermal,
      colorKey: payload.detectedColor,
      label: true,
      labelOpacity: 1 - phase.progress,
    };
    currentStage = "Термоблок снимает этикетку";
    temp = Math.round(280 + 140 * Math.sin(phase.progress * Math.PI));
  }

  if (phase.name === "detect") {
    cap = {
      ...mixPoint(points.thermal, points.camera2, smooth(phase.progress)),
      colorKey: payload.detectedColor,
      label: false,
    };
    currentStage = "Камера 2 определяет цвет";
    detectedColor = colorLabel(payload.detectedColor);
    temp = 96;
  }

  if (phase.name === "sort") {
    cap = {
      ...mixPoint(points.camera2, points.separator, smooth(phase.progress)),
      colorKey: payload.detectedColor,
      label: false,
    };
    currentStage = payload.success
      ? "Разделитель направляет крышку в целевой бак"
      : "Разделитель направляет крышку в бак отброса";
    detectedColor = colorLabel(payload.detectedColor);
    temp = 76;
  }

  if (phase.name === "drop") {
    const destination = payload.success ? points.target : points.reject;
    cap = {
      ...mixPoint(points.separator, destination, smooth(phase.progress)),
      colorKey: payload.detectedColor,
      label: false,
    };
    currentStage = payload.success
      ? "Крышка попадает в бак нужного цвета"
      : "Крышка попадает в бак прочих крышек";
    detectedColor = colorLabel(payload.detectedColor);
    temp = 48;
  }

  const processed = sessionRef.current.success + sessionRef.current.reject;

  return {
    selectedColor,
    currentStage,
    currentCapColor: colorLabel(payload.detectedColor),
    detectedColor,
    orientation,
    error: null,
    phaseName: phase.name,
    payload,
    cap,
    counts: {
      input: Math.max(0, 120 - processed),
      success: sessionRef.current.success,
      reject: sessionRef.current.reject,
    },
    temp,
    message: "Автоматическая сортировка активна",
  };
}

function drawBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f8fbff");
  gradient.addColorStop(0.55, "#f6f9fd");
  gradient.addColorStop(1, "#eef5ff");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.32;

  for (let index = 0; index < Math.ceil(width / 76); index += 1) {
    ctx.beginPath();
    ctx.arc(44 + index * 76, 52 + Math.sin(index) * 10, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#bfdbfe";
    ctx.fill();
  }

  ctx.restore();
}

function drawHeader(ctx, width, layout, state) {
  const { scale, pad } = layout;
  const title = width < 560 ? "АСУ сортировки крышек" : "АСУ сортировки пластиковых крышек";

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", width < 560 ? 18 : 23, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, pad, 14);

  ctx.fillStyle = "#475569";
  setFont(ctx, "500", 12.5, scale);
  ctx.fillText(truncateText(ctx, state.message, width * 0.52), pad + 1, width < 560 ? 41 : 46);

  const pillText = `Цель: ${colorLabel(state.selectedColor)}`;
  setFont(ctx, "800", 10.5, scale);
  const pillWidth = ctx.measureText(pillText).width + 18 * scale;
  const pillX = width - pad - pillWidth - 28 * scale;

  drawPill(ctx, pillX, 16, pillText, "#dbeafe", "#1d4ed8", scale);

  ctx.beginPath();
  ctx.arc(width - pad - 10 * scale, 26.5, 8.5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = colorValue(state.selectedColor);
  ctx.fill();
  ctx.strokeStyle = state.selectedColor === "white" ? "#64748b" : "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawInputPanel(ctx, layout, state, time) {
  const { input, scale } = layout;
  const status = state.error === "hopper" ? "jam" : state.phaseName === "feed" ? "feed" : state.phaseName === "idle" ? "closed" : "open";
  const visual = getStatusVisual(status, time);
  const level = clamp(state.counts.input / 120, 0, 1);

  drawPanel(ctx, input.x, input.y, input.w, input.h, 20 * scale, visual.fill, visual.stroke);
  drawIcon(ctx, input.x + 28 * scale, input.y + 30 * scale, "▾", visual.accent, visual.active, scale);

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 15, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Входной бак", input.x + 60 * scale, input.y + 18 * scale);

  ctx.fillStyle = "#64748b";
  setFont(ctx, "500", 11.5, scale);
  drawWrappedText(ctx, "Запас крышек", input.x + 60 * scale, input.y + 41 * scale, input.w - 72 * scale, 12.5 * scale, 2);

  const meterX = input.x + 16 * scale;
  const meterY = input.y + 80 * scale;
  const meterW = input.w - 32 * scale;
  const meterH = Math.max(44 * scale, input.h - 126 * scale);

  roundedRect(ctx, meterX, meterY, meterW, meterH, 14 * scale);
  ctx.fillStyle = "#edf4ff";
  ctx.fill();
  ctx.strokeStyle = "#d7e2ef";
  ctx.lineWidth = 1;
  ctx.stroke();

  const fillHeight = (meterH - 8 * scale) * level;

  roundedRect(ctx, meterX + 4 * scale, meterY + meterH - 4 * scale - fillHeight, meterW - 8 * scale, fillHeight, 11 * scale);
  ctx.fillStyle = "rgba(96, 165, 250, 0.28)";
  ctx.fill();

  roundedRect(ctx, meterX + 4 * scale, meterY + 4 * scale, meterW - 8 * scale, 12 * scale, 8 * scale);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  ctx.fillStyle = "#334155";
  setFont(ctx, "900", 18, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(level * 100)}%`, meterX + meterW / 2, meterY + meterH / 2 - 2 * scale);

  ctx.fillStyle = "#64748b";
  setFont(ctx, "800", 10.5, scale);
  ctx.fillText("заполнено", meterX + meterW / 2, meterY + meterH / 2 + 17 * scale);

  drawPill(ctx, input.x + 14 * scale, input.y + input.h - 31 * scale, STATUS_LABELS[status], visual.pillFill, visual.pillColor, scale);

  ctx.fillStyle = "#334155";
  setFont(ctx, "900", 11.5, scale);
  ctx.textAlign = "right";
  ctx.fillText(`${state.counts.input} шт`, input.x + input.w - 14 * scale, input.y + input.h - 20 * scale);
  ctx.restore();
}

function getModuleStatus(moduleKey, state) {
  if (moduleKey === "camera1") {
    if (state.payload.needsFix && state.phaseName === "orientation") return "fix";
    if (state.phaseName === "orientation") return "check";
    return "idle";
  }

  if (moduleKey === "thermal") {
    if (state.phaseName === "burn") return "burn";
    return "idle";
  }

  if (moduleKey === "camera2") {
    if (state.error === "camera2") return "broken";
    if (state.phaseName === "detect") return state.payload.success ? "success" : "reject";
    return "idle";
  }

  return "idle";
}

function drawMiniModule(ctx, module, icon, status, value, time, scale) {
  const visual = getStatusVisual(status, time);

  drawPanel(ctx, module.x, module.y, module.w, module.h, 16 * scale, visual.fill, visual.stroke);
  drawIcon(ctx, module.x + 25 * scale, module.y + 29 * scale, icon, visual.accent, visual.active, scale * 0.86);

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 12.5, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(truncateText(ctx, module.title, module.w - 56 * scale), module.x + 51 * scale, module.y + 13 * scale);

  ctx.fillStyle = "#64748b";
  setFont(ctx, "600", 10.5, scale);
  ctx.fillText(truncateText(ctx, module.subtitle, module.w - 56 * scale), module.x + 51 * scale, module.y + 34 * scale);

  if (value) {
    ctx.fillStyle = "#334155";
    setFont(ctx, "900", 10.5, scale);
    ctx.textAlign = "right";
    ctx.fillText(value, module.x + module.w - 11 * scale, module.y + module.h - 11 * scale);
  }

  ctx.restore();
}

function drawBelt(ctx, belt, active, broken, time, scale) {
  ctx.save();
  roundedRect(ctx, belt.x, belt.y, belt.w, belt.h, belt.h / 2);
  ctx.fillStyle = broken ? `rgba(239, 68, 68, ${blink(time)})` : "#cbd5e1";
  ctx.fill();
  ctx.strokeStyle = broken ? "#ef4444" : "#b8c6d6";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  roundedRect(ctx, belt.x, belt.y, belt.w, belt.h, belt.h / 2);
  ctx.clip();

  const shift = active ? (time / 9) % (32 * scale) : 0;

  for (let x = belt.x - 36 * scale; x < belt.x + belt.w + 60 * scale; x += 32 * scale) {
    ctx.fillStyle = "rgba(71, 85, 105, 0.22)";
    ctx.fillRect(x + shift, belt.y + 4 * scale, 12 * scale, belt.h - 8 * scale);
  }

  ctx.restore();
}

function drawFire(ctx, x, y, time, active, scale) {
  if (!active) return;

  ctx.save();

  for (let index = 0; index < 4; index += 1) {
    const flameX = x + index * 13 * scale;
    const height = (15 + 10 * ((Math.sin(time / 150 + index) + 1) / 2)) * scale;

    ctx.beginPath();
    ctx.moveTo(flameX, y);
    ctx.quadraticCurveTo(flameX + 6 * scale, y - height, flameX + 12 * scale, y);
    ctx.quadraticCurveTo(flameX + 6 * scale, y + 7 * scale, flameX, y);
    ctx.fillStyle = index % 2 === 0 ? "#fb923c" : "#facc15";
    ctx.fill();
  }

  ctx.restore();
}

function drawProcessingPanel(ctx, layout, state, time) {
  const { line, scale } = layout;
  const parts = getParts(layout);
  const active = !state.error && state.phaseName !== "idle";
  const conveyorBroken = state.error === "conveyor";

  drawPanel(ctx, line.x, line.y, line.w, line.h, 22 * scale, "rgba(255,255,255,0.92)", active ? "#bfdbfe" : "#d7e2ef");

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 15, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Линия обработки", line.x + 18 * scale, line.y + 16 * scale);

  drawPill(
    ctx,
    line.x + line.w - 116 * scale,
    line.y + 14 * scale,
    conveyorBroken ? "АВАРИЯ" : active ? "В РАБОТЕ" : "ОЖИДАНИЕ",
    conveyorBroken ? "#fecaca" : active ? "#dcfce7" : "#e2e8f0",
    conveyorBroken ? "#991b1b" : active ? "#166534" : "#334155",
    scale,
  );
  ctx.restore();

  drawMiniModule(ctx, parts.camera1, "◉", getModuleStatus("camera1", state), state.orientation !== "—" ? state.orientation : "", time, scale);
  drawMiniModule(ctx, parts.thermal, "♨", getModuleStatus("thermal", state), `${state.temp} °C`, time, scale);
  drawMiniModule(ctx, parts.camera2, "◎", getModuleStatus("camera2", state), state.detectedColor !== "—" ? state.detectedColor : "", time, scale);

  drawBelt(ctx, parts.belt, active, conveyorBroken, time, scale);

  const points = getPoints(layout);
  const normal = active ? "#3b82f6" : "#cbd5e1";
  const danger = conveyorBroken ? "#ef4444" : normal;

  drawPolylineArrow(ctx, [
    { x: layout.input.x + layout.input.w, y: layout.input.y + layout.input.h * 0.58 },
    { x: line.x - 12 * scale, y: layout.input.y + layout.input.h * 0.58 },
    { x: line.x - 12 * scale, y: parts.belt.y + parts.belt.h / 2 },
    { x: parts.belt.x, y: parts.belt.y + parts.belt.h / 2 },
  ], state.error === "hopper" ? "#ef4444" : normal, 3 * scale);

  drawPolylineArrow(ctx, [
    { x: parts.belt.x + parts.belt.w, y: parts.belt.y + parts.belt.h / 2 },
    { x: layout.output.x - 12 * scale, y: parts.belt.y + parts.belt.h / 2 },
    { x: layout.output.x - 12 * scale, y: points.separator.y },
    { x: layout.output.x, y: points.separator.y },
  ], danger, 3 * scale);

  if (state.payload.needsFix && state.phaseName === "orientation") {
    ctx.save();
    ctx.globalAlpha = blink(time, 160);
    drawPolylineArrow(ctx, [
      { x: parts.camera1.x + parts.camera1.w - 20 * scale, y: parts.camera1.y + parts.camera1.h - 12 * scale },
      { x: points.camera1.x + 12 * scale, y: points.camera1.y },
    ], "#38bdf8", 3.5 * scale);
    ctx.fillStyle = "#0284c7";
    setFont(ctx, "900", 10, scale);
    ctx.fillText("воздух", parts.camera1.x + parts.camera1.w - 58 * scale, parts.camera1.y + parts.camera1.h - 13 * scale);
    ctx.restore();
  }

  drawFire(ctx, parts.thermal.x + parts.thermal.w / 2 - 23 * scale, parts.belt.y - 6 * scale, time, state.phaseName === "burn", scale);
}

function drawBinRow(ctx, block, title, count, percent, color, scale) {
  drawPanel(ctx, block.x, block.y, block.w, block.h, 15 * scale, "#ffffff", "#d7e2ef");

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 12.5, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(truncateText(ctx, title, block.w - 24 * scale), block.x + 12 * scale, block.y + 9 * scale);

  ctx.fillStyle = "#64748b";
  setFont(ctx, "800", 10, scale);
  ctx.fillText(`${count} шт`, block.x + 12 * scale, block.y + 28 * scale);

  drawProgressBar(ctx, block.x + 12 * scale, block.y + block.h - 13 * scale, block.w - 24 * scale, 7 * scale, percent, color);
  ctx.restore();
}

function drawOutputRoutes(ctx, layout, active) {
  const { scale } = layout;
  const parts = getParts(layout);
  const routeColor = active ? "#3b82f6" : "#cbd5e1";

  ctx.save();
  ctx.globalAlpha = active ? 0.72 : 0.35;

  const start = {
    x: parts.separator.x + parts.separator.w / 2,
    y: parts.separator.y + parts.separator.h + 2 * scale,
  };

  const targetEnd = {
    x: parts.targetBin.x + parts.targetBin.w * 0.2,
    y: parts.targetBin.y + 6 * scale,
  };

  const rejectEnd = {
    x: parts.rejectBin.x + parts.rejectBin.w * 0.2,
    y: parts.rejectBin.y + 6 * scale,
  };

  const splitY = start.y + 14 * scale;

  drawPolylineArrow(ctx, [
    start,
    { x: start.x, y: splitY },
    { x: targetEnd.x, y: splitY },
    targetEnd,
  ], routeColor, 2.2 * scale);

  drawPolylineArrow(ctx, [
    start,
    { x: start.x, y: splitY },
    { x: rejectEnd.x, y: splitY },
    rejectEnd,
  ], routeColor, 2.2 * scale);

  ctx.restore();
}

function drawOutputPanel(ctx, layout, state, time) {
  const { output, scale } = layout;
  const parts = getParts(layout);
  const separatorStatus = state.error === "separator" ? "broken" : ["sort", "drop"].includes(state.phaseName) ? "sort" : "idle";
  const separatorVisual = getStatusVisual(separatorStatus, time);
  const active = !state.error && state.phaseName !== "idle";

  drawPanel(ctx, output.x, output.y, output.w, output.h, 22 * scale, "rgba(255,255,255,0.94)", separatorVisual.stroke);

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 15, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Выход", output.x + 18 * scale, output.y + 16 * scale);
  ctx.restore();

  // Сначала рисуем маршруты, потом карточки. Так линии не перекрывают текст и шкалы баков.
  drawOutputRoutes(ctx, layout, active);

  drawPanel(ctx, parts.separator.x, parts.separator.y, parts.separator.w, parts.separator.h, 16 * scale, separatorVisual.fill, separatorVisual.stroke);
  drawIcon(ctx, parts.separator.x + 25 * scale, parts.separator.y + parts.separator.h / 2, "↧", separatorVisual.accent, separatorVisual.active, scale * 0.86);

  ctx.save();
  ctx.fillStyle = "#0f172a";
  setFont(ctx, "900", 12.8, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Разделитель", parts.separator.x + 50 * scale, parts.separator.y + 11 * scale);

  ctx.fillStyle = "#64748b";
  setFont(ctx, "600", 10.5, scale);
  ctx.fillText(state.payload.success ? "Маршрут: цель" : "Маршрут: отброс", parts.separator.x + 50 * scale, parts.separator.y + 31 * scale);

  const pillText = STATUS_LABELS[separatorStatus];
  setFont(ctx, "800", 10.5, scale);
  const pillWidth = ctx.measureText(pillText).width + 18 * scale;

  drawPill(
    ctx,
    parts.separator.x + parts.separator.w - pillWidth - 10 * scale,
    parts.separator.y + parts.separator.h - 27 * scale,
    pillText,
    separatorVisual.pillFill,
    separatorVisual.pillColor,
    scale,
  );
  ctx.restore();

  drawBinRow(ctx, parts.targetBin, "Бак целевого цвета", state.counts.success, state.counts.success * 4, colorValue(state.selectedColor), scale);
  drawBinRow(ctx, parts.rejectBin, "Бак прочих крышек", state.counts.reject, state.counts.reject * 4, "#94a3b8", scale);
}

function drawFooter(ctx, width, height, layout, state) {
  const { pad, scale } = layout;
  const footerX = pad;
  const footerY = height - 42;
  const footerW = width - pad * 2;
  const footerH = 30;

  drawPanel(ctx, footerX, footerY, footerW, footerH, 14, "rgba(255,255,255,0.94)", "#d7e2ef");

  ctx.save();
  ctx.fillStyle = "#64748b";
  setFont(ctx, "700", 10.5, scale);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Текущий этап:", footerX + 13 * scale, footerY + footerH / 2);

  ctx.fillStyle = state.error ? "#b91c1c" : "#0f172a";
  setFont(ctx, "900", 12, scale);
  ctx.fillText(truncateText(ctx, state.currentStage, footerW - 128 * scale), footerX + 102 * scale, footerY + footerH / 2);
  ctx.restore();
}

function drawScene(ctx, width, height, rawState, time, sessionRef) {
  const layout = getLayout(width, height);
  const state = getDerivedState(rawState, time, sessionRef, layout);
  const { scale } = layout;

  drawBackground(ctx, width, height);
  drawHeader(ctx, width, layout, state);
  drawInputPanel(ctx, layout, state, time);
  drawProcessingPanel(ctx, layout, state, time);
  drawOutputPanel(ctx, layout, state, time);

  if (state.cap) {
    drawCap(ctx, state.cap.x, state.cap.y, {
      colorKey: state.cap.colorKey,
      edge: state.cap.edge,
      label: state.cap.label,
      labelOpacity: state.cap.labelOpacity ?? 1,
      rotation: state.cap.rotation || 0,
      scale,
    });
  }

  drawFooter(ctx, width, height, layout, state);

  return state;
}

function MachineScheme({ schemeState, onInfoChange }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const schemeStateRef = useRef(schemeState);
  const lastInfoRef = useRef("");
  const canvasSizeRef = useRef({ width: 900, height: 360, dpr: 1 });
  const sessionRef = useRef({
    prevMode: schemeState?.mode || "idle",
    prevColor: schemeState?.selectedColor || "blue",
    success: 0,
    reject: 0,
    lastCycle: -1,
  });

  useEffect(() => {
    schemeStateRef.current = schemeState;
  }, [schemeState]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.floor(getCanvasHeight(width));
      const dpr = window.devicePixelRatio || 1;

      canvasSizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(wrapper);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");

    const render = (time) => {
      const { width, height, dpr } = canvasSizeRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const derivedState = drawScene(
        ctx,
        width,
        height,
        schemeStateRef.current || {},
        time,
        sessionRef,
      );

      if (onInfoChange) {
        const info = {
          currentStage: derivedState.currentStage,
          currentCapColor: derivedState.currentCapColor,
          detectedColor: derivedState.detectedColor,
          orientation: derivedState.orientation,
        };

        const infoKey = JSON.stringify(info);

        if (infoKey !== lastInfoRef.current) {
          lastInfoRef.current = infoKey;
          onInfoChange(info);
        }
      }

      animationRef.current = window.requestAnimationFrame(render);
    };

    animationRef.current = window.requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onInfoChange]);

  return (
    <div className="machine-scheme" ref={wrapperRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}

MachineScheme.defaultProps = {
  schemeState: {
    mode: "idle",
    hopper: "closed",
    conveyor: "stopped",
    pusher: "idle",
    vision: "idle",
    selectedColor: "blue",
    detectedColor: null,
    message: "Система остановлена",
  },
  onInfoChange: undefined,
};

export default MachineScheme;
