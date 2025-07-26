document.addEventListener('DOMContentLoaded', () => {
    // --- Function to check if the current page is the login page or the portal ---
    function isHomePage() {
        // Now checks for the LOGIN page (index.html)
        const path = window.location.pathname;
        return path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/index.htm');
    }

    function isBirthdayPortalPage() {
        // Now checks for the BIRTHDAY PORTAL page (homepage.html)
        const path = window.location.pathname;
        return path.endsWith('/homepage.html') || path.endsWith('/homepage.htm');
    }

    // --- Elements specific to the Birthday Portal (homepage.html) ---
    const addBirthdayBtn = document.getElementById('addBirthdayBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const birthdayModal = document.getElementById('birthdayModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const closeButtons = document.querySelectorAll('.close-button');
    const birthdayForm = document.getElementById('birthdayForm');
    const personNameInput = document.getElementById('personName');
    const birthDateInput = document.getElementById('birthDate');
    const profilePictureInput = document.getElementById('profilePicture');
    const notesInput = document.getElementById('notes');
    const birthdayIdInput = document.getElementById('birthdayId');
    const modalTitle = document.getElementById('modalTitle');
    const upcomingBirthdaysGrid = document.getElementById('upcomingBirthdaysGrid');
    const noBirthdaysMessage = document.querySelector('.no-birthdays-message');
    const todayTomorrowSection = document.querySelector('.today-tomorrow-section');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // --- Data Storage ---
    let birthdays = [];
    let birthdayToDeleteId = null;

    // --- Login & Registration Logic (runs on index.html) ---
    if (isHomePage()) {
        const loginForm = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginMessage = document.getElementById('loginMessage');

        const registerForm = document.getElementById('registerForm');
        const newUsernameInput = document.getElementById('newUsername');
        const newPasswordInput = document.getElementById('newPassword');
        const registerMessage = document.getElementById('registerMessage');

        const USERS_STORAGE_KEY = 'birthdayAppUsers';

        // Helper to get users from Local Storage
        function getUsers() {
            return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
        }

        // Helper to save users to Local Storage
        function saveUsers(users) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }

        // Handle Registration
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newUsername = newUsernameInput.value.trim();
                const newPassword = newPasswordInput.value.trim();
                registerMessage.style.display = 'none';

                if (!newUsername || !newPassword) {
                    registerMessage.textContent = 'Username and password cannot be empty.';
                    registerMessage.style.display = 'block';
                    return;
                }

                const users = getUsers();
                const userExists = users.some(user => user.username === newUsername);

                if (userExists) {
                    registerMessage.textContent = 'Username already taken. Please choose another.';
                    registerMessage.style.display = 'block';
                } else {
                    users.push({ username: newUsername, password: newPassword });
                    saveUsers(users);
                    registerMessage.textContent = 'Account created successfully! You can now log in.';
                    registerMessage.style.color = '#28a745'; // Green for success
                    registerMessage.style.display = 'block';
                    registerForm.reset();
                }
            });
        }

        // Handle Login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();
                loginMessage.style.display = 'none';

                const users = getUsers();
                const foundUser = users.find(user => user.username === username && user.password === password);

                if (foundUser) {
                    // Successful login
                    console.log('Login successful! Redirecting...');
                    localStorage.setItem('loggedIn', 'true');
                    localStorage.setItem('currentUser', username); // Store the current user
                    window.location.href = 'homepage.html'; // Redirect to the birthday portal
                } else {
                    // Failed login
                    loginMessage.textContent = 'Invalid username or password. Please try again.';
                    loginMessage.style.display = 'block';
                }
            });
        }
    }

    // --- Birthday Portal Logic (runs on homepage.html) ---
    if (isBirthdayPortalPage()) {
        const currentUser = localStorage.getItem('currentUser');

        // Check if logged in, if not, redirect to login page.
        if (localStorage.getItem('loggedIn') !== 'true' || !currentUser) {
            window.location.href = 'index.html';
            return; // Stop script execution for this page
        }

        // Birthdays are now stored per-user
        const BIRTHDAYS_STORAGE_KEY = `birthdays_${currentUser}`;

        function loadBirthdays() {
            const storedBirthdays = localStorage.getItem(BIRTHDAYS_STORAGE_KEY);
            if (storedBirthdays) {
                birthdays = JSON.parse(storedBirthdays);
            }
        }

        function saveBirthdays() {
            localStorage.setItem(BIRTHDAYS_STORAGE_KEY, JSON.stringify(birthdays));
        }

        function calculateAge(birthDate) {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }

        function getDaysUntilNextBirthday(birthDateStr) {
            const today = new Date();
            const birthDate = new Date(birthDateStr);

            let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }

            const diffTime = Math.abs(nextBirthday - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                days: diffDays,
                isToday: nextBirthday.toDateString() === today.toDateString(),
                isTomorrow: nextBirthday.toDateString() === new Date(today.setDate(today.getDate() + 1)).toDateString()
            };
        }

        function getInitials(name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }

        function createBirthdayCard(birthday) {
            const { days, isToday, isTomorrow } = getDaysUntilNextBirthday(birthday.birthDate);
            const nextAge = calculateAge(birthday.birthDate) + (isToday || isTomorrow || days > 0 ? 1 : 0);

            const card = document.createElement('div');
            card.className = 'birthday-card';
            card.dataset.id = birthday.id;

            const profilePicUrl = birthday.profilePicture || '';
            const defaultAvatarHtml = `<div class="profile-pic default-avatar">${getInitials(birthday.name)}</div>`;
            const profilePicHtml = profilePicUrl ?
                `<img src="${profilePicUrl}" alt="${birthday.name}" class="profile-pic">` :
                defaultAvatarHtml;

            let daysLeftText = '';
            let daysLeftClass = 'days-left';
            if (isToday) {
                daysLeftText = 'Today!';
                daysLeftClass += ' today';
            } else if (isTomorrow) {
                daysLeftText = 'Tomorrow!';
                daysLeftClass += ' tomorrow';
            } else {
                daysLeftText = `${days} day${days !== 1 ? 's' : ''} left`;
            }

            card.innerHTML = `
                ${profilePicHtml}
                <h3>${birthday.name}</h3>
                <p>Turns ${nextAge} on ${new Date(birthday.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                <span class="${daysLeftClass}">${daysLeftText}</span>
                <div class="actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;

            card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(birthday.id));
            card.querySelector('.delete-btn').addEventListener('click', () => openDeleteConfirmModal(birthday.id));

            return card;
        }

        function renderTodayTomorrowSection() {
            todayTomorrowSection.innerHTML = '';

            let todayBirthdays = [];
            let tomorrowBirthdays = [];

            const todayCard = document.createElement('div');
            todayCard.className = 'today-card';
            todayCard.innerHTML = '<h3>Today</h3><p>No birthdays today.</p>';

            const tomorrowCard = document.createElement('div');
            tomorrowCard.className = 'tomorrow-card';
            tomorrowCard.innerHTML = '<h3>Tomorrow</h3><p>No birthdays tomorrow.</p>';

            let foundToday = false;
            let foundTomorrow = false;

            birthdays.forEach(b => {
                const { isToday, isTomorrow } = getDaysUntilNextBirthday(b.birthDate);
                if (isToday) {
                    todayBirthdays.push(b.name);
                    foundToday = true;
                } else if (isTomorrow) {
                    tomorrowBirthdays.push(b.name);
                    foundTomorrow = true;
                }
            });

            if (foundToday) {
                todayCard.classList.remove('no-birthday');
                todayCard.innerHTML = `
                    <h3>Today's Birthday!</h3>
                    <p>${todayBirthdays.join(', ')}</p>
                    <p>Don't forget to wish them!</p>
                `;
            } else {
                todayCard.classList.add('no-birthday');
                todayCard.innerHTML = `
                    <h3>Today</h3>
                    <p>No birthdays today.</p>
                    <p>All clear!</p>
                `;
            }

            if (foundTomorrow) {
                tomorrowCard.classList.remove('no-birthday');
                tomorrowCard.innerHTML = `
                    <h3>Tomorrow's Birthday!</h3>
                    <p>${tomorrowBirthdays.join(', ')}</p>
                    <p>Get ready to celebrate!</p>
                `;
            } else {
                tomorrowCard.classList.add('no-birthday');
                tomorrowCard.innerHTML = `
                    <h3>Tomorrow</h3>
                    <p>No birthdays tomorrow.</p>
                    <p>Still some time!</p>
                `;
            }

            todayTomorrowSection.appendChild(todayCard);
            todayTomorrowSection.appendChild(tomorrowCard);
        }

        function renderBirthdays() {
            upcomingBirthdaysGrid.innerHTML = '';

            const sortedBirthdays = [...birthdays].sort((a, b) => {
                const daysA = getDaysUntilNextBirthday(a.birthDate).days;
                const daysB = getDaysUntilNextBirthday(b.birthDate).days;

                const isTodayA = getDaysUntilNextBirthday(a.birthDate).isToday;
                const isTodayB = getDaysUntilNextBirthday(b.birthDate).isToday;

                const isTomorrowA = getDaysUntilNextBirthday(a.birthDate).isTomorrow;
                const isTomorrowB = getDaysUntilNextBirthday(b.birthDate).isTomorrow;

                if (isTodayA && !isTodayB) return -1;
                if (!isTodayA && isTodayB) return 1;
                if (isTomorrowA && !isTomorrowB) return -1;
                if (!isTomorrowA && isTomorrowB) return 1;

                return daysA - daysB;
            });

            if (sortedBirthdays.length === 0) {
                noBirthdaysMessage.style.display = 'block';
            } else {
                noBirthdaysMessage.style.display = 'none';
                sortedBirthdays.forEach(birthday => {
                    upcomingBirthdaysGrid.appendChild(createBirthdayCard(birthday));
                });
            }
            renderTodayTomorrowSection();
        }

        // --- Modal Functions ---
        function openModal(modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeModal(modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (modal.id === 'birthdayModal') {
                birthdayForm.reset();
                birthdayIdInput.value = '';
            }
        }

        function openAddModal() {
            modalTitle.textContent = 'Add New Birthday';
            birthdayIdInput.value = '';
            birthdayForm.reset();
            openModal(birthdayModal);
        }

        function openEditModal(id) {
            const birthday = birthdays.find(b => b.id === id);
            if (birthday) {
                modalTitle.textContent = 'Edit Birthday';
                personNameInput.value = birthday.name;
                birthDateInput.value = birthday.birthDate;
                profilePictureInput.value = birthday.profilePicture || '';
                notesInput.value = birthday.notes || '';
                birthdayIdInput.value = birthday.id;
                openModal(birthdayModal);
            }
        }

        function openDeleteConfirmModal(id) {
            birthdayToDeleteId = id;
            openModal(deleteConfirmModal);
        }

        // --- Event Listeners for Birthday Portal ---
        addBirthdayBtn.addEventListener('click', openAddModal);

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('loggedIn'); // Clear the login flag
                localStorage.removeItem('currentUser'); // Clear the current user
                window.location.href = 'index.html'; // Redirect to login page
            });
        }

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                closeModal(e.target.closest('.modal'));
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === birthdayModal) {
                closeModal(birthdayModal);
            }
            if (e.target === deleteConfirmModal) {
                closeModal(deleteConfirmModal);
            }
        });

        birthdayForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = personNameInput.value.trim();
            const birthDate = birthDateInput.value;
            const profilePicture = profilePictureInput.value.trim();
            const notes = notesInput.value.trim();
            const id = birthdayIdInput.value;

            if (!name || !birthDate) {
                alert('Name and Birth Date are required!');
                return;
            }

            if (id) {
                const index = birthdays.findIndex(b => b.id === id);
                if (index !== -1) {
                    birthdays[index] = { ...birthdays[index], name, birthDate, profilePicture, notes };
                }
            } else {
                const newBirthday = {
                    id: Date.now().toString(),
                    name,
                    birthDate,
                    profilePicture,
                    notes
                };
                birthdays.push(newBirthday);
            }

            saveBirthdays();
            renderBirthdays();
            closeModal(birthdayModal);
        });

        confirmDeleteBtn.addEventListener('click', () => {
            if (birthdayToDeleteId) {
                birthdays = birthdays.filter(b => b.id !== birthdayToDeleteId);
                saveBirthdays();
                renderBirthdays();
                closeModal(deleteConfirmModal);
                birthdayToDeleteId = null;
            }
        });

        cancelDeleteBtn.addEventListener('click', () => {
            closeModal(deleteConfirmModal);
            birthdayToDeleteId = null;
        });

        // --- Initial Load for Birthday Portal ---
        loadBirthdays();
        renderBirthdays();
    }
});