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

        const titulo = document.createElement("p");
        titulo.className = "bc-areas-titulo";
        titulo.textContent = "📂 Menus do jogo";
        nav.appendChild(titulo);

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
            nav.appendChild(botao);
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
