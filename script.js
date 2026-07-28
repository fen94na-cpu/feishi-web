/*
=========================================================
FEISHI OFFICIAL WEBSITE V2
Complete script.js
Combined from Part 1 + Part 2 + Part 3 + Part 4
=========================================================
*/

/*
=========================================================
FEISHI OFFICIAL WEBSITE V2
script.js - PART 1 / 4
=========================================================
包含：
✓ 工具函数
✓ Loading
✓ Cursor Glow
✓ Scroll Progress
✓ Reveal Animation
✓ Mobile Menu
✓ Header Effects
✓ Smooth Scroll
*/

document.addEventListener("DOMContentLoaded", () => {

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

const throttle=(fn,wait=16)=>{
 let last=0;
 return (...args)=>{
   const now=Date.now();
   if(now-last>wait){
      last=now;
      fn(...args);
   }
 };
};

/* Loading */

const loading=$("#loading");
const enter=$("#enter");

function hideLoading(){
 if(!loading) return;
 loading.classList.add("is-hidden");
 document.body.classList.remove("loading");
}

enter?.addEventListener("click",hideLoading);
window.addEventListener("load",()=>setTimeout(hideLoading,1200));

/* Cursor Glow */

const glow=$(".cursor-glow");
window.addEventListener("pointermove",e=>{
 if(!glow) return;
 glow.style.opacity="1";
 glow.style.left=e.clientX+"px";
 glow.style.top=e.clientY+"px";
});

/* Scroll Progress */

const progress=$("#scrollProgressBar");
const updateProgress=()=>{
 if(!progress) return;
 const d=document.documentElement;
 const p=d.scrollTop/(d.scrollHeight-d.clientHeight)*100;
 progress.style.width=p+"%";
};
window.addEventListener("scroll",throttle(updateProgress),{passive:true});
updateProgress();

/* Reveal */

const observer=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
   if(entry.isIntersecting){
      entry.target.classList.add("is-visible");
   }
 });
},{threshold:.15});

$$(".reveal").forEach(el=>observer.observe(el));

/* Header */

const header=$(".site-header");
window.addEventListener("scroll",throttle(()=>{
 if(!header) return;
 if(window.scrollY>30){
   header.classList.add("scrolled");
 }else{
   header.classList.remove("scrolled");
 }
}));

/* Mobile Menu */

const menu=$("#mobileMenu");
const open=$("#menuToggle");
const close=$("#menuClose");

function openMenu(){
 if(!menu) return;
 menu.classList.add("is-open");
 document.body.classList.add("menu-open");
}

function closeMenu(){
 if(!menu) return;
 menu.classList.remove("is-open");
 document.body.classList.remove("menu-open");
}

open?.addEventListener("click",openMenu);
close?.addEventListener("click",closeMenu);

menu?.addEventListener("click",e=>{
 if(e.target===menu) closeMenu();
});

$$(".mobile-nav a").forEach(a=>{
 a.addEventListener("click",closeMenu);
});

/* Smooth Scroll */

document.querySelectorAll('a[href^="#"]').forEach(link=>{
 link.addEventListener("click",e=>{
   const id=link.getAttribute("href");
   const target=document.querySelector(id);
   if(!target) return;
   e.preventDefault();
   target.scrollIntoView({behavior:"smooth",block:"start"});
 });
});

// ===== END OF PART 1 =====
// PART 2:
// Live Dashboard
// Countdown
// AI Chat
// Typing Animation

});

