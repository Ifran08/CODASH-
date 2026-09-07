/* ==========================================================================
   OrbitImages — vanilla JS/CSS port (React Bits, original by Dominik Koch)
   https://reactbits.dev/animations/orbit-images
   Ported to plain JS + native CSS offset-path animation (no React,
   no framer-motion) so it runs on CODASH's static HTML pages.
   ========================================================================== */

function initOrbitImages(mountId, options = {}) {
  const {
    images = [],
    altPrefix = "CODASH work",
    radiusX = 410,
    radiusY = 90,
    rotation = -8,
    duration = 30,
    itemSize = 92,
    direction = "normal", // "normal" | "reverse"
    fill = true,
  } = options;

  const mount = document.getElementById(mountId);
  if (!mount || !images.length) return;

  // Bounding box sized to the actual orbit content, not a big empty square.
  const boundingWidth = radiusX * 2 + itemSize;
  const boundingHeight = radiusY * 2 + itemSize;
  const cx = boundingWidth / 2;
  const cy = boundingHeight / 2;

  function ellipsePath(cx, cy, rx, ry) {
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }
  const path = ellipsePath(cx, cy, radiusX, radiusY);

  mount.classList.add("orbit-container");
  mount.innerHTML = `
    <div class="orbit-canvas" style="width:${boundingWidth}px;height:${boundingHeight}px;">
      <div class="orbit-rotation-wrapper" style="transform:rotate(${rotation}deg);">
        ${images
          .map(
            (src, i) => `
          <div class="orbit-item" style="width:${itemSize}px;height:${itemSize}px;offset-path:path('${path}');offset-anchor:center center;">
            <img src="${src}" alt="${altPrefix} ${i + 1}" draggable="false" loading="lazy">
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;

  const canvas = mount.querySelector(".orbit-canvas");
  const items = Array.from(mount.querySelectorAll(".orbit-item"));

  function updateScale() {
    const containerWidth = mount.clientWidth;
    if (!containerWidth) return;
    const scale = containerWidth / boundingWidth;
    canvas.style.transform = `scale(${scale})`;
    mount.style.height = boundingHeight * scale + "px";
  }
  updateScale();

  if (window.ResizeObserver) {
    new ResizeObserver(updateScale).observe(mount);
  } else {
    window.addEventListener("resize", updateScale);
  }

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Static fallback: spread items evenly around the path, no animation.
  if (reduceMotion || !CSS.supports("offset-path", "path('M0 0')")) {
    items.forEach((item, i) => {
      const offset = fill ? (i / items.length) * 100 : 0;
      item.style.offsetDistance = offset + "%";
    });
    return;
  }

  let start = null;
  function frame(ts) {
    if (start === null) start = ts;
    const elapsed = (ts - start) / 1000;
    const cycle = (elapsed % duration) / duration;
    const p = (direction === "reverse" ? -100 : 100) * cycle;
    items.forEach((item, i) => {
      const itemOffset = fill ? (i / items.length) * 100 : 0;
      const offset = (((p + itemOffset) % 100) + 100) % 100;
      item.style.offsetDistance = offset + "%";
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
