# 数据库初始化说明

## 生产环境初始化步骤

### 方式一：使用完整初始化脚本（推荐）

执行 `init_complete.sql` 脚本，它会创建所有必要的表结构：

```bash
mysql -u用户名 -p密码 数据库名 < init/sql/init_complete.sql
```

或者：

```bash
mysql -u用户名 -p密码 < init/sql/init_complete.sql
```

### 方式二：分步执行（如果方式一失败）

按以下顺序执行：

1. **基础表结构**
   ```bash
   mysql -u用户名 -p密码 数据库名 < init/sql/index.sql
   ```

2. **食物相关表**
   ```bash
   mysql -u用户名 -p密码 数据库名 < init/sql/create_food_tables.sql
   ```

3. **帖子相关表**
   ```bash
   mysql -u用户名 -p密码 数据库名 < init/sql/create_posts_tables.sql
   ```

4. **点赞和评论表**
   ```bash
   mysql -u用户名 -p密码 数据库名 < init/sql/create_post_interaction_tables.sql
   ```

5. **扩展字段（如果基础表已存在）**
   ```bash
   mysql -u用户名 -p密码 数据库名 < init/sql/add_target_steps.sql
   mysql -u用户名 -p密码 数据库名 < init/sql/add_target_date.sql
   mysql -u用户名 -p密码 数据库名 < init/sql/add_target_calories_burned.sql
   mysql -u用户名 -p密码 数据库名 < init/sql/add_calorie_fields.sql
   ```

6. **初始化食物数据（可选）**
   ```bash
   mysql -u用户名 -p密码 数据库名 --default-character-set=utf8mb4 < init/sql/init_food_data.sql
   ```

## 注意事项

1. **字符编码**：确保使用 `utf8mb4` 字符集，支持emoji和中文
2. **执行顺序**：必须先创建基础表（users），再创建依赖表
3. **外键约束**：如果外键创建失败，可以暂时注释掉外键约束
4. **数据备份**：执行前建议备份现有数据

## 验证表是否创建成功

```sql
USE health_partner;
SHOW TABLES;
```

应该看到以下表：
- users
- user_profiles
- user_goals
- diet_records
- exercise_records
- health_records
- water_records
- food_categories
- foods
- food_units
- posts
- post_images
- post_likes
- post_comments