/*
=========================================================
FEISHI OFFICIAL WEBSITE V2
script.js - PART 2 / 4
=========================================================
包含：
✓ Live Dashboard
✓ 直播状态判断
✓ 下一场直播倒计时
✓ AI Chat
✓ Quick Reply
✓ Enter 发送
✓ Clear Chat
✓ Typing Animation

使用方法：
把本文件内容接在 Part 1 后面。
本文件使用独立 DOMContentLoaded 作用域，不会与 Part 1 冲突。
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* =====================================================
     Live Dashboard
     ===================================================== */

  const LIVE_SCHEDULES = [
    {
      label: "Morning Live",
      startHour: 6,
      startMinute: 0,
      endHour: 9,
      endMinute: 0
    },
    {
      label: "Afternoon Live",
      startHour: 14,
      startMinute: 0,
      endHour: 17,
      endMinute: 0
    }
  ];

  const liveStatus = $("#liveStatus");
  const countdown = $("#countdown");
  const nextLiveText = $("#nextLiveText");
  const liveTitle = $("#liveTitle");
  const liveDescription = $("#liveDescription");

  function createScheduleDate(baseDate, schedule, useEndTime = false) {
    const result = new Date(baseDate);
    result.setSeconds(0, 0);

    if (useEndTime) {
      result.setHours(schedule.endHour, schedule.endMinute, 0, 0);
    } else {
      result.setHours(schedule.startHour, schedule.startMinute, 0, 0);
    }

    return result;
  }

  function getLiveState(now = new Date()) {
    for (const schedule of LIVE_SCHEDULES) {
      const start = createScheduleDate(now, schedule);
      const end = createScheduleDate(now, schedule, true);

      if (now >= start && now < end) {
        return {
          isLive: true,
          schedule,
          start,
          end,
          target: end
        };
      }
    }

    for (const schedule of LIVE_SCHEDULES) {
      const start = createScheduleDate(now, schedule);

      if (now < start) {
        return {
          isLive: false,
          schedule,
          start,
          target: start
        };
      }
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstSchedule = LIVE_SCHEDULES[0];
    const nextStart = createScheduleDate(tomorrow, firstSchedule);

    return {
      isLive: false,
      schedule: firstSchedule,
      start: nextStart,
      target: nextStart
    };
  }

  function formatDuration(milliseconds) {
    const safeValue = Math.max(0, milliseconds);
    const totalSeconds = Math.floor(safeValue / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0")
    ].join(":");
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function formatDay(date) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(date, today)) return "今天";
    if (sameDay(date, tomorrow)) return "明天";

    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric"
    }).format(date);
  }

  function updateLiveDashboard() {
    const now = new Date();
    const state = getLiveState(now);
    const remaining = state.target.getTime() - now.getTime();

    if (countdown) {
      countdown.textContent = formatDuration(remaining);
      countdown.setAttribute(
        "aria-label",
        state.isLive ? "距离本场直播结束时间" : "距离下一场直播开始时间"
      );
    }

    if (liveStatus) {
      liveStatus.textContent = state.isLive ? "LIVE" : "OFFLINE";
      liveStatus.classList.toggle("is-live", state.isLive);
      liveStatus.setAttribute(
        "aria-label",
        state.isLive ? "绯蚀当前正在直播" : "绯蚀当前未开播"
      );
    }

    if (nextLiveText) {
      nextLiveText.textContent = state.isLive
        ? `本场直播预计 ${formatTime(state.end)} 结束`
        : `${formatDay(state.start)} ${formatTime(state.start)} 开播`;
    }

    if (liveTitle) {
      liveTitle.textContent = state.isLive ? "正在直播" : "等待下一场直播";
    }

    if (liveDescription) {
      liveDescription.textContent = state.isLive
        ? "欢迎进入绯蚀的直播间。"
        : "下一场直播即将开始，请稍候。";
    }

    document.documentElement.dataset.liveState = state.isLive
      ? "live"
      : "offline";
  }

  updateLiveDashboard();
  window.setInterval(updateLiveDashboard, 1000);

  /* =====================================================
     AI Chat
     ===================================================== */

  const chatMessages = $("#messages");
  const chatInput = $("#prompt");
  const sendButton = $("#send");
  const clearButton = $("#clearChat");
  const quickReplies = $$(".quick-reply");

  const CHAT_STORAGE_KEY = "feishi-v2-chat-history";
  const MAX_HISTORY_ITEMS = 40;

  const DEFAULT_MESSAGES = [
    {
      role: "assistant",
      text: "你好，我是绯蚀官网里的 AI 互动助手。想聊点什么？"
    }
  ];

  const RESPONSE_RULES = [
    {
      keywords: ["直播时间", "几点直播", "什么时候直播", "开播时间"],
      response: "绯蚀每天有两个直播时段：06:00–09:00，以及 14:00–17:00。"
    },
    {
      keywords: ["抖音", "账号", "douyin", "主页"],
      response: "绯蚀的抖音号是 87328734252。"
    },
    {
      keywords: ["介绍", "你是谁", "绯蚀是谁", "自我介绍"],
      response: "我是绯蚀，一位以杂谈为主的主播。单推符号是 🎸⁰⁶¹⁹。"
    },
    {
      keywords: ["单推符号", "粉丝符号", "符号"],
      response: "绯蚀的单推符号是 🎸⁰⁶¹⁹。"
    },
    {
      keywords: ["累", "疲惫", "难受", "不开心"],
      response: "辛苦了。先休息一下也没关系，今天已经做得很好了。"
    },
    {
      keywords: ["你好", "嗨", "hello", "hi"],
      response: "你好呀，很高兴在这里见到你。"
    },
    {
      keywords: ["晚安", "睡觉"],
      response: "晚安，祝你今晚睡个好觉。"
    },
    {
      keywords: ["早安", "早上好"],
      response: "早安。希望你今天一切顺利。"
    },
    {
      keywords: ["喜欢", "理想型"],
      response: "一定要理想型吗？我不行吗。"
    }
  ];

  const FALLBACK_RESPONSES = [
    "我听到了。你可以继续告诉我。",
    "这个问题很有意思。",
    "欢迎继续和我聊天。",
    "我会认真听你说。",
    "官网 AI 目前是本地演示版本，之后可以接入真正的 AI API。"
  ];

  let chatHistory = [];
  let typingTimer = null;
  let isTyping = false;

  function normalizeText(text) {
    return text.trim().replace(/\s+/g, " ");
  }

  function escapeForTextNode(value) {
    return String(value ?? "");
  }

  function loadChatHistory() {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);

      if (!saved) {
        chatHistory = [...DEFAULT_MESSAGES];
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid chat history");
      }

      chatHistory = parsed
        .filter(
          item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.text === "string"
        )
        .slice(-MAX_HISTORY_ITEMS);

      if (!chatHistory.length) {
        chatHistory = [...DEFAULT_MESSAGES];
      }
    } catch (error) {
      console.warn("Unable to load chat history:", error);
      chatHistory = [...DEFAULT_MESSAGES];
    }
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(chatHistory.slice(-MAX_HISTORY_ITEMS))
      );
    } catch (error) {
      console.warn("Unable to save chat history:", error);
    }
  }

  function createAvatar() {
    const avatar = document.createElement("img");
    avatar.className = "message-avatar";
    avatar.src = "assets/character/avatar.png";
    avatar.alt = "绯蚀头像";
    avatar.loading = "lazy";

    avatar.addEventListener(
      "error",
      () => {
        avatar.style.display = "none";
      },
      { once: true }
    );

    return avatar;
  }

  function createMessageElement(message, animate = false) {
    const row = document.createElement("div");
    row.className = `message-row ${
      message.role === "user" ? "user" : "assistant"
    }`;

    row.dataset.role = message.role;

    if (message.role === "assistant") {
      row.appendChild(createAvatar());
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.setAttribute(
      "aria-label",
      message.role === "user" ? "你的消息" : "绯蚀 AI 的回复"
    );

    if (animate && message.role === "assistant") {
      bubble.textContent = "";
    } else {
      bubble.textContent = escapeForTextNode(message.text);
    }

    row.appendChild(bubble);

    return {
      row,
      bubble
    };
  }

  function scrollMessagesToBottom(smooth = true) {
    if (!chatMessages) return;

    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  function renderHistory() {
    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    chatHistory.forEach(message => {
      const { row } = createMessageElement(message);
      chatMessages.appendChild(row);
    });

    requestAnimationFrame(() => scrollMessagesToBottom(false));
  }

  function addMessage(role, text, options = {}) {
    const normalized = normalizeText(text);

    if (!normalized) return null;

    const message = {
      role,
      text: normalized
    };

    chatHistory.push(message);
    chatHistory = chatHistory.slice(-MAX_HISTORY_ITEMS);
    saveChatHistory();

    if (!chatMessages) return null;

    const created = createMessageElement(
      message,
      Boolean(options.animate)
    );

    chatMessages.appendChild(created.row);
    scrollMessagesToBottom();

    return created;
  }

  function addTypingIndicator() {
    if (!chatMessages) return null;

    const row = document.createElement("div");
    row.className = "message-row assistant typing-row";
    row.setAttribute("aria-label", "绯蚀 AI 正在输入");

    row.appendChild(createAvatar());

    const bubble = document.createElement("div");
    bubble.className = "message-bubble typing-bubble";

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      bubble.appendChild(dot);
    }

    row.appendChild(bubble);
    chatMessages.appendChild(row);
    scrollMessagesToBottom();

    return row;
  }

  function findResponse(message) {
    const lower = message.toLowerCase();

    const matchedRule = RESPONSE_RULES.find(rule =>
      rule.keywords.some(keyword =>
        lower.includes(keyword.toLowerCase())
      )
    );

    if (matchedRule) {
      return matchedRule.response;
    }

    return FALLBACK_RESPONSES[
      Math.floor(Math.random() * FALLBACK_RESPONSES.length)
    ];
  }

  function typeText(element, text, speed = 28) {
    return new Promise(resolve => {
      let index = 0;

      function typeNextCharacter() {
        if (!element) {
          resolve();
          return;
        }

        element.textContent = text.slice(0, index + 1);
        index += 1;
        scrollMessagesToBottom(false);

        if (index >= text.length) {
          typingTimer = null;
          resolve();
          return;
        }

        typingTimer = window.setTimeout(typeNextCharacter, speed);
      }

      typeNextCharacter();
    });
  }

  function setChatControlsDisabled(disabled) {
    if (sendButton) sendButton.disabled = disabled;
    if (chatInput) chatInput.disabled = disabled;

    quickReplies.forEach(button => {
      button.disabled = disabled;
    });
  }

  async function submitMessage(rawText) {
    const text = normalizeText(rawText);

    if (!text || isTyping) return;

    addMessage("user", text);

    if (chatInput) {
      chatInput.value = "";
      chatInput.focus();
    }

    isTyping = true;
    setChatControlsDisabled(true);

    const typingIndicator = addTypingIndicator();
    const response = findResponse(text);

    await new Promise(resolve =>
      window.setTimeout(resolve, 450 + Math.random() * 450)
    );

    typingIndicator?.remove();

    const created = addMessage("assistant", response, {
      animate: true
    });

    if (created?.bubble) {
      await typeText(created.bubble, response);
    }

    isTyping = false;
    setChatControlsDisabled(false);
    chatInput?.focus();
  }

  function clearChatHistory() {
    if (typingTimer) {
      window.clearTimeout(typingTimer);
      typingTimer = null;
    }

    isTyping = false;
    setChatControlsDisabled(false);

    chatHistory = [...DEFAULT_MESSAGES];
    saveChatHistory();
    renderHistory();

    chatInput?.focus();
  }

  sendButton?.addEventListener("click", () => {
    submitMessage(chatInput?.value ?? "");
  });

  chatInput?.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(chatInput.value);
    }
  });

  chatInput?.addEventListener("input", () => {
    if (!sendButton) return;

    sendButton.classList.toggle(
      "has-text",
      Boolean(chatInput.value.trim())
    );
  });

  quickReplies.forEach(button => {
    button.addEventListener("click", () => {
      const message =
        button.dataset.message ||
        button.dataset.text ||
        button.textContent ||
        "";

      submitMessage(message);
    });
  });

  clearButton?.addEventListener("click", clearChatHistory);

  loadChatHistory();
  renderHistory();

  /* =====================================================
     Optional CSS helpers for typing animation
     ===================================================== */

  if (!$("#feishi-part2-runtime-style")) {
    const runtimeStyle = document.createElement("style");
    runtimeStyle.id = "feishi-part2-runtime-style";

    runtimeStyle.textContent = `
      .typing-bubble {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-width: 58px;
        min-height: 42px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        opacity: .35;
        animation: feishiTypingDot 1.1s infinite ease-in-out;
      }

      .typing-dot:nth-child(2) {
        animation-delay: .15s;
      }

      .typing-dot:nth-child(3) {
        animation-delay: .3s;
      }

      @keyframes feishiTypingDot {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: .3;
        }

        30% {
          transform: translateY(-5px);
          opacity: 1;
        }
      }

      #send:disabled,
      .quick-reply:disabled {
        cursor: not-allowed;
        opacity: .55;
      }

      #send.has-text:not(:disabled) {
        filter: brightness(1.08);
      }
    `;

    document.head.appendChild(runtimeStyle);
  }

  console.info("FEISHI V2 script Part 2 loaded.");
});

