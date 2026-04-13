import { db, auth } from "./firebase.js";
import { 
    collection, query, onSnapshot, doc, updateDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allOrders = [];
let revenueChart = null;
let currentMonthYear = ""; // Định dạng "MM-YYYY"

// 1. Khởi tạo và lắng nghe dữ liệu từ Firestore
function initAdmin() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTabs();
        processData(); 
    });
}

// 2. Phân loại đơn hàng theo tháng và tạo Tab
function renderTabs() {
    const tabsContainer = document.getElementById("monthTabs");
    const months = [...new Set(allOrders.map(order => {
        const date = order.createdAt?.toDate() || new Date();
        return `${date.getMonth() + 1}-${date.getFullYear()}`;
    }))].sort().reverse();

    if (currentMonthYear === "" && months.length > 0) currentMonthYear = months[0];

    tabsContainer.innerHTML = months.map(m => `
        <button class="tab-btn ${m === currentMonthYear ? 'active' : ''}" 
                onclick="changeMonth('${m}')">${m}</button>
    `).join("");
}

// 3. Xử lý dữ liệu hiển thị (Lọc theo tháng, tính doanh thu, vẽ biểu đồ)
function processData() {
    const filteredOrders = allOrders.filter(order => {
        const date = order.createdAt?.toDate() || new Date();
        const m = `${date.getMonth() + 1}-${date.getFullYear()}`;
        return m === currentMonthYear;
    });

    // Sắp xếp: Đã giao xuống dưới cùng
    filteredOrders.sort((a, b) => {
        if (a.status === "delivered" && b.status !== "delivered") return 1;
        if (a.status !== "delivered" && b.status === "delivered") return -1;
        return 0;
    });

    renderOrders(filteredOrders);
    updateStatsAndChart(filteredOrders);
}

// 4. Render danh sách đơn hàng ra bảng
function renderOrders(orders) {
    const tbody = document.getElementById("orderTableBody");
    tbody.innerHTML = orders.map(order => {
        const date = order.createdAt?.toDate().toLocaleString("vi-VN") || "N/A";
        const isDelivered = order.status === "delivered";

        return `
            <tr class="${isDelivered ? 'delivered-row' : ''}">
                <td>
                    <strong>${order.customer?.name}</strong><br>
                    <small>${order.customer?.email || 'No Email'}</small>
                </td>
                <td>${date}</td>
                <td>${order.items.map(i => `${i.name} (x${i.quantity})`).join(", ")}</td>
                <td>${order.totalPrice.toLocaleString()}đ</td>
                <td>
                    <select class="status-select" id="status-${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                        <option value="deposit_pending" ${order.status === 'deposit_pending' ? 'selected' : ''}>Chờ cọc</option>
                        <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Đang ship</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Đã giao</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                    </select>
                </td>
                <td>
                    <button class="btn-update" onclick="updateStatus('${order.id}')">Lưu</button>
                </td>
            </tr>
        `;
    }).join("");
}

// 5. Cập nhật trạng thái đơn hàng lên Firebase
window.updateStatus = async (orderId) => {
    const newStatus = document.getElementById(`status-${orderId}`).value;
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        alert("Cập nhật trạng thái thành công!");
    } catch (e) {
        console.error(e);
        alert("Lỗi khi cập nhật");
    }
};

// 6. Xử lý biểu đồ doanh thu theo ngày
function updateStatsAndChart(orders) {
    let monthlyTotal = 0;
    const dailyRevenue = {};

    orders.forEach(order => {
        if (order.status === "delivered") {
            const date = order.createdAt?.toDate() || new Date();
            const day = date.getDate();
            monthlyTotal += order.totalPrice;
            dailyRevenue[day] = (dailyRevenue[day] || 0) + order.totalPrice;
        }
    });

    document.getElementById("monthRevenue").innerText = monthlyTotal.toLocaleString() + " VNĐ";
    document.getElementById("newOrdersCount").innerText = orders.filter(o => o.status === "pending").length;

    // Vẽ biểu đồ
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const labels = Object.keys(dailyRevenue).sort((a,b) => a-b);
    const data = labels.map(l => dailyRevenue[l]);

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => `Ngày ${l}`),
            datasets: [{
                label: 'Doanh thu theo ngày (VNĐ)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Chuyển tab tháng
window.changeMonth = (m) => {
    currentMonthYear = m;
    renderTabs();
    processData();
};

// Khởi chạy
initAdmin();