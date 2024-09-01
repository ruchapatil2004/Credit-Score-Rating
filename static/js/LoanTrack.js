document.addEventListener('DOMContentLoaded', function() {
    let track = document.getElementById('track').innerHTML;
    document.getElementById('track').style.display = 'none';
    track = JSON.parse(track.replace(/'/g, '"'));

    function fetchUserLoanData() {
        return new Promise((resolve) => {
            // Simulating an API call
            setTimeout(() => {
                const loanData = [];
                for (let index = 0; index < track.length; index++) {
                    const loanType = track[index][12]; // Fetching the loan type from the current index
                    loanData.push({
                        loanType: loanType,  // Use extracted loan type
                        payments: track[index].slice(1).map((status, i) => ({ // Assuming payments start from index 1
                            month: getMonthName(i),
                            status: status
                        }))
                    });
                }
                
                resolve(loanData);
            }, 1000);
        });
    }

    function getMonthName(index) {
        const monthNames = [
            "August", "September", "October", "November", "December",
            "January", "February", "March", "April", "May", "June", "July"
        ];
        return monthNames[index];
    }

    function createLoanTracker(loan) {
        const trackerDiv = document.createElement('div');
        trackerDiv.className = 'loan-tracker';

        const header = document.createElement('div');
        header.className = 'loan-header';
        header.textContent = loan.loanType;
        trackerDiv.appendChild(header);

        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'scroll-container';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th class="loan-type">Loan Type</th>';
        loan.payments.forEach(payment => {
            headerRow.innerHTML += `<th>${payment.month}</th>`;
        });
        thead.appendChild(headerRow);

        // Create payment status row
        const statusRow = document.createElement('tr');
        statusRow.innerHTML = `<td class="loan-type">${loan.loanType}</td>`;
        loan.payments.forEach(payment => {
            let statusSymbol = getStatusSymbol(payment.status);
            statusRow.innerHTML += `<td><span class="payment-status">${statusSymbol}</span></td>`;
        });
        tbody.appendChild(statusRow);

        table.appendChild(thead);
        table.appendChild(tbody);
        scrollContainer.appendChild(table);
        trackerDiv.appendChild(scrollContainer);

        // Create summary
        const summary = calculateSummary(loan);
        const summaryContainer = createSummaryContainer(summary);
        trackerDiv.appendChild(summaryContainer);

        return trackerDiv;
    }

    function getStatusSymbol(status) {
        switch(status) {
            case 'On-time': return '✅';
            case 'Missed': return '❌';
            case 'Late': return '⏳';
            default: return '❓';
        }
    }

    function calculateSummary(loan) {
        const summary = { timely: 0, late: 0, defaulted: 0 };
        loan.payments.forEach(payment => {
            switch(payment.status) {
                case 'On-time': summary.timely++; break;
                case 'Late': summary.late++; break;
                case 'Missed': summary.defaulted++; break;
            }
        });
        return summary;
    }

    function createSummaryContainer(summary) {
        const container = document.createElement('div');
        container.className = 'summary-container';

        const items = [
            { label: 'On Time Payments', value: summary.timely },
            { label: 'Late Payments', value: summary.late },
            { label: 'Defaults', value: summary.defaulted }
        ];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = `<h3>${item.label}</h3><p>${item.value}</p>`;
            container.appendChild(div);
        });

        return container;
    }

    // Main function to initialize the page
    async function initializePage() {
        const loanTrackersContainer = document.getElementById('loan-trackers');
        loanTrackersContainer.innerHTML = '<p>Loading...</p>';

        try {
            const loanData = await fetchUserLoanData();
            loanTrackersContainer.innerHTML = '';

            loanData.forEach(loan => {
                const loanTracker = createLoanTracker(loan);
                loanTrackersContainer.appendChild(loanTracker);
            });
        } catch (error) {
            console.error('Error fetching loan data:', error);
            loanTrackersContainer.innerHTML = '<p>Error loading loan data. Please try again later.</p>';
        }
    }

    initializePage();
});
