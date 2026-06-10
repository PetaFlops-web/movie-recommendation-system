import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function debugCSV() {
  try {
    const csvPath = path.join(__dirname, '../python_service/model/df_processed.csv');
    
    console.log('📄 Membaca file CSV...');
    console.log('Path:', csvPath);
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`\n📊 Total baris: ${lines.length}`);
    
    // Tampilkan 5 baris pertama
    console.log('\n=== 5 BARIS PERTAMA ===');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`\nBaris ${i}:`);
      console.log(lines[i].substring(0, 200) + (lines[i].length > 200 ? '...' : ''));
    }
    
    // Parse header
    console.log('\n=== HEADER (KOLOM) ===');
    const header = lines[0];
    const columns = header.split(',').map(col => col.replace(/"/g, '').trim());
    columns.forEach((col, index) => {
      console.log(`  [${index}] ${col}`);
    });
    
    // Parse baris kedua (data pertama)
    console.log('\n=== DATA PERTAMA (BARIS 2) ===');
    if (lines.length > 1) {
      const firstData = lines[1];
      const parts = firstData.split(',').map(part => part.replace(/^"|"$/g, '').trim());
      parts.forEach((part, index) => {
        console.log(`  [${index}] ${columns[index] || 'Unknown'}: ${part.substring(0, 50)}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugCSV();