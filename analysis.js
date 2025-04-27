let globalData = null;
let currentChart = null;

// Fetch and process the data
async function fetchData() {
    try {
        console.log("Fetching data from CSV...");
        const response = await fetch('https://raw.githubusercontent.com/2000030787Manogyna/Scientific-data-projectt/refs/heads/main/StudentPerformanceFactors%20(2).csv');
        const data = await response.text();
        console.log("Data fetched successfully, processing...");
        const processedData = processData(data);
        console.log("Data processed:", processedData.length, "records");
        return processedData;
    } catch (error) {
        console.error('Error fetching data:', error);
        console.log("Using fallback sample data");
        return getSampleData();
    }
}

function processData(csvData) {
    console.log("Processing CSV data...");
    const lines = csvData.split('\n');
    console.log("CSV has", lines.length, "lines");
    
    if (lines.length < 2) {
        console.error("CSV file is empty or has only headers");
        return [];
    }
    
    const headers = lines[0].split(',');
    console.log("CSV headers:", headers);
    
    const data = [];
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',');
        if (values.length !== headers.length) {
            console.warn(`Line ${i+1} has ${values.length} values but expected ${headers.length}`);
            errorCount++;
            continue;
        }
        
        const entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim();
        });
        data.push(entry);
    }
    
    console.log(`Processed ${data.length} records with ${errorCount} errors`);
    
    // Validate required fields
    const requiredFields = ['Attendance', 'Teacher_Quality', 'Parental_Involvement', 'School_Type', 'Hours_Studied', 'Sleep_Hours', 'Extracurricular_Activities', 'Exam_Score'];
    const missingFields = requiredFields.filter(field => !data[0] || !(field in data[0]));
    
    if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
    } else {
        console.log("All required fields are present");
    }
    
    return data;
}

// Sample data for fallback
function getSampleData() {
    console.log("Generating sample data");
    const sampleData = [];
    const schoolTypes = ['Public', 'Private', 'Charter'];
    const qualityLevels = ['Low', 'Medium', 'High'];
    const involvementLevels = ['Low', 'Medium', 'High'];
    const extracurricularOptions = ['Yes', 'No'];
    
    // Generate 100 sample records
    for (let i = 0; i < 100; i++) {
        const schoolType = schoolTypes[Math.floor(Math.random() * schoolTypes.length)];
        const teacherQuality = qualityLevels[Math.floor(Math.random() * qualityLevels.length)];
        const parentalInvolvement = involvementLevels[Math.floor(Math.random() * involvementLevels.length)];
        const hoursStudied = Math.floor(Math.random() * 30) + 1;
        const sleepHours = Math.floor(Math.random() * 7) + 4;
        const extracurricular = extracurricularOptions[Math.floor(Math.random() * extracurricularOptions.length)];
        
        // Calculate attendance based on other factors
        let attendance = 70 + Math.floor(Math.random() * 30);
        if (parentalInvolvement === 'Low') attendance -= 10;
        if (teacherQuality === 'Low') attendance -= 5;
        
        // Calculate exam score based on other factors
        let examScore = 60 + Math.floor(Math.random() * 40);
        if (parentalInvolvement === 'High') examScore += 10;
        if (teacherQuality === 'High') examScore += 10;
        if (hoursStudied > 20) examScore += 5;
        if (sleepHours >= 7 && sleepHours <= 9) examScore += 5;
        if (extracurricular === 'Yes') examScore += 5;
        
        // Ensure score is within 0-100 range
        examScore = Math.min(100, Math.max(0, examScore));
        
        sampleData.push({
            'Attendance': attendance.toString(),
            'Teacher_Quality': teacherQuality,
            'Parental_Involvement': parentalInvolvement,
            'School_Type': schoolType,
            'Hours_Studied': hoursStudied.toString(),
            'Sleep_Hours': sleepHours.toString(),
            'Extracurricular_Activities': extracurricular,
            'Exam_Score': examScore.toString()
        });
    }
    
    console.log("Generated", sampleData.length, "sample records");
    return sampleData;
}

