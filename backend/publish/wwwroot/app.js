window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

let token = localStorage.getItem("token") || "";
let loggedInUser = localStorage.getItem("user") || "";
let userRole = "";
let activeTimers = {};
let myLockedSeats = new Set(JSON.parse(localStorage.getItem("myLockedSeats") || "[]"));
function saveMyLockedSeats() { localStorage.setItem("myLockedSeats", JSON.stringify(Array.from(myLockedSeats))); }

let currentEventId = localStorage.getItem("selectedEventId") || "";
let currentEventName = "";
let isCurrentEventExpired = false;
let seatNumbersMap = {};
let signalRConnection = null;
let adminChartInstance = null;
let html5QrcodeScanner = null;
let transferBookingId = null;


let reviewEventId = null;
let currentPage = 1;
let totalPages = 1;
let adminCurrentPage = 1;
let adminTotalPages = 1;

const apiBase = "/api";
const hubUrl = "/ticketHub";

document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        document.getElementById("authSection").classList.add("hidden");
        resumeSession();
    } else {
        document.getElementById("authSection").classList.remove("hidden");
    }
});

function showToast(message, color = "#333") {
    const box = document.getElementById("notification-box");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.borderLeft = `5px solid ${color}`;
    toast.innerText = message;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function switchTab(tab) {
    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden'); document.getElementById('regForm').classList.add('hidden');
        document.getElementById('btnLoginTab').classList.add('active'); document.getElementById('btnRegTab').classList.remove('active');
    } else {
        document.getElementById('loginForm').classList.add('hidden'); document.getElementById('regForm').classList.remove('hidden');
        document.getElementById('btnLoginTab').classList.remove('active'); document.getElementById('btnRegTab').classList.add('active');
    }
}

function parseJwt(jwtToken) {
    try {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

function resumeSession() {
    const decoded = parseJwt(token);
    if (!decoded) {
        document.getElementById("authSection").classList.remove("hidden");
        return;
    }

    userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;

    if (userRole === "Admin") {
        document.getElementById("adminSection").classList.remove("hidden");
        loadDashboard();
        fetchAdminEvents(1); // تم التحديث لتبدأ من الصفحة 1
        initSignalR();
    } else {
        document.getElementById("userDashboardSection").classList.remove("hidden");
        document.getElementById("dashUsername").innerText = loggedInUser;
        loadUserTickets();
        loadAvailableEvents(1); // تم التحديث لتبدأ من الصفحة 1

        const pendingSeat = localStorage.getItem("pendingTicketSeatId");
        if (pendingSeat && currentEventId) {
            enterStadium(currentEventId, "Event", false);
        }
    }
}

function openProfile() {
    document.getElementById("profUsername").innerText = loggedInUser;
    document.getElementById("profRole").innerText = userRole;
    loadWalletBalance();
    document.getElementById("profileModal").classList.remove("hidden");
}

function closeProfile() {
    document.getElementById("profileModal").classList.add("hidden");
    document.getElementById("oldPass").value = "";
    document.getElementById("newPass").value = "";
    document.getElementById("addFundsAmount").value = "";
}

async function changePassword() {
    const oldP = document.getElementById("oldPass").value;
    const newP = document.getElementById("newPass").value;

    if (!oldP || !newP) return showToast("Please enter both passwords", "#e74c3c");

    try {
        const res = await fetch(`${apiBase}/Auth/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ username: loggedInUser, oldPassword: oldP, newPassword: newP })
        });

        if (res.ok) {
            showToast("Password changed successfully! 🔒", "#27ae60");
            closeProfile();
        } else {
            const err = await res.json();
            const errorMsg = err.Message || err.message || err.detail || err.title || "Failed to change password";
            showToast(errorMsg, "#e74c3c");
        }
    } catch (e) {
        showToast("Connection error", "#e74c3c");
    }
}

async function loadWalletBalance() {
    try {
        const res = await fetch(`${apiBase}/Wallet/balance/${loggedInUser}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById("walletBalance").innerText = parseFloat(data.balance || 0).toFixed(2);
        }
    } catch (e) { console.error("Error loading wallet balance", e); }
}

async function addFunds() {
    const amount = document.getElementById("addFundsAmount").value;
    if (!amount || amount <= 0) return showToast("Enter a valid amount", "#e74c3c");

    try {
        const res = await fetch(`${apiBase}/Wallet/add-funds`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ username: loggedInUser, amount: parseFloat(amount) })
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById("walletBalance").innerText = parseFloat(data.balance || 0).toFixed(2);
            document.getElementById("addFundsAmount").value = "";
            showToast("Funds added successfully! 💳", "#27ae60");
        } else {
            showToast("Failed to add funds", "#e74c3c");
        }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

function openTransferModal(bookingId) {
    transferBookingId = bookingId;
    document.getElementById("transferTargetUsername").value = "";
    document.getElementById("transferModal").classList.remove("hidden");
}

function closeTransferModal() {
    transferBookingId = null;
    document.getElementById("transferModal").classList.add("hidden");
}

async function submitTransfer() {
    const targetUsername = document.getElementById("transferTargetUsername").value.trim();
    if (!targetUsername) return showToast("Enter target username", "#e74c3c");
    if (targetUsername.toLowerCase() === loggedInUser.toLowerCase()) return showToast("You cannot transfer to yourself", "#f39c12");

    try {
        const res = await fetch(`${apiBase}/Bookings/transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ bookingId: transferBookingId, fromUsername: loggedInUser, toUsername: targetUsername })
        });
        if (res.ok) {
            showToast(`Ticket successfully transferred to ${targetUsername}! 🎁`, "#27ae60");
            closeTransferModal();
            loadUserTickets();
        } else {
            showToast("Transfer failed. User might not exist or is an Admin.", "#e74c3c");
        }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

async function exportToCSV(eventId, eventName) {
    try {
        const res = await fetch(`${apiBase}/Events/${eventId}/seats`);
        if (!res.ok) return showToast("Failed to fetch data for export", "#e74c3c");

        const seats = await res.json();
        if (seats.length === 0) return showToast("No seats found for this event", "#f39c12");

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Seat Number,Status,Price (EGP)\n";

        seats.forEach(function (s) {
            let row = `${s.seatNumber},${s.status},${s.price}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Tickets_${eventName.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Excel Export Successful! 📊", "#27ae60");
    } catch (e) { showToast("Error exporting to Excel", "#e74c3c"); }
}

async function register() {
    const u = document.getElementById("regUser").value;
    const e = document.getElementById("regEmail").value;
    const p = document.getElementById("regPass").value;
    if (!u || !e || !p) return alert("Please fill all fields");

    try {
        const res = await fetch(`${apiBase}/Auth/register`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, email: e, password: p })
        });
        if (res.ok) {
            showToast("Account created successfully! Please login.", "#27ae60");
            switchTab('login');
            document.getElementById("loginUser").value = u; document.getElementById("loginPass").value = "";
        } else {
            const err = await res.json(); showToast(err.Message || "Registration failed", "#e74c3c");
        }
    } catch (ex) { alert("Backend offline!"); }
}

async function login() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;
    if (!u || !p) return alert("Please enter Username and Password");

    try {
        const res = await fetch(`${apiBase}/Auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p })
        });
        if (res.ok) {
            const data = await res.json();
            token = data.token; loggedInUser = u;
            localStorage.setItem("token", token); localStorage.setItem("user", u);
            document.getElementById("authSection").classList.add("hidden");
            resumeSession();
        } else {
            showToast("Invalid Username or Password!", "#e74c3c");
        }
    } catch (e) { alert("Backend is offline!"); }
}

function logout() {
    localStorage.clear(); token = ""; loggedInUser = ""; userRole = ""; myLockedSeats.clear();
    if (signalRConnection) signalRConnection.stop();
    if (html5QrcodeScanner) { html5QrcodeScanner.clear(); html5QrcodeScanner = null; }

    document.getElementById("adminSection").classList.add("hidden");
    document.getElementById("bookingSection").classList.add("hidden");
    document.getElementById("userDashboardSection").classList.add("hidden");
    document.getElementById("btnBackToAdmin").classList.add("hidden");
    document.getElementById("btnBackToUserDash").classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("loginPass").value = "";
}

async function cancelTicket(bookingId) {
    if (!confirm("Are you sure you want to CANCEL this ticket? This action cannot be undone.")) return;

    try {
        const res = await fetch(`${apiBase}/Bookings/cancel/${bookingId}/${loggedInUser}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            showToast("Ticket successfully cancelled and refunded to wallet! ↩️", "#27ae60");
            loadUserTickets();
            if (signalRConnection) signalRConnection.invoke("DashboardUpdate");
        } else {
            const err = await res.json();
            showToast(err.Message || "Cannot cancel this ticket.", "#e74c3c");
        }
    } catch (e) { showToast("Error connecting to server.", "#e74c3c"); }
}

