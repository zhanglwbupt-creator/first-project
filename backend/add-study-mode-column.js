const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/wordbook.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在');
  process.exit(1);
}

async function addStudyModeColumn() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // 尝试添加 study_mode 字段（如果不存在）
    db.run(`ALTER TABLE study_records ADD COLUMN study_mode TEXT DEFAULT 'choice'`);
    console.log('✅ 已添加 study_mode 字段');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  study_mode 字段已存在，跳过');
    } else {
      throw error;
    }
  }

  // 保存数据库
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('✅ 数据库更新完成');

  db.close();
}

addStudyModeColumn();
