"use strict";

(function () {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let w = 0, h = 0, dpr = 1;
  let lastW = 0;
  let particles = [];
  let lastTime = performance.now();

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let smoothMouseX = mouseX;
  let smoothMouseY = mouseY;

  if (!isTouch) {
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });
  }

  function createParticles() {
    const count = isTouch
      ? Math.min(48, Math.max(26, Math.floor((w * h) / 24000)))
      : Math.min(85, Math.max(35, Math.floor((w * h) / 18000)));

    particles = [];

    for (let i = 0; i < count; i++) {
      const z = Math.random();
      const isForeground = z > 0.84;
      const isMidground = z > 0.45 && z <= 0.84;

      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.15 + z * 0.85,
        radius: isForeground ? (22 + Math.random() * 24) : (isMidground ? (2 + Math.random() * 2.8) : (0.7 + Math.random() * 1.1)),
        baseVy: -(0.025 + z * 0.08),
        baseVx: (Math.random() - 0.5) * 0.02,
        pulseSpeed: 0.0004 + Math.random() * 0.0006,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.0005 + Math.random() * 0.0008,
        isForeground: isForeground,
        colorType: Math.random() > 0.6 ? "accent" : (Math.random() > 0.5 ? "warm" : "white")
      });
    }
  }

  function resize() {
    const currentW = window.innerWidth;
    const currentH = window.innerHeight;

    dpr = Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.75);

    const isInitial = w === 0;
    const widthChanged = Math.abs(currentW - lastW) > 60;

    w = currentW;
    h = currentH;
    lastW = currentW;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (isInitial || widthChanged) {
      createParticles();
    }
  }

  function render(time) {
    const dt = Math.min(time - lastTime, 40);
    lastTime = time;

    ctx.clearRect(0, 0, w, h);

    if (isTouch) {
      smoothMouseX = w * 0.5 + Math.sin(time * 0.00035) * (w * 0.15);
      smoothMouseY = h * 0.38 + Math.cos(time * 0.00028) * (h * 0.1);
    } else {
      smoothMouseX += (mouseX - smoothMouseX) * 0.035;
      smoothMouseY += (mouseY - smoothMouseY) * 0.035;
    }

    const ambientGrad = ctx.createRadialGradient(
      smoothMouseX, smoothMouseY, 15,
      smoothMouseX, smoothMouseY, Math.max(w, h) * (isTouch ? 0.55 : 0.65)
    );
    ambientGrad.addColorStop(0, "rgba(143, 155, 255, 0.065)");
    ambientGrad.addColorStop(0.5, "rgba(55, 60, 110, 0.025)");
    ambientGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, w, h);

    const deltaFactor = dt / 16.67;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (!reduceMotion) {
        p.y += p.baseVy * deltaFactor * 1.5;
        p.x += (p.baseVx + Math.sin(time * p.driftSpeed + p.phase) * 0.04) * deltaFactor;

        if (p.y < -60) {
          p.y = h + 60;
          p.x = Math.random() * w;
        } else if (p.y > h + 60) {
          p.y = -60;
        }

        if (p.x < -60) {
          p.x = w + 60;
        } else if (p.x > w + 60) {
          p.x = -60;
        }
      }

      const pulse = 0.72 + 0.28 * Math.sin(time * p.pulseSpeed + p.phase);

      let rgb = "240, 238, 250";
      if (p.colorType === "accent") rgb = "143, 155, 255";
      if (p.colorType === "warm") rgb = "235, 185, 140";

      if (p.isForeground) {
        const alpha = (0.02 + p.z * 0.04) * pulse;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${rgb}, ${alpha * 0.35})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const alpha = (0.05 + p.z * 0.25) * pulse;
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!reduceMotion) {
      requestAnimationFrame(render);
    }
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) render(performance.now());
  });

  if (reduceMotion) {
    render(performance.now());
  } else {
    requestAnimationFrame(render);
  }
})();
