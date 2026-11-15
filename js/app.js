/**
 * Amanuel Gebremeskel Gebremedhin - Portfolio & Real Estate Engine
 * Synchronized with official CV credentials and Ayat Real Estate Catalog
 * 
 * Rules: 
 * 1. Strictly NO numeric prices displayed per sales consultation policy.
 * 2. All contact routing points directly to Amanuel (+251 982235189, amanuelgr13@gmail.com).
 * 3. Supports high-definition video walkthroughs and PDF brochure downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
  let currentCategory = 'all';
  let searchQuery = '';
  let formImages = [];
  let isAdminAuthenticated = false;

  // DOM Elements
  const propertiesContainer = document.getElementById('propertiesContainer');
  const categoryFilters = document.getElementById('categoryFilters');
  const catalogSearch = document.getElementById('catalogSearch');
  const toastContainer = document.getElementById('toastContainer');
  const planningProjectsContainer = document.getElementById('planningProjectsContainer');

  // Property Details Modal
  const propertyDetailModal = document.getElementById('propertyDetailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const modalMainImg = document.getElementById('modalMainImg');
  const modalGalleryThumbs = document.getElementById('modalGalleryThumbs');
  const modalGalleryWrap = document.getElementById('modalGalleryWrap');
  const modalVideoWrap = document.getElementById('modalVideoWrap');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');
  const modalTabPhotosBtn = document.getElementById('modalTabPhotosBtn');
  const modalTabVideoBtn = document.getElementById('modalTabVideoBtn');
  const modalBadges = document.getElementById('modalBadges');
  const modalTitle = document.getElementById('modalTitle');
  const modalPriceETB = document.getElementById('modalPriceETB');
  const modalPriceUSD = document.getElementById('modalPriceUSD');
  const modalLocation = document.getElementById('modalLocation');
  const modalSpecsGrid = document.getElementById('modalSpecsGrid');
  const modalDescription = document.getElementById('modalDescription');
  const modalAmenitiesList = document.getElementById('modalAmenitiesList');
  const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
  const modalBrochureBtn = document.getElementById('modalBrochureBtn');

  // Standalone Video Modal
  const standaloneVideoModal = document.getElementById('standaloneVideoModal');
  const standaloneVideoPlayer = document.getElementById('standaloneVideoPlayer');
  const standaloneVideoTitle = document.getElementById('standaloneVideoTitle');
  const closeStandaloneVideoBtn = document.getElementById('closeStandaloneVideoBtn');

  // Admin Elements
  const adminModal = document.getElementById('adminModal');
  const openAdminBtn = document.getElementById('openAdminBtn');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminAuthView = document.getElementById('adminAuthView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const adminPinForm = document.getElementById('adminPinForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminTableBody = document.getElementById('adminTableBody');
  const propertyForm = document.getElementById('propertyForm');
  const imageDropzone = document.getElementById('imageDropzone');
  const imageFileInput = document.getElementById('imageFileInput');
  const imageUrlInput = document.getElementById('imageUrlInput');
  const btnAddImageUrl = document.getElementById('btnAddImageUrl');
  const formImagePreviews = document.getElementById('formImagePreviews');
  const btnQuickAdd = document.getElementById('btnQuickAdd');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const formHeaderTitle = document.getElementById('formHeaderTitle');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnTriggerImport = document.getElementById('btnTriggerImport');
  const importFileInput = document.getElementById('importFileInput');
  const changePinForm = document.getElementById('changePinForm');
  const btnResetDefaults = document.getElementById('btnResetDefaults');
  const contactForm = document.getElementById('contactForm');

  // Mobile Nav Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
  }

  /* =========================================================================
     1. Toast Notification Helper
     ========================================================================= */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
      toast.style.borderColor = 'var(--accent-crimson)';
    }
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* =========================================================================
     2. Render Properties in Catalog Grid (Strictly NO PRICES displayed)
     ========================================================================= */
  function renderProperties() {
    if (!propertiesContainer) return;
    const allProps = window.propertyManager.getAll();

    const filtered = allProps.filter(prop => {
      const matchCategory = currentCategory === 'all' || 
        prop.subCategory === currentCategory || 
        prop.category === currentCategory ||
        (prop.project && prop.project.toLowerCase().includes(currentCategory));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (prop.title && prop.title.toLowerCase().includes(q)) || 
        (prop.location && prop.location.toLowerCase().includes(q)) || 
        (prop.area && prop.area.toLowerCase().includes(q)) ||
        (prop.typology && prop.typology.toLowerCase().includes(q)) ||
        (prop.description && prop.description.toLowerCase().includes(q));
      
      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      propertiesContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 70px 20px; color: #888; font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.15em; text-transform: uppercase;">
          No matching properties found in this category.
        </div>
      `;
      return;
    }

    propertiesContainer.innerHTML = filtered.map(prop => {
      const mainImg = prop.images && prop.images.length > 0 
        ? prop.images[0] 
        : 'assets/properties/kazanchis_brochure_hero.jpg';

      const bedLabel = prop.bedrooms ? `${prop.bedrooms} Bed` : (prop.category === 'commercial' ? 'Commercial' : 'Suite');
      const areaLabel = prop.area || 'Inquire';
      const deliveryLabel = prop.deliveryTime || 'Inquire';

      const encodedMsg = encodeURIComponent(
        `Hello Amanuel, I am inquiring about the ${prop.title} in ${prop.location}. Please provide available units, layout drawings, and payment arrangements.`
      );
      const whatsappUrl = `https://wa.me/251982235189?text=${encodedMsg}`;

      return `
        <div class="project-card" data-id="${prop.id}">
          <img src="${mainImg}" alt="${prop.title}" class="project-card-image" loading="lazy" onerror="this.src='assets/properties/kazanchis_brochure_hero.jpg'">
          
          <div class="project-card-overlay">
            <span class="project-overlay-subtitle">${prop.project || 'Ayat Real Estate'} • ${bedLabel}</span>
            <h3 class="project-overlay-title">${prop.title}</h3>
            <div class="project-overlay-specs" style="color: #eee; font-weight: 600;">
              📍 ${prop.location}
            </div>
            <div class="project-overlay-specs" style="color: var(--accent-gold); font-size: 0.82rem; margin-top: -8px;">
              📐 Area: ${areaLabel} • ⏳ Delivery: ${deliveryLabel}
            </div>

            <div class="project-overlay-actions">
              <a href="javascript:void(0)" class="project-pipe-link btn-view-details" data-id="${prop.id}">| DETAILS & PLANS |</a>
              <a href="${whatsappUrl}" target="_blank" class="project-pipe-link" style="color: #25d366;">| WHATSAPP |</a>
              ${prop.videoUrl ? `<a href="javascript:void(0)" class="project-pipe-link btn-play-card-video" data-video="${prop.videoUrl}" data-title="${prop.title}">| VIDEO TOUR |</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        openPropertyDetails(id);
      });
    });

    document.querySelectorAll('.btn-play-card-video').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoSrc = btn.getAttribute('data-video');
        const title = btn.getAttribute('data-title');
        openStandaloneVideo(videoSrc, title);
      });
    });

    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A' && !e.target.closest('a')) {
          const id = card.getAttribute('data-id');
          openPropertyDetails(id);
        }
      });
    });
  }

  // Filter tab buttons
  if (categoryFilters) {
    categoryFilters.querySelectorAll('.portfolio-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryFilters.querySelectorAll('.portfolio-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-filter');
        renderProperties();
      });
    });
  }

  // Search input
  if (catalogSearch) {
    catalogSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProperties();
    });
  }

  /* =========================================================================
     3. Property Details Lightbox Modal (NO PRICE figures displayed)
     ========================================================================= */
  function openPropertyDetails(id) {
    const prop = window.propertyManager.getById(id);
    if (!prop) return;

    const images = prop.images && prop.images.length > 0 
      ? prop.images 
      : ['assets/properties/kazanchis_brochure_hero.jpg'];

    modalMainImg.src = images[0];

    // Reset visual tabs
    modalGalleryWrap.style.display = 'block';
    modalVideoWrap.style.display = 'none';
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
      modalVideoPlayer.src = '';
    }
    modalTabPhotosBtn.classList.add('active');

    // Handle video tab visibility
    if (prop.videoUrl) {
      modalTabVideoBtn.style.display = 'inline-block';
      modalTabVideoBtn.classList.remove('active');
      modalTabVideoBtn.onclick = () => {
        modalTabPhotosBtn.classList.remove('active');
        modalTabVideoBtn.classList.add('active');
        modalGalleryWrap.style.display = 'none';
        modalVideoWrap.style.display = 'block';
        modalVideoPlayer.src = prop.videoUrl;
        modalVideoPlayer.play();
      };
      modalTabPhotosBtn.onclick = () => {
        modalTabVideoBtn.classList.remove('active');
        modalTabPhotosBtn.classList.add('active');
        modalVideoWrap.style.display = 'none';
        modalGalleryWrap.style.display = 'block';
        if (modalVideoPlayer) modalVideoPlayer.pause();
      };
    } else {
      modalTabVideoBtn.style.display = 'none';
    }

    // Render Gallery Thumbnails
    modalGalleryThumbs.innerHTML = images.map((imgUrl, idx) => `
      <div class="prop-gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${imgUrl}" alt="Plan / Render ${idx + 1}" onerror="this.src='assets/properties/kazanchis_brochure_hero.jpg'">
      </div>
    `).join('');

    modalGalleryThumbs.querySelectorAll('.prop-gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        modalGalleryThumbs.querySelectorAll('.prop-gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const idx = Number(thumb.getAttribute('data-index'));
        modalMainImg.src = images[idx];
      });
    });

    // Badges
    modalBadges.innerHTML = `
      <span class="badge-pill badge-gold">${prop.project || 'Ayat Real Estate'}</span>
      <span class="badge-pill ${prop.status === 'hot' ? 'badge-crimson' : 'badge-green'}">
        ${prop.status === 'hot' ? 'HOT PROJECT' : 'FOR SALE'}
      </span>
      <span class="badge-pill badge-dark">${prop.deliveryTime || 'Under Construction'}</span>
    `;

    modalTitle.textContent = prop.title;
    modalPriceETB.textContent = "Price on Consultation";
    modalPriceUSD.textContent = prop.priceNote || "Custom milestone payment arrangements available";
    modalLocation.innerHTML = `📍 ${prop.location}`;

    // Specs Grid
    modalSpecsGrid.innerHTML = `
      <div class="prop-spec-chip">📐 Area: <strong>${prop.area || 'N/A'}</strong></div>
      <div class="prop-spec-chip">🛏️ Bedrooms: <strong>${prop.bedrooms ? prop.bedrooms + ' Beds' : (prop.category === 'commercial' ? 'Commercial' : 'Deluxe Suite')}</strong></div>
      <div class="prop-spec-chip">🚿 Bathrooms: <strong>${prop.bathrooms ? prop.bathrooms + ' Baths' : 'Multiple'}</strong></div>
      <div class="prop-spec-chip">🏢 Floor: <strong>${prop.floor || 'Various Options'}</strong></div>
      <div class="prop-spec-chip">⏳ Handover: <strong>${prop.deliveryTime || 'Inquire'}</strong></div>
      <div class="prop-spec-chip">🎨 Finishing: <strong>${prop.finishingStyle || 'Regular Finished / Semi Finished'}</strong></div>
      ${prop.typology ? `<div class="prop-spec-chip" style="flex: 1 1 100%;">🏗️ Typology Reference: <strong>${prop.typology}</strong></div>` : ''}
    `;

    modalDescription.textContent = prop.description || 'Verified property listing directly under Ayat Share Company sales portfolio.';

    const amenities = prop.amenities && prop.amenities.length > 0
      ? prop.amenities
      : [
          '24/7 Redundant High-Capacity Generator',
          'Modern High-Speed Passenger & Service Elevators',
          'Dedicated Underground Parking Stalls',
          'Municipal Cadastral Due Diligence Completed',
          'Continuous Deep Well Water Reservoirs'
        ];
    
    modalAmenitiesList.innerHTML = amenities.map(am => `
      <div style="background: #1c1c1c; border-left: 3px solid var(--accent-gold); padding: 8px 12px; color: #ddd; font-size: 0.85rem;">
        <span style="color: var(--accent-gold); margin-right: 6px;">✓</span>
        <span>${am}</span>
      </div>
    `).join('');

    // Pre-filled WhatsApp button to Aman (+251982235189)
    const encMsg = encodeURIComponent(
      `Hello Amanuel, I am interested in the ${prop.title} (${prop.location}). Could you please send me floor plans, unit numbers, and payment details?`
    );
    modalWhatsAppBtn.href = `https://wa.me/251982235189?text=${encMsg}`;

    // PDF Brochure Button
    if (prop.pdfBrochure) {
      modalBrochureBtn.style.display = 'inline-flex';
      modalBrochureBtn.href = prop.pdfBrochure;
      modalBrochureBtn.setAttribute('download', '');
    } else {
      modalBrochureBtn.style.display = 'none';
    }

    propertyDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePropertyDetails() {
    propertyDetailModal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
      modalVideoPlayer.src = '';
    }
  }

  if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closePropertyDetails);
  if (propertyDetailModal) {
    propertyDetailModal.addEventListener('click', (e) => {
      if (e.target === propertyDetailModal) closePropertyDetails();
    });
  }

  /* =========================================================================
     4. Standalone Video Player Modal
     ========================================================================= */
  function openStandaloneVideo(src, title) {
    if (!standaloneVideoModal || !standaloneVideoPlayer) return;
    standaloneVideoTitle.textContent = title || "Video Walkthrough";
    standaloneVideoPlayer.src = src;
    standaloneVideoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    standaloneVideoPlayer.play().catch(e => console.log('Autoplay handled:', e));
  }

  function closeStandaloneVideo() {
    if (!standaloneVideoModal || !standaloneVideoPlayer) return;
    standaloneVideoPlayer.pause();
    standaloneVideoPlayer.src = '';
    standaloneVideoModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeStandaloneVideoBtn) closeStandaloneVideoBtn.addEventListener('click', closeStandaloneVideo);
  if (standaloneVideoModal) {
    standaloneVideoModal.addEventListener('click', (e) => {
      if (e.target === standaloneVideoModal) closeStandaloneVideo();
    });
  }

  // Attach Video Showcase play buttons in #videos
  document.querySelectorAll('.video-preview-player, .btn-play-video').forEach(el => {
    el.addEventListener('click', () => {
      const src = el.getAttribute('data-video');
      const title = el.getAttribute('data-title');
      openStandaloneVideo(src, title);
    });
  });

  /* =========================================================================
     5. Render Urban & Regional Planning Projects from CV
     ========================================================================= */
  function renderPlanningProjects() {
    if (!planningProjectsContainer) return;
    const projects = Array.isArray(window.CREATIVE_PROJECTS) ? window.CREATIVE_PROJECTS : [];

    planningProjectsContainer.innerHTML = projects.map(proj => `
      <div class="service-box" style="text-align: left; background: #fff; border: 2px solid #000; padding: 24px;">
        <div style="height: 180px; margin: -24px -24px 18px -24px; overflow: hidden; background: #222;">
          <img src="${proj.image || 'assets/properties/kazanchis_master_layout.jpg'}" alt="${proj.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/properties/kazanchis_master_layout.jpg'">
        </div>
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-gold); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 4px;">
          ${proj.category.toUpperCase()} • ${proj.date || '2025–2026'}
        </div>
        <h3 class="service-box-title" style="font-size: 1rem; margin-bottom: 8px;">${proj.title}</h3>
        <div style="font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 12px;">
          ${proj.role} — ${proj.institution}
        </div>
        <p class="service-box-text" style="font-size: 0.85rem; line-height: 1.6; color: #666;">
          ${proj.description}
        </p>
      </div>
    `).join('');
  }

  /* =========================================================================
     6. Serverless Admin Portal (CRUD)
     ========================================================================= */
  function openAdmin() {
    adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!isAdminAuthenticated) {
      adminAuthView.style.display = 'block';
      adminDashboardView.style.display = 'none';
      adminPinInput.value = '';
      adminPinInput.focus();
    } else {
      adminAuthView.style.display = 'none';
      adminDashboardView.style.display = 'block';
      refreshAdminDashboard();
    }
  }

  function closeAdmin() {
    adminModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openAdminBtn) openAdminBtn.addEventListener('click', openAdmin);
  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdmin);
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) closeAdmin();
    });
  }

  if (adminPinForm) {
    adminPinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = adminPinInput.value.trim();
      if (window.propertyManager.verifyAdminPIN(entered)) {
        isAdminAuthenticated = true;
        adminAuthView.style.display = 'none';
        adminDashboardView.style.display = 'block';
        refreshAdminDashboard();
        showToast('Catalog Manager unlocked!');
      } else {
        showToast('Incorrect passcode. Default is 1234', 'error');
        adminPinInput.value = '';
        adminPinInput.focus();
      }
    });
  }

  // Admin Tab Switching
  document.querySelectorAll('.admin-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      const target = tabBtn.getAttribute('data-admin-tab');

      document.getElementById('tabListings').style.display = target === 'listings' ? 'block' : 'none';
      document.getElementById('tabAddProperty').style.display = target === 'add' ? 'block' : 'none';
      document.getElementById('tabBackup').style.display = target === 'backup' ? 'block' : 'none';

      if (target === 'listings') refreshAdminDashboard();
    });
  });

  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => {
      resetPropertyForm();
      document.querySelector('[data-admin-tab="add"]').click();
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      resetPropertyForm();
      document.querySelector('[data-admin-tab="listings"]').click();
    });
  }

  // Refresh Admin Dashboard & Stats
  function refreshAdminDashboard() {
    const props = window.propertyManager.getAll();

    document.getElementById('statTotalProps').textContent = props.length;
    document.getElementById('statActiveProps').textContent = props.filter(p => p.status === 'for-sale' || p.status === 'new').length;
    document.getElementById('statHotProps').textContent = props.filter(p => p.status === 'hot').length;
    document.getElementById('statSoldProps').textContent = props.filter(p => p.status === 'sold' || p.category === 'completed').length;

    if (!adminTableBody) return;
    if (props.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">No properties found in catalog.</td></tr>`;
      return;
    }

    adminTableBody.innerHTML = props.map(p => {
      const img = p.images && p.images.length > 0 ? p.images[0] : 'assets/properties/kazanchis_brochure_hero.jpg';
      const bedCount = p.bedrooms ? `${p.bedrooms} Beds` : 'Commercial';
      return `
        <tr>
          <td><img src="${img}" class="admin-table-thumb" alt="${p.title}" onerror="this.src='assets/properties/kazanchis_brochure_hero.jpg'"></td>
          <td>
            <div style="font-weight: 700; color: #fff;">${p.title}</div>
            <div style="font-size: 0.75rem; color: #aaa;">📍 ${p.location}</div>
          </td>
          <td><span class="badge-pill badge-dark">${p.category}</span></td>
          <td>${p.area || 'N/A'} • ${bedCount}</td>
          <td>
            <span class="badge-pill ${p.status === 'hot' ? 'badge-crimson' : p.status === 'sold' ? 'badge-dark' : 'badge-green'}">
              ${p.status.toUpperCase()}
            </span>
          </td>
          <td>
            <div class="admin-action-btn-group">
              <button class="action-btn btn-edit" data-id="${p.id}" title="Edit Listing">✏️</button>
              <button class="action-btn btn-delete" data-id="${p.id}" title="Delete Listing">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    adminTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        populateEditForm(id);
      });
    });

    adminTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this property listing?')) {
          window.propertyManager.delete(id);
          showToast('Property deleted.');
          refreshAdminDashboard();
        }
      });
    });
  }

  // Populate Edit Form
  function populateEditForm(id) {
    const prop = window.propertyManager.getById(id);
    if (!prop) return;

    document.getElementById('editPropertyId').value = prop.id;
    document.getElementById('propTitle').value = prop.title || '';
    document.getElementById('propCategory').value = prop.category || 'apartments';
    document.getElementById('propLocation').value = prop.location || '';
    document.getElementById('propStatus').value = prop.status || 'for-sale';
    document.getElementById('propArea').value = prop.area || '';
    document.getElementById('propBeds').value = prop.bedrooms || 0;
    document.getElementById('propBaths').value = prop.bathrooms || 0;
    document.getElementById('propDelivery').value = prop.deliveryTime || '';
    document.getElementById('propFinishing').value = prop.finishingStyle || '';
    document.getElementById('propVideoUrl').value = prop.videoUrl || '';
    document.getElementById('propBrochure').value = prop.pdfBrochure || '';
    document.getElementById('propDescription').value = prop.description || '';
    document.getElementById('propAmenitiesInput').value = Array.isArray(prop.amenities) ? prop.amenities.join(', ') : '';

    formImages = Array.isArray(prop.images) ? [...prop.images] : [];
    renderFormImagePreviews();

    formHeaderTitle.innerHTML = `<span>✏️</span><span>Edit Property: ${prop.title}</span>`;
    document.querySelector('[data-admin-tab="add"]').click();
  }

  function resetPropertyForm() {
    if (propertyForm) propertyForm.reset();
    document.getElementById('editPropertyId').value = '';
    formImages = [];
    renderFormImagePreviews();
    formHeaderTitle.innerHTML = `<span>➕</span><span>Add Property Listing</span>`;
  }

  function renderFormImagePreviews() {
    if (!formImagePreviews) return;
    formImagePreviews.innerHTML = formImages.map((src, idx) => `
      <div class="image-preview-item">
        <img src="${src}" alt="Preview ${idx + 1}" onerror="this.src='assets/properties/kazanchis_brochure_hero.jpg'">
        <button type="button" class="btn-remove-img" data-index="${idx}" title="Remove">&times;</button>
      </div>
    `).join('');

    formImagePreviews.querySelectorAll('.btn-remove-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute('data-index'));
        formImages.splice(idx, 1);
        renderFormImagePreviews();
      });
    });
  }

  // Image Upload Handling
  if (imageDropzone && imageFileInput) {
    imageDropzone.addEventListener('click', () => imageFileInput.click());
    imageDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropzone.style.borderColor = 'var(--accent-gold)';
    });
    imageDropzone.addEventListener('dragleave', () => {
      imageDropzone.style.borderColor = '#444';
    });
    imageDropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      imageDropzone.style.borderColor = '#444';
      if (e.dataTransfer.files) {
        handleImageUploadFiles(Array.from(e.dataTransfer.files));
      }
    });

    imageFileInput.addEventListener('change', (e) => {
      if (e.target.files) {
        handleImageUploadFiles(Array.from(e.target.files));
      }
    });
  }

  async function handleImageUploadFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const base64 = await PropertyManager.processImageFile(file, 1200, 800, 0.82);
        formImages.push(base64);
      } catch (err) {
        console.error('File optimization error:', err);
      }
    }
    renderFormImagePreviews();
    showToast(`Added ${files.length} photo(s).`);
  }

  if (btnAddImageUrl && imageUrlInput) {
    btnAddImageUrl.addEventListener('click', () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        formImages.push(url);
        imageUrlInput.value = '';
        renderFormImagePreviews();
        showToast('Image path added.');
      }
    });
  }

  // Property Form Submit
  if (propertyForm) {
    propertyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('editPropertyId').value;
      const title = document.getElementById('propTitle').value.trim();
      const category = document.getElementById('propCategory').value;
      const location = document.getElementById('propLocation').value.trim();
      const status = document.getElementById('propStatus').value;
      const area = document.getElementById('propArea').value.trim() || 'N/A';
      const bedrooms = Number(document.getElementById('propBeds').value) || 0;
      const bathrooms = Number(document.getElementById('propBaths').value) || 0;
      const deliveryTime = document.getElementById('propDelivery').value.trim() || 'Under Construction';
      const finishingStyle = document.getElementById('propFinishing').value.trim() || 'Regular Finished / Semi Finished';
      const videoUrl = document.getElementById('propVideoUrl').value.trim();
      const pdfBrochure = document.getElementById('propBrochure').value.trim();
      const description = document.getElementById('propDescription').value.trim();
      const amenitiesStr = document.getElementById('propAmenitiesInput').value.trim();
      const amenities = amenitiesStr ? amenitiesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      const payload = {
        title,
        category,
        subCategory: category,
        location,
        status,
        area,
        bedrooms,
        bathrooms,
        deliveryTime,
        finishingStyle,
        videoUrl,
        pdfBrochure,
        description,
        amenities,
        images: formImages.length > 0 ? formImages : ['assets/properties/kazanchis_brochure_hero.jpg']
      };

      if (editId) {
        window.propertyManager.update(editId, payload);
        showToast('Property listing updated.');
      } else {
        window.propertyManager.add(payload);
        showToast('New property listing created.');
      }

      resetPropertyForm();
      document.querySelector('[data-admin-tab="listings"]').click();
      renderProperties();
    });
  }

  // Backup & Import/Export
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      window.propertyManager.exportJSON();
      showToast('Catalog JSON exported.');
    });
  }

  const btnExportDataJS = document.getElementById('btnExportDataJS');
  if (btnExportDataJS) {
    btnExportDataJS.addEventListener('click', () => {
      window.propertyManager.exportDataJS();
      showToast('data.js downloaded. Replace in your project to commit to Git.');
    });
  }

  // =========================================================================
  // JSONBin.io Cloud Persistence Event Listeners
  // =========================================================================
  const cloudConfigForm = document.getElementById('cloudConfigForm');
  const cloudBinIdInput = document.getElementById('cloudBinId');
  const cloudMasterKeyInput = document.getElementById('cloudMasterKey');
  const btnAutoCreateBin = document.getElementById('btnAutoCreateBin');
  const btnPushToCloud = document.getElementById('btnPushToCloud');
  const btnPullFromCloud = document.getElementById('btnPullFromCloud');
  const cloudStatusBadge = document.getElementById('cloudStatusBadge');

  function updateCloudUI() {
    const cloud = window.propertyManager.getCloudConfig();
    if (cloudBinIdInput && cloud.binId) cloudBinIdInput.value = cloud.binId;
    if (cloudMasterKeyInput && cloud.masterKey) cloudMasterKeyInput.value = cloud.masterKey;

    if (cloudStatusBadge) {
      if (cloud.binId) {
        cloudStatusBadge.className = 'badge-pill badge-green';
        cloudStatusBadge.textContent = '🟢 Cloud Connected';
      } else {
        cloudStatusBadge.className = 'badge-pill badge-dark';
        cloudStatusBadge.textContent = '⚪ Offline / LocalStorage';
      }
    }
  }

  if (cloudConfigForm) {
    cloudConfigForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const binId = cloudBinIdInput ? cloudBinIdInput.value.trim() : '';
      const masterKey = cloudMasterKeyInput ? cloudMasterKeyInput.value.trim() : '';

      window.propertyManager.setCloudConfig(binId, masterKey);
      updateCloudUI();

      if (binId) {
        showToast('Connecting to JSONBin cloud...');
        const res = await window.propertyManager.fetchFromCloud();
        if (res.success) {
          showToast(`Cloud connected! Synced ${res.count} listings.`);
          refreshAdminDashboard();
          renderProperties();
        } else {
          showToast(`Saved settings. Connection test: ${res.error}`, 'error');
        }
      } else {
        showToast('Cloud settings cleared. Running locally.');
      }
    });
  }

  if (btnAutoCreateBin) {
    btnAutoCreateBin.addEventListener('click', async () => {
      const masterKey = cloudMasterKeyInput ? cloudMasterKeyInput.value.trim() : '';
      if (!masterKey) {
        alert('Please paste your JSONBin.io Master Key first (from jsonbin.io -> API Keys).');
        if (cloudMasterKeyInput) cloudMasterKeyInput.focus();
        return;
      }

      btnAutoCreateBin.textContent = '⏳ CREATING...';
      btnAutoCreateBin.disabled = true;

      try {
        const res = await window.propertyManager.autoCreateCloudBin(masterKey);
        if (res.success) {
          updateCloudUI();
          showToast(`🎉 Cloud Bin Created! ID: ${res.binId}. All visitors will now see your listings!`);
        } else {
          showToast(`Could not create bin: ${res.error}`, 'error');
        }
      } finally {
        btnAutoCreateBin.textContent = '🚀 AUTO-CREATE CLOUD BIN';
        btnAutoCreateBin.disabled = false;
      }
    });
  }

  if (btnPushToCloud) {
    btnPushToCloud.addEventListener('click', async () => {
      btnPushToCloud.textContent = '⏳ SYNCING...';
      btnPushToCloud.disabled = true;

      try {
        const res = await window.propertyManager.syncToCloud();
        if (res.success) {
          showToast('All listings pushed to JSONBin cloud successfully! 🌐');
        } else {
          showToast(`Push failed: ${res.error}`, 'error');
        }
      } finally {
        btnPushToCloud.textContent = '⬆️ PUSH TO CLOUD';
        btnPushToCloud.disabled = false;
      }
    });
  }

  if (btnPullFromCloud) {
    btnPullFromCloud.addEventListener('click', async () => {
      btnPullFromCloud.textContent = '⏳ FETCHING...';
      btnPullFromCloud.disabled = true;

      try {
        const res = await window.propertyManager.fetchFromCloud();
        if (res.success) {
          showToast(`Downloaded ${res.count} listings from cloud. 📥`);
          refreshAdminDashboard();
          renderProperties();
        } else {
          showToast(`Pull failed: ${res.error}`, 'error');
        }
      } finally {
        btnPullFromCloud.textContent = '⬇️ PULL FROM CLOUD';
        btnPullFromCloud.disabled = false;
      }
    });
  }

  // Populate cloud fields on dashboard open
  updateCloudUI();

  if (btnTriggerImport && importFileInput) {
    btnTriggerImport.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = window.propertyManager.importJSON(event.target.result);
          if (res.success) {
            showToast(`Imported ${res.count} listings successfully.`);
            refreshAdminDashboard();
            renderProperties();
          } else {
            showToast(`Import error: ${res.error}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  if (changePinForm) {
    changePinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPin = document.getElementById('newPinInput').value.trim();
      if (window.propertyManager.setAdminPIN(newPin)) {
        showToast('Admin passcode updated.');
        changePinForm.reset();
      } else {
        showToast('Passcode must be at least 4 characters.', 'error');
      }
    });
  }

  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', () => {
      if (confirm('Reset entire catalog to official Ayat Real Estate defaults?')) {
        window.propertyManager.resetToDefaults();
        showToast('Catalog reset to defaults.');
        refreshAdminDashboard();
        renderProperties();
      }
    });
  }

  // Contact Form Submission
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const service = document.getElementById('contactService').value;
      const message = document.getElementById('contactMessage').value.trim();

      const text = `*New Real Estate Inquiry*\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nInterest: ${service}\nMessage: ${message}`;
      const waUrl = `https://wa.me/251982235189?text=${encodeURIComponent(text)}`;

      window.open(waUrl, '_blank');
      showToast('Thank you! Redirecting to WhatsApp to connect with Amanuel.');
      contactForm.reset();
    });
  }

  // Listen to property changes and re-render
  window.propertyManager.onChange(() => {
    renderProperties();
  });

  // Initial Renders
  renderProperties();
  renderPlanningProjects();
});
