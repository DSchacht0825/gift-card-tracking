// Data Entry Page Logic

let cardTypes = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('distributedAt').value = today;

    // Load data
    await loadCardTypes();
    await loadInventory();

    // Set up form submission
    document.getElementById('entryForm').addEventListener('submit', handleSubmit);
});

// Load card types for dropdown
async function loadCardTypes() {
    try {
        const { data, error } = await db
            .from('card_types')
            .select('*')
            .order('name');

        if (error) throw error;

        cardTypes = data;
        const select = document.getElementById('cardType');

        data.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = card.name;
            select.appendChild(option);
        });
    } catch (error) {
        showMessage('Error loading card types: ' + error.message, 'error');
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
                    <div class="details">${card.remaining} of ${card.initial_count} @ $${Number(card.card_value).toFixed(2)} each</div>
                    <div class="value">$${Number(card.remaining_value || 0).toFixed(2)} remaining</div>
                </div>
            `;
        }).join('') + `
            <div class="inventory-card total">
                <h3>TOTAL</h3>
                <div class="count">$${totalRemainingValue.toFixed(2)}</div>
                <div class="details">$${totalDistributedValue.toFixed(2)} distributed</div>
                <div class="value">of $${totalInitialValue.toFixed(2)} initial</div>
            </div>
        `;
    } catch (error) {
        document.getElementById('inventory').innerHTML =
            '<p class="error">Error loading inventory</p>';
        console.error('Error loading inventory:', error);
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const formData = {
        recipient_name: document.getElementById('recipientName').value.trim(),
        recipient_uid: document.getElementById('recipientUid').value.trim(),
        card_type_id: parseInt(document.getElementById('cardType').value),
        quantity: parseInt(document.getElementById('quantity').value),
        distributed_at: document.getElementById('distributedAt').value,
        notes: document.getElementById('notes').value.trim() || null
    };

    try {
        // Check if there's enough inventory
        const { data: inventory, error: invError } = await db
            .from('inventory_summary')
            .select('*')
            .eq('id', formData.card_type_id)
            .single();

        if (invError) throw invError;

        if (inventory.remaining < formData.quantity) {
            throw new Error(`Not enough ${inventory.name} cards. Only ${inventory.remaining} remaining.`);
        }

        // Insert the distribution record
        const { error } = await db
            .from('distributions')
            .insert([formData]);

        if (error) throw error;

        showMessage('Distribution recorded successfully!', 'success');

        // Reset form (keep date)
        document.getElementById('recipientName').value = '';
        document.getElementById('recipientUid').value = '';
        document.getElementById('cardType').value = '';
        document.getElementById('quantity').value = '1';
        document.getElementById('notes').value = '';

        // Refresh inventory display
        await loadInventory();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Distribution';
    }
}

// Show message helper
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message show ${type}`;

    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'message';
        }, 5000);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