// Show analysis based on selection
async function showAnalysis(type) {
    if (!globalData) {
        globalData = await fetchData();
    }

    // Update active state in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update title
    document.getElementById('analysisTitle').textContent = getAnalysisTitle(type);

    // Create chart
    createAnalysisChart(type);

    // Update statistics
    updateStatistics(type);
    
    // Add animation to the chart container
    const chartContainer = document.getElementById('analysisChart').parentElement;
    chartContainer.classList.add('chart-animation');
    setTimeout(() => {
        chartContainer.classList.remove('chart-animation');
    }, 1000);
}

function getAnalysisTitle(type) {
    const titles = {
        attendance: 'Student Attendance Analysis',
        teacherQuality: 'Teacher Quality Analysis',
        parentalInvolvement: 'Parental Involvement Analysis',
        schoolType: 'School Type Analysis',
        hoursStudied: 'Hours Studied Analysis',
        sleepHours: 'Sleep Hours Analysis',
        extracurricular: 'Extracurricular Activities Analysis',
        stackedComparison: 'School Type Comparison',
        sideBySideComparison: 'Parental vs Teacher Impact'
    };
    return titles[type] || 'Analysis';
}

function getChartTitle(type) {
    const titles = {
        attendance: 'Student Attendance Distribution',
        teacherQuality: 'Teacher Quality Distribution',
        parentalInvolvement: 'Parental Involvement Impact',
        schoolType: 'School Type Performance',
        hoursStudied: 'Hours Studied Distribution',
        sleepHours: 'Sleep Hours Impact',
        extracurricular: 'Extracurricular Activities Impact',
        stackedComparison: 'School Type Comparison',
        sideBySideComparison: 'Parental vs Teacher Impact'
    };
    return titles[type] || 'Chart';
}

function createAnalysisChart(type) {
    console.log("Creating chart for:", type);
    const ctx = document.getElementById('analysisChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (currentChart) {
        console.log("Destroying existing chart");
        currentChart.destroy();
    }

    const chartConfig = getChartConfig(type, calculateAttendanceDistribution());
    console.log("Chart config:", chartConfig);
    
    try {
        currentChart = new Chart(ctx, chartConfig);
        console.log("Chart created successfully");
    } catch (error) {
        console.error("Error creating chart:", error);
    }
}

