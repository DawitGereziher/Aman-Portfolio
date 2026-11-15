/**
 * PropertyManager - Cloud-Enabled Serverless Engine for Aman Gebremeskel's Portfolio
 * Manages official Ayat Real Estate listings locally and syncs to JSONBin.io Cloud Store.
 * 
 * Features:
 * - Real-time cloud persistence across all visitors worldwide via JSONBin.io (Public Read / Authenticated Write)
 * - Automatic background cloud fetch when visitors open the site
 * - Auto-sync to cloud when properties are added, updated, or removed
 * - 1-Click "Auto-Create Cloud Bin" with JSONBin Master Key
 * - Offline fallback to localStorage and INITIAL_PROPERTIES
 * - Strict Real Estate Policy: No numeric prices rendered.
 */

class PropertyManager {
  constructor() {
    this.STORAGE_KEY = 'aman_realestate_catalog_v2';
    this.ADMIN_PIN_KEY = 'aman_admin_pin_v2';
    this.CLOUD_BIN_KEY = 'aman_jsonbin_id_v2';
    this.CLOUD_KEY_KEY = 'aman_jsonbin_key_v2';
    this.DEFAULT_PIN = '1234';

    this.properties = [];
    this.listeners = [];
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.properties = JSON.parse(stored);
      } else {
        // Fallback to initial seed data from data.js
        this.properties = Array.isArray(window.INITIAL_PROPERTIES) 
          ? JSON.parse(JSON.stringify(window.INITIAL_PROPERTIES))
          : [];
        this.save();
      }
    } catch (err) {
      console.error('Error loading properties from localStorage:', err);
      this.properties = Array.isArray(window.INITIAL_PROPERTIES) 
        ? JSON.parse(JSON.stringify(window.INITIAL_PROPERTIES)) 
        : [];
    }

    if (!localStorage.getItem(this.ADMIN_PIN_KEY)) {
      localStorage.setItem(this.ADMIN_PIN_KEY, this.DEFAULT_PIN);
    }

    // Auto-fetch latest properties from JSONBin cloud if configured
    const cloud = this.getCloudConfig();
    if (cloud.binId) {
      this.fetchFromCloud().then(res => {
        if (res && res.success) {
          console.log(`[JSONBin] Successfully loaded ${res.count} listings from cloud.`);
        }
      }).catch(err => {
        console.warn('[JSONBin] Cloud fetch initial check:', err);
      });
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.properties));
      this.notifyListeners();

      // Trigger background cloud sync if configured
      const cloud = this.getCloudConfig();
      if (cloud.binId && cloud.masterKey) {
        this.syncToCloud().catch(e => console.warn('[JSONBin] Auto-sync warning:', e));
      }

      return true;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      alert('Notice: Storage quota reached. Consider using image URLs or exporting your backup.');
      return false;
    }
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners() {
    const data = this.getAll();
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Listener callback error:', e); }
    });
  }

  getAll() {
    return [...this.properties];
  }

  getById(id) {
    return this.properties.find(p => p.id === id) || null;
  }

  getByCategory(category) {
    if (!category || category === 'all') return this.getAll();
    return this.properties.filter(p => p.category === category || p.subCategory === category);
  }

  getByStatus(status) {
    if (!status || status === 'all') return this.getAll();
    return this.properties.filter(p => p.status === status);
  }

  add(propertyData) {
    const newProperty = {
      id: 'prop-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      title: propertyData.title || 'Untitled Property',
      project: propertyData.project || 'Ayat Real Estate',
      category: propertyData.category || 'apartments',
      subCategory: propertyData.subCategory || 'apartments',
      status: propertyData.status || 'for-sale',
      priceETB: 'Inquire for Pricing',
      priceUSD: '',
      priceNote: 'Flexible milestone payment plans available',
      location: propertyData.location || 'Addis Ababa, Ethiopia',
      area: propertyData.area || 'N/A',
      bedrooms: Number(propertyData.bedrooms) || 0,
      bathrooms: Number(propertyData.bathrooms) || 0,
      floor: propertyData.floor || 'Various Floors',
      deliveryTime: propertyData.deliveryTime || 'Under Construction',
      finishingStyle: propertyData.finishingStyle || 'Regular Finished / Semi Finished',
      typology: propertyData.typology || '',
      videoUrl: propertyData.videoUrl || '',
      pdfBrochure: propertyData.pdfBrochure || '',
      featured: Boolean(propertyData.featured),
      images: Array.isArray(propertyData.images) && propertyData.images.length > 0
        ? propertyData.images
        : ['assets/properties/kazanchis_brochure_hero.jpg'],
      description: propertyData.description || 'Verified Ayat Real Estate property listing.',
      amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities : [],
      highlights: Array.isArray(propertyData.highlights) ? propertyData.highlights : [],
      contactPhone: propertyData.contactPhone || '+251982235189',
      whatsappMessage: propertyData.whatsappMessage || `Hello Amanuel, I am interested in ${propertyData.title || 'this property'}. Please share details and payment terms.`,
      createdAt: new Date().toISOString()
    };

    this.properties.unshift(newProperty);
    this.save();
    return newProperty;
  }

  update(id, updatedData) {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) return null;

    // Ensure price constraints remain strict
    const sanitizedData = { ...updatedData };
    sanitizedData.priceETB = 'Inquire for Pricing';
    sanitizedData.priceUSD = '';

    this.properties[index] = {
      ...this.properties[index],
      ...sanitizedData,
      id,
      updatedAt: new Date().toISOString()
    };

    this.save();
    return this.properties[index];
  }

  delete(id) {
    const initialLen = this.properties.length;
    this.properties = this.properties.filter(p => p.id !== id);
    if (this.properties.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  resetToDefaults() {
    if (Array.isArray(window.INITIAL_PROPERTIES)) {
      this.properties = JSON.parse(JSON.stringify(window.INITIAL_PROPERTIES));
      this.save();
      return true;
    }
    return false;
  }

  // Passcode verification & management
  getAdminPIN() {
    return localStorage.getItem(this.ADMIN_PIN_KEY) || this.DEFAULT_PIN;
  }

  verifyAdminPIN(pin) {
    return String(pin).trim() === String(this.getAdminPIN()).trim();
  }

  setAdminPIN(newPin) {
    if (newPin && newPin.length >= 4) {
      localStorage.setItem(this.ADMIN_PIN_KEY, String(newPin).trim());
      return true;
    }
    return false;
  }

  // =========================================================================
  // JSONBin.io Cloud Persistence Engine
  // =========================================================================

  getCloudConfig() {
    const binId = localStorage.getItem(this.CLOUD_BIN_KEY) || window.JSONBIN_BIN_ID || '';
    const masterKey = localStorage.getItem(this.CLOUD_KEY_KEY) || window.JSONBIN_MASTER_KEY || '';
    return {
      binId: binId.trim(),
      masterKey: masterKey.trim(),
      isConnected: Boolean(binId.trim())
    };
  }

  setCloudConfig(binId, masterKey) {
    if (binId && binId.trim()) {
      localStorage.setItem(this.CLOUD_BIN_KEY, binId.trim());
    } else {
      localStorage.removeItem(this.CLOUD_BIN_KEY);
    }

    if (masterKey && masterKey.trim()) {
      localStorage.setItem(this.CLOUD_KEY_KEY, masterKey.trim());
    } else {
      localStorage.removeItem(this.CLOUD_KEY_KEY);
    }
    return true;
  }

  /**
   * Auto-Create a new public Bin on JSONBin.io with current 15 listings
   */
  async autoCreateCloudBin(masterKey) {
    if (!masterKey || !masterKey.trim()) {
      return { success: false, error: 'Please enter your JSONBin.io Master Key.' };
    }

    try {
      const res = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': masterKey.trim(),
          'X-Bin-Name': 'Aman Ayat Real Estate Catalog',
          'X-Bin-Private': 'false' // Public READ so every visitor worldwide gets properties without a key
        },
        body: JSON.stringify(this.properties)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status}: Failed to create cloud bin on JSONBin`);
      }

      const data = await res.json();
      const newBinId = data.metadata && data.metadata.id;
      if (!newBinId) throw new Error('Did not receive a Bin ID from JSONBin response.');

      this.setCloudConfig(newBinId, masterKey.trim());
      return { success: true, binId: newBinId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch newest properties from JSONBin.io (Called automatically for all visitors)
   */
  async fetchFromCloud() {
    const { binId, masterKey } = this.getCloudConfig();
    if (!binId) {
      return { success: false, error: 'No JSONBin Bin ID configured.' };
    }

    try {
      const headers = {};
      if (masterKey) headers['X-Master-Key'] = masterKey;

      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status}: Failed to read from JSONBin`);
      }

      const data = await res.json();
      const remoteProps = data.record;
      if (!Array.isArray(remoteProps) || remoteProps.length === 0) {
        throw new Error('Cloud bin does not contain a valid list of properties.');
      }

      this.properties = remoteProps;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.properties));
      this.notifyListeners();
      return { success: true, count: remoteProps.length };
    } catch (err) {
      console.warn('JSONBin fetch error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sync current in-memory properties to JSONBin.io
   */
  async syncToCloud() {
    const { binId, masterKey } = this.getCloudConfig();
    if (!binId || !masterKey) {
      return { success: false, error: 'Both Bin ID and Master Key are required to save changes to the cloud.' };
    }

    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': masterKey
        },
        body: JSON.stringify(this.properties)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP ${res.status}: Failed to update JSONBin`);
      }

      return { success: true };
    } catch (err) {
      console.error('Failed to sync to JSONBin:', err);
      return { success: false, error: err.message };
    }
  }

  // =========================================================================
  // Backup, Import & Export
  // =========================================================================

  exportJSON() {
    const dataStr = JSON.stringify(this.properties, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `amanuel_realestate_catalog_${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportDataJS() {
    const cloud = this.getCloudConfig();
    const fileContent = `/**
 * Aman Gebremeskel Gebremedhin - Official Real Estate & Urban Planning Catalog Data
 * Updated: ${new Date().toISOString()}
 */

window.JSONBIN_BIN_ID = "${cloud.binId || ''}";

const INITIAL_PROPERTIES = ${JSON.stringify(this.properties, null, 2)};

const CREATIVE_PROJECTS = ${JSON.stringify(window.CREATIVE_PROJECTS || [], null, 2)};

window.INITIAL_PROPERTIES = INITIAL_PROPERTIES;
window.CREATIVE_PROJECTS = CREATIVE_PROJECTS;
`;

    const blob = new Blob([fileContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be an array of property items.');
      }
      const valid = parsed.every(item => item.id && item.title);
      if (!valid) {
        throw new Error('JSON format is missing essential fields (id, title).');
      }

      this.properties = parsed;
      this.save();
      return { success: true, count: parsed.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static processImageFile(file, maxWidth = 1200, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Selected file is not an image.'));
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to decode image.'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }
}

// Instantiate and expose globally
window.propertyManager = new PropertyManager();
