// Admin Dashboard Logic

let cardTypes = [];
let allDistributions = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await loadCardTypes();
    await loadInventory();
    await loadDistributions();
});

// Load card types for filter dropdown
async function loadCardTypes() {
    try {
        const { data, error } = await db
            .from('card_types')
            .select('*')
            .order('name');

        if (error) throw error;

        cardTypes = data;
        const select = document.getElementById('filterCardType');

        data.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading card types:', error);
    }
}

// Load and display inventory
async function loadInventory() {
    try {
        const { data, error } = await db
            .from('inventory_summary')
            .select('*')
            .order('name');

        if (error) throw error;

        const inventoryDiv = document.getElementById('inventory');

        if (data.length === 0) {
            inventoryDiv.innerHTML = '<p>No inventory data available.</p>';
            return;
        }

        // Calculate totals
        const totalInitialValue = data.reduce((sum, c) => sum + Number(c.initial_value || 0), 0);
        const totalDistributedValue = data.reduce((sum, c) => sum + Number(c.distributed_value || 0), 0);
        const totalRemainingValue = data.reduce((sum, c) => sum + Number(c.remaining_value || 0), 0);
        const totalDistributed = data.reduce((sum, c) => sum + Number(c.distributed || 0), 0);
        const totalRemaining = data.reduce((sum, c) => sum + Number(c.remaining || 0), 0);

        inventoryDiv.innerHTML = data.map(card => {
            let statusClass = '';
            if (card.remaining <= 0) {
                statusClass = 'low';
            } else if (card.remaining <= 5) {
                statusClass = 'warning';
            }

            return `
                <div class="inventory-card ${statusClass}">
                    <h3>${escapeHtml(card.name)}</h3>
                    <div class="count">${card.remaining}</div>
                    <div class="details">${card.distributed} given / ${card.initial_count} total @ $${Number(card.card_value).toFixed(2)}</div>
                    <div class="value">$${Number(card.distributed_value || 0).toFixed(2)} distributed</div>
                </div>
            `;
        }).join('') + `
            <div class="inventory-card total">
                <h3>TOTAL</h3>
                <div class="count">$${totalDistributedValue.toFixed(2)}</div>
                <div class="details">${totalDistributed} cards given out</div>
                <div class="value">$${totalRemainingValue.toFixed(2)} / $${totalInitialValue.toFixed(2)} remaining</div>
            </div>
        `;
    } catch (error) {
        document.getElementById('inventory').innerHTML =
            '<p class="error">Error loading inventory</p>';
        console.error('Error loading inventory:', error);
    }
}

// Load distributions
async function loadDistributions(filters = {}) {
    try {
        let query = db
            .from('distributions')
            .select(`
                *,
                card_types (name, card_value)
            `)
            .order('distributed_at', { ascending: false })
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.cardTypeId) {
            query = query.eq('card_type_id', filters.cardTypeId);
        }
        if (filters.dateFrom) {
            query = query.gte('distributed_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('distributed_at', filters.dateTo);
        }

        const { data, error } = await query;

        if (error) throw error;

        allDistributions = data;
        renderDistributions(data);
    } catch (error) {
        document.getElementById('distributionsBody').innerHTML =
            '<tr><td colspan="7" class="error">Error loading distributions</td></tr>';
        console.error('Error loading distributions:', error);
    }
}

// Render distributions table
function renderDistributions(distributions) {
    const tbody = document.getElementById('distributionsBody');
    const countEl = document.getElementById('recordCount');

    if (distributions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No distributions found.</td></tr>';
        countEl.textContent = '0 records';
        return;
    }

    tbody.innerHTML = distributions.map(d => {
        const cardValue = Number(d.card_types?.card_value || 0);
        const totalValue = cardValue * d.quantity;
        return `
            <tr data-id="${d.id}">
                <td>${formatDate(d.distributed_at)}</td>
                <td>${escapeHtml(d.recipient_name)}</td>
                <td>${escapeHtml(d.recipient_uid)}</td>
                <td>${escapeHtml(d.card_types?.name || 'Unknown')}</td>
                <td>${d.quantity}</td>
                <td>$${totalValue.toFixed(2)}</td>
                <td>${escapeHtml(d.notes || '-')}</td>
                <td>
                    <button onclick="deleteDistribution(${d.id})" class="btn-small danger">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    const totalQty = distributions.reduce((sum, d) => sum + d.quantity, 0);
    const totalValue = distributions.reduce((sum, d) => {
        const cardValue = Number(d.card_types?.card_value || 0);
        return sum + (cardValue * d.quantity);
    }, 0);
    countEl.textContent = `${distributions.length} records | ${totalQty} cards | $${totalValue.toFixed(2)} distributed`;
}

// Apply filters
function applyFilters() {
    const filters = {
        cardTypeId: document.getElementById('filterCardType').value || null,
        dateFrom: document.getElementById('filterDateFrom').value || null,
        dateTo: document.getElementById('filterDateTo').value || null
    };
    loadDistributions(filters);
}

// Clear filters
function clearFilters() {
    document.getElementById('filterCardType').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    loadDistributions();
}

// Refresh data
async function refreshData() {
    await loadInventory();
    await loadDistributions();
    showMessage('Data refreshed!', 'success');
}

// Delete distribution
async function deleteDistribution(id) {
    if (!confirm('Are you sure you want to delete this distribution record?')) {
        return;
    }

    try {
        const { error } = await db
            .from('distributions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showMessage('Distribution deleted successfully!', 'success');
        await loadInventory();
        await loadDistributions();
    } catch (error) {
        showMessage('Error deleting distribution: ' + error.message, 'error');
    }
}

// Export to CSV
function exportCSV() {
    if (allDistributions.length === 0) {
        showMessage('No data to export', 'error');
        return;
    }

    const headers = ['Date', 'Name', 'UID', 'Card Type', 'Quantity', 'Unit Value', 'Total Value', 'Notes'];
    const rows = allDistributions.map(d => {
        const cardValue = Number(d.card_types?.card_value || 0);
        const totalValue = cardValue * d.quantity;
        return [
            d.distributed_at,
            `"${(d.recipient_name || '').replace(/"/g, '""')}"`,
            `"${(d.recipient_uid || '').replace(/"/g, '""')}"`,
            `"${(d.card_types?.name || '').replace(/"/g, '""')}"`,
            d.quantity,
            cardValue.toFixed(2),
            totalValue.toFixed(2),
            `"${(d.notes || '').replace(/"/g, '""')}"`
        ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `giftcard_distributions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage(`Exported ${allDistributions.length} records to CSV`, 'success');
}

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message show ${type}`;

    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'message';
        }, 3000);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