function getChartConfig(type, data) {
    console.log("Creating chart config for type:", type);
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false
            }
        }
    };

    switch(type) {
        case 'attendance':
            return {
                type: 'bar',
                data: {
                    labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
                    datasets: [{
                        label: 'Number of Students',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Students'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Attendance Percentage'
                            }
                        }
                    }
                }
            };
            
        case 'teacherQuality':
            return {
                type: 'pie',
                data: {
                    labels: ['Low', 'Medium', 'High'],
                    datasets: [{
                        data: calculateTeacherQualityDistribution(),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(255, 205, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
            
        case 'parentalInvolvement':
            return {
                type: 'doughnut',
                data: {
                    labels: ['Low', 'Medium', 'High'],
                    datasets: [{
                        data: calculateParentalInvolvementImpact(),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(255, 205, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
            
        case 'schoolType':
            return {
                type: 'bar',
                data: {
                    labels: ['Public', 'Private', 'Charter'],
                    datasets: [{
                        label: 'Average Exam Score',
                        data: calculateSchoolTypePerformance(),
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Average Exam Score'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'School Type'
                            }
                        }
                    }
                }
            };
            
        case 'hoursStudied':
            return {
                type: 'line',
                data: {
                    labels: ['0-2', '3-5', '6-8', '9-11', '12+'],
                    datasets: [{
                        label: 'Number of Students',
                        data: calculateHoursStudiedDistribution(),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Students'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Hours Studied per Week'
                            }
                        }
                    }
                }
            };
            
        case 'sleepHours':
            return {
                type: 'radar',
                data: {
                    labels: ['< 6 hours', '6-7 hours', '7-8 hours', '8-9 hours', '> 9 hours'],
                    datasets: [{
                        label: 'Average Exam Score',
                        data: calculateSleepHoursImpact(),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(153, 102, 255, 1)'
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    }
                }
            };
            
        case 'extracurricular':
            return {
                type: 'polarArea',
                data: {
                    labels: ['None', 'Sports', 'Arts', 'Academic Clubs', 'Multiple Activities'],
                    datasets: [{
                        data: calculateExtracurricularImpact(),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
            
        case 'stackedComparison':
            return {
                type: 'bar',
                data: {
                    labels: ['Public', 'Private', 'Charter'],
                    datasets: [
                        {
                            label: 'Hours Studied',
                            data: calculateSchoolTypeHoursStudied(),
                            backgroundColor: 'rgba(75, 192, 192, 0.7)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Attendance',
                            data: calculateSchoolTypeAttendance(),
                            backgroundColor: 'rgba(153, 102, 255, 0.7)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Exam Score',
                            data: calculateSchoolTypePerformance(),
                            backgroundColor: 'rgba(255, 159, 64, 0.7)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'School Type'
                            }
                        },
                        y: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Score (0-100)'
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            };
            
        case 'sideBySideComparison':
            return {
                type: 'bar',
                data: {
                    labels: ['Low', 'Medium', 'High'],
                    datasets: [
                        {
                            label: 'Parental Involvement Impact',
                            data: calculateParentalInvolvementImpact(),
                            backgroundColor: 'rgba(75, 192, 192, 0.7)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Teacher Quality Impact',
                            data: calculateTeacherQualityImpact(),
                            backgroundColor: 'rgba(153, 102, 255, 0.7)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Average Exam Score'
                            },
                            min: 0,
                            max: 100
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Level'
                            }
                        }
                    }
                }
            };
            
        default:
            return {
                type: 'bar',
                data: {
                    labels: ['No Data Available'],
                    datasets: [{
                        label: 'No Data',
                        data: [0],
                        backgroundColor: 'rgba(201, 203, 207, 0.7)',
                        borderColor: 'rgba(201, 203, 207, 1)',
                        borderWidth: 1
                    }]
                },
                options: commonOptions
            };
    }
}

function showInteractiveDashboardForSchoolType(schoolType) {
    const filteredData = globalData.filter(student => student.school_type === schoolType);
    updateInteractiveDashboard(filteredData, `School Type: ${schoolType}`);
}

function showInteractiveDashboardForLevel(level) {
    const filteredData = globalData.filter(student => 
        student.parental_involvement === level || student.teacher_quality === level
    );
    updateInteractiveDashboard(filteredData, `Level: ${level}`);
}

function updateInteractiveDashboard(filteredData, filterLabel) {
    const chartContainer = document.getElementById('chartContainer');
    const statsContainer = document.getElementById('statsContainer');
    
    // Clear previous content
    chartContainer.innerHTML = '';
    statsContainer.innerHTML = '';
    
    // Create canvas for new chart
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    // Create scatter plot with filtered data
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `Hours Studied vs Exam Score (${filterLabel})`,
                data: filteredData.map(student => ({
                    x: student.hours_studied,
                    y: student.exam_score,
                    student: student
                })),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Interactive Dashboard - ${filterLabel}`
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const dataPoint = elements[0].element.$context.raw;
                    highlightDataPoint(dataPoint);
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hours Studied'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Exam Score'
                    }
                }
            }
        }
    });
    
    // Update statistics
    updateStatisticsForFilteredData(filteredData, filterLabel);
}

function updateStatisticsForFilteredData(filteredData, filterLabel) {
    const statsContainer = document.getElementById('statsContainer');
    
    const avgHours = filteredData.reduce((sum, student) => sum + student.hours_studied, 0) / filteredData.length;
    const avgScore = filteredData.reduce((sum, student) => sum + student.exam_score, 0) / filteredData.length;
    const avgAttendance = filteredData.reduce((sum, student) => sum + student.attendance, 0) / filteredData.length;
    
    statsContainer.innerHTML = `
        <div class="highlight-box">
            <h4>Statistics for ${filterLabel}</h4>
            <p>Number of Students: ${filteredData.length}</p>
            <p>Average Hours Studied: ${avgHours.toFixed(2)}</p>
            <p>Average Exam Score: ${avgScore.toFixed(2)}</p>
            <p>Average Attendance: ${avgAttendance.toFixed(2)}%</p>
            <h4>Distribution</h4>
            <p>Parental Involvement: ${getDistribution(filteredData, 'parental_involvement')}</p>
            <p>Teacher Quality: ${getDistribution(filteredData, 'teacher_quality')}</p>
            <p>School Type: ${getDistribution(filteredData, 'school_type')}</p>
        </div>
    `;
}

function getDistribution(data, field) {
    const distribution = {};
    data.forEach(student => {
        distribution[student[field]] = (distribution[student[field]] || 0) + 1;
    });
    return Object.entries(distribution)
        .map(([key, value]) => `${key}: ${value} students`)
        .join(', ');
}

function calculateAttendanceDistribution() {
    const ranges = [0, 0, 0, 0, 0];
    globalData.forEach(student => {
        const attendance = parseInt(student['Attendance']);
        const rangeIndex = Math.floor(attendance / 20);
        ranges[rangeIndex]++;
    });
    return ranges;
}

function calculateTeacherQualityDistribution() {
    const distribution = {
        Low: 0,
        Medium: 0,
        High: 0
    };
    globalData.forEach(student => {
        distribution[student['Teacher_Quality']]++;
    });
    return Object.values(distribution);
}

function calculateParentalInvolvementImpact() {
    const levels = ['Low', 'Medium', 'High'];
    return levels.map(level => {
        const scores = globalData
            .filter(d => d['Parental_Involvement'] === level)
            .map(d => parseInt(d['Exam_Score']));
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
}

function calculateSchoolTypePerformance() {
    const types = ['Public', 'Private'];
    return types.map(type => {
        const scores = globalData
            .filter(d => d['School_Type'] === type)
            .map(d => parseInt(d['Exam_Score']));
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
}

function calculateHoursStudiedDistribution() {
    const ranges = [0, 0, 0, 0, 0, 0, 0];
    globalData.forEach(student => {
        const hours = parseInt(student['Hours_Studied']);
        let rangeIndex;
        if (hours <= 5) rangeIndex = 0;
        else if (hours <= 10) rangeIndex = 1;
        else if (hours <= 15) rangeIndex = 2;
        else if (hours <= 20) rangeIndex = 3;
        else if (hours <= 25) rangeIndex = 4;
        else if (hours <= 30) rangeIndex = 5;
        else rangeIndex = 6;
        ranges[rangeIndex]++;
    });
    return ranges;
}

function calculateSleepHoursImpact() {
    const hours = [4, 5, 6, 7, 8, 9, 10];
    return hours.map(hour => {
        const scores = globalData
            .filter(d => parseInt(d['Sleep_Hours']) === hour)
            .map(d => parseInt(d['Exam_Score']));
        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });
}

function calculateExtracurricularImpact() {
    const activities = ['Yes', 'No'];
    return activities.map(activity => {
        const scores = globalData
            .filter(d => d['Extracurricular_Activities'] === activity)
            .map(d => parseInt(d['Exam_Score']));
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
}

function updateStatistics(type) {
    const statsContent = document.getElementById('statisticsContent');
    let stats = '';

    switch(type) {
        case 'attendance':
            const avgAttendance = globalData.reduce((sum, student) => 
                sum + parseInt(student['Attendance']), 0) / globalData.length;
            const attendanceDistribution = calculateAttendanceDistribution();
            stats = `
                <p><strong>Average Attendance:</strong> ${avgAttendance.toFixed(2)}%</p>
                <p><strong>Total Students:</strong> ${globalData.length}</p>
                <p><strong>Attendance Distribution:</strong></p>
                <ul>
                    <li>High Attendance (81-100%): ${attendanceDistribution[4]} students</li>
                    <li>Good Attendance (61-80%): ${attendanceDistribution[3]} students</li>
                    <li>Moderate Attendance (41-60%): ${attendanceDistribution[2]} students</li>
                    <li>Poor Attendance (21-40%): ${attendanceDistribution[1]} students</li>
                    <li>Very Poor Attendance (0-20%): ${attendanceDistribution[0]} students</li>
                </ul>
                <p><strong>Correlation with Exam Scores:</strong></p>
                <p>Students with higher attendance tend to perform better in exams. The average exam score increases as attendance percentage increases.</p>
            `;
            break;
        case 'teacherQuality':
            const qualityDistribution = calculateTeacherQualityDistribution();
            const qualityImpact = calculateTeacherQualityImpact();
            stats = `
                <p><strong>Teacher Quality Distribution:</strong></p>
                <ul>
                    <li>High Quality Teachers: ${qualityDistribution[2]} classes</li>
                    <li>Medium Quality Teachers: ${qualityDistribution[1]} classes</li>
                    <li>Low Quality Teachers: ${qualityDistribution[0]} classes</li>
                </ul>
                <p><strong>Impact on Student Performance:</strong></p>
                <ul>
                    <li>High Quality Teachers: Average score ${qualityImpact[2].toFixed(2)}</li>
                    <li>Medium Quality Teachers: Average score ${qualityImpact[1].toFixed(2)}</li>
                    <li>Low Quality Teachers: Average score ${qualityImpact[0].toFixed(2)}</li>
                </ul>
                <p><strong>Key Finding:</strong> Students taught by high-quality teachers perform significantly better in exams.</p>
            `;
            break;
        case 'parentalInvolvement':
            const involvementLevels = ['Low', 'Medium', 'High'];
            const involvementImpact = calculateParentalInvolvementImpact();
            stats = `
                <p><strong>Parental Involvement Impact:</strong></p>
                <ul>
                    ${involvementLevels.map((level, i) => 
                        `<li>${level} Involvement: Average score ${involvementImpact[i].toFixed(2)}</li>`
                    ).join('')}
                </ul>
                <p><strong>Key Finding:</strong> Higher parental involvement is strongly correlated with better exam performance.</p>
                <p><strong>Recommendation:</strong> Schools should encourage greater parental engagement in their children's education.</p>
            `;
            break;
        case 'schoolType':
            const schoolTypes = ['Public', 'Private'];
            const schoolTypePerformance = calculateSchoolTypePerformance();
            stats = `
                <p><strong>School Type Performance:</strong></p>
                <ul>
                    ${schoolTypes.map((type, i) => 
                        `<li>${type} Schools: Average score ${schoolTypePerformance[i].toFixed(2)}</li>`
                    ).join('')}
                </ul>
                <p><strong>Key Finding:</strong> ${schoolTypePerformance[1] > schoolTypePerformance[0] ? 
                    'Private school students perform better on average.' : 
                    'Public school students perform better on average.'}</p>
                <p><strong>Note:</strong> This difference may be influenced by various factors including socioeconomic status and resource availability.</p>
            `;
            break;
        case 'hoursStudied':
            const hoursRanges = ['0-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+'];
            const hoursDistribution = calculateHoursStudiedDistribution();
            const avgHours = globalData.reduce((sum, student) => 
                sum + parseInt(student['Hours_Studied']), 0) / globalData.length;
            stats = `
                <p><strong>Hours Studied Distribution:</strong></p>
                <ul>
                    ${hoursRanges.map((range, i) => 
                        `<li>${range} hours: ${hoursDistribution[i]} students</li>`
                    ).join('')}
                </ul>
                <p><strong>Average Hours Studied:</strong> ${avgHours.toFixed(2)} hours</p>
                <p><strong>Key Finding:</strong> There is a positive correlation between study hours and exam performance.</p>
                <p><strong>Recommendation:</strong> Students should be encouraged to maintain a consistent study schedule.</p>
            `;
            break;
        case 'sleepHours':
            const sleepHours = [4, 5, 6, 7, 8, 9, 10];
            const sleepImpact = calculateSleepHoursImpact();
            const avgSleep = globalData.reduce((sum, student) => 
                sum + parseInt(student['Sleep_Hours']), 0) / globalData.length;
            stats = `
                <p><strong>Sleep Hours Impact:</strong></p>
                <ul>
                    ${sleepHours.map((hour, i) => 
                        `<li>${hour} hours: Average score ${sleepImpact[i].toFixed(2)}</li>`
                    ).join('')}
                </ul>
                <p><strong>Average Sleep Hours:</strong> ${avgSleep.toFixed(2)} hours</p>
                <p><strong>Key Finding:</strong> Students who get 7-8 hours of sleep tend to perform better in exams.</p>
                <p><strong>Recommendation:</strong> Schools should educate students about the importance of adequate sleep for academic performance.</p>
            `;
            break;
        case 'extracurricular':
            const activities = ['Yes', 'No'];
            const extracurricularImpact = calculateExtracurricularImpact();
            const extracurricularCount = {
                Yes: globalData.filter(d => d['Extracurricular_Activities'] === 'Yes').length,
                No: globalData.filter(d => d['Extracurricular_Activities'] === 'No').length
            };
            stats = `
                <p><strong>Extracurricular Activities Impact:</strong></p>
                <ul>
                    ${activities.map((activity, i) => 
                        `<li>${activity}: Average score ${extracurricularImpact[i].toFixed(2)} (${extracurricularCount[activity]} students)</li>`
                    ).join('')}
                </ul>
                <p><strong>Key Finding:</strong> ${extracurricularImpact[0] > extracurricularImpact[1] ? 
                    'Students who participate in extracurricular activities tend to perform better in exams.' : 
                    'Students who do not participate in extracurricular activities tend to perform better in exams.'}</p>
                <p><strong>Note:</strong> This relationship may be influenced by time management skills and other factors.</p>
            `;
            break;
        case 'stackedComparison':
            stats = `
                <p><strong>School Type Performance:</strong></p>
                <p>This chart compares the average exam scores of students in different school types.</p>
            `;
            break;
        case 'sideBySideComparison':
            stats = `
                <p><strong>Teacher Quality vs Parental Involvement:</strong></p>
                <p>This chart compares the average exam scores of students based on their teacher quality and parental involvement.</p>
            `;
            break;
        case 'interactiveDashboard':
            stats = `
                <p><strong>Hours Studied vs Exam Score:</strong></p>
                <p>This chart shows the relationship between hours studied and exam score.</p>
            `;
            break;
        default:
            stats = 'Select an analysis option to view detailed statistics.';
    }

    // Add animation to the statistics content
    statsContent.classList.add('stats-animation');
    setTimeout(() => {
        statsContent.classList.remove('stats-animation');
    }, 1000);
    
    statsContent.innerHTML = stats;
}

function calculateTeacherQualityImpact() {
    const levels = ['Low', 'Medium', 'High'];
    return levels.map(level => {
        const scores = globalData
            .filter(d => d['Teacher_Quality'] === level)
            .map(d => parseInt(d['Exam_Score']));
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
}

// Highlight functions for interactive charts
function highlightAttendanceRange(range) {
    const statsContent = document.getElementById('statisticsContent');
    const rangeText = range === '0-20%' ? 'Very Poor' : 
                     range === '21-40%' ? 'Poor' : 
                     range === '41-60%' ? 'Moderate' : 
                     range === '61-80%' ? 'Good' : 'High';
    
    const rangeIndex = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'].indexOf(range);
    const attendanceDistribution = calculateAttendanceDistribution();
    const studentCount = attendanceDistribution[rangeIndex];
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${rangeText} Attendance (${range})</h4>
        <p>There are ${studentCount} students in this attendance range.</p>
        <p>Students with ${rangeText.toLowerCase()} attendance tend to ${rangeIndex < 2 ? 'perform poorly' : rangeIndex < 4 ? 'perform moderately' : 'perform well'} in exams.</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightTeacherQuality(level) {
    const statsContent = document.getElementById('statisticsContent');
    const qualityImpact = calculateTeacherQualityImpact();
    const levelIndex = ['Low', 'Medium', 'High'].indexOf(level);
    const avgScore = qualityImpact[levelIndex].toFixed(2);
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${level} Quality Teachers</h4>
        <p>Students taught by ${level.toLowerCase()} quality teachers have an average exam score of ${avgScore}.</p>
        <p>${level === 'High' ? 'High quality teachers have the most positive impact on student performance.' : 
           level === 'Medium' ? 'Medium quality teachers provide moderate academic support.' : 
           'Low quality teachers may need additional training to improve student outcomes.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightParentalInvolvement(level) {
    const statsContent = document.getElementById('statisticsContent');
    const involvementImpact = calculateParentalInvolvementImpact();
    const levelIndex = ['Low', 'Medium', 'High'].indexOf(level);
    const avgScore = involvementImpact[levelIndex].toFixed(2);
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${level} Parental Involvement</h4>
        <p>Students with ${level.toLowerCase()} parental involvement have an average exam score of ${avgScore}.</p>
        <p>${level === 'High' ? 'High parental involvement significantly improves student performance.' : 
           level === 'Medium' ? 'Medium parental involvement provides moderate academic support.' : 
           'Low parental involvement may lead to lower academic achievement.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightSchoolType(type) {
    const statsContent = document.getElementById('statisticsContent');
    const schoolTypePerformance = calculateSchoolTypePerformance();
    const typeIndex = ['Public', 'Private'].indexOf(type);
    const avgScore = schoolTypePerformance[typeIndex].toFixed(2);
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${type} Schools</h4>
        <p>Students in ${type.toLowerCase()} schools have an average exam score of ${avgScore}.</p>
        <p>${type === 'Private' ? 'Private schools may offer advantages such as smaller class sizes and more resources.' : 
           'Public schools provide education to a broader demographic of students.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightHoursStudied(range) {
    const statsContent = document.getElementById('statisticsContent');
    const hoursRanges = ['0-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31+'];
    const rangeIndex = hoursRanges.indexOf(range);
    const hoursDistribution = calculateHoursStudiedDistribution();
    const studentCount = hoursDistribution[rangeIndex];
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${range} Hours Studied</h4>
        <p>There are ${studentCount} students who study ${range} hours.</p>
        <p>${rangeIndex < 2 ? 'Students who study fewer hours may need additional support to improve their performance.' : 
           rangeIndex < 4 ? 'Students with moderate study hours show average performance.' : 
           'Students who study more hours tend to perform better in exams.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightSleepHours(hours) {
    const statsContent = document.getElementById('statisticsContent');
    const sleepImpact = calculateSleepHoursImpact();
    const hoursIndex = ['4-5', '6', '7', '8', '9', '10'].indexOf(hours);
    const avgScore = sleepImpact[hoursIndex].toFixed(2);
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${hours} Hours of Sleep</h4>
        <p>Students who sleep ${hours} hours have an average exam score of ${avgScore}.</p>
        <p>${hoursIndex < 2 ? 'Students who sleep fewer hours may experience fatigue and reduced cognitive function.' : 
           hoursIndex < 4 ? 'Students with moderate sleep hours show average performance.' : 
           'Students who get adequate sleep tend to perform better in exams.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

function highlightExtracurricular(activity) {
    const statsContent = document.getElementById('statisticsContent');
    const extracurricularImpact = calculateExtracurricularImpact();
    const activityIndex = ['Yes', 'No'].indexOf(activity);
    const avgScore = extracurricularImpact[activityIndex].toFixed(2);
    const extracurricularCount = {
        Yes: globalData.filter(d => d['Extracurricular_Activities'] === 'Yes').length,
        No: globalData.filter(d => d['Extracurricular_Activities'] === 'No').length
    };
    
    // Add a highlight effect to the statistics
    const highlightText = `<div class="highlight-box">
        <h4>${activity} to Extracurricular Activities</h4>
        <p>Students who ${activity === 'Yes' ? 'participate in' : 'do not participate in'} extracurricular activities have an average exam score of ${avgScore}.</p>
        <p>There are ${extracurricularCount[activity]} students who ${activity === 'Yes' ? 'participate in' : 'do not participate in'} extracurricular activities.</p>
        <p>${activity === 'Yes' ? 'Participation in extracurricular activities may develop time management skills and reduce stress.' : 
           'Students who do not participate in extracurricular activities may have more time for studying.'}</p>
    </div>`;
    
    statsContent.innerHTML = highlightText + statsContent.innerHTML;
    
    // Add animation
    const highlightBox = document.querySelector('.highlight-box');
    highlightBox.classList.add('highlight-animation');
}

// New calculation functions for the additional charts
function calculateSchoolTypeHoursStudied() {
    const types = ['Public', 'Private', 'Charter'];
    return types.map(type => {
        const students = globalData.filter(d => d['School_Type'] === type);
        return students.reduce((sum, student) => sum + parseInt(student['Hours_Studied']), 0) / students.length;
    });
}

function calculateSchoolTypeAttendance() {
    const types = ['Public', 'Private', 'Charter'];
    return types.map(type => {
        const students = globalData.filter(d => d['School_Type'] === type);
        return students.reduce((sum, student) => sum + parseInt(student['Attendance']), 0) / students.length;
    });
}

function calculateHoursVsScoreData() {
    return globalData.map(student => ({
        x: student.hours_studied,
        y: student.exam_score,
        student: student
    }));
}

function highlightDataPoint(dataPoint) {
    const statsContainer = document.getElementById('statsContainer');
    const similarStudents = globalData.filter(student => 
        Math.abs(student.hours_studied - dataPoint.x) <= 1 &&
        Math.abs(student.exam_score - dataPoint.y) <= 5
    );
    
    const avgAttendance = similarStudents.reduce((sum, student) => sum + student.attendance, 0) / similarStudents.length;
    const mostCommonParental = getMostCommonValue(similarStudents.map(student => student.parental_involvement));
    const mostCommonSchoolType = getMostCommonValue(similarStudents.map(student => student.school_type));
    
    statsContainer.innerHTML = `
        <div class="highlight-box">
            <h4>Student Profile</h4>
            <p>Hours Studied: ${dataPoint.x}</p>
            <p>Exam Score: ${dataPoint.y}</p>
            <h4>Similar Students Statistics</h4>
            <p>Average Attendance: ${avgAttendance.toFixed(2)}%</p>
            <p>Most Common Parental Involvement: ${mostCommonParental}</p>
            <p>Most Common School Type: ${mostCommonSchoolType}</p>
        </div>
    `;
}

function getMostCommonValue(array) {
    return array.sort((a,b) =>
        array.filter(v => v === a).length - array.filter(v => v === b).length
    ).pop();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded, initializing page...");
    try {
        // Fetch and process data
        globalData = await fetchData();
        console.log("Data loaded successfully:", globalData.length, "records");
        
        if (!globalData || globalData.length === 0) {
            console.error("No data available for charts");
            document.getElementById('chartContainer').innerHTML = '<div class="alert alert-danger">No data available for analysis. Please check the data source.</div>';
            return;
        }

        // Show initial analysis
        console.log("Showing initial analysis (attendance)...");
        showAnalysis('attendance');
        
        // Add click handlers for chart elements
        document.getElementById('chartContainer').addEventListener('click', (event) => {
            const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
            if (elements.length > 0) {
                const firstElement = elements[0];
                const datasetIndex = firstElement.datasetIndex;
                const index = firstElement.index;
                const value = chart.data.datasets[datasetIndex].data[index];
                const label = chart.data.labels[index];
                
                console.log("Chart element clicked:", { label, value });
                showStudentProfile(label, value);
            }
        });
        
        console.log("Page initialization complete");
    } catch (error) {
        console.error("Error initializing page:", error);
        document.getElementById('chartContainer').innerHTML = '<div class="alert alert-danger">Error loading analysis. Please try refreshing the page.</div>';
    }
}); 