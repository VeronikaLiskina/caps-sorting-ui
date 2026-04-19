import { useEffect, useRef } from "react";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 250;

const COLOR_MAP = {
  red: "#e74c3c",
  orange: "#f39c12",
  yellow: "#f1c40f",
  green: "#2ecc71",
  lightblue: "#5dade2",
  blue: "#3498db",
  white: "#f5f6fa",
  black: "#2d3436",
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

function getColorValue(colorKey) {
  return COLOR_MAP[colorKey] || "#94a3b8";
}

function getColorLabel(colorKey) {
  return COLOR_LABELS[colorKey] || colorKey || "—";
}

function getBlinkAlpha(time, speed = 260) {
  return 0.45 + 0.55 * ((Math.sin(time / speed) + 1) / 2);
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawBlock(ctx, block, options = {}) {
  const {
    fill = "#ffffff",
    stroke = "#94a3b8",
    lineWidth = 2,
    accentColor = null,
  } = options;

  ctx.save();
  drawRoundedRect(ctx, block.x, block.y, block.w, block.h, 12);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fill();
  ctx.stroke();

  if (accentColor) {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(block.x + block.w - 14, block.y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(block.label, block.x + block.w / 2, block.y + block.h / 2);
  ctx.restore();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color = "#94a3b8") {
  const headLength = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCap(ctx, x, y, colorKey, rotation = 0) {
  const fillColor = getColorValue(colorKey);
  const strokeColor = colorKey === "white" ? "#64748b" : "#1f2937";
  const markColor = colorKey === "black" ? "#f8fafc" : "#0f172a";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = markColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.stroke();

  ctx.restore();
}

function drawStaticLayout(ctx, schemeState, time) {
  const selectedColor = schemeState.selectedColor || "blue";
  const blinkRed = `rgba(220, 38, 38, ${getBlinkAlpha(time)})`;
  const blinkYellow = `rgba(245, 158, 11, ${getBlinkAlpha(time)})`;
  const blinkGreen = `rgba(22, 163, 74, ${getBlinkAlpha(time)})`;

  const hopper = { x: 26, y: 40, w: 96, h: 54, label: "Входной бак" };
  const conveyor = { x: 158, y: 114, w: 292, h: 18, label: "Конвейер" };
  const pusher = { x: 478, y: 102, w: 76, h: 44, label: "Толкатель" };
  const vision = { x: 586, y: 78, w: 100, h: 54, label: "Камера" };
  const targetBin = { x: 458, y: 182, w: 112, h: 44, label: "Бак цели" };
  const rejectBin = { x: 590, y: 182, w: 112, h: 44, label: "Отброс" };

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#0f172a";
  ctx.font = "600 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Схема сортировки крышек", 20, 22);

  ctx.font = "12px Arial";
  ctx.fillStyle = "#334155";
  ctx.fillText(`Режим: ${schemeState.message || "—"}`, 20, 238);
  ctx.fillText("Целевой цвет:", 264, 238);

  ctx.beginPath();
  ctx.arc(346, 234, 6, 0, Math.PI * 2);
  ctx.fillStyle = getColorValue(selectedColor);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.fillText(getColorLabel(selectedColor), 360, 238);

  drawArrow(ctx, 122, 66, 176, 116);
  drawArrow(ctx, 450, 123, 478, 123);
  drawArrow(ctx, 554, 123, 586, 105);
  drawArrow(ctx, 636, 132, 636, 176);
  drawArrow(ctx, 618, 132, 514, 176);

  const hopperFill = schemeState.hopper === "jam" ? blinkRed : "#ffffff";
  drawBlock(ctx, hopper, {
    fill: hopperFill,
    stroke: schemeState.hopper === "jam" ? "#dc2626" : "#94a3b8",
  });

  ctx.save();
  drawRoundedRect(ctx, conveyor.x, conveyor.y, conveyor.w, conveyor.h, 10);
  ctx.fillStyle = schemeState.conveyor === "broken" ? blinkRed : "#e2e8f0";
  ctx.strokeStyle = schemeState.conveyor === "broken" ? "#dc2626" : "#94a3b8";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#0f172a";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(conveyor.label, conveyor.x + conveyor.w / 2, conveyor.y - 12);

  const pusherShift = schemeState.pusher === "pushing" ? 6 * Math.sin(time / 130) : 0;
  drawBlock(ctx, { ...pusher, x: pusher.x + pusherShift }, {
    fill: schemeState.pusher === "broken" ? blinkRed : "#ffffff",
    stroke: schemeState.pusher === "broken" ? "#dc2626" : "#94a3b8",
  });

  let visionFill = "#ffffff";
  let visionStroke = "#94a3b8";

  if (schemeState.vision === "checking") {
    visionFill = blinkYellow;
    visionStroke = "#f59e0b";
  }

  if (schemeState.vision === "success") {
    visionFill = blinkGreen;
    visionStroke = "#16a34a";
  }

  if (schemeState.vision === "fail" || schemeState.vision === "broken") {
    visionFill = blinkRed;
    visionStroke = "#dc2626";
  }

  drawBlock(ctx, vision, {
    fill: visionFill,
    stroke: visionStroke,
    accentColor: getColorValue(selectedColor),
  });

  drawBlock(ctx, targetBin, {
    fill: "#ffffff",
    stroke: "#94a3b8",
    accentColor: getColorValue(selectedColor),
  });

  drawBlock(ctx, rejectBin, {
    fill: "#ffffff",
    stroke: "#94a3b8",
  });

  return {
    hopper,
    conveyor,
    vision,
    targetBin,
    rejectBin,
  };
}

function drawDynamicEffects(ctx, schemeState, time, layout) {
  const selectedColor = schemeState.selectedColor || "blue";
  const detectedColor = schemeState.detectedColor || selectedColor;
  const isRunning = schemeState.conveyor === "moving";

  if (schemeState.hopper === "pouring") {
    for (let index = 0; index < 4; index += 1) {
      const localTime = (time / 10 + index * 18) % 56;
      const x = 92 + Math.sin((time + index * 140) / 180) * 6;
      const y = 82 + localTime;
      drawCap(ctx, x, y, selectedColor, 0);
    }
  }

  if (isRunning) {
    for (let index = 0; index < 5; index += 1) {
      const shift = ((time / 8) + index * 54) % 250;
      const x = layout.conveyor.x + 18 + shift;
      const y = layout.conveyor.y + layout.conveyor.h / 2;
      drawCap(ctx, x, y, index % 2 === 0 ? selectedColor : detectedColor, 0);
    }
  }

  if (schemeState.vision === "success") {
    drawCap(
      ctx,
      layout.targetBin.x + layout.targetBin.w / 2,
      layout.targetBin.y - 14,
      detectedColor,
      0,
    );
  }

  if (schemeState.vision === "fail") {
    drawCap(
      ctx,
      layout.rejectBin.x + layout.rejectBin.w / 2,
      layout.rejectBin.y - 14,
      detectedColor,
      0,
    );
  }
}

function MachineScheme({ schemeState, onInfoChange }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const schemeStateRef = useRef(schemeState);

  useEffect(() => {
    schemeStateRef.current = schemeState;
  }, [schemeState]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");

    const render = (time) => {
      const state = schemeStateRef.current || {};
      const layout = drawStaticLayout(ctx, state, time);
      drawDynamicEffects(ctx, state, time, layout);

      if (onInfoChange) {
        const currentStage =
          state.mode === "running"
            ? "Конвейер активен"
            : state.hopper === "jam"
              ? "Сбой во входном блоке"
              : state.conveyor === "broken"
                ? "Сбой конвейера"
                : "Остановлена";

        const orientation =
          state.pusher === "pushing"
            ? "Перемещается"
            : state.mode === "running"
              ? "На ленте"
              : "—";

        onInfoChange({
          currentStage,
          currentCapColor:
            state.mode === "running"
              ? getColorLabel(state.selectedColor)
              : "—",
          detectedColor: state.detectedColor ? getColorLabel(state.detectedColor) : "—",
          orientation,
        });
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
    <div className="machine-scheme">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
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
