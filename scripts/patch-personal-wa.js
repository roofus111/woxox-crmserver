const fs = require("fs");
const path = "/opt/woxox/crmserver/index.js";
let text = fs.readFileSync(path, "utf8");
const oldRequire = "const { initPersonalWhatsAppModule } = require('./modules/personalWhatsapp');";
const newRequire = "let initPersonalWhatsAppModule = null;\ntry {\n  ({ initPersonalWhatsAppModule } = require('./modules/personalWhatsapp'));\n} catch (err) {\n  console.warn('Personal WhatsApp module unavailable:', err.message);\n}";
if (!text.includes(oldRequire)) { console.error("require line not found"); process.exit(1); }
text = text.replace(oldRequire, newRequire);
text = text.replace(/initPersonalWhatsAppModule\(app\);/g, "if (typeof initPersonalWhatsAppModule === 'function') initPersonalWhatsAppModule(app);");
fs.writeFileSync(path, text);
console.log("patched ok");