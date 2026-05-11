const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');

const rootDir = process.cwd();

const targets = [
  // Antes / Depois
  { input: 'imagem seção antes e depois casa/casa antes.png', width: 2560, quality: 68 },
  { input: 'imagem seção antes e depois casa/casa depois.png', width: 2560, quality: 68 },

  // Catalogo 2025
  { input: 'casas de luxo/3.png', width: 2200, quality: 70 },
  { input: 'casas de luxo/4.png', width: 2200, quality: 70 },
  { input: 'casas de luxo/5.png', width: 2200, quality: 70 },
  { input: 'casas de luxo/6.png', width: 2200, quality: 70 },
  { input: 'casas de luxo/7.png', width: 2200, quality: 70 },
  { input: 'casas de luxo/8.png', width: 2200, quality: 70 },

  // Provas sociais (avatares)
  { input: 'imagens avatares provas sociais/10.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/11.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/12.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/13.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/14.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/15.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/16.png', width: 320, quality: 72 },
  { input: 'imagens avatares provas sociais/17.png', width: 320, quality: 72 },

  // Materiais (backgrounds de cards)
  { input: 'imagens seção materiais utilizados/1.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/2.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/3.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/4.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/5.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/6.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/7.png', width: 1200, quality: 68 },
  { input: 'imagens seção materiais utilizados/8.png', width: 1200, quality: 68 },

  // Outras grandes em uso no layout
  { input: 'IMAGEM SEÇÃO SOBRE.png', width: 1920, quality: 70 },
  { input: 'Fabricação Artesanal.png', width: 1600, quality: 70 },
];

function toWebpPath(relativePath) {
  return relativePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

async function fileSizeMB(absPath) {
  const stat = await fs.stat(absPath);
  return stat.size / (1024 * 1024);
}

async function optimizeOne(target) {
  const inputAbs = path.join(rootDir, target.input);
  const outputRel = toWebpPath(target.input);
  const outputAbs = path.join(rootDir, outputRel);

  await sharp(inputAbs)
    .rotate()
    .resize({
      width: target.width,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({
      quality: target.quality,
      effort: 6,
    })
    .toFile(outputAbs);

  const beforeMB = await fileSizeMB(inputAbs);
  const afterMB = await fileSizeMB(outputAbs);

  return {
    input: target.input,
    output: outputRel,
    beforeMB,
    afterMB,
    savedMB: beforeMB - afterMB,
  };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const target of targets) {
    const row = await optimizeOne(target);
    rows.push(row);
    totalBefore += row.beforeMB;
    totalAfter += row.afterMB;
  }

  rows.sort((a, b) => b.savedMB - a.savedMB);

  console.log('Conversao concluida (PNG/JPG -> WEBP):');
  for (const row of rows) {
    console.log(
      `${row.input} -> ${row.output} | ${row.beforeMB.toFixed(2)}MB => ${row.afterMB.toFixed(2)}MB | economia ${row.savedMB.toFixed(2)}MB`
    );
  }

  const totalSaved = totalBefore - totalAfter;
  const percent = totalBefore > 0 ? (totalSaved / totalBefore) * 100 : 0;
  console.log('---');
  console.log(
    `TOTAL: ${totalBefore.toFixed(2)}MB => ${totalAfter.toFixed(2)}MB | economia ${totalSaved.toFixed(2)}MB (${percent.toFixed(1)}%)`
  );
}

main().catch((err) => {
  console.error('Erro ao otimizar imagens:', err);
  process.exit(1);
});
