const fs = require('fs');

let content = fs.readFileSync('src/components/feed/cards/SpecialCard.jsx', 'utf8');

content = content.replace(/style=\{\{361\}\}/g, 'style= padding: "0 14px 14px" ');
content = content.replace(/style=\{\{362\}\}/g, 'style= background: "linear-gradient(145deg, #0a1f4d, #1b3370)", borderRadius: "14px", padding: "16px", color: "#fff" ');
content = content.replace(/style=\{\{363\}\}/g, 'style= fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "#ffd200", marginBottom: "8px" ');
content = content.replace(/style=\{\{364\}\}/g, 'style= margin: "0 0 12px", fontSize: "18px", fontWeight: "800", lineHeight: "1.3" ');
content = content.replace(/style=\{\{365\}\}/g, 'style= width: "100%", borderRadius: "10px", overflow: "hidden", marginBottom: "12px", background: "rgba(0,0,0,0.2)" ');
content = content.replace(/style=\{\{366\}\}/g, 'style= width: "100%", display: "block", objectFit: "cover" ');
content = content.replace(/style=\{\{367\}\}/g, 'style= fontSize: "14px", lineHeight: "1.5", color: "rgba(255,255,255,0.9)", margin: "0" ');
content = content.replace(/style=\{\{368\}\}/g, 'style= display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" ');
content = content.replace(/style=\{\{369\}\}/g, 'style= display: "flex", alignItems: "center", gap: "10px", padding: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "8px" ');
content = content.replace(/style=\{\{370\}\}/g, 'style= width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" ');
content = content.replace(/style=\{\{371\}\}/g, 'style= width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" ');
content = content.replace(/style=\{\{372\}\}/g, 'style= fontSize: "14px", fontWeight: "600" ');
content = content.replace(/style=\{\{373\}\}/g, 'style= fontSize: "12px", textAlign: "center", color: "rgba(255,255,255,0.6)", marginTop: "4px" ');

fs.writeFileSync('src/components/feed/cards/SpecialCard.jsx', content, 'utf8');
console.log('patched SpecialCard styles');
