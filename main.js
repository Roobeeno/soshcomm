let chartInstance;
let categoryTotals = {
  FoodAndBev: 0,
  Alcohol: 0,
  Decor: 0,
  Services: 0,
  Reimbursement: 0,
  Dues: 0,
  Door: 0,
  Fine: 0,
  Other: 0
};

let sortDirections = {};

function updateHeaderArrows(activeIndex, asc) {
  const headers = document.querySelectorAll('#main_table th');
  headers.forEach((th, idx) => {
    th.textContent = th.textContent.replace(/\s[▲▼]$/, '');
    if (idx === activeIndex) {
      th.textContent += asc ? ' ▲' : ' ▼';
    }
  });
}

function sortTable(columnIndex) {
  const tbody = document.getElementById("main_table").tBodies[0];
  const rows = Array.from(tbody.rows);
  const asc = sortDirections[columnIndex] = !sortDirections[columnIndex];

  rows.sort((a, b) => {
    const aText = a.cells[columnIndex].textContent.trim();
    const bText = b.cells[columnIndex].textContent.trim();

    if (columnIndex === 2) {
      return asc
        ? parseFloat(aText) - parseFloat(bText)
        : parseFloat(bText) - parseFloat(aText);
    }
    if (columnIndex === 1) {
      const parseDate = s => {
        const [m, d, y] = s.split('/').map(Number);
        return new Date(y, m - 1, d);
      };
      const dateA = parseDate(aText);
      const dateB = parseDate(bText);
      return asc ? dateA - dateB : dateB - dateA;
    }
    return asc
      ? aText.localeCompare(bText, undefined, { sensitivity: 'base' })
      : bText.localeCompare(aText, undefined, { sensitivity: 'base' });
  });

  rows.forEach(row => tbody.appendChild(row));
  updateHeaderArrows(columnIndex, asc);
}

function addSortListeners() {
  const headers = document.querySelectorAll('#main_table th');
  headers.forEach((th, idx) => {
    if (idx < 4) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => sortTable(idx));
    }
  });
}
clearInputs();
function addRow() {
  const event = document.getElementById("events").value;
  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("transactionAmount").value);
  const category = document.getElementById("categories").value;
  const description = document.getElementById("description").value;

  if (!event || !validateDate(date) || isNaN(amount) || !category || !description) {
    alert("Please fill all fields correctly.");
    return;
  }

  const table = document.getElementById("main_table").getElementsByTagName("tbody")[0];
  const row = table.insertRow();
  row.insertCell(0).textContent = event;
  row.insertCell(1).textContent = date;
  row.insertCell(2).textContent = amount.toFixed(2);
  row.insertCell(3).textContent = category;
  row.insertCell(4).textContent = description;

  row.addEventListener('click', function () {
    deleteInfo(row.rowIndex);
  });

  if (!(category in categoryTotals)) {
    categoryTotals[category] = 0;
  }
  categoryTotals[category] += amount;
  

  updateTotal();
  updateChart();
  clearInputs();
  updateTextList();
  saveDataToLocalStorage();
}

function addEvent() {
  const newEvent = prompt("Create New Event")
  if (!newEvent) return;

  const select = document.getElementById("events");
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === newEvent) {
      alert("Event already exists.");
      return;
    }
  }
  select.options[select.options.length] = new Option(newEvent, newEvent);
  clearInputs();
  saveDataToLocalStorage()
}

function addEventsEventListener() {
  const events = document.getElementById("events")
  events.addEventListener('contextmenu', function (e) {
    e.preventDefault()
    addEvent(); 
  });
}

function updateTotal() {
  let total = Object.values(categoryTotals).reduce((acc, val) => acc + val, 0);
  document.getElementById("totalAmount").textContent = total.toFixed(2);
}

function updateChart() {
  const ctx = document.querySelector(".my-chart");
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          label: "Spending by Category",
          data: data,
          backgroundColor: ["#772D8B", "#F0F4EF", "#E6AACE", "#344966", "#0D1821", "#F7EF99", "#f1faee", "#a8dadc", "#457b9d"],
          borderWidth: 5,
          borderRadius: 5
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              boxWidth: 20,
              boxHeight: 10,
              borderRadius: 5,
              font: {
                family: "Fira Sans",
                size: 14,
                weight: "bold"
              },
              padding: 10
            }
          }
        }
      }
    });
  }
}

