"use strict";

/*
 * Pet ambulante: usa o emoji do pet atualmente equipado e o mantém como
 * companheiro flutuante pela janela inteira, sem mover os elementos do jogo.
 */
(() => {
    const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pet = null;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let direction = 1;
    let walking = false;
    let nextMoveAt = 0;
    let frame = 0;
    let lastFrame = 0;
    let idleUntil = 0;
    let stopped = false;

    function animationsEnabled() {
        const setting = document.getElementById("configAnimacoes");
        return !REDUCED_MOTION.matches && (!setting || setting.checked);
    }

    function createPet() {
        if (pet) return pet;
        pet = document.createElement("div");
        pet.id = "petPasseante";
        pet.className = "pet-passeante pet-passeante-idle";
        pet.setAttribute("aria-hidden", "true");
        pet.setAttribute("role", "presentation");
        document.body.appendChild(pet);
        const initial = randomPosition();
        x = targetX = initial.x;
        y = targetY = initial.y;
        applyPosition();
        return pet;
    }

    function randomPosition() {
        const size = pet ? pet.getBoundingClientRect() : { width: 72, height: 72 };
        const margin = 12;
        const maxX = Math.max(margin, window.innerWidth - (size.width || 72) - margin);
        const maxY = Math.max(margin, window.innerHeight - (size.height || 72) - margin);
        return {
            x: margin + Math.random() * Math.max(0, maxX - margin),
            y: margin + Math.random() * Math.max(0, maxY - margin)
        };
    }

    function applyPosition() {
        if (!pet) return;
        pet.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scaleX(${direction})`;
    }

    function setAnimation(isWalking) {
        if (!pet) return;
        if (!animationsEnabled()) isWalking = false;
        if (walking === isWalking && pet.classList.contains(isWalking ? "pet-passeante-walk" : "pet-passeante-idle")) return;
        walking = isWalking;
        pet.classList.toggle("pet-passeante-walk", walking);
        pet.classList.toggle("pet-passeante-idle", !walking);
    }

    function syncEquippedPet() {
        const emojiElement = document.getElementById("petAtivoEmoji");
        const activeId = localStorage.getItem("petAtivoId");
        const emoji = emojiElement ? emojiElement.textContent.trim() : "";
        const equipped = activeId && activeId !== "null" && emoji && emoji !== "🐾";
        if (!equipped) {
            if (pet) pet.hidden = true;
            return;
        }
        createPet();
        pet.hidden = false;
        if (pet.textContent !== emoji) {
            pet.textContent = emoji;
            // Evita que o pet recém-equipado herde o destino do anterior.
            const position = randomPosition();
            x = targetX = position.x;
            y = targetY = position.y;
            applyPosition();
            setAnimation(false);
            idleUntil = performance.now() + 700;
        }
    }

    function chooseDestination(now) {
        const position = randomPosition();
        targetX = position.x;
        targetY = position.y;
        direction = targetX < x ? -1 : 1;
        setAnimation(true);
        nextMoveAt = now + 1800 + Math.random() * 2600;
    }

    function animate(now) {
        frame = requestAnimationFrame(animate);
        if (stopped || !pet || pet.hidden) return;
        if (!lastFrame) lastFrame = now;
        const delta = Math.min(0.04, (now - lastFrame) / 1000);
        lastFrame = now;

        if (!animationsEnabled()) {
            setAnimation(false);
            return;
        }

        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.hypot(dx, dy);
        if (distance > 4) {
            const speed = 100; // pixels por segundo
            const step = Math.min(distance, speed * delta);
            x += dx / distance * step;
            y += dy / distance * step;
            applyPosition();
        } else if (walking) {
            x = targetX;
            y = targetY;
            applyPosition();
            setAnimation(false);
            idleUntil = now + 900 + Math.random() * 1900;
            nextMoveAt = idleUntil;
        } else if (now >= Math.max(nextMoveAt, idleUntil)) {
            chooseDestination(now);
        }
    }

    function start() {
        if (stopped) return;
        syncEquippedPet();
        if (!frame) frame = requestAnimationFrame(animate);
    }

    document.addEventListener("DOMContentLoaded", start, { once: true });
    // Atualiza quando o sistema de pets renderiza, equipa ou troca o emoji.
    const watchPet = () => {
        const element = document.getElementById("petAtivoEmoji");
        if (!element || element.dataset.roamingObserved) return;
        element.dataset.roamingObserved = "true";
        new MutationObserver(syncEquippedPet).observe(element, { childList: true, characterData: true, subtree: true });
    };
    document.addEventListener("DOMContentLoaded", watchPet, { once: true });
    window.addEventListener("storage", syncEquippedPet);
    window.addEventListener("resize", () => {
        if (!pet || pet.hidden) return;
        const position = randomPosition();
        targetX = position.x;
        targetY = position.y;
    });
    document.addEventListener("change", event => {
        if (event.target && event.target.id === "configAnimacoes") {
            if (!animationsEnabled()) setAnimation(false);
        }
    });
    REDUCED_MOTION.addEventListener?.("change", () => {
        if (!animationsEnabled()) setAnimation(false);
    });

    if (document.readyState === "loading") {
        // Os listeners DOMContentLoaded acima cuidarão da inicialização.
    } else {
        start();
        watchPet();
    }
})();