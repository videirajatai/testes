// biblia.js - Módulo unificado para Bíblias em JSON único (NVI, ARA, ACF, etc.)
const BibliaManager = (function() {
    // Configuração das versões disponíveis
    const VERSOES = {
        nvi: { nome: 'Nova Versão Internacional', url: 'https://raw.githubusercontent.com/videirajatai/sistema/refs/heads/main/biblias/nvi.json' },
        aa:  { nome: 'Almeida Revista e Atualizada', url: 'https://raw.githubusercontent.com/videirajatai/sistema/refs/heads/main/biblias/aa.json' },
        acf: { nome: 'Almeida Corrigida Fiel', url: 'https://raw.githubusercontent.com/videirajatai/sistema/refs/heads/main/biblias/acf.json' }
    };

    let bibliaAtual = null;            // objeto JSON completo da versão carregada
    let versaoAtiva = localStorage.getItem('biblia_versao') || 'nvi';
    let listeners = [];                // callbacks para quando a Bíblia carregar

    // Carrega a versão especificada (ou a ativa)
    async function carregarVersao(versaoId = versaoAtiva) {
        const versao = VERSOES[versaoId];
        if (!versao) throw new Error(`Versão "${versaoId}" não configurada.`);
        
        // Verifica cache em sessionStorage (opcional)
        const cacheKey = `biblia_${versaoId}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                bibliaAtual = JSON.parse(cached);
                versaoAtiva = versaoId;
                localStorage.setItem('biblia_versao', versaoId);
                _notificar();
                return bibliaAtual;
            } catch(e) { /* ignora cache inválido */ }
        }

        try {
            const response = await fetch(versao.url);
            if (!response.ok) throw new Error(`Erro ao baixar ${versao.nome}`);
            bibliaAtual = await response.json();
            versaoAtiva = versaoId;
            localStorage.setItem('biblia_versao', versaoId);
            // Armazena no cache da sessão
            try { sessionStorage.setItem(cacheKey, JSON.stringify(bibliaAtual)); } catch(e) {}
            _notificar();
            return bibliaAtual;
        } catch (error) {
            console.error('Falha ao carregar Bíblia:', error);
            throw error;
        }
    }

    function _notificar() {
        listeners.forEach(cb => cb(bibliaAtual));
    }

    // Registra callback para quando a Bíblia estiver pronta
    function onReady(callback) {
        if (bibliaAtual) {
            callback(bibliaAtual);
        } else {
            listeners.push(callback);
        }
    }

    // Retorna a lista de livros da versão carregada
    function getLivros() {
        if (!bibliaAtual) return [];
        return bibliaAtual.map(livro => ({ id: livro.abbrev, nome: livro.name }));
    }

    // Retorna número de capítulos de um livro
    function getCapitulos(abbrev) {
        if (!bibliaAtual) return 0;
        const livro = bibliaAtual.find(l => l.abbrev === abbrev);
        return livro ? livro.chapters.length : 0;
    }

    // Retorna array de versículos de um capítulo (cada item: { number, content })
    function getVersiculos(abbrev, capitulo) {
        if (!bibliaAtual) return [];
        const livro = bibliaAtual.find(l => l.abbrev === abbrev);
        if (!livro) return [];
        const capituloIndex = parseInt(capitulo) - 1;
        if (capituloIndex < 0 || capituloIndex >= livro.chapters.length) return [];
        const versiculosArray = livro.chapters[capituloIndex];
        return versiculosArray.map((texto, idx) => ({ number: idx + 1, content: texto }));
    }

    // Busca um livro pelo nome (case insensitive) - útil para compatibilidade com a versão "A Mensagem"
    function findLivroByNome(nome) {
        if (!bibliaAtual) return null;
        const nomeLower = nome.toLowerCase();
        return bibliaAtual.find(l => l.name.toLowerCase() === nomeLower || l.abbrev.toLowerCase() === nomeLower);
    }

    return {
        VERSOES,
        carregarVersao,
        onReady,
        getLivros,
        getCapitulos,
        getVersiculos,
        findLivroByNome,
        get versaoAtiva() { return versaoAtiva; },
        get bibliaCarregada() { return bibliaAtual; }
    };
})();