async function loadUserTickets() {
    try {
        const res = await fetch(`${apiBase}/Bookings/my-tickets/${loggedInUser}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const tickets = await res.json();
            const container = document.getElementById("myTicketsList");
            container.innerHTML = "";
            if (tickets.length === 0) {
                container.innerHTML = "<p style='color: #7f8c8d; padding-left: 10px;'>No tickets purchased yet.</p>";
                return;
            }
            tickets.forEach(t => {
                const isUpcoming = new Date(t.eventDate) > new Date();

                const tCard = document.createElement("div");
                tCard.style = "min-width: 280px; background: #fff; border: 2px dashed #27ae60; padding: 15px; border-radius: 10px; text-align: left; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
                tCard.innerHTML = `
                    <h4 style="margin:0 0 5px 0; color:#2c3e50">${t.eventName}</h4>
                    <p style="margin:0 0 10px 0; color:#7f8c8d; font-size:11px;">${new Date(t.eventDate).toLocaleString()}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight:bold; color:#e74c3c; font-size: 16px;">Seat: ${t.seatNumber}</span>
                        <div>
                            <button onclick="showTicketFromHistory(${t.seatId}, '${t.eventName}', '${t.seatNumber}')" style="font-size:12px; background:#27ae60; color:white; padding:5px 8px; border:none; border-radius:4px; cursor:pointer;">View</button>
                            ${isUpcoming ? `
                                <button onclick="openTransferModal(${t.bookingId})" style="font-size:12px; background:#f39c12; color:white; padding:5px 8px; border:none; border-radius:4px; cursor:pointer; margin-left:3px;">Transfer</button>
                                <button onclick="cancelTicket(${t.bookingId})" style="font-size:12px; background:#e74c3c; color:white; padding:5px 8px; border:none; border-radius:4px; cursor:pointer; margin-left:3px;">Cancel</button>
                            ` : `
                                <button onclick="openWriteReviewModal(${t.eventId}, '${t.eventName}')" style="font-size:12px; background:#8e44ad; color:white; padding:5px 8px; border:none; border-radius:4px; cursor:pointer; margin-left:3px;">⭐ Rate</button>
                            `}
                        </div>
                    </div>
                `;
                container.appendChild(tCard);
            });
        }
    } catch (e) { console.error(e); }
}

// ----------------- دوال التقييمات (Reviews) -----------------
function openWriteReviewModal(eventId, eventName) {
    reviewEventId = eventId;
    document.getElementById("reviewEventName").innerText = eventName;
    document.getElementById("reviewRating").value = "5";
    document.getElementById("reviewComment").value = "";
    document.getElementById("writeReviewModal").classList.remove("hidden");
}

function closeWriteReviewModal() {
    reviewEventId = null;
    document.getElementById("writeReviewModal").classList.add("hidden");
}

async function submitReview() {
    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value.trim();
    if (!comment) return showToast("Please write a comment.", "#e74c3c");

    try {
        const res = await fetch(`${apiBase}/Reviews`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ eventId: parseInt(reviewEventId), username: loggedInUser, rating: parseInt(rating), comment: comment })
        });
        if (res.ok) {
            showToast("Review submitted successfully! ⭐", "#27ae60");
            closeWriteReviewModal();
        } else {
            const err = await res.json();
            showToast(err.Message || "You cannot review this event.", "#e74c3c");
        }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

async function viewReviews(eventId, eventName) {
    try {
        const res = await fetch(`${apiBase}/Reviews/${eventId}`);
        if (res.ok) {
            const reviews = await res.json();
            const container = document.getElementById("reviewsListContainer");
            container.innerHTML = "";
            if (reviews.length === 0) {
                container.innerHTML = "<p style='color:#7f8c8d; text-align:center;'>No reviews yet for this event.</p>";
            } else {
                reviews.forEach(r => {
                    const stars = "⭐".repeat(r.rating);
                    container.innerHTML += `
                        <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                            <strong style="color: #2980b9;">${r.username}</strong> <span style="font-size:12px; color:#7f8c8d;">- ${new Date(r.createdAt).toLocaleDateString()}</span><br>
                            <span>${stars}</span><br>
                            <p style="margin:5px 0 0 0; font-size:14px; color:#333;">"${r.comment}"</p>
                        </div>
                    `;
                });
            }
            document.getElementById("readReviewsModal").classList.remove("hidden");
        }
    } catch (e) { showToast("Error loading reviews", "#e74c3c"); }
}

function closeReadReviewsModal() {
    document.getElementById("readReviewsModal").classList.add("hidden");
}

// ----------------- دوال الفلترة والصفحات لليوزر -----------------
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        loadAvailableEvents(newPage);
    }
}

async function loadAvailableEvents(page = 1) {
    currentPage = page;
    const searchBox = document.getElementById("searchBox");
    const filterCat = document.getElementById("filterCategory");

    const searchTerm = searchBox ? searchBox.value.trim() : "";
    const category = filterCat ? filterCat.value : "All";

    const url = `${apiBase}/Events?SearchTerm=${encodeURIComponent(searchTerm)}&Category=${encodeURIComponent(category)}&PageNumber=${page}&PageSize=6`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            totalPages = data.totalPages > 0 ? data.totalPages : 1;

            const pageInfo = document.getElementById("pageInfo");
            const btnPrev = document.getElementById("btnPrevPage");
            const btnNext = document.getElementById("btnNextPage");

            if (pageInfo) pageInfo.innerText = `Page ${data.currentPage} of ${totalPages}`;
            if (btnPrev) btnPrev.disabled = data.currentPage <= 1;
            if (btnNext) btnNext.disabled = data.currentPage >= totalPages;

            const activeContainer = document.getElementById("activeEventsList");
            const pastContainer = document.getElementById("pastEventsList");
            activeContainer.innerHTML = "";
            pastContainer.innerHTML = "";

            data.events.forEach(e => {
                const catBadge = `<span style="font-size:11px; background:#ecf0f1; color:#2c3e50; padding:2px 5px; border-radius:3px;">${e.category || 'General'}</span>`;
                const evCard = document.createElement("div");
                evCard.style = `background: #fff; padding: 20px; text-align:left; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-top: 5px solid ${e.isExpired ? '#e74c3c' : '#3498db'}`;
                evCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="margin:0 0 10px 0; color:#2c3e50; font-size:18px;">${e.name}</h4>
                        ${catBadge}
                    </div>
                    <p style="margin:5px 0; font-size:13px; color:#7f8c8d;">📅 ${new Date(e.eventDate).toLocaleString()}</p>
                    <p style="margin:5px 0; font-size:13px; color:#7f8c8d;">📍 ${e.venue}</p>
                    <div style="margin-top: 15px; display:flex; justify-content:space-between; align-items:center;">
                        ${e.isExpired ? '<span style="color:#e74c3c; font-weight:bold; font-size:14px;">Closed</span>' : '<span style="color:#27ae60; font-weight:bold; font-size:14px;">Open</span>'}
                        <button onclick="viewReviews(${e.id}, '${e.name}')" style="background:none; border:none; color:#3498db; cursor:pointer; font-size:13px; text-decoration:underline;">💬 Reviews</button>
                    </div>
                    <button onclick="enterStadium(${e.id}, '${e.name}', ${e.isExpired})" style="width:100%; margin-top:15px; padding:10px; background:${e.isExpired ? '#7f8c8d' : '#3498db'}">Enter Stadium</button>
                `;
                if (e.isExpired) pastContainer.appendChild(evCard);
                else activeContainer.appendChild(evCard);
            });

            if (activeContainer.innerHTML === "") activeContainer.innerHTML = "<p style='color:#7f8c8d;'>No active events.</p>";
            if (pastContainer.innerHTML === "") pastContainer.innerHTML = "<p style='color:#7f8c8d;'>No past events.</p>";
        }
    } catch (e) { console.error(e); }
}

// ----------------- دوال الفلترة والصفحات للأدمن -----------------
function changeAdminPage(direction) {
    const newPage = adminCurrentPage + direction;
    if (newPage >= 1 && newPage <= adminTotalPages) fetchAdminEvents(newPage);
}

async function fetchAdminEvents(page = 1) {
    adminCurrentPage = page;
    const searchBox = document.getElementById("adminSearchBox");
    const filterCat = document.getElementById("adminFilterCategory");

    const searchTerm = searchBox ? searchBox.value.trim() : "";
    const category = filterCat ? filterCat.value : "All";

    const url = `${apiBase}/Events?SearchTerm=${encodeURIComponent(searchTerm)}&Category=${encodeURIComponent(category)}&PageNumber=${page}&PageSize=10`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            adminTotalPages = data.totalPages > 0 ? data.totalPages : 1;

            const pageInfo = document.getElementById("adminPageInfo");
            const btnPrev = document.getElementById("btnAdminPrevPage");
            const btnNext = document.getElementById("btnAdminNextPage");

            if (pageInfo) pageInfo.innerText = `Page ${data.currentPage} of ${adminTotalPages}`;
            if (btnPrev) btnPrev.disabled = data.currentPage <= 1;
            if (btnNext) btnNext.disabled = data.currentPage >= adminTotalPages;

            renderAdminEventsList(data.events);
        }
    } catch (e) { console.error(e); }
}

function renderAdminEventsList(events) {
    const activeContainer = document.getElementById("adminActiveEventsList");
    const pastContainer = document.getElementById("adminPastEventsList");
    activeContainer.innerHTML = "";
    pastContainer.innerHTML = "";

    events.forEach(e => {
        const catBadge = `<span style="font-size:10px; background:#ddd; color:#333; padding:2px 4px; border-radius:3px; margin-left:5px;">${e.category || 'General'}</span>`;
        const div = document.createElement("div");
        div.className = "event-list-item";
        div.style.borderLeft = `5px solid ${e.isExpired ? 'var(--closed)' : 'var(--available)'}`;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${e.name}</strong> ${catBadge}<br><small style="color:#7f8c8d;">${new Date(e.eventDate).toLocaleString()} | ID: ${e.id}</small></div>
                <div>${e.isExpired ? '<span style="color:#e74c3c; font-weight:bold;">[CLOSED]</span>' : '<span style="color:#27ae60; font-weight:bold;">[OPEN]</span>'}</div>
            </div>
            <div style="margin-top: 10px;">
                ${!e.isClosed ? `<button class="action-btn" onclick="manageEvent(${e.id}, 'close')" style="background:#e74c3c;">Stop</button>` : ''}
                <button class="action-btn" onclick="manageEvent(${e.id}, 'price')" style="background:#f39c12;">Price</button>
                <button class="action-btn" onclick="manageEvent(${e.id}, 'seats')" style="background:#3498db;">+Seats</button>
                <button class="action-btn" onclick="previewStadium(${e.id}, ${e.isExpired}, '${e.name}')" style="background:#34495e;">🏟️ View</button>
                <button class="action-btn" onclick="viewReviews(${e.id}, '${e.name}')" style="background:#8e44ad;">💬 Reviews</button>
                <button class="action-btn" onclick="exportToCSV(${e.id}, '${e.name}')" style="background:#27ae60;">📊 Excel</button>
            </div>
        `;

        if (e.isExpired) {
            pastContainer.appendChild(div);
        } else {
            activeContainer.appendChild(div);
        }
    });

    if (activeContainer.innerHTML === "") activeContainer.innerHTML = "<p style='color:#7f8c8d;'>No active events.</p>";
    if (pastContainer.innerHTML === "") pastContainer.innerHTML = "<p style='color:#7f8c8d;'>No past events.</p>";
}

