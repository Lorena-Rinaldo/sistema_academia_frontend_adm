/**
 * IRON GYM - SISTEMA ADMINISTRATIVO
 * Versão: CPF Limpo no Banco / Mascarado na UI + Mensagens + Filtro
 */

const CONFIG = {
    API_URL: 'https://sistema-academia-backend-hx4f.vercel.app',
    TOKEN_KEY: 'iron_jwt_token',
    AUTH_KEY: 'iron_auth'
};

const STATE = {
    activeStudentCpf: null,
    listaCompleta: [], // Novo: para manter referência ao filtrar
    isSubmitting: false,
    isEditing: () => !!STATE.activeStudentCpf
};

const DOM = {
    loginSection: document.getElementById('login-section'),
    adminSection: document.getElementById('admin-panel'),
    loginForm: document.getElementById('login-form'),
    studentTable: document.getElementById('lista-usuarios'),
    studentModal: document.getElementById('modal-aluno'),
    studentForm: document.getElementById('form-aluno-modal'),
    modalTitle: document.getElementById('modal-titulo'),
    inputBusca: document.getElementById('input-busca'),
    toastContainer: document.getElementById('toast-container'),
    inputs: {
        nome: document.getElementById('nome-modal'),
        cpf: document.getElementById('cpf-modal'),
        status: document.getElementById('plano-modal')
    }
};

// --- UTILITÁRIOS ---
const formatters = {
    toCpfMask(value) {
        return value.replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    },
    stripNonDigits(value) {
        return value.replace(/\D/g, "");
    }
};

