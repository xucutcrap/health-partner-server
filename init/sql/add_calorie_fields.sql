-- 为 user_goals 表添加运动日和非运动日热量摄入字段（如果不存在）
USE `health_partner`;

SET @dbname = DATABASE();
SET @tablename = 'user_goals';

-- 添加非运动日热量摄入字段
SET @columnname = 'target_calories_rest_day';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT(11) DEFAULT NULL COMMENT ''非运动日目标热量摄入(大卡)'' AFTER target_calories_burned')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加运动日热量摄入字段
SET @columnname = 'target_calories_exercise_day';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT(11) DEFAULT NULL COMMENT ''运动日目标热量摄入(大卡)'' AFTER target_calories_rest_day')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


