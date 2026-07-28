
/* =========================================================
   FEISHI AI CHAT — OFFLINE CHARACTER CHAT
   可直接替换原 script.js
   ========================================================= */

"use strict";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* Loading */
const loading = $("#loading");
const enterButton = $("#enter");

if (loading && enterButton) {
    enterButton.addEventListener("click", () => {
        loading.style.opacity = "0";
        loading.style.visibility = "hidden";
        loading.style.pointerEvents = "none";
        setTimeout(() => loading.remove(), 700);
    });
}

/* Header */
const header = $("header");
window.addEventListener("scroll", () => {
    if (!header) return;
    const active = window.scrollY > 60;
    header.style.background = active
        ? "rgba(10,10,12,.82)"
        : "rgba(10,10,12,.35)";
});

/* Smooth anchors */
$$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const target = $(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
    });
});

/* Reveal */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: .14 });

$$(".fade-up").forEach((item) => observer.observe(item));

/* Character parallax */
const character = $("#character");
if (character && !window.matchMedia("(pointer: coarse)").matches) {
    window.addEventListener("mousemove", (event) => {
        const x = (event.clientX / innerWidth - .5) * 18;
        const y = (event.clientY / innerHeight - .5) * 10;
        character.style.transform = `translate3d(${x}px,${y}px,0)`;
    });
}

/* Live */
const liveStatus = $("#liveStatus");
const countdown = $("#countdown");
const sessions = [[360,540],[840,1020]];

function updateLive(){
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const live = sessions.some(([start,end]) => minutes >= start && minutes < end);

    if(liveStatus){
        liveStatus.textContent = live ? "🔴 LIVE NOW" : "⚫ OFFLINE";
        liveStatus.classList.toggle("live", live);
    }

    if(!countdown) return;

    if(live){
        countdown.textContent = "直播进行中";
        return;
    }

    let target = null;

    for(const [start] of sessions){
        const date = new Date(now);
        date.setHours(Math.floor(start / 60), start % 60, 0, 0);

        if(date > now){
            target = date;
            break;
        }
    }

    if(!target){
        target = new Date(now);
        target.setDate(target.getDate() + 1);
        target.setHours(6,0,0,0);
    }

    const difference = Math.max(0, target - now);
    const h = String(Math.floor(difference / 3600000)).padStart(2,"0");
    const m = String(Math.floor(difference % 3600000 / 60000)).padStart(2,"0");
    const s = String(Math.floor(difference % 60000 / 1000)).padStart(2,"0");

    countdown.textContent = `${h}:${m}:${s}`;
}

updateLive();
setInterval(updateLive,1000);

