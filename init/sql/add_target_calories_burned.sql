-- 为 user_goals 表添加 target_calories_burned 字段（如果不存在）
USE `health_partner`;

SET @dbname = DATABASE();
SET @tablename = 'user_goals';
SET @columnname = 'target_calories_burned';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT(11) DEFAULT 500 COMMENT ''目标消耗卡路里(大卡)'' AFTER target_calories')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;




