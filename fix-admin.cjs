const fs = require('fs');
let c = fs.readFileSync('D:\\asianflix\\src\\components\\admin\\AdminDashboard.tsx', 'utf8');
const oldStr = "  );\n};\n\nAdminDashboard.displayName = 'AdminDashboard'\n\nexport { AdminDashboard };";
const newStr = "  );\n};\n\nAdminDashboard.displayName = 'AdminDashboard';\n\nexport { AdminDashboard };";
c = c.replace(oldStr, newStr);
fs.writeFileSync('D:\\asianflix\\src\\components\\admin\\AdminDashboard.tsx', c);
console.log('done');