/* Particles */
(() => {
    const canvas = $("#particles");
    if(!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let particles = [];

    function resize(){
        const ratio = Math.min(devicePixelRatio || 1,2);
        width = innerWidth;
        height = innerHeight;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(ratio,0,0,ratio,0,0);

        particles = Array.from({length:65},() => ({
            x:Math.random() * width,
            y:Math.random() * height,
            radius:Math.random() * 1.8 + .5,
            vx:(Math.random() - .5) * .22,
            vy:-Math.random() * .22 - .04,
            alpha:Math.random() * .5 + .25
        }));
    }

    function draw(){
        ctx.clearRect(0,0,width,height);

        particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if(particle.y < -10){
                particle.y = height + 10;
                particle.x = Math.random() * width;
            }

            if(particle.x < -10) particle.x = width + 10;
            if(particle.x > width + 10) particle.x = -10;

            ctx.beginPath();
            ctx.arc(particle.x,particle.y,particle.radius,0,Math.PI * 2);
            ctx.fillStyle = `rgba(226,35,86,${particle.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    resize();
    draw();
    addEventListener("resize",resize);
})();

/* Lightbox */
(() => {
    const lightbox = $("#lightbox");
    if(!lightbox) return;

    const image = $("img",lightbox);

    $$(".gallery-item img").forEach((item) => {
        item.addEventListener("click",() => {
            image.src = item.src;
            image.alt = item.alt || "放大图片";
            lightbox.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    });

    function close(){
        lightbox.classList.remove("active");
        document.body.style.overflow = "";
    }

    lightbox.addEventListener("click",close);
    document.addEventListener("keydown",(event) => {
        if(event.key === "Escape") close();
    });
})();

/* AI Chat */
(() => {
    const messages = $("#messages");
    const input = $("#prompt");
    const send = $("#send");

    if(!messages || !input || !send) return;

    const STORAGE_KEY = "feishi_chat_black_red_v1";
    let busy = false;

    const rules = [
        {
            words:["你好","嗨","hello","hi","在吗"],
            replies:["在。欢迎来到我的世界。","你好，我是绯蚀。今天想聊些什么？","我在这里。你终于来了。"]
        },
        {
            words:["介绍","你是谁","自我介绍"],
            replies:["我是绯蚀，一名杂谈主播。喜欢聊天、分享生活，也喜欢陪着大家。"]
        },
        {
            words:["直播","几点","开播","时间"],
            replies:["直播时间通常是 06:00–09:00，以及 14:00–17:00。记得来找我。"]
        },
        {
            words:["抖音","主页","账号"],
            replies:["官方抖音号是 87328734252。About 页面里可以直接进入主页。"]
        },
        {
            words:["累","难过","压力","不开心","烦"],
            replies:["先喝点水，深呼吸。剩下的事情可以一件一件来。","今天已经很努力了。休息不是偷懒。","我在。你可以慢慢说。"]
        },
        {
            words:["喜欢你","爱你","理想型"],
            replies:["一定要理想型吗？我不行吗。","听到了。那你要记得一直喜欢。"]
        },
        {
            words:["晚安","睡觉"],
            replies:["晚安。别熬得太晚，我会在这里等你回来。","去睡吧。希望你今晚能做一个安稳的梦。"]
        },
        {
            words:["早安","早上好"],
            replies:["早安。新的一天也要好好照顾自己。"]
        },
        {
            words:["周边","徽章","立牌","拍立得"],
            replies:["周边区目前有徽章、亚克力立牌和拍立得展示。"]
        }
    ];

    const fallback = [
        "嗯……我有在听。你可以再多说一点。",
        "这个话题挺有意思的。你是怎么想到的？",
        "不用急，慢慢说就好。",
        "我可能还不够聪明，但我愿意陪你聊。",
        "今天也辛苦了。先在这里休息一下吧。"
    ];

    function random(list){
        return list[Math.floor(Math.random() * list.length)];
    }

    function normalize(value){
        return String(value).replace(/\s+/g," ").trim();
    }

    function saveConversation(){
        const data = $$(".message",messages).slice(-60).map((item) => ({
            role:item.classList.contains("user") ? "user" : "bot",
            text:item.textContent || ""
        }));

        localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    }

    function restoreConversation(){
        try{
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            if(!Array.isArray(data) || !data.length) return false;

            messages.innerHTML = "";

            data.forEach((item) => {
                const element = document.createElement("div");
                element.className = `message ${item.role === "user" ? "user" : "bot"}`;
                element.textContent = item.text;
                element.style.animation = "none";
                messages.appendChild(element);
            });

            messages.scrollTop = messages.scrollHeight;
            return true;
        }catch{
            return false;
        }
    }

    function addMessage(text,role){
        const element = document.createElement("div");
        element.className = `message ${role}`;
        element.textContent = normalize(text);
        messages.appendChild(element);
        messages.scrollTo({top:messages.scrollHeight,behavior:"smooth"});
        saveConversation();
        return element;
    }

    function getReply(text){
        const lowered = text.toLowerCase();

        for(const rule of rules){
            if(rule.words.some((word) => lowered.includes(word.toLowerCase()))){
                return random(rule.replies);
            }
        }

        return random(fallback);
    }

    function typingIndicator(){
        const element = document.createElement("div");
        element.className = "message bot typing-message";
        element.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        messages.appendChild(element);
        messages.scrollTop = messages.scrollHeight;
        return element;
    }

    function typeReply(text,element){
        return new Promise((resolve) => {
            element.className = "message bot";
            element.textContent = "";

            let index = 0;

            const timer = setInterval(() => {
                element.textContent += text[index] || "";
                index += 1;
                messages.scrollTop = messages.scrollHeight;

                if(index >= text.length){
                    clearInterval(timer);
                    saveConversation();
                    resolve();
                }
            },28);
        });
    }

    async function submit(){
        if(busy) return;

        const text = normalize(input.value);
        if(!text) return;

        busy = true;
        send.disabled = true;
        input.disabled = true;

        addMessage(text,"user");
        input.value = "";

        const indicator = typingIndicator();
        const reply = getReply(text);

        await new Promise((resolve) => setTimeout(resolve,700));
        await typeReply(reply,indicator);

        busy = false;
        send.disabled = false;
        input.disabled = false;
        input.focus();
    }

    function buildTools(){
        const inputArea = $(".input");
        if(!inputArea || $(".chat-tools")) return;

        const tools = document.createElement("div");
        tools.className = "chat-tools";

        ["介绍一下自己","直播时间","官方抖音","今天有点累"].forEach((label) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "quick-reply";
            button.textContent = label;

            button.addEventListener("click",() => {
                input.value = label;
                submit();
            });

            tools.appendChild(button);
        });

        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "clear-chat";
        clear.textContent = "清空记录";

        clear.addEventListener("click",() => {
            if(!confirm("确定清空聊天记录吗？")) return;

            localStorage.removeItem(STORAGE_KEY);
            messages.innerHTML = "";
            addMessage("欢迎来到绯蚀 Official Website。","bot");
        });

        tools.appendChild(clear);
        inputArea.parentElement.insertBefore(tools,inputArea);
    }

    restoreConversation();
    buildTools();

    send.addEventListener("click",submit);

    input.addEventListener("keydown",(event) => {
        if(event.key === "Enter" && !event.shiftKey){
            event.preventDefault();
            submit();
        }
    });
})();