/*
=========================================================
FEISHI OFFICIAL WEBSITE V2
script.js - PART 3 / 4
=========================================================
包含：
✓ Gallery Lightbox
✓ 上一张 / 下一张
✓ ESC / 左右方向键
✓ 点击遮罩关闭
✓ 手机滑动切换
✓ 图片预加载
✓ Canvas 粒子背景
✓ 鼠标轻微视差
✓ 页面可见性优化

使用方法：
把本文件内容接在 Part 2 后面。
本文件使用独立 DOMContentLoaded 作用域，不会与 Part 1 / Part 2 冲突。
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* =====================================================
     Gallery Lightbox
     ===================================================== */

  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");

  const galleryButtons = $$(".gallery-open");
  const galleryItems = galleryButtons
    .map((button, index) => {
      const image = $("img", button);

      if (!image) return null;

      return {
        index,
        button,
        image,
        src:
          button.dataset.full ||
          image.dataset.full ||
          image.currentSrc ||
          image.src,
        alt:
          image.alt ||
          button.getAttribute("aria-label") ||
          `绯蚀图片 ${index + 1}`,
        caption:
          button.dataset.caption ||
          image.dataset.caption ||
          image.alt ||
          `绯蚀图片 ${index + 1}`
      };
    })
    .filter(Boolean);

  let currentGalleryIndex = 0;
  let lightboxOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  function normalizeGalleryIndex(index) {
    if (!galleryItems.length) return 0;

    return (
      (index % galleryItems.length) +
      galleryItems.length
    ) % galleryItems.length;
  }

  function preloadGalleryImage(index) {
    if (!galleryItems.length) return;

    const safeIndex = normalizeGalleryIndex(index);
    const item = galleryItems[safeIndex];

    if (!item?.src) return;

    const image = new Image();
    image.decoding = "async";
    image.src = item.src;
  }

  function updateLightboxContent(index) {
    if (!lightboxImage || !galleryItems.length) return;

    currentGalleryIndex = normalizeGalleryIndex(index);

    const item = galleryItems[currentGalleryIndex];

    lightboxImage.classList.add("is-changing");

    const temporaryImage = new Image();
    temporaryImage.decoding = "async";
    temporaryImage.src = item.src;

    temporaryImage.onload = () => {
      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;

      if (lightboxCaption) {
        lightboxCaption.textContent = item.caption;
      }

      requestAnimationFrame(() => {
        lightboxImage.classList.remove("is-changing");
      });
    };

    temporaryImage.onerror = () => {
      lightboxImage.classList.remove("is-changing");

      if (lightboxCaption) {
        lightboxCaption.textContent = "图片加载失败";
      }
    };

    preloadGalleryImage(currentGalleryIndex - 1);
    preloadGalleryImage(currentGalleryIndex + 1);
  }

  function openLightbox(index = 0) {
    if (!lightbox || !galleryItems.length) return;

    updateLightboxContent(index);

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");

    document.body.classList.add("lightbox-open");

    lightboxOpen = true;

    window.setTimeout(() => {
      lightboxClose?.focus();
    }, 120);
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");

    document.body.classList.remove("lightbox-open");

    lightboxOpen = false;

    galleryItems[currentGalleryIndex]?.button?.focus();
  }

  function showPreviousImage() {
    if (!galleryItems.length) return;

    updateLightboxContent(currentGalleryIndex - 1);
  }

  function showNextImage() {
    if (!galleryItems.length) return;

    updateLightboxContent(currentGalleryIndex + 1);
  }

  galleryItems.forEach(item => {
    item.button.setAttribute("role", "button");
    item.button.setAttribute("tabindex", "0");

    item.button.addEventListener("click", event => {
      event.preventDefault();
      openLightbox(item.index);
    });

    item.button.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(item.index);
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxPrev?.addEventListener("click", showPreviousImage);
  lightboxNext?.addEventListener("click", showNextImage);

  lightbox?.addEventListener("click", event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", event => {
    if (!lightboxOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousImage();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextImage();
    }

    if (event.key === "Tab" && lightbox) {
      const focusableElements = $$(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        lightbox
      );

      if (!focusableElements.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function resetTouchValues() {
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }

  lightbox?.addEventListener(
    "touchstart",
    event => {
      const touch = event.changedTouches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchEndX = touch.clientX;
      touchEndY = touch.clientY;
    },
    { passive: true }
  );

  lightbox?.addEventListener(
    "touchmove",
    event => {
      const touch = event.changedTouches[0];

      touchEndX = touch.clientX;
      touchEndY = touch.clientY;
    },
    { passive: true }
  );

  lightbox?.addEventListener(
    "touchend",
    () => {
      const horizontalDistance = touchEndX - touchStartX;
      const verticalDistance = touchEndY - touchStartY;

      const isHorizontalSwipe =
        Math.abs(horizontalDistance) >
        Math.abs(verticalDistance);

      const swipeThreshold = 55;

      if (
        isHorizontalSwipe &&
        Math.abs(horizontalDistance) >= swipeThreshold
      ) {
        if (horizontalDistance < 0) {
          showNextImage();
        } else {
          showPreviousImage();
        }
      }

      resetTouchValues();
    },
    { passive: true }
  );

  /* =====================================================
     Particle Background
     ===================================================== */

  const canvas = $("#particles");

  if (canvas instanceof HTMLCanvasElement) {
    const context = canvas.getContext("2d", {
      alpha: true
    });

    if (context) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        active: false
      };

      let canvasWidth = 0;
      let canvasHeight = 0;
      let devicePixelRatio = 1;
      let particles = [];
      let animationFrame = null;
      let pageVisible = !document.hidden;

      const PARTICLE_SETTINGS = {
        desktopCount: 78,
        tabletCount: 54,
        mobileCount: 34,
        minRadius: 0.7,
        maxRadius: 2.2,
        minSpeed: 0.08,
        maxSpeed: 0.32,
        connectionDistance: 110,
        pointerDistance: 150
      };

      class Particle {
        constructor() {
          this.reset(true);
        }

        reset(initial = false) {
          this.x = Math.random() * canvasWidth;
          this.y = initial
            ? Math.random() * canvasHeight
            : canvasHeight + Math.random() * 40;

          this.radius =
            PARTICLE_SETTINGS.minRadius +
            Math.random() *
              (
                PARTICLE_SETTINGS.maxRadius -
                PARTICLE_SETTINGS.minRadius
              );

          const direction =
            Math.random() > 0.5 ? 1 : -1;

          this.velocityX =
            direction *
            (
              PARTICLE_SETTINGS.minSpeed +
              Math.random() *
                (
                  PARTICLE_SETTINGS.maxSpeed -
                  PARTICLE_SETTINGS.minSpeed
                )
            );

          this.velocityY =
            -(
              PARTICLE_SETTINGS.minSpeed +
              Math.random() *
                (
                  PARTICLE_SETTINGS.maxSpeed -
                  PARTICLE_SETTINGS.minSpeed
                )
            );

          this.opacity = 0.12 + Math.random() * 0.34;
          this.twinkleSpeed = 0.006 + Math.random() * 0.014;
          this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
          this.x += this.velocityX;
          this.y += this.velocityY;

          this.opacity +=
            this.twinkleSpeed * this.twinkleDirection;

          if (this.opacity >= 0.48) {
            this.opacity = 0.48;
            this.twinkleDirection = -1;
          }

          if (this.opacity <= 0.1) {
            this.opacity = 0.1;
            this.twinkleDirection = 1;
          }

          if (
            this.y < -30 ||
            this.x < -30 ||
            this.x > canvasWidth + 30
          ) {
            this.reset(false);
          }

          if (pointer.active) {
            const differenceX = this.x - pointer.x;
            const differenceY = this.y - pointer.y;

            const distance = Math.hypot(
              differenceX,
              differenceY
            );

            if (
              distance > 0 &&
              distance < PARTICLE_SETTINGS.pointerDistance
            ) {
              const force =
                (
                  PARTICLE_SETTINGS.pointerDistance -
                  distance
                ) /
                PARTICLE_SETTINGS.pointerDistance;

              this.x +=
                (differenceX / distance) * force * 0.8;

              this.y +=
                (differenceY / distance) * force * 0.8;
            }
          }
        }

        draw() {
          context.beginPath();

          context.fillStyle = `rgba(255, 52, 96, ${this.opacity})`;

          context.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
          );

          context.fill();
        }
      }

      function getParticleCount() {
        if (prefersReducedMotion) return 16;
        if (window.innerWidth <= 520) {
          return PARTICLE_SETTINGS.mobileCount;
        }
        if (window.innerWidth <= 980) {
          return PARTICLE_SETTINGS.tabletCount;
        }
        return PARTICLE_SETTINGS.desktopCount;
      }

      function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;

        devicePixelRatio = Math.min(
          window.devicePixelRatio || 1,
          2
        );

        canvas.width = Math.round(
          canvasWidth * devicePixelRatio
        );

        canvas.height = Math.round(
          canvasHeight * devicePixelRatio
        );

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        context.setTransform(
          devicePixelRatio,
          0,
          0,
          devicePixelRatio,
          0,
          0
        );

        const targetCount = getParticleCount();

        if (particles.length > targetCount) {
          particles = particles.slice(0, targetCount);
        }

        while (particles.length < targetCount) {
          particles.push(new Particle());
        }
      }

      function drawConnections() {
        if (
          window.innerWidth <= 520 ||
          prefersReducedMotion
        ) {
          return;
        }

        for (
          let firstIndex = 0;
          firstIndex < particles.length;
          firstIndex += 1
        ) {
          const firstParticle = particles[firstIndex];

          for (
            let secondIndex = firstIndex + 1;
            secondIndex < particles.length;
            secondIndex += 1
          ) {
            const secondParticle = particles[secondIndex];

            const distance = Math.hypot(
              firstParticle.x - secondParticle.x,
              firstParticle.y - secondParticle.y
            );

            if (
              distance <
              PARTICLE_SETTINGS.connectionDistance
            ) {
              const opacity =
                (
                  1 -
                  distance /
                    PARTICLE_SETTINGS.connectionDistance
                ) *
                0.075;

              context.beginPath();

              context.strokeStyle =
                `rgba(255, 70, 110, ${opacity})`;

              context.lineWidth = 0.55;

              context.moveTo(
                firstParticle.x,
                firstParticle.y
              );

              context.lineTo(
                secondParticle.x,
                secondParticle.y
              );

              context.stroke();
            }
          }
        }
      }

      function renderParticles() {
        animationFrame = null;

        if (!pageVisible) return;

        context.clearRect(
          0,
          0,
          canvasWidth,
          canvasHeight
        );

        particles.forEach(particle => {
          particle.update();
          particle.draw();
        });

        drawConnections();

        animationFrame =
          window.requestAnimationFrame(renderParticles);
      }

      function startParticleAnimation() {
        if (animationFrame || !pageVisible) return;

        animationFrame =
          window.requestAnimationFrame(renderParticles);
      }

      function stopParticleAnimation() {
        if (!animationFrame) return;

        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      let resizeTimer = null;

      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(resizeTimer);

          resizeTimer = window.setTimeout(() => {
            resizeCanvas();
          }, 140);
        },
        { passive: true }
      );

      window.addEventListener(
        "pointermove",
        event => {
          pointer.x = event.clientX;
          pointer.y = event.clientY;
          pointer.active = true;
        },
        { passive: true }
      );

      window.addEventListener(
        "pointerleave",
        () => {
          pointer.active = false;
        },
        { passive: true }
      );

      document.addEventListener(
        "visibilitychange",
        () => {
          pageVisible = !document.hidden;

          if (pageVisible) {
            startParticleAnimation();
          } else {
            stopParticleAnimation();
          }
        }
      );

      resizeCanvas();
      startParticleAnimation();
    }
  }

  /* =====================================================
     Hero Mouse Parallax
     ===================================================== */

  const heroSection = $(".hero-section");
  const heroCharacter = $(".hero-character");
  const heroAura = $(".hero-aura");

  const parallaxAllowed =
    !window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches &&
    window.matchMedia("(pointer: fine)").matches;

  if (
    parallaxAllowed &&
    heroSection &&
    (heroCharacter || heroAura)
  ) {
    let parallaxFrame = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function renderParallax() {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;

      if (heroAura) {
        heroAura.style.setProperty(
          "--parallax-x",
          `${currentX * -8}px`
        );

        heroAura.style.setProperty(
          "--parallax-y",
          `${currentY * -8}px`
        );

        heroAura.style.transform =
          `translateX(calc(-50% + ${currentX * -8}px)) ` +
          `translateY(${currentY * -8}px)`;
      }

      if (heroCharacter) {
        heroCharacter.style.setProperty(
          "--character-parallax-x",
          `${currentX * 8}px`
        );

        heroCharacter.style.setProperty(
          "--character-parallax-y",
          `${currentY * 5}px`
        );
      }

      if (
        Math.abs(targetX - currentX) > 0.001 ||
        Math.abs(targetY - currentY) > 0.001
      ) {
        parallaxFrame =
          window.requestAnimationFrame(renderParallax);
      } else {
        parallaxFrame = null;
      }
    }

    function requestParallaxFrame() {
      if (parallaxFrame) return;

      parallaxFrame =
        window.requestAnimationFrame(renderParallax);
    }

    heroSection.addEventListener(
      "pointermove",
      event => {
        const bounds =
          heroSection.getBoundingClientRect();

        targetX =
          (
            event.clientX - bounds.left
          ) /
            bounds.width -
          0.5;

        targetY =
          (
            event.clientY - bounds.top
          ) /
            bounds.height -
          0.5;

        requestParallaxFrame();
      },
      { passive: true }
    );

    heroSection.addEventListener(
      "pointerleave",
      () => {
        targetX = 0;
        targetY = 0;
        requestParallaxFrame();
      },
      { passive: true }
    );
  }

  /* =====================================================
     Runtime Styles
     ===================================================== */

  if (!$("#feishi-part3-runtime-style")) {
    const style = document.createElement("style");
    style.id = "feishi-part3-runtime-style";

    style.textContent = `
      #lightboxImage {
        transition:
          opacity .24s ease,
          transform .24s ease;
      }

      #lightboxImage.is-changing {
        opacity: .2;
        transform: scale(.985);
      }

      .gallery-open:focus-visible,
      .lightbox-close:focus-visible,
      .lightbox-nav:focus-visible {
        outline: 2px solid #ff315d;
        outline-offset: 4px;
      }

      @media (pointer: fine) and (prefers-reduced-motion: no-preference) {
        .hero-character {
          translate:
            var(--character-parallax-x, 0)
            var(--character-parallax-y, 0);
        }
      }
    `;

    document.head.appendChild(style);
  }

  console.info("FEISHI V2 script Part 3 loaded.");
});