function enterStadium(id, name, expired) {
    currentEventId = id; currentEventName = name; isCurrentEventExpired = expired; localStorage.setItem("selectedEventId", id);
    document.getElementById("userDashboardSection").classList.add("hidden"); document.getElementById("bookingSection").classList.remove("hidden");
    document.getElementById("btnBackToUserDash").classList.remove("hidden"); document.getElementById("btnBackToAdmin").classList.add("hidden");
    document.getElementById("welcomeMsg").innerText = `Event: ${name}`;
    loadSeats(); initSignalR();
}

function previewStadium(id, expired, name) {
    currentEventId = id; currentEventName = name; isCurrentEventExpired = expired; localStorage.setItem("selectedEventId", id);
    document.getElementById("adminSection").classList.add("hidden"); document.getElementById("bookingSection").classList.remove("hidden");
    document.getElementById("btnBackToAdmin").classList.remove("hidden"); document.getElementById("btnBackToUserDash").classList.add("hidden");
    document.getElementById("welcomeMsg").innerText = `Stadium Preview: ${name}`;
    loadSeats(); initSignalR();
}

function backToUserDashboard() {
    document.getElementById("bookingSection").classList.add("hidden"); document.getElementById("userDashboardSection").classList.remove("hidden");
    if (signalRConnection) signalRConnection.stop();
    loadUserTickets();
}

