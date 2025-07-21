let editIndex = null;

function saveEntry() {
    const text = document.getElementById('diaryText').value.trim();
    if (!text) return;
    const date = new Date().toLocaleString();

    let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];

    if (editIndex !== null) {
        entries[editIndex].text = text;
        editIndex = null;
    } else {
        entries.unshift({ text, date });
    }

    localStorage.setItem('diaryEntries', JSON.stringify(entries));
    document.getElementById('diaryText').value = '';
    loadEntries();
}

function loadEntries() {
    const entriesDiv = document.getElementById('entries');
    entriesDiv.innerHTML = '';
    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];

    entries.forEach((entry, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="date">${entry.date}</div>
            <p>${entry.text}</p>
            <div class="actions">
                <button onclick="editEntry(${index})">Edit</button>
                <button onclick="deleteEntry(${index})">Delete</button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.actions')) {
                showModal(entry);
            }
        });

        entriesDiv.appendChild(card);
    });
}

function deleteEntry(index) {
    let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    entries.splice(index, 1);
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
    loadEntries();
}

function editEntry(index) {
    let entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    document.getElementById('diaryText').value = entries[index].text;
    editIndex = index;
}

// Modal Functions
function showModal(entry) {
    const words = entry.text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);
    document.getElementById('modalContent').innerHTML = `
        <div class="date">${entry.date}</div>
        <p><em>Reading time: ${readingTime} min</em></p>
        <p>${entry.text}</p>
    `;
    document.getElementById('modal').style.display = 'flex';
}


function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Close modal on background click
document.getElementById('modal').addEventListener('click', function(e) {
    const modalBox = document.getElementById('modalBox');
    if (!modalBox.contains(e.target)) {
        closeModal();
    }
});

// Export entries
function exportEntries() {
    const entries = localStorage.getItem('diaryEntries') || '[]';
    const blob = new Blob([entries], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import entries
function importEntries(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedEntries = JSON.parse(e.target.result);
            localStorage.setItem('diaryEntries', JSON.stringify(importedEntries));
            loadEntries();
        } catch (err) {
            alert('Invalid file format');
        }
    };
    reader.readAsText(file);
}

window.onload = loadEntries;

let isLeaving = false;

// Trigger leave modal
window.addEventListener('beforeunload', function (e) {
    if (!isLeaving) {
        e.preventDefault();
        e.returnValue = '';
        showLeaveModal();
        return '';
    }
});

function showLeaveModal() {
    document.getElementById('leaveModal').style.display = 'flex';
}

function closeLeaveModal() {
    document.getElementById('leaveModal').style.display = 'none';
}

function forceLeave() {
    isLeaving = true;
    window.location.href = 'about:blank'; // Close by navigating away
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    if (!entries.length) {
        alert("No entries to export!");
        return;
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(14);
    doc.text("My Retro Diary", 10, 10);
    doc.setFontSize(10);
    let y = 20;

    entries.forEach((entry, i) => {
        if (y > 270) {  // Add new page when space ends
            doc.addPage();
            y = 10;
        }
        doc.setFontSize(12);
        doc.text(`${entry.date}`, 10, y);
        y += 6;
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(entry.text, 180);
        doc.text(splitText, 10, y);
        y += splitText.length * 5 + 10;
        doc.line(10, y, 200, y);
        y += 10;
    });

    doc.save("My_Diary.pdf");
}