function deleteInfo(index) {
  const tbody = document.getElementById("main_table").tBodies[0];
  const row = tbody.rows[index - 1];
  if (!row) return;

  const amount = parseFloat(row.cells[2].textContent);
  const category = row.cells[3].textContent;
  const confirmDelete = confirm("Are you sure you want to delete this row?");
  if (!confirmDelete) return;

  if (!isNaN(amount) && category in categoryTotals) {
    categoryTotals[category] -= amount;
    if (categoryTotals[category] < 0) categoryTotals[category] = 0;
  }

  row.remove();
  updateTotal();
  updateChart();
  updateTextList();
  saveDataToLocalStorage();
}

function clearInputs() {
  document.getElementById("events").value = "";
  document.getElementById("date").value = "";
  document.getElementById("transactionAmount").value = "";
  document.getElementById("categories").value = "Food";
  document.getElementById("description").value = "";
}

function validateDate(date) {
  return /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(date);
}

function updateTextList() {
  const ul = document.querySelector(".details ul"); ul.innerHTML = "";
  for (let category in categoryTotals) {
    const li = document.createElement("li");
    li.innerHTML = `${category}: <span class='percentage'>$${categoryTotals[category].toFixed(2)}</span>`;
    ul.appendChild(li);
  }
}

function saveDataToLocalStorage() {
  const tableData = [], rows = document.getElementById("main_table").tBodies[0].rows;
  for (let row of rows) {
    tableData.push({
      events: row.cells[0].textContent,
      date: row.cells[1].textContent,
      amount: parseFloat(row.cells[2].textContent),
      category: row.cells[3].textContent,
      description: row.cells[4].textContent
    });
  }
  localStorage.setItem("budgetTable", JSON.stringify(tableData));
  localStorage.setItem("categoryTotals", JSON.stringify(categoryTotals));

  var select = document.getElementById("events");
  const eventOptions = Array.from(select.options).map(opt => ({
    text: opt.text,
    value: opt.value
  }));

  localStorage.setItem("events", JSON.stringify(eventOptions));
}

window.onload = function () {
  const savedTable = JSON.parse(localStorage.getItem("budgetTable"));
  const savedTotals = JSON.parse(localStorage.getItem("categoryTotals"));
  const savedEvents = JSON.parse(localStorage.getItem("events"));

  if (savedEvents) {
    const select = document.getElementById("events");
    savedEvents.forEach(optionData => {
      if (optionData && optionData.text && optionData.value) {
        select.options[select.options.length] = new Option(optionData.text, optionData.value);
      }
    });
  }

  addEventsEventListener();

  if (savedTotals) categoryTotals = savedTotals;
  if (savedTable) {
    const tbody = document.getElementById("main_table").tBodies[0];
    savedTable.forEach(item => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = item.events;
      row.insertCell(1).textContent = item.date;
      row.insertCell(2).textContent = item.amount.toFixed(2);
      row.insertCell(3).textContent = item.category;
      row.insertCell(4).textContent = item.description;
      row.addEventListener("click", () => deleteInfo(row.rowIndex));
    });
  }
};

function validatePassword() {
  const password = document.getElementById('password').value;
  const correctPassword = "thomasculhane";

  if (password === correctPassword) {
    document.getElementById('content').style.display = 'block';
    document.getElementById('passwordForm').style.display = 'none';
  } else {
    alert('Incorrect password');
  }
  updateChart();
  updateTotal();
  updateTextList();
  addSortListeners();

  if (chartInstance) {
    chartInstance.resize();
  }
};

document.getElementById("clearDataBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all saved data?")) {
    localStorage.clear();  // ✅ ensures all localStorage is cleared

    // Reset category totals in memory
    categoryTotals = {
      FoodAndBev: 0,
      Alcohol: 0,
      Decor: 0,
      Services: 0,
      Reimbursement: 0,
      Dues: 0,
      Door: 0,
      Fine: 0,
      Other: 0
    };

    // Clear the chart/table/UI
    document.getElementById("main_table").tBodies[0].innerHTML = "";
    updateChart();
    updateTotal();
    updateTextList();

    // Save fresh state
    saveDataToLocalStorage();

    function removeOptions(selectElement) {
      var i, L = selectElement.options.length - 1;
      for(i = L; i >= 0; i--) {
         selectElement.remove(i);
      }
   }
  }
  removeOptions(document.getElementById('events'));
});





