"use strict";

// Vibração para dispositivos que oferecem suporte à Vibration API.
const VIBRACAO_NORMAL = 35;
const VIBRACAO_LEVE = 12;

function vibrar(duracaoOuPadrao) {
    if (typeof navigator.vibrate !== "function") return;
    try {
        navigator.vibrate(duracaoOuPadrao);
    } catch (erro) {
        console.warn("Não foi possível vibrar o dispositivo:", erro);
    }
}

function vibrarClique() {
    vibrar(VIBRACAO_NORMAL);
}

function vibrarProducaoAutomatica() {
    vibrar(VIBRACAO_LEVE);
}

document.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const alvo = event.target instanceof Element ? event.target : null;
    if (alvo?.closest("button")) vibrarClique();
}, true);
document.addEventListener("click", event => {
    if (event.detail !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest("button")) vibrarClique();
});

function atualizarTela() {
    custoFuncionario = calcularCustoNegocio("funcionario");
    custoChapa = calcularCustoNegocio("chapa");
    custoFoodTruck = calcularCustoNegocio("foodTruck");
    custoLanchonete = calcularCustoNegocio("lanchonete");
    custoFranquia = calcularCustoNegocio("franquia");

    definirTexto(contador, formatarNumero(hamburgueres) + " Hambúrgueres 🍔");
    definirTexto(pps, "Produção: " + formatarNumero(Math.round(calcularPPS())) + " por segundo 🕓");
    definirTexto(funcionarioCusto, formatarNumero(custoFuncionario));
    definirTexto(chapaCusto, formatarNumero(custoChapa));
    definirTexto(foodTruckCusto, formatarNumero(custoFoodTruck));
    definirTexto(lanchoneteCusto, formatarNumero(custoLanchonete));
    definirTexto(franquiaCusto, formatarNumero(custoFranquia));
    definirTexto(funcionariosQtd, formatarNumero(funcionarios));
    definirTexto(chapasQtd, formatarNumero(chapas));
    definirTexto(foodTruckQtd, formatarNumero(foodTrucks));
    definirTexto(lanchoneteQtd, formatarNumero(lanchonetes));
    definirTexto(franquiaQtd, formatarNumero(franquias));
    definirTexto(nivelTexto, "Level " + nivel + " ✨");
    definirTexto(xpTexto, "XP: " + formatarNumero(xp) + " / " + formatarNumero(xpProximoNivel) + " 🧪");
    definirTexto(estatTotal, formatarNumero(hamburgueresTotais));
    definirTexto(estatCliques, formatarNumero(cliquesTotais));
    definirTexto(estatTempo, Math.floor(tempoJogado / 60) + " min");
    definirTexto(estatRebirth, rebirths);
    definirTexto(prestigeTokensTexto, formatarNumero(prestigeTokens));
    definirTexto(prestigeTokensEarnedTexto, formatarNumero(prestigeTokensEarned));
    definirTexto(prestigeBonusTexto, bonusPrestige().toFixed(2) + "x");
    atualizarLojaPrestigio();
    definirTexto(requisitoRebirthTexto, formatarNumero(requisitoRebirth));

    atualizarBotoesLoja();
    atualizarBotoesUpgrade();
    atualizarBotaoRebirth();
    atualizarEstadoBotoesPet();
    verificarConquistas();
    atualizarPainelInteligente();
}

