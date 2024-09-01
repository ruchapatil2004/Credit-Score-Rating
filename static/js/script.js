document.addEventListener('DOMContentLoaded', () => {
    // Login page functionality
    const loginForm = document.getElementById('loginForm');
    const signupLink = document.getElementById('signupLink');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Here you would typically send a request to your server to authenticate the user
            console.log('Login attempt:', email, password);

            // For demo purposes, we'll just redirect to the dashboard
            window.location.href = 'dashboard.html';
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Sign up functionality would be implemented here.');
        });
    }

    // Dashboard functionality
    const signOutBtn = document.getElementById('signOutBtn');

    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Here you would typically clear the user's session
            window.location.href = 'index.html';
        });
    }

    //highlighting tabs :

    // Add this script at the end of your HTML file or in a separate JS file
    document.addEventListener('DOMContentLoaded', function () {
        const links = document.querySelectorAll('nav ul li a');

        links.forEach(link => {
            link.addEventListener('click', function () {
                links.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
            });
        });
    });


    // Render credit score chart
    const scoreChart = document.getElementById('scoreChart');
    var score = document.getElementById('score').innerHTML;

    if (score > 750 && score <= 900) {
        grade = "Excellent";
        clr = "#048b59";
        des = "You're excellent scores helps creditor to provide more benefits to your financial requirement.";
    }
    if (score > 650 && score <= 749) {
        grade = "Good";
        clr = "#f9c200";
        des = "you're good credit score reflects your financial health.";

    }
    if (score > 500 && score <= 649) {
        grade = "Average";
        clr = "#ff7300";
        des = "Sorry, to see you're average score but I could help to make it better.";
    }
    if (score > 300 && score <= 499) {
        grade = "Poor";
        clr = "#f93930";
        des = "Sorry, to see you're poor score but I could help you to make it better.";
    }
    document.getElementById('grade').innerHTML = grade;
    document.getElementById('des').innerHTML = des;
    alert
    if (scoreChart) {

        new Chart(scoreChart, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, 900 - score],
                    backgroundColor: [clr, '#f0f0f0'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }

    // if (risk > 0 && risk <= 1) {
    //     des = "Very low risk of default. High credit quality.";
    //     rgrade = "Excellent (AAA)";
    //     clr = "#00FF00";
    // }
    // if (risk > 1 && risk <= 3) {
    //     des = "Low risk of default. High credit quality but slightly lower than AAA.";
    //     rgrade = "Very Good (AA)";
    //     clr = "#66FF66";
    // }
    // if (risk > 3 && risk <= 5) {
    //     des = "Moderate risk of default. Good credit quality but with some vulnerabilities.";
    //     rgrade = "Good (A)";
    //     clr = "#9ACD32";
    // }
    // if (risk > 5 && risk <= 10) {
    //     des = "Moderate risk of default. Satisfactory credit quality but more susceptible to economic changes.";
    //     rgrade = "Fair (BBB)";
    //     clr = "#FFFF00";
    // }
    // if (risk > 10 && risk <= 20) {
    //     des = "High risk of default. Below investment grade; more sensitive to economic conditions.";
    //     rgrade = "Poor (BB)";
    //     clr = "#FFA500";
    // }
    // if (risk > 20 && risk <= 40) {
    //     des = "Very high risk of default. Speculative; substantial risk of default.";
    //     rgrade = "Very Poor (B)";
    //     clr = "#FF4500";
    // }
    // if (risk > 40 && risk <= 100) {
    //     des = "High probability of default. Credit quality is very low; significant risk of loss.";
    //     rgrade = "Default (C)";
    //     clr = "#FF0000";
    // }

    let cc = document.getElementById('cc').innerHTML;
    const ccArray = JSON.parse(cc); // Parse JSON data if it’s in JSON format
    ccArray.push(score);
    document.getElementById('cc').style.display = 'none ';
    const trendChart = document.getElementById('trendChart');
    if (trendChart) {
        new Chart(trendChart, {
            type: 'line',
            data: {
                labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Credit Score',
                    data: ccArray,
                    borderColor: '#4CAF50',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 300,
                        max: 900
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
})
function download() {
    var opt = {
        margin: [0.5, 0.5, 0.5, 0.5], // Margins in inches (top, left, bottom, right)
        filename: 'Report.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 }, // Adjust scale if needed
        jsPDF: {
            unit: 'in',
            format: 'a4', // Use 'a4' if letter format is too large
            orientation: 'portrait' // or 'landscape' if content is wider than tall
        }
    };
        
    // Convert the container to a PDF
    html2pdf().from(document.getElementById('dashboard')).set(opt).save();
}



