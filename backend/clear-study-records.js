const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/wordbook.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在');
  process.exit(1);
}

async function clearRecords() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // 清空学习记录
  db.run('DELETE FROM study_records');

  // 保存数据库
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('✅ 学习记录已清空');
  console.log('✅ 词库数据已保留');

  db.close();
}

clearRecords();
