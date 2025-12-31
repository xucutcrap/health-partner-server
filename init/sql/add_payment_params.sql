ALTER TABLE `member_orders` ADD COLUMN `payment_params` TEXT COMMENT '微信支付参数' AFTER `status`;