// Camada de orientação visual: lê valores reais sem alterar a economia.
function atualizarPainelInteligente() {
    const clickEl = document.getElementById("bcStatClick");
    if (!clickEl) return;
    const ppsAtual = Math.max(0, Number(calcularPPS()) || 0);
    const cliqueAtual = Math.max(0, Number(calcularPoderClique()) || 0);
    const total = Math.max(0, Number(hamburgueresTotais) || 0);
    clickEl.textContent = formatarNumero(cliqueAtual) + " 🍔";
    document.getElementById("bcStatPps").textContent = formatarNumero(Math.round(ppsAtual)) + "/s";
    document.getElementById("bcStatLifetime").textContent = formatarNumero(total);

    const tier = total < 1000 ? "Barraca de hambúrgueres" : total < 100000 ? "Lanchonete local" : total < 10000000 ? "Restaurante popular" : total < 1000000000 ? "Rede de franquias" : "Império global";
    document.getElementById("bcRestaurantTier").textContent = tier;

    const requisito = Math.max(1, Number(requisitoRebirth) || 1);
    const progresso = Math.max(0, Math.min(100, (Math.max(0, Number(hamburgueres) || 0) / requisito) * 100));
    document.getElementById("bcRebirthProgressLabel").textContent = progresso.toFixed(1).replace(".", ",") + "%";
    document.getElementById("bcRebirthProgressBar").style.width = progresso + "%";
    document.getElementById("bcRebirthProgressTrack").setAttribute("aria-valuenow", String(Math.round(progresso)));

    const candidatos = [];
    for (const [tipo, nome] of [["funcionario","Funcionário"],["chapa","Chapa Industrial"],["foodTruck","Food Truck"],["lanchonete","Lanchonete"],["franquia","Franquia"]]) {
        const custo = Number(calcularCustoNegocio(tipo));
        if (Number.isFinite(custo) && custo > 0) candidatos.push({ nome, custo, categoria: "Loja" });
    }
    const estados = { clique2x: upgradeClique2x, clique5x: upgradeClique5x, funcionario: upgradeFuncionario, chapa: upgradeChapa, global: upgradeGlobal };
    for (const [chave, dados] of Object.entries(UPGRADES)) {
        if (estados[chave]) continue;
        const custo = Number(custoUpgradeNormal(dados.custo));
        if (Number.isFinite(custo) && custo > 0) candidatos.push({ nome: dados.nome.replace(/^\S+\s*/, ""), custo, categoria: "Upgrade" });
    }
    candidatos.sort((a, b) => {
        const aPode = a.custo <= hamburgueres, bPode = b.custo <= hamburgueres;
        if (aPode !== bPode) return aPode ? -1 : 1;
        return a.custo - b.custo;
    });
    const recomendado = candidatos[0];
    const titulo = document.getElementById("bcRecommendationTitle");
    const texto = document.getElementById("bcRecommendationText");
    if (!recomendado) {
        titulo.textContent = "Tudo comprado!";
        texto.textContent = "Continue produzindo e explore a progressão de prestígio.";
    } else {
        titulo.textContent = (recomendado.custo <= hamburgueres ? "Compra disponível: " : "Próxima meta: ") + recomendado.nome;
        texto.textContent = recomendado.categoria + " • " + (recomendado.custo <= hamburgueres ? "custa " : "faltam ") + formatarNumero(recomendado.custo <= hamburgueres ? recomendado.custo : recomendado.custo - hamburgueres) + " 🍔";
    }
}
function atualizarBotoesLoja() {
    funcionarioBtn.disabled = hamburgueres < custoFuncionario;
    chapaBtn.disabled = hamburgueres < custoChapa;
    foodTruckBtn.disabled = hamburgueres < custoFoodTruck;
    lanchoneteBtn.disabled = hamburgueres < custoLanchonete;
    franquiaBtn.disabled = hamburgueres < custoFranquia;
}
function configurarBotaoUpgrade(botao, chave, comprado) {
    const upgrade = UPGRADES[chave];
    const custo = custoUpgradeNormal(upgrade.custo);
    definirHTML(botao, upgrade.nome + "<br>" + upgrade.descricao + "<br>" +
        (comprado ? "✅ Comprado" : "Custo: " + formatarNumero(custo) + " 🍔"));
    botao.disabled = comprado || hamburgueres < custo;
}
function atualizarBotoesUpgrade() {
    configurarBotaoUpgrade(upgradeClique2xBtn, "clique2x", upgradeClique2x);
    configurarBotaoUpgrade(upgradeClique5xBtn, "clique5x", upgradeClique5x);
    configurarBotaoUpgrade(upgradeFuncionarioBtn, "funcionario", upgradeFuncionario);
    configurarBotaoUpgrade(upgradeChapaBtn, "chapa", upgradeChapa);
    configurarBotaoUpgrade(upgradeGlobalBtn, "global", upgradeGlobal);
}
function atualizarBotaoRebirth() {
    rebirthBtn.disabled = hamburgueres < requisitoRebirth;
    definirTexto(rebirthBtn, hamburgueres >= requisitoRebirth
        ? "⭐ Fazer Rebirth (+" + calcularGanhoPrestige() + " tokens)"
        : "⭐ Rebirth: " + formatarNumero(requisitoRebirth) + " 🍔");
}
function comprarNegocio(tipo) {
    const custo = calcularCustoNegocio(tipo);
    if (hamburgueres < custo) return;
    hamburgueres -= custo;
    switch (tipo) {
        case "funcionario": funcionarios++; break;
        case "chapa": chapas++; break;
        case "foodTruck": foodTrucks++; break;
        case "lanchonete": lanchonetes++; break;
        case "franquia": franquias++; break;
    }
    ganharXP(2);
    atualizarTela();
}
funcionarioBtn.onclick = () => comprarNegocio("funcionario");
chapaBtn.onclick = () => comprarNegocio("chapa");
foodTruckBtn.onclick = () => comprarNegocio("foodTruck");
lanchoneteBtn.onclick = () => comprarNegocio("lanchonete");
franquiaBtn.onclick = () => comprarNegocio("franquia");

