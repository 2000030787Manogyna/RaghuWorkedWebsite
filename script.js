let globalData = null;
let dataTable = null;

// Fetch and process the data
async function fetchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/2000030787Manogyna/Scientific-data-projectt/refs/heads/main/StudentPerformanceFactors%20(2).csv');
        const data = await response.text();
        return processData(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function processData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const values = lines[i].split(',');
        const entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim();
        });
        data.push(entry);
    }

    return data;
}

// Populate the data table
function populateDataTable(data) {
    const tableBody = document.querySelector('#studentDataTable tbody');
    tableBody.innerHTML = '';

    data.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student['Hours_Studied']}</td>
            <td>${student['Attendance']}</td>
            <td>${student['Parental_Involvement']}</td>
            <td>${student['Teacher_Quality']}</td>
            <td>${student['School_Type']}</td>
            <td>${student['Exam_Score']}</td>
        `;
        tableBody.appendChild(row);
    });

    // Initialize DataTable if not already initialized
    if (!dataTable) {
        dataTable = $('#studentDataTable').DataTable({
            pageLength: 25,
            order: [[5, 'desc']], // Sort by exam score by default
            responsive: true,
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            initComplete: function() {
                // Add filter dropdowns for each column
                this.api().columns().every(function() {
                    const column = this;
                    const title = $(column.header()).text();
                    
                    // Create a select element for filtering
                    const select = $('<select class="form-select form-select-sm filter-select"><option value="">All</option></select>')
                        .appendTo($(column.header()))
                        .on('change', function() {
                            const val = $.fn.dataTable.util.escapeRegex($(this).val());
                            column
                                .search(val ? '^' + val + '$' : '', true, false)
                                .draw();
                        });
                    
                    // Add options to the select based on unique values in the column
                    column.data().unique().sort().each(function(d) {
                        if (d) {
                            select.append('<option value="' + d + '">' + d + '</option>');
                        }
                    });
                });
            }
        });
    } else {
        dataTable.clear().rows.add(data).draw();
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    globalData = await fetchData();
    if (globalData) {
        populateDataTable(globalData);
    }
}); 