// expo-notifications adds the `aps-environment` entitlement (remote push).
// The app only schedules local reminders on the phone, which need no
// entitlement, and the App Store provisioning profile has no Push
// Notifications capability, so the build fails with it. Remove it.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