burgerBtn.addEventListener("click", () => {
    const ganho = calcularPoderClique();
    hamburgueres += ganho;
    hamburgueresTotais += ganho;
    runHamburgueres += ganho;
    cliquesTotais++;
    ganharXP(1);
    showRandomFloatText("+" + formatarNumero(ganho) + " 🍔");
    atualizarTela();
});

function comprarUpgrade(chave) {
    const upgrade = UPGRADES[chave];
    const estados = {
        clique2x: upgradeClique2x, clique5x: upgradeClique5x,
        funcionario: upgradeFuncionario, chapa: upgradeChapa, global: upgradeGlobal
    };
    const custo = custoUpgradeNormal(upgrade.custo);
    if (estados[chave] || hamburgueres < custo) return;
    hamburgueres -= custo;
    switch (chave) {
        case "clique2x": multiplicadorClique *= 2; upgradeClique2x = true; break;
        case "clique5x": multiplicadorClique *= 5; upgradeClique5x = true; break;
        case "funcionario": upgradeFuncionario = true; break;
        case "chapa": upgradeChapa = true; break;
        case "global": bonusGlobal *= 1.5; upgradeGlobal = true; break;
    }
    ganharXP(10);
    showRandomFloatText("⬆️ Upgrade comprado!");
    atualizarTela();
}
upgradeClique2xBtn.onclick = () => comprarUpgrade("clique2x");
upgradeClique5xBtn.onclick = () => comprarUpgrade("clique5x");
upgradeFuncionarioBtn.onclick = () => comprarUpgrade("funcionario");
upgradeChapaBtn.onclick = () => comprarUpgrade("chapa");
upgradeGlobalBtn.onclick = () => comprarUpgrade("global");