/*
=========================================================
FEISHI OFFICIAL WEBSITE V2
script.js - PART 4 / 4
=========================================================
包含：
✓ 图片懒加载
✓ 错误图片回退
✓ Active Navigation
✓ Back To Top
✓ 外链安全处理
✓ Merch 卡片交互
✓ Douyin 链接复制
✓ 音效开关预留
✓ 性能优化
✓ Resize / Scroll 防抖
✓ 页面生命周期清理
✓ 最终初始化与兼容性处理

使用方法：
把本文件内容接在 Part 3 后面。
本文件使用独立 DOMContentLoaded 作用域，不会与 Part 1 / 2 / 3 冲突。
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* =====================================================
     Utility Functions
     ===================================================== */

  function debounce(callback, delay = 160) {
    let timer = null;

    return (...args) => {
      window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }

  function throttle(callback, delay = 80) {
    let lastRun = 0;
    let timer = null;

    return (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastRun);

      if (remaining <= 0) {
        window.clearTimeout(timer);
        timer = null;
        lastRun = now;
        callback(...args);
        return;
      }

      if (!timer) {
        timer = window.setTimeout(() => {
          lastRun = Date.now();
          timer = null;
          callback(...args);
        }, remaining);
      }
    };
  }

  function isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();

    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  }

  /* =====================================================
     Lazy Loading
     ===================================================== */

  const lazyImages = $$(
    "img[data-src], img[data-lazy-src], source[data-srcset]"
  );

  function loadLazyElement(element) {
    if (!element || element.dataset.loaded === "true") return;

    if (element.tagName === "SOURCE") {
      const sourceSet =
        element.dataset.srcset ||
        element.getAttribute("data-srcset");

      if (sourceSet) {
        element.srcset = sourceSet;
      }
    } else {
      const source =
        element.dataset.src ||
        element.dataset.lazySrc ||
        element.getAttribute("data-src") ||
        element.getAttribute("data-lazy-src");

      const sourceSet =
        element.dataset.srcset ||
        element.getAttribute("data-srcset");

      if (source) {
        element.src = source;
      }

      if (sourceSet) {
        element.srcset = sourceSet;
      }

      element.classList.add("is-loading");

      element.addEventListener(
        "load",
        () => {
          element.classList.remove("is-loading");
          element.classList.add("is-loaded");
        },
        { once: true }
      );
    }

    element.dataset.loaded = "true";
  }

  if ("IntersectionObserver" in window) {
    const lazyObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          loadLazyElement(entry.target);
          lazyObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "280px 0px",
        threshold: 0.01
      }
    );

    lazyImages.forEach(element => {
      lazyObserver.observe(element);
    });
  } else {
    lazyImages.forEach(loadLazyElement);
  }

  $$("img[loading='lazy']").forEach(image => {
    image.addEventListener(
      "load",
      () => {
        image.classList.add("is-loaded");
      },
      { once: true }
    );
  });

  /* =====================================================
     Image Error Fallback
     ===================================================== */

  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#12070a"/>
          <stop offset="1" stop-color="#310a13"/>
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#bg)"/>
      <circle cx="450" cy="270" r="90" fill="none" stroke="#ff315d" stroke-width="3" opacity=".6"/>
      <path d="M410 300 L450 240 L490 300" fill="none" stroke="#ff315d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="450" y="405" text-anchor="middle" fill="#f8dce3" font-family="Arial, sans-serif" font-size="28">FEISHI</text>
      <text x="450" y="445" text-anchor="middle" fill="#c68f9b" font-family="Arial, sans-serif" font-size="18">IMAGE NOT AVAILABLE</text>
    </svg>
  `;

  const fallbackDataUrl =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(fallbackSvg);

  $$("img").forEach(image => {
    image.addEventListener(
      "error",
      () => {
        if (image.dataset.fallbackApplied === "true") return;

        image.dataset.fallbackApplied = "true";
        image.classList.add("image-error");
        image.src = fallbackDataUrl;
      },
      { once: true }
    );
  });

  /* =====================================================
     Active Navigation
     ===================================================== */

  const navigationLinks = $$(
    '.site-nav a[href^="#"], .mobile-nav a[href^="#"]'
  );

  const sectionEntries = navigationLinks
    .map(link => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return null;

      const section = $(href);

      if (!section) return null;

      return {
        link,
        section,
        id: href.slice(1)
      };
    })
    .filter(Boolean);

  function setActiveSection(id) {
    sectionEntries.forEach(entry => {
      const isActive = entry.id === id;

      entry.link.classList.toggle("is-active", isActive);

      if (isActive) {
        entry.link.setAttribute("aria-current", "page");
      } else {
        entry.link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sectionEntries.length) {
    const sectionObserver = new IntersectionObserver(
      entries => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio -
              first.intersectionRatio
          );

        if (!visibleEntries.length) return;

        setActiveSection(visibleEntries[0].target.id);
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0.05, 0.15, 0.3, 0.5]
      }
    );

    sectionEntries.forEach(entry => {
      sectionObserver.observe(entry.section);
    });
  }

  /* =====================================================
     Back To Top
     ===================================================== */

  let backToTop = $("#backToTop");

  if (!backToTop) {
    backToTop = document.createElement("button");
    backToTop.id = "backToTop";
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "返回页面顶部");
    backToTop.innerHTML = `
      <span aria-hidden="true">↑</span>
    `;

    document.body.appendChild(backToTop);
  }

  function updateBackToTop() {
    backToTop.classList.toggle(
      "is-visible",
      window.scrollY > 600
    );
  }

  window.addEventListener(
    "scroll",
    throttle(updateBackToTop, 100),
    { passive: true }
  );

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  updateBackToTop();

  /* =====================================================
     External Link Security
     ===================================================== */

  $$('a[href^="http"]').forEach(link => {
    let url = null;

    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (url.origin === window.location.origin) return;

    if (!link.target) {
      link.target = "_blank";
    }

    const relValues = new Set(
      (link.rel || "")
        .split(/\s+/)
        .filter(Boolean)
    );

    relValues.add("noopener");
    relValues.add("noreferrer");

    link.rel = [...relValues].join(" ");
  });

  /* =====================================================
     Douyin Copy Button
     ===================================================== */

  const DOUYIN_ID = "87328734252";
  const copyButtons = $$(
    "[data-copy-douyin], #copyDouyin, .copy-douyin"
  );

  async function copyText(text) {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  function showTemporaryButtonMessage(
    button,
    message,
    duration = 1600
  ) {
    const originalText =
      button.dataset.originalText ||
      button.textContent.trim();

    button.dataset.originalText = originalText;
    button.textContent = message;
    button.classList.add("is-success");

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("is-success");
    }, duration);
  }

  copyButtons.forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await copyText(DOUYIN_ID);
        showTemporaryButtonMessage(
          button,
          "抖音号已复制"
        );
      } catch (error) {
        console.warn("Copy failed:", error);
        showTemporaryButtonMessage(
          button,
          `抖音号：${DOUYIN_ID}`,
          2600
        );
      }
    });
  });

  /* =====================================================
     Merch Cards
     ===================================================== */

  const merchCards = $$(".merch-card");

  merchCards.forEach(card => {
    const action =
      $(".merch-action", card) ||
      $("button", card) ||
      $("a", card);

    card.addEventListener("pointerenter", () => {
      card.classList.add("is-hovered");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-hovered");
    });

    if (!action) return;

    action.addEventListener("click", event => {
      if (
        action.tagName === "A" &&
        action.getAttribute("href") &&
        action.getAttribute("href") !== "#"
      ) {
        return;
      }

      event.preventDefault();

      showTemporaryButtonMessage(
        action,
        "敬请期待"
      );
    });
  });

  /* =====================================================
     Optional Sound Toggle
     ===================================================== */

  const soundToggle = $("#soundToggle");
  const ambientAudio = $("#ambientAudio");

  function getSavedSoundPreference() {
    try {
      return (
        localStorage.getItem(
          "feishi-v2-sound-enabled"
        ) === "true"
      );
    } catch {
      return false;
    }
  }

  function saveSoundPreference(enabled) {
    try {
      localStorage.setItem(
        "feishi-v2-sound-enabled",
        String(enabled)
      );
    } catch {
      // Ignore blocked storage.
    }
  }

  function updateSoundButton(enabled) {
    if (!soundToggle) return;

    soundToggle.classList.toggle(
      "is-active",
      enabled
    );

    soundToggle.setAttribute(
      "aria-pressed",
      String(enabled)
    );

    soundToggle.setAttribute(
      "aria-label",
      enabled ? "关闭背景音效" : "开启背景音效"
    );
  }

  async function setSoundEnabled(enabled) {
    if (!ambientAudio) {
      updateSoundButton(false);
      return;
    }

    ambientAudio.volume = 0.28;
    ambientAudio.loop = true;

    if (enabled) {
      try {
        await ambientAudio.play();
        updateSoundButton(true);
        saveSoundPreference(true);
      } catch (error) {
        console.warn(
          "Audio playback was blocked:",
          error
        );

        updateSoundButton(false);
        saveSoundPreference(false);
      }
    } else {
      ambientAudio.pause();
      updateSoundButton(false);
      saveSoundPreference(false);
    }
  }

  if (soundToggle && ambientAudio) {
    const savedPreference =
      getSavedSoundPreference();

    updateSoundButton(savedPreference);

    soundToggle.addEventListener("click", () => {
      const enabled =
        soundToggle.getAttribute("aria-pressed") ===
        "true";

      setSoundEnabled(!enabled);
    });
  }

  /* =====================================================
     Hero Character Entrance
     ===================================================== */

  const heroCharacter = $(".hero-character");
  const heroContent = $(".hero-content");

  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        heroCharacter?.classList.add("is-ready");
        heroContent?.classList.add("is-ready");
        document.body.classList.add("site-ready");
      }, 140);
    },
    { once: true }
  );

  /* =====================================================
     Reduced Motion
     ===================================================== */

  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function applyMotionPreference(event = motionQuery) {
    document.documentElement.classList.toggle(
      "reduced-motion",
      event.matches
    );
  }

  applyMotionPreference();

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener(
      "change",
      applyMotionPreference
    );
  } else if (
    typeof motionQuery.addListener === "function"
  ) {
    motionQuery.addListener(
      applyMotionPreference
    );
  }

  /* =====================================================
     Viewport Height Fix
     ===================================================== */

  function setViewportHeightVariable() {
    const viewportHeight =
      window.innerHeight * 0.01;

    document.documentElement.style.setProperty(
      "--vh",
      `${viewportHeight}px`
    );
  }

  const updateViewportHeight = debounce(
    setViewportHeightVariable,
    120
  );

  window.addEventListener(
    "resize",
    updateViewportHeight,
    { passive: true }
  );

  window.addEventListener(
    "orientationchange",
    updateViewportHeight,
    { passive: true }
  );

  setViewportHeightVariable();

  /* =====================================================
     Hover Support Detection
     ===================================================== */

  const hoverQuery = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  function updateHoverSupport(event = hoverQuery) {
    document.documentElement.classList.toggle(
      "supports-hover",
      event.matches
    );
  }

  updateHoverSupport();

  if (typeof hoverQuery.addEventListener === "function") {
    hoverQuery.addEventListener(
      "change",
      updateHoverSupport
    );
  }

  /* =====================================================
     Page Visibility
     ===================================================== */

  document.addEventListener(
    "visibilitychange",
    () => {
      document.documentElement.classList.toggle(
        "page-hidden",
        document.hidden
      );

      if (
        document.hidden &&
        ambientAudio &&
        !ambientAudio.paused
      ) {
        ambientAudio.dataset.resumeAfterVisibility =
          "true";

        ambientAudio.pause();
      } else if (
        !document.hidden &&
        ambientAudio?.dataset
          .resumeAfterVisibility === "true"
      ) {
        delete ambientAudio.dataset
          .resumeAfterVisibility;

        ambientAudio.play().catch(() => {
          updateSoundButton(false);
          saveSoundPreference(false);
        });
      }
    }
  );

  /* =====================================================
     Keyboard Accessibility
     ===================================================== */

  document.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      document.body.classList.add(
        "keyboard-navigation"
      );
    }

    if (
      event.key === "Home" &&
      event.altKey
    ) {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  });

  document.addEventListener(
    "pointerdown",
    () => {
      document.body.classList.remove(
        "keyboard-navigation"
      );
    },
    { passive: true }
  );

  /* =====================================================
     Form Safety
     ===================================================== */

  $$("form").forEach(form => {
    form.addEventListener("submit", event => {
      if (
        form.dataset.allowSubmit === "true"
      ) {
        return;
      }

      event.preventDefault();
    });
  });

  /* =====================================================
     Runtime Styles
     ===================================================== */

  if (!$("#feishi-part4-runtime-style")) {
    const style = document.createElement("style");
    style.id = "feishi-part4-runtime-style";

    style.textContent = `
      .back-to-top {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 80;
        width: 46px;
        height: 46px;
        border: 1px solid rgba(255, 73, 111, .35);
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background:
          linear-gradient(
            145deg,
            rgba(65, 8, 20, .92),
            rgba(14, 5, 8, .92)
          );
        box-shadow:
          0 14px 40px rgba(0, 0, 0, .42),
          inset 0 1px 0 rgba(255, 255, 255, .08);
        opacity: 0;
        visibility: hidden;
        transform: translateY(16px) scale(.92);
        transition:
          opacity .25s ease,
          visibility .25s ease,
          transform .25s ease,
          border-color .25s ease;
        cursor: pointer;
      }

      .back-to-top.is-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      .back-to-top:hover {
        border-color: rgba(255, 73, 111, .85);
        transform: translateY(-3px) scale(1.03);
      }

      .site-nav a.is-active,
      .mobile-nav a.is-active {
        color: #ff5879;
      }

      .site-nav a.is-active::after {
        transform: scaleX(1);
        opacity: 1;
      }

      img.is-loading {
        opacity: .18;
        filter: blur(8px);
      }

      img.is-loaded {
        opacity: 1;
        filter: none;
        transition:
          opacity .45s ease,
          filter .45s ease;
      }

      img.image-error {
        object-fit: cover;
        opacity: .85;
      }

      .hero-character,
      .hero-content {
        opacity: 0;
        transform: translateY(18px);
        transition:
          opacity .75s ease,
          transform .75s ease;
      }

      .hero-character.is-ready,
      .hero-content.is-ready {
        opacity: 1;
        transform: translateY(0);
      }

      .merch-card.is-hovered {
        transform: translateY(-6px);
      }

      .is-success {
        filter: brightness(1.12);
      }

      .keyboard-navigation :focus-visible {
        outline: 2px solid #ff315d !important;
        outline-offset: 4px !important;
      }

      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        scroll-behavior: auto !important;
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .001ms !important;
      }

      @media (max-width: 640px) {
        .back-to-top {
          right: 15px;
          bottom: 15px;
          width: 42px;
          height: 42px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =====================================================
     Final Health Check
     ===================================================== */

  const requiredElements = [
    {
      selector: ".site-header",
      label: "site header"
    },
    {
      selector: ".hero-section",
      label: "hero section"
    }
  ];

  const missingElements = requiredElements
    .filter(item => !$(item.selector))
    .map(item => item.label);

  if (missingElements.length) {
    console.warn(
      "FEISHI V2 missing optional elements:",
      missingElements.join(", ")
    );
  }

  document.documentElement.classList.add(
    "js-enabled"
  );

  console.info(
    "FEISHI V2 script Part 4 loaded. All script parts are complete."
  );
});
