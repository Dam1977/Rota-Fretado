// 1. Base inicial com os 4 pontos de Caieiras
const pontosIniciais = [
    {
        id: 101,
        embarque: "Caieiras via Francisco Morato",
        linha: "L1 / T1",
        endereco: "Avenida Professor Carvalho Pinto, Caieiras - SP",
        referencia: "Estação de Caieiras"
    },
    {
        id: 102,
        embarque: "Caieiras via Francisco Morato",
        linha: "L1 / T1",
        endereco: "Rua Démerson Gomes Romano, 55, Caieiras - SP",
        referencia: "Ponto de ônibus antes da loja 100"
    },
    {
        id: 103,
        embarque: "Caieiras via Franco da Rocha",
        linha: "L1 / T2",
        endereco: "Avenida Professor Carvalho Pinto, Caieiras - SP",
        referencia: "Estação de Caieiras"
    },
    {
        id: 104,
        embarque: "Caieiras via Franco da Rocha",
        linha: "L1 / T2",
        endereco: "Avenida dos Expedicionários, 142, Caieiras - SP",
        referencia: "Ponto de ônibus antes das lojas Cem"
    }
];

let pontosFretado = JSON.parse(localStorage.getItem('pontosFretadoGoogleMaps')) || pontosIniciais;
let pontoSelecionadoId = pontosFretado.length > 0 ? pontosFretado[0].id : null;

const form = document.getElementById('form-endereco');
const listaPontos = document.getElementById('lista-pontos');
const contador = document.getElementById('contador');
const statusMsg = document.getElementById('status-msg');
const filtroTerminal = document.getElementById('filtro-terminal');
const modoTransporte = document.getElementById('modo-transporte');
const campoBusca = document.getElementById('campo-busca');
const btnLimparBusca = document.getElementById('btn-limpar-busca');
const googleMapFrame = document.getElementById('google-map-frame');
const mapaTitulo = document.getElementById('mapa-titulo');
const btnAbrirExterno = document.getElementById('btn-abrir-externo');

// Inicializa a interface ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    renderizarTudo();
    if (pontosFretado.length > 0) {
        exibirNoGoogleMaps(pontosFretado[0]);
    }
});

// Eventos dos filtros e da barra de pesquisa
if (filtroTerminal) {
    filtroTerminal.addEventListener('change', () => {
        renderizarTudo();
    });
}

if (modoTransporte) {
    modoTransporte.addEventListener('change', () => {
        renderizarTudo();
    });
}

if (campoBusca) {
    campoBusca.addEventListener('input', () => {
        if (btnLimparBusca) {
            btnLimparBusca.style.display = campoBusca.value.length > 0 ? 'block' : 'none';
        }
        renderizarTudo();
    });
}

if (btnLimparBusca) {
    btnLimparBusca.addEventListener('click', () => {
        campoBusca.value = '';
        btnLimparBusca.style.display = 'none';
        campoBusca.focus();
        renderizarTudo();
    });
}

// Botão azul do topo do mapa
if (btnAbrirExterno) {
    btnAbrirExterno.addEventListener('click', (e) => {
        e.preventDefault();
        const pontoAtual = pontosFretado.find(p => p.id === pontoSelecionadoId) || pontosFretado[0];
        if (pontoAtual) {
            abrirRotaNoGoogleMaps(pontoAtual.endereco);
        }
    });
}

// Função auxiliar para ignorar acentos e letras maiúsculas na pesquisa
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// 2. Monta a URL por partes separadas para nunca cortar o /maps/dir/
window.abrirRotaNoGoogleMaps = function(endereco) {
    const protocolo = 'https://';
    const dominio = 'www.google.com';
    const caminho = '/maps/dir/';
    const parametroApi = '?api=1';
    const parametroDestino = '&destination=' + encodeURIComponent(endereco);
    
    const modo = modoTransporte ? modoTransporte.value : 'walking';
    const parametroModo = modo ? '&travelmode=' + modo : '';
    
    const urlCompleta = protocolo + dominio + caminho + parametroApi + parametroDestino + parametroModo;
    window.open(urlCompleta, '_self', 'noopener,noreferrer');

};