// --- FUNÇÃO DE MENSAGENS (TOAST) ---
const exibirMensagem = (texto) => {
    const toast = document.createElement('div');
    toast.className = "gold-gradient text-black px-6 py-4 rounded-xl font-bold uppercase text-xs shadow-2xl animate-toast";
    toast.innerText = texto;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- SERVIÇOS DE COMUNICAÇÃO ---
const apiService = {
    async request(path, { method = 'GET', body = null } = {}) {
        const token = sessionStorage.getItem(CONFIG.TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${CONFIG.API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 401) authService.logout();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Erro: ${response.status}`);

        return data;
    }
};

// --- SERVIÇOS DE AUTENTICAÇÃO ---
const authService = {
    async login(usuario, senha) {
        try {
            const data = await apiService.request('/login', {
                method: 'POST',
                body: { usuario, senha }
            });

            if (data.token) {
                sessionStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                sessionStorage.setItem(CONFIG.AUTH_KEY, 'true');
                uiController.initDashboard();
            }
        } catch (err) {
            alert(err.message);
        }
    },

    logout() {
        sessionStorage.clear();
        location.reload();
    }
};

// --- GESTÃO DE ALUNOS ---
const studentService = {
    async fetchAll() {
        uiController.toggleLoader(true);
        try {
            const list = await apiService.request('/alunos');
            STATE.listaCompleta = list; // Salva a lista original para o filtro
            uiController.renderStudentTable(list);
        } catch (err) {
            uiController.renderError();
        }
    },

    async persist(studentData) {
        if (STATE.isSubmitting) return;

        const rawCpf = formatters.stripNonDigits(studentData.cpf);
        const payload = { ...studentData, cpf: rawCpf };
        const isEditing = STATE.isEditing();

        const path = isEditing ? `/alunos/${STATE.activeStudentCpf}` : '/alunos';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            STATE.isSubmitting = true;
            uiController.setSubmitButtonLoading(true);

            await apiService.request(path, { method, body: payload });
            uiController.closeModal();
            this.fetchAll();

            // Mensagens solicitadas
            exibirMensagem(isEditing ? "Usuário atualizado com sucesso" : "Usuário cadastrado com sucesso");
        }
        catch (err) {
            alert(err.message);
        }
        finally {
            STATE.isSubmitting = false;
            uiController.setSubmitButtonLoading(false);
        }
    },

    async delete(cpf) {
        const rawCpf = formatters.stripNonDigits(cpf);
        if (!confirm(`Deseja excluir permanentemente o aluno de CPF: ${formatters.toCpfMask(rawCpf)}?`)) return;

        try {
            await apiService.request(`/alunos/${rawCpf}`, { method: 'DELETE' });
            this.fetchAll();
            exibirMensagem("Usuário excluído com sucesso"); // Mensagem solicitada
        } catch (err) {
            alert(err.message);
        }
    }
};

// --- CONTROLADOR DE INTERFACE ---
const uiController = {
    setSubmitButtonLoading(isLoading) {
        const btn = DOM.studentForm.querySelector('button[type="submit"]');
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerText;
            btn.innerText = "PROCESSANDO...";
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        } else {
            btn.disabled = false;
            btn.innerText = btn.dataset.originalText || "SALVAR";
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    },

    initDashboard() {
        DOM.loginSection.classList.add('hidden');
        DOM.adminSection.classList.remove('hidden');
        studentService.fetchAll();
    },

    toggleLoader(show) {
        if (show) DOM.studentTable.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-zinc-500 italic animate-pulse">Sincronizando dados...</td></tr>';
    },

    renderError() {
        DOM.studentTable.innerHTML = '<tr><td colspan="4" class="p-5 text-center text-red-500 font-bold">Falha na conexão com a API.</td></tr>';
    },

    openModal(student = null) {
        STATE.activeStudentCpf = student ? formatters.stripNonDigits(student.cpf) : null;
        DOM.studentForm.reset();

        DOM.modalTitle.innerText = STATE.isEditing() ? "Editar Aluno" : "Novo Cadastro";
        DOM.inputs.cpf.disabled = STATE.isEditing();

        if (student) {
            DOM.inputs.nome.value = student.nome;
            DOM.inputs.cpf.value = formatters.toCpfMask(student.cpf);
            DOM.inputs.status.value = student.status.toString();
        }

        DOM.studentModal.classList.add('modal-active');
    },

    closeModal() {
        DOM.studentModal.classList.remove('modal-active');
    },

    renderStudentTable(list) {
        DOM.studentTable.innerHTML = list.length ? "" : '<tr><td colspan="4" class="p-5 text-center text-zinc-500">Nenhum registro encontrado.</td></tr>';

        list.forEach(item => {
            const statusStyle = item.status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
            const rawCpf = formatters.stripNonDigits(item.cpf);

            DOM.studentTable.innerHTML += `
                <tr class="border-b border-zinc-800/50 hover:bg-white/5 transition-all">
                    <td class="p-5 font-bold text-white">${item.nome}</td>
                    <td class="p-5 font-mono text-zinc-400">${formatters.toCpfMask(item.cpf)}</td>
                    <td class="p-5">
                        <span class="${statusStyle} text-[10px] px-2 py-1 rounded uppercase font-bold">
                            ${item.status ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="p-5 text-center">
                        <button onclick="uiController.handleEdit('${rawCpf}', '${item.nome}', ${item.status})" 
                                class="text-blue-400 font-bold text-xs mr-4 hover:underline cursor-pointer">EDITAR</button>
                        <button onclick="window.deletarAluno('${rawCpf}')" 
                                class="text-red-500 font-bold text-xs hover:underline cursor-pointer">EXCLUIR</button>
                    </td>
                </tr>`;
        });
    },

    handleEdit(cpf, nome, status) {
        this.openModal({ cpf, nome, status });
    }
};

// --- EXPOSIÇÃO GLOBAL E EVENTOS ---
window.logout = () => authService.logout();
window.deletarAluno = (cpf) => studentService.delete(cpf);
window.fecharModal = () => uiController.closeModal();
window.abrirModalCadastro = () => uiController.openModal();

DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    authService.login(document.getElementById('user').value, document.getElementById('pass').value);
});

DOM.studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    studentService.persist({
        nome: DOM.inputs.nome.value.trim(),
        cpf: DOM.inputs.cpf.value.trim(),
        status: DOM.inputs.status.value === 'true'
    });
});

// Evento de Pesquisa Dinâmica
DOM.inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = STATE.listaCompleta.filter(aluno =>
        aluno.nome.toLowerCase().startsWith(termo)
    );
    uiController.renderStudentTable(filtrados);
});

DOM.inputs.cpf.addEventListener('input', (e) => {
    e.target.value = formatters.toCpfMask(e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem(CONFIG.AUTH_KEY)) uiController.initDashboard();
});