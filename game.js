document.addEventListener('DOMContentLoaded', () => {
    // DOM元素引用
    const startMenu = document.getElementById('start-menu');
    const endMenu = document.getElementById('end-menu');
    const rulesModal = document.getElementById('rules-modal');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const rulesBtn = document.getElementById('rules-btn');
    const closeRulesBtn = document.getElementById('close-rules-btn');
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');
    const spiritText = document.getElementById('spirit-text');
    const healthValue = document.getElementById('health-value');
    const bloodProgress = document.getElementById('blood-progress');
    const awakeningProgress = document.getElementById('awakening-progress');
    const timerValue = document.getElementById('timer-value');
    const endTitle = document.getElementById('end-title');
    const endMessage = document.getElementById('end-message');
    const spiritContainer = document.getElementById('spirit-container');
    const skillButtons = document.querySelectorAll('.skill');
    const gameArea = document.querySelector('.game-area');

    // 游戏状态变量
    let gameRunning = false;
    let timer = null;
    let timeLeft = 60;
    let health = 100;
    let dragonBlood = 0;
    let awakeningLevel = 0;
    let currentSpirit = '';
    let bloodBoiling = false;
    let comboStreak = 0;
    let score = 0;

    // 言灵数据库
    const spirits = {
        '君焰': { difficulty: 3, type: 'attack', effect: 'fire', cooldown: 10000 },
        '时间零': { difficulty: 2, type: 'defense', effect: 'ice', cooldown: 15000 },
        '镰鼬': { difficulty: 4, type: 'attack', effect: 'thunder', cooldown: 8000 },
        '戒律': { difficulty: 1, type: 'defense', effect: 'shield', cooldown: 12000 },
        '烛龙': { difficulty: 5, type: 'attack', effect: 'fire', cooldown: 20000 },
        '吸血镰': { difficulty: 4, type: 'attack', effect: 'thunder', cooldown: 12000 },
        '王权': { difficulty: 4, type: 'defense', effect: 'gravity', cooldown: 15000 },
        '青铜御座': { difficulty: 3, type: 'defense', effect: 'strength', cooldown: 10000 },
        '因陀罗': { difficulty: 4, type: 'attack', effect: 'lightning', cooldown: 14000 }
    };

    // 技能冷却状态
    const skillCooldowns = {
        '君焰': 0,
        '时间零': 0,
        '镰鼬': 0,
        '戒律': 0,
        '烛龙': 0,
        '吸血镰': 0,
        '王权': 0,
        '青铜御座': 0,
        '因陀罗': 0
    };

    // 初始化青铜柱和龙文背景
    function initBackgroundElements() {
        // 创建青铜柱
        const leftPillar = document.createElement('div');
        leftPillar.className = 'bronze-pillar left-pillar';
        gameArea.appendChild(leftPillar);

        const rightPillar = document.createElement('div');
        rightPillar.className = 'bronze-pillar right-pillar';
        gameArea.appendChild(rightPillar);

        // 创建龙文投影
        const rune1 = document.createElement('div');
        rune1.className = 'dragon-rune rune-top-left';
        rune1.textContent = '龙';
        gameArea.appendChild(rune1);

        const rune2 = document.createElement('div');
        rune2.className = 'dragon-rune rune-bottom-right';
        rune2.textContent = '言';
        gameArea.appendChild(rune2);
    }

    // 生成随机言灵
    function generateRandomSpirit() {
        // 根据龙王苏醒进度调整言灵难度
        const spiritList = Object.keys(spirits);
        let weightedList = [];

        // 随着苏醒进度增加，高难度言灵出现概率增加
        spiritList.forEach(spirit => {
            const spiritData = spirits[spirit];
            let weight = spiritData.difficulty;

            // 苏醒等级越高，高难度言灵权重越大
            if (awakeningLevel > 2) weight *= awakeningLevel - 1;
            if (awakeningLevel > 5) weight *= awakeningLevel - 3;

            // 添加到加权列表
            for (let i = 0; i < weight; i++) {
                weightedList.push(spirit);
            }
        });

        // 随机选择一个言灵
        const randomIndex = Math.floor(Math.random() * weightedList.length);
        currentSpirit = weightedList[randomIndex];
        spiritText.textContent = currentSpirit;

        // 添加言灵出现动画
        spiritText.style.opacity = '0';
        spiritText.style.transform = 'scale(0.5)';
        setTimeout(() => {
            spiritText.style.transition = 'all 0.5s ease';
            spiritText.style.opacity = '1';
            spiritText.style.transform = 'scale(1)';
        }, 10);

        return currentSpirit;
    }

    // 更新游戏状态面板
    function updateStatusPanel() {
        healthValue.textContent = health;
        bloodProgress.style.width = `${dragonBlood}%`;
        awakeningProgress.style.width = `${awakeningLevel * 10}%`;
        timerValue.textContent = timeLeft;

        // 龙血沸腾状态视觉反馈
        if (bloodBoiling) {
            gameArea.classList.add('blood-boiling');
        } else {
            gameArea.classList.remove('blood-boiling');
        }

        // 生命值过低警告
        if (health <= 30) {
            healthValue.style.color = 'var(--danger-color)';
            healthValue.classList.add('pulse-effect');
        } else {
            healthValue.style.color = '';
            healthValue.classList.remove('pulse-effect');
        }
    }

    // 处理言灵释放
    function castSpirit() {
        if (!gameRunning) return;

        const input = userInput.value.trim();
        const isCorrect = input === currentSpirit;

        if (isCorrect) {
            // 正确输入
            spiritText.classList.add('correct');
            comboStreak++;
            score += spirits[currentSpirit].difficulty * 10 * (bloodBoiling ? 2 : 1);

            // 增加龙血沸腾进度
            dragonBlood += spirits[currentSpirit].difficulty * 5;
            if (dragonBlood >= 100) {
                dragonBlood = 100;
                activateBloodBoiling();
            }

            // 延长时间
            timeLeft += spirits[currentSpirit].difficulty * 2;
            if (timeLeft > 60) timeLeft = 60; // 时间上限

            // 触发言灵特效
            triggerSpiritEffect(currentSpirit);

            // 检查是否是技能触发
            checkSkillActivation(currentSpirit);
        } else {
            // 错误输入
            spiritText.classList.add('incorrect');
            comboStreak = 0;
            health -= 10;

            if (health <= 0) {
                health = 0;
                endGame(false);
                return;
            }
        }

        // 更新状态面板
        updateStatusPanel();

        // 重置输入框
        userInput.value = '';

        // 移除动画类
        setTimeout(() => {
            spiritText.classList.remove('correct', 'incorrect');
            // 生成新言灵
            generateRandomSpirit();
        }, 500);

        // 增加龙王苏醒进度
        increaseAwakening();
    }

    // 触发言灵特效
    function triggerSpiritEffect(spiritName) {
        const spiritData = spirits[spiritName];
        const effectElement = document.createElement('div');

        switch (spiritData.effect) {
            case 'fire':
                effectElement.className = 'spirit-effect spirit-fire';
                break;
            case 'ice':
                effectElement.className = 'spirit-effect spirit-ice';
                // 时间零效果：暂停倒计时2秒
                pauseTimer(2000);
                break;
            case 'thunder':
                effectElement.className = 'spirit-effect spirit-thunder';
                // 镰鼬效果：清除当前和下一个言灵
                setTimeout(() => {
                    spiritText.classList.add('correct');
                    userInput.value = '';
                    setTimeout(() => {
                        spiritText.classList.remove('correct');
                        generateRandomSpirit();
                    }, 500);
                }, 1000);
                break;
            case 'gravity':
                effectElement.className = 'spirit-effect spirit-gravity';
                // 王权效果：降低龙王苏醒进度
                awakeningLevel -= 0.5;
                if (awakeningLevel < 0) awakeningLevel = 0;
                break;
            case 'strength':
                effectElement.className = 'spirit-effect spirit-strength';
                // 青铜御座效果：增加生命值
                health += 30;
                if (health > 100) health = 100;
                updateStatusPanel();
                break;
            case 'lightning':
                effectElement.className = 'spirit-effect spirit-lightning';
                // 因陀罗效果：同时攻击多个目标
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        spiritText.classList.add('correct');
                        userInput.value = '';
                        setTimeout(() => {
                            spiritText.classList.remove('correct');
                            generateRandomSpirit();
                            increaseAwakening();
                        }, 300);
                    }, i * 500);
                }
                break;
            case 'shield':
                // 戒律效果：增加生命值
                health += 20;
                if (health > 100) health = 100;
                updateStatusPanel();
                // 创建护盾效果
                const shieldElement = document.createElement('div');
                shieldElement.style.position = 'absolute';
                shieldElement.style.width = '100%';
                shieldElement.style.height = '100%';
                shieldElement.style.border = '2px solid rgba(0, 255, 255, 0.5)';
                shieldElement.style.borderRadius = '15px';
                shieldElement.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                shieldElement.style.animation = 'pulse 2s infinite';
                shieldElement.style.pointerEvents = 'none';
                gameArea.appendChild(shieldElement);
                setTimeout(() => {
                    shieldElement.remove();
                }, 3000);
                return;
        }

        spiritContainer.appendChild(effectElement);

        // 移除特效元素
        setTimeout(() => {
            effectElement.remove();
        }, 1000);
    }

    // 检查技能激活
    function checkSkillActivation(spiritName) {
        const spiritData = spirits[spiritName];
        const now = Date.now();

        // 如果技能不在冷却中
        if (skillCooldowns[spiritName] <= now) {
            // 激活技能效果
            if (spiritData.type === 'attack') {
                // 攻击技能：增加伤害
                const damageBonus = bloodBoiling ? 40 : 20;
                awakeningLevel += damageBonus / 100;
                if (awakeningLevel > 10) awakeningLevel = 10;
            } else if (spiritData.type === 'defense') {
                // 防御技能：减少伤害
                health += 10;
                if (health > 100) health = 100;
            }

            // 设置技能冷却
            skillCooldowns[spiritName] = now + spiritData.cooldown;
            updateSkillCooldowns();
        }
    }

    // 更新技能冷却显示
    function updateSkillCooldowns() {
        const now = Date.now();

        skillButtons.forEach(button => {
            const spiritName = button.dataset.skill;
            const cooldownEnd = skillCooldowns[spiritName];

            if (cooldownEnd > now) {
                // 技能冷却中
                button.classList.add('cooldown');
                const remaining = Math.ceil((cooldownEnd - now) / 1000);
                button.textContent = `${spiritName} (${remaining}s)`;
            } else {
                // 技能可用
                button.classList.remove('cooldown');
                button.textContent = spiritName;
            }
        });
    }

    // 激活龙血沸腾状态
    function activateBloodBoiling() {
        if (bloodBoiling) return;

        bloodBoiling = true;
        // 龙血沸腾状态持续10秒
        setTimeout(() => {
            bloodBoiling = false;
            dragonBlood = 0;
            updateStatusPanel();
        }, 10000);

        // 显示龙血沸腾提示
        const notification = document.createElement('div');
        notification.textContent = '龙血沸腾！言灵威力翻倍！';
        notification.style.position = 'absolute';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(230, 57, 70, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '100';
        notification.style.animation = 'pulse 1s infinite';
        gameArea.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 增加龙王苏醒进度
    function increaseAwakening() {
        awakeningLevel += 0.2;
        if (awakeningLevel >= 10) {
            endGame(false); // 龙王完全苏醒，游戏结束
            return;
        }

        // 随着苏醒进度增加，游戏难度提升
        if (awakeningLevel >= 3) {
            // 苏醒等级3级以上，开始扣血
            health -= 2;
            if (health <= 0) {
                health = 0;
                endGame(false);
            }
        }

        updateStatusPanel();
    }

    // 暂停计时器
    function pauseTimer(duration) {
        clearInterval(timer);
        setTimeout(() => {
            if (gameRunning) {
                timer = setInterval(updateTimer, 1000);
            }
        }, duration);
    }

    // 更新计时器
    function updateTimer() {
        timeLeft--;
        timerValue.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame(health > 0);
            return;
        }

        // 每10秒增加一次苏醒进度
        if (timeLeft % 10 === 0) {
            increaseAwakening();
        }

        // 更新技能冷却
        updateSkillCooldowns();
    }

    // 开始游戏
    function startGame() {
        // 重置游戏状态
        gameRunning = true;
        timeLeft = 60;
        health = 100;
        dragonBlood = 0;
        awakeningLevel = 0;
        comboStreak = 0;
        score = 0;
        bloodBoiling = false;

        // 清空技能冷却
        Object.keys(skillCooldowns).forEach(key => {
            skillCooldowns[key] = 0;
        });

        // 更新状态面板
        updateStatusPanel();

        // 生成第一个言灵
        generateRandomSpirit();

        // 隐藏开始菜单
        startMenu.style.display = 'none';

        // 启动计时器
        timer = setInterval(updateTimer, 1000);

        // 聚焦输入框
        userInput.focus();
    }

    // 结束游戏
    function endGame(victory) {
        gameRunning = false;
        clearInterval(timer);

        // 显示结束菜单
        endMenu.style.display = 'flex';
        if (victory) {
            endTitle.textContent = '恭喜胜利！';
            endMessage.textContent = `你成功阻止了龙王苏醒！最终得分：${score}，连击数：${comboStreak}`;
        } else {
            endTitle.textContent = '游戏结束';
            endMessage.textContent = `龙王已经苏醒... 你的得分：${score}，连击数：${comboStreak}`;
        }
    }

    // 事件监听器
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', () => {
        endMenu.style.display = 'none';
        startGame();
    });

    // 游戏规则按钮事件
    rulesBtn.addEventListener('click', () => {
        startMenu.style.display = 'none';
        rulesModal.style.display = 'flex';
    });

    closeRulesBtn.addEventListener('click', () => {
        rulesModal.style.display = 'none';
        startMenu.style.display = 'flex';
    });

    submitBtn.addEventListener('click', castSpirit);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            castSpirit();
        }
    });

    // 技能按钮点击事件
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!gameRunning) return;

            const spiritName = button.dataset.skill;
            const now = Date.now();

            if (skillCooldowns[spiritName] <= now) {
                // 直接使用该言灵
                userInput.value = spiritName;
                castSpirit();
            }
        });
    });

    // 初始化背景元素
    initBackgroundElements();
});