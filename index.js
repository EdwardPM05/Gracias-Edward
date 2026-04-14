#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline-sync');
const os = require('os'); // Para detectar el sistema operativo

// Colores ANSI universales
const reset = "\x1b[0m";
const verde = "\x1b[32m";
const morado = "\x1b[35m";
const amarillo = "\x1b[33m";
const rojo = "\x1b[31m";
const cian = "\x1b[36m";

function run(command) {
    try {
        return execSync(command, { stdio: 'inherit', encoding: 'utf8' });
    } catch (e) {
        return null;
    }
}

function getOutput(command) {
    try {
        return execSync(command, { stdio: 'pipe', encoding: 'utf8' }).trim();
    } catch (e) {
        return null;
    }
}

// Función para verificar si un comando existe en cualquier SO
function commandExists(cmd) {
    const checkCmd = os.platform() === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    return getOutput(checkCmd) !== null;
}

console.clear();
console.log(`${morado}\n🚀 --- DE NADA, ABRIENDO AUTOMATIZADOR --- 🚀${reset}\n`);

// 1. Config de Git
let user = getOutput('git config --global user.name');
if (!user) {
    console.log(`${amarillo}⚠️ Git no está configurado.${reset}`);
    const newUser = readline.question(`${amarillo}Introduce tu nombre: ${reset}`);
    const newEmail = readline.question(`${amarillo}Introduce tu email: ${reset}`);
    if (newUser && newEmail) {
        run(`git config --global user.name "${newUser}"`);
        run(`git config --global user.email "${newEmail}"`);
        console.log(`${verde}✅ Git configurado correctamente.${reset}`);
    }
} else {
    console.log(`${verde}👤 Usuario detectado: ${user}${reset}`);
}

// 2. Inicializar y Commit
console.log(`\n${verde}📦 Preparando archivos...${reset}`);
run('git init');
run('git add .');

let commitMsg = "";
while (!commitMsg) {
    commitMsg = readline.question(`${amarillo}📝 Nombre del commit (obligatorio): ${reset}`);
    if (!commitMsg) console.log(`${rojo}❌ ¡Debes escribir algo para el commit!${reset}`);
}

run(`git commit -m "${commitMsg}"`);
run('git branch -M main');

// Detección de remoto existente
const existingRemote = getOutput('git remote get-url origin');
if (existingRemote) {
    console.log(`\n${amarillo}⚠️  Este proyecto ya está enlazado a: ${existingRemote}${reset}`);
    if (readline.keyInYN(`${amarillo}¿Quieres borrar este enlace y crear uno nuevo?${reset}`)) {
        getOutput('git remote remove origin');
        console.log(`${verde}✅ Enlace anterior eliminado.${reset}`);
    } else {
        console.log(`${verde}⬆️  Subiendo cambios al repositorio actual...${reset}`);
        run('git push origin main');
        process.stdout.write('\u0007'); // Beep
        console.log(`\n${verde}✨ ¡Listo! Gracias a ti. ✨${reset}\n`);
        process.exit(0);
    }
}

// 3. Menú
console.log(`\n${cian}🌐 MENÚ DE REPOSITORIO${reset}`);
const opciones = ['Crear repo en GitHub', 'Enlazar a repo existente'];
const index = readline.keyInSelect(opciones, `${amarillo}¿Que sigue?${reset}`);

if (index === 0) {
    let hasGH = commandExists('gh');

    if (!hasGH) {
        const platform = os.platform();
        if (platform === 'linux') {
            console.log(`\n${verde}🛠️ Instalando GitHub CLI para Linux...${reset}`);
            run('sudo apt update && sudo apt install gh -y');
            hasGH = commandExists('gh');
        } else if (platform === 'win32') {
            console.log(`\n${rojo}❌ No tienes GitHub CLI (gh) instalado.${reset}`);
            console.log(`${amarillo}👉 Instálalo en Windows con: winget install GitHub.cli${reset}`);
        } else {
            console.log(`\n${rojo}❌ No tienes GitHub CLI (gh) instalado.${reset}`);
            console.log(`${amarillo}👉 Descárgalo en: https://cli.github.com/${reset}`);
        }
    }

    if (hasGH) {
        const authStatus = getOutput('gh auth status');
        if (!authStatus || authStatus.includes("not logged in")) {
            console.log(`\n${cian}🔑 Iniciando sesión... ¡Mira tu navegador!${reset}`);
            // El truco del echo "" funciona en la mayoría de shells
            run('gh auth login --hostname github.com -p https -w');
        }

        let repoName = "";
        while (!repoName) {
            repoName = readline.question(`${amarillo}\n🏷️ Nombre del repo en GitHub: ${reset}`);
        }

        const visibility = readline.keyInYN(`${amarillo}¿Quieres que sea privado?${reset}`) ? "--private" : "--public";
        
        console.log(`\n${verde}🛠️ Creando repo y subiendo código...${reset}`);
        run(`gh repo create ${repoName} ${visibility} --source=. --remote=origin --push`);
    }
} else if (index === 1) {
    const remoteUrl = readline.question(`\n${amarillo}🔗 Link .git: ${reset}`);
    if (remoteUrl) {
        getOutput('git remote remove origin');
        run(`git remote add origin ${remoteUrl}`);
        run('git push -u origin main');
    }
}

// fin
console.log(`\n${verde}✨ ¡Listo! Gracias a ti. ✨${reset}\n`);