    // --- 상태 관리 변수 ---
    let people = [];
    let expenses = [];
    let currentSettlementId = null;


    // --- 도움말 팝업 관리 ---
    async function toggleHelpPopup(show) {
    const popupOverlay = document.getElementById('help-popup-overlay');
    const popupContent = document.getElementById('help-popup-content');

    if (show && popupContent.innerHTML.trim() === '') {
    try {
    const response = await fetch('./how-to-use.html');
    if (!response.ok) throw new Error('파일을 찾을 수 없습니다.');
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const howToUseContent = doc.querySelector('main'); // main 태그 안의 내용을 가져옵니다.
    if (howToUseContent) {
    popupContent.innerHTML = howToUseContent.innerHTML;
} else {
    throw new Error('콘텐츠를 파싱할 수 없습니다.');
}
} catch (error) {
    console.error('도움말 콘텐츠 로딩 실패:', error);
    popupContent.innerText = '오류: 도움말 파일을 불러올 수 없습니다. 파일이 정확한 위치에 있는지 확인해주세요.';
}
}
    popupOverlay.classList.toggle('hidden', !show);
}

    // --- 데이터 관리 및 앱 핵심 기능 ---
    function getSettlements() {
    return JSON.parse(localStorage.getItem('settlements') || '[]');
}

    function saveSettlements(settlements) {
    localStorage.setItem('settlements', JSON.stringify(settlements));
}

    function saveCurrentSettlement() {
    if (!currentSettlementId) return;
    const settlements = getSettlements();
    const index = settlements.findIndex(s => s.id === currentSettlementId);
    if (index > -1) {
    settlements[index].people = people;
    settlements[index].expenses = expenses;
    saveSettlements(settlements);
}
}

    function renderSavedSettlements() {
        const settlements = getSettlements();
        const container = document.getElementById('saved-settlements-list');
        container.innerHTML = '';
        if (settlements.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500">저장된 내역이 없습니다.</p>`;
            return;
        }
        settlements.sort((a, b) => b.id - a.id);
        settlements.forEach(s => {
            const date = new Date(s.id).toLocaleDateString('ko-KR');
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-xl';

            // '불러오기' 버튼의 onclick 이벤트를 페이지 이동으로 변경
            div.innerHTML = `
            <div>
                <p class="font-semibold">${s.name}</p>
                <p class="text-sm text-gray-500">생성일: ${date}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.location.href='settlement.html?id=${s.id}'" class="px-3 py-1 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition">불러오기</button>
                <button onclick="deleteSettlement(${s.id})" class="px-3 py-1 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition">삭제</button>
            </div>`;
            container.appendChild(div);
        });
    }

    function createNewSettlement() {
    const name = prompt("새로운 정산의 이름을 입력해주세요:", `정산 ${new Date().toLocaleDateString()}`);
    if (!name || !name.trim()) return;
    const settlements = getSettlements();
    const newSettlement = {
    id: Date.now(),
    name: name.trim(),
    people: [],
    expenses: []
};
    settlements.push(newSettlement);
    saveSettlements(settlements);
    window.location.href = `settlement.html?id=${newSettlement.id}`;
}

    function loadSettlement(id) {
        const settlements = getSettlements();
        const settlement = settlements.find(s => s.id === id);

        if (settlement) {
            currentSettlementId = settlement.id;
            people = settlement.people || [];
            expenses = settlement.expenses || [];

            // 이 코드는 settlement.html에 settlement-title ID가 있으므로 정상 작동합니다.
            document.getElementById('settlement-title').innerText = settlement.name;

            renderAll(); // 참여자, 지출 내역 등을 화면에 렌더링
        } else {
            alert("정산 내역을 찾을 수 없습니다.");
            window.location.href = 'index.html';
        }
    }

    function deleteSettlement(id) {
    if (!confirm("정말로 이 정산 내역을 삭제하시겠습니까?")) return;
    let settlements = getSettlements();
    settlements = settlements.filter(s => s.id !== id);
    saveSettlements(settlements);
    renderSavedSettlements();
}


    function renderAll() {
    renderPeople();
    renderExpenses();
    updateSummary();
}

    function resetAllData() {
    if(confirm('정말로 모든 참여자와 지출 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    people = [];
    expenses = [];
    saveCurrentSettlement();
    renderAll();
}
}

    function renderPeople() {
    const personList = document.getElementById("personList");
    const paidBy = document.getElementById("paidBy");
    const involvedContainer = document.getElementById("involvedPeopleContainer");
    const manualContainer = document.getElementById("manualAmountContainer");
    personList.innerHTML = "";
    paidBy.innerHTML = '<option value="">결제자 선택</option>';
    involvedContainer.innerHTML = "";
    manualContainer.innerHTML = "";
    people.forEach((person, index) => {
    const badge = document.createElement("div");
    badge.className = "flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full";
    badge.innerHTML = `<span>${person}</span><button onclick="removePerson(${index})" class="text-red-500 hover:text-red-700 font-bold">x</button>`;
    personList.appendChild(badge);
    const opt1 = new Option(person, person);
    paidBy.add(opt1);
    const checkbox = document.createElement("label");
    checkbox.className = "flex items-center gap-2 px-3 py-1 bg-gray-200 rounded-xl cursor-pointer text-gray-700";
    checkbox.innerHTML = `<input type="checkbox" class="involved-checkbox" value="${person}" checked> ${person}`;
    involvedContainer.appendChild(checkbox);
    const manualInput = document.createElement("div");
    manualInput.className = "flex items-center gap-2";
    manualInput.innerHTML = `<label class="w-20 text-sm font-medium">${person}:</label><input type="number" class="manual-amount flex-1 rounded-xl border px-2 py-1" data-person="${person}" placeholder="0" oninput="recalculateManualAmounts(this)"><span class="text-xs text-gray-500">원</span>`;
    manualContainer.appendChild(manualInput);
});
}

    function addPerson() {
    const input = document.getElementById("personName");
    const name = input.value.trim();
    if (!name) return;
    if (people.includes(name)) {
    alert("이미 존재하는 이름입니다.");
    return;
}
    people.push(name);
    input.value = "";
    renderPeople();
    updateSummary();
    saveCurrentSettlement();
}

    function removePerson(index) {
    people.splice(index, 1);
    renderPeople();
    updateSummary();
    saveCurrentSettlement();
}
    function autoFillManualAmounts() {
    const totalAmount = parseFloat(document.getElementById("expenseAmount").value) || 0;
    const manualInputs = document.querySelectorAll(".manual-amount");
    const numPeople = manualInputs.length;

    if (totalAmount > 0 && numPeople > 0) {
    const baseAmount = Math.floor(totalAmount / numPeople);
    const remainder = totalAmount % numPeople;

    manualInputs.forEach((input, index) => {
    let personAmount = baseAmount;
    // 마지막 사람에게 나머지 금액을 더해줍니다.
    if (index === numPeople - 1) {
    personAmount += remainder;
}
    input.value = personAmount;
});
} else {
    manualInputs.forEach(input => {
    input.value = "";
});
}
    validateManualAmounts(); // 금액이 자동 분배된 후 유효성 검사를 다시 실행합니다.
}

    // 사용자가 수동 금액을 수정할 때마다 나머지 금액을 재분배하는 함수
    function recalculateManualAmounts(editedInput) {
    // 수정된 입력 필드에 '수정됨' 상태를 표시합니다.
    if (editedInput) {
    editedInput.setAttribute('data-edited', 'true');
}

    const totalAmount = parseFloat(document.getElementById("expenseAmount").value) || 0;
    const manualInputs = Array.from(document.querySelectorAll(".manual-amount"));

    let fixedAmount = 0;
    const uneditedInputs = [];

    // 수정된 값(고정액)과 수정되지 않은 입력 필드를 분리합니다.
    manualInputs.forEach(input => {
    if (input.getAttribute('data-edited') === 'true') {
    fixedAmount += parseFloat(input.value) || 0;
} else {
    uneditedInputs.push(input);
}
});

    const remainingAmount = totalAmount - fixedAmount;
    const numUnedited = uneditedInputs.length;

    // 수정되지 않은 필드에 나머지 금액을 1/n로 분배합니다.
    if (numUnedited > 0) {
    const baseAmount = Math.floor(remainingAmount / numUnedited);
    const remainder = remainingAmount % numUnedited;

    uneditedInputs.forEach((input, index) => {
    let personAmount = baseAmount;
    if (index === numUnedited - 1) { // 마지막 사람에게 나머지 할당
    personAmount += remainder;
}
    input.value = personAmount;
});
}

    validateManualAmounts(); // 최종적으로 금액 합계 유효성 검사
}


    function toggleSplitType() {
    const isManual = document.querySelector('input[name="splitType"]:checked').value === 'manual';
    document.getElementById('equalSplitContainer').classList.toggle('hidden', isManual);
    document.getElementById('manualSplitContainer').classList.toggle('hidden', !isManual);

    if (isManual) {
    // 모든 입력 필드의 '수정됨' 상태를 초기화합니다.
    document.querySelectorAll(".manual-amount").forEach(input => {
    input.removeAttribute('data-edited');
});
    // 재계산 함수를 호출하여 1/n을 먼저 채웁니다. (인자 없이 호출)
    recalculateManualAmounts();
}
}

    function validateManualAmounts() {
    const totalAmount = parseFloat(document.getElementById("expenseAmount").value) || 0;
    let manualTotal = 0;
    document.querySelectorAll(".manual-amount").forEach(input => {
    manualTotal += parseFloat(input.value) || 0;
});
    const validationDiv = document.getElementById("amountValidation");
    const difference = totalAmount - manualTotal;
    if (Math.abs(difference) < 0.01) {
    validationDiv.innerHTML = '<span class="text-green-600">✓ 금액이 일치합니다</span>';
} else if (difference > 0) {
    validationDiv.innerHTML = `<span class="text-orange-600">⚠ ${difference.toLocaleString()}원 부족합니다</span>`;
} else {
    validationDiv.innerHTML = `<span class="text-red-600">✗ ${Math.abs(difference).toLocaleString()}원 초과입니다</span>`;
}
}

    function addExpense() {
    const title = document.getElementById("expenseTitle").value.trim();
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const paidBy = document.getElementById("paidBy").value;
    const splitType = document.querySelector('input[name="splitType"]:checked').value;
    if (!title || isNaN(amount) || amount <= 0 || !paidBy) {
    alert("항목, 0원 초과의 금액, 결제자를 모두 입력해주세요.");
    return;
}
    const expenseData = { title, amount, paidBy, splitType };
    if (splitType === 'equal') {
    const involved = Array.from(document.querySelectorAll(".involved-checkbox:checked")).map(cb => cb.value);
    if (involved.length === 0) {
    alert("정산 대상자를 선택해주세요.");
    return;
}
    expenseData.involved = involved;
} else {
    const manualAmounts = {};
    let manualTotal = 0;
    document.querySelectorAll(".manual-amount").forEach(input => {
    const personAmount = parseFloat(input.value) || 0;
    if (personAmount > 0) {
    manualAmounts[input.dataset.person] = personAmount;
    manualTotal += personAmount;
}
});
    if (Math.abs(amount - manualTotal) > 0.01) {
    alert("수동 입력 금액의 합이 총 금액과 일치하지 않습니다.");
    return;
}
    if (Object.keys(manualAmounts).length === 0) {
    alert("최소 한 명의 정산 금액을 입력해주세요.");
    return;
}
    expenseData.manualAmounts = manualAmounts;
}
    const note = document.getElementById("expenseNote").value.trim();
    if (note) expenseData.note = note;
    expenses.push(expenseData);
    document.getElementById("expenseTitle").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("paidBy").value = "";
    document.querySelectorAll(".involved-checkbox").forEach(cb => cb.checked = true);
    document.querySelectorAll(".manual-amount").forEach(input => input.value = "");
    document.getElementById("expenseNote").value = "";
    document.getElementById("amountValidation").innerHTML = "";
    renderExpenses();
    updateSummary();
    saveCurrentSettlement();
}

    function renderExpenses() {
    const container = document.getElementById("expenseList");
    container.innerHTML = "";
    if (expenses.length === 0) {
    container.innerHTML = `<p class="text-center text-gray-500">추가된 지출 내역이 없습니다.</p>`;
    return;
}
    expenses.forEach((exp, index) => {
    const colors = ["bg-purple-50 border-purple-200", "bg-green-50 border-green-200", "bg-yellow-50 border-yellow-200", "bg-pink-50 border-pink-200", "bg-blue-50 border-blue-200"];
    const div = document.createElement("div");
    div.className = `p-4 rounded-2xl border-2 flex justify-between items-start ${colors[index % colors.length]}`;

    let splitInfo = "";
    if (exp.splitType === 'equal') {
    const amountPerPerson = Math.round(exp.amount / exp.involved.length);
    splitInfo = exp.involved.map(person => `<i class="font-semibold not-italic">${person}</i> ${amountPerPerson.toLocaleString()}원`).join(", ");
} else {
    splitInfo = Object.entries(exp.manualAmounts).map(([person, amount]) => `<i class="font-semibold not-italic">${person}</i> ${amount.toLocaleString()}원`).join(", ");
}

    if (exp.note) {
    splitInfo += `<br><span class="text-xs text-gray-500 mt-1 inline-block">비고: ${exp.note}</span>`;
}

    const splitTypeLabel = exp.splitType === 'equal' ? '균등' : '수동';
    const splitTypeBadgeColor = exp.splitType === 'equal' ? 'bg-blue-500' : 'bg-green-500';

    // 모바일 환경을 고려하여 레이아웃 수정
    div.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 text-xs font-semibold text-white rounded-full ${splitTypeBadgeColor}">${splitTypeLabel}</span>
              <span class="font-semibold truncate">${exp.title}</span>
            </div>
            <div class="font-bold text-lg">${exp.amount.toLocaleString()}원 <span class="text-sm font-medium text-gray-500">(결제: ${exp.paidBy})</span></div>
            <div class="text-sm text-gray-600 pt-2 mt-2 border-t border-gray-200">${splitInfo}</div>
          </div>
          <button onclick="removeExpense(${index})" class="px-3 py-1 bg-red-500 text-white rounded-xl hover:bg-red-600 ml-3 flex-shrink-0">삭제</button>
        `;
    container.appendChild(div);
});
}

    function removeExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
    updateSummary();
    saveCurrentSettlement();
}

    function updateSummary() {
    const balances = getBalances();
    const summaryList = document.getElementById("summaryList");
    summaryList.innerHTML = "";
    if (people.length === 0) {
    summaryList.innerHTML = `<p class="text-center text-gray-500 font-medium text-base">참여자를 추가해주세요.</p>`;
    document.getElementById('totalAmount').innerText = '₩ 0';
    document.getElementById('transactionList').innerHTML = '';
    return;
}
    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('totalAmount').innerText = `₩ ${totalSpending.toLocaleString()}`;
    people.forEach(person => {
    const li = document.createElement("div");
    li.className = "flex justify-between items-center p-3 rounded-xl";
    const amount = balances[person] || 0;
    let amountText;
    if (amount > 0.01) {
    li.className += ' bg-blue-50';
    amountText = `<span class="font-bold text-blue-700">+${amount.toLocaleString()}원</span>`;
} else if (amount < -0.01) {
    li.className += ' bg-red-50';
    amountText = `<span class="font-bold text-red-700">${amount.toLocaleString()}원</span>`;
} else {
    li.className += ' bg-gray-100';
    amountText = `<span class="font-bold text-gray-700">${amount.toLocaleString()}원</span>`;
}
    li.innerHTML = `<span class="font-medium">${person}</span> ${amountText}`;
    summaryList.appendChild(li);
});
    renderTransactions(balances);
}

    function renderTransactions(balances) {
    const transactionList = document.getElementById("transactionList");
    transactionList.innerHTML = '';
    const transactions = calculateTransactions(balances);
    if (transactions.length === 0) {
    transactionList.innerHTML = `<p class="text-center text-green-600 font-semibold p-4 bg-green-50 rounded-xl">모든 정산이 완료되었습니다! 🎉</p>`;
    return;
}
    transactions.forEach(({ from, to, amount }) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-xl';
    div.innerHTML = `<span class="font-bold text-red-600">${from}</span><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg><span class="font-bold text-green-600">${to}</span><span class="font-semibold text-gray-800 bg-gray-200 px-3 py-1 rounded-full">${amount.toLocaleString()}원</span>`;
    transactionList.appendChild(div);
});
}

    function calculateTransactions(balances) {
    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([person, amount]) => {
    if (amount > 0.01) creditors.push({ person, amount });
    else if (amount < -0.01) debtors.push({ person, amount: -amount });
});
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    const transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amountToTransfer = Math.min(debtor.amount, creditor.amount);
    if (amountToTransfer > 0.01) {
    transactions.push({ from: debtor.person, to: creditor.person, amount: Math.round(amountToTransfer) });
}
    debtor.amount -= amountToTransfer;
    creditor.amount -= amountToTransfer;
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
}
    return transactions;
}

    function getBalances() {
    const balances = {};
    people.forEach(p => balances[p] = 0);
    expenses.forEach(exp => {
    if (people.includes(exp.paidBy)) balances[exp.paidBy] += exp.amount;
    if (exp.splitType === 'equal') {
    const share = exp.amount / exp.involved.length;
    exp.involved.forEach(p => { if (people.includes(p)) balances[p] -= share; });
} else {
    Object.entries(exp.manualAmounts).forEach(([p, a]) => { if (people.includes(p)) balances[p] -= a; });
}
});
    const roundingOption = document.getElementById("roundingOption").value;
    Object.keys(balances).forEach(person => {
    const amount = balances[person];
    if (roundingOption === "0") balances[person] = Math.round(amount);
    else if (roundingOption === "10") balances[person] = Math.round(amount / 10) * 10;
    else if (roundingOption === "100") balances[person] = Math.round(amount / 100) * 100;
    else balances[person] = Math.round(amount * 100) / 100;
});
    return balances;
}

    function generateContent() {
    const balances = getBalances();
    const transactions = calculateTransactions(balances);
    const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const now = new Date();
    let content = [ `정산 내역 (${now.toLocaleDateString('ko-KR')})`, '='.repeat(50), `👥 참여자: ${people.join(', ')}`, `💰 총 지출: ${totalSpending.toLocaleString()}원`, '', '--- 📝 지출 목록 ---' ];
    expenses.forEach((exp, index) => {
    content.push(`${index + 1}. ${exp.title} - ${exp.amount.toLocaleString()}원 (결제: ${exp.paidBy})`);
    if (exp.splitType === 'equal') {
    const share = exp.amount / exp.involved.length;
    content.push(`  - 방식: 균등분할 (${exp.involved.join(', ')})`, `  - 인당: ${Math.round(share).toLocaleString()}원`);
} else {
    content.push(`  - 방식: 수동분할`);
    Object.entries(exp.manualAmounts).forEach(([p, a]) => content.push(`    - ${p}: ${a.toLocaleString()}원`));
    if (exp.note) content.push(`  - 비고: ${exp.note}`);
}
    content.push('');
});
    content.push('--- 💸 개인별 정산 현황 ---');
    people.forEach(person => {
    const amount = balances[person] || 0;
    const status = amount > 0.01 ? '받을 금액' : amount < -0.01 ? '보낼 금액' : '정산완료';
    content.push(`${person}: ${amount > 0 ? '+' : ''}${amount.toLocaleString()}원 (${status})`);
});
    content.push('\n--- ✅ 정산 방법 ---');
    if (transactions.length === 0) {
    content.push('모든 정산이 완료되었습니다!');
} else {
    transactions.forEach(t => { content.push(`${t.from} → ${t.to} : ${t.amount.toLocaleString()}원`); });
}
    return content.join('\n');
}

    function exportTXT() {
    const content = generateContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `정산내역_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

    async function exportPDF() {
    const exportBtn = document.getElementById('pdf-export-btn');
    const originalText = exportBtn.innerText;
    exportBtn.innerText = '생성 중..';
    exportBtn.disabled = true;
    try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pdfWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = margin;
    const checkPageBreak = (requiredHeight) => { if (currentY + requiredHeight > pageHeight - margin - 10) { doc.addPage(); currentY = margin; return true; } return false; };
    const addElementToPDF = async (element) => {
    if (!element || element.offsetHeight === 0) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const maxHeight = pageHeight - margin * 2;
    if (imgHeight > maxHeight) {
    const totalParts = Math.ceil(imgHeight / maxHeight);
    const partHeight = maxHeight;
    const canvasPartHeight = canvas.height / totalParts;
    for (let i = 0; i < totalParts; i++) {
    if (i > 0) { doc.addPage(); currentY = margin; } else { checkPageBreak(partHeight); }
    const partCanvas = document.createElement('canvas');
    const partCtx = partCanvas.getContext('2d');
    partCanvas.width = canvas.width;
    partCanvas.height = canvasPartHeight;
    partCtx.drawImage(canvas, 0, i * canvasPartHeight, canvas.width, canvasPartHeight, 0, 0, canvas.width, canvasPartHeight);
    const partImgData = partCanvas.toDataURL('image/png');
    doc.addImage(partImgData, 'PNG', margin, currentY, pdfWidth, partHeight);
    currentY += partHeight + 3;
}
} else {
    checkPageBreak(imgHeight);
    doc.addImage(imgData, 'PNG', margin, currentY, pdfWidth, imgHeight);
    currentY += imgHeight + 5;
}
};
    const printContainer = document.createElement('div');
    printContainer.style.cssText = `position: fixed; top: 0; left: 0; width: 750px; background: white; padding: 20px; z-index: -9999; opacity: 0;`;
    const expenseCard = document.getElementById('expense-list-card').cloneNode(true);
    const summaryCard = document.getElementById('summary-card').cloneNode(true);
    summaryCard.querySelectorAll('button, select').forEach(btn => btn.remove());
    printContainer.appendChild(expenseCard);
    printContainer.appendChild(summaryCard);
    document.body.appendChild(printContainer);
    const expenseElements = [printContainer.querySelector('#expense-list-card > h2'), ...printContainer.querySelectorAll('#expenseList > div')].filter(el => el);
    for (const element of expenseElements) { await addElementToPDF(element); }
    if (expenseElements.length > 1) { doc.addPage(); currentY = margin; }
    const individualStatusTitle = Array.from(printContainer.querySelectorAll('#summary-card h3')).find(h => h.textContent.includes('개인별 정산 현황'));
    const settlementMethodTitle = Array.from(printContainer.querySelectorAll('#summary-card h3')).find(h => h.textContent.includes('정산 방법'));
    const summaryElements = [printContainer.querySelector('#summary-menu'), printContainer.querySelector('#total-spending'), individualStatusTitle, ...printContainer.querySelectorAll('#summaryList > div'), settlementMethodTitle, ...printContainer.querySelectorAll('#transactionList > div')].filter(el => el);
    for (const element of summaryElements) { await addElementToPDF(element); }
    doc.save(`정산내역_${new Date().toISOString().slice(0,10)}.pdf`);
} catch (error) {
    console.error("PDF 생성 오류:", error);
    alert("PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
} finally {
    const containers = document.querySelectorAll('[style*="z-index: -9999"]');
    containers.forEach(container => { if (container.parentNode) container.parentNode.removeChild(container); });
    exportBtn.innerText = originalText;
    exportBtn.disabled = false;
}
}

    // 👇 여기에 새로운 함수를 추가하세요!
    // 👇 app.js 파일에서 이 함수를 찾아 아래 코드로 교체하세요.
    async function exportImage() {
        const settleTitle = document.getElementById('settlement-title').innerText || '정산';
        const exportBtn = document.querySelector('button[onclick="exportImage()"]');

        // 이미 공유 작업이 진행 중이면 함수를 즉시 종료
        if (exportBtn.disabled) {
            console.log("공유 작업이 이미 진행 중입니다.");
            return;
        }

        const originalText = exportBtn.innerText;
        exportBtn.innerText = '생성 중..';
        exportBtn.disabled = true; // 버튼 비활성화

        const container = document.createElement('div');
        container.style.cssText = `position: absolute; top: 0; left: -9999px; width: 600px; background-color: #f9fafb; padding: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;`;

        // ... (기존 htmlContent 생성 코드는 그대로 둡니다) ...

        let finalSettlementHtml = '';
        const transactions = calculateTransactions(getBalances());
        if (transactions.length === 0) {
            finalSettlementHtml = `<div style="text-align: center; color: #16a34a; font-weight: 600; padding: 1rem; background-color: #f0fdf4; border-radius: 0.75rem;">모든 정산이 완료되었습니다! 🎉</div>`;
        } else {
            transactions.forEach(({ from, to, amount }) => {
                finalSettlementHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background-color: #f9fafb; border-radius: 0.75rem; margin-bottom: 0.75rem;">
          <span style="font-weight: 700; color: #dc2626;">${from}</span>
          <svg xmlns="http://www.w3.org/2000/svg" style="height: 1.25rem; width: 1.25rem; color: #6b7280; flex-shrink: 0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          <span style="font-weight: 700; color: #16a34a;">${to}</span>
          <span style="font-weight: 600; color: #1f2937; background-color: #e5e7eb; padding: 0.25rem 0.75rem; border-radius: 9999px; white-space: nowrap;">${amount.toLocaleString()}원</span>
        </div>
      `;
            });
        }

        // ... (기존 htmlContent 생성 코드) ...
        const people = getSettlements().find(s => s.id === currentSettlementId)?.people || [];
        let htmlContent = `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 25px;">
      <h1 style="text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 8px;">${settleTitle} 내역서</h1>
      <p style="text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 25px;">${new Date().toLocaleDateString('ko-KR')} 기준</p>

      <div style="border-top: 2px dashed #e5e7eb; padding-top: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">📈 지출 요약</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <span style="font-size: 16px; color: #4b5563;">총 지출 금액</span>
          <span style="font-size: 20px; font-weight: 700; white-space: nowrap;">${document.getElementById('totalAmount').innerText}</span>
        </div>
        <div style="margin-top: 10px;">
          <span style="font-size: 16px; color: #4b5563;">참여자 (${people.length}명)</span>
          <p style="font-size: 16px; font-weight: 500; margin-top: 5px; color: #1f2937;">${people.join(', ')}</p>
        </div>
      </div>

      <div style="border-top: 2px dashed #e5e7eb; padding-top: 20px; margin-top: 25px;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 15px;">📋 상세 지출 내역</h2>
        <div style="font-size: 15px; line-height: 1.8;">`;

        expenses.forEach(exp => {
            htmlContent += `<div style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <div style="display: flex; justify-content: space-between; font-weight: 600;">
                      <span>${exp.title}</span>
                      <span style="white-space: nowrap; padding-left: 10px;">${exp.amount.toLocaleString()}원</span>
                    </div>
                    <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">결제: ${exp.paidBy}</div>
                  </div>`;
        });

        htmlContent += `</div></div>
      <div style="border-top: 2px dashed #e5e7eb; padding-top: 20px; margin-top: 25px;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 15px;">✅ 최종 정산</h2>
        ${finalSettlementHtml}
      </div>
    </div>
  `;

        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container, { scale: 2, useCORS: true });

            if (navigator.canShare && navigator.share) {
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], `${settleTitle}_정산내역.jpg`, { type: 'image/jpeg' });
                    try {
                        await navigator.share({
                            files: [file],
                            title: `${settleTitle} 정산 내역`,
                            text: '정산 내역을 확인하세요!',
                        });
                    } catch (err) {
                        // 사용자가 공유를 취소한 경우(AbortError)는 오류로 간주하지 않음
                        if (err.name !== 'AbortError') {
                            console.error("공유 기능 오류:", err);
                        }
                    } finally {
                        // 공유 작업이 끝나면 (성공, 실패, 취소 모두) 버튼을 다시 활성화
                        exportBtn.innerText = originalText;
                        exportBtn.disabled = false;
                    }
                }, 'image/jpeg');
            } else {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/jpeg', 0.95);
                a.download = `${settleTitle}_정산내역.jpg`;
                a.click();
                // 다운로드 방식에서는 바로 버튼 상태를 복구
                exportBtn.innerText = originalText;
                exportBtn.disabled = false;
            }
        } catch (error) {
            console.error("이미지 생성 오류:", error);
            alert("이미지 생성 중 오류가 발생했습니다.");
            // 오류 발생 시에도 버튼 상태를 복구
            exportBtn.innerText = originalText;
            exportBtn.disabled = false;
        } finally {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        }
    }

    document.getElementById("personName").addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } });
    document.getElementById("expenseAmount").addEventListener("input", () => {
    const isManual = document.querySelector('input[name="splitType"]:checked').value === 'manual';
    if (isManual) {
    // 금액이 바뀌면 처음부터 다시 계산해야 하므로 '수정됨' 상태를 모두 제거합니다.
    document.querySelectorAll(".manual-amount").forEach(input => {
    input.removeAttribute('data-edited');
});
    recalculateManualAmounts(); // 재계산 함수 호출
} else {
    validateManualAmounts();
}
});

    //initializeApp();
    // -------------------------------
    // PWA 설치 관련 코드
    // -------------------------------
    let deferredPrompt;

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("✅ Service Worker 등록 완료"))
        .catch(err => console.error("Service Worker 등록 실패:", err));
}

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // [수정] custom-install-btn이 존재하는 경우에만 팝업을 노출합니다.
        const customInstallBtn = document.getElementById("custom-install-btn");
        const installPopupOverlay = document.getElementById("install-popup-overlay");
        if (customInstallBtn && installPopupOverlay && !localStorage.getItem("hideInstallPopup")) {
            customInstallBtn.classList.remove("hidden");
            installPopupOverlay.classList.remove("hidden");
        }
    });

    // 설치 버튼 클릭 시
    // [수정] custom-install-btn이 존재하는 경우에만 이벤트 리스너를 추가합니다.
    const customInstallBtn = document.getElementById("custom-install-btn");
    if (customInstallBtn) {
        customInstallBtn.addEventListener("click", async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
                const installPopupOverlay = document.getElementById("install-popup-overlay");
                if (installPopupOverlay) {
                    installPopupOverlay.classList.add("hidden");
                }
            }
        });
    }

    // [수정] 팝업 관련 버튼들이 존재하는 경우에만 이벤트 리스너를 추가합니다.
    const closePopupBtn = document.getElementById("close-popup-btn");
    const dismissPopupBtn = document.getElementById("dismiss-popup-btn");
    const installPopupOverlay = document.getElementById("install-popup-overlay");

    if (closePopupBtn) {
        closePopupBtn.addEventListener("click", () => {
            if (installPopupOverlay) installPopupOverlay.classList.add("hidden");
        });
    }

    if (dismissPopupBtn) {
        dismissPopupBtn.addEventListener("click", () => {
            localStorage.setItem("hideInstallPopup", "true");
            if (installPopupOverlay) installPopupOverlay.classList.add("hidden");
        });
    }
