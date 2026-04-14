#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline-sync');
const os = require('os');

// Colores ANSI universales (Tus originales)
const reset = "\x1b[0m", verde = "\x1b[32m", morado = "\x1b[35m";
const amarillo = "\x1b[33m", rojo = "\x1b[31m", cian = "\x1b[36m";

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

function commandExists(cmd) {
    const checkCmd = os.platform() === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    return getOutput(checkCmd) !== null;
}

// --- DETECCIÓN DE MODO ---
// Si el comando ejecutado contiene "actualiza", entramos en modo rápido.
const esActualizacion = process.argv[1].includes('actualiza-edward');

if (esActualizacion) {
    // ==========================================
    // MODO: ACTUALIZA-EDWARD (Solo push rápido)
    // ==========================================
    console.clear();
    console.log(`${cian}\n🔄 --- ACTUALIZANDO REPO (MODO RÁPIDO) --- 🚀${reset}\n`);

    const status = getOutput('git status --short');
    if (!status) {
        console.log(`${verde}✅ No hay cambios para subir.${reset}\n`);
        process.exit(0);
    }

    run('git add .');
    let msg = readline.question(`${amarillo}📝 Mensaje del commit (Enter para "update"): ${reset}`) || "update";
    run(`git commit -m "${msg}"`);
    console.log(`\n${cian}⬆️  Subiendo cambios a origin main...${reset}`);
    run('git push origin main');
    console.log(`\n${verde}✨ ¡Actualizado! De nada, Edward. ✨${reset}\n`);

} else {
    // ==========================================
    // MODO: GRACIAS-EDWARD (Tu código completo)
    // ==========================================
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
            process.stdout.write('\u0007'); 
            console.log(`\n${verde}✨ ¡Listo! Gracias a ti. ✨${reset}\n`);
            process.exit(0);
        }
    }

    // 3. Menú de Repositorio (Tu lógica de GH CLI)
    console.log(`\n${cian}🌐 MENÚ DE REPOSITORIO${reset}`);
    const opciones = ['Crear repo en GitHub', 'Enlazar a repo existente'];
    const index = readline.keyInSelect(opciones, `${amarillo}¿Que sigue?${reset}`);

    if (index === 0) {
        let hasGH = commandExists('gh');
        if (!hasGH) {
            const platform = os.platform();
            if (platform === 'linux') {
                run('sudo apt update && sudo apt install gh -y');
                hasGH = commandExists('gh');
            } else if (platform === 'win32') {
                console.log(`${amarillo}👉 Instálalo con: winget install GitHub.cli${reset}`);
            }
        }

        if (hasGH) {
            const authStatus = getOutput('gh auth status');
            if (!authStatus || authStatus.includes("not logged in")) {
                run('gh auth login --hostname github.com -p https -w');
            }
            let repoName = "";
            while (!repoName) {
                repoName = readline.question(`${amarillo}\n🏷️ Nombre del repo en GitHub: ${reset}`);
            }
            const visibility = readline.keyInYN(`${amarillo}¿Quieres que sea privado?${reset}`) ? "--private" : "--public";
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

    console.log(`\n${verde}✨ ¡Listo! Gracias a ti. ✨${reset}\n`);
}