# 📊 CSV导入功能说明

## ✅ 新增功能

现在导入功能同时支持 **Excel** 和 **CSV** 两种格式！

---

## 📁 支持的文件格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| Excel | .xlsx, .xls | Microsoft Excel格式 |
| CSV | .csv | 逗号分隔值文件（UTF-8编码） |

---

## 📝 CSV文件格式

### 标准格式

```csv
单词,中文释义,英文释义,例句,音标
apple,苹果,A round fruit with red or green skin,I eat an apple every day.,/ˈæpl/
book,书,A written work published in printed form,I am reading a book.,/bʊk/
cat,猫,A small domesticated carnivorous mammal,The cat is sleeping on the sofa.,/kæt/
```

### 最小格式（只有单词列）

```csv
单词
apple
book
cat
dog
```

系统会自动查询缺失的释义、例句和音标！

---

## 🎯 使用流程

### 1. 准备CSV文件

**方式一：使用现有模板**
- 项目中的 `词库导入模板.csv`
- 项目中的 `测试导入-CSV格式.csv`

**方式二：自己创建**
1. 用Excel或记事本创建文件
2. 第一行写列名：`单词,中文释义,英文释义,例句,音标`
3. 从第二行开始填写数据
4. 另存为 `.csv` 格式（UTF-8编码）

**方式三：在应用中下载**
1. 点击"下载模板"
2. 选择CSV格式
3. 自动下载到本地

### 2. 导入文件

1. 进入应用，点击底部 **"词库"**
2. 选择要导入的词库
3. 点击 **"导入单词"**
4. 点击 **"Excel/CSV导入"** 卡片
5. 选择你的CSV文件
6. 预览数据
7. 点击 **"确认导入"**

---

## 💡 CSV格式注意事项

### ✅ 正确的CSV

```csv
单词,中文释义,英文释义,例句,音标
apple,苹果,A fruit,I eat an apple.,/ˈæpl/
```

### ⚠️ 包含逗号的内容要用引号包裹

```csv
单词,中文释义,英文释义,例句,音标
happy,快乐的,"Feeling joy, pleasure",I am happy.,/ˈhæpi/
```

**注意：** 如果英文释义或例句中包含逗号，必须用双引号包裹整个字段！

### ❌ 错误的CSV

```csv
# 错误：没有表头
apple,苹果,A fruit

# 错误：列名不匹配
English Word,Chinese Meaning
apple,苹果
```

---

## 🔧 智能列名识别

系统会自动识别以下列名（不区分大小写）：

### 单词列（必填）
- 单词
- Word
- word

### 中文释义（选填）
- 中文释义
- Definition
- definition_cn

### 英文释义（选填）
- 英文释义
- English Definition
- definition_en

### 例句（选填）
- 例句
- Example
- example_sentence

### 音标（选填）
- 音标
- Phonetic
- phonetic

---

## 📊 CSV vs Excel 对比

| 特性 | CSV | Excel |
|------|-----|-------|
| 文件大小 | 更小 | 较大 |
| 打开方式 | 记事本/Excel | Excel/WPS |
| 编辑难度 | 简单 | 需要软件 |
| 格式支持 | 纯文本 | 富文本 |
| 推荐使用 | ✅ 批量导入 | ✅ 复杂数据 |

---

## 🐛 常见问题

### 1. 导入后中文乱码
**原因：** CSV文件编码不是UTF-8

**解决方法：**
1. 用Excel打开CSV文件
2. 点击"文件" → "另存为"
3. 选择"CSV UTF-8 (逗号分隔) (*.csv)"
4. 保存后重新导入

### 2. 提示"未找到有效的单词数据"
**原因：** 
- 没有表头行
- 列名不正确
- 文件格式不对

**解决方法：**
- 确保第一行是列名
- 使用"单词"作为第一列的列名
- 检查文件扩展名是否为.csv

### 3. 数据解析不完整
**原因：** 内容中包含逗号或换行符

**解决方法：**
- 用双引号包裹包含逗号的字段
- 避免在字段中使用换行符

### 4. Excel和CSV选哪个？
- **数据量大（1000+）：** 推荐CSV，文件更小，解析更快
- **需要格式：** 推荐Excel，可以保留格式
- **简单文本：** 推荐CSV，用记事本就能编辑

---

## 📦 测试文件

项目中提供了两个测试文件：

1. **词库导入模板.csv**
   - 包含10个基础单词
   - 完整的释义和例句
   - 适合初学者测试

2. **测试导入-CSV格式.csv**
   - 包含10个进阶单词
   - 计算机、音乐、天气等主题
   - 测试不同主题词库

---

## 🎓 示例：用记事本创建CSV

1. 打开记事本
2. 输入以下内容：

```csv
单词,中文释义,英文释义,例句,音标
dog,狗,A domesticated animal,My dog is friendly.,/dɒɡ/
cat,猫,A small furry animal,The cat is cute.,/kæt/
bird,鸟,A feathered animal,Birds can fly.,/bɜːd/
```

3. 点击"文件" → "另存为"
4. 文件名：`我的词库.csv`
5. 编码：选择 **UTF-8**
6. 保存

现在可以用这个文件导入了！

---

## 🚀 快速测试

1. 访问 http://localhost:3000
2. 创建词库
3. 点击"导入单词"
4. 选择 `测试导入-CSV格式.csv`
5. 查看预览
6. 确认导入

完成！🎉
