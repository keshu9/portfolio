"use strict";

(function () {
  const ICONS = {
    prev: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>'
  };

  const FOCUSABLE = 'button, [href], iframe, [tabindex]:not([tabindex="-1"])';

  const modal = document.getElementById("modal");
  const modalBox = modal.querySelector(".modal-box");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const closeButton = document.getElementById("closeModal");

  let photoIndex = 0;
  let lastFocused = null;
  let closeTimer = null;

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function getYoutubeId(url) {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
        return u.pathname.replace(/^\//, "").split("/")[0];
      }
      if (u.hostname.endsWith("youtube.com")) {
        if (u.pathname.includes("/shorts/")) {
          return u.pathname.split("/shorts/")[1].split("/")[0];
        }
        if (u.pathname.startsWith("/embed/")) {
          return u.pathname.split("/embed/")[1].split("/")[0];
        }
        return u.searchParams.get("v") || "";
      }
    } catch (error) {
      return "";
    }
    return "";
  }

  function setLink(id, url, external) {
    const link = document.getElementById(id);
    if (!url) {
      link.style.display = "none";
      return;
    }
    link.href = url;
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  }

  function initProfile() {
    document.getElementById("name").textContent = CONFIG.name;
    document.getElementById("year").textContent = new Date().getFullYear();

    const instagram = CONFIG.instagram;
    const instagramUrl =
      instagram && !/^https?:/.test(instagram)
        ? "https://www.instagram.com/" + instagram.replace("@", "")
        : instagram;

    setLink("instagram", instagramUrl, true);
    setLink("phone", CONFIG.phone ? "tel:" + CONFIG.phone.replace(/\s+/g, "") : "", false);
    setLink("mail", CONFIG.email ? "mailto:" + CONFIG.email : "", false);

    document.getElementById("contactButton").addEventListener("click", () => {
      if (CONFIG.email) window.location.href = "mailto:" + CONFIG.email;
    });
  }

  function appendPlaceholder(visual, label) {
    visual.appendChild(createElement("span", "placeholder-label", label));
  }

  function renderPhotos() {
    const gallery = document.getElementById("gallery");

    CONFIG.photos.forEach((photo, index) => {
      const card = createElement("button", "photo");
      card.type = "button";
      card.style.setProperty("--i", index);
      card.dataset.category = photo.category;

      const visual = createElement("div", "photo-visual " + photo.category);
      visual.appendChild(createElement("span", "photo-badge", photo.categoryLabel || photo.category));

      if (photo.src) {
        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.title;
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => {
          visual.classList.remove("has-image");
          img.remove();
          appendPlaceholder(visual, photo.category);
        });
        visual.appendChild(img);
        visual.classList.add("has-image");
      } else {
        appendPlaceholder(visual, photo.category);
      }

      const info = createElement("div", "photo-info");
      info.append(createElement("strong", "", photo.title), createElement("small", "", "Powiększ ↗"));

      card.append(visual, info);
      card.addEventListener("click", () => openPhoto(photo));
      gallery.appendChild(card);
    });
  }

  function renderReels() {
    const container = document.getElementById("reels");

    CONFIG.reels.forEach((reel, index) => {
      const card = createElement("button", "reel");
      card.type = "button";
      card.style.setProperty("--i", index);

      const visual = createElement("div", "reel-visual");
      const id = getYoutubeId(reel.youtubeUrl);
      const thumbSrc = reel.thumb || (id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "");

      if (thumbSrc) {
        const img = document.createElement("img");
        img.alt = reel.title;
        img.loading = "lazy";
        img.decoding = "async";
        img.src = thumbSrc;
        img.addEventListener("error", () => {
          img.remove();
          visual.classList.remove("has-thumb");
        });
        visual.classList.add("has-thumb");
        visual.appendChild(img);
      }

      const play = createElement("span", "play");
      play.innerHTML = ICONS.play;
      visual.appendChild(play);

      const info = createElement("div", "reel-info");
      info.append(
        createElement("strong", "", reel.title),
        createElement("small", "", reel.description + " · Odtwórz ↗")
      );

      card.append(visual, info);
      card.addEventListener("click", () => openVideo(reel));
      container.appendChild(card);
    });
  }

  function initFilters() {
    const buttons = document.querySelectorAll(".filter-btn");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((b) => {
          const isActive = b === button;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-pressed", String(isActive));
        });

        const filter = button.dataset.filter;
        let shown = 0;
        document.querySelectorAll(".photo").forEach((card) => {
          const match = filter === "all" || card.dataset.category === filter;
          const wasHidden = card.classList.contains("hidden");
          card.classList.toggle("hidden", !match);
          if (match && wasHidden) card.style.setProperty("--i", shown++);
        });
      });
    });
  }

  function showModal(title, wide) {
    clearTimeout(closeTimer);
    closeTimer = null;
    modalBox.style.height = "";
    if (!modal.classList.contains("open")) {
      lastFocused = document.activeElement;
    }
    modalTitle.textContent = title;
    modalContent.replaceChildren();
    modalBox.classList.toggle("wide", Boolean(wide));
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  function closeModal() {
    if (!modal.classList.contains("open")) return;

    // Freeze the box size so it does not collapse while it fades out.
    modalBox.style.height = modalBox.offsetHeight + "px";
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    // Stop video playback immediately, clear the rest once the fade is done.
    modalContent.querySelectorAll("iframe").forEach((frame) => frame.remove());
    closeTimer = setTimeout(() => {
      modalContent.replaceChildren();
      modalBox.style.height = "";
      closeTimer = null;
    }, 160);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function stepPhoto(direction, animate) {
    const total = CONFIG.photos.length;
    openPhoto(CONFIG.photos[(photoIndex + direction + total) % total], animate);
  }

  // Swipe left/right on touch screens: follows the finger with friction,
  // and a quick flick is enough even over a short distance.
  function attachSwipe(img) {
    const DISTANCE = 80;
    const VELOCITY = 0.11;
    const FRICTION = 0.6;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let deltaX = 0;
    let dragging = false;

    img.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || pointerId !== null) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startTime = performance.now();
      deltaX = 0;
      dragging = false;
      img.setPointerCapture(pointerId);
    });

    img.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (!dragging) {
        if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        dragging = true;
        img.style.transition = "none";
      }
      img.style.transform = "translateX(" + deltaX * FRICTION + "px)";
    });

    function finish(event, allowCommit) {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      img.style.transition = "";

      const elapsed = Math.max(performance.now() - startTime, 1);
      const velocity = Math.abs(deltaX) / elapsed;
      const commit =
        allowCommit && dragging && (Math.abs(deltaX) >= DISTANCE || (Math.abs(deltaX) > 30 && velocity > VELOCITY));

      if (commit) {
        stepPhoto(deltaX < 0 ? 1 : -1, true);
      } else {
        img.style.transform = "";
      }
      dragging = false;
    }

    img.addEventListener("pointerup", (event) => finish(event, true));
    img.addEventListener("pointercancel", (event) => finish(event, false));
  }

  function openPhoto(photo, animate = true) {
    photoIndex = CONFIG.photos.indexOf(photo);
    showModal(photo.title, true);

    const img = document.createElement("img");
    img.alt = photo.title;
    img.draggable = false;
    img.addEventListener("error", () => {
      img.replaceWith(createElement("p", "modal-error", "Nie udało się wczytać zdjęcia."));
    });
    if (animate) {
      img.classList.add("fade");
      img.addEventListener("load", () => {
        requestAnimationFrame(() => img.classList.add("ready"));
      });
    }
    img.src = photo.src;
    attachSwipe(img);
    modalContent.appendChild(img);

    [
      { icon: ICONS.prev, direction: -1, side: "left", label: "Poprzednie zdjęcie" },
      { icon: ICONS.next, direction: 1, side: "right", label: "Następne zdjęcie" }
    ].forEach((item) => {
      const button = createElement("button", "nav-btn");
      button.type = "button";
      button.innerHTML = item.icon;
      button.style[item.side] = "18px";
      button.setAttribute("aria-label", item.label);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        stepPhoto(item.direction, true);
      });
      modalContent.appendChild(button);
    });
  }

  function openVideo(reel) {
    showModal(reel.title, false);

    const videoId = getYoutubeId(reel.youtubeUrl);
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0";
    iframe.title = reel.title;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    modalContent.appendChild(iframe);
  }

  function trapFocus(event) {
    const items = modal.querySelectorAll(FOCUSABLE);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initModal() {
    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("open")) return;

      if (event.key === "Escape") closeModal();
      if (event.key === "Tab") trapFocus(event);

      if (modalContent.querySelector("img")) {
        if (event.key === "ArrowLeft") stepPhoto(-1, false);
        if (event.key === "ArrowRight") stepPhoto(1, false);
      }
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll("section").forEach((section) => {
      section.classList.add("reveal");
      observer.observe(section);
    });
  }

  initProfile();
  renderPhotos();
  renderReels();
  initFilters();
  initModal();
  initReveal();
})();
