let db; // Variável global para armazenar a referência ao banco de dados

// Abrir o IndexedDB
const request = indexedDB.open("fruitDB", 1); // Banco de dados "FruitDB" na versão 1

request.onupgradeneeded = function (event) {
    db = event.target.result; // Obter o banco de dados
    const fruitStore = db.createObjectStore("fruits", { keyPath: "plu" }); // Object store para "fruits"
    fruitStore.createIndex("name", "name", { unique: true }); // Índice para ordenação por nome
    fruitStore.createIndex("plu", "plu", { unique: false }); // Índice para ordenação por PLU
};

// Se o banco de dados foi aberto com sucesso
request.onsuccess = function (event) {
    db = event.target.result; // Armazena a referência ao banco de dados
    console.log("IndexedDB aberto com sucesso.");
    loadFruitTable(); // Chama a função para carregar a tabela após abertura bem-sucedida
};

// Se houver erro ao abrir o banco de dados
request.onerror = function (event) {
    console.error("Erro ao abrir o IndexedDB:", event.target.errorCode); // Exibe uma mensagem de erro
};


// Função para carregar a tabela de frutas do IndexedDB
function loadFruitTable() {
    if (!db) {
        console.error("IndexedDB não está disponível."); // Verifica se o banco de dados está aberto
        return;
    }

    const transaction = db.transaction(["fruits"], "readonly"); // Transação de leitura
    const fruitStore = transaction.objectStore("fruits"); // Object store de frutas
    const index = fruitStore.index("name"); // Índice para ordenação por nome

    const tableBody = document.getElementById("fruitTableBody"); // Corpo da tabela
    tableBody.innerHTML = ""; // Limpa a tabela antes de adicionar dados

    const request = index.openCursor(); // Usa o índice para abrir um cursor em ordem alfabética

    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const fruit = cursor.value;
            const row = document.createElement("tr"); // Cria uma nova linha para a tabela

            // Ordem das colunas: imagem, nome, PLU
            row.innerHTML = `
                <td><img src="${fruit.image}" alt="${fruit.name}" width="50" /></td>
                <td>${fruit.name}</td>
                <td>${fruit.plu}</td>
            `;

            tableBody.appendChild(row); // Adiciona a linha à tabela
            cursor.continue(); // Continua para o próximo item
        }
    };

    request.onerror = function (event) {
        console.error("Erro ao carregar a tabela:", event.target.errorCode); // Relata o erro
    };
}

// Chama a função para carregar a tabela após a página carregar
window.addEventListener("load", loadFruitTable); // Carrega a tabela quando a página é carregada




// Função para adicionar uma nova fruta ao IndexedDB
function addFruit() {
    const fruitName = document.getElementById('fruitName').value.trim(); // Certifique-se de remover espaços extras
    const fruitPLU = document.getElementById('fruitPLU').value.trim(); // PLU
    const fruitImage = document.getElementById('fruitImage').value.trim(); // Imagem

    if (!fruitName || !fruitPLU) { // Checagem para evitar erros
        alert("Nome e PLU são obrigatórios!");
        return;
    }

    const transaction = db.transaction(['fruits'], 'readwrite'); // Transação de escrita
    const fruitStore = transaction.objectStore('fruits'); // Objeto de armazenamento "fruits"

    const fruit = {
        name: fruitName,
        plu: fruitPLU,
        image: fruitImage,
    };

    const request = fruitStore.add(fruit); // Adiciona a fruta ao IndexedDB

    request.onsuccess = function() {
        loadFruitTable(); // Atualiza a tabela após adicionar
        clearForm(); // Limpa o formulário
    };

    request.onerror = function(event) {
        console.error("Erro ao adicionar fruta:", event.target.errorCode); // Tratamento de erro
    };
}


// Função para limpar o formulário após adicionar uma fruta
function clearForm() {
    document.getElementById('fruitName').value = ""; // Limpa o campo do nome
    document.getElementById('fruitPLU').value = ""; // Limpa o campo do PLU
    document.getElementById('fruitImage').value = ""; // Limpa o campo da imagem
}

// Função para abrir o modal de edição e buscar uma fruta pelo PLU
function openEditModal() {
    const plu = document.getElementById('editPLU').value;

    if (!plu) {
        alert("Por favor, insira um PLU para buscar a fruta para edição.");
        return;
    }

    const transaction = db.transaction(['fruits'], 'readonly');
    const fruitStore = transaction.objectStore('fruits');

    const request = fruitStore.get(plu);

    request.onsuccess = function() {
        const fruit = request.result;
        if (fruit) {
            // Preenche o modal com os dados existentes
            document.getElementById('editFruitName').value = fruit.name;
            document.getElementById('editFruitImage').value = fruit.image;

            // Exibe o modal
            document.getElementById('editFruitModal').style.display = 'block';
            document.getElementById('modalOverlay').style.display = 'block';
        } else {
            alert("Fruta com PLU " + plu + " não encontrada.");
        }
    };

    request.onerror = function(event) {
        console.error("Erro ao buscar a fruta:", event.target.errorCode);
    };
}