// 3. Atualiza o quadro do Google Maps na tela com o endereço escolhido
function exibirNoGoogleMaps(ponto) {
    pontoSelecionadoId = ponto.id;
    const enderecoCodificado = encodeURIComponent(ponto.endereco);
    
    if (googleMapFrame) {
        const protocolo = 'https://';
        const dominio = 'maps.google.com';
        const caminho = '/maps';
        const query = '?q=' + enderecoCodificado + '&t=&z=16&ie=UTF8&iwloc=&output=embed';
        
        googleMapFrame.src = protocolo + dominio + caminho + query;
    }
    
    if (mapaTitulo) {
        mapaTitulo.textContent = '📍 ' + ponto.linha + ' | ' + ponto.embarque + ' (' + ponto.referencia + ')';
    }
    
    renderizarTudo();
}

// 4. Cadastro de novos endereços pelo formulário
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const embarque = document.getElementById('embarque').value.trim();
        const linha = document.getElementById('linha').value.trim();
        const endereco = document.getElementById('endereco').value.trim();
        const referencia = document.getElementById('referencia').value.trim();

        const novoPonto = {
            id: Date.now(),
            embarque,
            linha,
            endereco,
            referencia
        };

        pontosFretado.push(novoPonto);
        salvarDados();
        
        exibirNoGoogleMaps(novoPonto);

        form.reset();
        if (statusMsg) {
            statusMsg.style.color = '#16a34a';
            statusMsg.textContent = 'Endereço adicionado e exibido no Google Maps!';
            setTimeout(() => { statusMsg.textContent = ''; }, 3000);
        }
    });
}

// 5. Renderiza a lista na barra lateral aplicando filtro de terminal e busca por texto
function renderizarTudo() {
    if (!listaPontos) return;
    listaPontos.innerHTML = '';

    const termoTerminal = filtroTerminal ? filtroTerminal.value : 'TODOS';
    const termoBusca = campoBusca ? normalizarTexto(campoBusca.value.trim()) : '';

    const pontosFiltrados = pontosFretado.filter(ponto => {
        const bateTerminal = termoTerminal === 'TODOS' || ponto.linha.toUpperCase().includes(termoTerminal);
        
        if (!bateTerminal) return false;
        if (!termoBusca) return true;

        const textoCompleto = normalizarTexto(
            ponto.embarque + ' ' + ponto.linha + ' ' + ponto.endereco + ' ' + ponto.referencia
        );

        return textoCompleto.includes(termoBusca);
    });

    if (contador) {
        contador.textContent = pontosFiltrados.length;
    }

    if (pontosFiltrados.length === 0) {
        listaPontos.innerHTML = '<li class="sem-resultados">Nenhum ponto de embarque encontrado para "' + campoBusca.value + '".</li>';
        return;
    }

    pontosFiltrados.forEach(ponto => {
        const classeAtiva = ponto.id === pontoSelecionadoId ? 'ativo' : '';
        const enderecoSeguro = ponto.endereco.replace(/'/g, "\\'");

        const li = document.createElement('li');
        li.className = 'ponto-item ' + classeAtiva;
        li.innerHTML = `
            <div class="ponto-topo">
                <span class="badge-linha">${ponto.linha}</span>
                <button class="btn-remover" onclick="removerPonto(${ponto.id})" title="Remover ponto">X</button>
            </div>
            <div class="ponto-info" onclick="selecionarPonto(${ponto.id})">
                <strong>${ponto.embarque}</strong>
                <span>${ponto.endereco}</span>
                <span class="ponto-ref">Ref: ${ponto.referencia}</span>
            </div>
            <div class="ponto-acoes">
                <button type="button" class="btn-ver-mapa" onclick="selecionarPonto(${ponto.id})">👁️ Ver no Mapa</button>
                <button type="button" class="btn-maps" onclick="abrirRotaNoGoogleMaps('${enderecoSeguro}')">🧭 Traçar Rota</button>
            </div>
        `;
        listaPontos.appendChild(li);
    });
}

// 6. Funções auxiliares
window.selecionarPonto = function(id) {
    const ponto = pontosFretado.find(p => p.id === id);
    if (ponto) {
        exibirNoGoogleMaps(ponto);
    }
};

window.removerPonto = function(id) {
    pontosFretado = pontosFretado.filter(p => p.id !== id);
    salvarDados();
    renderizarTudo();
};

function salvarDados() {
    localStorage.setItem('pontosFretadoGoogleMaps', JSON.stringify(pontosFretado));
}
