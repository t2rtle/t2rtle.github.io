"use strict";

(() => {
    const CONFIG = {
        som: "bc_config_som",
        musica: "bc_config_musica",
        animacoes: "bc_config_animacoes",
        temaEscuro: "bc_config_tema_escuro",
        vibracao: "bc_config_vibracao",
        volumeMusica: "bc_config_volume_musica",
        volumeEfeitos: "bc_config_volume_efeitos",
        ultimoBackup: "bc_ultimo_backup"
    };

    const BACKUP_PREFIX = "bc_backup_";
    const BACKUP_QUANTIDADE = 5;
    const BACKUP_INTERVALO = 5 * 60 * 1000;

    const $ = id => document.getElementById(id);

    const elementos = {
        modal: $("configModal"),
        abrir: $("configBtn"),
        fechar: $("configFecharBtn"),
        som: $("configSom"),
        musica: $("configMusica"),
        animacoes: $("configAnimacoes"),
        temaEscuro: $("configTemaEscuro"),
        vibracao: $("configVibracao"),
        volumeMusica: $("configVolumeMusica"),
        volumeEfeitos: $("configVolumeEfeitos"),
        volumeMusicaValor: $("configVolumeMusicaValor"),
        volumeEfeitosValor: $("configVolumeEfeitosValor"),
        backupAgora: $("configBackupAgora"),
        restaurar: $("configRestaurarBackupBtn"),
        arquivoBackup: $("configBackupArquivo"),
        restaurarUltimo: $("configRestaurarUltimoBtn"),
        resetar: $("configResetarBtn"),
        instalar: $("configInstalarBtn"),
        statusInstalacao: $("configInstalacaoStatus"),
        statusBackup: $("configBackupStatus"),
        status: $("configStatus")
    };

    function lerBooleano(chave, padrao = true) {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : valor === "true";
    }

    function lerNumero(chave, padrao) {
        const salvo = localStorage.getItem(chave);
        if (salvo === null || salvo.trim() === "") return padrao;
        const valor = Number(salvo);
        return Number.isFinite(valor) ? valor : padrao;
    }

    function salvarConfig(chave, valor) {
        localStorage.setItem(chave, String(valor));
    }

    function definirStatus(texto, erro = false) {
        if (!elementos.status) return;
        elementos.status.textContent = texto;
        elementos.status.dataset.erro = erro ? "true" : "false";
    }

    function aplicarSom() {
        const habilitado = lerBooleano(CONFIG.som, true);
        const volume = Math.max(0, Math.min(1, lerNumero(CONFIG.volumeEfeitos, 1.0)));
        const audio = $("somClique");
        if (audio) {
            audio.muted = !habilitado;
            audio.volume = volume;
        }
    }

    function aplicarMusica() {
        const habilitada = lerBooleano(CONFIG.musica, true);
        const volume = Math.max(0, Math.min(1, lerNumero(CONFIG.volumeMusica, 0.5)));
        const audio = $("musicaFundo");
        if (audio) {
            audio.muted = !habilitada;
            audio.volume = volume;
            if (!habilitada) audio.pause();
        }
    }

    function aplicarAnimacoes() {
        document.documentElement.classList.toggle("sem-animacoes", !lerBooleano(CONFIG.animacoes, true));
    }

    function aplicarTema() {
        document.documentElement.classList.toggle("tema-escuro", lerBooleano(CONFIG.temaEscuro, false));
    }

    function aplicarConfiguracoes() {
        aplicarSom();
        aplicarMusica();
        aplicarAnimacoes();
        aplicarTema();
        atualizarControles();
    }

    function atualizarControles() {
        if (elementos.som) elementos.som.checked = lerBooleano(CONFIG.som, true);
        if (elementos.musica) elementos.musica.checked = lerBooleano(CONFIG.musica, true);
        if (elementos.animacoes) elementos.animacoes.checked = lerBooleano(CONFIG.animacoes, true);
        if (elementos.temaEscuro) elementos.temaEscuro.checked = lerBooleano(CONFIG.temaEscuro, false);
        if (elementos.vibracao) elementos.vibracao.checked = lerBooleano(CONFIG.vibracao, true);

        const volumeMusica = Math.round(lerNumero(CONFIG.volumeMusica, 0.5) * 100);
        const volumeEfeitos = Math.round(lerNumero(CONFIG.volumeEfeitos, 1.0) * 100);
        if (elementos.volumeMusica) elementos.volumeMusica.value = volumeMusica;
        if (elementos.volumeEfeitos) elementos.volumeEfeitos.value = volumeEfeitos;
        if (elementos.volumeMusicaValor) elementos.volumeMusicaValor.textContent = volumeMusica + "%";
        if (elementos.volumeEfeitosValor) elementos.volumeEfeitosValor.textContent = volumeEfeitos + "%";
    }

    function abrirModal() {
        if (!elementos.modal) return;
        elementos.modal.hidden = false;
        document.body.classList.add("config-modal-aberto");
        elementos.fechar?.focus();
    }

    function fecharModal() {
        if (!elementos.modal) return;
        elementos.modal.hidden = true;
        document.body.classList.remove("config-modal-aberto");
    }

    function configurarEventos() {
        elementos.abrir?.addEventListener("click", abrirModal);
        elementos.fechar?.addEventListener("click", fecharModal);
        elementos.modal?.addEventListener("click", event => {
            if (event.target === elementos.modal) fecharModal();
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && elementos.modal && !elementos.modal.hidden) fecharModal();
        });

        elementos.som?.addEventListener("change", () => {
            salvarConfig(CONFIG.som, elementos.som.checked);
            aplicarSom();
        });
        elementos.musica?.addEventListener("change", () => {
            salvarConfig(CONFIG.musica, elementos.musica.checked);
            aplicarMusica();
            if (elementos.musica.checked) window.BurgerClickerAudio?.iniciarMusica();
        });
        elementos.animacoes?.addEventListener("change", () => {
            salvarConfig(CONFIG.animacoes, elementos.animacoes.checked);
            aplicarAnimacoes();
        });
        elementos.temaEscuro?.addEventListener("change", () => {
            salvarConfig(CONFIG.temaEscuro, elementos.temaEscuro.checked);
            aplicarTema();
        });
        elementos.vibracao?.addEventListener("change", () => {
            salvarConfig(CONFIG.vibracao, elementos.vibracao.checked);
            if (elementos.vibracao.checked && typeof navigator.vibrate === "function") navigator.vibrate(25);
        });

        elementos.volumeMusica?.addEventListener("input", () => {
            const valor = Number(elementos.volumeMusica.value) / 100;
            salvarConfig(CONFIG.volumeMusica, valor);
            if (elementos.volumeMusicaValor) elementos.volumeMusicaValor.textContent = elementos.volumeMusica.value + "%";
            aplicarMusica();
        });
        elementos.volumeEfeitos?.addEventListener("input", () => {
            const valor = Number(elementos.volumeEfeitos.value) / 100;
            salvarConfig(CONFIG.volumeEfeitos, valor);
            if (elementos.volumeEfeitosValor) elementos.volumeEfeitosValor.textContent = elementos.volumeEfeitos.value + "%";
            aplicarSom();
        });
    }

    function dadosParaBackup() {
        const dados = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (!chave || !CHAVES_PROTEGIDAS.has(chave)) continue;
            dados[chave] = localStorage.getItem(chave);
        }
        return dados;
    }

    function criarPacoteBackup() {
        return {
            app: "Burger Clicker",
            formato: 1,
            criadoEm: new Date().toISOString(),
            dados: dadosParaBackup()
        };
    }

    function salvarBackupAutomatico() {
        const pacote = criarPacoteBackup();
        const antigo = [];
        for (let i = 0; i < BACKUP_QUANTIDADE; i++) {
            const valor = localStorage.getItem(BACKUP_PREFIX + i);
            if (valor) antigo.push(valor);
        }
        localStorage.setItem(BACKUP_PREFIX + "0", JSON.stringify(pacote));
        antigo.slice(0, BACKUP_QUANTIDADE - 1).forEach((valor, indice) => {
            localStorage.setItem(BACKUP_PREFIX + (indice + 1), valor);
        });
        localStorage.setItem(CONFIG.ultimoBackup, pacote.criadoEm);
        atualizarStatusBackup();
    }

    function baixarArquivo(nome, conteudo) {
        const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function criarBackupManual() {
        try {
            salvarBackupAutomatico();
            const pacote = criarPacoteBackup();
            const data = new Date();
            const nome = `burger-clicker-backup-${data.toISOString().replace(/[:.]/g, "-")}.json`;
            baixarArquivo(nome, JSON.stringify(pacote, null, 2));
            definirStatus("💾 Backup criado e baixado com sucesso!");
        } catch (erro) {
            definirStatus("❌ Não foi possível criar o backup. Verifique o espaço de armazenamento e tente novamente.", true);
            console.error("[Burger Clicker] Falha ao criar backup manual:", erro);
        }
    }

    // Só restaura chaves que pertencem ao estado conhecido do jogo.
    // Isso impede que um arquivo importado injete chaves arbitrárias no armazenamento.
    const CHAVES_PROTEGIDAS = new Set([
        "hamburgueres", "hamburgueresTotais", "runHamburgueres",
        "funcionarios", "chapas", "foodTrucks", "lanchonetes", "franquias",
        "multiplicadorClique", "bonusGlobal",
        "upgradeClique2x", "upgradeClique5x", "upgradeFuncionario", "upgradeChapa", "upgradeGlobal",
        "xp", "nivel", "xpProximoNivel", "cliquesTotais", "tempoJogado", "rebirths",
        "prestigeTokens", "prestigeTokensEarned", "prestigeUpgrades", "requisitoRebirth",
        "conquistas", "ultimoSave", "petColecao", "petAtivoId", "petNomes", "petNiveis",
        "bc_expansion_state_v1", "bc_statistics_v2", "burgerClickerLanguage"
    ]);

    function validarPacoteBackup(pacote) {
        if (!pacote || pacote.app !== "Burger Clicker" || pacote.formato !== 1 ||
            !pacote.dados || typeof pacote.dados !== "object" || Array.isArray(pacote.dados)) {
            return false;
        }

        // Backups antigos podem conter chaves auxiliares de outras versões.
        // Elas serão ignoradas durante a restauração; nunca serão gravadas no storage.
        const entradas = Object.entries(pacote.dados);
        if (entradas.length > 500) return false;

        return entradas.every(([, valor]) =>
            (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") &&
            String(valor).length <= 200000
        ) && entradas.some(([chave]) => CHAVES_PROTEGIDAS.has(chave));
    }

    function restaurarPacote(pacote) {
        if (!validarPacoteBackup(pacote)) throw new Error("Backup inválido ou de outro aplicativo.");

        const estadoAnterior = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave) estadoAnterior[chave] = localStorage.getItem(chave);
        }

        try {
            const configuracoes = {};
            for (const [chave, valor] of Object.entries(estadoAnterior)) {
                if (chave.startsWith("bc_config_") || chave.startsWith(BACKUP_PREFIX) || chave === CONFIG.ultimoBackup) {
                    configuracoes[chave] = valor;
                }
            }

            localStorage.clear();
            Object.entries(configuracoes).forEach(([chave, valor]) => localStorage.setItem(chave, valor));
            Object.entries(pacote.dados).forEach(([chave, valor]) => {
                // Importação segura: só restaura chaves reconhecidas pelo jogo.
                if (CHAVES_PROTEGIDAS.has(chave)) {
                    localStorage.setItem(chave, String(valor));
                }
            });
        } catch (erro) {
            // Tenta devolver o armazenamento ao estado anterior se a restauração falhar.
            try {
                localStorage.clear();
                Object.entries(estadoAnterior).forEach(([chave, valor]) => localStorage.setItem(chave, valor));
            } catch (erroRollback) {
                console.error("[Burger Clicker] Também falhou a recuperação do armazenamento:", erroRollback);
            }
            throw new Error("A restauração falhou e o jogo tentou preservar o progresso anterior. Verifique o armazenamento disponível.");
        }

        // O backup anterior já foi preservado pelo fluxo de restauração.
        // Não o sobrescreva aqui com uma cópia do estado recém-restaurado.
        location.reload();
    }

    function restaurarArquivo(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            definirStatus("❌ O arquivo de backup excede o limite de 2 MB.", true);
            elementos.arquivoBackup.value = "";
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => {
            try {
                const pacote = JSON.parse(String(leitor.result));
                if (!confirm("Restaurar este backup vai substituir o progresso atual. Um backup automático do estado atual será mantido antes da restauração. Continuar?")) return;
                salvarBackupAutomatico();
                restaurarPacote(pacote);
            } catch (erro) {
                definirStatus("❌ Não foi possível restaurar o backup: " + erro.message, true);
            }
        };
        leitor.onerror = () => definirStatus("❌ Não foi possível ler o arquivo de backup.", true);
        leitor.readAsText(file);
        elementos.arquivoBackup.value = "";
    }

    function restaurarUltimoBackup() {
        const valor = localStorage.getItem(BACKUP_PREFIX + "0");
        if (!valor) {
            definirStatus("ℹ️ Ainda não existe um backup automático.", true);
            return;
        }
        try {
            const pacote = JSON.parse(valor);
            if (!confirm("Restaurar o backup automático mais recente? O estado atual será salvo antes da restauração.")) return;
            const atual = criarPacoteBackup();
            localStorage.setItem(BACKUP_PREFIX + "0", JSON.stringify(atual));
            restaurarPacote(pacote);
        } catch (erro) {
            definirStatus("❌ Backup automático inválido: " + erro.message, true);
        }
    }

    function atualizarStatusBackup() {
        if (!elementos.statusBackup) return;
        const ultimo = localStorage.getItem(CONFIG.ultimoBackup);
        if (!ultimo) {
            elementos.statusBackup.textContent = "Backup automático: aguardando o primeiro backup.";
            return;
        }
        const data = new Date(ultimo);
        elementos.statusBackup.textContent = Number.isNaN(data.getTime())
            ? "Backup automático: disponível"
            : "Último backup automático: " + data.toLocaleString("pt-BR");
    }

    function iniciarBackupAutomatico() {
        const backupSeguro = () => {
            if (window.__burgerClickerResetEmAndamento) return;
            try {
                salvarBackupAutomatico();
            } catch (erro) {
                // Armazenamento cheio ou bloqueado não deve gerar exceções sem tratamento.
                console.warn("[Burger Clicker] Backup automático indisponível:", erro);
                if (elementos.statusBackup) {
                    elementos.statusBackup.textContent = "⚠️ Não foi possível salvar o backup automático. Baixe um backup manual.";
                }
            }
        };
        setTimeout(backupSeguro, 5000);
        setInterval(backupSeguro, BACKUP_INTERVALO);
        window.addEventListener("beforeunload", () => {
            // Um reset não deve criar um backup vazio depois de preservar o último backup útil.
            if (window.__burgerClickerResetEmAndamento) return;
            try { salvarBackupAutomatico(); } catch (erro) {
                console.warn("[Burger Clicker] Não foi possível criar o backup ao sair:", erro);
            }
        });
    }

    let installPrompt = null;

    function aplicativoInstalado() {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }

    function atualizarStatusInstalacao() {
        if (!elementos.instalar || !elementos.statusInstalacao) return;

        if (aplicativoInstalado()) {
            elementos.instalar.disabled = true;
            elementos.instalar.textContent = "✅ Aplicativo já instalado";
            elementos.statusInstalacao.textContent = "O Burger Clicker está instalado como aplicativo.";
        } else if (installPrompt) {
            elementos.instalar.disabled = false;
            elementos.instalar.hidden = false;
            elementos.instalar.textContent = "📱 Instalar aplicativo";
            elementos.statusInstalacao.textContent = "Este navegador permite instalação pelo botão acima.";
        } else {
            elementos.instalar.disabled = false;
            elementos.instalar.hidden = false;
            elementos.instalar.textContent = "📱 Instalar aplicativo";
            elementos.statusInstalacao.textContent = "Se o botão não abrir a instalação, use a opção de instalar/adicionar à tela inicial do navegador.";
        }
    }

    async function instalarAplicativo() {
        if (aplicativoInstalado()) return;

        if (installPrompt) {
            const evento = installPrompt;
            installPrompt = null;
            try {
                await evento.prompt();
                const escolha = await evento.userChoice;
                elementos.statusInstalacao.textContent = escolha.outcome === "accepted"
                    ? "✅ Instalação aceita."
                    : "Instalação cancelada. Você pode tentar novamente pelo navegador.";
            } catch (erro) {
                elementos.statusInstalacao.textContent = "Não foi possível abrir a instalação neste momento.";
                console.warn("Instalação PWA:", erro);
            }
            atualizarStatusInstalacao();
            return;
        }

        elementos.statusInstalacao.textContent = "O navegador não disponibilizou o botão automático. Use o menu do navegador e escolha a opção de instalar/adicionar à tela inicial, se disponível.";
    }

    function registrarPWA() {
        // O registro único, as atualizações e os diagnósticos do Service Worker
        // são centralizados em js/pwa.js para evitar registros concorrentes.
    }

    function configurarInstalacao() {
        window.addEventListener("beforeinstallprompt", event => {
            event.preventDefault();
            installPrompt = event;
            atualizarStatusInstalacao();
        });

        window.addEventListener("appinstalled", () => {
            installPrompt = null;
            atualizarStatusInstalacao();
            definirStatus("📱 Burger Clicker instalado com sucesso!");
        });

        elementos.instalar?.addEventListener("click", instalarAplicativo);
        atualizarStatusInstalacao();
        registrarPWA();
    }

    function resetarProgresso() {
        const primeira = confirm("⚠️ Resetar o progresso vai apagar hambúrgueres, negócios, pets, conquistas, Rebirths e melhorias de prestígio. Um backup automático será criado antes. Continuar?");
        if (!primeira) return;

        try {
            salvarBackupAutomatico();
        } catch (erro) {
            console.error("[Burger Clicker] Não foi possível criar o backup antes do reset:", erro);
            if (!confirm("⚠️ Não foi possível criar um backup automático (possivelmente por falta de espaço). Deseja continuar mesmo assim, sem garantia de recuperação?")) return;
        }
        const segunda = confirm("Tem certeza? O jogo será reiniciado agora. O backup automático continuará disponível para restauração.");
        if (!segunda) return;

        const manter = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave?.startsWith("bc_config_") || chave?.startsWith(BACKUP_PREFIX) || chave === CONFIG.ultimoBackup) {
                manter[chave] = localStorage.getItem(chave);
            }
        }

        // Bloqueia os salvamentos dos listeners beforeunload antes de recarregar.
        // Sem isso, salvarJogo() podia gravar o progresso antigo logo após o clear().
        window.__burgerClickerResetEmAndamento = true;
        try {
            localStorage.clear();
            Object.entries(manter).forEach(([chave, valor]) => localStorage.setItem(chave, valor));
            location.reload();
        } catch (erro) {
            window.__burgerClickerResetEmAndamento = false;
            definirStatus("❌ Não foi possível resetar o progresso. O armazenamento pode estar indisponível.", true);
            console.error("[Burger Clicker] Falha ao resetar o progresso:", erro);
        }
    }

    function iniciar() {
        aplicarConfiguracoes();
        configurarEventos();
        elementos.backupAgora?.addEventListener("click", criarBackupManual);
        elementos.restaurar?.addEventListener("click", () => elementos.arquivoBackup?.click());
        elementos.arquivoBackup?.addEventListener("change", event => restaurarArquivo(event.target.files?.[0]));
        elementos.restaurarUltimo?.addEventListener("click", restaurarUltimoBackup);
        elementos.resetar?.addEventListener("click", resetarProgresso);
        atualizarStatusBackup();
        iniciarBackupAutomatico();
        configurarInstalacao();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
