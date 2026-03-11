// ── Sitemap route (add this in app.js BEFORE other routes) ──
const path = require('path');

app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// ── robots.txt route ──
app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(
`User-agent: *
Allow: /
Allow: /login

Disallow: /admin
Disallow: /employee
Disallow: /logout
Disallow: /search
Disallow: /add_employee
Disallow: /monthly_report
Disallow: /reports

Sitemap: https://attendancesystemmobile.vercel.app/sitemap.xml`
    );
});