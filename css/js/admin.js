/* * =========================================
 * TURKAY SPACE - ADMIN PANEL JAVASCRIPT
 * (TÜM GÜNCELLEMELER DAHİL - FİNAL SÜRÜM)
 * =========================================
 */

// * 1. GEREKLİ TÜM FONKSİYONLARI İÇE AKTAR
// ----------------------------------------------
import { 
    db, auth, storage, // Ana servisler
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, // Giriş
    collection, addDoc, onSnapshot, deleteDoc, doc, getDocs, // Firestore (Okuma/Yazma)
    updateDoc, query, where, writeBatch, // Firestore (Güncelleme/Sorgu)
    ref, uploadBytes, getDownloadURL // Storage (Dosya Yükleme)
} from './firebase-config.js';

// * 2. İZİN VERİLEN YÖNETİCİ E-POSTA LİSTESİ
// ----------------------------------------------
// Sadece bu listedeki Google hesapları panele erişebilir.
const ADMIN_EMAIL_LIST = [
    'osmane722@gmail.com'
    // , 'baska.bir.yonetici@gmail.com' // Başkalarını eklemek için virgül koy
];

// * 3. DOM ELEMENTLERİNİ SEÇ
// ----------------------------------------------
// Ekranlar
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Giriş Formu
const googleLoginButton = document.getElementById('google-login-button');
const loginErrorMsg = document.getElementById('login-error-msg');

// Kontrol Paneli
const adminEmailDisplay = document.getElementById('admin-email-display');
const logoutButton = document.getElementById('logout-button');

// Sekmeler (Tabs)
const tabButtons = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

// Dashboard Elementleri
const totalProjectsStat = document.getElementById('total-projects-stat');
const totalEventsStat = document.getElementById('total-events-stat');
const approvedMembersStat = document.getElementById('approved-members-stat');
const pendingMembersStat = document.getElementById('pending-members-stat');
const memberChartCanvas = document.getElementById('member-chart');
let memberChartInstance = null; // Grafik çakışmasını önlemek için

// Proje Formu
const addProjectForm = document.getElementById('add-project-form');
const projectTitle = document.getElementById('project-title');
const projectCategory = document.getElementById('project-category');
const projectDesc = document.getElementById('project-desc');
const projectImageFile = document.getElementById('project-image-file');
const uploadStatus = document.getElementById('upload-status');
const addProjectButton = document.getElementById('add-project-button');
const projectFormStatus = document.getElementById('project-form-status');
const projectListContainer = document.getElementById('project-list-admin');

// Etkinlik Formu Elementleri
const addEventForm = document.getElementById('add-event-form');
const eventTitle = document.getElementById('event-title');
const eventDate = document.getElementById('event-date');
const eventLocation = document.getElementById('event-location');
const eventDesc = document.getElementById('event-desc');
const addEventButton = document.getElementById('add-event-button');
const eventFormStatus = document.getElementById('event-form-status');
const eventListContainer = document.getElementById('event-list-admin');

// Üye Listesi
const memberListContainer = document.getElementById('member-list-admin');
const approveAllButton = document.getElementById('approve-all-button');


// * 4. ANA KONTROLCÜ: GİRİŞ DURUMUNU DİNLE
// ----------------------------------------------
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- KULLANICI GİRİŞ YAPMIŞ ---
        
        // * YETKİ KONTROLÜ
        if (ADMIN_EMAIL_LIST.includes(user.email)) {
            // --- KULLANICI YETKİLİ (ADMİN) ---
            console.log('Yetkili admin giriş yaptı:', user.email);
            loginScreen.style.display = 'none';
            dashboardScreen.style.display = 'flex';
            adminEmailDisplay.textContent = user.email;

            // Dashboard verilerini yükle (Ana istatistikler)
            loadDashboardData(); 

            // Diğer sekmelerin verilerini yükle (anlık dinleme)
            loadAdminProjects(); 
            loadAdminEvents();
            loadMemberApplications(); 

        } else {
            // --- KULLANICI YETKİSİZ ---
            console.warn('Yetkisiz e-posta giriş denemesi:', user.email);
            loginScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
            loginErrorMsg.textContent = 'Erişim Reddedildi. Bu e-posta adresi yönetici olarak tanımlanmamış.';
            loginErrorMsg.style.display = 'block';
            
            // Yetkisiz kullanıcıyı derhal sistemden at
            signOut(auth);
        }

    } else {
        // --- KULLANICI GİRİŞ YAPMAMIŞ (VEYA ÇIKIŞ YAPMIŞ) ---
        console.log('Oturum kapalı.');
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }
});

// * 5. GİRİŞ VE ÇIKIŞ İŞLEMLERİ
// ----------------------------------------------

