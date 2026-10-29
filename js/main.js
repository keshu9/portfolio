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

    CONFIG.photos.forEach((photo) => {
      const card = createElement("button", "photo");
      card.type = "button";
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

    CONFIG.reels.forEach((reel) => {
      const card = createElement("button", "reel");
      card.type = "button";

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
        document.querySelectorAll(".photo").forEach((card) => {
          const match = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("hidden", !match);
        });
      });
    });
  }

  function showModal(title, wide) {
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
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    modalContent.replaceChildren();
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function stepPhoto(direction) {
    const total = CONFIG.photos.length;
    openPhoto(CONFIG.photos[(photoIndex + direction + total) % total]);
  }

  function openPhoto(photo) {
    photoIndex = CONFIG.photos.indexOf(photo);
    showModal(photo.title, true);

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.title;
    img.addEventListener("error", () => {
      img.replaceWith(createElement("p", "modal-error", "Nie udało się wczytać zdjęcia."));
    });
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
        stepPhoto(item.direction);
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
        if (event.key === "ArrowLeft") stepPhoto(-1);
        if (event.key === "ArrowRight") stepPhoto(1);
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
