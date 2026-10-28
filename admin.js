async function fetchJSON(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
function showTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
    if (id === 'overview') loadOverview();
    if (id === 'users') loadUsers();
    if (id === 'redemptions') loadRedemptions();
}
async function loadOverview() {
    try {
        const data = await fetchJSON('/api/admin/overview');
        const profitClass = data.profit_cents >= 0 ? 'profit-positive' : 'profit-negative';
        document.getElementById('econ-stats').innerHTML = `
            <div class="stat-card"><h3>Total Devices</h3><div class="value">${data.total_devices}</div></div>
            <div class="stat-card"><h3>Opted In</h3><div class="value">${data.opted_in}</div></div>
            <div class="stat-card"><h3>Revenue In</h3><div class="value">$${(data.revenue_cents / 100).toFixed(2)}</div></div>
            <div class="stat-card"><h3>Cards Paid</h3><div class="value">$${(data.paid_cents / 100).toFixed(2)}</div></div>
            <div class="stat-card"><h3>Profit</h3><div class="value ${profitClass}">$${(data.profit_cents / 100).toFixed(2)}</div></div>
        `;
    } catch (e) { alert('Error loading overview'); }
}
async function loadUsers() {
    try {
        const { users } = await fetchJSON('/api/admin/users');
        document.querySelector('#users-table tbody').innerHTML = users.map(u => `
            <tr><td>${u.device_id}</td><td>${u.opted_in ? 'Yes' : 'No'}</td><td>${u.points_balance}</td><td>${u.streak} days (${u.multiplier}x)</td></tr>
        `).join('');
    } catch (e) { alert('Error loading users'); }
}
async function loadRedemptions() {
    try {
        const { redemptions } = await fetchJSON('/api/admin/redemptions');
        document.querySelector('#redemptions-table tbody').innerHTML = redemptions.map(r => `
            <tr>
                <td>${r.id}</td><td>${r.device_id}</td><td>$${(r.value_cents / 100).toFixed(2)}</td><td>${r.status}</td>
                <td>
                    ${r.status === 'pending' ? `<button class="action btn-approve" onclick="handleRedemption(${r.id}, 'approve')">Approve</button>` : ''}
                    ${r.status === 'approved' ? `<button class="action btn-paid" onclick="promptCode(${r.id})">Mark Paid</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (e) { alert('Error loading redemptions'); }
}
async function handleRedemption(id, action, code = null) {
    try {
        await fetchJSON('/api/admin/redemptions', { method: 'POST', body: JSON.stringify({ id, action, code }) });
        loadRedemptions();
    } catch (e) { alert('Error updating redemption'); }
}
function promptCode(id) {
    const code = prompt('Enter the gift card code:');
    if (code) handleRedemption(id, 'paid', code);
}
loadOverview();