function backToDashboard() {
    document.getElementById("bookingSection").classList.add("hidden"); document.getElementById("adminSection").classList.remove("hidden");
    if (signalRConnection) signalRConnection.stop();
    loadDashboard(); fetchAdminEvents();
}

async function loadSeats() {
    const res = await fetch(`${apiBase}/Events/${currentEventId}/seats`);
    const seats = await res.json();
    const container = document.getElementById("seatsContainer");
    const waitlistArea = document.getElementById("waitlist-area");
    container.innerHTML = "";
    waitlistArea.innerHTML = "";

    const statusLabel = document.getElementById("status");
    if (isCurrentEventExpired) {
        statusLabel.innerText = "🔴 Event Closed"; statusLabel.style.color = "#e74c3c";
    } else {
        statusLabel.innerText = "🟢 Live Connection Active"; statusLabel.style.color = "#27ae60";
    }

    seats.forEach(seat => {
        seatNumbersMap[seat.id] = { number: seat.seatNumber, price: seat.price };
        const div = document.createElement("div"); div.id = `seat-${seat.id}`;
        let statusClass = "available";
        if (isCurrentEventExpired) { statusClass = "closed-seat"; }
        else {
            const statusStr = seat.status.toString().toLowerCase();
            statusClass = statusStr === "available" ? "available" : (statusStr === "locked" ? "locked" : "booked");
        }

        div.className = `seat ${statusClass}`; div.innerText = seat.seatNumber;

        if (seat.seatNumber.includes("VIP")) {
            div.style.borderBottom = "4px solid #f1c40f";
            if (statusClass === "available") { div.style.color = "#f1c40f"; }
        }

        div.onclick = function () {
            if (userRole === "Admin") return showToast("Admins cannot book seats.", "#f39c12");
            if (isCurrentEventExpired) return showToast("Event is closed.", "#e74c3c");

            if (this.classList.contains("available")) bookSeat(seat.id);
            else if (this.classList.contains("locked")) {
                if (myLockedSeats.has(seat.id)) showConfirmButton(seat.id);
                else showToast("Seat is temporarily locked", "#f1c40f");
            } else if (this.classList.contains("booked")) {
                showToast("Seat is already sold!", "#e74c3c");
            } else { showToast("Seat is sold!", "#e74c3c"); }
        };
        container.appendChild(div);
    });

    checkWaitlistStatus();

    const pendingSeat = localStorage.getItem("pendingTicketSeatId");
    if (pendingSeat) {
        setTimeout(() => {
            const pendingEl = document.getElementById(`seat-${pendingSeat}`);
            if (pendingEl && pendingEl.classList.contains("booked")) {
                showToast(`Payment Successful! 🎉`, "#27ae60");
                showTicket(pendingSeat);
            }
            localStorage.removeItem("pendingTicketSeatId");
        }, 500);
    }
}

