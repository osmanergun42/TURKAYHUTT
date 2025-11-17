/* * =========================================
 * TURKAY SPACE - ANA JAVASCRIPT DOSYASI
 * (TÜM GÜNCELLEMELER DAHİL - FİNAL SÜRÜM)
 * =========================================
 */

// * 1. FIREBASE BAĞLANTISINI İÇE AKTARMA
// ----------------------------------------------
// Projeleri/Etkinlikleri okumak (getDocs, collection)
// Mesaj/Üye başvurusu yazmak (addDoc) için:
import { db, auth, collection, getDocs, addDoc } from './firebase-config.js';


/* * -----------------------------------------
 * 2. 'DOMContentLoaded' - Sayfa hazır olduğunda başla
 * -----------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // * 3. PRELOADER KONTROLÜ
    // ----------------------------------------------
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('loaded'); // CSS animasyonunu tetikle
                setTimeout(() => {
                    preloader.style.display = 'none'; // Tamamen gizle
                }, 600);
            }
        }, 1000); // 1 saniye bekle
    });

    
    // * 4. MOBİL MENÜ TOGGLE
    // ----------------------------------------------
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // * 5. NAVBAR SCROLL EFEKTİ
    // ----------------------------------------------
    const header = document.querySelector('.site-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(11, 13, 23, 0.95)';
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
            } else {
                header.style.background = 'rgba(11, 13, 23, 0.8)';
                header.style.boxShadow = 'none';
            }
        });
    }

    // * 6. AKTİF MENÜ LİNKİ VURGULAMA
    // ----------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    const navLi = document.querySelectorAll('.nav-links li a');
    window.addEventListener('scroll', () => {
        let current = 'hero'; // Varsayılan olarak hero
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        navLi.forEach(a => {
            a.classList.remove('active');
            // href="#id" formatında olduğu için '#' işaretini hesaba katıyoruz
            if (a.getAttribute('href') && a.getAttribute('href').includes(current) && current !== "") {
                a.classList.add('active');
            }
        });
    });

    // * 7. PROJELERİ FIREBASE'DEN YÜKLE (Detay Modalı için güncellendi)
    // ----------------------------------------------
    async function loadProjects() {
        const projectListContainer = document.getElementById('project-list');
        if (!projectListContainer) return; 

        try {
            projectListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Projeler yükleniyor...</p>';
            
            const projectsCollectionRef = collection(db, 'projects');
            const querySnapshot = await getDocs(projectsCollectionRef);
            
            projectListContainer.innerHTML = ''; 

            if (querySnapshot.empty) {
                projectListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Henüz gösterilecek proje yok.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const projectData = doc.data();
                
                // HTML'deki tırnak işaretlerinin bozulmaması için veriyi güvenli hale getir
                const safeDescription = (projectData.description || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const safeTitle = (projectData.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

                const projectCardHTML = `
                    <div class="card project-card">
                        <div class="card-image">
                            <img src="${projectData.imageUrl || 'https://placehold.co/800x600/0B0D17/3A86FF?text=Görsel+Yok'}" alt="${projectData.title}">
                            <div class="category-tag">${projectData.category || 'Proje'}</div>
                        </div>
                        <div class="card-content">
                            <h3>${projectData.title}</h3>
                            <p>${projectData.description}</p>
                            
                            <!-- 'data-' etiketleri ile modalı tetikleyecek link -->
                            <a href="#" class="read-more open-project-detail" 
                               data-title="${safeTitle}"
                               data-category="${projectData.category || 'Proje'}"
                               data-image-url="${projectData.imageUrl || 'https://placehold.co/800x600/0B0D17/3A86FF?text=Görsel+Yok'}"
                               data-description="${safeDescription}">
                               Detayları İncele <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                `;
                projectListContainer.innerHTML += projectCardHTML;
            });

        } catch (error) {
            console.error("Projeler yüklenirken hata oluştu: ", error);
            projectListContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Projeler yüklenemedi.</p>';
        }
    }
    loadProjects(); // Projeleri yükle


    // * 8. ETKİNLİKLERİ FIREBASE'DEN YÜKLE (Statik olanlar kaldırıldı)
    // ----------------------------------------------
    
    // Tarihi formatlamak için yardımcı fonksiyon
    function formatEventDate(dateString) {
        // 'YYYY-MM-DD' formatındaki tarihi 'T00:00:00' ekleyerek saat dilimi
        // sorunlarından kaçınıyoruz (özellikle 'gün' kaymalarından)
        if (!dateString) return { day: '?', month: '?'}; // Tarih yoksa
        const date = new Date(dateString + 'T00:00:00');
        const day = date.getDate();
        // 'tr-TR' (Türkçe) lokasyonuna göre 'KAS', 'ARA' gibi kısa ay ismi al
        const month = date.toLocaleString('tr-TR', { month: 'short' }).toUpperCase();
        return { day, month };
    }

    async function loadEvents() {
        const eventListContainer = document.getElementById('event-list-main');
        if (!eventListContainer) return; 

        try {
            eventListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Etkinlikler yükleniyor...</p>';
            
            const eventsCollectionRef = collection(db, 'events');
            const querySnapshot = await getDocs(eventsCollectionRef);
            
            eventListContainer.innerHTML = ''; 

            if (querySnapshot.empty) {
                eventListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Henüz planlanmış etkinlik yok.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const eventData = doc.data();
                
                // Tarihi (Day/Month) ayır
                const { day, month } = formatEventDate(eventData.date);

                // "Kayıt Ol" butonu olmayan kart yapısı
                const eventCardHTML = `
                    <div class="card event-card">
                        <div class="date-box">
                            <span class="day">${day}</span>
                            <span class="month">${month}</span>
                        </div>
                        <div class="card-content">
                            <h3>${eventData.title}</h3>
                            <!-- Açıklama (eğer varsa) -->
                            ${eventData.description ? `<p><i class="far fa-sticky-note"></i> ${eventData.description}</p>` : ''}
                            <!-- Konum -->
                            <p><i class="fas fa-map-marker-alt"></i> ${eventData.location}</p>
                        </div>
                    </div>
                `;
                eventListContainer.innerHTML += eventCardHTML;
            });

        } catch (error) {
            console.error("Etkinlikler yüklenirken hata oluştu: ", error);
            eventListContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Etkinlikler yüklenemedi.</p>';
        }
    }
    
    loadEvents(); // Etkinlikleri yükle


    // * 9. EKİP SEKMESİ (TAB) KONTROLÜ
    // ----------------------------------------------
    const teamTabs = document.querySelectorAll('.team-tab-btn');
    const teamPanes = document.querySelectorAll('.team-tab-pane');

    if (teamTabs.length > 0 && teamPanes.length > 0) {
        teamTabs.forEach((tabButton) => {
            tabButton.addEventListener('click', () => {
                
                const targetTabId = tabButton.getAttribute('data-tab');
                teamTabs.forEach(btn => btn.classList.remove('active'));
                tabButton.classList.add('active');
                teamPanes.forEach(pane => pane.classList.remove('active'));

                const targetPane = document.getElementById(targetTabId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
    
    // * 10. İLETİŞİM FORMU GÖNDERME
    // ----------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submit-button');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            submitButton.disabled = true;
            submitButton.innerText = "Gönderiliyor...";
            formStatus.className = 'form-status-message loading';
            formStatus.textContent = 'Lütfen bekleyin...';

            const formData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                subject: contactForm.subject.value,
                message: contactForm.message.value,
                sentAt: new Date()
            };

            try {
                const docRef = await addDoc(collection(db, "messages"), formData);
                formStatus.className = 'form-status-message success';
                formStatus.textContent = 'Mesajınız başarıyla gönderildi. Teşekkür ederiz!';
                contactForm.reset(); 
            } catch (error) {
                console.error("Mesaj gönderilirken hata oluştu: ", error);
                formStatus.className = 'form-status-message error';
                formStatus.textContent = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
            } finally {
                submitButton.disabled = false;
                submitButton.innerText = "Gönder";
            }
        });
    }

    // * 11. ÜYE OL MODAL KONTROLÜ
    // ----------------------------------------------
    const signupModal = document.getElementById('signup-modal');
    const openModalBtn = document.getElementById('open-signup-modal');
    const closeModalBtn = document.getElementById('close-signup-modal');

    if (signupModal && openModalBtn && closeModalBtn) {
        
        // Modal'ı aç
        openModalBtn.addEventListener('click', () => {
            signupModal.style.display = 'flex'; 
            setTimeout(() => { 
                signupModal.classList.add('active');
            }, 10);
        });

        // 'X' ile kapat
        closeModalBtn.addEventListener('click', () => {
            signupModal.classList.remove('active');
            setTimeout(() => {
                signupModal.style.display = 'none';
            }, 300);
        });

        // Arka plana tıklayarak kapat
        signupModal.addEventListener('click', (e) => {
            if (e.target === signupModal) { 
                closeModalBtn.click();
            }
        });
    }

    // * 12. ÜYE OL FORMU GÖNDERME (GÜNCELLENDİ)
    // ----------------------------------------------
    const signupForm = document.getElementById('signup-form');
    const signupStatus = document.getElementById('signup-form-status');
    const signupSubmitButton = document.getElementById('signup-submit-button');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            signupSubmitButton.disabled = true;
            signupSubmitButton.innerText = "Gönderiliyor...";
            signupStatus.className = 'form-status-message loading';
            signupStatus.textContent = 'Başvurun alınıyor...';

            // *** GÜNCELLEME BURADA: 'studentId' eklendi ***
            const memberData = {
                name: signupForm['signup-name'].value,
                email: signupForm['signup-email'].value,
                studentId: signupForm['signup-student-id'].value, // YENİ EKLENDİ
                phone: signupForm['signup-phone'].value, // YENİ EKLENDİ
                department: signupForm['signup-department'].value,
                year: signupForm['signup-year'].value,
                appliedAt: new Date(), 
                status: 'pending' 
            };
            // *** GÜNCELLEME SONU ***

            try {
                const docRef = await addDoc(collection(db, "newMembers"), memberData);
                signupStatus.className = 'form-status-message success';
                signupStatus.textContent = 'Başvurun alındı! En kısa zamanda seninle iletişime geçeceğiz.';
                signupForm.reset(); 
            } catch (error) {
                console.error("Başvuru gönderilirken hata oluştu: ", error);
                signupStatus.className = 'form-status-message error';
                signupStatus.textContent = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
            } finally {
                signupSubmitButton.disabled = false;
                signupSubmitButton.innerText = "Başvuruyu Gönder";
            }
        });
    }

    // * 13. PROJE DETAY MODALI AÇMA/KAPAMA
    // ----------------------------------------------
    
    // Modal elementlerini seç
    const projectDetailModal = document.getElementById('project-detail-modal');
    const closeProjectDetailModalBtn = document.getElementById('close-project-detail-modal');
    
    // Modal'ın içindeki placeholder'ları seç
    const projectDetailImage = document.getElementById('project-detail-image');
    const projectDetailCategory = document.getElementById('project-detail-category');
    const projectDetailTitle = document.getElementById('project-detail-title');
    const projectDetailDesc = document.getElementById('project-detail-desc');
    
    // Proje listesinin tamamını dinle (Event Delegation)
    const projectListDiv = document.getElementById('project-list');

    if (projectListDiv && projectDetailModal) {
        
        projectListDiv.addEventListener('click', (e) => {
            // Tıklanan elementin (veya ebeveyninin) 'open-project-detail' sınıfına sahip olup olmadığını kontrol et
            const targetButton = e.target.closest('.open-project-detail');
            
            if (targetButton) {
                e.preventDefault(); // Linkin sayfanın başına gitmesini engelle
                
                // 1. Veriyi 'data-' etiketlerinden al
                const title = targetButton.dataset.title;
                const category = targetButton.dataset.category;
                const imageUrl = targetButton.dataset.imageUrl;
                const description = targetButton.dataset.description;

                // 2. Veriyi modal'ın içindeki placeholder'lara yerleştir
                projectDetailTitle.innerText = title;
                projectDetailCategory.innerText = category;
                projectDetailImage.src = imageUrl;
                projectDetailDesc.innerText = description;
                
                // 3. Modal'ı göster
                projectDetailModal.style.display = 'flex';
                setTimeout(() => { 
                    projectDetailModal.classList.add('active');
                }, 10);
            }
        });

        // Modal'ı Kapatma ('X' butonu)
        closeProjectDetailModalBtn.addEventListener('click', () => {
            projectDetailModal.classList.remove('active');
            setTimeout(() => {
                projectDetailModal.style.display = 'none';
            }, 300);
        });
        
        // Modal'ı Kapatma (Arka plana tıklayarak)
        projectDetailModal.addEventListener('click', (e) => {
            if (e.target === projectDetailModal) { 
                closeProjectDetailModalBtn.click(); 
            }
        });
    }


    // * 14. KONSOL KONTROLÜ
    // ----------------------------------------------
    console.log('Main.js yüklendi ve DOMContentLoaded çalıştı.');
    
}); // DOMContentLoaded SONU