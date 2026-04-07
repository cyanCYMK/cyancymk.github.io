$(document).ready(function() {
  const $canvas = $("#pixelCanvas");
  const $dims = $("#imageDimensions");
  const $vertices = $("#rectVertices");
  const canvas = $canvas[0];
  let ctx = null;

  let sourceImage = null;
  let dragStart = null;
  let dragCurrent = null;
  let committedRect = null;

  const ORIGIN_ORDER = ["tl", "tr", "br", "bl"];
  const ORIGIN_LABELS = {
    tl: "top-left",
    tr: "top-right",
    br: "bottom-right",
    bl: "bottom-left"
  };
  let originCorner = "tl";
  const $cycleOrigin = $("#cycleOrigin");

  function pointerToCanvasPixel(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (clientX - r.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (clientY - r.top) * scaleY))
    };
  }

  function normalizeRect(x0, y0, x1, y1) {
    return {
      left: Math.min(x0, x1),
      top: Math.min(y0, y1),
      right: Math.max(x0, x1),
      bottom: Math.max(y0, y1)
    };
  }

  function rectMetrics(r) {
    const L = Math.round(r.left);
    const T = Math.round(r.top);
    const R = Math.round(r.right);
    const B = Math.round(r.bottom);
    const wPx = Math.round(r.right - r.left);
    const hPx = Math.round(r.bottom - r.top);
    return { L, T, R, B, wPx, hPx };
  }

  function imageOriginCanvasCoords(corner) {
    const W = canvas.width;
    const H = canvas.height;
    if (W < 1 || H < 1) {
      return { x: 0, y: 0 };
    }
    switch (corner) {
      case "tr":
        return { x: W - 1, y: 0 };
      case "br":
        return { x: W - 1, y: H - 1 };
      case "bl":
        return { x: 0, y: H - 1 };
      case "tl":
      default:
        return { x: 0, y: 0 };
    }
  }

  function localVertex(m, which, originKey) {
    const o = imageOriginCanvasCoords(originKey);
    let vx;
    let vy;
    switch (which) {
      case "tr":
        vx = m.R;
        vy = m.T;
        break;
      case "br":
        vx = m.R;
        vy = m.B;
        break;
      case "bl":
        vx = m.L;
        vy = m.B;
        break;
      case "tl":
      default:
        vx = m.L;
        vy = m.T;
        break;
    }
    return { x: Math.round(vx - o.x), y: Math.round(vy - o.y) };
  }

  function normalizedPreviewRect() {
    if (!dragStart || !dragCurrent) return null;
    return normalizeRect(
      dragStart.x,
      dragStart.y,
      dragCurrent.x,
      dragCurrent.y
    );
  }

  function rectHasArea(r) {
    return r && r.right - r.left >= 1 && r.bottom - r.top >= 1;
  }

  function updateOriginControls() {
    const enabled = !!sourceImage;
    $cycleOrigin.prop("disabled", !enabled);
    $cycleOrigin.text(
      enabled
        ? `Origin: ${ORIGIN_LABELS[originCorner]} (click to cycle)`
        : "Origin: top-left"
    );
  }

  function drawRectOverlay(r, preview) {
    const w = r.right - r.left;
    const h = r.bottom - r.top;
    if (w < 1 || h < 1) return;
    ctx.fillStyle = preview
      ? "rgba(255, 200, 0, 0.22)"
      : "rgba(0, 140, 255, 0.22)";
    ctx.strokeStyle = preview
      ? "rgba(200, 120, 0, 0.95)"
      : "rgba(0, 90, 200, 0.95)";
    ctx.lineWidth = 1;
    ctx.fillRect(r.left, r.top, w, h);
    ctx.strokeRect(r.left, r.top, w, h);
  }

  function drawOriginMarker(ox, oy, preview) {
    const arm = 12;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, 6, 0, Math.PI * 2);
    ctx.fillStyle = preview
      ? "rgba(220, 80, 30, 0.95)"
      : "rgba(200, 50, 180, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox - arm, oy);
    ctx.lineTo(ox + arm, oy);
    ctx.moveTo(ox, oy - arm);
    ctx.lineTo(ox, oy + arm);
    ctx.stroke();
    const fs = 14;
    ctx.font = `${fs}px ui-monospace, monospace`;
    ctx.textBaseline = "alphabetic";
    let lx = ox + 10;
    let ly = oy - 10;
    if (lx + 48 > canvas.width) lx = ox - 52;
    if (ly < fs + 4) ly = oy + fs + 6;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillStyle = "rgba(15, 15, 15, 0.95)";
    ctx.strokeText("0,0", lx, ly);
    ctx.fillText("0,0", lx, ly);
    ctx.restore();
  }

  function drawRectLabels(r, preview) {
    const w = r.right - r.left;
    const h = r.bottom - r.top;
    if (w < 1 || h < 1) return;

    const m = rectMetrics(r);
    const o = imageOriginCanvasCoords(originCorner);
    const tl = localVertex(m, "tl", originCorner);
    const tr = localVertex(m, "tr", originCorner);
    const br = localVertex(m, "br", originCorner);
    const bl = localVertex(m, "bl", originCorner);
    const lines = [
      `Image origin: ${ORIGIN_LABELS[originCorner]} (0,0) @ (${o.x}, ${o.y})`,
      `Rect width ${m.wPx} px    height ${m.hPx} px`,
      `Rect TL (${tl.x},${tl.y})  TR (${tr.x},${tr.y})`,
      `Rect BR (${br.x},${br.y})  BL (${bl.x},${bl.y})`
    ];

    const fs = Math.min(22, Math.max(12, Math.min(w, h) / 8));
    const lineHeight = fs * 1.35;
    const pad = 4;

    ctx.save();
    ctx.beginPath();
    ctx.rect(r.left, r.top, w, h);
    ctx.clip();

    ctx.font = `${fs}px ui-monospace, monospace`;
    ctx.textBaseline = "top";
    const outline = Math.max(2, fs / 5);
    ctx.lineWidth = outline;
    ctx.lineJoin = "round";

    let y = r.top + pad;
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > r.bottom - pad) break;
      const line = lines[i];
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fillStyle = preview
        ? "rgba(60, 35, 0, 0.95)"
        : "rgba(0, 35, 75, 0.95)";
      ctx.strokeText(line, r.left + pad, y);
      ctx.fillText(line, r.left + pad, y);
      y += lineHeight;
    }
    ctx.restore();
  }

  function redraw() {
    if (!sourceImage || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0);
    if (committedRect) {
      drawRectOverlay(committedRect, false);
      drawRectLabels(committedRect, false);
    }
    if (dragStart && dragCurrent) {
      const r = normalizedPreviewRect();
      if (rectHasArea(r)) {
        drawRectOverlay(r, true);
        drawRectLabels(r, true);
      }
    }
    const oc = imageOriginCanvasCoords(originCorner);
    const previewing =
      !!(dragStart && dragCurrent && rectHasArea(normalizedPreviewRect()));
    drawOriginMarker(oc.x, oc.y, previewing);
    updateOriginControls();
  }

  function formatVertices(r) {
    const m = rectMetrics(r);
    const o = imageOriginCanvasCoords(originCorner);
    const tl = localVertex(m, "tl", originCorner);
    const tr = localVertex(m, "tr", originCorner);
    const br = localVertex(m, "br", originCorner);
    const bl = localVertex(m, "bl", originCorner);
    return (
      `Image origin: ${ORIGIN_LABELS[originCorner]} (0,0) at canvas (${o.x}, ${o.y}); axes: x→right, y→down\n` +
      `Rectangle size: width ${m.wPx} px    height ${m.hPx} px\n` +
      "Rectangle corners relative to image origin:\n" +
      `(${tl.x}, ${tl.y}) rect top-left    (${tr.x}, ${tr.y}) rect top-right\n` +
      `(${br.x}, ${br.y}) rect bottom-right    (${bl.x}, ${bl.y}) rect bottom-left\n` +
      "Rectangle corners absolute canvas (rounded):\n" +
      `(${m.L}, ${m.T}) TL    (${m.R}, ${m.T}) TR    (${m.R}, ${m.B}) BR    (${m.L}, ${m.B}) BL`
    );
  }

  function endDrag(e, commit) {
    if (!dragStart) return;
    const pid = e.pointerId;
    if (commit) {
      dragCurrent = pointerToCanvasPixel(e.clientX, e.clientY);
      const r = normalizeRect(
        dragStart.x,
        dragStart.y,
        dragCurrent.x,
        dragCurrent.y
      );
      if (rectHasArea(r)) {
        committedRect = r;
        $vertices.text(formatVertices(r));
      }
    }
    dragStart = null;
    dragCurrent = null;
    try {
      canvas.releasePointerCapture(pid);
    } catch (_) {}
    redraw();
  }

  $canvas.on("pointerdown", function(e) {
    if (!sourceImage || e.button !== 0) return;
    e.preventDefault();
    canvas.focus();
    canvas.setPointerCapture(e.pointerId);
    dragStart = pointerToCanvasPixel(e.clientX, e.clientY);
    dragCurrent = dragStart;
    redraw();
  });

  $canvas.on("pointermove", function(e) {
    if (!dragStart) return;
    e.preventDefault();
    dragCurrent = pointerToCanvasPixel(e.clientX, e.clientY);
    redraw();
  });

  $canvas.on("pointerup", function(e) {
    if (e.button !== 0) return;
    endDrag(e, true);
  });

  $canvas.on("pointercancel", function(e) {
    endDrag(e, false);
  });

  $cycleOrigin.on("click", function() {
    const i = ORIGIN_ORDER.indexOf(originCorner);
    originCorner = ORIGIN_ORDER[(i + 1) % ORIGIN_ORDER.length];
    if (committedRect) {
      $vertices.text(formatVertices(committedRect));
    }
    redraw();
  });

  $("#imageInput").on("change", function() {
    const file = this.files[0];
    if (!file) {
      $dims.empty();
      $vertices.empty();
      sourceImage = null;
      committedRect = null;
      dragStart = null;
      dragCurrent = null;
      originCorner = "tl";
      if (ctx && canvas.width && canvas.height) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      updateOriginControls();
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext("2d");
        sourceImage = img;
        committedRect = null;
        dragStart = null;
        dragCurrent = null;
        originCorner = "tl";
        $vertices.empty();
        $dims.text(w + " × " + h + " px");
        redraw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});