async function joinWaitlist(eventId) {
    try {
        const res = await fetch(`${apiBase}/Waitlist/join`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ eventId: parseInt(eventId), userId: loggedInUser })
        });
        if (res.ok) {
            showToast("Successfully joined the waitlist! 🔔", "#27ae60");
            localStorage.setItem(`waitlist_${currentEventId}_${loggedInUser}`, "true");
            checkWaitlistStatus();
        } else {
            const err = await res.json();
            showToast(err.Message || "Error joining waitlist", "#e74c3c");
            if (err.Message && err.Message.includes("already")) {
                localStorage.setItem(`waitlist_${currentEventId}_${loggedInUser}`, "true");
                checkWaitlistStatus();
            }
        }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

async function bookSeat(id) {
    const seatEl = document.getElementById(`seat-${id}`);
    seatEl.style.opacity = "0.5"; seatEl.style.pointerEvents = "none";
    const res = await fetch(`${apiBase}/Bookings`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ seatId: id, userId: loggedInUser })
    });
    seatEl.style.opacity = "1"; seatEl.style.pointerEvents = "auto";

    if (!res.ok) {
        try {
            const err = await res.json();
            const errorMsg = err.Message || err.message || err.detail || err.title || "Seat is no longer available! Refreshing...";
            showToast(errorMsg, "#e74c3c");

            if (!errorMsg.toLowerCase().includes("limit")) {
                loadSeats();
            }
        } catch (e) {
            showToast("Seat is no longer available! Refreshing...", "#e74c3c");
            loadSeats();
        }
    }
    else { myLockedSeats.add(id); saveMyLockedSeats(); }
}

function showConfirmButton(id) {
    const seatInfo = seatNumbersMap[id] || { number: "S-??", price: 0 };
    const area = document.getElementById("action-area");
    area.innerHTML = `
        <div style="background: #fff8e1; padding: 15px; border-radius: 10px; border: 2px dashed #f1c40f; text-align: left;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #856404; font-size: 16px;">Selected Seat: ${seatInfo.number}</p>
            <p style="margin: 0 0 15px 0; color: #333; font-weight: bold;">Ticket Price: <span id="originalPrice">${seatInfo.price}</span> EGP</p>
            
            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                <input type="text" id="promoCodeInput" placeholder="Promo Code (Optional)" style="padding:10px; flex: 1; border:1px solid #ddd; border-radius:5px;">
                <button onclick="applyPromoCode(${seatInfo.price})" style="background: #2c3e50; width: 100px; margin: 0;">Apply</button>
            </div>
            <p id="promoMessage" style="font-size: 13px; font-weight: bold; margin-bottom: 10px; height: 15px;"></p>
            
            <p id="finalPriceText" style="margin: 0 0 15px 0; color: #27ae60; font-weight: bold; font-size: 18px; display: none;">New Total: <span id="finalPrice">${seatInfo.price}</span> EGP</p>

            <button class="confirm-btn" onclick="payWithWallet(${id})" style="background: #8e44ad; margin-bottom: 5px;">Pay with Wallet 💳</button>
            <button id="payBtn" class="confirm-btn" onclick="confirmBooking(${id})">Pay with Paymob 🌐</button>
            <button onclick="document.getElementById('action-area').innerHTML=''" style="background:none; border:none; color:grey; cursor:pointer; font-size:12px; margin-top:5px; width:100%;">Cancel</button>
        </div>`;
}

