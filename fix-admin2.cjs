const fs = require('fs');
let c = fs.readFileSync('D:\\asianflix\\src\\components\\admin\\AdminDashboard.tsx', 'utf8');
// The file has literal \n characters - replace them with actual newlines
c = c.replace(/\\\\n/g, '\n');
// Fix the displayName export
c = c.replace("  );\n};\n\nAdminDashboard.displayName = 'AdminDashboard';\n\nexport { AdminDashboard };\n", "  );\n};\n\nAdminDashboard.displayName = 'AdminDashboard';\n\nexport { AdminDashboard };\n");
fs.writeFileSync('D:\\asianflix\\src\\components\\admin\\AdminDashboard.tsx', c);
console.log('done');