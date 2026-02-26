// api/firmware.js — ESP32 checks here for new firmware
const { getDB, initDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    await initDB();
    const db = getDB();

    // GET /api/firmware?version=1.0.0
    // ESP32 sends its current version
    // Server replies: update available or not
    if (req.method === 'GET') {
      const currentVersion = req.query.version || '0.0.0';

      // Get firmware settings from config
      const rows = await db.execute('SELECT key, value FROM config');
      const config = {};
      rows.rows.forEach(r => { config[r.key || r[0]] = r.value || r[1]; });

      const otaEnabled    = config.ota_enabled    === '1';
      const latestVersion = config.firmware_latest || '1.0.0';
      const firmwareUrl   = config.firmware_url    || '';

      // Not enabled — tell ESP32 no update
      if (!otaEnabled) {
        return res.status(200).json({
          status:        'ok',
          update:        false,
          reason:        'OTA disabled from settings',
          ota_enabled:   false,
          your_version:  currentVersion,
          latest:        latestVersion
        });
      }

      // Compare versions — simple string compare works for x.y.z
      const hasUpdate = firmwareUrl !== '' && latestVersion !== currentVersion
                        && isNewer(latestVersion, currentVersion);

      if (hasUpdate) {
        console.log(`[OTA] ESP32 v${currentVersion} → update to v${latestVersion}`);
        return res.status(200).json({
          status:       'ok',
          update:       true,
          version:      latestVersion,
          url:          firmwareUrl,
          your_version: currentVersion
        });
      } else {
        return res.status(200).json({
          status:       'ok',
          update:       false,
          reason:       currentVersion === latestVersion ? 'Already latest!' : 'No firmware URL set',
          ota_enabled:  true,
          your_version: currentVersion,
          latest:       latestVersion
        });
      }
    }

    return res.status(405).json({ status: 'error', msg: 'Method not allowed' });

  } catch (err) {
    console.error('[firmware] Error:', err.message);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
};

// Compare versions: is "a" newer than "b"?
// e.g. isNewer("1.0.1", "1.0.0") = true
function isNewer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}