async function applyPromoCode(originalPrice) {
    const input = document.getElementById("promoCodeInput");
    const code = input.value.trim();
    const msgEl = document.getElementById("promoMessage");
    const finalPriceText = document.getElementById("finalPriceText");
    const finalPriceSpan = document.getElementById("finalPrice");

    if (!code) {
        msgEl.innerText = "Please enter a code."; msgEl.style.color = "#e74c3c";
        return;
    }

    msgEl.innerText = "Validating..."; msgEl.style.color = "#f39c12";

    try {
        const res = await fetch(`${apiBase}/PromoCodes/validate/${code}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const discountPerc = data.discountPercentage;
            const discountAmount = originalPrice * (discountPerc / 100);
            const newPrice = originalPrice - discountAmount;

            msgEl.innerText = `✅ Success! ${discountPerc}% applied (-${discountAmount} EGP)`;
            msgEl.style.color = "#27ae60";
            finalPriceSpan.innerText = newPrice;
            finalPriceText.style.display = "block";
            document.getElementById("originalPrice").style.textDecoration = "line-through";
            document.getElementById("originalPrice").style.color = "#e74c3c";
        } else {
            msgEl.innerText = "❌ Invalid or expired code.";
            msgEl.style.color = "#e74c3c";
            finalPriceText.style.display = "none";
            document.getElementById("originalPrice").style.textDecoration = "none";
            document.getElementById("originalPrice").style.color = "#333";
        }
    } catch (e) {
        msgEl.innerText = "Error connecting to server."; msgEl.style.color = "#e74c3c";
    }
}

async function confirmBooking(id) {
    const payBtn = document.getElementById("payBtn");
    const promoInput = document.getElementById("promoCodeInput");
    const promoCodeVal = promoInput ? promoInput.value.trim() : "";

    payBtn.innerHTML = "Processing Payment... ⏳"; payBtn.classList.add("processing-btn"); payBtn.disabled = true;

    try {
        const res = await fetch(`${apiBase}/Bookings/confirm`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ seatId: id, userId: loggedInUser, promoCode: promoCodeVal })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.paymentUrl.includes("callback?success=true")) await fetch(data.paymentUrl);
            else {
                localStorage.setItem("pendingTicketSeatId", id);
                document.getElementById("action-area").innerHTML = `<p style="color:#27ae60; font-weight:bold;">Redirecting to Paymob...</p>`;
                window.location.href = data.paymentUrl;
            }
        } else {
            showToast("Booking expired!", "#e74c3c");
            payBtn.innerHTML = "Pay with Paymob 🌐"; payBtn.classList.remove("processing-btn"); payBtn.disabled = false;
        }
    } catch (e) {
        showToast("Connection error", "#e74c3c");
        payBtn.innerHTML = "Pay with Paymob 🌐"; payBtn.classList.remove("processing-btn"); payBtn.disabled = false;
    }
}

async function payWithWallet(id) {
    const promoInput = document.getElementById("promoCodeInput");
    const promoCodeVal = promoInput ? promoInput.value.trim() : "";

    try {
        const res = await fetch(`${apiBase}/Wallet/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ seatId: id, username: loggedInUser, promoCode: promoCodeVal })
        });
        if (res.ok) {
            document.getElementById("action-area").innerHTML = "";
            myLockedSeats.delete(id); saveMyLockedSeats();
            showToast("Payment successful via Wallet! 🎉", "#27ae60");
            showTicket(id);
            loadWalletBalance();
        } else {
            const err = await res.json();
            showToast(err.Message || "Insufficient funds or invalid booking.", "#e74c3c");
        }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

async function adminCreatePromo() {
    const c = document.getElementById("newPromoCode").value, d = document.getElementById("newPromoDiscount").value, u = document.getElementById("newPromoLimit").value;
    if (!c || !d || !u) return showToast("Please fill promo code details", "#e74c3c");
    try {
        const res = await fetch(`${apiBase}/PromoCodes`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ code: c, discountPercentage: parseFloat(d), maxUsage: parseInt(u) })
        });
        if (res.ok) {
            showToast("Promo Code created successfully! 🎉", "#27ae60");
            document.getElementById("newPromoCode").value = ""; document.getElementById("newPromoDiscount").value = ""; document.getElementById("newPromoLimit").value = "";
        } else { showToast("Error creating promo code", "#e74c3c"); }
    } catch (e) { showToast("Connection error", "#e74c3c"); }
}

