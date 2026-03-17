// 股市交易时段配置
const marketConfigs = {
    'Asia/Shanghai': {
        name: 'A股',
        tradingHours: {
            pre: null,
            open: { start: '09:30', end: '11:30' },
            midday: { start: '11:30', end: '13:00' },
            afternoon: { start: '13:00', end: '15:00' },
            post: null
        },
        holidays: [] // 可配置节假日
    },
    'Asia/Hong_Kong': {
        name: '港股',
        tradingHours: {
            pre: { start: '09:00', end: '09:30' },
            open: { start: '09:30', end: '12:00' },
            midday: { start: '12:00', end: '13:00' },
            afternoon: { start: '13:00', end: '16:00' },
            post: null
        }
    },
    'America/New_York': {
        name: '美股',
        tradingHours: {
            pre: { start: '04:00', end: '09:30' },
            open: { start: '09:30', end: '16:00' },
            post: { start: '16:00', end: '20:00' }
        }
    },
    'Europe/London': {
        name: '英股',
        tradingHours: {
            pre: null,
            open: { start: '08:00', end: '16:30' },
            post: null
        }
    },
    'Asia/Tokyo': {
        name: '日股',
        tradingHours: {
            pre: null,
            open: { start: '09:00', end: '11:30' },
            midday: { start: '11:30', end: '12:30' },
            afternoon: { start: '12:30', end: '15:00' },
            post: null
        }
    },
    'Australia/Sydney': {
        name: '澳股',
        tradingHours: {
            pre: null,
            open: { start: '10:00', end: '16:00' },
            post: null
        }
    }
};

// 初始化时钟刻度
function initClockMarks() {
    document.querySelectorAll('.hour-marks').forEach(marksGroup => {
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 50 + 38 * Math.cos(angle);
            const y1 = 50 + 38 * Math.sin(angle);
            const x2 = 50 + 42 * Math.cos(angle);
            const y2 = 50 + 42 * Math.sin(angle);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            marksGroup.appendChild(line);
        }
    });
}

// 获取指定时区的当前时间
function getTimeInTimezone(timezone) {
    const now = new Date();
    const options = {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    };
    
    const formatter = new Intl.DateTimeFormat('zh-CN', options);
    const parts = formatter.formatToParts(now);
    
    const timeData = {};
    parts.forEach(part => {
        timeData[part.type] = part.value;
    });
    
    // 获取小时、分钟、秒用于计算角度
    const timeString = formatter.format(now);
    const [hours, minutes, seconds] = [
        parseInt(timeData.hour),
        parseInt(timeData.minute),
        parseInt(timeData.second)
    ];
    
    return {
        hours,
        minutes,
        seconds,
        timeString: `${timeData.hour}:${timeData.minute}:${timeData.second}`,
        dateString: `${timeData.year}/${timeData.month}/${timeData.day} ${timeData.weekday}`,
        raw: now
    };
}

// 检查市场状态
function checkMarketStatus(timezone, hours, minutes) {
    const config = marketConfigs[timezone];
    if (!config) return { status: 'unknown', text: '未知' };
    
    const currentTime = hours * 60 + minutes;
    const tradingHours = config.tradingHours;
    
    // 检查是否为周末
    const now = new Date();
    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short'
    }).format(now);
    
    if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
        return { status: 'closed', text: '周末休市' };
    }
    
    // 检查盘前
    if (tradingHours.pre) {
        const [preStartH, preStartM] = tradingHours.pre.start.split(':').map(Number);
        const [preEndH, preEndM] = tradingHours.pre.end.split(':').map(Number);
        const preStart = preStartH * 60 + preStartM;
        const preEnd = preEndH * 60 + preEndM;
        
        if (currentTime >= preStart && currentTime < preEnd) {
            return { status: 'pre', text: '盘前交易' };
        }
    }
    
    // 检查主要交易时段
    if (tradingHours.open) {
        const [openH, openM] = tradingHours.open.start.split(':').map(Number);
        const [closeH, closeM] = tradingHours.open.end.split(':').map(Number);
        const openTime = openH * 60 + openM;
        const closeTime = closeH * 60 + closeM;
        
        if (currentTime >= openTime && currentTime < closeTime) {
            return { status: 'open', text: '交易中' };
        }
    }
    
    // 检查午休时段（港股、A股、日股）
    if (tradingHours.midday) {
        const [midStartH, midStartM] = tradingHours.midday.start.split(':').map(Number);
        const [midEndH, midEndM] = tradingHours.midday.end.split(':').map(Number);
        const midStart = midStartH * 60 + midStartM;
        const midEnd = midEndH * 60 + midEndM;
        
        if (currentTime >= midStart && currentTime < midEnd) {
            return { status: 'closed', text: '午间休市' };
        }
    }
    
    // 检查下午交易时段（港股、A股、日股）
    if (tradingHours.afternoon) {
        const [aftStartH, aftStartM] = tradingHours.afternoon.start.split(':').map(Number);
        const [aftEndH, aftEndM] = tradingHours.afternoon.end.split(':').map(Number);
        const aftStart = aftStartH * 60 + aftStartM;
        const aftEnd = aftEndH * 60 + aftEndM;
        
        if (currentTime >= aftStart && currentTime < aftEnd) {
            return { status: 'open', text: '交易中' };
        }
    }
    
    // 检查盘后
    if (tradingHours.post) {
        const [postStartH, postStartM] = tradingHours.post.start.split(':').map(Number);
        const [postEndH, postEndM] = tradingHours.post.end.split(':').map(Number);
        const postStart = postStartH * 60 + postStartM;
        const postEnd = postEndH * 60 + postEndM;
        
        if (currentTime >= postStart && currentTime < postEnd) {
            return { status: 'pre', text: '盘后交易' };
        }
    }
    
    return { status: 'closed', text: '已休市' };
}

// 更新单个时钟
function updateClock(clockCard) {
    const timezone = clockCard.dataset.timezone;
    const timeData = getTimeInTimezone(timezone);
    
    // 更新数字时间
    const timeEl = clockCard.querySelector('.digital-time .time');
    const dateEl = clockCard.querySelector('.digital-time .date');
    timeEl.textContent = timeData.timeString;
    dateEl.textContent = timeData.dateString;
    
    // 计算指针角度
    const hourAngle = (timeData.hours % 12) * 30 + timeData.minutes * 0.5;
    const minuteAngle = timeData.minutes * 6 + timeData.seconds * 0.1;
    const secondAngle = timeData.seconds * 6;
    
    // 更新模拟时钟指针
    const hourHand = clockCard.querySelector('.hour-hand');
    const minuteHand = clockCard.querySelector('.minute-hand');
    const secondHand = clockCard.querySelector('.second-hand');
    
    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
    secondHand.style.transform = `rotate(${secondAngle}deg)`;
    
    // 更新市场状态
    const marketStatus = checkMarketStatus(timezone, timeData.hours, timeData.minutes);
    const statusIndicator = clockCard.querySelector('.status-indicator');
    const statusText = clockCard.querySelector('.status-text');
    
    statusIndicator.className = 'status-indicator ' + marketStatus.status;
    statusText.className = 'status-text ' + marketStatus.status;
    statusText.textContent = marketStatus.text;
}

// 更新所有时钟
function updateAllClocks() {
    document.querySelectorAll('.clock-card').forEach(updateClock);
}

// 初始化
function init() {
    initClockMarks();
    updateAllClocks();
    
    // 每秒更新
    setInterval(updateAllClocks, 1000);
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', init);
