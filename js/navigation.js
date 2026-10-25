"use strict";

(() => {
    const AREAS = [
        ["loja", "🏪 Loja", ".loja"],
        ["upgrades", "⬆️ Upgrades", ".upgrades"],
        ["rebirth", "⭐ Rebirth", ".prestige"],
        ["prestige", "🪙 Loja de Prestígio", ".prestige-shop-panel"],
        ["pets", "🐾 Pets", ".painel-pets"],
        ["contratos", "📜 Contratos", ".contratos"],
        ["estatisticas", "📊 Estatísticas", ".estatisticas"],
        ["conquistas", "🏆 Conquistas", ".conquistas"]
    ];

    function carregarEstilos() {
        if (!document.querySelector('link[data-burger-navigation="true"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/css/navigation.css";
            link.dataset.burgerNavigation = "true";
            document.head.appendChild(link);
        }
        if (!document.querySelector('link[data-burger-ui-polish="true"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/css/ui-polish.css";
            link.dataset.burgerUiPolish = "true";
            document.head.appendChild(link);
        }
    }

    function carregarExpansaoConteudo() {
        if (document.querySelector('script[data-burger-content-expansion="true"]')) return;
        const script = document.createElement("script");
        script.src = "/js/content-expansion.js";
        script.defer = true;
        script.dataset.burgerContentExpansion = "true";
        document.body.appendChild(script);
    }

    function iniciarNavegacao() {
        carregarEstilos();

        const painel = document.querySelector(".painel");
        const configBtn = document.getElementById("configBtn");
        const languageArea = document.querySelector(".info-language");
        if (!painel || !configBtn || document.querySelector(".bc-areas-nav")) {
            carregarExpansaoConteudo();
            return;
        }

        document.querySelectorAll('body > img[src*="art_1"]').forEach(imagem => {
            imagem.hidden = true;
            imagem.setAttribute("aria-hidden", "true");
        });

        if (languageArea) {
            configBtn.classList.add("bc-settings-top-btn");
            configBtn.style.margin = "0";
            configBtn.style.width = "auto";
            languageArea.appendChild(configBtn);
        }

        const nav = document.createElement("nav");
        nav.className = "bc-areas-nav";
        nav.setAttribute("aria-label", "Áreas do Burger Clicker");

        const toggleMenus = document.createElement("button");
        toggleMenus.type = "button";
        toggleMenus.className = "bc-areas-titulo";
        toggleMenus.id = "bc-menus-toggle";
        toggleMenus.setAttribute("aria-expanded", "false");
        toggleMenus.setAttribute("aria-controls", "bc-menus-lista");
        toggleMenus.innerHTML = '<span class="bc-menus-titulo-texto">📂 Menus do jogo</span><span class="bc-menus-seta" aria-hidden="true">⌄</span>';
        nav.appendChild(toggleMenus);

        const listaMenus = document.createElement("div");
        listaMenus.className = "bc-menus-lista";
        listaMenus.id = "bc-menus-lista";
        listaMenus.hidden = true;
        nav.appendChild(listaMenus);

        toggleMenus.addEventListener("click", () => {
            const aberta = toggleMenus.getAttribute("aria-expanded") !== "true";
            toggleMenus.setAttribute("aria-expanded", aberta ? "true" : "false");
            listaMenus.hidden = !aberta;
            toggleMenus.classList.toggle("aberto", aberta);
        });

        const secoes = [];
        const abrirArea = (indice, foco = true) => {
            secoes.forEach((secao, i) => {
                const aberta = i === indice && secao.elemento.hidden;
                secao.elemento.hidden = !aberta;
                secao.botao.setAttribute("aria-expanded", aberta ? "true" : "false");
                secao.botao.classList.toggle("ativo", aberta);
            });
            if (foco && secoes[indice]?.elemento && !secoes[indice].elemento.hidden) {
                requestAnimationFrame(() => secoes[indice].elemento.scrollIntoView({ behavior: "smooth", block: "start" }));
            }
        };

        AREAS.forEach(([id, rotulo, seletor], indice) => {
            const elemento = document.querySelector(seletor);
            if (!elemento) return;
            elemento.classList.add("bc-area-conteudo");
            elemento.hidden = true;
            elemento.id = elemento.id || `bc-area-${id}`;

            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "bc-area-btn";
            botao.textContent = rotulo;
            botao.setAttribute("aria-controls", elemento.id);
            botao.setAttribute("aria-expanded", "false");
            botao.addEventListener("click", () => abrirArea(indice));
            listaMenus.appendChild(botao);
            secoes.push({ botao, elemento });
        });

        painel.insertAdjacentElement("afterend", nav);
        if (secoes.length) {
            secoes[0].elemento.hidden = false;
            secoes[0].botao.setAttribute("aria-expanded", "true");
            secoes[0].botao.classList.add("ativo");
        }
        carregarExpansaoConteudo();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciarNavegacao, { once: true });
    else iniciarNavegacao();
})();