// GOOGLE İLE GİRİŞ YAPMA
googleLoginButton.addEventListener('click', async () => {
    googleLoginButton.disabled = true;
    googleLoginButton.innerHTML = '<i class="fab fa-google"></i> Lütfen Bekleyin...';
    loginErrorMsg.style.display = 'none'; 

    const provider = new GoogleAuthProvider(); 

    try {
        const result = await signInWithPopup(auth, provider);
        // (Giriş başarılıysa 'onAuthStateChanged' tetiklenecek)
        console.log('Google girişi başarılı:', result.user.email);
    
    } catch (error) {
        console.error('Google giriş hatası:', error.code);
        if (error.code !== 'auth/popup-closed-by-user') {
            loginErrorMsg.textContent = `Hata: ${error.message}`;
            loginErrorMsg.style.display = 'block';
        }
    
    } finally {
        googleLoginButton.disabled = false;
        googleLoginButton.innerHTML = '<i class="fab fa-google"></i> Google ile Giriş Yap';
    }
});

// ÇIKIŞ YAPMA
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // (Çıkış başarılıysa 'onAuthStateChanged' tetiklenecek)
    } catch (error) {
        console.error('Çıkış hatası:', error);
    }
});

// * 6. KONTROL PANELİ SEKMELERİ (TABS)
// ----------------------------------------------
tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTabId = button.getAttribute('data-tab'); 
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(targetTabId).style.display = 'block';
    });
});

// * 7. DASHBOARD VERİ YÜKLEME VE GRAFİK ÇİZME
// ----------------------------------------------
async function loadDashboardData() {
    try {
        // Verileri bir kez (getDocs) ve paralel (Promise.all) olarak çek
        const [projectSnap, eventSnap, approvedSnap, pendingSnap] = await Promise.all([
            getDocs(collection(db, "projects")),
            getDocs(collection(db, "events")),
            getDocs(query(collection(db, "newMembers"), where("status", "==", "approved"))),
            getDocs(query(collection(db, "newMembers"), where("status", "==", "pending")))
        ]);

        // Toplam sayıları al
        const projectCount = projectSnap.size;
        const eventCount = eventSnap.size;
        const approvedCount = approvedSnap.size;
        const pendingCount = pendingSnap.size;

        // İstatistik Kartlarını Güncelle
        totalProjectsStat.innerText = projectCount;
        totalEventsStat.innerText = eventCount;
        approvedMembersStat.innerText = approvedCount;
        pendingMembersStat.innerText = pendingCount;

        // Grafiği çiz
        renderMemberChart(approvedCount, pendingCount);

    } catch (error) {
        console.error("Dashboard verileri yüklenirken hata oluştu: ", error);
        // Hata olursa kartlarda 'Hata' yaz
        totalProjectsStat.innerText = 'Hata';
        totalEventsStat.innerText = 'Hata';
        approvedMembersStat.innerText = 'Hata';
        pendingMembersStat.innerText = 'Hata';
    }
}

// Grafik Çizme Fonksiyonu
function renderMemberChart(approvedCount, pendingCount) {
    if (memberChartInstance) {
        memberChartInstance.destroy(); // Eğer varsa eski grafiği yok et
    }

    const ctx = memberChartCanvas.getContext('2d');
    memberChartInstance = new Chart(ctx, {
        type: 'doughnut', // 'pie' veya 'doughnut' (Halka)
        data: {
            labels: [
                'Onaylı Üyeler',
                'Bekleyen Başvurular'
            ],
            datasets: [{
                label: 'Üye Durumu',
                data: [approvedCount, pendingCount],
                backgroundColor: [
                    '#28a745', // Onaylı (Yeşil)
                    '#ffc107'  // Bekleyen (Sarı)
                ],
                borderColor: [ // Tema ile uyumlu kenarlık
                    '#28a745',
                    '#ffc107'
                ],
                borderWidth: 1,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-main)' // Yazı rengi
                    }
                }
            }
        }
    });
}


// * 8. PROJE YÖNETİMİ (CRUD + Storage)
// ----------------------------------------------

// C - CREATE (Proje Ekleme - Dosya Yüklemeli)
addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addProjectButton.disabled = true;
    addProjectButton.innerText = "Yükleniyor...";
    
    const file = projectImageFile.files[0];
    if (!file) {
        alert("Lütfen bir proje görseli seçin.");
        addProjectButton.disabled = false;
        addProjectButton.innerText = "Projeyi Kaydet";
        return;
    }

    uploadStatus.textContent = "Görsel yükleniyor, lütfen bekleyin...";
    uploadStatus.className = 'form-status-message loading';
    uploadStatus.style.display = 'block';

    try {
        const storageRef = ref(storage, `project-images/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        uploadStatus.textContent = "Görsel yüklendi, URL alınıyor...";

        const imageUrl = await getDownloadURL(uploadResult.ref);
        uploadStatus.textContent = "URL alındı, veritabanına kaydediliyor...";

        const newProject = {
            title: projectTitle.value,
            category: projectCategory.value,
            description: projectDesc.value,
            imageUrl: imageUrl, // Yüklenen dosyanın URL'si
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, "projects"), newProject);
        
        projectFormStatus.className = 'form-status-message success';
        projectFormStatus.textContent = `Proje başarıyla eklendi.`;
        addProjectForm.reset(); 
        uploadStatus.style.display = 'none'; 

    } catch (error) {
        console.error("Proje eklenirken hata: ", error);
        projectFormStatus.className = 'form-status-message error';
        projectFormStatus.textContent = 'Hata: Proje eklenemedi. (Storage veya Firestore hatası)';
        uploadStatus.style.display = 'none';
    
    } finally {
        addProjectButton.disabled = false;
        addProjectButton.innerText = "Projeyi Kaydet";
        setTimeout(() => { 
            projectFormStatus.textContent = ''; 
            projectFormStatus.className = 'form-status-message';
        }, 4000);
    }
});

// R - READ (Projeleri Anlık Oku)
function loadAdminProjects() {
    const projectsRef = collection(db, "projects");
    
    onSnapshot(projectsRef, (querySnapshot) => {
        projectListContainer.innerHTML = ''; 
        if (querySnapshot.empty) {
            projectListContainer.innerHTML = '<p>Henüz proje eklenmemiş.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item-admin';
            projectItem.innerHTML = `
                <div>
                    <h4>${project.title}</h4>
                    <span>Kategori: ${project.category}</span>
                </div>
                <button class="delete-project-btn" data-id="${doc.id}"><i class="fas fa-trash"></i> Sil</button>
            `;
            projectListContainer.appendChild(projectItem);
        });
        
        attachProjectDeleteListeners();
    });
}

// D - DELETE (Proje Silme Butonlarını Dinle)
function attachProjectDeleteListeners() {
    const deleteButtons = projectListContainer.querySelectorAll('.delete-project-btn');
    
    deleteButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            if (!confirm(`Bu projeyi kalıcı olarak silmek istediğinize emin misiniz?`)) {
                return;
            }
            try {
                // Not: Bu kod Storage'daki görseli silmez, sadece veritabanı kaydını siler.
                const docRef = doc(db, "projects", docId);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Proje silinirken hata: ", error);
                alert("Hata: Proje silinemedi.");
            }
        });
    });
}


// * 9. ETKİNLİK YÖNETİMİ (CRUD)
// ----------------------------------------------

// C - CREATE (Etkinlik Ekleme)
addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addEventButton.disabled = true;

    const newEvent = {
        title: eventTitle.value,
        date: eventDate.value, // YYYY-MM-DD formatında
        location: eventLocation.value,
        description: eventDesc.value,
        createdAt: new Date()
    };

    try {
        const docRef = await addDoc(collection(db, "events"), newEvent);
        
        eventFormStatus.className = 'form-status-message success';
        eventFormStatus.textContent = `Etkinlik başarıyla eklendi.`;
        addEventForm.reset();
    
    } catch (error) {
        console.error("Etkinlik eklenirken hata: ", error);
        eventFormStatus.className = 'form-status-message error';
        eventFormStatus.textContent = 'Hata: Etkinlik eklenemedi.';
    
    } finally {
        addEventButton.disabled = false;
        setTimeout(() => { 
            eventFormStatus.textContent = ''; 
            eventFormStatus.className = 'form-status-message';
        }, 3000);
    }
});

// R - READ (Etkinlikleri Anlık Oku)
function loadAdminEvents() {
    const eventsRef = collection(db, "events");
    
    onSnapshot(eventsRef, (querySnapshot) => {
        eventListContainer.innerHTML = ''; 
        if (querySnapshot.empty) {
            eventListContainer.innerHTML = '<p>Henüz etkinlik eklenmemiş.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventItem = document.createElement('div');
            eventItem.className = 'project-item-admin'; // (Aynı stili kullanıyoruz)
            eventItem.innerHTML = `
                <div>
                    <h4>${event.title}</h4>
                    <span>Tarih: ${event.date}</span>
                </div>
                <button class="delete-event-btn" data-id="${doc.id}"><i class="fas fa-trash"></i> Sil</button>
            `;
            eventListContainer.appendChild(eventItem);
        });
        
        attachEventDeleteListeners();
    });
}

// D - DELETE (Etkinlik Silme Butonlarını Dinle)
function attachEventDeleteListeners() {
    const deleteButtons = eventListContainer.querySelectorAll('.delete-event-btn');
    
    deleteButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            if (!confirm(`Bu etkinliği kalıcı olarak silmek istediğinize emin misiniz?`)) {
                return;
            }
            try {
                const docRef = doc(db, "events", docId);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Etkinlik silinirken hata: ", error);
                alert("Hata: Etkinlik silinemedi.");
            }
        });
    });
}


// * 10. ÜYE BAŞVURULARI (READ, UPDATE, DELETE)
// ----------------------------------------------

// R - READ (Üyeleri Oku - Sadece bekleyenleri)
function loadMemberApplications() {
    // Sadece 'status' alanı 'pending' olanları getir
    const membersQuery = query(collection(db, "newMembers"), where("status", "==", "pending"));
    
    onSnapshot(membersQuery, (querySnapshot) => {
        memberListContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            memberListContainer.innerHTML = '<p>Henüz yeni üye başvurusu yok.</p>';
            approveAllButton.style.display = 'none'; // Butonu gizle
            return;
        }

        // Başvuru varsa "Tümünü Onayla" butonunu göster
        approveAllButton.style.display = 'inline-block';

        querySnapshot.forEach((doc) => {
            const member = doc.data();
            const memberItem = document.createElement('div');
            memberItem.className = 'project-item-admin';
            memberItem.innerHTML = `
                <div>
                    <h4>${member.name} (${member.year}. Sınıf)</h4>
                    <span>${member.department} - ${member.email}</span>
                </div>
                <div class="member-item-actions">
                    <button class="btn-admin-action btn-approve" data-id="${doc.id}">
                        <i class="fas fa-check"></i> Onayla
                    </button>
                    <button class="btn-admin-action btn-reject" data-id="${doc.id}">
                        <i class="fas fa-trash"></i> Reddet
                    </button>
                </div>
            `;
            memberListContainer.appendChild(memberItem);
        });
        
        // Butonlara görevlerini ata
        attachMemberActionListeners();
    });
}

// U - UPDATE (Onayla) ve D - DELETE (Reddet) Butonlarını Dinle
function attachMemberActionListeners() {
    
    // Onayla Butonları
    const approveButtons = memberListContainer.querySelectorAll('.btn-approve');
    approveButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            const docRef = doc(db, "newMembers", docId);
            try {
                // Durumu 'approved' olarak güncelle
                await updateDoc(docRef, {
                    status: 'approved'
                });
                // (onSnapshot sayesinde liste otomatik güncellenecek)
            } catch (error) {
                console.error("Başvuru onaylanırken hata: ", error);
                alert("Hata: Başvuru onaylanamadı.");
            }
        });
    });

    // Reddet (Sil) Butonları
    const rejectButtons = memberListContainer.querySelectorAll('.btn-reject');
    rejectButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async (e) => {
            const docId = e.currentTarget.getAttribute('data-id');
            if (!confirm(`Bu üye başvurusunu kalıcı olarak silmek (reddetmek) istediğinize emin misiniz?`)) {
                return;
            }
            try {
                const docRef = doc(db, "newMembers", docId);
                await deleteDoc(docRef);
                // (onSnapshot sayesinde liste otomatik güncellenecek)
            } catch (error) {
                console.error("Başvuru silinirken hata: ", error);
                alert("Hata: Başvuru silinemedi.");
            }
        });
    });
}

// U - UPDATE (Tümünü Onayla) Butonu
approveAllButton.addEventListener('click', async () => {
    if (!confirm(`Listede bekleyen tüm başvuruları onaylamak istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
        return;
    }

    approveAllButton.disabled = true;
    approveAllButton.innerText = "İşleniyor...";

    try {
        // 1. 'pending' durumundaki tüm belgeleri SADECE BİR KEZ ÇEK (getDocs)
        const membersQuery = query(collection(db, "newMembers"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(membersQuery);

        if (querySnapshot.empty) {
            alert("Onaylanacak yeni başvuru bulunamadı.");
            return;
        }

        // 2. Toplu işlem (Batch) başlat
        const batch = writeBatch(db);

        // 3. Çekilen her belgenin referansını al ve 'approved' olarak güncellemek üzere batch'e ekle
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "approved" });
        });

        // 4. Tüm işlemleri tek seferde sunucuya gönder
        await batch.commit();
        
        console.log("Tüm başvurular onaylandı.");
        // (onSnapshot sayesinde liste otomatik olarak güncellenecek)

    } catch (error) {
        console.error("Toplu onaylama sırasında hata: ", error);
        alert("Hata: Başvurular onaylanamadı.");
    } finally {
        approveAllButton.disabled = false;
        approveAllButton.innerHTML = '<i class="fas fa-check-double"></i> Tümünü Onayla';
    }
});