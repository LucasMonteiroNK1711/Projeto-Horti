let db;

// Função para inicializar o IndexedDB
function initDB() {
    const request = indexedDB.open('fruitDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('fruits')) {
            const fruitStore = db.createObjectStore('fruits', { keyPath: 'plu' });
            fruitStore.createIndex('name', 'name', { unique: false });
            fruitStore.createIndex('image', 'image', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadFruitTable(); // Carrega a tabela ao inicializar
    };

    request.onerror = function(event) {
        console.error("Erro ao abrir o IndexedDB:", event.target.errorCode);
    };
}

// Função para carregar a tabela de frutas do IndexedDB
function loadFruitTable() {
    const transaction = db.transaction(['fruits'], 'readonly'); // Transação de leitura
    const fruitStore = transaction.objectStore('fruits'); // Objeto de armazenamento "fruits"
    
    const request = fruitStore.openCursor(); // Abre um cursor para percorrer as frutas
    
    const tableBody = document.getElementById('fruitTableBody'); // Corpo da tabela
    tableBody.innerHTML = ""; // Limpa a tabela antes de adicionar dados

    request.onsuccess = function(event) {
        const cursor = event.target.result; // Obtém o cursor
        
        if (cursor) {
            const fruit = cursor.value; // Fruta do cursor
            const row = document.createElement('tr'); // Cria uma nova linha para a tabela
            row.innerHTML = `
                <td>${fruit.name}</td> <!-- Nome da fruta -->
                <td>${fruit.plu}</td> <!-- PLU -->
                <td><img src="${fruit.image}" alt="${fruit.name}" width="50" /></td> <!-- Imagem -->
            `;
            tableBody.appendChild(row); // Adiciona a linha ao corpo da tabela
            cursor.continue(); // Continua para o próximo item
        } else {
            console.log("Nenhuma fruta encontrada no banco de dados.");
        }
    };

    request.onerror = function(event) {
        console.error("Erro ao carregar a tabela:", event.target.errorCode); // Tratamento de erro
    };
}



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

// Inicializar o IndexedDB ao carregar a página
window.addEventListener('load', initDB);
