const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname);

// Find all HTML files in R23/*/*.html and R20/*/*.html (branch pages)
const targets = [];

['R23', 'R20'].forEach(reg => {
    const regPath = path.join(projectDir, reg);
    if (fs.existsSync(regPath)) {
        const courses = fs.readdirSync(regPath).filter(f => {
            const full = path.join(regPath, f);
            return fs.statSync(full).isDirectory();
        });
        courses.forEach(course => {
            const coursePath = path.join(regPath, course);
            const files = fs.readdirSync(coursePath).filter(f => f.endsWith('.html'));
            files.forEach(file => {
                targets.push(path.join(coursePath, file));
            });
        });
    }
});

const authBlock = `    <script src="../../js/api.js"></script>
    <script src="../../js/auth.js"></script>
    <script>
        (async () => {
            try {
                const user = await checkAuth();
                if (!user) {
                    const redirect = window.location.pathname.substring(1);
                    window.location.href = '../../login.html?redirect=' + redirect;
                }
            } catch (e) {
                console.error('Auth error:', e);
                const redirect = window.location.pathname.substring(1);
                window.location.href = '../../login.html?redirect=' + redirect;
            }
        })();
    </script>`;

let count = 0;
targets.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('checkAuth')) {
        console.log(`Already patched: ${path.relative(projectDir, filePath)}`);
        return;
    }
    // Insert before </body>
    if (content.match(/<\/body>/i)) {
        content = content.replace(/<\/body>/i, authBlock + '\n</body>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched: ${path.relative(projectDir, filePath)}`);
        count++;
    } else {
        // If no body tag, append at end
        content += '\n' + authBlock;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched (no body): ${path.relative(projectDir, filePath)}`);
        count++;
    }
});

console.log(`Total patched: ${count}`);