function initSignalR() {
    if (signalRConnection) signalRConnection.stop();
    signalRConnection = new signalR.HubConnectionBuilder().withUrl(hubUrl).build();

    signalRConnection.on("SeatLocked", (id, expiresAt) => {
        if (isCurrentEventExpired) return;
        const el = document.getElementById(`seat-${id}`); const seatInfo = seatNumbersMap[id] || { number: id };
        if (el) { el.className = "seat locked"; startCountdown(id, expiresAt); if (!myLockedSeats.has(id)) showToast(`Seat ${seatInfo.number} is locked`, "#f1c40f"); }
        if (userRole === "Admin") loadDashboard();
        checkWaitlistStatus();
    });

    signalRConnection.on("SeatAvailable", (id) => {
        if (isCurrentEventExpired) return;
        const el = document.getElementById(`seat-${id}`); const seatInfo = seatNumbersMap[id] || { number: id };
        if (el) { el.className = "seat available"; stopCountdown(id); myLockedSeats.delete(id); saveMyLockedSeats(); showToast(`Seat ${seatInfo.number} is available`, "#27ae60"); }
        if (userRole === "Admin") loadDashboard();
        checkWaitlistStatus();
    });

    signalRConnection.on("SeatBooked", (id) => {
        if (isCurrentEventExpired) return;
        const el = document.getElementById(`seat-${id}`); const seatInfo = seatNumbersMap[id] || { number: id };
        if (el) {
            el.className = "seat booked"; stopCountdown(id);
            if (myLockedSeats.has(id)) {
                myLockedSeats.delete(id); saveMyLockedSeats(); document.getElementById("action-area").innerHTML = "";
                localStorage.setItem(`booked_${currentEventId}_${loggedInUser}`, "true");
            } else { showToast(`Seat ${seatInfo.number} was sold`, "#e74c3c"); }
        }
        if (userRole === "Admin") loadDashboard();
        checkWaitlistStatus();
    });

    signalRConnection.on("DashboardUpdate", () => {
        if (userRole === "Admin") loadDashboard();
    });

    signalRConnection.start();
}

function checkWaitlistStatus() {
    if (userRole === "Admin" || isCurrentEventExpired) return;
    const allSeats = document.querySelectorAll(".seat");
    if (allSeats.length === 0) return;

    let available = 0;
    allSeats.forEach(s => { if (s.classList.contains("available") || s.classList.contains("locked")) available++; });

    const waitlistArea = document.getElementById("waitlist-area");
    const isWaitlisted = localStorage.getItem(`waitlist_${currentEventId}_${loggedInUser}`);
    const justBookedItMyself = localStorage.getItem(`booked_${currentEventId}_${loggedInUser}`);

    if (available === 0) {
        if (isWaitlisted) {
            waitlistArea.innerHTML = `<div style="background: #e8f8f5; padding: 15px; border-radius: 10px; border: 2px dashed #27ae60; text-align: center; margin-top: 30px; margin-bottom: 20px;"><p style="color: #27ae60; font-weight: bold; margin: 0;">✅ You are on the waitlist. We will email you if tickets become available!</p></div>`;
        } else if (!justBookedItMyself) {
            waitlistArea.innerHTML = `
                <div style="background: #fdf2e9; padding: 20px; border-radius: 10px; border: 2px dashed #e67e22; text-align: center; margin-top: 30px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #d35400;">🚨 Sold Out!</h3>
                    <p style="margin: 0 0 15px 0; color: #333; font-size: 14px;">No seats available right now. Join the waitlist to get an email notification if new tickets are released!</p>
                    <button onclick="joinWaitlist(${currentEventId})" style="background: #e67e22; width: 250px; font-size: 16px;">🔔 Join Waitlist</button>
                </div>
            `;
        }
    } else {
        waitlistArea.innerHTML = "";
    }
}

function showTicket(seatId) {
    const seatInfo = seatNumbersMap[seatId] || { number: "S-??" };
    document.getElementById("t-user").innerText = loggedInUser || "Guest";
    document.getElementById("t-event").innerText = currentEventName || "Hussein Stadium Event";
    document.getElementById("t-seat").innerText = seatInfo.number;
    document.getElementById("ticketModal").classList.remove("hidden");
    const qrContainer = document.getElementById("qrcode-container"); qrContainer.innerHTML = "";
    setTimeout(() => {
        const safeQrData = `TICKET|${seatId}|${loggedInUser}`;
        new QRCode(qrContainer, { text: safeQrData, width: 128, height: 128, colorDark: "#2c3e50", colorLight: "#ffffff" });
    }, 100);
}

function showTicketFromHistory(seatId, eventName, seatNumber) {
    document.getElementById("t-user").innerText = loggedInUser || "Guest";
    document.getElementById("t-event").innerText = eventName;
    document.getElementById("t-seat").innerText = seatNumber;
    document.getElementById("ticketModal").classList.remove("hidden");
    const qrContainer = document.getElementById("qrcode-container"); qrContainer.innerHTML = "";
    setTimeout(() => {
        const safeQrData = `TICKET|${seatId}|${loggedInUser}`;
        new QRCode(qrContainer, { text: safeQrData, width: 128, height: 128, colorDark: "#2c3e50", colorLight: "#ffffff" });
    }, 100);
}

function closeTicket() { document.getElementById("ticketModal").classList.add("hidden"); }