rebirthBtn.onclick = () => {
    if (hamburgueres < requisitoRebirth) return;
    const ganho = calcularGanhoPrestige();
    const disponiveis = PET_CATALOG.filter(p => !petColecao.some(owned => owned.id === p.id));
    const petPossivel = disponiveis.length > 0;
    const confirmar = confirm(
        "Tem certeza de que deseja fazer Rebirth?\n\nVocê receberá " + ganho +
        " token(s) de prestígio." +
        (nivelUpgradePrestigio("inicio") > 0 ? "\nVocê começará com " + formatarNumero(nivelUpgradePrestigio("inicio") * 100) + " hambúrgueres graças à melhoria Estoque inicial." : "") +
        (petPossivel ? "\nVocê também poderá encontrar um pet novo aleatório!" : "\nVocê já encontrou todos os pets disponíveis.") +
        "\nSeu dinheiro, negócios, nível e upgrades serão reiniciados."
    );
    if (!confirmar) return;

    prestigeTokens += ganho;
    prestigeTokensEarned += ganho;
    rebirths++;
    // O Rebirth mantém o reset original; apenas a loja e os bônus de prestígio sobrevivem.
    hamburgueres = nivelUpgradePrestigio("inicio") * 100;
    runHamburgueres = 0;
    funcionarios = chapas = foodTrucks = lanchonetes = franquias = 0;
    nivel = 1;
    xp = 0;
    xpProximoNivel = 100;
    multiplicadorClique = 1;
    upgradeClique2x = upgradeClique5x = upgradeFuncionario = upgradeChapa = upgradeGlobal = false;
    bonusGlobal = 1;
    requisitoRebirth = calcularRequisitoRebirth();

    const petNovo = descobrirPetAleatorio();
    atualizarTela();
    salvarJogo();

    let mensagem = "⭐ Rebirth realizado!\n\n+" + ganho + " token(s) de prestígio!\nBônus permanente: " + bonusPrestige().toFixed(2) + "x";
    if (petNovo) mensagem += "\n\n🎉 Novo pet encontrado: " + petNovo.emoji + " " + petNovo.nome + "!\nEle já está equipado.";
    else mensagem += "\n\n🐾 Você já coletou todos os pets!";
    alert(mensagem);
};

let producaoFracionaria = 0;
let producaoAutomaticaNoUltimoSegundo = 0;

setInterval(() => {
    const ganho = calcularPPS() / 10;
    if (ganho <= 0) return;
    producaoFracionaria += ganho;
    const hamburgueresGanhos = Math.floor(producaoFracionaria + 1e-9);
    if (hamburgueresGanhos <= 0) return;
    producaoFracionaria -= hamburgueresGanhos;
    hamburgueres += hamburgueresGanhos;
    hamburgueresTotais += hamburgueresGanhos;
    runHamburgueres += hamburgueresGanhos;
    producaoAutomaticaNoUltimoSegundo += hamburgueresGanhos;
    atualizarTela();
}, 100);

setInterval(() => {
    if (calcularPPS() > 0 && producaoAutomaticaNoUltimoSegundo > 0) {
        vibrarProducaoAutomatica();
    }
    producaoAutomaticaNoUltimoSegundo = 0;
}, 1000);

setInterval(() => { tempoJogado++; }, 1000);

function salvarJogo() {
    // O reset e a restauração limpam/substituem o armazenamento e recarregam a página.
    // Não grave o estado antigo durante o evento beforeunload, ou o progresso reaparece.
    if (window.__burgerClickerResetEmAndamento || window.__burgerClickerRestoreEmAndamento) return;

    // Os saldos e estatísticas de hambúrgueres são sempre inteiros.
    hamburgueres = Math.max(0, Math.round(hamburgueres));
    hamburgueresTotais = Math.max(0, Math.round(hamburgueresTotais));
    runHamburgueres = Math.max(0, Math.round(runHamburgueres));
    const dados = {
        hamburgueres, hamburgueresTotais, runHamburgueres,
        funcionarios, chapas, foodTrucks, lanchonetes, franquias,
        multiplicadorClique, bonusGlobal,
        upgradeClique2x, upgradeClique5x, upgradeFuncionario, upgradeChapa, upgradeGlobal,
        xp, nivel, xpProximoNivel, cliquesTotais, tempoJogado, rebirths, prestigeTokens,
        prestigeTokensEarned, prestigeUpgrades, requisitoRebirth, conquistas, ultimoSave: Date.now()
    };
    for (const [chave, valor] of Object.entries(dados)) {
        localStorage.setItem(chave, typeof valor === "object" ? JSON.stringify(valor) : String(valor));
    }
    ultimoSave = dados.ultimoSave;
    salvarEstadoPets();
}
setInterval(salvarJogo, 5000);
window.addEventListener("beforeunload", salvarJogo);

if (!localStorage.getItem("requisitoRebirth")) requisitoRebirth = calcularRequisitoRebirth();
criarLojaPrestigio();
iniciarOffline();
renderizarConquistas();
renderizarPets();
atualizarTela();
