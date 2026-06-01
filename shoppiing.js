/**
 * View 4 Module Driver Engine - Financial Integrated Procurement Ledger
 */
const ShoppingModule = {
    init() {
        this.bindEvents();
        this.renderShoppingLedger();
    },

    bindEvents() {
        const form = document.getElementById('shopping-add-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewProcurementRecord();
            });
        }
    },

    createNewProcurementRecord() {
        const nameInput = document.getElementById('shop-item-name');
        const qtyInput = document.getElementById('shop-item-qty');
        const priceInput = document.getElementById('shop-item-price');

        const name = nameInput.value.trim();
        const quantity = parseInt(qtyInput.value) || 1;
        const price = parseFloat(priceInput.value) || 0.00;

        if (!name) return;

        const ledger = StorageEngine.getData(StorageEngine.KEYS.SHOPPING) || [];
        const newItem = {
            id: 'shop_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name, quantity, price, purchased: false
        };

        ledger.push(newItem);
        StorageEngine.setData(StorageEngine.KEYS.SHOPPING, ledger);

        // Reset input controls values
        nameInput.value = '';
        qtyInput.value = '1';
        priceInput.value = '0.00';

        this.renderShoppingLedger();
        RewardsEngine.evaluateTriggerChecks();
    },

    toggleItemPurchasedStatus(id) {
        const ledger = StorageEngine.getData(StorageEngine.KEYS.SHOPPING) || [];
        const index = ledger.findIndex(s => s.id === id);

        if (index !== -1) {
            ledger[index].purchased = !ledger[index].purchased;
            StorageEngine.setData(StorageEngine.KEYS.SHOPPING, ledger);
            this.renderShoppingLedger();
            RewardsEngine.evaluateTriggerChecks();
        }
    },

    purgeProcurementRecord(id) {
        let ledger = StorageEngine.getData(StorageEngine.KEYS.SHOPPING) || [];
        ledger = ledger.filter(s => s.id !== id);
        StorageEngine.setData(StorageEngine.KEYS.SHOPPING, ledger);
        this.renderShoppingLedger();
    },

    /**
     * Loops through tracking lists arrays to calculate financial values and updates elements
     */
    renderShoppingLedger() {
        const pendingTarget = document.getElementById('shop-pending-list-target');
        const purchasedTarget = document.getElementById('shop-purchased-list-target');
        if (!pendingTarget || !purchasedTarget) return;

        const ledger = StorageEngine.getData(StorageEngine.KEYS.SHOPPING) || [];

        pendingTarget.innerHTML = '';
        purchasedTarget.innerHTML = '';

        let totalPendingCost = 0;
        let totalPurchasedCost = 0;

        ledger.forEach(item => {
            const costAggregation = item.quantity * item.price;
            
            if (item.purchased) {
                totalPurchasedCost += costAggregation;
            } else {
                totalPendingCost += costAggregation;
            }

            const elementRow = document.createElement('div');
            elementRow.className = 'shopping-ledger-node';
            elementRow.innerHTML = `
                <div class="shop-node-left">
                    <input type="checkbox" class="shop-check-box" ${item.purchased ? 'checked' : ''}>
                    <div class="shop-node-info">
                        <h4>${this.escapeHTML(item.name)}</h4>
                        <p>Quantity: ${item.quantity} x $${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <div class="shop-node-right">
                    <span class="shop-node-price-tag">$${costAggregation.toFixed(2)}</span>
                    <button class="icon-btn shop-delete-btn" title="Remove Item">❌</button>
                </div>
            `;

            // Bind transaction event operations securely natively
            elementRow.querySelector('.shop-check-box').addEventListener('change', () => this.toggleItemPurchasedStatus(item.id));
            elementRow.querySelector('.shop-delete-btn').addEventListener('click', () => this.purgeProcurementRecord(item.id));

            if (item.purchased) {
                purchasedTarget.appendChild(elementRow);
            } else {
                pendingTarget.appendChild(elementRow);
            }
        });

        // Insert fallback text tags if items lists evaluate empty
        if (pendingTarget.children.length === 0) pendingTarget.innerHTML = `<p class="empty-state">No pending acquisition parameters defined.</p>`;
        if (purchasedTarget.children.length === 0) purchasedTarget.innerHTML = `<p class="empty-state">No transaction logs cleared yet.</p>`;

        // Update financial sum totals metrics boxes labels formatting
        const aggregateGross = totalPendingCost + totalPurchasedCost;
        document.getElementById('cost-pending-aggregate').textContent = `$${totalPendingCost.toFixed(2)}`;
        document.getElementById('cost-purchased-aggregate').textContent = `$${totalPurchasedCost.toFixed(2)}`;
        document.getElementById('cost-gross-aggregate').textContent = `$${aggregateGross.toFixed(2)}`;
    },

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
};