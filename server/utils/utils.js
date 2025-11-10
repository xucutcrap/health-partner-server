// 格式化时间，保留小时和分钟

module.exports = { 
    formatTime(time) {
        // 假设时间是 '08:00:00' 格式，返回 '08:00'
        return time.substring(0, 5); // 只取前 5 个字符 (小时:分钟)
    },
    calcIntervalMin(start, end) {
        const startTime = new Date(`2025-01-01T${start}:00`); 
        const endTime = new Date(`2025-01-01T${end}:00`);
        const timeDifference = endTime - startTime;
        return timeDifference / (1000 * 60);
    }
}