function downloadTicket() {
    const element = document.getElementById('ticketToPrint'); const seatNumber = document.getElementById("t-seat").innerText;
    const opt = { margin: 0, filename: `Ticket_${loggedInUser}_${seatNumber}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: [100, 150], orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
}

function startCountdown(id, expiresAt) {
    stopCountdown(id); if (isCurrentEventExpired) return;
    const el = document.getElementById(`seat-${id}`); const timerEl = document.createElement("div"); timerEl.className = "timer-text"; el.appendChild(timerEl);
    const endTime = new Date(expiresAt).getTime();
    activeTimers[id] = setInterval(() => {
        const now = new Date().getTime(); const distance = endTime - now;
        if (distance < 0) { stopCountdown(id); return; }
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timerEl.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
}

function stopCountdown(id) {
    if (activeTimers[id]) { clearInterval(activeTimers[id]); delete activeTimers[id]; }
    const el = document.getElementById(`seat-${id}`); const timer = el?.querySelector(".timer-text"); if (timer) timer.remove();
}

function openScanner() {
    document.getElementById("scannerModal").classList.remove("hidden");
    document.getElementById("scanResult").innerText = "Please allow camera access...";
    document.getElementById("scanResult").style.color = "#333";
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    html5QrcodeScanner.render(onScanSuccess, () => { });
}

async function onScanSuccess(decodedText, decodedResult) {
    html5QrcodeScanner.pause(true);
    document.getElementById("scanResult").innerText = "Validating ticket... ⏳";
    document.getElementById("scanResult").style.color = "#f1c40f";
    try {
        const res = await fetch(`${apiBase}/Bookings/validate`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ qrData: decodedText })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.isValid) { document.getElementById("scanResult").innerText = "✅ " + data.message; document.getElementById("scanResult").style.color = "#27ae60"; }
            else { document.getElementById("scanResult").innerText = "❌ " + data.message; document.getElementById("scanResult").style.color = "#e74c3c"; }
        } else { document.getElementById("scanResult").innerText = "❌ System Error!"; document.getElementById("scanResult").style.color = "#e74c3c"; }
    } catch (e) { document.getElementById("scanResult").innerText = "❌ Connection Error!"; document.getElementById("scanResult").style.color = "#e74c3c"; }
    setTimeout(() => {
        if (html5QrcodeScanner) html5QrcodeScanner.resume();
        document.getElementById("scanResult").innerText = "Ready for next scan..."; document.getElementById("scanResult").style.color = "#333";
    }, 4000);
}

function closeScanner() {
    document.getElementById("scannerModal").classList.add("hidden");
    if (html5QrcodeScanner) { html5QrcodeScanner.clear(); html5QrcodeScanner = null; }
}

async function loadDashboard() {
    try {
        const res = await fetch(`${apiBase}/Admin/dashboard`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            document.getElementById("stat-events").innerText = data.totalEvents; document.getElementById("stat-users").innerText = data.totalUsers;
            document.getElementById("stat-seats").innerText = data.totalBookedSeats; document.getElementById("stat-revenue").innerText = data.totalRevenue + " EGP";
            const ctx = document.getElementById('adminChart').getContext('2d');
            if (adminChartInstance) adminChartInstance.destroy();
            adminChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Total Events', 'Total Users', 'Booked Seats'],
                    datasets: [{ label: 'System Overview', data: [data.totalEvents, data.totalUsers, data.totalBookedSeats], backgroundColor: ['rgba(52, 152, 219, 0.8)', 'rgba(142, 68, 173, 0.8)', 'rgba(231, 76, 60, 0.8)'], borderColor: ['#2980b9', '#8e44ad', '#c0392b'], borderWidth: 1, borderRadius: 5 }]
                },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
            });
        }
    } catch (e) { console.error(e); }
}

// ----------------- تعديل دالة إنشاء الإيفينت لإرسال الـ Category -----------------
async function adminCreateEvent() {
    const btn = document.getElementById("btnCreateEvent");
    btn.disabled = true;
    btn.innerText = "Creating Event... Please Wait ⏳";

    const n = document.getElementById("newEvName").value,
        d = document.getElementById("newEvDate").value,
        v = document.getElementById("newEvVenue").value,
        regSeats = document.getElementById("newEvRegSeats").value,
        vipSeats = document.getElementById("newEvVipSeats").value,
        p = document.getElementById("newEvPrice").value,
        maxTickets = document.getElementById("newEvMaxTickets").value,
        category = document.getElementById("newEvCategory") ? document.getElementById("newEvCategory").value : "General";

    if (!n || !d || !v || !regSeats || !vipSeats || !p || !maxTickets) {
        btn.disabled = false;
        btn.innerText = "Create Event & Generate Seats";
        return showToast("Please fill all event details", "#e74c3c");
    }

    try {
        const evRes = await fetch(`${apiBase}/Events`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: n,
                eventDate: new Date(d).toISOString(),
                venue: v,
                maxTicketsPerUser: parseInt(maxTickets),
                category: category // إرسال الفئة للباك إند
            })
        });

        if (evRes.ok) {
            const evData = await evRes.json();
            await fetch(`${apiBase}/Events/${evData.eventId}/seats`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    regularSeatsCount: parseInt(regSeats),
                    vipSeatsCount: parseInt(vipSeats),
                    pricePerSeat: parseFloat(p)
                })
            });
            showToast("Event & Seats created successfully! 🎉", "#27ae60");
            loadDashboard(); fetchAdminEvents(1);

            document.getElementById("newEvName").value = ""; document.getElementById("newEvDate").value = "";
            document.getElementById("newEvVenue").value = ""; document.getElementById("newEvRegSeats").value = "";
            document.getElementById("newEvVipSeats").value = ""; document.getElementById("newEvPrice").value = "";
            document.getElementById("newEvMaxTickets").value = "1";
        }
    } catch (e) {
        showToast("Error creating event", "#e74c3c");
    }

    btn.disabled = false;
    btn.innerText = "Create Event & Generate Seats";
}