// Função para fechar o modal de edição
function closeEditModal() {
    document.getElementById('editFruitModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// Função para salvar alterações após edição
function saveFruit() {
    const plu = document.getElementById('editPLU').value;
    const fruitName = document.getElementById('editFruitName').value;
    const fruitImage = document.getElementById('editFruitImage').value;

    if (!fruitName) {
        alert("Nome é obrigatório!");
        return;
    }

    const transaction = db.transaction(['fruits'], 'readwrite');
    const fruitStore = transaction.objectStore('fruits');

    const fruit = {
        name: fruitName,
        plu,
        image: fruitImage,
    };

    const request = fruitStore.put(fruit); // Atualiza a fruta no IndexedDB

    request.onsuccess = function() {
        loadFruitTable(); // Atualiza a tabela após salvar alterações
        alert("Fruta atualizada com sucesso!");
        closeEditModal(); // Fecha o modal após salvar
    };

    request.onerror = function(event) {
        console.error("Erro ao atualizar a fruta:", event.target.errorCode);
    };
}

// Função para excluir uma fruta pelo PLU
function deleteFruit() {
    const plu = document.getElementById('deletePLU').value;

    if (!plu) {
        alert("Por favor, insira um PLU para excluir.");
        return;
    }

    const transaction = db.transaction(['fruits'], 'readwrite');
    const fruitStore = transaction.objectStore('fruits');

    const request = fruitStore.delete(plu);

    request.onsuccess = function() {
        alert("Fruta excluída com sucesso!");
        loadFruitTable(); // Atualiza a tabela após a exclusão
    };

    request.onerror = function(event) {
        console.error("Erro ao excluir a fruta:", event.target.errorCode);
    };
}

// Função para imprimir a página
function printPage() {
    window.print(); // Chama a função de impressão do navegador
}

function splitTableForPrint() {
    const tableBody = document.getElementById("fruitTableBody"); // Tabela original
    const rows = Array.from(tableBody.children); // Converter filhos em array

    const midpoint = Math.floor(rows.length / 2); // Meio da tabela
    
    const firstHalf = rows.slice(0, midpoint); // Primeira metade
    const secondHalf = rows.slice(midpoint); // Segunda metade

    const printOnlyDiv = document.querySelector(".print-only");
    
    const firstTable = document.createElement("table");
    const secondTable = document.createElement("table");

    // Criar cabeçalhos para as tabelas
    const createHeader = () => {
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th>Nome</th>
            <th>PLU</th>
            <th>Imagem</th>
        `;
        thead.appendChild(tr);
        return thead;
    };

    firstTable.appendChild(createHeader());
    secondTable.appendChild(createHeader());

    const appendRowsToTable = (table, rows) => {
        const tbody = document.createElement("tbody");
        rows.forEach(row => tbody.appendChild(row.cloneNode(true)));
        table.appendChild(tbody);
    };

    appendRowsToTable(firstTable, firstHalf);
    appendRowsToTable(secondTable, secondHalf);

    // Adicionar as tabelas de impressão
    printOnlyDiv.appendChild(firstTable);
    printOnlyDiv.appendChild(secondTable);
}

// Adicionar evento para dividir a tabela antes de imprimir
document.querySelector("button").addEventListener("click", () => {
    splitTableForPrint();
    window.print(); // Chama a função de impressão
});


// Configurações de eventos para adicionar, editar, excluir e imprimir
document.getElementById('addFruit').addEventListener('click', addFruit);
document.getElementById('editFruit').addEventListener('click', openEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
document.getElementById('saveFruit').addEventListener('click', saveFruit);
document.getElementById('deleteFruit').addEventListener('click', deleteFruit);
document.getElementById('printPage').addEventListener('click', printPage);
document.getElementById("sortByName").addEventListener("click", function () {
    loadFruitTable(); // Recarrega a tabela para ordenar por nome
});


// Inicializar o IndexedDB ao carregar a página
//window.addEventListener('load', initDB);

window.addEventListener("load", function () {
    if (!db) {
        loadFruitTable(); // Carrega a tabela se o IndexedDB estiver aberto
    } else {
        console.error("IndexedDB ainda não foi aberto. Certifique-se de que a abertura ocorreu com sucesso.");
    }
});


