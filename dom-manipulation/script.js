let quotes = [];

function loadQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "The best way to predict the future is to invent it.", category: "Motivation" },
      { text: "Life is what happens when you're busy making other plans.", category: "Life" },
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" }
    ];
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');
  const selectedCategory = document.getElementById('categoryFilter').value;

  const filtered = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = 'No quotes available for this category.';
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  quoteDisplay.innerHTML = `"${quote.text}" - <i>${quote.category}</i>`;
  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const quoteCategory = document.getElementById('newQuoteCategory').value.trim();

  if (quoteText && quoteCategory) {
    const newQuote = { text: quoteText, category: quoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    postQuoteToServer(newQuote);
    alert('Quote added successfully!');
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    populateCategories();
    showRandomQuote();
  } else {
    alert('Please enter both quote text and category.');
  }
}

function createAddQuoteForm() {
  const formContainer = document.getElementById('formContainer');

  const inputText = document.createElement('input');
  inputText.id = 'newQuoteText';
  inputText.type = 'text';
  inputText.placeholder = 'Enter a new quote';

  const inputCategory = document.createElement('input');
  inputCategory.id = 'newQuoteCategory';
  inputCategory.type = 'text';
  inputCategory.placeholder = 'Enter quote category';

  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.onclick = addQuote;

  formContainer.appendChild(inputText);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addButton);
}

function populateCategories() {
  const select = document.getElementById('categoryFilter');
  const oldValue = select.value;
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  const savedFilter = localStorage.getItem('selectedCategory');
  select.value = savedFilter || oldValue || 'all';
}

function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);
  showRandomQuote();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
        showRandomQuote();
      } else {
        alert('Invalid JSON format. Expected an array.');
      }
    } catch (e) {
      alert('Error parsing JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quotes.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showNotification(message) {
  const note = document.createElement('div');
  note.textContent = message;
  note.style.background = '#fffa65';
  note.style.padding = '10px';
  note.style.margin = '10px 0';
  note.style.border = '1px solid #aaa';
  document.body.prepend(note);
  setTimeout(() => note.remove(), 4000);
}

async function fetchQuotesFromServer() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  return await res.json();
}

async function postQuoteToServer(quote) {
  try {
    await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: quote.text,
        body: quote.category,
        userId: 1,
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
  } catch (e) {
    console.error('Post to server failed:', e);
  }
}

async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    if (!Array.isArray(serverQuotes)) return;

    let updated = false;

    serverQuotes.forEach(serverQuote => {
      const exists = quotes.find(q => q.text === serverQuote.title);
      if (!exists) {
        quotes.push({ text: serverQuote.title, category: \"Server\" });
        updated = true;
      }
    });

    if (updated) {
      saveQuotes();
      populateCategories();
      showNotification('Quotes synced from server.');
      showRandomQuote();
    }
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

loadQuotes();
createAddQuoteForm();
populateCategories();
showRandomQuote();

setInterval(syncQuotes, 60000); // مزامنة كل دقيقة
